import { GAME_TTL_MS, type Game, type GameStore } from "./game-store.js";

/**
 * プロセス内の `Map` に保持する `GameStore`。
 * Vercel では関数のインスタンスが複数立ち、メモリを共有しないため、デプロイする前に共有ストアの実装へ差し替える（#63）。
 * 差し替えたあともユニットテスト用に残す。
 */
export class MemoryGameStore implements GameStore {
  private readonly games = new Map<string, { game: Game; expiresAt: number }>();

  /** `now` はテストで時刻を進めるために差し替える。 */
  constructor(private readonly now: () => number = Date.now) {}

  async get(id: string): Promise<Game | undefined> {
    const entry = this.games.get(id);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.games.delete(id);
      return undefined;
    }

    entry.expiresAt = this.now() + GAME_TTL_MS;
    return structuredClone(entry.game);
  }

  async save(game: Game): Promise<void> {
    if (!this.games.has(game.id)) this.sweep();
    // 呼び出し側が持つオブジェクトを書き換えても、保存した状態が変わらないよう複製して持つ。
    this.games.set(game.id, { game: structuredClone(game), expiresAt: this.now() + GAME_TTL_MS });
  }

  /** 期限切れのゲームを捨てる。読まれないまま放置されたゲームでメモリが膨らまないよう、新しいゲームを作るたびに呼ぶ。 */
  private sweep(): void {
    const now = this.now();
    for (const [id, { expiresAt }] of this.games) {
      if (expiresAt <= now) this.games.delete(id);
    }
  }
}
