import type { RateLimitStore } from "./rate-limit-store.js";

/**
 * プロセス内の `Map` に数える `RateLimitStore`。DB を使わないユニットテストと HTTP のテストで差し込む。
 * インスタンスどうしでメモリを共有しないため、api は `PrismaRateLimitStore` を使う。
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private readonly counters = new Map<string, { windowStart: number; count: number }>();

  async hit(key: string, windowStart: number): Promise<number> {
    for (const [other, counter] of this.counters) {
      if (counter.windowStart < windowStart) this.counters.delete(other);
    }

    const counter = this.counters.get(key);
    const count = counter?.windowStart === windowStart ? counter.count + 1 : 1;
    this.counters.set(key, { windowStart, count });
    return count;
  }
}
