# Motion の使い方

このリポジトリのゲーム画面を例に、Motion（`motion/react`）でアニメーションを書く方法をまとめる。何をどう動かすかの仕様は `docs/specifications/design.md` の「アニメーション」節にあり、ここでは「その仕様を Motion でどう書くか」を扱う。

使っているバージョンは `motion` 13 系。import は常に `motion/react` から行う。

## 全体像

| やりたいこと | 使う API | このリポジトリでの例 |
| --- | --- | --- |
| 要素が現れるときに動かす | `motion.*` の `initial` / `animate` / `transition` | ログの要素、ヒントと結果のウィンドウ |
| 弾むように収める・一拍おいて始める | `type: "spring"` と `delay` | 結果のウィンドウに貼られるホログラムのステッカー |
| 条件によって出現の動きを省く | `initial={false}` | 開き直したときのスタート画面のウィンドウ |
| 別の要素どうしを 1 つながりの変形でつなぐ | `layoutId` | Floating の設問のウィンドウ → Pinned の設問のウィンドウ |
| 変形の中で子要素の歪みを抑える | `layout="position"` | 設問のウィンドウの中のタイトルバーと文言 |
| ずっと繰り返す | キーフレーム配列と `repeat: Infinity` | 応答待ちの読み込みバー |
| OS の「視差効果を減らす」に従う | `MotionConfig reducedMotion="user"` | `app/providers.tsx` |
| Motion を使わない動きで、視差効果を減らす設定を読む | `useReducedMotion` | 起動画面の打ち込み |

## 1. motion コンポーネントと出現の動き

`motion.div` や `motion.section` は、ふつうの HTML 要素にアニメーション用の props を足したもの。className などは通常の要素と同じように渡せる。

```tsx
import { motion } from "motion/react";

<motion.div
  initial={{ opacity: 0, y: 8 }}   // 描画された瞬間の値
  animate={{ opacity: 1, y: 0 }}   // そこから向かう値
  transition={{ duration: 0.2, ease: "easeOut" }}
/>
```

- `initial` は最初に描画された瞬間の値、`animate` はそこから向かう値。要素がマウントされると自動で `initial` → `animate` へ動く
- `y` は `transform: translateY()` の省略形。`x` / `scale` / `rotate` も同様に transform を組み立てる。`top` や `margin` を動かすとレイアウトの再計算が走るため、位置は transform で動かす
- `transition` の `duration` は秒。`ease` には `"easeOut"` などの名前か、3 次ベジェの 4 数値 `[0.22, 1, 0.36, 1]` を渡せる

### 定義を使い回す

同じ動きを複数の場所で使うときは、props のまとまりをオブジェクトにして展開する。このリポジトリでは `apps/web/components/game/motion.ts` に置いている。

```ts
// components/game/motion.ts
export const cardAppear = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.25, ease: "easeOut" },
} as const;
```

```tsx
// components/game/hint-card.tsx
<motion.section {...cardAppear} aria-label={`Hint ${index} of ${MAX_HINTS}`} ...>
```

`as const` を付けると `ease: "easeOut"` が `string` ではなくリテラル型になり、Motion の型に合う。

### 包んで当てるか、コンポーネント自身に持たせるか

- **ログの全要素に共通の動き**は、`play-screen.tsx` の `ChatItem` で包んで当てる。回答・発言・エラーなど中身の種類を問わず同じ動きになり、各コンポーネントは動きを知らなくてよい
- **ヒントと結果のウィンドウ、ステッカーの動き**は、コンポーネント自身（`motion.section` / `motion.div`）に持たせる。Storybook でコンポーネント単体を開いたときにも動きを確認できる

包むときの注意として、包んだ `motion.div` がレイアウト上の親になる。中身の `ml-auto`（右寄せ）や `self-center`（中央寄せ）が効くよう、`ChatItem` 自身も `flex flex-col` にしている。

## 2. 弾む動きと遅延: spring と delay

結果のウィンドウの右上の角には、ホログラムのステッカーが貼られる。ゲームの見せ場で、大きく傾いた状態から押し付けるように縮み、少し傾いた位置で弾んで止まる。

```ts
// components/game/motion.ts
export const stickerStick = {
  initial: { opacity: 0, scale: 1.8, rotate: -40 },
  animate: { opacity: 1, scale: 1, rotate: -12 },
  transition: { delay: 0.25, type: "spring", stiffness: 420, damping: 18, mass: 0.8 },
} as const;
```

```tsx
// components/game/result-card.tsx
<motion.div {...stickerStick} aria-hidden className="holo absolute -top-[1.375rem] -right-5 ...">
```

- `type: "spring"` にすると、時間（`duration`）ではなくばねの物理で動く。`stiffness` が大きいほど速く戻り、`damping` が小さいほど行き過ぎて弾む
- `delay` はウィンドウの出現（`cardAppear`、0.25 秒）が終わるのを待つためのもの。ウィンドウが現れてから貼られるので、2 つの動きが重ならない
- `rotate` も transform なので、reduced motion では止まり、不透明度だけが変わる

