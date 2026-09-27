/**
 * ゲーム画面で共有する出現の動き。motion コンポーネントにそのまま展開して使う。
 * ルートの `MotionConfig reducedMotion="user"` の下では、移動と拡大縮小が止まり、不透明度の変化だけが残る。
 */

/** チャットのログに積まれる要素に共通の出現。下からわずかに上がりながら現れる。 */
export const chatItemAppear = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: "easeOut" },
} as const;

/** ヒントカードと結果カードの出現。わずかに拡大しながら現れる。 */
export const cardAppear = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.25, ease: "easeOut" },
} as const;

/** 設問の提示からチャットへ移るとき、ヘッダーと入力欄を設問カードの変形に少し遅れて現す。 */
export const chromeAppear = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3, delay: 0.15, ease: "easeOut" },
} as const;
