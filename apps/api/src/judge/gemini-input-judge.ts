import { verdictSchema } from "@kotoba/shared";
import {
  ApiError as GeminiApiError,
  GoogleGenAI,
  type GenerateContentParameters,
} from "@google/genai";
import { Logger } from "@nestjs/common";
import { z } from "zod";
import { ApiError } from "../common/api-error.js";
import type { InputJudge, JudgeInput, Judgement } from "./input-judge.js";
import { buildJudgePrompt } from "./judge-prompt.js";

/** 1 回の判定で Gemini を呼ぶ回数の上限。最初の 1 回と、失敗したときの再試行 1 回。 */
export const MAX_ATTEMPTS = 2;

/** 1 回の呼び出しを打ち切るまでの時間。 */
export const DEFAULT_TIMEOUT_MS = 10_000;

/** 上限に達したが、上限の種類も戻るまでの秒数も応答から読めないときの待ち時間。1 分あたりの上限が戻る最長の時間に合わせる。 */
export const DEFAULT_RETRY_AFTER_SECONDS = 60;

/** Gemini に返させる形。`verdict` は `kind` が `question` のときだけ値を持つ。 */
const judgementResponseSchema = z.object({
  kind: z.enum(["question", "answer", "unsupported_language"]),
  verdict: verdictSchema.nullable(),
});

/**
 * structured output に渡す JSON Schema。Gemini が対応しない `$schema` を除く。
 * `kind` と `verdict` を enum に縛り、自由文を返させない。
 */
const { $schema: _schema, ...RESPONSE_JSON_SCHEMA } = z.toJSONSchema(judgementResponseSchema);

/** Gemini の `generateContent`。テストでは決まった応答を返す関数に差し替える。 */
export type GenerateContent = (
  params: GenerateContentParameters,
) => Promise<{ text?: string | undefined }>;

/** 応答の本文を `Judgement` にする。JSON として読めない・形が合わない応答は例外にし、再試行に回す。 */
export function parseJudgement(text: string | undefined): Judgement {
  if (text === undefined) throw new Error("応答に本文がない");

  const { kind, verdict } = judgementResponseSchema.parse(JSON.parse(text));
  if (kind !== "question") return { kind };
  if (verdict === null) throw new Error("質問なのに verdict がない");
  return { kind, verdict };
}

/**
 * Gemini が上限で断った応答の本文のうち、待ち時間を決めるのに使う部分。
 * `details` には `QuotaFailure`（どの上限に達したか）と `RetryInfo`（戻るまでの時間）が入る。
 */
const rateLimitBodySchema = z.object({
  error: z.object({
    details: z.array(
      z.looseObject({
        retryDelay: z.string().optional(),
        violations: z.array(z.looseObject({ quotaId: z.string().optional() })).optional(),
      }),
    ),
  }),
});

/** `RetryInfo.retryDelay`（`"37s"` や `"1.5s"` の形）を、切り上げた秒数にする。 */
function parseRetryDelay(delay: string | undefined): number | undefined {
  const match = delay?.match(/^(\d+(?:\.\d+)?)s$/);
  return match ? Math.ceil(Number(match[1])) : undefined;
}

/**
 * 無料枠の 1 日あたりの上限が戻る、太平洋時間の 0 時までの秒数。
 * 1 日を 24 時間として数えるため、夏時間が切り替わる日は 1 時間ずれる。画面は「およそ N 時間」としか出さないため許容する。
 */
export function secondsUntilPacificMidnight(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hourCycle: "h23",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((entry) => entry.type === type)?.value ?? 0);
  return 86_400 - (part("hour") * 3600 + part("minute") * 60 + part("second"));
}

/**
 * Gemini が無料枠の上限で断ったときの、上限が戻るまでの秒数。上限で断った失敗でなければ `undefined` を返す。
 * SDK は応答の本文を JSON のまま `message` に載せる。
 *
 * - 1 日あたりの上限（`quotaId` が `PerDay` を含む）: 太平洋時間の 0 時までの秒数
 * - それ以外: `RetryInfo.retryDelay` の秒数
 * - どちらも読めない: `DEFAULT_RETRY_AFTER_SECONDS`
 */
export function rateLimitRetryAfter(error: unknown, now: Date): number | undefined {
  if (!(error instanceof GeminiApiError) || error.status !== 429) return undefined;

  let details: z.infer<typeof rateLimitBodySchema>["error"]["details"] = [];
  try {
    const body = rateLimitBodySchema.safeParse(JSON.parse(error.message));
    if (body.success) details = body.data.error.details;
  } catch {
    // 本文が JSON でなければ、上限の種類も待ち時間も読めないものとして扱う。
  }

  const daily = details.some((detail) =>
    detail.violations?.some((violation) => violation.quotaId?.includes("PerDay")),
  );
  if (daily) return secondsUntilPacificMidnight(now);

  for (const detail of details) {
    const seconds = parseRetryDelay(detail.retryDelay);
    if (seconds !== undefined) return seconds;
  }
  return DEFAULT_RETRY_AFTER_SECONDS;
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Gemini で入力を分類する `InputJudge`。
 * エラー・タイムアウト・スキーマに合わない応答は 1 回だけ再試行し、2 回とも失敗したら `ai_unavailable` にする。
 * 無料枠の上限で断られたときは、再試行しても通らず枠をさらに使うため、すぐに `ai_rate_limited` にする。
 */
export class GeminiInputJudge implements InputJudge {
  private readonly logger = new Logger(GeminiInputJudge.name);

  constructor(
    private readonly generate: GenerateContent,
    private readonly options: { model: string; timeoutMs?: number; now?: () => Date },
  ) {}

  async judge(input: JudgeInput): Promise<Judgement> {
    const { systemInstruction, contents } = buildJudgePrompt(input);
    const timeoutMs = this.options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const response = await this.generate({
          model: this.options.model,
          contents,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseJsonSchema: RESPONSE_JSON_SCHEMA,
            temperature: 0,
            abortSignal: AbortSignal.timeout(timeoutMs),
          },
        });
        return parseJudgement(response.text);
      } catch (error) {
        const retryAfterSeconds = rateLimitRetryAfter(error, this.options.now?.() ?? new Date());
        if (retryAfterSeconds !== undefined) {
          this.logger.warn(`Gemini の無料枠の上限に達した。${retryAfterSeconds} 秒後に戻る: ${describe(error)}`);
          throw new ApiError("ai_rate_limited", undefined, retryAfterSeconds);
        }
        // 失敗の内容には秘密の単語を含めない。応答の本文やプロンプトはログに出さない。
        this.logger.warn(`Gemini の判定に失敗した（${attempt}/${MAX_ATTEMPTS} 回目）: ${describe(error)}`);
      }
    }
    throw new ApiError("ai_unavailable");
  }
}

/**
 * Gemini API を呼ぶ `GenerateContent` を作る。
 * 再試行は `GeminiInputJudge` が数えるため、SDK 側の自動リトライは切る。
 * `baseUrl` は E2E でスタブサーバーへ向けるときだけ渡す。
 */
export function createGenerateContent({
  apiKey,
  baseUrl,
}: {
  apiKey: string;
  baseUrl?: string | undefined;
}): GenerateContent {
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { ...(baseUrl ? { baseUrl } : {}), retryOptions: { attempts: 1 } },
  });
  return (params) => ai.models.generateContent(params);
}

/** `GEMINI_API_KEY` がないときの `InputJudge`。AI が要る入力はすべて `ai_unavailable` にする。 */
export class UnavailableInputJudge implements InputJudge {
  async judge(): Promise<Judgement> {
    throw new ApiError("ai_unavailable");
  }
}
