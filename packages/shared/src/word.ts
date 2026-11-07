import { z } from "zod";
import {
  type GameResult,
  languageSchema,
  type Outcome,
  partOfSpeechSchema,
  type UiLocale,
} from "./game.js";

/** UI 言語ごとに書き分けるテキスト。どちらかが欠けた単語はスキーマ検証で落ちる。 */
const localized = <T extends z.ZodType>(schema: T) => z.object({ ja: schema, en: schema });

export const HINT_COUNT = 3;

const hintsSchema = z.tuple([z.string().min(1), z.string().min(1), z.string().min(1)]);

/**
 * 意味当てで使う、単語ごとの判定基準とヒント。
 * 意味当ては日本語の UI でだけ遊ぶため、UI 言語で書き分けず日本語だけで書く。
 */
const meaningSchema = z.object({
  /** 正解とみなす核心。1〜2 文で書く。AI に渡すだけで、画面には出さない */
  core: z.string().min(1),
  /** 正解にする言い換えの例 */
  accepts: z.array(z.string().min(1)).min(1),
  /** 近いが誤りにする解答の例 */
  rejects: z.array(z.string().min(1)).min(1),
  /** 段階ヒント。1 がどんな種類の意味か、2 が使われる場面、3 が核心に近い言い換え */
  hints: hintsSchema,
});

/**
 * 出題する単語 1 件。
 * 開始時にクライアントへ送るのは、単語当てでは teaser だけ、意味当てでは word と reading だけである。
 * ヒントは開示操作のたびに 1 つずつ送り、definition と意味当ての判定基準はゲームが終わるまで送らない。
 * データ本体は API 側の DB（seed の入力は `apps/api/src/prisma/seed/words.ts`）にのみ置き、web にはバンドルしない。
 */
export const wordSchema = z.object({
  /** 出題済み単語の記録と DB 移行のキー。配列の順序に依存させない */
  id: z.string().regex(/^[a-z][a-z-]*$/, "id は小文字英字とハイフンのみで構成する"),
  language: languageSchema,
  /** 単語そのもの。正解として表示する綴り */
  word: z.string().min(1),
  /** カタカナの読み。日本語 UI でのみ表示し、英語 UI ではスウェーデン語の綴りだけを見せる */
  reading: z.string().min(1),
  partOfSpeech: partOfSpeechSchema,
  /** 日常での使用頻度。1 が最も稀で 5 が最も頻繁。出題の重み付けに使う */
  frequency: z.number().int().min(1).max(5),
  /**
   * `word` 以外に正解として受け付ける表記。
   * プレイヤーは日本語・英語・スウェーデン語のいずれでも解答できるため、UI 言語では絞り込まない。
   * 大文字小文字・ダイアクリティカル・区切り文字・長音符の揺れは
   * `normalizeAnswer` が吸収するため、ここには本質的に別の表記だけを並べる。
   */
  acceptedAnswers: z.array(z.string().min(1)).min(1),
  /** 終了カードに載せる定義。一文で言い切る */
  definition: localized(z.string().min(1)),
  /** 単語当てのゲーム開始時にクライアントへ渡す、謎めいた一行 */
  teaser: localized(z.string().min(1)),
  /** 単語当ての段階ヒント。1 が方向性、2 が使われる場面、3 が語の成り立ち */
  hints: localized(hintsSchema),
  /** 意味当ての判定基準とヒント */
  meaning: meaningSchema,
  /** 直訳。合成語で、語の成り立ちが答えの核心になる語だけが持つ */
  literal: localized(z.string().min(1)).optional(),
  /** 定義に畳むと冗長になる文化的な補足 */
  note: localized(z.string().min(1)).optional(),
  /** スウェーデン語の原文は UI 言語によらず共通で、訳文だけを書き分ける */
  example: z
    .object({
      sv: z.string().min(1),
      translations: localized(z.string().min(1)),
    })
    .optional(),
});
export type Word = z.infer<typeof wordSchema>;

/** ラテン文字の拡張領域。å ä ö é などをここで素の文字に戻す。 */
const LATIN_EXTENDED = /[\u00C0-\u024F]/g;
const COMBINING_MARKS = /[\u0300-\u036F]/g;
/** 空白・中黒・長音符・ハイフン類・句読点。解答の一致判定では無視する。 */
const SEPARATORS = /[\s\u30FB\u30FC\u002D\u2010-\u2015_.,!?\uFF01\uFF1F\u3002\u3001]/gu;

/**
 * 解答の表記ゆれを畳む。
 * 「Smultronställe」「smultronstalle」、「クーラ・シムニング」「クーラシムニング」、
 * 「ラーゴム」「ラゴム」がいずれも同じ文字列になる。
 */
export function normalizeAnswer(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(LATIN_EXTENDED, (char) => char.normalize("NFD").replace(COMBINING_MARKS, ""))
    .replace(SEPARATORS, "");
}

/** コードによる正規化マッチ。ここで外れた入力だけを AI の救済判定に回す。 */
export function isAcceptedAnswer(word: Word, input: string): boolean {
  const normalized = normalizeAnswer(input);
  if (normalized === "") return false;

  return [word.word, ...word.acceptedAnswers].some(
    (candidate) => normalizeAnswer(candidate) === normalized,
  );
}

/**
 * 終了時に返す単語の一項目。テキストは `locale` の言語に絞り、持たない項目は省く。
 * カタカナの読みは日本語 UI でだけ付け、英語 UI ではスウェーデン語の綴りだけを見せる。
 * api の応答と、web のモックの `GameClient` の両方がこれで組み立てる。
 */
export function gameResultOf(word: Word, outcome: Outcome, locale: UiLocale): GameResult {
  return {
    outcome,
    wordId: word.id,
    word: word.word,
    ...(locale === "ja" && { reading: word.reading }),
    partOfSpeech: word.partOfSpeech,
    definition: word.definition[locale],
    ...(word.literal && { literal: word.literal[locale] }),
    ...(word.note && { note: word.note[locale] }),
    ...(word.example && {
      example: { sv: word.example.sv, translation: word.example.translations[locale] },
    }),
  };
}
