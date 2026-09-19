import type { StorybookConfig } from "@storybook/nextjs-vite";

/**
 * `@storybook/addon-vitest`（story を自動テストとして実行するアドオン）は peer に
 * `vitest ^3 || ^4` を持ち、このリポジトリの Vitest 5 と噛み合わない。story を CI で
 * 回す判断は ADR 0002 の見直し条件に従う。
 */
const config: StorybookConfig = {
  stories: ["../components/**/*.stories.tsx"],
  addons: [],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
  staticDirs: ["../public"],
};

export default config;
