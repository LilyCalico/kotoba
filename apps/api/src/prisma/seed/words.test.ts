import { type UiLocale, isAcceptedAnswer, normalizeAnswer, uiLocaleSchema } from "@kotoba/shared";
import { describe, expect, it } from "vitest";
import { words } from "./words.js";

const locales: UiLocale[] = uiLocaleSchema.options;

describe("seed の単語", () => {
  it("スキーマを満たす単語を読み込む", () => {
    expect(words.length).toBeGreaterThan(0);
    expect(words.find((word) => word.id === "fika")?.word).toBe("Fika");
  });

  it("どの UI 言語でも teaser とヒントに答えを漏らさない", () => {
    for (const word of words) {
      const secrets = [word.word, word.reading, ...word.acceptedAnswers];

      for (const locale of locales) {
        const exposed = [word.teaser[locale], ...word.hints[locale]]
          .map(normalizeAnswer)
          .join("");

        for (const secret of secrets) {
          expect(exposed, `${word.id} の ${locale} の提示文が答えを含んでいる`).not.toContain(
            normalizeAnswer(secret),
          );
        }
      }
    }
  });

  it("別の単語の解答を正解にしない", () => {
    for (const word of words) {
      for (const other of words.filter((candidate) => candidate.id !== word.id)) {
        for (const spelling of [other.word, other.reading, ...other.acceptedAnswers]) {
          expect(
            isAcceptedAnswer(word, spelling),
            `${word.id} が ${other.id} の「${spelling}」を正解にしている`,
          ).toBe(false);
        }
      }
    }
  });
});
