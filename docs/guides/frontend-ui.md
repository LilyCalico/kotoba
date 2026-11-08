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

Luma は大きな角丸と広めの余白をとるスタイルで、各スタイルの見た目は https://ui.shadcn.com/create で切り替えて見比べられる。生成されたコンポーネントの見た目は、手順 3 と 4 で Kotoba のもの（角は四角、読ませるものはウィンドウ、主ボタンはキーキャップ、フォーカスリングは濃い輪郭）に寄せる。Luma は余白の取り方とコンポーネントの構成の土台として使う。

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

生成されたコンポーネントは、フォーカスリングを `focus-visible:ring-*` の box-shadow で描く。このリポジトリでは、フォーカスリングをすべて `globals.css` の `focus-ring` ユーティリティ（手順 4）に揃える。2px の濃い輪郭を 2px 離して描き、地・ウィンドウ・キーキャップのどの面の上でも見える。

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

Luma の `Input` は枠線を消し、`--input` を半透明にした塗りで入力欄を示す。入力欄の輪郭はコントラスト比 3:1（WCAG 1.4.11）を満たす必要があるため、`components/ui/input.tsx` は塗りを白（`bg-card`）にして、`--input` の 1.5px の枠線で輪郭を示し、内側の左上に淡い影を落として凹んだ入力欄に見せる。角は四角（`rounded-none`）、高さは 48px（`h-12`）にする。

| 生成された記述 | 置き換え後 |
| --- | --- |
| `h-9 … rounded-3xl border border-transparent bg-input/50` | `h-12 … rounded-none border-[1.5px] border-input bg-card shadow-[inset_0.125rem_0.125rem_0_#e4e6f8]` |

無効状態は `disabled:opacity-60` で薄め、有効な入力欄と見分ける。

## 4. デザイントークンを差し替える

`app/globals.css` の `:root` にある値を Kotoba のものにする。トークンの**名前は shadcn のものをそのまま使う**。追加するコンポーネントは無修正でこの語彙を参照するため、名前を変えると以後すべてのコンポーネントに手修正が要る。shadcn の語彙にない役割（方眼・キーキャップ・プレイヤーの発言・ラベル・タイトルバー・読み込みバー・回答）だけを、名前を足して持つ。

配色は Y2K パステルのデスクトップで、役割ごとに色を割り当てる（`docs/specifications/design.md`「デザイントークン」）。

| トークン | 値 | 役割 |
| --- | --- | --- |
| `--background` / `--grid` | `#fce7f3` / `#f5cbe6` | 画面の地と方眼の線 |
| `--foreground` | `#2b2f5c` | 本文 |
| `--card` / `--popover` | `#ffffff` | ウィンドウ、入力欄 |
| `--card-foreground` / `--popover-foreground` | `#2b2f5c` | 面の上の文字 |
| `--primary` / `--primary-hover` / `--primary-foreground` | `#f39fcb` / `#ee8cbf` / `#2b2f5c` | 主ボタンのキーキャップの縁、そのホバー、文字 |
| `--keycap-face-from` / `--keycap-face-via` / `--keycap-face-to` | `#f6b2d6` / `#fad0e6` / `#ffeff7` | キーキャップの面のグラデーション |
| `--keycap-shadow` | `#3a3f6e` | キーキャップの影 |
| `--secondary` / `--secondary-foreground` | `#ffffff` / `#2b2f5c` | 副ボタン（ヒント・Cancel） |
| `--accent` / `--accent-foreground` | `#fdf0f7` / `#2b2f5c` | 副ボタンのホバー |
| `--muted` / `--muted-foreground` | `#fce7f3` / `#5c5f86` | 例文の下地と、補足テキスト |
| `--border` / `--input` | `#2b2f5c` | ウィンドウとコントロールの輪郭 |
| `--ring` | `#2b2f5c` | フォーカスリング |
| `--destructive` / `--destructive-foreground` | `#b42350` / `#ffffff` | 入力の誤り |
| `--bubble` / `--bubble-foreground` | `#2b2f5c` / `#ffffff` | プレイヤーの発言の吹き出し |
| `--label` | `#dcd0ff` | 設問のタイトルバーと品詞のピル |
| `--titlebar-hint` / `--titlebar-result` / `--titlebar-system` | `#f9d28f` / `#f4a9d2` / `#8f9bee` | ヒント／結果とスタート画面／応答待ちとダイアログのタイトルバー |
| `--meter` | `#6f7fe0` | 読み込みバーとヒントの残りのブロック |
| `--answer-yes` / `--answer-no` / `--answer-unclear` / `--answer-meta` | `#c5e17a` / `#ffb3a7` / `#addbff` / `#ffe08a` | 回答のピル |
| `--radius` | `0` | 角は四角。キーキャップ・ピル・吹き出し・パソコンの筐体だけを個別に丸める |

