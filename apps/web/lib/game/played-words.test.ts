import { MAX_EXCLUDE_WORD_IDS } from "@kotoba/shared";
import { describe, expect, it } from "vitest";
import {
  PLAYED_WORDS_KEY,
  type PlayedWordsStorage,
  excludedWordIds,
  getBrowserStorage,
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
}

/** どの操作も例外を投げる。アクセスを拒まれた `localStorage` を模す。 */
const brokenStorage: PlayedWordsStorage = {
  getItem: () => {
    throw new Error("denied");
  },
  setItem: () => {
    throw new Error("denied");
  },
};

function storageWith(value: string): MemoryStorage {
  const storage = new MemoryStorage();
  storage.setItem(PLAYED_WORDS_KEY, value);
  return storage;
}

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

describe("excludedWordIds", () => {
  it("記録を新しいものから並べて返す", () => {
    expect(excludedWordIds(storageWith('["a","b","c"]'))).toEqual(["c", "b", "a"]);
  });

  it("新しいものから最大 100 件に絞る", () => {
    const played = Array.from({ length: MAX_EXCLUDE_WORD_IDS + 5 }, (_, index) => `w${index}`);
    const storage = storageWith(JSON.stringify(played));

    const excluded = excludedWordIds(storage);

    expect(excluded).toHaveLength(MAX_EXCLUDE_WORD_IDS);
    expect(excluded[0]).toBe(`w${MAX_EXCLUDE_WORD_IDS + 4}`);
    expect(excluded.at(-1)).toBe("w5");
  });

  it("storage が無ければ空を返す", () => {
    expect(excludedWordIds(null)).toEqual([]);
  });
});

describe("recordPlayedWord", () => {
  it("id を追記する", () => {
    const storage = new MemoryStorage();

    recordPlayedWord(storage, "a");
    recordPlayedWord(storage, "b");

    expect(storage.getItem(PLAYED_WORDS_KEY)).toBe('["a","b"]');
  });

  it("記録済みの id が届いたら、記録をその 1 件に戻す", () => {
    const storage = storageWith('["a","b","c"]');

    recordPlayedWord(storage, "b");

    expect(readPlayedWords(storage)).toEqual(["b"]);
  });

  it("戻したあとは、次の一巡の記録として追記を続ける", () => {
    const storage = storageWith('["a","b"]');

    recordPlayedWord(storage, "a");
    recordPlayedWord(storage, "b");

    expect(readPlayedWords(storage)).toEqual(["a", "b"]);
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

describe("getBrowserStorage", () => {
  it("window の無い環境では null を返す", () => {
    expect(getBrowserStorage()).toBeNull();
  });
});
