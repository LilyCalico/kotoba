/** 出題済み単語の id を保存するキー。 */
export const PLAYED_WORDS_KEY = "kotoba:played-words";

/**
 * 出題済み単語を読み書きする口。`window.localStorage` をそのまま渡せる。
 * `null` は `window` の無い環境を表し、読み書きを行わず空として振る舞う。
 */
export type PlayedWordsStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

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
 * 答えを見た単語の id を読む。
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
 * 答えを見た単語の id を追記する。クリアとギブアップのときにだけ呼ぶ。
 * 記録済みの id は重ねない。書き込めなかったときは記録を諦め、出題は止めない。
 */
export function recordPlayedWord(storage: PlayedWordsStorage | null, id: string): void {
  if (!storage) return;

  const played = readPlayedWords(storage);
  if (played.includes(id)) return;
  try {
    storage.setItem(PLAYED_WORDS_KEY, JSON.stringify([...played, id]));
  } catch {
    // 容量超過やプライベートモードでは記録できない。
  }
}

function clearPlayedWords(storage: PlayedWordsStorage | null): void {
  try {
    storage?.removeItem(PLAYED_WORDS_KEY);
  } catch {
    // 消せなくても、呼び出し側はプール全体から選び直す。
  }
}

/**
 * プールから記録済みの単語を除き、ランダムに 1 語選ぶ。
 * プールの全語が記録済みならリストを空に戻し、プール全体から選び直す。
 * プールに無い id が記録に残っていても、枯渇の判定には数えない。
 */
export function pickWord<T extends { id: string }>(
  pool: readonly T[],
  storage: PlayedWordsStorage | null,
  random: () => number = Math.random,
): T {
  if (pool.length === 0) throw new Error("単語プールが空");

  const played = new Set(readPlayedWords(storage));
  let candidates = pool.filter((word) => !played.has(word.id));
  if (candidates.length === 0) {
    clearPlayedWords(storage);
    candidates = [...pool];
  }

  const index = Math.min(Math.floor(random() * candidates.length), candidates.length - 1);
  return candidates[index] as T;
}
