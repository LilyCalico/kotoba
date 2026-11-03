import { describe, expect, it } from "vitest";
import { type Word, gameResultOf, isAcceptedAnswer, normalizeAnswer, wordSchema } from "./word.js";

const word: Word = {
  id: "kura-skymning",
  language: "sv",
  word: "Kura skymning",
  reading: "クーラ・シムニング",
  partOfSpeech: "phrase",
  frequency: 1,
  acceptedAnswers: ["クーラシムニング"],
  definition: {
    ja: "夕暮れどきに明かりをつけず、薄闇の中で静かに過ごすこと。",
    en: "Sitting quietly in the dusk without turning on any lamps.",
  },
  teaser: {
    ja: "日が落ちても、あえて手を伸ばさないスイッチがある",
    en: "The sun goes down, and the switch stays untouched on purpose",
  },
  hints: {
    ja: ["方向性", "使われる場面", "語の成り立ち"],
    en: ["direction", "occasion", "origin"],
  },
};

describe("normalizeAnswer", () => {
  it("ダイアクリティカルを落として大文字小文字を揃える", () => {
    expect(normalizeAnswer("Smultronställe")).toBe(normalizeAnswer("smultronstalle"));
    expect(normalizeAnswer("Mångata")).toBe(normalizeAnswer("mangata"));
  });

  it("区切り文字と長音符を無視する", () => {
    expect(normalizeAnswer("クーラ・シムニング")).toBe(normalizeAnswer("クラシムニング"));
    expect(normalizeAnswer("ラーゴム")).toBe(normalizeAnswer("ラゴム"));
  });
});

describe("isAcceptedAnswer", () => {
  it("単語そのものと別表記の両方を正解とみなす", () => {
    expect(isAcceptedAnswer(word, "kura skymning")).toBe(true);
    expect(isAcceptedAnswer(word, "クーラシムニング")).toBe(true);
  });

  it("別の単語は正解にしない", () => {
    expect(isAcceptedAnswer(word, "fredagsmys")).toBe(false);
    expect(isAcceptedAnswer(word, "  ")).toBe(false);
  });
});

describe("wordSchema", () => {
  it("片方の UI 言語が欠けたデータを弾く", () => {
    const { en: _dropped, ...jaOnly } = word.definition;

    expect(wordSchema.safeParse({ ...word, definition: jaOnly }).success).toBe(false);
  });

  it("ヒントが 3 つでないデータを弾く", () => {
    expect(
      wordSchema.safeParse({ ...word, hints: { ...word.hints, en: ["one"] } }).success,
    ).toBe(false);
  });

  it("使用頻度の範囲外を弾く", () => {
    expect(wordSchema.safeParse({ ...word, frequency: 6 }).success).toBe(false);
  });
});

describe("gameResultOf", () => {
  it("テキストを locale の言語に絞って、単語の一項目を組み立てる", () => {
    const full: Word = {
      ...word,
      literal: { ja: "薄暗がりにうずくまる", en: "to huddle in the dusk" },
      note: { ja: "冬の長い北欧の習慣。", en: "A habit of the long Nordic winter." },
      example: { sv: "Vi kurar skymning.", translations: { ja: "薄闇で過ごそう。", en: "Let us sit in the dusk." } },
    };

    expect(gameResultOf(full, "cleared", "ja")).toEqual({
      outcome: "cleared",
      wordId: "kura-skymning",
      word: "Kura skymning",
      reading: "クーラ・シムニング",
      partOfSpeech: "phrase",
      definition: full.definition.ja,
      literal: "薄暗がりにうずくまる",
      note: "冬の長い北欧の習慣。",
      example: { sv: "Vi kurar skymning.", translation: "薄闇で過ごそう。" },
    });
  });

  it("英語 UI ではカタカナの読みを付けない", () => {
    expect(gameResultOf(word, "cleared", "en")).not.toHaveProperty("reading");
  });

  it("単語が持たない項目は省く", () => {
    const { literal: _literal, note: _note, example: _example, ...bare } = word;

    expect(gameResultOf(bare, "gave_up", "en")).toEqual({
      outcome: "gave_up",
      wordId: "kura-skymning",
      word: "Kura skymning",
      partOfSpeech: "phrase",
      definition: word.definition.en,
    });
  });
});
