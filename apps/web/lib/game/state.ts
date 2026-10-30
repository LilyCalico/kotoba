import {
  type GameResult,
  type GameStart,
  type Hint,
  type InputResult,
  MAX_HINTS,
  type Verdict,
} from "@kotoba/shared";

import type { GameClientErrorCode } from "./client";

/**
 * プレイヤーの発言。入力欄からの送信と、ヒントボタンからの要求の 2 種がある。
 * ヒントの要求に添える文言は UI 言語で変わるため、状態には持たずコンポーネントが決める。
 */
export type PlayerMessage = { type: "text"; text: string } | { type: "hint-request" };

/**
 * チャットログに積まれる要素。コンポーネントはこの型だけを見て描画する。
 * `id` は追加した時点の `entries.length` で、要素は追記しかしないため一意になる。
 */
export type ChatEntry =
  | { id: string; kind: "player"; message: PlayerMessage }
  | { id: string; kind: "verdict"; verdict: Verdict }
  | { id: string; kind: "unsupported-language" }
  | { id: string; kind: "answer-feedback"; correct: boolean }
  | { id: string; kind: "hint"; hint: Hint }
  | { id: string; kind: "result"; result: GameResult }
  | { id: string; kind: "error"; code: GameClientErrorCode; retryAfterSeconds?: number }
  | { id: string; kind: "expired" };

type WithoutId<T> = T extends unknown ? Omit<T, "id"> : never;

/** `id` を除いた要素。reducer が採番して `ChatEntry` にする。 */
type NewEntry = WithoutId<ChatEntry>;

export type GameState = {
  gameId: string;
  teaser: string;
  /** `teaser` は設問だけを中央に置く提示の状態、`chat` はログと入力欄を持つ状態 */
  phase: "teaser" | "chat";
  /** `sending` は入力の送信とヒントの要求の応答待ち、`finished` はクリアかギブアップか期限切れの後 */
  status: "idle" | "sending" | "finished";
  hintsUsed: number;
  entries: ChatEntry[];
};

export type GameAction =
  | { type: "chat-entered" }
  | { type: "input-sent"; text: string }
  | { type: "hint-requested" }
  | { type: "input-resolved"; result: InputResult }
  | { type: "hint-revealed"; hint: Hint }
  | { type: "failed"; code: GameClientErrorCode; retryAfterSeconds?: number }
  | { type: "gave-up"; result: GameResult };

/**
 * 失敗の画面での扱い。`docs/specifications/api.md`「エラー」の「画面の扱い」に従う。
 *
 * - `retry`: 再送の案内を出し、同じ操作をやり直せる状態に戻す。案内の文言は `code` で変わる
 * - `expired`: ゲームが見つからない。案内を出してゲームを終え、始め直してもらう
 * - `ignored`: 画面側で操作を塞いでいるため通常は起きない。何も出さず応答待ちだけを解く
 */
export type FailureKind = "retry" | "expired" | "ignored";

export function failureKind(code: GameClientErrorCode): FailureKind {
  switch (code) {
    case "game_not_found":
      return "expired";
    case "game_finished":
    case "hint_out_of_order":
    case "hint_limit_reached":
      return "ignored";
    case "validation_error":
    case "rate_limited":
    case "internal_error":
    case "ai_unavailable":
    case "ai_rate_limited":
    case "network_error":
      return "retry";
  }
}

/** ゲーム開始直後の状態。設問の提示から始まる。 */
export function createGameState(start: GameStart): GameState {
  return {
    gameId: start.gameId,
    teaser: start.teaser,
    phase: "teaser",
    status: "idle",
    hintsUsed: 0,
    entries: [],
  };
}

/**
 * クリアかギブアップで終わったゲームの結果。進行中と期限切れでは何も返さない。
 * 正解とギブアップの応答が重なっても、先に届いた方だけが結果として積まれるため、1 ゲームにつき 1 つに決まる。
 */
export function finishedResult(state: GameState): GameResult | undefined {
  if (state.status !== "finished") return undefined;
  for (let index = state.entries.length - 1; index >= 0; index--) {
    const entry = state.entries[index];
    if (entry?.kind === "result") return entry.result;
  }
  return undefined;
}

/** ヒントの残回数。 */
export function remainingHints(hintsUsed: number): number {
  return MAX_HINTS - hintsUsed;
}

