# フロント UI 基盤の設定手順

`apps/web` にデザイントークン・UI コンポーネント・Storybook を置く。`create-next-app` が作った状態から始め、手順 1 から順に実行すると現在の構成になる。

## セットアップするもの

いずれも `apps/web` で実行する。手順 1 が入れる 6 つは dependencies に入る。

**手順 1 — `npx shadcn@latest init -b aria -p luma -y --no-monorepo`**

- `react-aria-components` — primitive base
- `class-variance-authority` — コンポーネントの variant 定義
- `cn` — `lib/utils.ts` が再輸出する `cn` の実体
- `lucide-react` — アイコン
- `shadcn` — コンポーネントを足す CLI
- `tw-animate-css` — Tailwind v4 向けのアニメーションユーティリティ

**手順 7 — `pnpm add motion`**

- `motion` — `MotionConfig` とアニメーション

**手順 9 — `pnpm add -D eslint-plugin-jsx-a11y`**

- `eslint-plugin-jsx-a11y` — アクセシビリティの静的検証

**手順 10 — `pnpm add -D storybook @storybook/nextjs-vite vite`**

- `storybook` — コンポーネント単体の確認
- `@storybook/nextjs-vite` — Storybook の Next.js 向けフレームワーク
- `vite` — 同フレームワークが peer に要求するバンドラ

## 1. shadcn/ui を初期化する

primitive base に React Aria Components を、見た目のスタイルに Luma を選ぶ。`-b aria` が前者を、`-p luma` が後者のプリセット（アイコンは Lucide）を指定する。`components.json` の `style` は `aria-luma` になる。

```bash
cd apps/web
npx shadcn@latest init -b aria -p luma -y --no-monorepo
```

Luma は大きな角丸と広めの余白をとるスタイルで、各スタイルの見た目は https://ui.shadcn.com/create で切り替えて見比べられる。生成されたコンポーネントの見た目は、手順 3 と 4 で Kotoba のもの（角は四角、押せるものは枠と影、フォーカスリングは濃い輪郭）に寄せる。Luma は余白の取り方とコンポーネントの構成の土台として使う。

どちらのフラグも省略すると対話プロンプトに落ちるため、非対話で流すなら両方渡す。`--no-monorepo` は「モノレポとして足場を組み直すか」の確認を抑える。`apps/web` は既に存在するワークスペースなので組み直しは要らない。

`components.json` と `lib/utils.ts` が生まれ、`app/globals.css` にセマンティックトークンが書き込まれる。依存として `react-aria-components` / `class-variance-authority` / `cn` / `lucide-react` / `shadcn` / `tw-animate-css` が入る。

## 2. コンポーネントを入れる

```bash
cd apps/web
npx shadcn@latest add button input field label dialog -y
```

aria base に `text-field` という名前のコンポーネントは無い。テキスト入力は `input` が担い、その内部が React Aria の `TextField` にあたる。ラベル付きの入力は `Field` / `FieldLabel` / `Input` を組んで作る。

`dialog` は依存として `separator` も連れてくる。`FieldSeparator` の実体でもあるので取り除かない。

## 3. フォーカスリングと入力欄の見た目を揃える

生成されたコンポーネントは、フォーカスリングを `focus-visible:ring-*` の box-shadow で描く。このリポジトリでは、フォーカスリングをすべて `globals.css` の `focus-ring` ユーティリティ（手順 4）に揃える。2px の濃い輪郭を 2px 離して描き、地・カード・ライムのどの面の上でも見える。

`focus-ring` は `:focus-visible` と、React Aria が自前でキーボード操作を判定して付ける `data-focus-visible` の両方に当たる。生成されたクラスのうち、フォーカスに関わるものを `focus-ring` 1 つに置き換える。

| 生成された記述 | 置き換え後 |
| --- | --- |
| `outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` | `focus-ring` |
| `data-[focus-visible]:ring-3 data-[focus-visible]:ring-ring/30` | `focus-ring` |

`shadcn add` でコンポーネントを足すたびに同じ置き換えが要る。取りこぼしは次で見つかる。

```bash
grep -rn 'focus-visible:ring\|focus-visible\]:ring' apps/web/components/
```

### 入力欄の輪郭を残す

Luma の `Input` は枠線を消し、`--input` を半透明にした塗りで入力欄を示す。入力欄の輪郭はコントラスト比 3:1（WCAG 1.4.11）を満たす必要があるため、`components/ui/input.tsx` は塗りを白（`bg-card`）にして、`--input` の 1px の枠線で輪郭を示す。角は四角（`rounded-none`）、高さは 48px（`h-12`）にする。

