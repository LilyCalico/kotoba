/**
 * ゲーム画面で共有する出現の動き。motion コンポーネントにそのまま展開して使う。
 * ルートの `MotionConfig reducedMotion="user"` の下では、移動・拡大縮小・回転が止まり、不透明度の変化だけが残る。
 */

/** チャットのログに積まれる要素に共通の出現。下からわずかに上がりながら現れる。 */
export const chatItemAppear = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: "easeOut" },
} as const;

/** ヒントと結果のウィンドウの出現。わずかに拡大しながら現れる。 */
export const cardAppear = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.25, ease: "easeOut" },
} as const;

/**
 * 結果のウィンドウの角にホログラムのステッカーが貼られる動き。ゲームの見せ場。
 * 大きく傾いた状態から、押し付けるように縮んで少し傾いた位置に収まる。ウィンドウが現れてから一拍おいて始める。
 */
export const stickerStick = {
  initial: { opacity: 0, scale: 1.8, rotate: -40 },
  animate: { opacity: 1, scale: 1, rotate: -12 },
  transition: { delay: 0.25, type: "spring", stiffness: 420, damping: 18, mass: 0.8 },
} as const;

/** 設問の提示からチャットへ移るとき、ヘッダーと入力欄を設問カードの変形に少し遅れて現す。 */
export const chromeAppear = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3, delay: 0.15, ease: "easeOut" },
} as const;
