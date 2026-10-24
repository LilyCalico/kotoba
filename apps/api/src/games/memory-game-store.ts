import { GAME_TTL_MS, type Game, type GameStore } from "./game-store.js";

/**
 * プロセス内の `Map` に保持する `GameStore`。DB を使わないユニットテストと HTTP のテストで差し込む。
 * インスタンスどうしでメモリを共有しないため、api は `PrismaGameStore` を使う。
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

  async create(game: Game): Promise<void> {
    this.sweep();
    await this.save(game);
  }

  async save(game: Game): Promise<void> {
    // 呼び出し側が持つオブジェクトを書き換えても、保存した状態が変わらないよう複製して持つ。
    this.games.set(game.id, { game: structuredClone(game), expiresAt: this.now() + GAME_TTL_MS });
  }

  private sweep(): void {
    const now = this.now();
    for (const [id, { expiresAt }] of this.games) {
      if (expiresAt <= now) this.games.delete(id);
    }
  }
}
