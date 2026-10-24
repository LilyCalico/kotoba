import { type GameResult, type GameStart, MAX_HINTS } from "@kotoba/shared";
import { describe, expect, it } from "vitest";
import {
  type GameAction,
  type GameState,
  createGameState,
  failureKind,
  gameReducer,
  latestAnnouncement,
  remainingHints,
} from "./state";

const start: GameStart = {
  gameId: "00000000-0000-4000-8000-000000000000",
  language: "sv",
  teaser: "On Friday night, this word lives on the sofa",
};

const cleared: GameResult = {
  outcome: "cleared",
  wordId: "fredagsmys",
  word: "Fredagsmys",
  definition: "The habit of settling onto the sofa on a Friday night.",
};

const gaveUp: GameResult = { ...cleared, outcome: "gave_up" };

/** 再送を促す失敗。 */
const failed: GameAction = { type: "failed", code: "network_error" };
/** ゲームが見つからない失敗。 */
const expired: GameAction = { type: "failed", code: "game_not_found" };

function run(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, state);
}

/** チャットへ移った直後の状態。 */
const chat = run(createGameState(start), { type: "chat-entered" });

describe("createGameState", () => {
  it("設問の提示から始まる", () => {
    expect(createGameState(start)).toEqual({
      gameId: start.gameId,
      teaser: start.teaser,
      phase: "teaser",
      status: "idle",
      hintsUsed: 0,
      entries: [],
    });
  });
});

