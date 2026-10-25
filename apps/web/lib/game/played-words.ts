import { MAX_EXCLUDE_WORD_IDS } from "@kotoba/shared";

/** 出題済み単語の id を保存するキー。 */
export const PLAYED_WORDS_KEY = "kotoba:played-words";

/**
 * 出題済み単語を読み書きする口。`window.localStorage` をそのまま渡せる。
 * `null` は `window` の無い環境を表し、読み書きを行わず空として振る舞う。
 */
export type PlayedWordsStorage = Pick<Storage, "getItem" | "setItem">;

/**
 * ブラウザの `localStorage` を返す。`window` が無い、またはアクセスを拒まれたときは `null`。
 */
export function getBrowserStorage(): PlayedWordsStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * 答えを見た単語の id を、答えを見た順に読む。
 * JSON として読めない値や配列でない値は空として扱い、配列の中の文字列でない要素は捨てる。
 */
export function readPlayedWords(storage: PlayedWordsStorage | null): string[] {
  if (!storage) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(storage.getItem(PLAYED_WORDS_KEY) ?? "[]");
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((id): id is string => typeof id === "string");
}

/**
 * ゲーム開始時に送る `excludeWordIds`。記録のうち新しいものから最大 100 件を返す。
 * プールが 100 語を超えても、直近 100 語との重複は避けられる。
 */
export function excludedWordIds(storage: PlayedWordsStorage | null): string[] {
  return readPlayedWords(storage).slice(-MAX_EXCLUDE_WORD_IDS).reverse();
}

/**
 * 答えを見た単語の id を記録する。クリアとギブアップのときにだけ呼ぶ。
 *
 * 記録に無ければ末尾に追記し、新しいものから最大 100 件だけを残す。記録は送る `excludeWordIds` と同じ範囲に
 * なり、記録にある単語はサーバーが除外しているため、出題されるのは除外しきれなかったとき、つまりプールを一巡したときに限る。
 * このときは記録をその 1 件だけに戻し、次の一巡の重複除外をやり直す。
 * 書き込めなかったときは記録を諦め、出題は止めない。
 */
export function recordPlayedWord(storage: PlayedWordsStorage | null, id: string): void {
  if (!storage) return;

  const played = readPlayedWords(storage);
  const next = played.includes(id) ? [id] : [...played, id].slice(-MAX_EXCLUDE_WORD_IDS);
  try {
    storage.setItem(PLAYED_WORDS_KEY, JSON.stringify(next));
  } catch {
    // 容量超過やプライベートモードでは記録できない。
  }
}
