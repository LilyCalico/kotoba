import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaService } from "../prisma/prisma.service.js";
import { PrismaRateLimitStore } from "./prisma-rate-limit-store.js";
import { RATE_LIMIT_WINDOW_MS, windowStartOf } from "./rate-limit-store.js";

/**
 * ローカルの DB を相手にする。`pnpm test:db` で流す。作ったカウンタは最後に消す。
 * key には毎回違う接頭辞を付け、前の実行や手元の dev サーバーのカウンタと混ざらないようにする。
 */
const prisma = new PrismaService();
const prefix = `test-${randomUUID()}`;

afterAll(async () => {
  await prisma.rateLimitCounter.deleteMany({ where: { key: { startsWith: prefix } } });
  await prisma.$disconnect();
});

describe("PrismaRateLimitStore（DB）", () => {
  it("同じ key と窓の回数を数え、key ごとに分ける", async () => {
    const store = new PrismaRateLimitStore(prisma);
    const window = windowStartOf(Date.now());

    expect(await store.hit(`${prefix}:a`, window)).toBe(1);
    expect(await store.hit(`${prefix}:a`, window)).toBe(2);
    expect(await store.hit(`${prefix}:b`, window)).toBe(1);
  });

  it("同時に数えても取りこぼさない", async () => {
    const store = new PrismaRateLimitStore(prisma);
    const window = windowStartOf(Date.now());

    const counts = await Promise.all(Array.from({ length: 20 }, () => store.hit(`${prefix}:c`, window)));

    expect([...counts].sort((x, y) => x - y)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });

  it("次の窓では 1 から数え直し、終わった窓のカウンタを消す", async () => {
    const store = new PrismaRateLimitStore(prisma);
    // 消すのは数えた窓より前のカウンタだけ。今の窓のカウンタ（ほかのテストや dev サーバーのもの）を消さないよう、過去の窓で確かめる。
    const window = windowStartOf(Date.now()) - 10 * RATE_LIMIT_WINDOW_MS;
    await store.hit(`${prefix}:d`, window);

    expect(await store.hit(`${prefix}:d`, window + RATE_LIMIT_WINDOW_MS)).toBe(1);
    const rows = await prisma.rateLimitCounter.findMany({ where: { key: `${prefix}:d` } });
    expect(rows.map((row) => row.windowStart.getTime())).toEqual([window + RATE_LIMIT_WINDOW_MS]);
  });
});
