import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // SWC がトランスパイルを担う。Vitest 既定の esbuild は emitDecoratorMetadata を
  // 実装しておらず、NestJS が引数の型から依存を解決できなくなる。
  // unplugin-swc は tsconfig.json の experimentalDecorators / emitDecoratorMetadata を読む。
  plugins: [swc.vite()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/main.ts"],
    },
  },
});