## 3. 別の要素をつなぐ変形: layoutId

設問の提示では、画面中央に Floating の設問のウィンドウがある。チャットへ移ると、それは消えてヘッダー直下に Pinned の設問のウィンドウが現れる。React から見ると**別のコンポーネントが外れて、別のコンポーネントが付いた**だけだが、両方に同じ `layoutId` を渡すと、Motion が 1 枚のウィンドウが移動・変形したように見せる。

```tsx
// 設問の提示（GameScreen）
<TeaserCard layoutId="teaser" teaser={game.teaser} variant="floating" />

// チャット（Chat）
<TeaserCard layoutId="teaser" teaser={state.teaser} variant="pinned" />
```

```tsx
// components/game/teaser-card.tsx
<motion.section layoutId={layoutId} transition={TEASER_LAYOUT_TRANSITION} ...>
```

### 仕組み

Motion は、消える要素の位置と大きさを覚えておき、新しく現れた要素をいったんその位置と大きさに見えるよう transform で変形させてから、本来の位置と大きさへ戻す。実際に DOM の幅や高さを少しずつ変えているのではなく、**最終的なレイアウトを先に確定させ、見た目だけを transform（translate と scale）で補間している**。この方式は FLIP と呼ばれ、レイアウトの再計算を毎フレーム起こさずに済む。

### 落とし穴 1: 子要素が引き伸ばされる

見た目を scale で変えるので、何もしないと中の文字も一緒に引き伸ばされて歪む。子に `layout` を付けると、Motion が親の scale を打ち消す補正をかける。

```tsx
<motion.p layout={layoutId ? "position" : undefined} transition={TEASER_LAYOUT_TRANSITION}>
  {teaser}
</motion.p>
```

`layout="position"` は「位置だけを補間し、大きさは即座に新しい値にする」指定。Floating と Pinned では文字の大きさが違う（`text-[2rem]` と `text-[1.5rem]`）。文字の大きさを補間すると字が歪むため、大きさは切り替わった時点で移し、位置だけを動かしている。

### 落とし穴 2: 角丸と影が歪む

scale で変形すると、CSS クラスで付けた角丸や影も一緒に引き伸ばされる。Motion が補正するのは `style` で渡した `borderRadius` と `boxShadow` だけで、値も px と % に限られる（`calc()` や rem は補間できない）。

設問のウィンドウは `window` の影を持つため、同じ影を `style` に px で渡し直している。インラインの `style` はクラスの指定より強いので、見た目は変わらず、Motion だけが補正できるようになる。

```tsx
// components/game/teaser-card.tsx
<motion.section className="window ..." layoutId={layoutId} style={{ boxShadow: "4px 4px 0 #2b2f5c" }}>
```

`var(--foreground)` のような CSS 変数も補間できないため、色は値で書く。1.5px の枠は補正の対象にならず、変形の間だけわずかに太さが変わるが、0.4 秒の間なので目立たない。

## 4. 繰り返す動き: キーフレームと repeat

`animate` に配列を渡すとキーフレームになる。`repeat: Infinity` で繰り返す。

```tsx
// components/game/pending-indicator.tsx
<motion.span
  animate={{ opacity: [0, 1, 1, 0] }}
  initial={{ opacity: 0 }}
  transition={{
    delay: (index / BLOCK_COUNT) * SWEEP_SECONDS,
    duration: SWEEP_SECONDS,
    ease: "linear",
    repeat: Infinity,
    times: [0, 0.05, 0.6, 0.65],
  }}
/>
```

- 読み込みバーの 12 個のブロックに、1 周の長さを 12 等分した `delay` をずらして与え、左から順に灯っては消えるようにしている
- `times` はキーフレームの配列と同じ長さで、各キーフレームに達する時刻を 0〜1 の割合で決める。すばやく灯り（0.05）、しばらく灯ったまま（0.6 まで）にしてから消す
- 不透明度だけを動かすので、reduced motion でも止まらない

## 5. reduced motion: MotionConfig

`app/providers.tsx` でアプリ全体を `MotionConfig reducedMotion="user"` で包んでいる。

```tsx
<MotionConfig reducedMotion="user">{children}</MotionConfig>
```

OS の「視差効果を減らす」（`prefers-reduced-motion: reduce`）が有効なとき、Motion は次のように振る舞う。

| 値の種類 | 振る舞い |
| --- | --- |
| 位置と大きさ（`x` / `y` / `scale` / `rotate` などの transform、`width` / `height` / `top` / `left` など）と、`layout` / `layoutId` の変形 | 補間せず、即座に最終値にする |
| それ以外（`opacity`、色など） | ふつうに補間する |

Motion の実装（`motion-dom` の `positionalKeys`）がこの区別をしている。そのため reduce のとき、スライドや拡大は止まり、フェードと応答待ちの点滅は残る。位置が動かないフェードは前庭障害の引き金になりにくい、という考え方による。

