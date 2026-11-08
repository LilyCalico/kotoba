import { type Word, gameResultOf, gameStartSchema } from "@kotoba/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GameClientError } from "./client";
import { findWordById, words } from "./fixtures";
import { DEFAULT_DELAY_MS, createMockGameClient, pickWord } from "./mock-client";

function wordOf(id: string): Word {
  const word = findWordById(id);
  if (!word) throw new Error(`${id} が単語プールにない`);
  return word;
}

const fredagsmys = wordOf("fredagsmys");

function clientFor(wordId?: string) {
  return createMockGameClient({ wordId, delayMs: 0 });
}

/** 失敗の `code` を取り出す。失敗しなければテストを落とす。 */
async function codeOf(promise: Promise<unknown>): Promise<string> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(GameClientError);
  return (error as GameClientError).code;
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("createMockGameClient", () => {
  it("開始 → 質問 → ヒント → 誤答 → 正解の 1 周が通る", async () => {
    const client = clientFor("fredagsmys");

    const start = await client.startGame({ language: "sv" });
    expect(start).toEqual({
      gameId: expect.any(String),
      language: "sv",
      mode: "guess_word",
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
      result: gameResultOf(fredagsmys, "cleared", "en"),
    });
  });

  it("locale の言語で設問・ヒント・定義を返し、日本語ではカタカナの読みも返す", async () => {
    const client = clientFor("fredagsmys");

    const start = await client.startGame({ language: "sv", locale: "ja" });
    const { gameId } = start;

    expect(start).toMatchObject({ teaser: fredagsmys.teaser.ja });
    await expect(client.revealHint(gameId, 1)).resolves.toEqual({
      index: 1,
      text: fredagsmys.hints.ja[0],
    });
    await expect(client.giveUp(gameId)).resolves.toMatchObject({
      reading: fredagsmys.reading,
      definition: fredagsmys.definition.ja,
    });
  });

  it("意味当ては単語と読みを返し、意味当てのヒントと判定を返す", async () => {
    const client = clientFor("fredagsmys");

    const start = await client.startGame({ language: "sv", locale: "ja", mode: "guess_meaning" });

    expect(start).toEqual({
      gameId: expect.any(String),
      language: "sv",
      mode: "guess_meaning",
      word: fredagsmys.word,
      reading: fredagsmys.reading,
    });
    await expect(client.revealHint(start.gameId, 1)).resolves.toEqual({
      index: 1,
      text: fredagsmys.meaning.hints[0],
    });
    await expect(client.sendInput(start.gameId, { text: fredagsmys.word })).resolves.toEqual({
      kind: "answer",
      correct: false,
    });
    await expect(
      client.sendInput(start.gameId, { text: fredagsmys.meaning.accepts[0] ?? "" }),
    ).resolves.toEqual({
      kind: "answer",
      correct: true,
      result: gameResultOf(fredagsmys, "cleared", "ja"),
    });
  });

  it("gameId は UUID として検証を通る", async () => {
    const client = clientFor();

    expect(gameStartSchema.safeParse(await client.startGame({ language: "sv" })).success).toBe(
      true,
    );
  });

  it("randomUUID の無い環境でも UUID を返す", async () => {
    const real = globalThis.crypto;
    vi.stubGlobal("crypto", {
      getRandomValues: <T extends ArrayBufferView>(array: T) => real.getRandomValues(array),
    });
    const client = clientFor();

    for (let round = 0; round < 20; round++) {
      const start = await client.startGame({ language: "sv" });
      expect(gameStartSchema.safeParse(start).success).toBe(true);
    }
  });

  it("ゲームごとに別の gameId を返す", async () => {
    const client = clientFor("fredagsmys");

    const first = await client.startGame({ language: "sv" });
    const second = await client.startGame({ language: "sv" });

    expect(first.gameId).not.toBe(second.gameId);
  });

  it("ヒントを番号どおりに返す", async () => {
    const client = clientFor("fredagsmys");
    const { gameId } = await client.startGame({ language: "sv" });

    for (const index of [1, 2, 3]) {
      await expect(client.revealHint(gameId, index)).resolves.toEqual({
        index,
        text: fredagsmys.hints.en[index - 1],
      });
    }
  });

  it("ギブアップすると正解の単語と定義を返す", async () => {
    const client = clientFor("fredagsmys");
    const { gameId } = await client.startGame({ language: "sv" });

    await expect(client.giveUp(gameId)).resolves.toEqual(gameResultOf(fredagsmys, "gave_up", "en"));
  });
});

