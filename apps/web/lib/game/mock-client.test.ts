import { type Word, gameStartSchema } from "@kotoba/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GameClientError } from "./client";
import { findWordById, words } from "./fixtures";
import { DEFAULT_DELAY_MS, createMockGameClient } from "./mock-client";
import { PLAYED_WORDS_KEY, type PlayedWordsStorage, readPlayedWords } from "./played-words";

class MemoryStorage implements PlayedWordsStorage {
  readonly items = new Map<string, string>();

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }

  removeItem(key: string): void {
    this.items.delete(key);
  }
}

function wordOf(id: string): Word {
  const word = findWordById(id);
  if (!word) throw new Error(`${id} が単語プールにない`);
  return word;
}

const fredagsmys = wordOf("fredagsmys");

function clientFor(wordId?: string, storage = new MemoryStorage()) {
  return { client: createMockGameClient({ wordId, delayMs: 0, storage }), storage };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("createMockGameClient", () => {
  it("開始 → 質問 → ヒント → 誤答 → 正解の 1 周が通る", async () => {
    const { client } = clientFor("fredagsmys");

    const start = await client.startGame("sv");
    expect(start).toEqual({
      gameId: expect.any(String),
      language: "sv",
      teaser: fredagsmys.teaser.en,
    });

    const { gameId } = start;
    await expect(
      client.sendInput(gameId, { text: "Is it something you do on a Friday?" }),
    ).resolves.toEqual({ kind: "question", verdict: "yes" });
    await expect(client.revealHint(gameId, 1)).resolves.toEqual({
      index: 1,
      text: fredagsmys.hints.en[0],
    });
    await expect(client.sendInput(gameId, { text: "fika" })).resolves.toEqual({
      kind: "answer",
      correct: false,
    });
    await expect(client.sendInput(gameId, { text: "Fredagsmys" })).resolves.toEqual({
      kind: "answer",
      correct: true,
      result: {
        outcome: "cleared",
        wordId: fredagsmys.id,
        word: fredagsmys.word,
        definition: fredagsmys.definition.en,
      },
    });
  });

  it("gameId は UUID として検証を通る", async () => {
    const { client } = clientFor();

    expect(gameStartSchema.safeParse(await client.startGame("sv")).success).toBe(true);
  });

  it("randomUUID の無い環境でも UUID を返す", async () => {
    const real = globalThis.crypto;
    vi.stubGlobal("crypto", {
      getRandomValues: <T extends ArrayBufferView>(array: T) => real.getRandomValues(array),
    });
    const { client } = clientFor();

    for (let round = 0; round < 20; round++) {
      expect(gameStartSchema.safeParse(await client.startGame("sv")).success).toBe(true);
    }
  });

  it("ゲームごとに別の gameId を返す", async () => {
    const { client } = clientFor("fredagsmys");

    const first = await client.startGame("sv");
    const second = await client.startGame("sv");

    expect(first.gameId).not.toBe(second.gameId);
  });

  it("ヒントを番号どおりに返す", async () => {
    const { client } = clientFor("fredagsmys");
    const { gameId } = await client.startGame("sv");

    for (const index of [1, 2, 3]) {
      await expect(client.revealHint(gameId, index)).resolves.toEqual({
        index,
        text: fredagsmys.hints.en[index - 1],
      });
    }
  });

  it("ギブアップすると正解の単語と定義を返す", async () => {
    const { client } = clientFor("fredagsmys");
    const { gameId } = await client.startGame("sv");

    await expect(client.giveUp(gameId)).resolves.toEqual({
      outcome: "gave_up",
      wordId: fredagsmys.id,
      word: fredagsmys.word,
      definition: fredagsmys.definition.en,
    });
  });
});

describe("出題済み単語の記録", () => {
  it("質問・誤答・ヒントでは記録しない", async () => {
    const { client, storage } = clientFor("fredagsmys");
    const { gameId } = await client.startGame("sv");

    await client.sendInput(gameId, { text: "Is it something you do on a Friday?" });
    await client.sendInput(gameId, { text: "fika" });
    await client.revealHint(gameId, 1);

    expect(readPlayedWords(storage)).toEqual([]);
  });

  it("クリアで記録する", async () => {
    const { client, storage } = clientFor("fredagsmys");
    const { gameId } = await client.startGame("sv");

    await client.sendInput(gameId, { text: "fredagsmys" });

    expect(readPlayedWords(storage)).toEqual(["fredagsmys"]);
  });

  it("ギブアップで記録し、重ねて呼んでも 1 件にとどめる", async () => {
    const { client, storage } = clientFor("fredagsmys");
    const { gameId } = await client.startGame("sv");

    await client.giveUp(gameId);
    await client.giveUp(gameId);

    expect(readPlayedWords(storage)).toEqual(["fredagsmys"]);
  });

  it("出題済みの単語を選定から除く", async () => {
    const storage = new MemoryStorage();
    const rest = words.slice(1);
    storage.setItem(PLAYED_WORDS_KEY, JSON.stringify(rest.map((word) => word.id)));
    const { client } = clientFor(undefined, storage);

    await expect(client.startGame("sv")).resolves.toMatchObject({
      teaser: words[0]?.teaser.en,
    });
  });
});

describe("wordId", () => {
  it("出題単語を固定する", async () => {
    for (const word of words) {
      const { client } = clientFor(word.id);
      await expect(client.startGame("sv")).resolves.toMatchObject({ teaser: word.teaser.en });
    }
  });

  it("出題済みでも固定した単語を出す", async () => {
    const storage = new MemoryStorage();
    storage.setItem(PLAYED_WORDS_KEY, JSON.stringify(["fredagsmys"]));
    const { client } = clientFor("fredagsmys", storage);

    await expect(client.startGame("sv")).resolves.toMatchObject({
      teaser: fredagsmys.teaser.en,
    });
  });

  it("未知の id はランダム選出にフォールバックする", async () => {
    const { client } = clientFor("unknown-word");
    const teasers = words.map((word) => word.teaser.en);

    const { teaser } = await client.startGame("sv");

    expect(teasers).toContain(teaser);
  });
});

describe("失敗", () => {
  it("単語の無い言語では GameClientError を投げる", async () => {
    const { client } = clientFor();

    await expect(client.startGame("ja")).rejects.toBeInstanceOf(GameClientError);
  });

  it("未知の gameId では GameClientError を投げる", async () => {
    const { client } = clientFor();
    const gameId = "00000000-0000-4000-8000-000000000000";

    await expect(client.sendInput(gameId, { text: "fika" })).rejects.toBeInstanceOf(
      GameClientError,
    );
    await expect(client.revealHint(gameId, 1)).rejects.toBeInstanceOf(GameClientError);
    await expect(client.giveUp(gameId)).rejects.toBeInstanceOf(GameClientError);
  });

  it("別のクライアントで始めたゲームは知らない", async () => {
    const { gameId } = await clientFor().client.startGame("sv");

    await expect(clientFor().client.giveUp(gameId)).rejects.toBeInstanceOf(GameClientError);
  });

  it("範囲外のヒント番号では GameClientError を投げる", async () => {
    const { client } = clientFor("fredagsmys");
    const { gameId } = await client.startGame("sv");

    for (const index of [0, 4, 1.5]) {
      await expect(client.revealHint(gameId, index)).rejects.toBeInstanceOf(GameClientError);
    }
  });
});

describe("delayMs", () => {
  it("既定では応答の前に遅延を挟む", async () => {
    vi.useFakeTimers();
    const client = createMockGameClient({ wordId: "fredagsmys", storage: null });
    let settled = false;

    const pending = client.startGame("sv").then((start) => {
      settled = true;
      return start;
    });
    await vi.advanceTimersByTimeAsync(DEFAULT_DELAY_MS - 1);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await expect(pending).resolves.toMatchObject({ teaser: fredagsmys.teaser.en });
  });
});
