import { ApiError as GeminiApiError, type GenerateContentParameters } from "@google/genai";
import { describe, expect, it } from "vitest";
import { ApiError } from "../common/api-error.js";
import { words } from "../prisma/seed/words.js";
import {
  DEFAULT_RETRY_AFTER_SECONDS,
  GeminiInputJudge,
  type GenerateContent,
  MAX_ATTEMPTS,
  UnavailableInputJudge,
  parseJudgement,
  rateLimitRetryAfter,
  secondsUntilPacificMidnight,
} from "./gemini-input-judge.js";
import type { JudgeInput } from "./input-judge.js";

const lagom = words.find((word) => word.id === "lagom");
if (!lagom) throw new Error("lagom が見つからない");

const input: JudgeInput = {
  word: lagom,
  history: [{ text: "Is it food?", result: { kind: "question", verdict: "no" } }],
  text: "Is it about balance?",
};

/** 呼び出しを記録し、`responses` を順に返す。`Error` は例外として投げる。 */
function fakeGenerate(...responses: Array<string | Error>) {
  const calls: GenerateContentParameters[] = [];
  const generate: GenerateContent = async (params) => {
    calls.push(params);
    const response = responses[calls.length - 1];
    if (response === undefined) throw new Error("想定より多く呼ばれた");
    if (response instanceof Error) throw response;
    return { text: response };
  };
  return { generate, calls };
}

function judgeWith(generate: GenerateContent, timeoutMs?: number) {
  return new GeminiInputJudge(generate, { model: "test-model", timeoutMs });
}

async function errorOf(promise: Promise<unknown>): Promise<ApiError> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(ApiError);
  return error as ApiError;
}

async function codeOf(promise: Promise<unknown>): Promise<string | undefined> {
  return (await errorOf(promise)).code;
}

/** Gemini が上限で断ったときに SDK が投げる例外。`details` は応答の `error.details` に入る。 */
function rateLimitError(details: unknown[]): GeminiApiError {
  const body = { error: { code: 429, message: "quota exceeded", status: "RESOURCE_EXHAUSTED", details } };
  return new GeminiApiError({ message: JSON.stringify(body), status: 429 });
}

function quotaFailure(quotaId: string) {
  return {
    "@type": "type.googleapis.com/google.rpc.QuotaFailure",
    violations: [
      {
        quotaMetric: "generativelanguage.googleapis.com/generate_content_free_tier_requests",
        quotaId,
      },
    ],
  };
}

