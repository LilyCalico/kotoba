import type { PrismaService } from "../prisma/prisma.service.js";
import type { RateLimitStore } from "./rate-limit-store.js";

/**
 * PostgreSQL の `rate_limit_counters` テーブルに数える `RateLimitStore`。
 * api のどのインスタンスも同じ行を数えるため、インスタンスの数だけ上限が増えない。
 */
export class PrismaRateLimitStore implements RateLimitStore {
  constructor(private readonly prisma: PrismaService) {}

  async hit(key: string, windowStart: number): Promise<number> {
    const start = new Date(windowStart);
    // 増やす処理は INSERT … ON CONFLICT の 1 文で行う。Prisma の upsert は、同じ窓の最初の 2 回が重なると
    // 両方が INSERT を試みて一意制約で失敗しうる。
    const [, rows] = await this.prisma.$transaction([
      this.prisma.rateLimitCounter.deleteMany({ where: { windowStart: { lt: start } } }),
      this.prisma.$queryRaw<{ count: number }[]>`
        INSERT INTO "rate_limit_counters" ("key", "window_start", "count")
        VALUES (${key}, ${start}, 1)
        ON CONFLICT ("key", "window_start")
        DO UPDATE SET "count" = "rate_limit_counters"."count" + 1
        RETURNING "count"`,
    ]);
    const count = rows[0]?.count;
    if (count === undefined) throw new Error(`Rate limit counter for ${key} was not returned.`);
    return count;
  }
}
