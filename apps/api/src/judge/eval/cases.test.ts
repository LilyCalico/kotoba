import { isAcceptedAnswer } from "@kotoba/shared";
import { describe, expect, it } from "vitest";
import { words } from "../../prisma/seed/words.js";
import { EVAL_CASES, modeOf } from "./cases.js";

describe("EVAL_CASES", () => {
  it("どのケースの単語も seed にある", () => {
    const ids = new Set(words.map(({ id }) => id));

    for (const { wordId } of EVAL_CASES) expect(ids.has(wordId), wordId).toBe(true);
  });

  it("救済のケースの入力は、コードの正規化マッチでは正解にならない", () => {
    for (const { category, wordId, input } of EVAL_CASES) {
      if (category !== "rescue") continue;
      const word = words.find(({ id }) => id === wordId);
      if (!word) throw new Error(`${wordId} が seed にない`);
      expect(isAcceptedAnswer(word, input), `${wordId} / ${input}`).toBe(false);
    }
  });

  it("どの種類にもケースがあり、救済には正解と誤答の両方がある", () => {
    const categories = new Set(EVAL_CASES.map(({ category }) => category));
    expect([...categories].sort()).toEqual(["classification", "injection", "rescue", "verdict"]);

    const rescue = EVAL_CASES.filter(({ category }) => category === "rescue");
    expect(rescue.some(({ expect }) => "correct" in expect && expect.correct === true)).toBe(true);
    expect(rescue.some(({ expect }) => "correct" in expect && expect.correct === false)).toBe(true);
  });

  it("meaning_ で始まる種類は意味当て、それ以外は単語当てで判定する", () => {
    expect(modeOf("meaning_judge")).toBe("guess_meaning");
    expect(modeOf("meaning_injection")).toBe("guess_meaning");
    expect(modeOf("rescue")).toBe("guess_word");
  });

  it("同じ単語・入力・履歴のケースを重ねない", () => {
    const keys = EVAL_CASES.map(({ category, wordId, input, history }) =>
      JSON.stringify([category, wordId, input, history ?? []]),
    );

    expect(new Set(keys).size).toBe(keys.length);
  });
});
