import {
  type UiLocale,
  type Verdict,
  isAcceptedAnswer,
  normalizeAnswer,
  uiLocaleSchema,
  wordSchema,
} from "@kotoba/shared";
import { describe, expect, it } from "vitest";
import { type QaRule, findWordById, rulesFor, words } from "./fixtures";

const locales: UiLocale[] = uiLocaleSchema.options;
const answeredVerdicts: Verdict[] = ["yes", "no", "irrelevant"];

describe("words", () => {
  it("意味領域の分かれた 3 語を持つ", () => {
    expect(words.map((word) => word.id)).toEqual(["fredagsmys", "mangata", "lagom"]);
  });

  it("スキーマを満たす", () => {
    for (const word of words) {
      expect(wordSchema.safeParse(word).success, `${word.id} がスキーマを満たさない`).toBe(true);
    }
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

describe("findWordById", () => {
  it("id で単語を引く", () => {
    expect(findWordById("mangata")?.word).toBe("Mångata");
  });

  it("未知の id には undefined を返す", () => {
    expect(findWordById("fika")).toBeUndefined();
  });
});

describe("rulesFor", () => {
  it("どの単語も yes / no / irrelevant を 1 行以上持つ", () => {
    for (const word of words) {
      const verdicts = rulesFor(word.id).map((rule) => rule.verdict);

      for (const verdict of answeredVerdicts) {
        expect(verdicts, `${word.id} に ${verdict} の行がない`).toContain(verdict);
      }
    }
  });

  it("キーワードを小文字で持ち、同じ行の中で重複させない", () => {
    for (const word of words) {
      for (const rule of rulesFor(word.id)) {
        expect(rule.keywords.length, `${word.id} の ${rule.verdict} が空`).toBeGreaterThan(0);

        for (const keyword of rule.keywords) {
          expect(keyword, `${word.id} の「${keyword}」が小文字でない`).toBe(
            keyword.toLowerCase(),
          );
        }
        expect(new Set(rule.keywords).size, `${word.id} の ${rule.verdict} に重複がある`).toBe(
          rule.keywords.length,
        );
      }
    }
  });

  it("同じ単語の別の行と部分文字列で衝突しない", () => {
    const conflicts: string[] = [];

    for (const word of words) {
      const rules: readonly QaRule[] = rulesFor(word.id);

      for (const rule of rules) {
        for (const other of rules.filter((candidate) => candidate !== rule)) {
          for (const keyword of rule.keywords) {
            for (const target of other.keywords) {
              if (target.includes(keyword)) {
                conflicts.push(
                  `${word.id}: ${rule.verdict}「${keyword}」が ${other.verdict}「${target}」に含まれる`,
                );
              }
            }
          }
        }
      }
    }

    expect(conflicts).toEqual([]);
  });

  it("未知の id には空の対応表を返す", () => {
    expect(rulesFor("fika")).toEqual([]);
  });
});
