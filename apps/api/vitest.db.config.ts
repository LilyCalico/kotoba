import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

/**
 * DB を使うテスト（`*.db.test.ts`）だけを流す設定。`pnpm test:db` から使う。
 * 接続先は `.env` の DATABASE_URL を読む。DB は `pnpm db:start` → `db:deploy` → `db:seed` で用意しておく。
 */
export default defineConfig({
  // vitest.config.ts と同じく、NestJS の依存解決に要る emitDecoratorMetadata を SWC で出す。
  plugins: [swc.vite()],
  test: {
    environment: "node",
    include: ["src/**/*.db.test.ts"],
    setupFiles: ["dotenv/config"],
    // テストファイルどうしで同じ DB を使うため、並列に流さない。
    fileParallelism: false,
  },
});