足したトークンは `@theme inline` で `--color-*` に割り当て、`bg-bubble` や `bg-titlebar-hint` のように Tailwind から引けるようにする。`--grid` とキーキャップの値はユーティリティの中だけで使うため、割り当てない。`chart-*` と `sidebar-*` は使う画面が無いので、割り当てごと消す。必要になった時点で `shadcn add` が書き戻す。

非機能要件が European Accessibility Act 準拠を意識すると定めているため、WCAG AA を下回る組み合わせは採らない。

| ペア | 比 | 要求 |
| --- | --- | --- |
| `--foreground` / `--background` | 10.74 | 4.5（AA 通常テキスト） |
| `--muted-foreground` / `--background` | 5.20 | 4.5 |
| `--muted-foreground` / `--card` | 6.11 | 4.5 |
| `--primary-foreground` / `--keycap-face-from`（面のいちばん濃いところ） | 7.37 | 4.5 |
| `--bubble-foreground` / `--bubble` | 12.62 | 4.5 |
| `--foreground` / 回答・ラベル・タイトルバーの各色 | 4.86〜9.79 | 4.5 |
| `--destructive` / `--card` | 6.37 | 4.5 |
| `--border` / `--background` | 10.74 | 3.0（WCAG 1.4.11） |
| `--meter` / `--card` | 3.63 | 3.0（WCAG 1.4.11） |
| `--ring` / `--background` | 10.74 | 3.0（AA 非テキスト） |

いちばん低い 4.86 はペリウィンクルのタイトルバー（`--titlebar-system`）の上の「Thinking…」である。補足の文字が方眼の線（`--grid`）に重なる部分は 4.24 になるが、線は 1px で文字の大半は地の上に載る。方眼は `background-image` で描くため、axe はその上の文字のコントラストを判定できず「要確認」に回す。上の表の比で担保する。

`globals.css` には、トークンのほかに 6 つのユーティリティを置く。

| ユーティリティ | 中身 | 使う場所 |
| --- | --- | --- |
| `grid-paper` | 地の色に 26px 間隔の 1px の方眼を引く | `<body>`、Storybook の story を包む要素 |
| `window` | 白い面、1.5px の紺の枠、4px ずらしたベタの影 | 設問・ヒント・応答待ち・ダイアログ・トースト。タイトルバーは `components/ui/window.tsx` の `WindowTitleBar` で載せる |
| `keycap` | 紺の枠の内側にピンクの縁、`::before` で横向きのグラデーションの面を敷き、4px の紺の影。押すと影の分だけ沈む。丸みは `--keycap-radius`、面は `--keycap-face` で差し替える | 主ボタン（`buttonVariants` の `default` と、送信の四角いキー `key`） |
| `pressable` | 1.5px の枠と、2px ずらしたベタの影（`--shadow-press`）。押すと影の分だけ沈んで影が消える | 副ボタン（`buttonVariants` の `outline` / `secondary`） |
| `focus-ring` | 2px の濃い輪郭を 2px 離して描く | フォーカスを受けるすべての要素 |
| `holo` | ピンク・空色・ライム・黄・ラベンダーを巡る円錐グラデーション | ホログラムのステッカー |

`keycap` の面を `::before` で描くのは、`buttonVariants` を `Link` にも当てるためである。面を子要素で組むとリンクとボタンで中身の組み方を揃える必要が出るが、疑似要素なら class だけで済む。面は `z-index: -1` にし、キーキャップ自身に `isolation: isolate` を当てて、文字の下・キーキャップの縁の上に重ねる。

