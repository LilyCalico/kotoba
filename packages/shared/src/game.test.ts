import { describe, expect, it } from "vitest";
import { MAX_INPUT_LENGTH, inputResultSchema, playerInputSchema } from "./game.js";

const GAME_ID = "0199a1f0-1b1c-7c3d-8e2f-4a5b6c7d8e9f";

describe("playerInputSchema", () => {
  it("前後の空白を落としてから受け取る", () => {
    const parsed = playerInputSchema.parse({
      gameId: GAME_ID,
      text: "  金曜日に限った言葉ですか？  ",
    });

    expect(parsed.text).toBe("金曜日に限った言葉ですか？");
  });

  it("上限を超える入力を弾く", () => {
    const result = playerInputSchema.safeParse({
      gameId: GAME_ID,
      text: "あ".repeat(MAX_INPUT_LENGTH + 1),
    });

    expect(result.success).toBe(false);
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
