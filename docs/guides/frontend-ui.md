# フロント UI 基盤の設定手順

`apps/web` にデザイントークン・UI コンポーネント・Storybook を置く。方針は [`docs/specifications/design.md`](../specifications/design.md) が定める。

## 1. shadcn/ui を初期化する

primitive base に React Aria Components を選ぶ。`-b aria` がそれを指定し、`-p nova` がプリセット（アイコンは Lucide）を指定する。

```bash
cd apps/web
npx shadcn@latest init -b aria -p nova -y --no-monorepo
```

どちらのフラグも省略すると対話プロンプトに落ちるため、非対話で流すなら両方渡す。`--no-monorepo` は「モノレポとして足場を組み直すか」の確認を抑える。`apps/web` は既に存在するワークスペースなので組み直しは要らない。

これで `components.json`・`lib/utils.ts` が生まれ、`app/globals.css` にセマンティックトークンが書き込まれる。

## 2. コンポーネントを入れる

```bash
cd apps/web
npx shadcn@latest add button input field label dialog -y
```

aria base に `text-field` という名前のコンポーネントは無い。テキスト入力は `input` が担い、その内部が React Aria の `TextField` にあたる。ラベル付きの入力は `Field` / `FieldLabel` / `Input` を組んで作る。

```tsx
<Field>
  <FieldLabel htmlFor="question">質問か解答</FieldLabel>
  <Input id="question" placeholder="金曜日に限った言葉ですか？" />
  <FieldDescription>はい / いいえ で答えられる質問にしてください。</FieldDescription>
</Field>
```

`dialog` は依存として `separator` も連れてくる。

## 3. フォーカスリングを `data-focus-visible` に移す

生成されたコンポーネントは CSS 擬似クラスの `:focus-visible` を使う。React Aria は自前でキーボード操作を判定して `data-focus-visible` を付けるため、そちらに合わせる。

| 生成された記述 | 置き換え後 |
| --- | --- |
| `focus-visible:border-ring` | `data-[focus-visible]:border-ring` |
| `has-[:focus-visible]:ring-3` | `has-[[data-focus-visible]]:ring-3` |

対象は `button.tsx` / `input.tsx` / `field.tsx` の 3 つ。

## 4. デザイントークンを差し替える

`app/globals.css` の `:root` にある値を Kotoba のものにする。トークンの**名前は shadcn のものをそのまま使う**。追加するコンポーネントは無修正でこの語彙を参照するため、名前を変えると以後すべてのコンポーネントに手修正が要る。

| トークン | 値 | 役割 |
| --- | --- | --- |
| `--background` | `#f1f6ef` | 画面全体の背景 |
| `--foreground` | `#1c1c1c` | 本文 |
| `--card` / `--popover` | `#fbfdfb` | ヘッダー、設問カード、ヒントカード、AI の回答バブル、入力欄 |
| `--primary` | `#42823a` | START ボタン、送信ボタン、ロゴ |
| `--primary-foreground` | `#fbfdfb` | アクセント上の文字 |
| `--secondary` / `--accent` | `#dde8d7` | プレイヤーの発言バブルと、その上に乗るホバー面 |
| `--muted` / `--muted-foreground` | `#e8eee6` / `#6b6b6b` | カードのラベル・補足テキストとその下地 |
| `--border` | `#dddddd` | 装飾的な区切り線 |
| `--input` | `#7f8c7d` | コントロールの輪郭 |
| `--ring` | `#42823a` | フォーカスリング |

値は Figma の variables（`background` / `background-white` / `border` / `primary`）を出発点にし、コントラスト比が WCAG AA を満たすところまで詰めたもの。非機能要件が European Accessibility Act 準拠を意識すると定めているため、AA を下回る値は採らない。

| ペア | 比 | 要求 |
| --- | --- | --- |
| `--foreground` / `--background` | 15.56 | 4.5（AA 通常テキスト） |
| `--muted-foreground` / `--card` | 5.21 | 4.5 |
| `--primary-foreground` / `--primary` | 4.58 | 4.5 |
| `--ring` / `--background` | 4.27 | 3.0（AA 非テキスト） |
| `--input` / `--card` | 3.45 | 3.0（WCAG 1.4.11） |

境界色を `--border` と `--input` に分けているのは、要求が異なるためである。カードの縁や区切り線は装飾であり比の要求を受けないが、入力欄の輪郭は「コントロールを識別するための境界」にあたり 3:1 を満たす必要がある。shadcn がこの 2 つを別トークンとして持っているので、カードの淡い縁を保ったまま入力欄だけ濃くできる。

`chart-*` と `sidebar-*` は使う画面が無いので消す。必要になった時点で `shadcn add` が書き戻す。

## 5. ライトテーマだけにする

`:root` の下にある `.dark` の値ブロックを消す。一方で `@custom-variant dark (&:is(.dark *));` は残す。

```css
@custom-variant dark (&:is(.dark *));
```

この 1 行が無いと `dark:` は Tailwind 既定の `prefers-color-scheme` で解決され、OS の設定に反応してしまう。残しておけば `dark:` はクラス `.dark` に紐づき、どこにも付けない限り発火しない。生成されたコンポーネントに残る `dark:` 記述は、この状態では何もしない。

## 6. フォントを差し替える

`app/fonts.ts` に置き、`app/layout.tsx` と Storybook の両方から読む。