describe("gameReducer", () => {
  it("設問の提示からチャットへ移る", () => {
    expect(chat.phase).toBe("chat");
    expect(chat.status).toBe("idle");
  });

  it("設問の提示の間は送信を受け付けない", () => {
    const teaser = createGameState(start);

    expect(gameReducer(teaser, { type: "input-sent", text: "Is it a noun?" })).toBe(teaser);
    expect(gameReducer(teaser, { type: "hint-requested" })).toBe(teaser);
  });

  it("入力の送信はプレイヤーの発言を積んでから sending に入る", () => {
    const state = gameReducer(chat, { type: "input-sent", text: "Is it a noun?" });

    expect(state.status).toBe("sending");
    expect(state.entries).toEqual([
      { id: "0", kind: "player", message: { type: "text", text: "Is it a noun?" } },
    ]);
  });

  it("質問の応答は verdict を積んで idle に戻る", () => {
    const state = run(
      chat,
      { type: "input-sent", text: "Is it a noun?" },
      { type: "input-resolved", result: { kind: "question", verdict: "yes" } },
    );

    expect(state.status).toBe("idle");
    expect(state.entries.at(-1)).toEqual({ id: "1", kind: "verdict", verdict: "yes" });
  });

  it("誤答は answer-feedback を積んで idle に戻る", () => {
    const state = run(
      chat,
      { type: "input-sent", text: "fika" },
      { type: "input-resolved", result: { kind: "answer", correct: false } },
    );

    expect(state.status).toBe("idle");
    expect(state.entries.at(-1)).toEqual({ id: "1", kind: "answer-feedback", correct: false });
  });

  it("正解は answer-feedback と result を続けて積み、finished に入る", () => {
    const state = run(
      chat,
      { type: "input-sent", text: "fredagsmys" },
      { type: "input-resolved", result: { kind: "answer", correct: true, result: cleared } },
    );

    expect(state.status).toBe("finished");
    expect(state.entries.slice(1)).toEqual([
      { id: "1", kind: "answer-feedback", correct: true },
      { id: "2", kind: "result", result: cleared },
    ]);
  });

  it("ヒントの要求はプレイヤーの発言を積んでから hint を積み、hintsUsed を増やす", () => {
    const hint = { index: 1, text: "The word is tied to one particular day of the week" };
    const requested = gameReducer(chat, { type: "hint-requested" });

    expect(requested.status).toBe("sending");
    expect(requested.entries).toEqual([
      { id: "0", kind: "player", message: { type: "hint-request" } },
    ]);

    const revealed = gameReducer(requested, { type: "hint-revealed", hint });

    expect(revealed.status).toBe("idle");
    expect(revealed.hintsUsed).toBe(1);
    expect(revealed.entries.at(-1)).toEqual({ id: "1", kind: "hint", hint });
  });

  it("ヒントを使い切ると要求を受け付けない", () => {
    let state = chat;
    for (let index = 1; index <= MAX_HINTS; index++) {
      state = run(
        state,
        { type: "hint-requested" },
        { type: "hint-revealed", hint: { index, text: `hint ${index}` } },
      );
    }

    expect(state.hintsUsed).toBe(MAX_HINTS);
    expect(gameReducer(state, { type: "hint-requested" })).toBe(state);
  });

  it("失敗は error を積んで idle に戻り、同じ操作で再送できる", () => {
    const state = run(chat, { type: "input-sent", text: "Is it a noun?" }, failed);

    expect(state.status).toBe("idle");
    expect(state.entries.at(-1)).toEqual({ id: "1", kind: "error" });

    const retried = run(
      state,
      { type: "input-sent", text: "Is it a noun?" },
      { type: "input-resolved", result: { kind: "question", verdict: "no" } },
    );

    expect(retried.entries.map((entry) => entry.kind)).toEqual([
      "player",
      "error",
      "player",
      "verdict",
    ]);
  });

  it("ヒントの要求の失敗では hintsUsed を増やさない", () => {
    const state = run(chat, { type: "hint-requested" }, failed);

    expect(state.hintsUsed).toBe(0);
    expect(state.status).toBe("idle");
  });

  it("画面で塞いでいるはずの失敗は、何も積まずに idle に戻る", () => {
    const sending = gameReducer(chat, { type: "hint-requested" });

    for (const code of ["game_finished", "hint_out_of_order", "hint_limit_reached"] as const) {
      const state = gameReducer(sending, { type: "failed", code });

      expect(state.status).toBe("idle");
      expect(state.entries).toEqual(sending.entries);
    }
  });

  it("ゲームが見つからないと expired を積んで finished に入る", () => {
    const state = run(chat, { type: "input-sent", text: "Is it a noun?" }, expired);

    expect(state.status).toBe("finished");
    expect(state.entries.at(-1)).toEqual({ id: "1", kind: "expired" });
    expect(gameReducer(state, { type: "input-sent", text: "fika" })).toBe(state);
  });

  it("ゲームが見つからない失敗は、ギブアップのように sending でなくても受け付ける", () => {
    const state = gameReducer(chat, expired);

    expect(state.status).toBe("finished");
    expect(state.entries).toEqual([{ id: "0", kind: "expired" }]);
    expect(gameReducer(state, expired)).toBe(state);
  });

  it("ギブアップは result を積んで finished に入る", () => {
    const state = gameReducer(chat, { type: "gave-up", result: gaveUp });

    expect(state.status).toBe("finished");
    expect(state.entries).toEqual([{ id: "0", kind: "result", result: gaveUp }]);
  });

  it("sending の間は次の送信とヒントの要求を受け付けない", () => {
    const sending = gameReducer(chat, { type: "input-sent", text: "Is it a noun?" });

    expect(gameReducer(sending, { type: "input-sent", text: "Is it a verb?" })).toBe(sending);
    expect(gameReducer(sending, { type: "hint-requested" })).toBe(sending);
  });

  it("sending でないときに届いた応答と失敗は無視する", () => {
    expect(
      gameReducer(chat, { type: "input-resolved", result: { kind: "question", verdict: "yes" } }),
    ).toBe(chat);
    expect(gameReducer(chat, { type: "hint-revealed", hint: { index: 1, text: "hint" } })).toBe(
      chat,
    );
    expect(gameReducer(chat, failed)).toBe(chat);
  });

  it("送信中にギブアップしたあと遅れて届いた応答は無視する", () => {
    const finished = run(
      chat,
      { type: "input-sent", text: "Is it a noun?" },
      { type: "gave-up", result: gaveUp },
    );

    expect(finished.status).toBe("finished");
    expect(
      gameReducer(finished, {
        type: "input-resolved",
        result: { kind: "question", verdict: "yes" },
      }),
    ).toBe(finished);
    expect(gameReducer(finished, failed)).toBe(finished);
  });

  it("finished の後は操作を受け付けない", () => {
    const finished = gameReducer(chat, { type: "gave-up", result: gaveUp });

    expect(gameReducer(finished, { type: "input-sent", text: "fika" })).toBe(finished);
    expect(gameReducer(finished, { type: "hint-requested" })).toBe(finished);
    expect(gameReducer(finished, { type: "gave-up", result: gaveUp })).toBe(finished);
  });

  it("要素の id はログの中で一意になる", () => {
    const state = run(
      chat,
      { type: "input-sent", text: "Is it a noun?" },
      { type: "input-resolved", result: { kind: "question", verdict: "yes" } },
      { type: "hint-requested" },
      { type: "hint-revealed", hint: { index: 1, text: "hint" } },
      { type: "input-sent", text: "fredagsmys" },
      { type: "input-resolved", result: { kind: "answer", correct: true, result: cleared } },
    );
    const ids = state.entries.map((entry) => entry.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("元の状態を書き換えない", () => {
    const before = structuredClone(chat);

    gameReducer(chat, { type: "input-sent", text: "Is it a noun?" });

    expect(chat).toEqual(before);
  });
});

describe("remainingHints", () => {
  it("MAX_HINTS から使った回数を引く", () => {
    expect(remainingHints(0)).toBe(3);
    expect(remainingHints(1)).toBe(2);
    expect(remainingHints(2)).toBe(1);
    expect(remainingHints(3)).toBe(0);
  });
});

describe("latestAnnouncement", () => {
  it("要素が 1 件もなければ undefined を返す", () => {
    expect(latestAnnouncement(chat)).toBeUndefined();
  });

  it("verdict も answer-feedback も error もなければ undefined を返す", () => {
    const state = run(
      chat,
      { type: "hint-requested" },
      { type: "hint-revealed", hint: { index: 1, text: "hint" } },
      { type: "input-sent", text: "Is it a noun?" },
    );

    expect(latestAnnouncement(state)).toBeUndefined();
  });

  it("hint / player を飛ばして最新の verdict を返す", () => {
    const state = run(
      chat,
      { type: "input-sent", text: "Is it a noun?" },
      { type: "input-resolved", result: { kind: "question", verdict: "yes" } },
      { type: "hint-requested" },
      { type: "hint-revealed", hint: { index: 1, text: "hint" } },
      { type: "input-sent", text: "Is it a verb?" },
    );

    expect(latestAnnouncement(state)).toEqual({ id: "1", kind: "verdict", verdict: "yes" });
  });

  it("verdict より新しい error を返す", () => {
    const state = run(
      chat,
      { type: "input-sent", text: "Is it a noun?" },
      { type: "input-resolved", result: { kind: "question", verdict: "yes" } },
      { type: "input-sent", text: "Is it a verb?" },
      failed,
    );

    expect(latestAnnouncement(state)).toEqual({ id: "3", kind: "error" });
  });

  it("ヒントの失敗も error として返す", () => {
    const state = run(chat, { type: "hint-requested" }, failed);

    expect(latestAnnouncement(state)).toEqual({ id: "1", kind: "error" });
  });

  it("verdict より新しい answer-feedback を返す", () => {
    const state = run(
      chat,
      { type: "input-sent", text: "Is it a noun?" },
      { type: "input-resolved", result: { kind: "question", verdict: "yes" } },
      { type: "input-sent", text: "fika" },
      { type: "input-resolved", result: { kind: "answer", correct: false } },
    );

    expect(latestAnnouncement(state)).toEqual({
      id: "3",
      kind: "answer-feedback",
      correct: false,
    });
  });

  it("正解時は末尾の result を飛ばして answer-feedback を返す", () => {
    const state = run(
      chat,
      { type: "input-sent", text: "fredagsmys" },
      { type: "input-resolved", result: { kind: "answer", correct: true, result: cleared } },
    );

    expect(state.entries.at(-1)?.kind).toBe("result");
    expect(latestAnnouncement(state)).toEqual({ id: "1", kind: "answer-feedback", correct: true });
  });

  it("ギブアップの result は読み上げの対象にしない", () => {
    const state = run(
      chat,
      { type: "input-sent", text: "Is it a noun?" },
      { type: "input-resolved", result: { kind: "question", verdict: "no" } },
      { type: "gave-up", result: gaveUp },
    );

    expect(latestAnnouncement(state)).toEqual({ id: "1", kind: "verdict", verdict: "no" });
  });
});

describe("failureKind", () => {
  it("api.md の「画面の扱い」に従って失敗を分ける", () => {
    expect(failureKind("game_not_found")).toBe("expired");
    for (const code of ["game_finished", "hint_out_of_order", "hint_limit_reached"] as const) {
      expect(failureKind(code)).toBe("ignored");
    }
    for (const code of [
      "validation_error",
      "rate_limited",
      "internal_error",
      "ai_unavailable",
      "network_error",
    ] as const) {
      expect(failureKind(code)).toBe("retry");
    }
  });
});
