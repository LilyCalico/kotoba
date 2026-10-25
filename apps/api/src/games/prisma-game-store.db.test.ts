import { randomUUID } from "node:crypto";
import type { GameResult } from "@kotoba/shared";
import { afterAll, describe, expect, it } from "vitest";
import { PrismaService } from "../prisma/prisma.service.js";
import { GAME_TTL_MS, type Game } from "./game-store.js";
import { PrismaGameStore } from "./prisma-game-store.js";

/**
 * seed 済みの DB を相手にする。`pnpm test:db` で流し、CI では db ジョブが seed のあとに流す。
 * 作ったゲームは最後に消す。
 */
const prisma = new PrismaService();
const createdIds: string[] = [];

afterAll(async () => {
  await prisma.game.deleteMany({ where: { id: { in: createdIds } } });
  await prisma.$disconnect();
});

function game(overrides: Partial<Game> = {}): Game {
  const id = randomUUID();
  createdIds.push(id);
  return { id, wordId: "lagom", locale: "en", hintsRevealed: 0, history: [], ...overrides };
}

/**
 * 時刻を手で進められる `PrismaGameStore`。既定では現在時刻から始める。
 * 期限切れの削除を確かめるときは、ローカルの DB にある進行中のゲームまで消さないよう、十分に過去の時刻から始める。
 */
function createStore(start = Date.now()) {
  let now = start;
  const store = new PrismaGameStore(prisma, () => now);
  return {
    store,
    advance(ms: number) {
      now += ms;
    },
  };
}

const cleared: GameResult = {
  outcome: "cleared",
  wordId: "lagom",
  word: "lagom",
  partOfSpeech: "adjective",
  definition: "ちょうどよい",
  example: { sv: "Precis lagom!", translation: "ちょうどいい！" },
};

describe("PrismaGameStore（DB）", () => {
  it("保存したゲームを同じ形で読み出す", async () => {
    const { store } = createStore();
    const finished = game({
      locale: "ja",
      hintsRevealed: 2,
      history: [
        { text: "Is it a feeling?", result: { kind: "question", verdict: "yes" } },
        {
          text: "lagom",
          result: {
            kind: "answer",
            correct: true,
            result: cleared,
          },
        },
      ],
      result: cleared,
    });

    await store.create(finished);

    expect(await store.get(finished.id)).toEqual(finished);
    expect(await store.get(randomUUID())).toBeUndefined();
  });

  it("上書きしたゲームを読み出す", async () => {
    const { store } = createStore();
    const started = game();
    await store.create(started);

    const updated: Game = {
      ...started,
      hintsRevealed: 1,
      history: [{ text: "Is it a feeling?", result: { kind: "question", verdict: "yes" } }],
    };
    await store.save(updated);

    expect(await store.get(started.id)).toEqual(updated);
  });

  it("最後の操作から期限が経つと見つからない", async () => {
    const { store, advance } = createStore();
    const started = game();
    await store.create(started);

    advance(GAME_TTL_MS);

    expect(await store.get(started.id)).toBeUndefined();
  });

  it("読み出しも操作として期限を延ばす", async () => {
    const { store, advance } = createStore();
    const started = game();
    await store.create(started);

    advance(GAME_TTL_MS - 1);
    expect(await store.get(started.id)).toBeDefined();
    advance(GAME_TTL_MS - 1);

    expect(await store.get(started.id)).toBeDefined();
  });

  it("新しいゲームを作るときに期限切れのゲームを消す", async () => {
    const { store, advance } = createStore(Date.now() - 365 * 24 * GAME_TTL_MS);
    const expired = game();
    await store.create(expired);
    advance(GAME_TTL_MS);

    await store.create(game());

    // 期限切れの判定を経ずに行が残っているかを見るため、テーブルを直接引く。
    expect(await prisma.game.findUnique({ where: { id: expired.id } })).toBeNull();
  });

  it("別の接続から作ったゲームを読み書きできる", async () => {
    const other = new PrismaService();
    try {
      const { store } = createStore();
      const otherStore = new PrismaGameStore(other);
      const started = game();

      await store.create(started);
      await otherStore.save({ ...started, hintsRevealed: 1 });

      expect(await store.get(started.id)).toEqual({ ...started, hintsRevealed: 1 });
    } finally {
      await other.$disconnect();
    }
  });
});
