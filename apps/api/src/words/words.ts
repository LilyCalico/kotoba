import type { UiLocale, Word } from "@kotoba/shared";

/** UI 言語を解決した単語。秘密を含むため、この形のままクライアントへ送らない。 */
export type LocalizedWord = {
  id: string;
  word: string;
  /** 日本語 UI でのみ付く。英語 UI ではスウェーデン語の綴りだけを見せる */
  reading?: string;
  partOfSpeech: Word["partOfSpeech"];
  frequency: number;
  definition: string;
  teaser: string;
  hints: readonly [string, string, string];
  literal?: string;
  note?: string;
  example?: { sv: string; translation: string };
};

/**
 * UI 言語ごとのテキストを一つに畳む。
 * teaser・ヒント・終了カードはここから必要な分だけを取り出してクライアントへ渡す。
 */
export function resolveWord(word: Word, locale: UiLocale): LocalizedWord {
  return {
    id: word.id,
    word: word.word,
    ...(locale === "ja" ? { reading: word.reading } : {}),
    partOfSpeech: word.partOfSpeech,
    frequency: word.frequency,
    definition: word.definition[locale],
    teaser: word.teaser[locale],
    hints: word.hints[locale],
    ...(word.literal ? { literal: word.literal[locale] } : {}),
    ...(word.note ? { note: word.note[locale] } : {}),
    ...(word.example
      ? { example: { sv: word.example.sv, translation: word.example.translations[locale] } }
      : {}),
  };
}

/**
 * `frequency` を重みに 1 語選ぶ。`random` は [0, 1) を返す関数で、テストでは固定値を渡す。
 * 空の配列では何も返さない。
 */
export function pickWeighted(
  candidates: readonly Word[],
  random: () => number = Math.random,
): Word | undefined {
  const total = candidates.reduce((sum, word) => sum + word.frequency, 0);
  let point = random() * total;
  for (const word of candidates) {
    point -= word.frequency;
    if (point < 0) return word;
  }

  return candidates.at(-1);
}
