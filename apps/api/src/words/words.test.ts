import { type UiLocale, isAcceptedAnswer, normalizeAnswer, uiLocaleSchema } from "@kotoba/shared";
import { describe, expect, it } from "vitest";
import { findWordById, resolveWord, words } from "./words.js";

const locales: UiLocale[] = uiLocaleSchema.options;

describe("words", () => {
  it("スキーマを満たす単語を読み込む", () => {
    expect(words.length).toBeGreaterThan(0);
    expect(findWordById("fika")?.word).toBe("Fika");
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

describe("resolveWord", () => {
  it("UI 言語のテキストだけを残す", () => {
    const word = findWordById("fredagsmys");
    if (!word) throw new Error("fredagsmys が見つからない");

    expect(resolveWord(word, "ja").teaser).toBe(word.teaser.ja);
    expect(resolveWord(word, "en").teaser).toBe(word.teaser.en);
    expect(resolveWord(word, "en").literal).toBe(word.literal?.en);
  });

  it("読みは日本語 UI にだけ付ける", () => {
    const word = findWordById("lagom");
    if (!word) throw new Error("lagom が見つからない");

    expect(resolveWord(word, "ja").reading).toBe("ラーゴム");
    expect(resolveWord(word, "en").reading).toBeUndefined();
  });

  it("例文を持たない単語では example を省く", () => {
    const word = findWordById("mangata");
    if (!word) throw new Error("mangata が見つからない");

    expect(resolveWord(word, "ja").example).toBeUndefined();
  });
});
