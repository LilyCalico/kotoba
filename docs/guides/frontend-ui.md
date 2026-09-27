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

Luma は大きな角丸と広めの余白をとるスタイルで、ボタンは両端が丸く、ダイアログは影を落として浮かぶ。各スタイルの見た目は https://ui.shadcn.com/create で切り替えて見比べられる。

どちらのフラグも省略すると対話プロンプトに落ちるため、非対話で流すなら両方渡す。`--no-monorepo` は「モノレポとして足場を組み直すか」の確認を抑える。`apps/web` は既に存在するワークスペースなので組み直しは要らない。

`components.json` と `lib/utils.ts` が生まれ、`app/globals.css` にセマンティックトークンが書き込まれる。依存として `react-aria-components` / `class-variance-authority` / `cn` / `lucide-react` / `shadcn` / `tw-animate-css` が入る。

## 2. コンポーネントを入れる

```bash
cd apps/web
npx shadcn@latest add button input field label dialog -y
```

aria base に `text-field` という名前のコンポーネントは無い。テキスト入力は `input` が担い、その内部が React Aria の `TextField` にあたる。ラベル付きの入力は `Field` / `FieldLabel` / `Input` を組んで作る。

`dialog` は依存として `separator` も連れてくる。`FieldSeparator` の実体でもあるので取り除かない。

## 3. フォーカスリングを `data-focus-visible` に移す

生成されたコンポーネントは CSS 擬似クラスの `:focus-visible` を使う。React Aria は自前でキーボード操作を判定して `data-focus-visible` を付けるため、そちらに合わせる。

```bash
cd apps/web
sed -i '' 's/focus-visible:/data-[focus-visible]:/g' components/ui/button.tsx components/ui/input.tsx
sed -i '' 's/has-\[:focus-visible\]:/has-[[data-focus-visible]]:/g' components/ui/field.tsx
```

| 生成された記述 | 置き換え後 |
| --- | --- |
| `focus-visible:border-ring` | `data-[focus-visible]:border-ring` |
| `focus-visible:ring-3` | `data-[focus-visible]:ring-3` |
| `has-[:focus-visible]:ring-ring/50` | `has-[[data-focus-visible]]:ring-ring/50` |

`shadcn add` でコンポーネントを足すたびに同じ置き換えが要る。取りこぼしは次で見つかる。

```bash
grep -rn 'focus-visible:' apps/web/components/ui/
```

### 入力欄の輪郭を残す

Luma の `Input` は枠線を消し、`--input` を半透明にした塗りで入力欄を示す。このリポジトリの `--input` は、入力欄の輪郭がコントラスト比 3:1（WCAG 1.4.11）を満たすように濃くした色なので（手順 4）、塗りに回すと濃い灰緑の面になり、輪郭も失われる。`components/ui/input.tsx` の塗りを枠線に戻し、角丸・高さ・余白は Luma のまま使う。

| 生成された記述 | 置き換え後 |
| --- | --- |
| `border-transparent bg-input/50` | `border-input bg-transparent` |

無効状態は `disabled:bg-input/50` で塗り、有効な入力欄と見分ける。

## 4. デザイントークンを差し替える

`app/globals.css` の `:root` にある値を Kotoba のものにする。トークンの**名前は shadcn のものをそのまま使う**。追加するコンポーネントは無修正でこの語彙を参照するため、名前を変えると以後すべてのコンポーネントに手修正が要る。

| トークン | 値 | 役割 |
| --- | --- | --- |
| `--background` | `#f1f6ef` | 画面全体の背景 |
| `--foreground` | `#1c1c1c` | 本文 |
| `--card` / `--popover` | `#fbfdfb` | ヘッダー、設問カード、ヒントカード、AI の回答バブル、入力欄 |
| `--card-foreground` / `--popover-foreground` | `#1c1c1c` | サーフェス上の文字 |
| `--primary` | `#42823a` | 送信ボタン、ロゴ |
| `--primary-foreground` | `#fbfdfb` | アクセント上の文字 |
| `--secondary` / `--accent` | `#dde8d7` | プレイヤーの発言バブルと、その上に乗るホバー面 |
| `--secondary-foreground` / `--accent-foreground` | `#1c1c1c` | 同上の文字 |
| `--muted` / `--muted-foreground` | `#e8eee6` / `#6b6b6b` | カードのラベル・補足テキストとその下地 |
| `--border` | `#dddddd` | 装飾的な区切り線 |
| `--input` | `#7f8c7d` | コントロールの輪郭 |
| `--ring` | `#42823a` | フォーカスリング |

`--destructive` は配色にない役割なので shadcn 既定のまま残す。`chart-*` と `sidebar-*` は使う画面が無いので、`@theme inline` の割り当てごと消す。必要になった時点で `shadcn add` が書き戻す。

値は Figma の variables（`background` / `background-white` / `border` / `primary`）を出発点にし、コントラスト比が WCAG AA を満たすところまで詰めたもの。非機能要件が European Accessibility Act 準拠を意識すると定めているため、AA を下回る値は採らない。