| 生成された記述 | 置き換え後 |
| --- | --- |
| `h-9 … rounded-3xl border border-transparent bg-input/50` | `h-12 … rounded-none border border-input bg-card` |

無効状態は `disabled:opacity-60` で薄め、有効な入力欄と見分ける。

## 4. デザイントークンを差し替える

`app/globals.css` の `:root` にある値を Kotoba のものにする。トークンの**名前は shadcn のものをそのまま使う**。追加するコンポーネントは無修正でこの語彙を参照するため、名前を変えると以後すべてのコンポーネントに手修正が要る。shadcn の語彙にない役割（プレイヤーの発言・ラベル・回答）だけを、名前を足して持つ。

配色は Y2K パステルで、役割ごとに色を割り当てる（`docs/specifications/design.md`「トーン&マナー」）。

| トークン | 値 | 役割 |
| --- | --- | --- |
| `--background` | `#e1e3fd` | 画面の地 |
| `--foreground` | `#2d241b` | 本文 |
| `--card` / `--popover` | `#ffffff` | 設問・ヒント・結果のカード、入力欄、ダイアログ、トースト |
| `--card-foreground` / `--popover-foreground` | `#2d241b` | 面の上の文字 |
| `--primary` / `--primary-foreground` | `#c5e17a` / `#2d241b` | 主ボタン（送信・ゲームの開始・Play again） |
| `--secondary` / `--secondary-foreground` | `#ffffff` / `#2d241b` | 副ボタン（ヒント・Cancel） |
| `--accent` / `--accent-foreground` | `#f1e6db` / `#2d241b` | 副ボタンのホバー |
| `--muted` / `--muted-foreground` | `#f1e6db` / `#675d52` | 例文の下地と、補足テキスト |
| `--border` / `--input` | `#382e24` | カードとコントロールの輪郭 |
| `--ring` | `#2d241b` | フォーカスリング |
| `--destructive` / `--destructive-foreground` | `#ffc3c3` / `#2d241b` | ギブアップの確定 |
| `--bubble` / `--bubble-foreground` | `#2d241b` / `#ffffff` | プレイヤーの発言の吹き出し |
| `--label` | `#dcd0ff` | ラベル（Question・品詞）のピル |
| `--answer-yes` / `--answer-no` / `--answer-unclear` / `--answer-meta` | `#c5e17a` / `#ffbfd9` / `#addbff` / `#ffe08a` | 回答のピル |
| `--radius` | `0` | 角は四角。ピルと吹き出しだけを個別に丸める |

足したトークンは `@theme inline` で `--color-*` に割り当て、`bg-bubble` や `bg-answer-yes` のように Tailwind から引けるようにする。`chart-*` と `sidebar-*` は使う画面が無いので、割り当てごと消す。必要になった時点で `shadcn add` が書き戻す。

非機能要件が European Accessibility Act 準拠を意識すると定めているため、WCAG AA を下回る組み合わせは採らない。

| ペア | 比 | 要求 |
| --- | --- | --- |
| `--foreground` / `--background` | 12.04 | 4.5（AA 通常テキスト） |
| `--muted-foreground` / `--background` | 5.09 | 4.5 |
| `--muted-foreground` / `--muted` | 5.23 | 4.5 |
| `--primary-foreground` / `--primary` | 10.45 | 4.5 |
| `--bubble-foreground` / `--bubble` | 15.22 | 4.5 |
| `--foreground` / 回答・ラベルの各色 | 9.93〜11.80 | 4.5 |
| `--border` / `--background` | 10.48 | 3.0（WCAG 1.4.11） |
| `--ring` / `--background` | 12.04 | 3.0（AA 非テキスト） |

`globals.css` には、トークンのほかに 3 つのユーティリティを置く。

| ユーティリティ | 中身 | 使う場所 |
| --- | --- | --- |
| `pressable` | 1px の枠と、3px ずらしたベタの影（`--shadow-press`）。押すと影の分だけ沈んで影が消える | 枠と影を持つボタン（`buttonVariants` の `default` / `outline` / `secondary` / `destructive`） |
| `focus-ring` | 2px の濃い輪郭を 2px 離して描く | フォーカスを受けるすべての要素 |
| `holo` | 回答とラベルの色を巡る円錐グラデーション | ホログラムのステッカー |

トークンを足し引きしたら比を計り直す。

```bash
node -e '
const lin = (c) => (c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const L = (h) => { const n = parseInt(h.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
const [a, b] = process.argv.slice(1);
const [hi, lo] = [L(a), L(b)].sort((x, y) => y - x);
console.log(((hi + 0.05) / (lo + 0.05)).toFixed(2));
' "#2d241b" "#c5e17a"
```

