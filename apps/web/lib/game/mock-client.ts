import { type GameResult, MAX_HINTS, type Outcome, type Word } from "@kotoba/shared";

import { type GameClient, GameClientError } from "./client";
import { findWordById, words } from "./fixtures";
import { resolveInput } from "./input";
import {
  type PlayedWordsStorage,
  getBrowserStorage,
  pickWord,
  recordPlayedWord,
} from "./played-words";

/** 応答の既定の遅延。送信中・応答待ちの UI 状態を実画面で目視できる長さにとる。 */
export const DEFAULT_DELAY_MS = 500;

export type MockGameClientOptions = {
  /** 出題単語を固定する。未知の id はランダム選出にフォールバックする。言語の絞り込みより優先する */
  wordId?: string;
  /** 各メソッドの応答の前に挟む遅延。`0` なら待たない */
  delayMs?: number;
  /** 出題済み単語の読み書き先。省略するとブラウザの `localStorage` を使う */
  storage?: PlayedWordsStorage | null;
};

function wait(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * UUID v4 を作る。
 * `crypto.randomUUID` は安全なコンテキストでしか使えないため、http の LAN アドレスから
 * 実機で開いたときは `crypto.getRandomValues` から組み立てる。
 */
function createGameId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function resultOf(word: Word, outcome: Outcome): GameResult {
  return { outcome, wordId: word.id, word: word.word, definition: word.definition.en };
}

/**
 * fixtures だけで `GameClient` を満たす実装。`apps/api` とは通信しない。
 * 画面は英語だけを使うため、ティーザー・ヒント・定義は `en` を返す。
 */
export function createMockGameClient(options: MockGameClientOptions = {}): GameClient {
  const { wordId, delayMs = DEFAULT_DELAY_MS } = options;
  const storage = options.storage === undefined ? getBrowserStorage() : options.storage;
  const games = new Map<string, Word>();

  function wordOf(gameId: string): Word {
    const word = games.get(gameId);
    if (!word) throw new GameClientError(`未知の gameId: ${gameId}`);
    return word;
  }

  return {
    async startGame(language) {
      await wait(delayMs);

      const fixed = wordId === undefined ? undefined : findWordById(wordId);
      const pool = words.filter((word) => word.language === language);
      if (!fixed && pool.length === 0) {
        throw new GameClientError(`${language} の単語がない`);
      }

      const word = fixed ?? pickWord(pool, storage);
      const gameId = createGameId();
      games.set(gameId, word);
      return { gameId, language: word.language, teaser: word.teaser.en };
    },

    async sendInput(gameId, { text }) {
      await wait(delayMs);

      const word = wordOf(gameId);
      const result = resolveInput(word, text);
      if (result.kind === "answer" && result.correct) {
        recordPlayedWord(storage, word.id);
        return { ...result, result: resultOf(word, "cleared") };
      }
      return result;
    },

    async revealHint(gameId, index) {
      await wait(delayMs);

      const word = wordOf(gameId);
      const text = word.hints.en[index - 1];
      if (!Number.isInteger(index) || index < 1 || index > MAX_HINTS || text === undefined) {
        throw new GameClientError(`範囲外のヒント番号: ${index}`);
      }
      return { index, text };
    },

    async giveUp(gameId) {
      await wait(delayMs);

      const word = wordOf(gameId);
      recordPlayedWord(storage, word.id);
      return resultOf(word, "gave_up");
    },
  };
}
