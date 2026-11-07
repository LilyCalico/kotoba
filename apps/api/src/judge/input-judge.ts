import type { GameMode, Verdict, Word } from "@kotoba/shared";
import type { QaEntry } from "../games/game-store.js";

/**
 * AI による入力の分類。質問と分類した入力には 5 値の回答を、解答と分類した入力には正誤を添える。
 * 解答の `correct` は、正規化マッチで外れた表記をスペルミス・音写ゆれとして救うかの判定である。
 */
export type Judgement =
  | { kind: "question"; verdict: Verdict }
  | { kind: "answer"; correct: boolean }
  | { kind: "unsupported_language" };

export type JudgeInput = {
  /** 遊び方。単語当てでは単語、意味当てでは意味を当てさせる */
  mode: GameMode;
  /** 出題した単語 */
  word: Word;
  /** そのゲームのそれまでの Q&A 履歴。回答の一貫性のために判定へ渡す */
  history: readonly QaEntry[];
  /** プレイヤーの入力 */
  text: string;
};

/**
 * プレイヤーの入力を AI で分類する口。`GamesService` はこのインターフェースだけを知る。
 * コードの正規化マッチで正解しなかった入力だけが渡ってくる。
 */
export interface InputJudge {
  /** 分類できなかったときは `ai_unavailable` の `ApiError` を投げる。 */
  judge(input: JudgeInput): Promise<Judgement>;
}

/** `InputJudge` の注入に使うトークン。インターフェースは実行時に残らないため、値で指す。 */
export const INPUT_JUDGE = Symbol("InputJudge");
