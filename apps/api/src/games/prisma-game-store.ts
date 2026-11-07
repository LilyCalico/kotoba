import { gameResultSchema, inputResultSchema } from "@kotoba/shared";
import { z } from "zod";
import { Prisma, type Game as GameRow } from "../generated/prisma/client.js";
import type { PrismaService } from "../prisma/prisma.service.js";
import { GAME_TTL_MS, type Game, type GameStore } from "./game-store.js";

/** jsonb の列に置く値の形。読み出すたびに検証し、壊れた行をゲームとして扱わない。 */
const historySchema = z.array(z.object({ text: z.string(), result: inputResultSchema }));
const resultSchema = gameResultSchema.nullable();

function toGame(row: GameRow): Game {
  const result = resultSchema.parse(row.result);
  return {
    id: row.id,
    wordId: row.wordId,
    locale: row.locale,
    mode: row.mode,
    hintsRevealed: row.hintsRevealed,
    history: historySchema.parse(row.history),
    ...(result && { result }),
  };
}

/**
 * PostgreSQL の `games` テーブルに保持する `GameStore`。api のどのインスタンスからも同じゲームを読み書きできる（ADR 0003）。
 * 期限は `expires_at` 列に持ち、読み出しは期限内の行に絞る。
 */
export class PrismaGameStore implements GameStore {
  /** `now` はテストで時刻を進めるために差し替える。 */
  constructor(
    private readonly prisma: PrismaService,
    private readonly now: () => number = Date.now,
  ) {}

  async get(id: string): Promise<Game | undefined> {
    const now = this.now();
    // 期限内かの判定と期限の延長を 1 つの UPDATE で行い、その間に期限が切れる隙間を作らない。
    const [row] = await this.prisma.game.updateManyAndReturn({
      where: { id, expiresAt: { gt: new Date(now) } },
      data: { expiresAt: new Date(now + GAME_TTL_MS) },
    });
    return row && toGame(row);
  }

  async create(game: Game): Promise<void> {
    const now = this.now();
    await this.prisma.$transaction([
      this.prisma.game.deleteMany({ where: { expiresAt: { lte: new Date(now) } } }),
      this.prisma.game.create({ data: { id: game.id, ...this.columnsOf(game, now) } }),
    ]);
  }

  async save(game: Game): Promise<void> {
    const columns = this.columnsOf(game, this.now());
    await this.prisma.game.upsert({
      where: { id: game.id },
      create: { id: game.id, ...columns },
      update: columns,
    });
  }

  private columnsOf(game: Game, now: number) {
    return {
      wordId: game.wordId,
      locale: game.locale,
      mode: game.mode,
      hintsRevealed: game.hintsRevealed,
      history: game.history,
      result: game.result ?? Prisma.DbNull,
      expiresAt: new Date(now + GAME_TTL_MS),
    };
  }
}
