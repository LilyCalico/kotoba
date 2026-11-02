import { describe, expect, it } from "vitest";
import { GAME_TTL_MS, type Game } from "./game-store.js";
import { MemoryGameStore } from "./memory-game-store.js";

function game(id: string): Game {
  return { id, wordId: "fika", locale: "en", hintsRevealed: 0, history: [] };
}

/** 時刻を手で進められる `MemoryGameStore`。 */
function createStore() {
  let now = 0;
  const store = new MemoryGameStore(() => now);
  return {
    store,
    advance(ms: number) {
      now += ms;
    },
  };
}

describe("MemoryGameStore", () => {
  it("保存したゲームを読み出す", async () => {
    const { store } = createStore();
    await store.create(game("a"));

    expect(await store.get("a")).toEqual(game("a"));
    expect(await store.get("missing")).toBeUndefined();
  });

  it("上書きしたゲームを読み出し、上書きも期限を延ばす", async () => {
    const { store, advance } = createStore();
    await store.create(game("a"));

    advance(GAME_TTL_MS - 1);
    await store.save({ ...game("a"), hintsRevealed: 1 });
    advance(GAME_TTL_MS - 1);

    expect(await store.get("a")).toEqual({ ...game("a"), hintsRevealed: 1 });
  });

  it("読み出したゲームを書き換えても、保存した状態は変わらない", async () => {
    const { store } = createStore();
    await store.create(game("a"));

    const loaded = await store.get("a");
    loaded?.history.push({ text: "fika", result: { kind: "answer", correct: false } });

    expect((await store.get("a"))?.history).toEqual([]);
  });

  it("最後の操作から期限が経つと見つからない", async () => {
    const { store, advance } = createStore();
    await store.create(game("a"));

    advance(GAME_TTL_MS);

    expect(await store.get("a")).toBeUndefined();
  });

  it("読み出しも操作として期限を延ばす", async () => {
    const { store, advance } = createStore();
    await store.create(game("a"));

    advance(GAME_TTL_MS - 1);
    expect(await store.get("a")).toBeDefined();
    advance(GAME_TTL_MS - 1);

    expect(await store.get("a")).toBeDefined();
  });

  it("新しいゲームを作るときに期限切れのゲームを捨てる", async () => {
    const { store, advance } = createStore();
    await store.create(game("a"));
    advance(GAME_TTL_MS);

    await store.create(game("b"));

    // 期限切れの判定を経ずに中身を見るため、内部の Map を覗く。
    const games = (store as unknown as { games: Map<string, unknown> }).games;
    expect([...games.keys()]).toEqual(["b"]);
  });
});
