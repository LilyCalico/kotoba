import type { Word } from "@kotoba/shared";

export const PLAYED_WORDS_KEY = "kotoba:played-words";

/**
 * 答えを見た単語の id。
 * プールを出し尽くした時点で空に戻し、そこからまた一周させる。
 */
export function markPlayed(
  played: readonly string[],
  pool: readonly Word[],
  wordId: string,
): string[] {
  const next = played.includes(wordId) ? [...played] : [...played, wordId];
  const covered = pool.every((word) => next.includes(word.id));

  return covered ? [] : next;
}

/** 出題の候補。未出題が残っていればそれだけを、尽きていればプール全体を返す。 */
export function selectableWords(
  pool: readonly Word[],
  played: readonly string[],
): readonly Word[] {
  const remaining = pool.filter((word) => !played.includes(word.id));
  return remaining.length > 0 ? remaining : pool;
}

/** `random` は 0 以上 1 未満を返す。テストから固定値を渡せるように外から受け取る。 */
export function pickWord(
  pool: readonly Word[],
  played: readonly string[],
  random: () => number,
): Word {
  const candidates = selectableWords(pool, played);
  const index = Math.min(
    Math.floor(random() * candidates.length),
    candidates.length - 1,
  );

  return candidates[index];
}

export function readPlayedWords(storage: Storage | undefined): string[] {
  if (!storage) return [];

  try {
    const raw = storage.getItem(PLAYED_WORDS_KEY);
    if (raw === null) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function writePlayedWords(
  storage: Storage | undefined,
  played: readonly string[],
): void {
  if (!storage) return;

  try {
    storage.setItem(PLAYED_WORDS_KEY, JSON.stringify(played));
  } catch {
    return;
  }
}