トークンを足し引きしたら比を計り直す。

```bash
node -e '
const lin = (c) => (c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const L = (h) => { const n = parseInt(h.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
const [a, b] = process.argv.slice(1);
const [hi, lo] = [L(a), L(b)].sort((x, y) => y - x);
console.log(((hi + 0.05) / (lo + 0.05)).toFixed(2));
' "#2b2f5c" "#8f9bee"
```

## 5. ライトテーマだけにする

`:root` の下にある `.dark` の値ブロックを消す。一方で `@custom-variant dark (&:is(.dark *));` は残す。

```css
@custom-variant dark (&:is(.dark *));
```

この 1 行が無いと `dark:` は Tailwind 既定の `prefers-color-scheme` で解決され、OS の設定に反応してしまう。残しておけば `dark:` はクラス `.dark` に紐づき、どこにも付けない限り発火しない。生成されたコンポーネントに残る `dark:` 記述は、この状態では何もしない。

## 6. フォントを差し替える

UI の文には Poppins、読ませる文（設問・ヒント・正解の単語と定義）には Crimson Text、画面の部品（ワードマーク・タイトルバー・ボタン・起動画面の文字）には Pixelify Sans を使う。`app/fonts.ts` に置き、`app/layout.tsx` と Storybook の両方から読む。

```ts
import { Crimson_Text, Pixelify_Sans, Poppins } from "next/font/google";

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

export const pixelifySans = Pixelify_Sans({
  variable: "--font-pixel",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});
```

Poppins と Crimson Text は可変フォントではないので `weight` の明示が要る。Pixelify Sans は可変フォントだが、使う太さに絞って読み込む量を減らす。`variable` を `--font-sans` / `--font-serif` / `--font-pixel` にすると、`globals.css` の `@theme inline` の参照先になり、Tailwind の `font-sans` / `font-serif` / `font-pixel` から引ける。

`app/layout.tsx` で `<html>` に 3 つの変数を当て、あわせて `metadata` と `lang` を差し替える。UI の文言は英語なので、`lang` は `en`、`metadata` も英語で書く。

```tsx
export const metadata: Metadata = {
  title: { default: "kotoba", template: "%s | kotoba" },
  description:
    "Ask yes-or-no questions to uncover a Swedish word for a feeling you've never been able to name.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} ${crimsonText.variable} ${pixelifySans.variable} h-full antialiased`}>
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

画像のアセットは持たない。ロゴは Pixelify Sans の文字で組み、起動画面のパソコン・ウィンドウ・ホログラムのステッカーは CSS で、マウスカーソルとウィンドウの箱の記号はインラインの SVG で描く。

タブのアイコンは `app/icon.svg` に置く。Next.js はこのファイル名を見て `<link rel="icon">` を出す。方眼のピンクの地に、ペリウィンクルの筐体のパソコンを置いた 32 × 32 の SVG で、配色はトークンの値と揃える。

scaffold の残骸を消す。

```bash
cd apps/web
rm app/favicon.ico public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```

`app/page.tsx` は Next.js のテンプレートを捨て、`components/game/start-screen.tsx` の `StartScreen` を描くだけにする。起動画面（パソコンへの打ち込みと Skip）からスタート画面（welcome.txt のウィンドウ）へ移る状態を持つため、`StartScreen` はクライアントコンポーネントにする。起動画面を見たかは `sessionStorage` に記録し、サーバーでは読めないので、ハイドレーションが終わるまでは中身を描かない。

起動画面とスタート画面のどちらにも `<h1>` を置く。E2E の smoke テストが見出しの存在を確かめている。

`buttonVariants` は `components/ui/button-variants.ts` に置く。`"use client"` を持たないので、サーバーコンポーネントからも `Link` に当てられる。

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
import { crimsonText, pixelifySans, poppins } from "../app/fonts";
import { Providers } from "../app/providers";
import "../app/globals.css";