## 5. ライトテーマだけにする

`:root` の下にある `.dark` の値ブロックを消す。一方で `@custom-variant dark (&:is(.dark *));` は残す。

```css
@custom-variant dark (&:is(.dark *));
```

この 1 行が無いと `dark:` は Tailwind 既定の `prefers-color-scheme` で解決され、OS の設定に反応してしまう。残しておけば `dark:` はクラス `.dark` に紐づき、どこにも付けない限り発火しない。生成されたコンポーネントに残る `dark:` 記述は、この状態では何もしない。

## 6. フォントを差し替える

UI には Poppins、読ませる文（設問・ヒント・正解の単語と定義）には Crimson Text を使う。`app/fonts.ts` に置き、`app/layout.tsx` と Storybook の両方から読む。

```ts
import { Crimson_Text, Poppins } from "next/font/google";

export const poppins = Poppins({
  variable: "--font-sans",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const crimsonText = Crimson_Text({
  variable: "--font-serif",
  weight: ["400", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});
```

どちらも可変フォントではないので `weight` の明示が要る。`variable` を `--font-sans` / `--font-serif` にすると、`globals.css` の `@theme inline` の参照先になり、Tailwind の `font-sans` / `font-serif` から引ける。

`app/layout.tsx` で `<html>` に 2 つの変数を当て、あわせて `metadata` と `lang` を差し替える。UI の文言は英語なので、`lang` は `en`、`metadata` も英語で書く。

```tsx
export const metadata: Metadata = {
  title: { default: "kotoba", template: "%s | kotoba" },
  description:
    "Ask yes-or-no questions to uncover a Swedish word for a feeling you've never been able to name.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} ${crimsonText.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## 7. ルートにプロバイダを置く

```bash
cd apps/web
pnpm add motion
```

`MotionConfig` と `I18nProvider` はどちらもクライアント側で動く。`app/providers.tsx` に `"use client"` でまとめ、Server Component である `app/layout.tsx` から差し込む。`I18nProvider` の locale は `lang` と揃えて `en` にし、React Aria の組み込みラベルと日付・数値の書式を英語にする。

```tsx
"use client";

import { MotionConfig } from "motion/react";
import { I18nProvider } from "react-aria-components";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider locale="en">
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </I18nProvider>
  );
}
```

1 つにまとめてあるので、Storybook からも同じものを当てられる。

## 8. アイコンを置き、scaffold の残骸を消す

画像のアセットは持たない。ロゴは Poppins の文字で組み、スタート画面の飾りとホログラムのステッカーは CSS で描く。

タブのアイコンは `app/icon.svg` に置く。Next.js はこのファイル名を見て `<link rel="icon">` を出す。白いカードに空欄の線を引き、ライムの丸を添えた 32 × 32 の SVG で、配色はトークンの値と揃える。

scaffold の残骸を消す。

```bash
cd apps/web
rm app/favicon.ico public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```

`app/page.tsx` は Next.js のテンプレートを捨て、スタート画面にする。ワードマーク・空欄のカードの飾り・見出し・説明文・Start a game ボタンを縦に積み、中央カラム（`max-w-[42rem]`）の中に置く。中身はプロダクトのコードとして `apps/web/app/page.tsx` にある。

見出しは `<h1>` にする。E2E の smoke テストが見出しの存在を確かめている。

`buttonVariants` は `components/ui/button-variants.ts` に置く。`"use client"` を持たないので、サーバーコンポーネントの `page.tsx` からも `Link` に当てられる。

## 9. eslint-plugin-jsx-a11y を足す

```bash
cd apps/web
pnpm add -D eslint-plugin-jsx-a11y
```

`eslint.config.mjs` には**ルールだけ**を足す。

```js
import jsxA11y from "eslint-plugin-jsx-a11y";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{jsx,tsx}"],
    rules: jsxA11y.flatConfigs.recommended.rules,
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
```

`eslint-config-next` が `jsx-a11y` という名前でプラグイン本体を登録済みで、flat config は同じ名前の再登録を拒む。推奨セットをそのまま展開すると `plugins` キーごと入ってしまうため、`rules` だけを取る。

`eslint-config-next` が有効にするのは 6 ルール・`warn` 止まりで、推奨セットは 31 ルール・`error`。アクセシビリティ検証の 1 層目として後者を効かせる。効いている数はこれで数えられる。

```bash
cd apps/web
npx eslint --print-config app/page.tsx | node -e '
let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => {
  const rules = Object.entries(JSON.parse(s).rules ?? {})
    .filter(([k]) => k.startsWith("jsx-a11y/"));
  console.log(rules.filter(([, v]) => (Array.isArray(v) ? v[0] : v) === 2).length, "error");
});'
```

## 10. Storybook を入れる

```bash
cd apps/web
pnpm add -D storybook @storybook/nextjs-vite vite
```

`storybook init` は使わない。`@storybook/addon-vitest` を既定で入れてしまうためで、あのアドオンは peer に `vitest ^3 || ^4` を持ち、このリポジトリの Vitest 5 と噛み合わない。構成は手で書く。

`.storybook/main.ts`:

```ts
import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  stories: ["../components/**/*.stories.tsx"],
  addons: [],
  framework: { name: "@storybook/nextjs-vite", options: {} },
};

