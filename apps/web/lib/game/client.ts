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
 * API が実装されたら、この口を保ったまま実装だけを差し替える。
 */
export interface GameClient {
  startGame(language: Language): Promise<GameStart>;
  sendInput(input: PlayerInput): Promise<InputResult>;
  revealHint(gameId: string, index: number): Promise<Hint>;
  giveUp(gameId: string): Promise<GameResult>;
}

/** 呼び出しの失敗。画面側はこれを捕らえて「もう一度送ってね」に落とす。 */
export class GameClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameClientError";
  }
}
