import type { GameMode, GameResult, InputResult, UiLocale } from "@kotoba/shared";

/** 判定が成功した入力と、返した結果の組。AI の判定の一貫性のためにサーバーだけが使う。 */
export type QaEntry = { text: string; result: InputResult };

/** 進行中ゲームの状態。秘密の単語と Q&A 履歴を含むため、この形のままクライアントへ送らない。 */
export type Game = {
  id: string;
  wordId: string;
  /** 設問・ヒント・定義を返す言語。ゲームの間は変わらない */
  locale: UiLocale;
  /** 遊び方。ヒントの出どころと入力の判定を分ける */
  mode: GameMode;
  /** 開示済みのヒントの数 */
  hintsRevealed: number;
  history: QaEntry[];
  /** 終了したゲームの結果。`outcome` がクリアかギブアップかを表す */
  result?: GameResult;
};

/**
 * 進行中ゲームの保存先。API のほかのコードは保存先を知らない（ADR 0003）。
 * 最後の操作から一定時間経ったゲームは破棄し、`get` で見つからなくなる。
 *
 * 同じゲームへの書き込みが重なったときは、後に書いた方が残る。
 */
export interface GameStore {
  /** ゲームを読み出し、最後の操作の時刻を更新する。ないか期限切れなら何も返さない。 */
  get(id: string): Promise<Game | undefined>;
  /** 新しいゲームを保存する。あわせて期限切れのゲームを捨て、読まれないまま放置されたゲームが溜まらないようにする。 */
  create(game: Game): Promise<void>;
  /** ゲームを上書きし、最後の操作の時刻を更新する。 */
  save(game: Game): Promise<void>;
}

/** `GameStore` の注入に使うトークン。インターフェースは実行時に残らないため、値で指す。 */
export const GAME_STORE = Symbol("GameStore");

/** 最後の操作からゲームを破棄するまでの時間。 */
export const GAME_TTL_MS = 60 * 60 * 1000;
