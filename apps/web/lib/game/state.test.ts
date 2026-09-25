import { MAX_HINTS } from "@kotoba/shared";
import { describe, expect, it } from "vitest";

import {
  createInitialState,
  type GameState,
  gameReducer,
  latestAnnouncement,
  remainingHints,
} from "./state";

const start = {
  gameId: "0d0f4c1e-9c1a-4a3a-9a6f-0a1f2b3c4d5e",
  language: "sv" as const,
  teaser: "On Friday night, this word lives on the sofa",
};

function stateAfter(
  ...actions: Parameters<typeof gameReducer>[1][]
): GameState {
  return actions.reduce(gameReducer, createInitialState(start));
}

describe("createInitialState", () => {
  it("設問だけを見せる状態から始まる", () => {
    const state = createInitialState(start);
    expect(state.phase).toBe("teaser");
    expect(state.status).toBe("idle");
    expect(state.entries).toEqual([]);
    expect(state.hintsUsed).toBe(0);
  });
});

describe("remainingHints", () => {
  it("使った分だけ残回数が減り、負の数にはならない", () => {
    expect(remainingHints(0)).toBe(MAX_HINTS);
    expect(remainingHints(MAX_HINTS)).toBe(0);
    expect(remainingHints(MAX_HINTS + 1)).toBe(0);
  });
});

describe("gameReducer", () => {
  it("送信でプレイヤーの発言を積み、応答待ちに入る", () => {
    const state = stateAfter({ type: "send", id: "a", text: "Is it cozy?" });
    expect(state.phase).toBe("chat");
    expect(state.status).toBe("sending");
    expect(state.entries).toEqual([
      { id: "a", kind: "player", text: "Is it cozy?" },
    ]);
  });

  it("回答を受け取ると応答待ちが解ける", () => {
    const state = stateAfter(
      { type: "send", id: "a", text: "Is it cozy?" },
      { type: "verdict", id: "b", verdict: "yes" },
    );
    expect(state.status).toBe("idle");
    expect(state.entries.at(-1)).toEqual({
      id: "b",
      kind: "verdict",
      verdict: "yes",
    });
  });

  it("誤答は何度でも積める", () => {
    const state = stateAfter(
      { type: "send", id: "a", text: "fika" },
      { type: "answer", id: "b", correct: false },
      { type: "send", id: "c", text: "mysig" },
      { type: "answer", id: "d", correct: false },
    );
    expect(state.status).toBe("idle");
    expect(state.entries.filter((entry) => entry.kind === "answer")).toHaveLength(2);
  });

  it("ヒントの開示で残回数が減る", () => {
    const state = stateAfter({
      type: "hint",
      id: "a",
      hint: { index: 1, text: "The word is tied to one day of the week" },
    });
    expect(state.hintsUsed).toBe(1);
    expect(remainingHints(state.hintsUsed)).toBe(MAX_HINTS - 1);
  });

  it("終了すると status が finished になる", () => {
    const state = stateAfter({
      type: "finish",
      id: "a",
      result: {
        outcome: "gave_up",
        word: "Fredagsmys",
        definition: "The habit of settling onto the sofa on a Friday night.",
      },
    });
    expect(state.status).toBe("finished");
    expect(state.entries.at(-1)?.kind).toBe("result");
  });

  it("失敗はエラーを積んで同じ入力を送り直せる状態に戻す", () => {
    const state = stateAfter(
      { type: "send", id: "a", text: "Is it cozy?" },
      { type: "fail", id: "b" },
    );
    expect(state.status).toBe("idle");
    expect(state.entries.at(-1)).toEqual({ id: "b", kind: "error" });
  });

  it("正解から結果表示までは応答待ちを保つ", () => {
    const answered = stateAfter(
      { type: "send", id: "a", text: "fredagsmys" },
      { type: "answer", id: "b", correct: true },
    );
    expect(answered.status).toBe("sending");
  });
});

describe("latestAnnouncement", () => {
  it("直近に確定した回答だけを拾う", () => {
    const state = stateAfter(
      { type: "send", id: "a", text: "Is it cozy?" },
      { type: "verdict", id: "b", verdict: "yes" },
      {
        type: "hint",
        id: "c",
        hint: { index: 1, text: "The word is tied to one day of the week" },
      },
    );
    expect(latestAnnouncement(state)?.id).toBe("b");
  });

  it("確定した回答がなければ何も返さない", () => {
    expect(latestAnnouncement(createInitialState(start))).toBeUndefined();
  });
});
