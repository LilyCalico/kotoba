import {
  type GameResult,
  type GameStart,
  type Hint,
  type InputResult,
  type Language,
  MAX_HINTS,
  type PlayerInput,
  playerInputSchema,
  type Word,
} from "@kotoba/shared";

import { type GameClient, GameClientError } from "./client";
import { findWordById, rulesFor, words } from "./fixtures";
import { resolveInput } from "./input";
import {
  markPlayed,
  pickWord,
  readPlayedWords,
  writePlayedWords,
} from "./played-words";

/** 文言はすべて英語なので、単語のテキストも英語面だけを使う。 */
const LOCALE = "en" as const;

const DEFAULT_DELAY_MS = 400;

export type MockGameClientOptions = {
  /** 出題する単語を固定する。未知の id はランダム選出に落ちる。 */
  wordId?: string;
  delayMs?: number;
  random?: () => number;
  storage?: Storage;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function toResult(word: Word, outcome: GameResult["outcome"]): GameResult {
  return {
    outcome,
    word: word.word,
    definition: word.definition[LOCALE],
  };
}

/**
 * const だけでゲーム 1 周を成立させる `GameClient`。
 * 秘密の単語はこのモジュールの中に閉じ、開示済みのヒントと終了時の結果だけを返す。
 */
export function createMockGameClient(
  options: MockGameClientOptions = {},
): GameClient {
  const {
    wordId,
    delayMs = DEFAULT_DELAY_MS,
    random = Math.random,
    storage = typeof window === "undefined" ? undefined : window.localStorage,
  } = options;

  const games = new Map<string, Word>();

  function wordFor(gameId: string): Word {
    const word = games.get(gameId);
    if (!word) throw new GameClientError("進行中のゲームが見つからない");
    return word;
  }

  function recordPlayed(word: Word): void {
    const played = readPlayedWords(storage);
    writePlayedWords(storage, markPlayed(played, words, word.id));
  }

  return {
    async startGame(language: Language): Promise<GameStart> {
      await sleep(delayMs);

      const pool = words.filter((word) => word.language === language);
      if (pool.length === 0) {
        throw new GameClientError("出題できる単語がない");
      }

      const preferred = wordId ? findWordById(wordId) : undefined;
      const word =
        preferred && preferred.language === language
          ? preferred
          : pickWord(pool, readPlayedWords(storage), random);

      const gameId = crypto.randomUUID();
      games.set(gameId, word);

      return { gameId, language, teaser: word.teaser[LOCALE] };
    },

    async sendInput(input: PlayerInput): Promise<InputResult> {
      const { gameId, text } = playerInputSchema.parse(input);
      const word = wordFor(gameId);

      await sleep(delayMs);

      const resolved = resolveInput(word, rulesFor(word.id), text);
      if (resolved.kind === "question") {
        return { kind: "question", verdict: resolved.verdict };
      }
      if (!resolved.correct) {
        return { kind: "answer", correct: false };
      }

      recordPlayed(word);
      return {
        kind: "answer",
        correct: true,
        result: toResult(word, "cleared"),
      };
    },

    async revealHint(gameId: string, index: number): Promise<Hint> {
      const word = wordFor(gameId);
      if (!Number.isInteger(index) || index < 1 || index > MAX_HINTS) {
        throw new GameClientError("ヒントの番号が範囲外");
      }

      await sleep(delayMs);

      return { index, text: word.hints[LOCALE][index - 1] };
    },

    async giveUp(gameId: string): Promise<GameResult> {
      const word = wordFor(gameId);

      await sleep(delayMs);

      recordPlayed(word);
      return toResult(word, "gave_up");
    },
  };
}
