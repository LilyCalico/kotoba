import type { Word } from "@kotoba/shared";
import { describe, expect, it } from "vitest";
import { words } from "../prisma/seed/words.js";
import type { WordsService } from "../words/words.service.js";
import { GamesService } from "./games.service.js";
import { MemoryGameStore } from "./memory-game-store.js";

const lagom = words.find((word) => word.id === "lagom");
if (!lagom) throw new Error("lagom が見つからない");

function createService(findById: (id: string) => Word | undefined = () => lagom) {
  const store = new MemoryGameStore();
  const wordsService = {
    pick: async () => lagom,
    findById: async (id: string) => findById(id),
  } as unknown as WordsService;
  return { service: new GamesService(wordsService, store), store };
}

async function start(service: GamesService): Promise<string> {
  const { gameId } = await service.start({ language: "sv", locale: "en", excludeWordIds: [] });
  return gameId;
}

describe("GamesService", () => {
  it("判定した入力を、返した結果と組にして Q&A 履歴に積む", async () => {
    const { service, store } = createService();
    const gameId = await start(service);

    await service.input(gameId, "Is it a feeling?");
    await service.input(gameId, "fika");
    const correct = await service.input(gameId, "lagom");

    expect((await store.get(gameId))?.history).toEqual([
      { text: "Is it a feeling?", result: { kind: "question", verdict: "unclear" } },
      { text: "fika", result: { kind: "answer", correct: false } },
      { text: "lagom", result: correct },
    ]);
  });

  it("終了後の入力は判定せず、履歴に積まない", async () => {
    const { service, store } = createService();
    const gameId = await start(service);
    await service.input(gameId, "lagom");

    await service.input(gameId, "Is it a feeling?");

    expect((await store.get(gameId))?.history).toHaveLength(1);
  });

  it("開示済みのヒントの数をゲームに残す", async () => {
    const { service, store } = createService();
    const gameId = await start(service);

    await service.revealHint(gameId, 1);
    await service.revealHint(gameId, 2);
    await service.revealHint(gameId, 1);

    expect((await store.get(gameId))?.hintsRevealed).toBe(2);
  });

  it("ゲーム中に単語が DB から消えると、想定外の失敗にする", async () => {
    const { service } = createService(() => undefined);
    const gameId = await start(service);

    await expect(service.input(gameId, "lagom")).rejects.toThrow(/lagom/);
  });
});