- ルートで一括して従わせるので、Motion の動きは個別のコンポーネントで reduce かどうかを判定しない

### Motion を使わない動きで reduce を読む: useReducedMotion

起動画面の打ち込みは、`setTimeout` で 1 文字ずつ state を進める動きで、Motion の値の補間ではない。`MotionConfig` はここには効かないため、`useReducedMotion` で設定を読み、自分で分岐する。

```tsx
// components/game/start-screen.tsx
const reduceMotion = useReducedMotion();
const showAll = !autoplay || reduceMotion;
<BootComputer text={showAll ? BOOT_TEXT : BOOT_TEXT.slice(0, typed)} />
```

`useReducedMotion` は OS の設定（`prefers-reduced-motion`）を返し、設定が変わると描き直す。reduce のときは文を最初から全部出し、一拍おいてスタート画面へ移る。カーソルの点滅は CSS のアニメーションなので、Tailwind の `motion-reduce:animate-none` で止める。

### 見えない 1 コマ

reduce のとき、出現の最初の 1 コマだけは `initial` の transform（`y: 8` など）を持ったまま描かれることがある。このコマは不透明度が 0 なので目には見えず、次のコマで最終位置に移る。Playwright などで transform を記録して検証するときは、不透明度が 0 のコマを除いて判定する。

## 6. 条件によって出現の動きを省く: initial={false}

`initial` に `false` を渡すと、マウントした時点から `animate` の値で描き、出現の動きを省く。スタート画面のウィンドウは、起動画面から移ったときだけ 0.92 倍から開き、同じタブで開き直したときは動かさない。

```tsx
// components/game/start-screen.tsx
<motion.div
  animate={{ opacity: 1, scale: 1 }}
  initial={booted ? { opacity: 0, scale: 0.92 } : false}
  transition={{ type: "spring", stiffness: 420, damping: 26 }}
>
```

## 7. アニメーションとフォーカス・読み上げ

フォーカスの移動とライブリージョンの更新は、要素が DOM に入った時点で行い、動きの完了を待たない。不透明度が 0 の間でも要素はフォーカスを受けられる。`onAnimationComplete` を待ってからフォーカスを移すと、キーボードやスクリーンリーダーの利用者だけが待たされるため、そうしない。

## 8. 動きを確かめる

### Storybook

マウント時に動く要素は、story を開いた瞬間に一度だけ動く。何度も見たいときは、`key` を変えて描き直す story を用意する。React は `key` が変わると別の要素として作り直すので、出現の動きがもう一度再生される。

```tsx
// components/game/hint-card.stories.tsx の Reveal
const [count, setCount] = useState(1);
<Button onPress={() => setCount((value) => value + 1)}>Reveal</Button>
<HintCard {...args} key={count} />
```

`Game/TeaserCard/Settle` は、同じ `layoutId` で Floating と Pinned を切り替え、変形を再生する。`Game/StartScreen/Boot` は起動画面の打ち込みを再生し、`Game/StartScreen/BootTyped` は打ち終えた状態で止める。

### ブラウザで reduce を試す

- macOS: システム設定 > アクセシビリティ > ディスプレイ > 視差効果を減らす
- Chrome DevTools: Rendering パネルの「Emulate CSS media feature prefers-reduced-motion」
- Playwright: `browser.newContext({ reducedMotion: "reduce" })`

## 9. つまずきやすい点

| 症状 | 原因と対処 |
| --- | --- |
| `motion.*` を使ったファイルで Server Component のエラーになる | Motion はブラウザで動く。ファイルの先頭に `"use client"` を書く |
| `layoutId` の変形で文字が歪む | 子に `layout`（大きさも変わるなら `layout="position"`）を付ける |
| `layoutId` の変形で角丸や影が歪む | 角丸や影をクラスではなく `style` の px で与える |
| 包んだら右寄せ・中央寄せが効かなくなった | 包んだ `motion.div` が新しい親になる。親を `flex flex-col` にして子の `ml-auto` / `self-center` を効かせる |
| `ease` の型エラー | 定義を切り出したオブジェクトに `as const` を付ける |

## 関連するファイル

| ファイル | 内容 |
| --- | --- |
| `apps/web/app/providers.tsx` | `MotionConfig reducedMotion="user"` |
| `apps/web/components/game/motion.ts` | 共有する出現の定義と、ステッカーのスプリング |
| `apps/web/components/game/play-screen.tsx` | `ChatItem`、設問のウィンドウの `layoutId` |
| `apps/web/components/game/teaser-card.tsx` | `layoutId`、`layout="position"`、`style` の影 |
| `apps/web/components/game/hint-card.tsx` / `result-card.tsx` | ウィンドウの出現、ステッカーの貼り付け |
| `apps/web/components/game/pending-indicator.tsx` | キーフレームの繰り返しと `times` |
| `apps/web/components/game/start-screen.tsx` | `useReducedMotion`、`initial={false}` |
