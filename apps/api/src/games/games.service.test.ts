import type { Word } from "@kotoba/shared";
import { describe, expect, it } from "vitest";
import { ApiError } from "../common/api-error.js";
import type { InputJudge, JudgeInput, Judgement } from "../judge/input-judge.js";
import { words } from "../prisma/seed/words.js";
import type { WordsService } from "../words/words.service.js";
import { GamesService } from "./games.service.js";
import { MemoryGameStore } from "./memory-game-store.js";

const lagom = words.find((word) => word.id === "lagom");
if (!lagom) throw new Error("lagom が見つからない");

/**
 * 呼ばれた入力を記録する判定。「?」で終わる入力は質問として `yes`、それ以外は解答とする。
 * `respond` を渡すと、その結果を返すか例外を投げる。
 */
function fakeJudge(respond?: (input: JudgeInput) => Judgement) {
  const calls: JudgeInput[] = [];
  const judge: InputJudge = {
    async judge(input) {
      // 渡された時点の履歴を残す。あとで積まれる要素に引きずられないよう写す。
      calls.push({ ...input, history: [...input.history] });
      if (respond) return respond(input);
      return input.text.endsWith("?")
        ? { kind: "question", verdict: "yes" }
        : { kind: "answer", correct: false };
    },
  };
  return { judge, calls };
}

function createService({
  findById = () => lagom,
  judge = fakeJudge().judge,
}: { findById?: (id: string) => Word | undefined; judge?: InputJudge } = {}) {
  const store = new MemoryGameStore();
  const wordsService = {
    pick: async () => lagom,
    findById: async (id: string) => findById(id),
  } as unknown as WordsService;
  return { service: new GamesService(wordsService, store, judge), store };
}

async function start(service: GamesService): Promise<string> {
  const { gameId } = await service.start({ language: "sv", locale: "en", mode: "guess_word", excludeWordIds: [] });
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
      { text: "Is it a feeling?", result: { kind: "question", verdict: "yes" } },
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
    const { service } = createService({ findById: () => undefined });
    const gameId = await start(service);

    await expect(service.input(gameId, "lagom")).rejects.toThrow(/lagom/);
  });

  it("正規化マッチで正解する入力では AI を呼ばない", async () => {
    const { judge, calls } = fakeJudge();
    const { service } = createService({ judge });
    const gameId = await start(service);

    const result = await service.input(gameId, "Lagom");

    expect(result).toMatchObject({ kind: "answer", correct: true, result: { outcome: "cleared" } });
    expect(calls).toHaveLength(0);
  });

  it("AI の分類を InputResult にする", async () => {
    const judgements: Judgement[] = [
      { kind: "question", verdict: "irrelevant" },
      { kind: "answer", correct: false },
      { kind: "unsupported_language" },
    ];
    const { judge } = fakeJudge(() => judgements.shift() ?? { kind: "answer", correct: false });
    const { service } = createService({ judge });
    const gameId = await start(service);

    await expect(service.input(gameId, "Do you like cats?")).resolves.toEqual({
      kind: "question",
      verdict: "irrelevant",
    });
    await expect(service.input(gameId, "hygge")).resolves.toEqual({ kind: "answer", correct: false });
    await expect(service.input(gameId, "这是食物吗")).resolves.toEqual({ kind: "unsupported_language" });
  });

  it("AI がスペルミス・音写ゆれとして救った解答は、正規化マッチの正解と同じくクリアにする", async () => {
    const { judge, calls } = fakeJudge(({ text }) => ({ kind: "answer", correct: text === "laagom" }));
    const { service, store } = createService({ judge });
    const rescuedGame = await start(service);
    const exactGame = await start(service);

    const rescued = await service.input(rescuedGame, "laagom");
    const exact = await service.input(exactGame, "lagom");

    expect(calls.map(({ text }) => text)).toEqual(["laagom"]);
    expect(rescued).toEqual(exact);
    expect(rescued).toMatchObject({ kind: "answer", correct: true, result: { outcome: "cleared", word: "Lagom" } });
    expect((await store.get(rescuedGame))?.result).toMatchObject({ outcome: "cleared" });
  });

  it("AI が救わなかった解答は誤答のままにし、ゲームを続ける", async () => {
    const { judge } = fakeJudge(() => ({ kind: "answer", correct: false }));
    const { service, store } = createService({ judge });
    const gameId = await start(service);

    await expect(service.input(gameId, "moderate")).resolves.toEqual({ kind: "answer", correct: false });
    expect((await store.get(gameId))?.result).toBeUndefined();
  });

  it("AI には秘密の単語と、それまでの全 Q&A 履歴を渡す", async () => {
    const { judge, calls } = fakeJudge();
    const { service } = createService({ judge });
    const gameId = await start(service);

    await service.input(gameId, "Is it a feeling?");
    await service.input(gameId, "fika");
    await service.input(gameId, "Is it Swedish?");

    expect(calls.map(({ text, history }) => ({ text, history: history.map((entry) => entry.text) }))).toEqual([
      { text: "Is it a feeling?", history: [] },
      { text: "fika", history: ["Is it a feeling?"] },
      { text: "Is it Swedish?", history: ["Is it a feeling?", "fika"] },
    ]);
    expect(calls.every(({ word }) => word.id === lagom.id)).toBe(true);
  });

  it("AI の判定に失敗した入力は履歴に積まない", async () => {
    const { judge } = fakeJudge(() => {
      throw new ApiError("ai_unavailable");
    });
    const { service, store } = createService({ judge });
    const gameId = await start(service);

    await expect(service.input(gameId, "Is it a feeling?")).rejects.toMatchObject({
      code: "ai_unavailable",
    });
    expect((await store.get(gameId))?.history).toEqual([]);
  });
});
