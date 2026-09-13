import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // tsconfig.json の "@/*" エイリアスを Vite に解決させる。
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["app/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["app/**/*.{ts,tsx}"],
      exclude: ["app/**/*.test.{ts,tsx}", "app/layout.tsx"],
    },
  },
});
