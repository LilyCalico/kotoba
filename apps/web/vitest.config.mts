import { defineConfig } from "vitest/config";

export default defineConfig({
  // tsconfig.json の "@/*" エイリアスを Vite に解決させる。
  resolve: { tsconfigPaths: true },
  test: {
    // 描画を伴うテストは置かない。対象はクライアント側の純粋なロジックのみ。
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      include: ["**/*.ts"],
      exclude: ["**/*.test.ts", "*.config.*", "next-env.d.ts"],
    },
  },
});
