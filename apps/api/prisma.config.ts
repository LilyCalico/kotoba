import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma CLI（migrate・db seed・generate）の設定。
 * CLI は DIRECT_URL でつなぐ。migration は Supabase のトランザクションプーラーを通せないため、
 * アプリが使う DATABASE_URL とは別に、直接接続かセッションプーラーの URL を渡す。
 * generate は DB につながないので、URL がない CI のビルドでも動くよう env() ではなく process.env で読む。
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx src/prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL,
  },
});
