import { z } from "zod";

/** 出題言語。プレイヤーがゲーム開始前に選ぶ。 */
export const languageSchema = z.enum(["sv", "ja"]);
export type Language = z.infer<typeof languageSchema>;

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

/** 質問欄と解答欄は統合されているため、送信される内容は常にこの形をとる。 */
export const playerInputSchema = z.object({
  gameId: z.uuid(),
  text: z.string().trim().min(1).max(MAX_INPUT_LENGTH),
});
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

export const inputResultSchema = z.discriminatedUnion("kind", [
  questionResultSchema,
  answerResultSchema,
]);
export type InputResult = z.infer<typeof inputResultSchema>;

/** 終了条件はクリアとギブアップの 2 つ。誤答に回数制限はない。 */
export const outcomeSchema = z.enum(["cleared", "gave_up"]);
export type Outcome = z.infer<typeof outcomeSchema>;

/** 終了時にチャット末尾へ積むカードの中身。 */
export const gameResultSchema = z.object({
  outcome: outcomeSchema,
  word: z.string(),
  definition: z.string(),
});
export type GameResult = z.infer<typeof gameResultSchema>;

export const hintSchema = z.object({
  index: z.number().int().min(1).max(MAX_HINTS),
  text: z.string(),
});
export type Hint = z.infer<typeof hintSchema>;

/** ゲーム開始時にクライアントへ渡す初期情報。秘密の単語は含まない。 */
export const gameStartSchema = z.object({
  gameId: z.uuid(),
  language: languageSchema,
  teaser: z.string(),
});
export type GameStart = z.infer<typeof gameStartSchema>;