describe("excludeWordIds", () => {
  it("渡した単語を選定から除く", async () => {
    const [kept, ...rest] = words;
    const client = clientFor();

    await expect(
      client.startGame({ language: "sv", excludeWordIds: rest.map((word) => word.id) }),
    ).resolves.toMatchObject({ teaser: kept?.teaser.en });
  });
});

describe("wordId", () => {
  it("出題単語を固定する", async () => {
    for (const word of words) {
      await expect(clientFor(word.id).startGame({ language: "sv" })).resolves.toMatchObject({
        teaser: word.teaser.en,
      });
    }
  });

  it("excludeWordIds に含まれていても固定した単語を出す", async () => {
    await expect(
      clientFor("fredagsmys").startGame({ language: "sv", excludeWordIds: ["fredagsmys"] }),
    ).resolves.toMatchObject({ teaser: fredagsmys.teaser.en });
  });

  it("未知の id はランダム選出にフォールバックする", async () => {
    const teasers = words.map((word) => word.teaser.en);

    const start = await clientFor("unknown-word").startGame({ language: "sv" });

    expect(start.mode === "guess_word" && teasers.includes(start.teaser)).toBe(true);
  });
});

describe("失敗", () => {
  it("単語の無い言語では validation_error", async () => {
    expect(await codeOf(clientFor().startGame({ language: "ja" }))).toBe("validation_error");
  });

  it("英語の UI の意味当ては validation_error", async () => {
    expect(
      await codeOf(clientFor().startGame({ language: "sv", locale: "en", mode: "guess_meaning" })),
    ).toBe("validation_error");
  });

  it("未知の gameId では game_not_found", async () => {
    const client = clientFor();
    const gameId = "00000000-0000-4000-8000-000000000000";

    expect(await codeOf(client.sendInput(gameId, { text: "fika" }))).toBe("game_not_found");
    expect(await codeOf(client.revealHint(gameId, 1))).toBe("game_not_found");
    expect(await codeOf(client.giveUp(gameId))).toBe("game_not_found");
  });

  it("別のクライアントで始めたゲームは知らない", async () => {
    const { gameId } = await clientFor().startGame({ language: "sv" });

    expect(await codeOf(clientFor().giveUp(gameId))).toBe("game_not_found");
  });

  it("1 未満や整数でないヒント番号は validation_error、4 以上は hint_limit_reached", async () => {
    const client = clientFor("fredagsmys");
    const { gameId } = await client.startGame({ language: "sv" });

    expect(await codeOf(client.revealHint(gameId, 0))).toBe("validation_error");
    expect(await codeOf(client.revealHint(gameId, 1.5))).toBe("validation_error");
    expect(await codeOf(client.revealHint(gameId, 4))).toBe("hint_limit_reached");
  });
});

describe("pickWord", () => {
  const pool = [{ id: "a" }, { id: "b" }, { id: "c" }];
  /** 候補の先頭を選ぶ乱数。 */
  const first = () => 0;
  /** 候補の末尾を選ぶ乱数。 */
  const last = () => 0.999_999;

  it("除く単語を選定から外す", () => {
    expect(pickWord(pool, ["a", "c"], first)).toEqual({ id: "b" });
    expect(pickWord(pool, ["a", "c"], last)).toEqual({ id: "b" });
  });

  it("乱数に応じて候補から 1 語選ぶ", () => {
    expect(pickWord(pool, ["b"], first)).toEqual({ id: "a" });
    expect(pickWord(pool, ["b"], last)).toEqual({ id: "c" });
  });

  it("全語を除くとプール全体から選ぶ", () => {
    expect(pickWord(pool, ["a", "b", "c"], first)).toEqual({ id: "a" });
    expect(pickWord(pool, ["a", "b", "c"], last)).toEqual({ id: "c" });
  });

  it("プールに無い id は無視する", () => {
    expect(pickWord(pool, ["removed", "a", "b"], first)).toEqual({ id: "c" });
  });

  it("乱数が 1 を返しても候補の範囲に収める", () => {
    expect(pickWord(pool, [], () => 1)).toEqual({ id: "c" });
  });

  it("プールが空なら例外を投げる", () => {
    expect(() => pickWord([], [])).toThrow();
  });
});

describe("delayMs", () => {
  it("既定では応答の前に遅延を挟む", async () => {
    vi.useFakeTimers();
    const client = createMockGameClient({ wordId: "fredagsmys" });
    let settled = false;

    const pending = client.startGame({ language: "sv" }).then((start) => {
      settled = true;
      return start;
    });
    await vi.advanceTimersByTimeAsync(DEFAULT_DELAY_MS - 1);
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await expect(pending).resolves.toMatchObject({ teaser: fredagsmys.teaser.en });
  });
});