function retryInfo(retryDelay: string) {
  return { "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay };
}

/** 太平洋夏時間（UTC-7）の 2026-10-29 17:00:00。0 時まで 7 時間。 */
const PACIFIC_FIVE_PM = new Date("2026-10-30T00:00:00Z");

describe("parseJudgement", () => {
  it("質問には verdict を添えて返す", () => {
    expect(parseJudgement('{"kind":"question","verdict":"yes","correct":null}')).toEqual({
      kind: "question",
      verdict: "yes",
    });
  });

  it("解答には正誤を添え、verdict を捨てる", () => {
    expect(parseJudgement('{"kind":"answer","verdict":null,"correct":true}')).toEqual({
      kind: "answer",
      correct: true,
    });
    expect(parseJudgement('{"kind":"answer","verdict":"yes","correct":false}')).toEqual({
      kind: "answer",
      correct: false,
    });
  });

  it("質問と対応外言語では correct を捨てる", () => {
    expect(parseJudgement('{"kind":"question","verdict":"no","correct":true}')).toEqual({
      kind: "question",
      verdict: "no",
    });
    expect(parseJudgement('{"kind":"unsupported_language","verdict":"yes","correct":true}')).toEqual({
      kind: "unsupported_language",
    });
  });

  it("形が合わない応答は例外にする", () => {
    for (const text of [
      undefined,
      "not json",
      '{"kind":"question","verdict":null,"correct":null}',
      '{"kind":"question","verdict":"maybe","correct":null}',
      '{"kind":"hint","verdict":null,"correct":null}',
      '{"kind":"answer","verdict":null,"correct":null}',
      '{"kind":"answer","verdict":null,"correct":"yes"}',
      '{"kind":"answer","verdict":null}',
    ]) {
      expect(() => parseJudgement(text), String(text)).toThrow();
    }
  });
});

describe("GeminiInputJudge", () => {
  it("Gemini の分類を返す", async () => {
    const { generate } = fakeGenerate('{"kind":"question","verdict":"yes","correct":null}');

    await expect(judgeWith(generate).judge(input)).resolves.toEqual({
      kind: "question",
      verdict: "yes",
    });
  });

  it("モデル・プロンプト・structured output の指定を渡す", async () => {
    const { generate, calls } = fakeGenerate('{"kind":"answer","verdict":null,"correct":false}');

    await judgeWith(generate).judge(input);

    const [call] = calls;
    expect(call?.model).toBe("test-model");
    expect(call?.contents).toBe(input.text);
    expect(call?.config?.systemInstruction).toContain('"Is it food?" → question, answered "no"');
    expect(call?.config?.responseMimeType).toBe("application/json");
    expect(call?.config?.temperature).toBe(0);
    expect(call?.config?.responseJsonSchema).toMatchObject({
      type: "object",
      required: ["kind", "verdict", "correct"],
      properties: {
        kind: { enum: ["question", "answer", "unsupported_language"] },
        verdict: {
          anyOf: [
            { enum: ["yes", "no", "unclear", "irrelevant", "not_a_question"] },
            { type: "null" },
          ],
        },
        correct: { type: ["boolean", "null"] },
      },
    });
    expect(call?.config?.responseJsonSchema).not.toHaveProperty("$schema");
  });

  it("失敗は 1 回だけ再試行する", async () => {
    for (const first of [
      new Error("503 Service Unavailable"),
      "not json",
      '{"kind":"question","verdict":null,"correct":null}',
      '{"kind":"answer","verdict":null,"correct":null}',
    ]) {
      const { generate, calls } = fakeGenerate(first, '{"kind":"question","verdict":"no","correct":null}');

      await expect(judgeWith(generate).judge(input)).resolves.toEqual({
        kind: "question",
        verdict: "no",
      });
      expect(calls).toHaveLength(2);
    }
  });

  it("2 回とも失敗したら ai_unavailable にする", async () => {
    const { generate, calls } = fakeGenerate(new Error("500"), "not json");

    expect(await codeOf(judgeWith(generate).judge(input))).toBe("ai_unavailable");
    expect(calls).toHaveLength(MAX_ATTEMPTS);
  });

  it("上限で断られたら再試行せず、待つ秒数を添えて ai_rate_limited にする", async () => {
    const { generate, calls } = fakeGenerate(
      rateLimitError([
        quotaFailure("GenerateRequestsPerMinutePerProjectPerModel-FreeTier"),
        retryInfo("12s"),
      ]),
    );

    const error = await errorOf(
      new GeminiInputJudge(generate, { model: "test-model", now: () => PACIFIC_FIVE_PM }).judge(input),
    );
    expect(error).toMatchObject({ code: "ai_rate_limited", retryAfterSeconds: 12 });
    expect(calls).toHaveLength(1);
  });

  it("時間内に応答がなければ打ち切って再試行する", async () => {
    let calls = 0;
    const generate: GenerateContent = (params) => {
      calls++;
      if (calls === 2) return Promise.resolve({ text: '{"kind":"answer","verdict":null,"correct":false}' });
      // 打ち切りの合図が来るまで応答しない。
      return new Promise((_, reject) => {
        params.config?.abortSignal?.addEventListener("abort", () => reject(new Error("aborted")));
      });
    };

    await expect(judgeWith(generate, 20).judge(input)).resolves.toEqual({ kind: "answer", correct: false });
    expect(calls).toBe(2);
  });
});

describe("rateLimitRetryAfter", () => {
  it("1 分あたりの上限は retryDelay を切り上げた秒数にする", () => {
    const error = rateLimitError([
      quotaFailure("GenerateRequestsPerMinutePerProjectPerModel-FreeTier"),
      retryInfo("36.4s"),
    ]);

    expect(rateLimitRetryAfter(error, PACIFIC_FIVE_PM)).toBe(37);
  });

  it("1 日あたりの上限は太平洋時間の 0 時までの秒数にする", () => {
    const error = rateLimitError([
      quotaFailure("GenerateRequestsPerDayPerProjectPerModel-FreeTier"),
      retryInfo("20s"),
    ]);

    expect(rateLimitRetryAfter(error, PACIFIC_FIVE_PM)).toBe(7 * 3600);
  });

  it("上限の種類も待ち時間も読めなければ既定の秒数にする", () => {
    for (const error of [
      rateLimitError([]),
      rateLimitError([retryInfo("soon")]),
      new GeminiApiError({ message: "Too Many Requests", status: 429 }),
    ]) {
      expect(rateLimitRetryAfter(error, PACIFIC_FIVE_PM)).toBe(DEFAULT_RETRY_AFTER_SECONDS);
    }
  });

  it("上限以外の失敗には undefined を返す", () => {
    for (const error of [
      new GeminiApiError({ message: "{}", status: 503 }),
      new Error("429"),
      "aborted",
    ]) {
      expect(rateLimitRetryAfter(error, PACIFIC_FIVE_PM)).toBeUndefined();
    }
  });
});

describe("secondsUntilPacificMidnight", () => {
  it("太平洋時間の 0 時までの秒数を返す", () => {
    // 太平洋標準時（UTC-8）の 2026-12-01 23:59:30。
    expect(secondsUntilPacificMidnight(new Date("2026-12-02T07:59:30Z"))).toBe(30);
    // 太平洋標準時の 2026-12-01 0:00:00 ちょうどは、次の 0 時まで丸 1 日。
    expect(secondsUntilPacificMidnight(new Date("2026-12-01T08:00:00Z"))).toBe(86_400);
  });
});

describe("UnavailableInputJudge", () => {
  it("常に ai_unavailable にする", async () => {
    expect(await codeOf(new UnavailableInputJudge().judge())).toBe("ai_unavailable");
  });
});
