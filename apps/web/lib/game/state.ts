import {
  type GameResult,
  type GameStart,
  type Hint,
  MAX_HINTS,
  type Verdict,
} from "@kotoba/shared";

/** チャットに積まれる要素。時系列の配列として描画する。 */
export type ChatEntry =
  | { id: string; kind: "player"; text: string }
  | { id: string; kind: "verdict"; verdict: Verdict }
  | { id: string; kind: "answer"; correct: boolean }
  | { id: string; kind: "hint"; hint: Hint }
  | { id: string; kind: "result"; result: GameResult }
  | { id: string; kind: "error" };

export type GameState = {
  /** 設問だけを見せる状態と、チャットの状態。 */
  phase: "teaser" | "chat";
  status: "idle" | "sending" | "finished";
  gameId: string;
  teaser: string;
  entries: ChatEntry[];
  hintsUsed: number;
};

export type GameAction =
  | { type: "enter-chat" }
  | { type: "send"; id: string; text: string }
  | { type: "verdict"; id: string; verdict: Verdict }
  | { type: "answer"; id: string; correct: boolean }
  | { type: "hint"; id: string; hint: Hint }
  | { type: "finish"; id: string; result: GameResult }
  | { type: "fail"; id: string };

export function createInitialState(start: GameStart): GameState {
  return {
    phase: "teaser",
    status: "idle",
    gameId: start.gameId,
    teaser: start.teaser,
    entries: [],
    hintsUsed: 0,
  };
}

export function remainingHints(hintsUsed: number): number {
  return Math.max(MAX_HINTS - hintsUsed, 0);
}

function append(state: GameState, entry: ChatEntry): ChatEntry[] {
  return [...state.entries, entry];
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "enter-chat":
      return state.phase === "chat" ? state : { ...state, phase: "chat" };

    case "send":
      return {
        ...state,
        phase: "chat",
        status: "sending",
        entries: append(state, {
          id: action.id,
          kind: "player",
          text: action.text,
        }),
      };

    case "verdict":
      return {
        ...state,
        status: "idle",
        entries: append(state, {
          id: action.id,
          kind: "verdict",
          verdict: action.verdict,
        }),
      };

    case "answer":
      return {
        ...state,
        status: action.correct ? "sending" : "idle",
        entries: append(state, {
          id: action.id,
          kind: "answer",
          correct: action.correct,
        }),
      };

    case "hint":
      return {
        ...state,
        status: "idle",
        hintsUsed: state.hintsUsed + 1,
        entries: append(state, {
          id: action.id,
          kind: "hint",
          hint: action.hint,
        }),
      };

    case "finish":
      return {
        ...state,
        phase: "chat",
        status: "finished",
        entries: append(state, {
          id: action.id,
          kind: "result",
          result: action.result,
        }),
      };

    case "fail":
      return {
        ...state,
        status: "idle",
        entries: append(state, { id: action.id, kind: "error" }),
      };
  }
}

export type ScreenAction = GameAction | { type: "start"; start: GameStart };

/**
 * ゲーム開始の応答を待つ間だけ状態が無い。
 * 開始後は `gameReducer` がそのまま引き継ぐ。
 */
export function screenReducer(
  state: GameState | null,
  action: ScreenAction,
): GameState | null {
  if (action.type === "start") return createInitialState(action.start);
  return state === null ? null : gameReducer(state, action);
}

/** 直近に確定した回答。ライブリージョンで読み上げ、フォーカスを移す対象になる。 */
export function latestAnnouncement(state: GameState): ChatEntry | undefined {
  return [...state.entries]
    .reverse()
    .find(
      (entry) =>
        entry.kind === "verdict" ||
        entry.kind === "answer" ||
        entry.kind === "result",
    );
}