document.documentElement.classList.add(poppins.variable, crimsonText.variable, pixelifySans.variable);
document.documentElement.lang = "en";

const preview: Preview = {
  parameters: { layout: "fullscreen" },
  decorators: [
    // 画面全体を描く story は `parameters.page: true` を指定し、中央寄せと余白を当てずに描く。
    (Story, { parameters }) => (
      <Providers>
        {parameters.page ? (
          <div className="grid-paper flex min-h-screen flex-col font-sans text-foreground">
            <Story />
          </div>
        ) : (
          <div className="grid-paper flex min-h-screen flex-col items-center justify-center gap-6 p-8 font-sans text-foreground">
            <Story />
          </div>
        )}
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

1. トップページの地が淡いピンクの方眼で、起動画面のパソコンの文字とワードマークが Pixelify Sans、スタート画面の見出しが Crimson Text、説明文が Poppins で描かれている
2. OS の外観をダークにしても配色が変わらない
3. Storybook で **Tab キー**を押すとフォーカスされたボタンに濃い輪郭のリングが出る。マウスでクリックした場合は出ない
4. `UI/Dialog` が Esc で閉じ、Tab がダイアログ内に閉じ込められる
5. `UI/Dialog` を開いたとき、ダイアログの中の文字も Poppins・Crimson Text・Pixelify Sans で描かれている

## 文言と UI 言語を足す

UI の文言は `lib/i18n/messages/` の言語ごとの辞書に置き、コンポーネントに直書きしない。言語を URL で分け、ライブラリを使わずに辞書を持つ理由は `docs/adr/0011-ui-locale-in-url-with-own-dictionaries.md` にある。

### 文言を足す

1. `lib/i18n/messages/en.ts` の、その文言を出すコンポーネントの節に足す。新しいコンポーネントなら節を作る。値を取る文言（数・待つ時間・単語）は、文の全体を返す関数にする。言語ごとに語順が変わるため、言い回しの一部だけを関数にして文の残りと連結しない
2. `lib/i18n/messages/ja.ts` の同じ位置に日本語を書く。`index.ts` の `messages` が `Record<UiLocale, Messages>` のため、抜けると `pnpm typecheck` が落ちる。数と単位の間（「1 分」）は、改行しない空白（`NBSP`）にする
3. クライアントコンポーネントは `useMessages()` で今の言語の辞書を引く。辞書は関数を持ち、サーバーからクライアントへ props で渡せないため、クライアントで言語から引く。サーバーで使う場所（`generateMetadata` など）は `messages[lang]` を引く。遊び方で変わる文言は、`useGameMode()` の遊び方（サーバーでは `gameModeFor(lang)`）で引く（下の「UI 言語ごとの遊び方」）
4. Story と E2E は、文言を辞書から引いて確かめる。Story の play 関数は `storyMessages(globals)` で、Storybook のツールバーで選んだ言語の辞書を引く。E2E は `e2e/` から辞書を相対パスで読み込む（`import { ja } from "../../apps/web/lib/i18n/messages/ja.js"`）。このため辞書のファイルは、ほかのモジュールを読み込まない

### UI 言語を足す

1. `packages/shared/src/game.ts` の `uiLocaleSchema` に言語のコードを足す。web の UI 言語と、api のゲーム開始の `locale` の両方がこれを使う。api が設問・ヒント・結果をその言語で返すには、単語の多言語テキスト（`docs/adr/0004-localized-word-text-as-jsonb.md`）にもその言語が要る
2. `lib/i18n/messages/` にその言語の辞書を書き、`index.ts` の `messages` に足す。足すまで型検査が落ちる
3. `lib/i18n/locale.ts` の `LOCALE_NAMES` に、その言語自身で書いた言語名と短い名前を足す。スタート画面の言語の切り替えは、今の言語以外のすべての UI 言語へのリンクを並べる
4. 専用の書体が要る言語は、`app/fonts.ts` に書体を足し、日本語と同じく `app/[lang]/layout.tsx` と `.storybook/preview.tsx` で `<html>` の書体の変数に当てる
5. `.storybook/preview.tsx` のツールバーの `items` に言語を足す
6. `lib/game/mode.ts` の `GAME_MODE` に、その言語で遊ぶ遊び方を足す（下の「UI 言語ごとの遊び方」）

ページの生成（`generateStaticParams`）と Accept-Language の振り分けは `LOCALES` から作るため、手を入れなくても新しい言語を扱う。

### UI 言語ごとの遊び方

遊び方は UI 言語で決まり、日本語は意味当て、英語は単語当てで遊ぶ（`docs/adr/0012-game-mode-as-separate-axis-from-locale.md`）。web の中で遊び方を分ける場所は次のとおり。

| 場所 | 分けるもの |
| --- | --- |
| `lib/game/mode.ts` の `gameModeFor` | UI 言語から遊び方を決める唯一の場所。クライアントでは `useGameMode()`、サーバーではページの説明（`generateMetadata`）がこれを呼ぶ |
| `lib/game/mode-context.tsx` の `useGameMode()` | 部品が文言を引く遊び方。ゲームの画面の中では、`GameModeProvider` が配る、始まったゲームの遊び方（開始の応答の `mode`）を返す。それ以外（スタート画面とゲーム開始のリクエスト）では `gameModeFor` で決める |
| `lib/game/state.ts` の `GameState.opening` | 開始の応答（`GameStart`）の遊び方ごとの形を、最初に見せるもの（設問か、単語と読み）として持つ |
| `components/game/play-screen.tsx` | ゲーム開始の `mode` に `useGameMode()` を送り、始まったゲームの遊び方を `GameModeProvider` で配る。`OpeningCard` は、単語当ては `TeaserCard`、意味当ては `WordCard` を、提示とチャットの両方に出す |
| `lib/game/mock-client.ts` | 開始の応答・ヒント・入力の判定を遊び方で分け、api と同じ形を返す |
| `lib/i18n/messages/` の辞書 | 遊び方で変わる文言を、`GameMode` の値をキーにして持つ |

遊び方で変わる文言（ページの説明・スタート画面の見出しと説明・ギブアップの確認・入力欄の名前・正誤のフィードバック・結果の見出し）は、どの言語の辞書にも両方の遊び方の文言を書き、その場所で遊び方をキーにして持つ。辞書は各値に `satisfies ByMode`（`Record<GameMode, string>`）を付け、遊び方が増えたときの抜けを辞書の型検査で見つける。

```ts
input: {
  label: {
    guess_word: "Ask a question or guess the word",
    guess_meaning: "Ask a question or guess the meaning",
  } satisfies ByMode,
},
```

部品は `useGameMode()` で今の遊び方を受け取り、`t.label[mode]` のように引く。ゲームの画面の中は始まったゲームの遊び方で引くため、最初に見せるカードと文言は常に同じ遊び方に従う。Story は `storyGameMode(globals)`、E2E は `gameModeFor(locale)` で、同じく遊び方を引く。

遊び方を UI 言語と別に選べるようにするときは、`gameModeFor` を呼んでいる 2 か所（`useGameMode()` と `generateMetadata`）を、選んだ遊び方を返すよう置き換える。ゲーム開始のリクエストは `useGameMode()` を送るため、始まるゲームと文言の遊び方もそろう。

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

**対処**: 手順 10 のとおり、`.storybook/preview.tsx` で `<html>` に `poppins.variable`・`crimsonText.variable`・`pixelifySans.variable` を当てる。

### ボタンの角や枠が `keycap` の指定どおりにならない

**症状**: `buttonVariants` に `rounded-none` や `border-transparent` を残すと、キーキャップの角が丸くならず、紺の枠も消える。

**原因**: `keycap` も `rounded-none` も同じ utilities レイヤーのクラスで、同じプロパティを指定する。どちらが勝つかは class の並びではなく、生成された CSS の並びで決まる。`--radius` を 0 にしているため、`rounded-xl` のような名前付きの丸みも 0 になる。

**対処**: `buttonVariants` の共通部分には角と枠の指定を置かない。キーキャップの丸みは `--keycap-radius` で、ほかの丸い部品は `rounded-[0.75rem]` のような値の直書きで指定する。
