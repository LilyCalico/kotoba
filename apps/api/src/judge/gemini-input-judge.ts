import { verdictSchema } from "@kotoba/shared";
import { GoogleGenAI, type GenerateContentParameters } from "@google/genai";
import { Logger } from "@nestjs/common";
import { z } from "zod";
import { ApiError } from "../common/api-error.js";
import type { InputJudge, JudgeInput, Judgement } from "./input-judge.js";
import { buildJudgePrompt } from "./judge-prompt.js";

/** 1 回の判定で Gemini を呼ぶ回数の上限。最初の 1 回と、失敗したときの再試行 1 回。 */
export const MAX_ATTEMPTS = 2;

/** 1 回の呼び出しを打ち切るまでの時間。 */
export const DEFAULT_TIMEOUT_MS = 10_000;

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

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Gemini で入力を分類する `InputJudge`。
 * エラー・タイムアウト・スキーマに合わない応答は 1 回だけ再試行し、2 回とも失敗したら `ai_unavailable` にする。
 */
export class GeminiInputJudge implements InputJudge {
  private readonly logger = new Logger(GeminiInputJudge.name);

  constructor(
    private readonly generate: GenerateContent,
    private readonly options: { model: string; timeoutMs?: number },
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
