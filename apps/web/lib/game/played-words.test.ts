import { describe, expect, it } from "vitest";

import { words } from "./fixtures";
import {
  markPlayed,
  pickWord,
  PLAYED_WORDS_KEY,
  readPlayedWords,
  selectableWords,
  writePlayedWords,
} from "./played-words";

const ids = words.map((word) => word.id);

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));

  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => [...map.keys()][index] ?? null,
    removeItem: (key) => {
      map.delete(key);
    },
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

describe("markPlayed", () => {
  it("答えを見た単語を追記する", () => {
    expect(markPlayed([], words, ids[0])).toEqual([ids[0]]);
  });

  it("同じ単語を二重に記録しない", () => {
    expect(markPlayed([ids[0]], words, ids[0])).toEqual([ids[0]]);
  });

  it("プールを出し尽くしたら空に戻す", () => {
    const beforeLast = ids.slice(0, -1);
    expect(markPlayed(beforeLast, words, ids[ids.length - 1])).toEqual([]);
  });
});

describe("selectableWords", () => {
  it("出題済みを候補から外す", () => {
    const candidates = selectableWords(words, [ids[0]]);
    expect(candidates.map((word) => word.id)).not.toContain(ids[0]);
  });

  it("候補が尽きたらプール全体に戻す", () => {
    expect(selectableWords(words, ids)).toHaveLength(words.length);
  });
});

describe("pickWord", () => {
  it("候補の中から乱数に応じた 1 語を返す", () => {
    const candidates = selectableWords(words, []);
    expect(pickWord(words, [], () => 0).id).toBe(candidates[0].id);
    expect(pickWord(words, [], () => 0.999).id).toBe(
      candidates[candidates.length - 1].id,
    );
  });

  it("出題済みの単語は選ばない", () => {
    const played = ids.slice(0, -1);
    expect(pickWord(words, played, () => 0).id).toBe(ids[ids.length - 1]);
  });
});

describe("readPlayedWords / writePlayedWords", () => {
  it("書いた内容をそのまま読み戻す", () => {
    const storage = memoryStorage();
    writePlayedWords(storage, [ids[0]]);
    expect(readPlayedWords(storage)).toEqual([ids[0]]);
  });

  it("storage が無い環境では空を返す", () => {
    expect(readPlayedWords(undefined)).toEqual([]);
  });

  it("壊れた値は空として扱う", () => {
    expect(readPlayedWords(memoryStorage({ [PLAYED_WORDS_KEY]: "{" }))).toEqual(
      [],
    );
    expect(
      readPlayedWords(memoryStorage({ [PLAYED_WORDS_KEY]: '{"a":1}' })),
    ).toEqual([]);
    expect(
      readPlayedWords(memoryStorage({ [PLAYED_WORDS_KEY]: '["a", 2]' })),
    ).toEqual(["a"]);
  });
});
