import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../generated/prisma/client.js";
import { words } from "../words/words.js";

/**
 * 単語プール（src/words/words.ts）を words テーブルへ入れる。`prisma db seed` から呼ばれる。
 * words.ts は読み込み時に wordSchema で全件を検証しているため、ここに来る値は形が保証されている。
 * id で upsert するので、何度流しても同じ状態になる。
 */
async function main(): Promise<void> {
  // CLI と同じく直接接続を使う。
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL }),
  });

  try {
    for (const { id, ...fields } of words) {
      const data = {
        ...fields,
        literal: fields.literal ?? Prisma.DbNull,
        note: fields.note ?? Prisma.DbNull,
        example: fields.example ?? Prisma.DbNull,
      };
      await prisma.word.upsert({ where: { id }, create: { id, ...data }, update: data });
    }
    const seeded = await prisma.word.count({ where: { id: { in: words.map(({ id }) => id) } } });
    if (seeded !== words.length) {
      throw new Error(`Expected ${words.length} words in the database, found ${seeded}.`);
    }
    console.log(`Seeded ${seeded} words.`);
  } finally {
    await prisma.$disconnect();
  }
}

await main();
