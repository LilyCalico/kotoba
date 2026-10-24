import type { Word } from "@kotoba/shared";
import { Logger } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Word as WordRow } from "../generated/prisma/client.js";
import type { PrismaService } from "../prisma/prisma.service.js";
import { words } from "../prisma/seed/words.js";
import { WordsService, toWordInput } from "./words.service.js";

/** seed の単語を、DB から読んだときと同じ形の行にする。 */
function toRow(word: Word): WordRow {
  const at = new Date("2026-10-01T00:00:00Z");
  return {
    ...word,
    literal: word.literal ?? null,
    note: word.note ?? null,
    example: word.example ?? null,
    createdAt: at,
    updatedAt: at,
  };
}

function rowById(id: string): WordRow {
  const word = words.find((candidate) => candidate.id === id);
  if (!word) throw new Error(`${id} が見つからない`);
  return toRow(word);
}

/** findMany / findUnique だけを持つ Prisma の代役。where の language と id だけを解釈する。 */
function createService(rows: WordRow[]): WordsService {
  const prisma = {
    word: {
      findMany: vi.fn(async ({ where }: { where?: { language?: string } } = {}) =>
        rows.filter((row) => !where?.language || row.language === where.language),
      ),
      findUnique: vi.fn(
        async ({ where }: { where: { id: string } }) =>
          rows.find((row) => row.id === where.id) ?? null,
      ),
    },
  };
  return new WordsService(prisma as unknown as PrismaService);
}

let logError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  logError = vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("toWordInput", () => {
  it("時刻の列を落とし、任意の項目の NULL を省略に戻す", () => {
    const input = toWordInput(rowById("mangata"));

    expect(input).not.toHaveProperty("createdAt");
    expect(input).not.toHaveProperty("updatedAt");
    expect(input).not.toHaveProperty("example");
    expect(input).toEqual(words.find((word) => word.id === "mangata"));
  });
});

describe("WordsService.findById", () => {
  it("DB の行を Word として返す", async () => {
    const service = createService(words.map(toRow));

    expect(await service.findById("fredagsmys")).toEqual(
      words.find((word) => word.id === "fredagsmys"),
    );
  });

  it("ない id では何も返さない", async () => {
    const service = createService(words.map(toRow));

    expect(await service.findById("missing")).toBeUndefined();
  });

  it("wordSchema を満たさない行は返さず、id 付きでログに残す", async () => {
    const service = createService([{ ...rowById("fika"), frequency: 9 }]);

    expect(await service.findById("fika")).toBeUndefined();
    expect(logError).toHaveBeenCalledWith(expect.stringContaining("fika"));
  });
});

describe("WordsService.pick", () => {
  it("excludeWordIds を除いた単語から選ぶ", async () => {
    const service = createService(words.map(toRow));
    const excludeWordIds = words.map(({ id }) => id).filter((id) => id !== "lagom");

    expect((await service.pick({ language: "sv", excludeWordIds }))?.id).toBe("lagom");
  });

  it("除いた結果が空ならプール全体から選ぶ", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const service = createService([rowById("fika"), rowById("lagom")]);

    const word = await service.pick({ language: "sv", excludeWordIds: ["fika", "lagom"] });

    expect(word?.id).toBe("fika");
  });

  it("frequency を重みに選ぶ", async () => {
    // fika（5）と mysig（3）の順に並ぶ。合計 8 のうち 5 / 8 以上は mysig に当たる。
    vi.spyOn(Math, "random").mockReturnValue(5 / 8);
    const service = createService([rowById("fika"), rowById("mysig")]);

    expect((await service.pick({ language: "sv" }))?.id).toBe("mysig");
  });

  it("対象言語の単語がなければ何も返さない", async () => {
    const service = createService(words.map(toRow));

    expect(await service.pick({ language: "ja" })).toBeUndefined();
  });

  it("wordSchema を満たさない行は候補から外し、id 付きでログに残す", async () => {
    const broken = { ...rowById("fika"), hints: { ja: [], en: [] } };
    const service = createService([broken, rowById("lagom")]);

    for (let i = 0; i < 10; i++) {
      expect((await service.pick({ language: "sv" }))?.id).toBe("lagom");
    }
    expect(logError).toHaveBeenCalledWith(expect.stringContaining("fika"));
  });
});

describe("WordsService.onApplicationBootstrap", () => {
  const original = process.env.DATABASE_URL;

  afterEach(() => {
    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
  });

  it("接続先がなければ DB を引かない", () => {
    delete process.env.DATABASE_URL;
    const findMany = vi.fn(async () => []);
    const service = new WordsService({ word: { findMany } } as unknown as PrismaService);

    service.onApplicationBootstrap();

    expect(findMany).not.toHaveBeenCalled();
  });

  it("接続先があれば全件を検証し、不正な行をログに出す", async () => {
    process.env.DATABASE_URL = "postgresql://example";
    const service = createService([{ ...rowById("fika"), frequency: 0 }, rowById("lagom")]);

    service.onApplicationBootstrap();

    await vi.waitFor(() => expect(logError).toHaveBeenCalledWith(expect.stringContaining("fika")));
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it("DB に届かなくても例外を投げない", async () => {
    process.env.DATABASE_URL = "postgresql://example";
    const logWarn = vi.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    const prisma = {
      word: { findMany: vi.fn(async () => Promise.reject(new Error("unreachable"))) },
    };
    const service = new WordsService(prisma as unknown as PrismaService);

    expect(() => service.onApplicationBootstrap()).not.toThrow();
    await vi.waitFor(() => expect(logWarn).toHaveBeenCalled());
  });
});
