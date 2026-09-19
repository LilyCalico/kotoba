import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // eslint-config-next が有効にする jsx-a11y のルールは 6 件・warn 止まり。
  // アクセシビリティ検証の 1 層目として推奨セット 31 件を error で効かせる。
  //
  // プラグイン本体は eslint-config-next が `jsx-a11y` という名前で登録済みで、
  // flat config は同じ名前の再登録を拒む。そのため推奨セットからはルール定義だけを取る。
  {
    files: ["**/*.{jsx,tsx}"],
    rules: jsxA11y.flatConfigs.recommended.rules,
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
