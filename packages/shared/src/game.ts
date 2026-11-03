import { z } from "zod";

/*
 * リクエストとレスポンスのスキーマには `meta({ id })` で名前を付ける。
 * API の OpenAPI 仕様は、この名前で `components.schemas` に載せ、`$ref` で参照する。
 */

/** 出題言語。プレイヤーがゲーム開始前に選ぶ。 */
export const languageSchema = z.enum(["sv", "ja"]);
export type Language = z.infer<typeof languageSchema>;

/**
 * UI の表示言語。プレイヤーが設定から選ぶ。
 * 出題言語（`languageSchema`）とは別の軸で、英語 UI でスウェーデン語の単語を解くこともある。
 */
export const uiLocaleSchema = z.enum(["ja", "en"]);
export type UiLocale = z.infer<typeof uiLocaleSchema>;

/** 単語の品詞。ヒントの書き分けと終了の画面の表示に使う。 */
export const partOfSpeechSchema = z.enum(["noun", "verb", "adjective", "phrase"]);
export type PartOfSpeech = z.infer<typeof partOfSpeechSchema>;

/** AI が返す 5 種の回答。これ以外の文字列は返さない。 */
export const verdictSchema = z.enum([
  "yes",
  "no",
  "unclear",
  "irrelevant",
  "not_a_question",
]);
export type Verdict = z.infer<typeof verdictSchema>;

/** プレイヤーの入力は質問と解答のどちらかに分類される。 */
export const inputKindSchema = z.enum(["question", "answer"]);
export type InputKind = z.infer<typeof inputKindSchema>;

export const MAX_INPUT_LENGTH = 200;
export const MAX_HINTS = 3;
/** ゲーム開始時に送る出題済み単語の id の上限。 */
export const MAX_EXCLUDE_WORD_IDS = 100;

/**
 * ゲーム開始のリクエスト。
 * `excludeWordIds` はクライアントが記録した、答えを見た単語の id。新しいものから最大 100 件を送る。
 */
export const startGameRequestSchema = z.object({
  language: languageSchema,
  locale: uiLocaleSchema.default("en"),
  excludeWordIds: z.array(z.string()).max(MAX_EXCLUDE_WORD_IDS).default([]),
}).meta({ id: "StartGameRequest" });
export type StartGameRequest = z.input<typeof startGameRequestSchema>;

/**
 * 質問欄と解答欄は統合されているため、送信される内容は常にこの形をとる。
 * 対象のゲームはパスの `gameId` で指す。
 */
export const playerInputSchema = z.object({
  text: z.string().trim().min(1).max(MAX_INPUT_LENGTH),
}).meta({ id: "PlayerInput" });
export type PlayerInput = z.infer<typeof playerInputSchema>;

/** 入力が質問と分類されたときの応答。 */
export const questionResultSchema = z.object({
  kind: z.literal("question"),
  verdict: verdictSchema,
});

/** 入力が解答と分類されたときの応答。正解ならそのまま結果を含む。 */
export const answerResultSchema = z.object({
  kind: z.literal("answer"),
  correct: z.boolean(),
  result: z.lazy(() => gameResultSchema).optional(),
});

/** 入力が日本語・英語・スウェーデン語以外だったときの応答。画面は対応言語で聞き直すよう案内する。 */
export const unsupportedLanguageResultSchema = z.object({
  kind: z.literal("unsupported_language"),
});

/**
 * 入力の判定結果。`kind` で 3 種に分かれる。
 * 対応言語の判定は分類の段で行い、AI の出力を縛る `verdictSchema` の enum は広げない。
 */
export const inputResultSchema = z
  .discriminatedUnion("kind", [
    questionResultSchema,
    answerResultSchema,
    unsupportedLanguageResultSchema,
  ])
  .meta({ id: "InputResult" });
export type InputResult = z.infer<typeof inputResultSchema>;

/** 終了条件はクリアとギブアップの 2 つ。誤答に回数制限はない。 */
export const outcomeSchema = z.enum(["cleared", "gave_up"]);
export type Outcome = z.infer<typeof outcomeSchema>;

/**
 * 終了時にチャット末尾へ積むカードの中身。単語を辞書の一項目として見せる。
 * テキストはゲームの `locale` の言語で返す。`example.sv` だけは UI 言語によらずスウェーデン語の原文である。
 * `wordId` はクライアントが出題済みの単語を記録するために使う。開始時には id を返さないため、ここが id を知る唯一の機会になる。
 */
export const gameResultSchema = z.object({
  outcome: outcomeSchema,
  wordId: z.string(),
  word: z.string(),
  /** カタカナの読み。日本語 UI のゲームだけが持つ */
  reading: z.string().optional(),
  partOfSpeech: partOfSpeechSchema,
  definition: z.string(),
  /** 直訳。合成語など、語の成り立ちが答えの核心になる語だけが持つ */
  literal: z.string().optional(),
  /** 文化的な補足。持つ語だけ */
  note: z.string().optional(),
  /** 例文。持つ語だけ */
  example: z.object({ sv: z.string(), translation: z.string() }).optional(),
}).meta({ id: "GameResult" });
export type GameResult = z.infer<typeof gameResultSchema>;

/** ヒント開示のリクエスト。番号を送らせることで、再送しても次のヒントが開示されない。 */
export const hintRequestSchema = z.object({
  index: z.number().int().min(1),
}).meta({ id: "HintRequest" });
export type HintRequest = z.infer<typeof hintRequestSchema>;

export const hintSchema = z.object({
  index: z.number().int().min(1).max(MAX_HINTS),
  text: z.string(),
}).meta({ id: "Hint" });
export type Hint = z.infer<typeof hintSchema>;

/** ゲーム開始時にクライアントへ渡す初期情報。秘密の単語は含まない。 */
export const gameStartSchema = z.object({
  gameId: z.uuid(),
  language: languageSchema,
  teaser: z.string(),
}).meta({ id: "GameStart" });
export type GameStart = z.infer<typeof gameStartSchema>;

/** サーバーが返すエラーの `code`。画面はこれで分岐し、`title` と `detail` は表示に使わない。 */
export const errorCodeSchema = z.enum([
  "validation_error",
  "game_not_found",
  "game_finished",
  "hint_out_of_order",
  "hint_limit_reached",
  "rate_limited",
  "internal_error",
  "ai_unavailable",
  "ai_rate_limited",
]);
export type ErrorCode = z.infer<typeof errorCodeSchema>;

/** 失敗の応答。RFC 9457 の Problem Details に `code` を足した形。 */
export const problemSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  code: errorCodeSchema,
  detail: z.string().optional(),
}).meta({ id: "Problem" });
export type Problem = z.infer<typeof problemSchema>;