function append(state: GameState, ...entries: NewEntry[]): ChatEntry[] {
  const added = entries.map(
    (entry, offset) => ({ ...entry, id: String(state.entries.length + offset) }) as ChatEntry,
  );
  return [...state.entries, ...added];
}

function canSend(state: GameState): boolean {
  return state.phase === "chat" && state.status === "idle";
}

/**
 * ゲームの状態遷移。受け付けない状態で届いた操作は無視し、状態をそのまま返す。
 * 送信中にギブアップしたあと遅れて届いた応答も、`finished` のため無視される。
 * 失敗は `failureKind` で扱いを分ける。
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "chat-entered":
      if (state.phase !== "teaser") return state;
      return { ...state, phase: "chat" };

    case "input-sent":
      if (!canSend(state)) return state;
      return {
        ...state,
        status: "sending",
        entries: append(state, { kind: "player", message: { type: "text", text: action.text } }),
      };

    case "hint-requested":
      if (!canSend(state) || remainingHints(state.hintsUsed) <= 0) return state;
      return {
        ...state,
        status: "sending",
        entries: append(state, { kind: "player", message: { type: "hint-request" } }),
      };

    case "input-resolved": {
      if (state.status !== "sending") return state;

      const { result } = action;
      if (result.kind === "question") {
        return {
          ...state,
          status: "idle",
          entries: append(state, { kind: "verdict", verdict: result.verdict }),
        };
      }
      if (result.kind === "unsupported_language") {
        return {
          ...state,
          status: "idle",
          entries: append(state, { kind: "unsupported-language" }),
        };
      }
      if (!result.correct) {
        return {
          ...state,
          status: "idle",
          entries: append(state, { kind: "answer-feedback", correct: false }),
        };
      }
      return {
        ...state,
        status: "finished",
        entries: result.result
          ? append(
              state,
              { kind: "answer-feedback", correct: true },
              { kind: "result", result: result.result },
            )
          : append(state, { kind: "answer-feedback", correct: true }),
      };
    }

    case "hint-revealed":
      if (state.status !== "sending") return state;
      return {
        ...state,
        status: "idle",
        hintsUsed: state.hintsUsed + 1,
        entries: append(state, { kind: "hint", hint: action.hint }),
      };

    case "failed":
      // 期限切れはギブアップの失敗でも届くため、応答待ちでなくても終了前なら受け付ける。
      if (failureKind(action.code) === "expired") {
        if (state.status === "finished") return state;
        return { ...state, status: "finished", entries: append(state, { kind: "expired" }) };
      }
      if (state.status !== "sending") return state;
      if (failureKind(action.code) === "ignored") return { ...state, status: "idle" };
      return {
        ...state,
        status: "idle",
        entries: append(state, {
          kind: "error",
          code: action.code,
          ...(action.retryAfterSeconds === undefined
            ? {}
            : { retryAfterSeconds: action.retryAfterSeconds }),
        }),
      };

    case "gave-up":
      if (state.status === "finished") return state;
      return {
        ...state,
        status: "finished",
        entries: append(state, { kind: "result", result: action.result }),
      };
  }
}

/**
 * ライブリージョンで読み上げる要素の種類。
 * `error` はフォーカスを入力欄かヒントボタンへ戻すため表示そのものにフォーカスが当たらず、
 * 読み上げなければ非視覚では失敗に気づけないため対象に含める。
 */
export type AnnouncedEntry = Extract<
  ChatEntry,
  { kind: "verdict" | "unsupported-language" | "answer-feedback" | "error" }
>;

function isAnnounced(entry: ChatEntry | undefined): entry is AnnouncedEntry {
  return (
    entry?.kind === "verdict" ||
    entry?.kind === "unsupported-language" ||
    entry?.kind === "answer-feedback" ||
    entry?.kind === "error"
  );
}

/**
 * ライブリージョンに載せる要素。`entries` の中で最も新しい `verdict` か `unsupported-language` か
 * `answer-feedback` か `error` を返す。
 * 正解時は `answer-feedback` の後ろに `result` が積まれるが、このときも `answer-feedback` を返す。
 * 画面側は返された要素の `id` が変わったときだけ読み上げを更新し、同じ要素を二度読み上げない。
 */
export function latestAnnouncement(state: GameState): AnnouncedEntry | undefined {
  for (let index = state.entries.length - 1; index >= 0; index--) {
    const entry = state.entries[index];
    if (isAnnounced(entry)) return entry;
  }
  return undefined;
}
