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
  it("locale・mode・excludeWordIds を省くと既定値で埋める", () => {
    expect(startGameRequestSchema.parse({ language: "sv" })).toEqual({
      language: "sv",
      locale: "en",
      mode: "guess_word",
      excludeWordIds: [],
    });
  });

  it("意味当ては locale が ja のときだけ受ける", () => {
    const meaning = { language: "sv", mode: "guess_meaning" };

    expect(startGameRequestSchema.safeParse({ ...meaning, locale: "ja" }).success).toBe(true);
    expect(startGameRequestSchema.safeParse({ ...meaning, locale: "en" }).success).toBe(false);
    expect(startGameRequestSchema.safeParse(meaning).success).toBe(false);
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
  it("kind で質問・解答・対応外言語を判別する", () => {
    expect(inputResultSchema.parse({ kind: "question", verdict: "yes" })).toEqual({
      kind: "question",
      verdict: "yes",
    });
    expect(inputResultSchema.parse({ kind: "answer", correct: false })).toEqual({
      kind: "answer",
      correct: false,
    });
    expect(inputResultSchema.parse({ kind: "unsupported_language" })).toEqual({
      kind: "unsupported_language",
    });
  });

  it("verdict は 5 値だけを受け付ける", () => {
    expect(inputResultSchema.safeParse({ kind: "question", verdict: "maybe" }).success).toBe(false);
  });
});
