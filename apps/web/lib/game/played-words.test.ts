import { describe, expect, it } from "vitest";
import { words } from "./fixtures";
import {
  PLAYED_WORDS_KEY,
  type PlayedWordsStorage,
  getBrowserStorage,
  pickWord,
  readPlayedWords,
  recordPlayedWord,
} from "./played-words";

class MemoryStorage implements PlayedWordsStorage {
  readonly items = new Map<string, string>();

  getItem(key: string): string | null {
    return this.items.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.items.set(key, value);
  }

  removeItem(key: string): void {
    this.items.delete(key);
  }
}

/** どの操作も例外を投げる。アクセスを拒まれた `localStorage` を模す。 */
const brokenStorage: PlayedWordsStorage = {
  getItem: () => {
    throw new Error("denied");
  },
  setItem: () => {
    throw new Error("denied");
  },
  removeItem: () => {
    throw new Error("denied");
  },
};

function storageWith(value: string): MemoryStorage {
  const storage = new MemoryStorage();
  storage.setItem(PLAYED_WORDS_KEY, value);
  return storage;
}

const pool = [{ id: "a" }, { id: "b" }, { id: "c" }];

/** 候補の先頭を選ぶ乱数。 */
const first = () => 0;
/** 候補の末尾を選ぶ乱数。 */
const last = () => 0.999_999;

describe("readPlayedWords", () => {
  it("保存が無ければ空を返す", () => {
    expect(readPlayedWords(new MemoryStorage())).toEqual([]);
  });

  it("保存された id の配列を返す", () => {
    expect(readPlayedWords(storageWith('["a","b"]'))).toEqual(["a", "b"]);
  });

  it("JSON として読めない値を空として扱う", () => {
    expect(readPlayedWords(storageWith("{not json"))).toEqual([]);
  });

  it("配列でない値を空として扱う", () => {
    expect(readPlayedWords(storageWith('{"a":true}'))).toEqual([]);
    expect(readPlayedWords(storageWith('"a"'))).toEqual([]);
    expect(readPlayedWords(storageWith("null"))).toEqual([]);
  });

  it("配列の中の文字列でない要素を捨てる", () => {
    expect(readPlayedWords(storageWith('["a",1,null,{"id":"b"},"c"]'))).toEqual(["a", "c"]);
  });

  it("storage が無ければ空を返す", () => {
    expect(readPlayedWords(null)).toEqual([]);
  });

  it("読み出しが例外を投げたら空を返す", () => {
    expect(readPlayedWords(brokenStorage)).toEqual([]);
  });
});

describe("recordPlayedWord", () => {
  it("id を追記する", () => {
    const storage = new MemoryStorage();

    recordPlayedWord(storage, "a");
    recordPlayedWord(storage, "b");

    expect(storage.getItem(PLAYED_WORDS_KEY)).toBe('["a","b"]');
  });

  it("同じ id を重ねない", () => {
    const storage = new MemoryStorage();

    recordPlayedWord(storage, "a");
    recordPlayedWord(storage, "a");

    expect(readPlayedWords(storage)).toEqual(["a"]);
  });

  it("壊れた保存値は捨てて書き直す", () => {
    const storage = storageWith("{not json");

    recordPlayedWord(storage, "a");

    expect(readPlayedWords(storage)).toEqual(["a"]);
  });

  it("storage が無くても、書き込みが例外を投げても止まらない", () => {
    expect(() => recordPlayedWord(null, "a")).not.toThrow();
    expect(() => recordPlayedWord(brokenStorage, "a")).not.toThrow();
  });
});

describe("pickWord", () => {
  it("記録済みの単語を選定から除く", () => {
    const storage = storageWith('["a","c"]');

    expect(pickWord(pool, storage, first)).toEqual({ id: "b" });
    expect(pickWord(pool, storage, last)).toEqual({ id: "b" });
  });

  it("乱数に応じて候補から 1 語選ぶ", () => {
    const storage = storageWith('["b"]');

    expect(pickWord(pool, storage, first)).toEqual({ id: "a" });
    expect(pickWord(pool, storage, last)).toEqual({ id: "c" });
  });

  it("選んだだけでは記録しない", () => {
    const storage = new MemoryStorage();

    pickWord(pool, storage, first);

    expect(readPlayedWords(storage)).toEqual([]);
  });

  it("全語が記録済みならリストを空に戻し、全語から選び直す", () => {
    const storage = storageWith('["a","b","c"]');

    expect(pickWord(pool, storage, last)).toEqual({ id: "c" });
    expect(readPlayedWords(storage)).toEqual([]);
    expect(pickWord(pool, storage, first)).toEqual({ id: "a" });
  });

  it("プールに無い id が残っていても、プールの全語が記録済みなら空に戻す", () => {
    const storage = storageWith('["a","removed","b","c"]');

    expect(pickWord(pool, storage, first)).toEqual({ id: "a" });
    expect(readPlayedWords(storage)).toEqual([]);
  });

  it("壊れた保存値のときは全語から選ぶ", () => {
    expect(pickWord(pool, storageWith("{not json"), last)).toEqual({ id: "c" });
  });

  it("storage が無ければ読み書きせず全語から選ぶ", () => {
    expect(pickWord(pool, null, first)).toEqual({ id: "a" });
    expect(pickWord(pool, null, last)).toEqual({ id: "c" });
  });

  it("storage が例外を投げても全語から選ぶ", () => {
    expect(pickWord(pool, brokenStorage, last)).toEqual({ id: "c" });
  });

  it("乱数が 1 を返しても候補の範囲に収める", () => {
    expect(pickWord(pool, null, () => 1)).toEqual({ id: "c" });
  });

  it("プールが空なら例外を投げる", () => {
    expect(() => pickWord([], new MemoryStorage())).toThrow();
  });

  it("モックの単語プールを 1 周するまで同じ単語を選ばない", () => {
    const storage = new MemoryStorage();
    const seen = new Set<string>();

    for (let round = 0; round < words.length; round++) {
      const word = pickWord(words, storage);
      expect(seen.has(word.id)).toBe(false);
      seen.add(word.id);
      recordPlayedWord(storage, word.id);
    }

    expect(seen.size).toBe(words.length);
    pickWord(words, storage);
    expect(readPlayedWords(storage)).toEqual([]);
  });
});

describe("getBrowserStorage", () => {
  it("window の無い環境では null を返す", () => {
    expect(getBrowserStorage()).toBeNull();
  });
});
