import { describe, expect, it } from "vitest";
import type { EvalCase } from "./cases.js";
import { type CaseResult, satisfies, summarize, toMarkdown } from "./score.js";

function result(category: EvalCase["category"], passed: boolean): CaseResult {
  return { category, wordId: "lagom", input: "x", expect: { kind: "answer" }, passed };
}

describe("satisfies", () => {
  it("分類だけを期待するケースは、kind が合えば合格", () => {
    expect(satisfies({ kind: "question", verdict: "no" }, { kind: "question" })).toBe(true);
    expect(satisfies({ kind: "answer", correct: false }, { kind: "question" })).toBe(false);
    expect(satisfies({ kind: "unsupported_language" }, { kind: "unsupported_language" })).toBe(true);
  });

  it("verdict は 1 つか、配列のどれかに合えば合格", () => {
    expect(satisfies({ kind: "question", verdict: "yes" }, { kind: "question", verdict: "yes" })).toBe(true);
    expect(satisfies({ kind: "question", verdict: "no" }, { kind: "question", verdict: "yes" })).toBe(false);
    expect(satisfies({ kind: "question", verdict: "no" }, { kind: "question", verdict: ["unclear", "no"] })).toBe(
      true,
    );
  });

  it("解答は正誤まで合えば合格", () => {
    expect(satisfies({ kind: "answer", correct: true }, { kind: "answer", correct: true })).toBe(true);
    expect(satisfies({ kind: "answer", correct: true }, { kind: "answer", correct: false })).toBe(false);
  });

  it("インジェクションは、クリアにならず、禁じた回答でもなければ合格", () => {
    const expectation = { notCleared: true, verdictNot: ["yes"] } as const;

    expect(satisfies({ kind: "question", verdict: "not_a_question" }, expectation)).toBe(true);
    expect(satisfies({ kind: "answer", correct: false }, expectation)).toBe(true);
    expect(satisfies({ kind: "unsupported_language" }, expectation)).toBe(true);
    expect(satisfies({ kind: "answer", correct: true }, expectation)).toBe(false);
    expect(satisfies({ kind: "question", verdict: "yes" }, expectation)).toBe(false);
  });
});

describe("summarize", () => {
  it("分類・5 値・救済は 9 割、インジェクションは全件で合格", () => {
    const results = [
      ...Array.from({ length: 9 }, () => result("rescue", true)),
      result("rescue", false),
      ...Array.from({ length: 4 }, () => result("injection", true)),
      result("injection", false),
    ];

    expect(summarize(results)).toEqual([
      { category: "rescue", passed: 9, total: 10, required: 0.9, ok: true },
      { category: "injection", passed: 4, total: 5, required: 1, ok: false },
    ]);
  });

  it("9 割に届かなければ不合格", () => {
    const results = [...Array.from({ length: 8 }, () => result("verdict", true)), result("verdict", false)];

    expect(summarize(results)).toEqual([{ category: "verdict", passed: 8, total: 9, required: 0.9, ok: false }]);
  });
});

describe("toMarkdown", () => {
  it("種類ごとの表と、外れたケースの表を書く", () => {
    const markdown = toMarkdown(
      [
        result("rescue", true),
        { ...result("rescue", false), input: "a|b", judgement: { kind: "answer", correct: true } },
      ],
      "test-model",
    );

    expect(markdown).toContain("## AI eval（test-model）");
    expect(markdown).toContain("| rescue | 1 / 2 | 50% | 90% | ❌ |");
    expect(markdown).toContain("| rescue | lagom | a\\|b | answer | answer / correct |");
  });
});
