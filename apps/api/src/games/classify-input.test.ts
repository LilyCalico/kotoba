import { describe, expect, it } from "vitest";
import { words } from "../prisma/seed/words.js";
import { classifyInput } from "./classify-input.js";

const lagom = words.find((word) => word.id === "lagom");
if (!lagom) throw new Error("lagom が見つからない");

describe("classifyInput", () => {
  it("正規化マッチで正解なら、正解の解答にする", () => {
    for (const text of ["Lagom", "lagom", "ラーゴム", "ラゴム"]) {
      expect(classifyInput(lagom, text), text).toEqual({ kind: "answer", correct: true });
    }
  });

  it("問いの形をとる入力は質問にし、回答は unclear にする", () => {
    for (const text of [
      "Is it a feeling?",
      "is it used every day",
      "What does it mean",
      "Vad betyder det",
      "日常で使う言葉ですか",
      "食べ物？",
    ]) {
      expect(classifyInput(lagom, text), text).toEqual({ kind: "question", verdict: "unclear" });
    }
  });

  it("それ以外は誤答にする", () => {
    for (const text of ["fika", "フィーカ", "something cozy"]) {
      expect(classifyInput(lagom, text), text).toEqual({ kind: "answer", correct: false });
    }
  });
});
