"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useSyncExternalStore } from "react";

const LEAF_SIZE = 49;

/**
 * 草案の 402 × 874 のフレームで引かれた座標を、置き場所の幅と高さに対する比率に直したもの。
 * `fall` は上端から下端まで落ちきる秒数で、葉ごとにずらして動きがそろわないようにする。
 */
const LEAVES = {
  start: [
    { left: 79.1, top: 7.0, fall: 14 },
    { left: 22.1, top: 25.1, fall: 17 },
    { left: 37.8, top: 87.6, fall: 15.5 },
  ],
  teaser: [
    { left: 19.2, top: 7.1, fall: 16 },
    { left: 78.6, top: 22.8, fall: 14.5 },
    { left: 50.0, top: 77.8, fall: 17.5 },
  ],
} as const;

/**
 * 背景で舞い落ちる葉のイラスト。画面ごとに草案の座標が異なるため、`variant` で選ぶ。
 * 各葉は草案の座標から落ち始め、左右に揺れながら下端へ抜け、上端の外から繰り返し落ちてくる。
 * `prefers-reduced-motion` が有効なときは動かさず、草案の座標に止めて置く。
 * サーバーは利用者の設定を知らないため、ハイドレーションが済むまでは設定によらず落ちる葉を描く。
 * 親の `relative` な要素いっぱいに広がり、装飾なので支援技術からは隠す。
 */
export function LeafScatter({ variant }: { variant: keyof typeof LEAVES }) {
  const reducedMotion = useReducedMotion();
  const hydrated = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {LEAVES[variant].map((leaf) =>
        hydrated && reducedMotion ? (
          <LeafImage
            className="absolute"
            key={leaf.left}
            style={{ left: `${leaf.left}%`, top: `${leaf.top}%` }}
          />
        ) : (
          // 葉 1 枚ぶん上端の外へはみ出した縦長の枠を 0% から 100% まで送ることで、
          // 葉を画面外から画面外まで落とす。負の delay で草案の座標の位置から始める。
          <motion.div
            animate={{ y: ["0%", "100%"] }}
            className="absolute inset-x-0 bottom-0"
            key={leaf.left}
            style={{ top: -LEAF_SIZE }}
            transition={{
              delay: (-leaf.fall * leaf.top) / 100,
              duration: leaf.fall,
              ease: "linear",
              repeat: Infinity,
            }}
          >
            <motion.div
              animate={{ rotate: [-18, 18, -18], x: [-14, 14, -14] }}
              className="absolute top-0"
              style={{ left: `${leaf.left}%` }}
              transition={{
                duration: leaf.fall / 3,
                ease: "easeInOut",
                repeat: Infinity,
              }}
            >
              <LeafImage />
            </motion.div>
          </motion.div>
        ),
      )}
    </div>
  );
}

function subscribeNothing() {
  return () => {};
}

function LeafImage(props: { className?: string; style?: React.CSSProperties }) {
  return (
    <Image
      alt=""
      height={LEAF_SIZE}
      loading="eager"
      src="/leaf.png"
      width={LEAF_SIZE}
      {...props}
    />
  );
}
