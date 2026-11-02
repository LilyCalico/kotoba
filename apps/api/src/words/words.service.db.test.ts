import { afterAll, describe, expect, it } from "vitest";
import { PrismaService } from "../prisma/prisma.service.js";
import { words } from "../prisma/seed/words.js";
import { WordsService } from "./words.service.js";

/**
 * seed 済みの DB を相手にする。`pnpm test:db` で流し、CI では db ジョブが seed のあとに流す。
 */
const prisma = new PrismaService();
const service = new WordsService(prisma);

afterAll(async () => {
  await prisma.$disconnect();
});

describe("WordsService（DB）", () => {
  it("seed した単語が、seed データと同じ形で返る", async () => {
    for (const word of words) {
      expect(await service.findById(word.id), word.id).toEqual(word);
    }
  });

  it("seed した単語がすべて出題の候補になる", async () => {
    for (const word of words) {
      const excludeWordIds = words.map(({ id }) => id).filter((id) => id !== word.id);

      expect(await service.pick({ language: word.language, excludeWordIds })).toEqual(word);
    }
  });

  it("単語のない言語では何も返さない", async () => {
    expect(await service.pick({ language: "ja" })).toBeUndefined();
  });
});
