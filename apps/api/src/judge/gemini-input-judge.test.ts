import type { GenerateContentParameters } from "@google/genai";
import { describe, expect, it } from "vitest";
import { ApiError } from "../common/api-error.js";
import { words } from "../prisma/seed/words.js";
import {
  GeminiInputJudge,
  type GenerateContent,
  MAX_ATTEMPTS,
  UnavailableInputJudge,
  parseJudgement,
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

async function codeOf(promise: Promise<unknown>): Promise<string | undefined> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(ApiError);
  return (error as ApiError).code;
}

describe("parseJudgement", () => {
  it("質問には verdict を添えて返す", () => {
    expect(parseJudgement('{"kind":"question","verdict":"yes"}')).toEqual({
      kind: "question",
      verdict: "yes",
    });
  });

  it("解答と対応外言語では verdict を捨てる", () => {
    expect(parseJudgement('{"kind":"answer","verdict":null}')).toEqual({ kind: "answer" });
    expect(parseJudgement('{"kind":"unsupported_language","verdict":"yes"}')).toEqual({
      kind: "unsupported_language",
    });
  });

  it("形が合わない応答は例外にする", () => {
    for (const text of [
      undefined,
      "not json",
      '{"kind":"question","verdict":null}',
      '{"kind":"question","verdict":"maybe"}',
      '{"kind":"hint","verdict":null}',
      '{"kind":"answer"}',
    ]) {
      expect(() => parseJudgement(text), String(text)).toThrow();
    }
  });
});

describe("GeminiInputJudge", () => {
  it("Gemini の分類を返す", async () => {
    const { generate } = fakeGenerate('{"kind":"question","verdict":"yes"}');

    await expect(judgeWith(generate).judge(input)).resolves.toEqual({
      kind: "question",
      verdict: "yes",
    });
  });

  it("モデル・プロンプト・structured output の指定を渡す", async () => {
    const { generate, calls } = fakeGenerate('{"kind":"answer","verdict":null}');

    await judgeWith(generate).judge(input);

    const [call] = calls;
    expect(call?.model).toBe("test-model");
    expect(call?.contents).toBe(input.text);
    expect(call?.config?.systemInstruction).toContain('"Is it food?" → question, answered "no"');
    expect(call?.config?.responseMimeType).toBe("application/json");
    expect(call?.config?.temperature).toBe(0);
    expect(call?.config?.responseJsonSchema).toMatchObject({
      type: "object",
      required: ["kind", "verdict"],
      properties: {
        kind: { enum: ["question", "answer", "unsupported_language"] },
        verdict: {
          anyOf: [
            { enum: ["yes", "no", "unclear", "irrelevant", "not_a_question"] },
            { type: "null" },
          ],
        },
      },
    });
    expect(call?.config?.responseJsonSchema).not.toHaveProperty("$schema");
  });

  it("失敗は 1 回だけ再試行する", async () => {
    for (const first of [
      new Error("503 Service Unavailable"),
      "not json",
      '{"kind":"question","verdict":null}',
    ]) {
      const { generate, calls } = fakeGenerate(first, '{"kind":"question","verdict":"no"}');

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

  it("時間内に応答がなければ打ち切って再試行する", async () => {
    let calls = 0;
    const generate: GenerateContent = (params) => {
      calls++;
      if (calls === 2) return Promise.resolve({ text: '{"kind":"answer","verdict":null}' });
      // 打ち切りの合図が来るまで応答しない。
      return new Promise((_, reject) => {
        params.config?.abortSignal?.addEventListener("abort", () => reject(new Error("aborted")));
      });
    };

    await expect(judgeWith(generate, 20).judge(input)).resolves.toEqual({ kind: "answer" });
    expect(calls).toBe(2);
  });
});

describe("UnavailableInputJudge", () => {
  it("常に ai_unavailable にする", async () => {
    expect(await codeOf(new UnavailableInputJudge().judge())).toBe("ai_unavailable");
  });
});
