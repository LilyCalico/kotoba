import type { Word } from "@kotoba/shared";
import { describe, expect, it } from "vitest";
import { words } from "../prisma/seed/words.js";
import { pickWeighted, resolveWord } from "./words.js";

function wordById(id: string): Word {
  const word = words.find((candidate) => candidate.id === id);
  if (!word) throw new Error(`${id} が見つからない`);
  return word;
}

describe("resolveWord", () => {
  it("UI 言語のテキストだけを残す", () => {
    const word = wordById("fredagsmys");

    expect(resolveWord(word, "ja").teaser).toBe(word.teaser.ja);
    expect(resolveWord(word, "en").teaser).toBe(word.teaser.en);
    expect(resolveWord(word, "en").literal).toBe(word.literal?.en);
  });

  it("読みは日本語 UI にだけ付ける", () => {
    const word = wordById("lagom");

    expect(resolveWord(word, "ja").reading).toBe("ラーゴム");
    expect(resolveWord(word, "en").reading).toBeUndefined();
  });

  it("例文を持たない単語では example を省く", () => {
    const { example, ...word } = wordById("mangata");

    expect(resolveWord(word, "ja")).not.toHaveProperty("example");
  });
});

describe("pickWeighted", () => {
  // frequency は fika が 5、mysig が 3。合計 8 のうち [0, 5) が fika、[5, 8) が mysig に当たる。
  const candidates = [wordById("fika"), wordById("mysig")];

  it("frequency の幅に応じて選ぶ", () => {
    expect(pickWeighted(candidates, () => 0)?.id).toBe("fika");
    expect(pickWeighted(candidates, () => 4.9 / 8)?.id).toBe("fika");
    expect(pickWeighted(candidates, () => 5 / 8)?.id).toBe("mysig");
    expect(pickWeighted(candidates, () => 0.999)?.id).toBe("mysig");
  });

  it("候補が空なら何も返さない", () => {
    expect(pickWeighted([], () => 0)).toBeUndefined();
  });
});
