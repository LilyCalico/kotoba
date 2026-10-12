# Motion の使い方

このリポジトリのゲーム画面を例に、Motion（`motion/react`）でアニメーションを書く方法をまとめる。何をどう動かすかの仕様は `docs/specifications/design.md` の「アニメーション」節にあり、ここでは「その仕様を Motion でどう書くか」を扱う。

使っているバージョンは `motion` 13 系。import は常に `motion/react` から行う。

## 全体像

| やりたいこと | 使う API | このリポジトリでの例 |
| --- | --- | --- |
| 要素が現れるときに動かす | `motion.*` の `initial` / `animate` / `transition` | ログの要素、ヒントカード、結果カード |
| 要素が消えるときに動かす | `AnimatePresence` と `exit` | 設問の提示からチャットへ移るときの背景の葉 |
| 別の要素どうしを 1 つながりの変形でつなぐ | `layoutId` | Floating の設問カード → Pinned の設問カード |
| 変形の中で子要素の歪みを抑える | `layout="position"` | 設問カードの中の文言 |
| ずっと繰り返す | キーフレーム配列と `repeat: Infinity` | 応答待ちの点、背景の葉 |
| OS の「視差効果を減らす」に従う | `MotionConfig reducedMotion="user"` | `app/providers.tsx` |

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
- **ヒントカードと結果カードの出現**は、コンポーネント自身（`motion.section`）に持たせる。Storybook でコンポーネント単体を開いたときにも動きを確認できる

包むときの注意として、包んだ `motion.div` がレイアウト上の親になる。中身の `ml-auto`（右寄せ）や `self-center`（中央寄せ）が効くよう、`ChatItem` 自身も `flex flex-col` にしている。

## 2. 消えるときの動き: AnimatePresence

React は要素を消すとき即座に DOM から外すため、そのままでは消える動きを付けられない。`AnimatePresence` で囲むと、子が外されるときに `exit` の動きが終わるまで DOM に残してくれる。

```tsx
// components/game/play-screen.tsx
<AnimatePresence>
  {phase !== "chat" && (
    <motion.div
      className="pointer-events-none absolute inset-0"
      exit={{ opacity: 0 }}
      key="leaves"
      transition={TEASER_LAYOUT_TRANSITION}
    >
      <LeafScatter variant="teaser" />
    </motion.div>
  )}
</AnimatePresence>
```

- `AnimatePresence` の**直下の子**に `key` を付ける。Motion は key で「どの子が消えたか」を見分ける
- 消えている間も要素は画面に残るので、クリックを遮らないよう `pointer-events-none` を付けている

## 3. 別の要素をつなぐ変形: layoutId

設問の提示では、画面中央に Floating の設問カードがある。チャットへ移ると、それは消えてヘッダー直下に Pinned の設問カードが現れる。React から見ると**別のコンポーネントが外れて、別のコンポーネントが付いた**だけだが、両方に同じ `layoutId` を渡すと、Motion が 1 枚のカードが移動・変形したように見せる。

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

`layout="position"` は「位置だけを補間し、大きさは即座に新しい値にする」指定。Floating と Pinned では文字の大きさが違う（`text-lg` と `text-sm`）。文字の大きさを補間すると字が歪むため、大きさは切り替わった時点で移し、位置だけを動かしている。

### 落とし穴 2: 角丸が歪む

scale で変形すると、CSS クラスで付けた角丸（`rounded-2xl`）も一緒に引き伸ばされる。Motion は `style` で渡した `borderRadius` だけを補正の対象にする。さらに補正できるのは px と % の値だけで、`calc()` や rem は補間できない。そのため設問カードでは角丸を `style` に px で渡している。

```tsx
style={{ borderRadius: floating ? FLOATING_RADIUS_PX : 0 }}  // 18px
```

`box-shadow` も同じ理由で、変形させる要素には `style` で与える。

## 4. 繰り返す動き: キーフレームと repeat

`animate` に配列を渡すとキーフレームになる。`repeat: Infinity` で繰り返す。