| ペア | 比 | 要求 |
| --- | --- | --- |
| `--foreground` / `--background` | 15.56 | 4.5（AA 通常テキスト） |
| `--muted-foreground` / `--card` | 5.21 | 4.5 |
| `--primary-foreground` / `--primary` | 4.58 | 4.5 — Figma の `#45873c` のままなら 4.29 で未達 |
| `--ring` / `--background` | 4.27 | 3.0（AA 非テキスト） |
| `--input` / `--card` | 3.45 | 3.0（WCAG 1.4.11）— Figma の `#dddddd` のままなら 1.33 で未達 |

境界色を `--border` と `--input` に分けているのは、要求が異なるためである。カードの縁や区切り線は装飾であり比の要求を受けないが、入力欄の輪郭は「コントロールを識別するための境界」にあたり 3:1 を満たす必要がある。shadcn がこの 2 つを別トークンとして持っているので、カードの淡い縁を保ったまま入力欄だけ濃くできる。

トークンを足し引きしたら比を計り直す。

```bash
node -e '
const lin = (c) => (c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const L = (h) => { const n = parseInt(h.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
const [a, b] = process.argv.slice(1);
const [hi, lo] = [L(a), L(b)].sort((x, y) => y - x);
console.log(((hi + 0.05) / (lo + 0.05)).toFixed(2));
' "#fbfdfb" "#42823a"
```

## 5. ライトテーマだけにする

`:root` の下にある `.dark` の値ブロックを消す。一方で `@custom-variant dark (&:is(.dark *));` は残す。

```css
@custom-variant dark (&:is(.dark *));
```

この 1 行が無いと `dark:` は Tailwind 既定の `prefers-color-scheme` で解決され、OS の設定に反応してしまう。残しておけば `dark:` はクラス `.dark` に紐づき、どこにも付けない限り発火しない。生成されたコンポーネントに残る `dark:` 記述は、この状態では何もしない。

## 6. フォントを差し替える

和文・欧文を 1 書体でまかなう Zen Maru Gothic を使う。`app/fonts.ts` に置き、`app/layout.tsx` と Storybook の両方から読む。

```ts
import { Zen_Maru_Gothic } from "next/font/google";

export const zenMaruGothic = Zen_Maru_Gothic({
  variable: "--font-sans",
  weight: ["400", "700"],
  subsets: ["latin"],
});
```

可変フォントではないので `weight` の明示が要る。`variable` を `--font-sans` にすると、`globals.css` の `@theme inline` が持つ `--font-sans` の参照先になり、Tailwind の `font-sans` から引ける。

`app/layout.tsx` で `<html>` に当て、あわせて `metadata` と `lang` を差し替える。UI の文言は英語なので、`lang` は `en`、`metadata` も英語で書く。

```tsx
export const metadata: Metadata = {
  title: { default: "kotoba", template: "%s | kotoba" },
  description:
    "Ask yes-or-no questions to uncover a Swedish word for a feeling you've never been able to name.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${zenMaruGothic.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

scaffold が入れる `Geist` / `Geist_Mono` は落とす。`globals.css` の `@theme inline` にある `--font-mono: var(--font-geist-mono);` も一緒に消すと、`font-mono` は Tailwind 既定のスタックに戻る。

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

## 8. アセットを置き、scaffold の残骸を消す

[Figma の草案](https://www.figma.com/design/mWFhHDTqPHFBKhIMrkKj9B/Kotoba?node-id=112-16215) から**背景透過 PNG で @2x**（Figma の表示サイズの 2 倍）で書き出す。

| 対象 | Figma ノード | 書き出すサイズ | 置き場所 |
| --- | --- | --- | --- |
| kotoba ロゴ | `112:15958` | 440 × 132 | `apps/web/public/kotoba-logo.png` |
| 葉のイラスト | `112:15955` | 98 × 98 | `apps/web/public/leaf.png` |

`app/favicon.ico` は葉から作る。16 / 32 / 48 の 3 サイズを束ねる。

```bash
cd apps/web
for s in 16 32 48; do sips -z $s $s public/leaf.png --out "/tmp/leaf-$s.png"; done
npx png-to-ico /tmp/leaf-16.png /tmp/leaf-32.png /tmp/leaf-48.png > /tmp/favicon-raw.ico
```

`png-to-ico` は渡していない 256 × 256 を勝手に足す。そのままだと 285KB になるので落とす。

```bash
node --input-type=module -e '
import { readFileSync, writeFileSync } from "node:fs";
const ico = readFileSync("/tmp/favicon-raw.ico");
const entries = [];
for (let i = 0; i < ico.readUInt16LE(4); i++) {
  const dir = ico.subarray(6 + i * 16, 22 + i * 16);
  if ((dir[0] || 256) > 48) continue;
  const at = dir.readUInt32LE(12);
  entries.push({ dir, data: ico.subarray(at, at + dir.readUInt32LE(8)) });
}
entries.sort((a, b) => (a.dir[0] || 256) - (b.dir[0] || 256));
const header = Buffer.alloc(6);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(entries.length, 4);
let at = 6 + entries.length * 16;
const dirs = entries.map(({ dir, data }) => {
  const out = Buffer.from(dir);
  out.writeUInt32LE(data.length, 8);
  out.writeUInt32LE(at, 12);
  at += data.length;
  return out;
});
writeFileSync("app/favicon.ico", Buffer.concat([header, ...dirs, ...entries.map((e) => e.data)]));
'
file app/favicon.ico   # MS Windows icon resource - 3 icons, 16x16, 32 bits/pixel, ...
```

scaffold の残骸を消す。

```bash
cd apps/web
rm public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```

`app/page.tsx` は Next.js のテンプレートを捨て、スタート画面にする。ロゴ・リード文・区切り線・説明文・START ボタンを縦に積み、中央カラム（`max-w-[42rem]`）の中に葉のイラスト（`LeafScatter`）を散らす。中身はプロダクトのコードとして `apps/web/app/page.tsx` にある。

ロゴは `<h1>` に入れる。E2E の smoke テストが見出しの存在を確かめている。

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
  staticDirs: ["../public"],
};

export default config;
```

