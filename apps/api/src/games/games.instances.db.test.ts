import type { GameStart } from "@kotoba/shared";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AppModule } from "../app.module.js";
import { configureApp } from "../configure-app.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { words } from "../prisma/seed/words.js";

/**
 * 同じ DB を指す 2 つの api を立て、Vercel で関数のインスタンスが複数立つ状況を模す。
 * seed 済みの DB を相手にし、`pnpm test:db` で流す。作ったゲームは最後に消す。
 */
async function createApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
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
  await first.get(PrismaService).game.deleteMany({ where: { id: { in: gameIds } } });
  await Promise.all([first.close(), second.close()]);
});

function post(app: INestApplication, path: string, body?: object) {
  const req = request(app.getHttpServer()).post(`/api/v1${path}`);
  return body === undefined ? req : req.send(body);
}

async function startOn(app: INestApplication): Promise<GameStart> {
  const res = await post(app, "/games", { language: "sv", locale: "en" }).expect(201);
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
