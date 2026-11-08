import { isAcceptedAnswer } from "@kotoba/shared";
import { describe, expect, it } from "vitest";
import { words } from "../../prisma/seed/words.js";
import { EVAL_CASES, modeOf } from "./cases.js";
import { PASS_RATE } from "./score.js";

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

  it("意味の正誤のケースの入力は、判定基準の例と重ならない", () => {
    for (const { category, wordId, input } of EVAL_CASES) {
      if (category !== "meaning_judge") continue;
      const word = words.find(({ id }) => id === wordId);
      if (!word) throw new Error(`${wordId} が seed にない`);
      const examples = [...word.meaning.accepts, ...word.meaning.rejects].map((example) => example.toLowerCase());
      expect(examples, `${wordId} / ${input}`).not.toContain(input.toLowerCase());
    }
  });

  it("どの種類にもケースがあり、救済と意味の正誤には正解と誤答の両方がある", () => {
    const categories = new Set(EVAL_CASES.map(({ category }) => category));
    expect([...categories].sort()).toEqual(Object.keys(PASS_RATE).sort());

    for (const category of ["rescue", "meaning_judge"]) {
      const ofCategory = EVAL_CASES.filter((testCase) => testCase.category === category);
      expect(ofCategory.some(({ expect }) => "correct" in expect && expect.correct === true), category).toBe(true);
      expect(ofCategory.some(({ expect }) => "correct" in expect && expect.correct === false), category).toBe(true);
    }
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