`.storybook/preview.tsx` では、アプリのルートと同じプロバイダ・フォント・`globals.css` を当てる。story 側で配色や書体を指定する必要がなくなり、本番と同じ条件で見比べられる。locale は `Providers` が持つ `en` がそのまま効く。

```tsx
import type { Preview } from "@storybook/nextjs-vite";
import { zenMaruGothic } from "../app/fonts";
import { Providers } from "../app/providers";
import "../app/globals.css";

document.documentElement.classList.add(zenMaruGothic.variable);
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

1. トップページの背景が緑みを帯びた淡いオフホワイトで、本文が丸ゴシックで描かれている
2. OS の外観をダークにしても配色が変わらない
3. Storybook で **Tab キー**を押すとフォーカスされたボタンに緑のリングが出る。マウスでクリックした場合は出ない
4. `UI/Dialog` が Esc で閉じ、Tab がダイアログ内に閉じ込められる
5. `UI/Dialog` を開いたとき、ダイアログの中の文字も丸ゴシックで描かれている

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

### 生成した favicon.ico が 285KB になる

**症状**: 16 / 32 / 48 の PNG しか渡していないのに、`png-to-ico` の出力が 285KB ある。

**原因**: `png-to-ico` は入力に無い 256 × 256 を足す。その 1 枚だけで 270KB を占める。

**対処**: 手順 8 のスクリプトで ICO のディレクトリから 48 より大きいエントリを落とす。3 エントリ・15KB になる。

### フォーカスリングの太さを測ると 0.1px になる

**症状**: Tab を押した直後に `getComputedStyle` で `boxShadow` を読むと、幅が 3px ではなく 0.1px 前後になる。

**原因**: ボタンの基底クラスに `transition-all` が入っており、リングが描き切るまでに時間がかかる。

**対処**: 測る前に待つ。自動で確かめるなら 500ms 程度置いてから読む。

### `pnpm install` が `Ignored build scripts: esbuild` と言い続ける

**症状**: インストールのたびに警告が出る。`pnpm-workspace.yaml` の `ignoredBuiltDependencies` に足しても消えない。

**原因**: `ignoredBuiltDependencies` はビルドスクリプトを走らせない決定を記録するもので、記録した事実の告知そのものは止まらない。

**対処**: 放置してよい。esbuild のネイティブバイナリは `@esbuild/<platform>` として `optionalDependencies` 経由で入るため、postinstall を走らせなくても解決する。`pnpm approve-builds` で許可する必要はない。

### 日本語が別のフォントで描かれる

**症状**: 欧文は Zen Maru Gothic なのに和文だけ OS 既定の書体になる。

**原因**: フォントを `<html>` に当てていない。

**対処**: `subsets` はプリロードする範囲の指定であって、self-host する範囲の指定ではない。日本語のグリフは unicode-range で分割された別ファイルとして必ず落ちてくる（`next build` 後に `.next/static/media` へ 200 個以上の `.woff2` が並ぶ）。`subsets: ["latin"]` のままでよく、確認すべきは `zenMaruGothic.variable` が `<html>` の `className` に入っているかどうか。

### Storybook でダイアログの中だけ明朝体になる

**症状**: story の本文は丸ゴシックなのに、`UI/Dialog` を開くとダイアログの中の文字がブラウザ既定の明朝体で描かれる。

**原因**: フォントの変数を story を包む要素にだけ当てている。ダイアログは `<body>` の直下に描画されるため、変数が届かず `font-sans` が解決できない。

**対処**: 手順 10 のとおり、`.storybook/preview.tsx` で `<html>` に `zenMaruGothic.variable` を当てる。
