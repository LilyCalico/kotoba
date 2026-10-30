import type {
  ErrorCode,
  GameResult,
  GameStart,
  Hint,
  InputResult,
  PlayerInput,
  StartGameRequest,
} from "@kotoba/shared";

/**
 * ゲーム 1 周でクライアントが叩く口。
 * 実装は差し替え可能で、画面側はこのインターフェースだけを知る。
 */
export interface GameClient {
  /**
   * 単語を 1 語選び、`gameId` と設問を返す。秘密の単語は返さない。
   * `excludeWordIds` に渡した単語は、ほかに候補がある限り選ばない。
   */
  startGame(request: StartGameRequest): Promise<GameStart>;
  /** 入力を質問と解答に分類し、質問には 5 値の回答を、解答には正誤を返す。 */
  sendInput(gameId: string, input: PlayerInput): Promise<InputResult>;
  /** `index` 番目（1 始まり）のヒントを開示する。 */
  revealHint(gameId: string, index: number): Promise<Hint>;
  /** ギブアップを確定し、正解の単語と定義を返す。 */
  giveUp(gameId: string): Promise<GameResult>;
}

/**
 * 失敗の種類。サーバーが返した `code` か、応答を受け取れなかったことを表す `network_error`。
 * 画面はこれで表示を分け、サーバーの `title` や `detail` は使わない。
 */
export type GameClientErrorCode = ErrorCode | "network_error";

/**
 * 呼び出しの失敗。画面側はこれを捕らえ、`code` に応じて案内を出す。
 * `retryAfterSeconds` は応答の `Retry-After` が示す、送り直すまでに待つ秒数。
 */
export class GameClientError extends Error {
  readonly retryAfterSeconds?: number;

  constructor(
    readonly code: GameClientErrorCode,
    message: string = code,
    options?: ErrorOptions & { retryAfterSeconds?: number },
  ) {
    super(message, options);
    this.name = "GameClientError";
    this.retryAfterSeconds = options?.retryAfterSeconds;
  }
}
