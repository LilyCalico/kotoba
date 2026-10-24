import {
  type GameResult,
  MAX_HINTS,
  type Outcome,
  type UiLocale,
  type Word,
} from "@kotoba/shared";

import { type GameClient, GameClientError } from "./client";
import { findWordById, words } from "./fixtures";
import { resolveInput } from "./input";

/** 応答の既定の遅延。送信中・応答待ちの UI 状態を実画面で目視できる長さにとる。 */
export const DEFAULT_DELAY_MS = 500;

export type MockGameClientOptions = {
  /** 出題単語を固定する。未知の id はランダム選出にフォールバックする。言語の絞り込みと `excludeWordIds` より優先する */
  wordId?: string;
  /** 各メソッドの応答の前に挟む遅延。`0` なら待たない */
  delayMs?: number;
};

type MockGame = { word: Word; locale: UiLocale };

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

/**
 * プールから `excludeWordIds` を除き、ランダムに 1 語選ぶ。除いた結果が空ならプール全体から選ぶ。
 * サーバーと同じ除外の規則に従う。重み付けはせず、どの単語も同じ確率で選ぶ。
 */
export function pickWord<T extends { id: string }>(
  pool: readonly T[],
  excludeWordIds: readonly string[],
  random: () => number = Math.random,
): T {
  if (pool.length === 0) throw new Error("単語プールが空");

  const excluded = new Set(excludeWordIds);
  const rest = pool.filter((word) => !excluded.has(word.id));
  const candidates = rest.length > 0 ? rest : pool;

  const index = Math.min(Math.floor(random() * candidates.length), candidates.length - 1);
  return candidates[index] as T;
}

function resultOf({ word, locale }: MockGame, outcome: Outcome): GameResult {
  return { outcome, wordId: word.id, word: word.word, definition: word.definition[locale] };
}

/**
 * fixtures だけで `GameClient` を満たす実装。`apps/api` とは通信しない。
 * Storybook とユニットテストのフィクスチャとして使い、失敗は API と同じ `code` で投げる。
 */
export function createMockGameClient(options: MockGameClientOptions = {}): GameClient {
  const { wordId, delayMs = DEFAULT_DELAY_MS } = options;
  const games = new Map<string, MockGame>();

  function gameOf(gameId: string): MockGame {
    const game = games.get(gameId);
    if (!game) throw new GameClientError("game_not_found", `未知の gameId: ${gameId}`);
    return game;
  }

  return {
    async startGame({ language, locale = "en", excludeWordIds = [] }) {
      await wait(delayMs);

      const fixed = wordId === undefined ? undefined : findWordById(wordId);
      const pool = words.filter((word) => word.language === language);
      if (!fixed && pool.length === 0) {
        throw new GameClientError("validation_error", `${language} の単語がない`);
      }

      const word = fixed ?? pickWord(pool, excludeWordIds);
      const gameId = createGameId();
      games.set(gameId, { word, locale });
      return { gameId, language: word.language, teaser: word.teaser[locale] };
    },

    async sendInput(gameId, { text }) {
      await wait(delayMs);

      const game = gameOf(gameId);
      const result = resolveInput(game.word, text);
      if (result.kind === "answer" && result.correct) {
        return { ...result, result: resultOf(game, "cleared") };
      }
      return result;
    },

    async revealHint(gameId, index) {
      await wait(delayMs);

      const game = gameOf(gameId);
      if (!Number.isInteger(index) || index < 1) {
        throw new GameClientError("validation_error", `不正なヒント番号: ${index}`);
      }
      const text = game.word.hints[game.locale][index - 1];
      if (index > MAX_HINTS || text === undefined) {
        throw new GameClientError("hint_limit_reached", `範囲外のヒント番号: ${index}`);
      }
      return { index, text };
    },

    async giveUp(gameId) {
      await wait(delayMs);

      return resultOf(gameOf(gameId), "gave_up");
    },
  };
}