```ts
import { Zen_Maru_Gothic } from "next/font/google";

export const zenMaruGothic = Zen_Maru_Gothic({
  variable: "--font-sans",
  weight: ["400", "700"],
  subsets: ["latin"],
});
```

`variable` を `--font-sans` にすると、`globals.css` の `@theme inline` が持つ `--font-sans` の参照先になり、Tailwind の `font-sans` から引ける。

## 7. ルートにプロバイダを置く

`MotionConfig` と `I18nProvider` はどちらもクライアント側で動く。`app/providers.tsx` に `"use client"` でまとめ、Server Component である `app/layout.tsx` から差し込む。

```tsx
"use client";

import { MotionConfig } from "motion/react";
import { I18nProvider } from "react-aria-components";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider locale="ja">
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </I18nProvider>
  );
}
```

## 8. eslint-plugin-jsx-a11y を足す

```bash
cd apps/web
pnpm add -D eslint-plugin-jsx-a11y
```

`eslint.config.mjs` には**ルールだけ**を足す。

```js
{
  files: ["**/*.{jsx,tsx}"],
  rules: jsxA11y.flatConfigs.recommended.rules,
}
```

`eslint-config-next` が `jsx-a11y` という名前でプラグイン本体を登録済みで、flat config は同じ名前の再登録を拒む。推奨セットをそのまま展開すると `plugins` キーごと入ってしまうため、`rules` だけを取る。

`eslint-config-next` が有効にするのは 6 ルール・`warn` 止まりで、推奨セットは 31 ルール・`error`。アクセシビリティ検証の 1 層目として後者を効かせる。

## 9. Storybook を入れる

```bash
cd apps/web
pnpm add -D storybook @storybook/nextjs-vite vite
```

`storybook init` は使わない。`@storybook/addon-vitest` を既定で入れてしまうため、構成は手で書く。

`.storybook/main.ts`:

```ts
import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  stories: ["../components/**/*.stories.tsx"],
  addons: [],
  framework: { name: "@storybook/nextjs-vite", options: {} },
  staticDirs: ["../public"],
};

export default config;
```

`.storybook/preview.tsx` では、アプリのルートと同じプロバイダ・フォント・`globals.css` を decorator として当てる。story 側で配色や書体を指定する必要がなくなり、本番と同じ条件で見比べられる。

`@storybook/nextjs-vite` は `next/font/google` を解決できるため、`app/fonts.ts` をそのまま import できる。

ルートから `pnpm storybook` で起動できるよう、`turbo.json` に `storybook`（`persistent: true`, `cache: false`）と `build-storybook` を足す。

## つまずきポイント

### `shadcn init` が対話プロンプトで止まる

**症状**: `-y` を付けても `Which preset would you like to use?` で入力待ちになる。

**原因**: `-y` が抑えるのは確認プロンプトだけで、プリセットの選択は別枠になっている。

**対処**: `-p nova` のようにプリセットを明示する。`-d` でも通るが、その場合 base は `-b` ではなく既定の `base` になる。

### `shadcn init` が「フレームワークを検出できない」と言う

**症状**: `We could not detect a supported framework at ...` で止まる。

**原因**: フレームワークの判定は `node_modules` に入っている実体を見る。`package.json` に `next` が書かれているだけでは通らない。

**対処**: `pnpm install` を済ませてから実行する。

### ESLint が `Cannot redefine plugin "jsx-a11y"` で起動しない

**症状**: `ConfigError: Config "jsx-a11y/recommended": Key "plugins": Cannot redefine plugin "jsx-a11y"`。

**原因**: `eslint-config-next` が既に `jsx-a11y` を登録しており、`jsxA11y.flatConfigs.recommended` をそのまま展開すると `plugins` キーが重複する。

**対処**: 展開せず `rules: jsxA11y.flatConfigs.recommended.rules` だけを渡す。

### story が `args` を要求して型が通らない

**症状**: `Property 'args' is missing in type '{ render: ... }'`。

**原因**: `satisfies Meta<typeof X>` は対象コンポーネントの必須 props を story の `args` に要求する。`Dialog` は `children` が必須。

**対処**: `render` で組み立てる story では、meta 側に `args: { children: null }` のような既定値を 1 度だけ置く。

### `pnpm install` が `Ignored build scripts: esbuild` と言い続ける

**症状**: インストールのたびに警告が出る。`pnpm-workspace.yaml` の `ignoredBuiltDependencies` に足しても消えない。

**原因**: `ignoredBuiltDependencies` はビルドスクリプトを走らせない決定を記録するもので、記録した事実の告知そのものは止まらない。

**対処**: 放置してよい。esbuild のネイティブバイナリは `@esbuild/<platform>` として `optionalDependencies` 経由で入るため、postinstall を走らせなくても解決する。`pnpm approve-builds` で許可する必要はない。

### 日本語が別のフォントで描かれる

**症状**: 欧文は Zen Maru Gothic なのに和文だけ OS 既定の書体になる。

**原因**: `next/font/google` の `subsets` を指定し忘れている、あるいはフォント自体を `html` に当てていない。

**対処**: `subsets` はプリロードする範囲の指定であって、self-host する範囲の指定ではない。日本語のグリフは unicode-range で分割された別ファイルとして必ず落ちてくる（`next build` 後に `.next/static/media` へ 200 個以上の `.woff2` が並ぶ）。`subsets: ["latin"]` のままでよく、確認すべきは `zenMaruGothic.variable` が `<html>` の `className` に入っているかどうか。
