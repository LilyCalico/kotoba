import type {
  GameResult,
  GameStart,
  Hint,
  InputResult,
  Language,
  PlayerInput,
} from "@kotoba/shared";

/**
 * ゲーム 1 周でクライアントが叩く口。
 * 実装は差し替え可能で、画面側はこのインターフェースだけを知る。
 */
export interface GameClient {
  /** 単語を 1 語選び、`gameId` と設問を返す。秘密の単語は返さない。 */
  startGame(language: Language): Promise<GameStart>;
  /** 入力を質問と解答に分類し、質問には 5 値の回答を、解答には正誤を返す。 */
  sendInput(gameId: string, input: PlayerInput): Promise<InputResult>;
  /** `index` 番目（1 始まり）のヒントを開示する。 */
  revealHint(gameId: string, index: number): Promise<Hint>;
  /** ギブアップを確定し、正解の単語と定義を返す。 */
  giveUp(gameId: string): Promise<GameResult>;
}

/**
 * 呼び出しの失敗。
 * 画面側はこれを捕らえて「もう一度送ってね」を表示し、同じ入力を再送できる状態に戻す。
 */
export class GameClientError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "GameClientError";
  }
}
