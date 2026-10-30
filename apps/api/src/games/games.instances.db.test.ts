import { randomInt } from "node:crypto";
import type { GameStart } from "@kotoba/shared";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../app.module.js";
import { configureApp } from "../configure-app.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { words } from "../prisma/seed/words.js";
import { RATE_LIMIT_CLOCK } from "../rate-limit/rate-limit-store.js";
import { RATE_LIMITS } from "../rate-limit/rate-limit.guard.js";

/**
 * 同じ DB を指す 2 つの api を立て、Vercel で関数のインスタンスが複数立つ状況を模す。
 * seed 済みの DB を相手にし、`pnpm test:db` で流す。作ったゲームとレートリミットのカウンタは最後に消す。
 * レートリミットの窓の境目をまたいで数え直されないよう、両方の api の時刻を同じ時点で止める。
 */
const now = Date.now();

/**
 * テストが名乗る IP。前の実行や手元の dev サーバーのカウンタと混ざらないよう、毎回選び直す。
 * レートリミットを確かめるテストだけは、ほかのテストと枠を分ける。
 */
const defaultIp = `198.18.${randomInt(256)}.${randomInt(256)}`;
const limitedIp = `198.19.${randomInt(256)}.${randomInt(256)}`;

async function createApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(RATE_LIMIT_CLOCK)
    .useValue(() => now)
    .compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

let first: INestApplication;
let second: INestApplication;
const gameIds: string[] = [];

beforeAll(async () => {
  [first, second] = await Promise.all([createApp(), createApp()]);
});

afterAll(async () => {
  const prisma = first.get(PrismaService);
  await prisma.game.deleteMany({ where: { id: { in: gameIds } } });
  await prisma.rateLimitCounter.deleteMany({
    where: { OR: [defaultIp, limitedIp].map((ip) => ({ key: { endsWith: `:${ip}` } })) },
  });
  await Promise.all([first.close(), second.close()]);
});

function post(app: INestApplication, path: string, body?: object, ip = defaultIp) {
  const req = request(app.getHttpServer()).post(`/api/v1${path}`).set("x-forwarded-for", ip);
  return body === undefined ? req : req.send(body);
}

async function startOn(app: INestApplication, ip = defaultIp): Promise<GameStart> {
  const res = await post(app, "/games", { language: "sv", locale: "en" }, ip).expect(201);
  const start = res.body as GameStart;
  gameIds.push(start.gameId);
  return start;
}

describe("複数のインスタンス（DB）", () => {
  it("一方で始めたゲームを、他方で最後まで続けられる", async () => {
    const { gameId } = await startOn(first);

    await post(second, `/games/${gameId}/hints`, { index: 1 }).expect(200);
    const hint = await post(first, `/games/${gameId}/hints`, { index: 2 }).expect(200);
    expect(hint.body).toMatchObject({ index: 2 });

    const result = await post(second, `/games/${gameId}/give-up`).expect(200);
    const word = words.find(({ id }) => id === result.body.wordId);
    expect(word).toBeDefined();
    expect(result.body).toMatchObject({ outcome: "gave_up", word: word?.word });

    // ギブアップは、始めたインスタンスにも伝わっている。
    const finished = await post(first, `/games/${gameId}/inputs`, { text: "lagom" }).expect(409);
    expect(finished.body).toMatchObject({ code: "game_finished" });
  });

  it("一方で正解したゲームの結果を、他方でも返し直す", async () => {
    const { gameId } = await startOn(first);
    // 出題された単語は応答に現れないため、テーブルから引いて正解を作る。
    const row = await first.get(PrismaService).game.findUniqueOrThrow({ where: { id: gameId } });
    const word = words.find(({ id }) => id === row.wordId);
    if (!word) throw new Error(`${row.wordId} が seed にない`);

    const cleared = await post(second, `/games/${gameId}/inputs`, { text: word.word }).expect(200);
    expect(cleared.body).toMatchObject({ kind: "answer", correct: true, result: { outcome: "cleared" } });

    const again = await post(first, `/games/${gameId}/inputs`, { text: "anything" }).expect(200);
    expect(again.body).toEqual(cleared.body);
  });
});

describe("レートリミット（DB）", () => {
  it("2 つのインスタンスが 1 つのカウンタを数え、合わせて上限を超えたら rate_limited にする", async () => {
    for (let i = 0; i < RATE_LIMITS.start; i++) {
      await startOn(i % 2 === 0 ? first : second, limitedIp);
    }

    const limited = await post(first, "/games", { language: "sv" }, limitedIp).expect(429);
    const other = await post(second, "/games", { language: "sv" }, limitedIp).expect(429);

    expect(limited.body).toMatchObject({ code: "rate_limited" });
    expect(other.body).toMatchObject({ code: "rate_limited" });
  });
});
