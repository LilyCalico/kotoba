import {
  type GameResult,
  type GameStart,
  type Hint,
  type InputResult,
  MAX_HINTS,
  type Verdict,
} from "@kotoba/shared";

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
  | { id: string; kind: "answer-feedback"; correct: boolean }
  | { id: string; kind: "hint"; hint: Hint }
  | { id: string; kind: "result"; result: GameResult }
  | { id: string; kind: "error" };

type WithoutId<T> = T extends unknown ? Omit<T, "id"> : never;

/** `id` を除いた要素。reducer が採番して `ChatEntry` にする。 */
type NewEntry = WithoutId<ChatEntry>;

export type GameState = {
  gameId: string;
  teaser: string;
  /** `teaser` は設問だけを中央に置く提示の状態、`chat` はログと入力欄を持つ状態 */
  phase: "teaser" | "chat";
  /** `sending` は入力の送信とヒントの要求の応答待ち、`finished` はクリアかギブアップの後 */
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
  | { type: "failed" }
  | { type: "gave-up"; result: GameResult };

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
      if (state.status !== "sending") return state;
      return { ...state, status: "idle", entries: append(state, { kind: "error" }) };

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
export type AnnouncedEntry = Extract<ChatEntry, { kind: "verdict" | "answer-feedback" | "error" }>;

function isAnnounced(entry: ChatEntry | undefined): entry is AnnouncedEntry {
  return entry?.kind === "verdict" || entry?.kind === "answer-feedback" || entry?.kind === "error";
}

/**
 * ライブリージョンに載せる要素。`entries` の中で最も新しい `verdict` か `answer-feedback` か `error` を返す。
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