```tsx
// components/game/pending-indicator.tsx
<motion.span
  animate={{ opacity: [0.25, 1, 0.25] }}
  transition={{ delay: index * 0.15, duration: 1.2, ease: "easeInOut", repeat: Infinity }}
/>
```

- 3 つの点に `delay` を 0.15 秒ずつずらして、波のように光らせている
- 背景の葉（`leaf-scatter.tsx`）は、落下（`y: ["0%", "100%"]`）と揺れ（`rotate` と `x`）を別々の `motion.div` に分け、周期の違う 2 つの繰り返しを重ねている。負の `delay` を渡すと、動きの途中から始められる

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

- ルートで一括して従わせるので、個別のコンポーネントで reduce かどうかを判定しない
- 例外は背景の葉。止めるときに、落下の途中ではなく草案の座標に置き直したいので、`useReducedMotion()` で自分で判定している

### 見えない 1 コマ

reduce のとき、出現の最初の 1 コマだけは `initial` の transform（`y: 8` など）を持ったまま描かれることがある。このコマは不透明度が 0 なので目には見えず、次のコマで最終位置に移る。Playwright などで transform を記録して検証するときは、不透明度が 0 のコマを除いて判定する。

## 6. アニメーションとフォーカス・読み上げ

フォーカスの移動とライブリージョンの更新は、要素が DOM に入った時点で行い、動きの完了を待たない。不透明度が 0 の間でも要素はフォーカスを受けられる。`onAnimationComplete` を待ってからフォーカスを移すと、キーボードやスクリーンリーダーの利用者だけが待たされるため、そうしない。

## 7. 動きを確かめる

### Storybook

マウント時に動く要素は、story を開いた瞬間に一度だけ動く。何度も見たいときは、`key` を変えて描き直す story を用意する。React は `key` が変わると別の要素として作り直すので、出現の動きがもう一度再生される。

```tsx
// components/game/hint-card.stories.tsx の Reveal
const [count, setCount] = useState(1);
<Button onPress={() => setCount((value) => value + 1)}>Reveal</Button>
<HintCard {...args} key={count} />
```

`Game/TeaserCard/Settle` は、同じ `layoutId` で Floating と Pinned を切り替え、変形を再生する。

### ブラウザで reduce を試す

- macOS: システム設定 > アクセシビリティ > ディスプレイ > 視差効果を減らす
- Chrome DevTools: Rendering パネルの「Emulate CSS media feature prefers-reduced-motion」
- Playwright: `browser.newContext({ reducedMotion: "reduce" })`

## 8. つまずきやすい点

| 症状 | 原因と対処 |
| --- | --- |
| `motion.*` を使ったファイルで Server Component のエラーになる | Motion はブラウザで動く。ファイルの先頭に `"use client"` を書く |
| `exit` の動きが再生されない | `AnimatePresence` で囲んでいない、または直下の子に `key` がない |
| `layoutId` の変形で文字が歪む | 子に `layout`（大きさも変わるなら `layout="position"`）を付ける |
| `layoutId` の変形で角丸が歪む | 角丸をクラスではなく `style` の px で与える |
| 包んだら右寄せ・中央寄せが効かなくなった | 包んだ `motion.div` が新しい親になる。親を `flex flex-col` にして子の `ml-auto` / `self-center` を効かせる |
| `ease` の型エラー | 定義を切り出したオブジェクトに `as const` を付ける |

## 関連するファイル

| ファイル | 内容 |
| --- | --- |
| `apps/web/app/providers.tsx` | `MotionConfig reducedMotion="user"` |
| `apps/web/components/game/motion.ts` | 共有する出現の定義 |
| `apps/web/components/game/play-screen.tsx` | `ChatItem`、背景の葉の `AnimatePresence`、設問カードの `layoutId` |
| `apps/web/components/game/teaser-card.tsx` | `layoutId`、`layout="position"`、`style` の角丸 |
| `apps/web/components/game/hint-card.tsx` / `result-card.tsx` | カードの出現 |
| `apps/web/components/game/pending-indicator.tsx` | キーフレームの繰り返し |
| `apps/web/components/game/leaf-scatter.tsx` | 繰り返しの重ね合わせ、`useReducedMotion` |
