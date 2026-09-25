import { MAX_INPUT_LENGTH } from "@kotoba/shared";
import { describe, expect, it } from "vitest";

import { findWordById, rulesFor } from "./fixtures";
import {
  isQuestion,
  lookupVerdict,
  remainingLength,
  resolveInput,
  validateInput,
} from "./input";

const fredagsmys = findWordById("fredagsmys")!;
const rules = rulesFor("fredagsmys");

describe("validateInput", () => {
  it("空白だけの入力を空として弾く", () => {
    expect(validateInput("   ")).toBe("empty");
  });

  it("200 字までを通し、超えた分を弾く", () => {
    expect(validateInput("a".repeat(MAX_INPUT_LENGTH))).toBeNull();
    expect(validateInput("a".repeat(MAX_INPUT_LENGTH + 1))).toBe("too-long");
  });
});

describe("remainingLength", () => {
  it("未入力では上限そのものを返す", () => {
    expect(remainingLength("")).toBe(MAX_INPUT_LENGTH);
    expect(remainingLength("hello")).toBe(MAX_INPUT_LENGTH - 5);
  });
});

describe("isQuestion", () => {
  it("疑問符で終わる入力を質問とみなす", () => {
    expect(isQuestion("Is it a feeling?")).toBe(true);
    expect(isQuestion("これは感情ですか？")).toBe(true);
  });

  it("疑問符がなくても疑問語で始まれば質問とみなす", () => {
    expect(isQuestion("Does it happen at night")).toBe(true);
  });

  it("平叙文は質問とみなさない", () => {
    expect(isQuestion("fredagsmys")).toBe(false);
  });
});

describe("lookupVerdict", () => {
  it("対応表のキーワードから 3 値を引く", () => {
    expect(lookupVerdict(rules, "Does it happen on a Friday?")).toBe("yes");
    expect(lookupVerdict(rules, "Is it something you see in nature?")).toBe(
      "no",
    );
    expect(lookupVerdict(rules, "Is the word expensive to say?")).toBe(
      "irrelevant",
    );
  });

  it("どのルールにも当たらない質問は unclear になる", () => {
    expect(lookupVerdict(rules, "Is it from the north?")).toBe("unclear");
  });
});

describe("resolveInput", () => {
  it("正解の表記は解答として正解になる", () => {
    expect(resolveInput(fredagsmys, rules, "Fredagsmys")).toEqual({
      kind: "answer",
      correct: true,
    });
    expect(resolveInput(fredagsmys, rules, "フレーダグスミュース")).toEqual({
      kind: "answer",
      correct: true,
    });
  });

  it("質問は対応表に回る", () => {
    expect(resolveInput(fredagsmys, rules, "Is it about a sofa?")).toEqual({
      kind: "question",
      verdict: "yes",
    });
  });

  it("短い平叙文は誤答として扱う", () => {
    expect(resolveInput(fredagsmys, rules, "smultronstalle")).toEqual({
      kind: "answer",
      correct: false,
    });
  });

  it("質問の形をとらない長文は not_a_question になる", () => {
    expect(
      resolveInput(
        fredagsmys,
        rules,
        "I think this word has something to do with the weekend",
      ),
    ).toEqual({ kind: "question", verdict: "not_a_question" });
  });

  it("解答の判定は質問の判定より先に効く", () => {
    expect(resolveInput(fredagsmys, rules, "  fredagsmys  ")).toEqual({
      kind: "answer",
      correct: true,
    });
  });
});