export default config;
```

`.storybook/preview.tsx` では、アプリのルートと同じプロバイダ・フォント・`globals.css` を当てる。story 側で配色や書体を指定する必要がなくなり、本番と同じ条件で見比べられる。locale は `Providers` が持つ `en` がそのまま効く。

```tsx
import type { Preview } from "@storybook/nextjs-vite";
import { crimsonText, poppins } from "../app/fonts";
import { Providers } from "../app/providers";
import "../app/globals.css";

document.documentElement.classList.add(poppins.variable, crimsonText.variable);
document.documentElement.lang = "en";

const preview: Preview = {
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <Providers>
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 font-sans text-foreground">
          <Story />
        </div>
      </Providers>
    ),
  ],
};

export default preview;
```

Storybook は `app/layout.tsx` を通らないため、`layout.tsx` が `<html>` に当てるフォントの変数と `lang` を preview で当てる。story を包む要素ではなく `<html>` に置くのは、ダイアログが `<body>` の直下に描画され、story を包む要素に当てた値が届かないためである。

`@storybook/nextjs-vite` は `next/font/google` を解決できるため、`app/fonts.ts` をそのまま import できる。

story はコンポーネントの隣に `components/ui/<name>.stories.tsx` として置く。Vitest は `**/*.test.ts` だけを拾うので、story がユニットテストとして走ることはない。

スクリプトを 3 箇所に足す。

```jsonc
// apps/web/package.json
"storybook": "storybook dev -p 6006",
"build-storybook": "storybook build",
```

```jsonc
// package.json（ルート）
"storybook": "turbo run storybook",
"build-storybook": "turbo run build-storybook",
```

```jsonc
// turbo.json
"storybook": { "dependsOn": ["^build"], "cache": false, "persistent": true },
"build-storybook": { "dependsOn": ["^build"], "outputs": ["storybook-static/**"] }
```

ビルド成果物を `.gitignore` に足し、ESLint の対象からも外す。

```
# storybook
storybook-static/
```

```js
// apps/web/eslint.config.mjs の globalIgnores
"storybook-static/**",
```

## 11. 通しで確認する

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm dev        # http://localhost:3000
pnpm storybook  # http://localhost:6006
```

目で見て確かめるのは次の 5 点。

1. トップページの地が淡いペリウィンクルで、見出しが Crimson Text、本文が Poppins で描かれている
2. OS の外観をダークにしても配色が変わらない
3. Storybook で **Tab キー**を押すとフォーカスされたボタンに濃い輪郭のリングが出る。マウスでクリックした場合は出ない
4. `UI/Dialog` が Esc で閉じ、Tab がダイアログ内に閉じ込められる
5. `UI/Dialog` を開いたとき、ダイアログの中の文字も Poppins と Crimson Text で描かれている

## つまずきポイント

### `shadcn init` が対話プロンプトで止まる

**症状**: `-y` を付けても `Which preset would you like to use?` で入力待ちになる。

**原因**: `-y` が抑えるのは確認プロンプトだけで、プリセットの選択は別枠になっている。

**対処**: `-p luma` のようにプリセットを明示する。`-d` でも通るが、その場合 base は `-b` ではなく既定の `base` になる。

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

### Storybook でダイアログの中だけ書体が変わる

**症状**: story の本文は Poppins なのに、`UI/Dialog` を開くとダイアログの中の文字がブラウザ既定の書体で描かれる。

**原因**: フォントの変数を story を包む要素にだけ当てている。ダイアログは `<body>` の直下に描画されるため、変数が届かず `font-sans` が解決できない。

**対処**: 手順 10 のとおり、`.storybook/preview.tsx` で `<html>` に `poppins.variable` と `crimsonText.variable` を当てる。
