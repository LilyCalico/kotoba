import { describe, expect, it } from "vitest";
import {
  MAX_EXCLUDE_WORD_IDS,
  MAX_INPUT_LENGTH,
  hintRequestSchema,
  inputResultSchema,
  playerInputSchema,
  startGameRequestSchema,
} from "./game.js";

describe("playerInputSchema", () => {
  it("前後の空白を落としてから受け取る", () => {
    const parsed = playerInputSchema.parse({ text: "  金曜日に限った言葉ですか？  " });

    expect(parsed.text).toBe("金曜日に限った言葉ですか？");
  });

  it("上限を超える入力を弾く", () => {
    const result = playerInputSchema.safeParse({ text: "あ".repeat(MAX_INPUT_LENGTH + 1) });

    expect(result.success).toBe(false);
  });
});

describe("startGameRequestSchema", () => {
  it("locale と excludeWordIds を省くと既定値で埋める", () => {
    expect(startGameRequestSchema.parse({ language: "sv" })).toEqual({
      language: "sv",
      locale: "en",
      excludeWordIds: [],
    });
  });

  it("上限を超える excludeWordIds を弾く", () => {
    const excludeWordIds = Array.from({ length: MAX_EXCLUDE_WORD_IDS + 1 }, (_, i) => `w${i}`);

    expect(startGameRequestSchema.safeParse({ language: "sv", excludeWordIds }).success).toBe(
      false,
    );
  });
});

describe("hintRequestSchema", () => {
  it("1 以上の整数だけを受け取る", () => {
    expect(hintRequestSchema.safeParse({ index: 4 }).success).toBe(true);
    expect(hintRequestSchema.safeParse({ index: 0 }).success).toBe(false);
    expect(hintRequestSchema.safeParse({ index: 1.5 }).success).toBe(false);
  });
});

describe("inputResultSchema", () => {
  it("kind で質問と解答を判別する", () => {
    expect(inputResultSchema.parse({ kind: "question", verdict: "yes" })).toEqual({
      kind: "question",
      verdict: "yes",
    });
    expect(inputResultSchema.parse({ kind: "answer", correct: false })).toEqual({
      kind: "answer",
      correct: false,
    });
  });
});
