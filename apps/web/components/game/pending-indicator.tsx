"use client";

import { motion } from "motion/react";

import { WINDOW_TITLE_CLASS, WindowTitleBar } from "@/components/ui/window";

export const PENDING_TEXT = "Thinking…";

const BLOCK_COUNT = 12;
const BLOCKS = Array.from({ length: BLOCK_COUNT }, (_, index) => index);

/** ブロックが左から右へ灯っていく 1 周の長さ（秒）。 */
const SWEEP_SECONDS = 1.8;

/**
 * 応答待ち。回答のピルが入る位置に、ペリウィンクルのタイトルバー「Thinking…」を持つ小さなウィンドウを左に寄せて置く。
 * 中の読み込みバーは、ブロックが左から順に灯っては消える。終わりの見えない待ちなので、進み具合は表さない。
 * 不透明度だけを動かすため、`reducedMotion="user"` の下でも位置は動かない。
 */
export function PendingIndicator() {
  return (
    <div className="window mr-auto flex w-[12.5rem] flex-col">
      <WindowTitleBar className="min-h-[1.375rem]" tone="system">
        <p className={WINDOW_TITLE_CLASS}>{PENDING_TEXT}</p>
      </WindowTitleBar>
      <div aria-hidden className="m-2.5 flex h-4 gap-0.5 border-[1.5px] border-border p-0.5">
        {BLOCKS.map((index) => (
          <motion.span
            animate={{ opacity: [0, 1, 1, 0] }}
            className="flex-1 bg-meter"
            initial={{ opacity: 0 }}
            key={index}
            transition={{
              delay: (index / BLOCK_COUNT) * SWEEP_SECONDS,
              duration: SWEEP_SECONDS,
              ease: "linear",
              repeat: Infinity,
              times: [0, 0.05, 0.6, 0.65],
            }}
          />
        ))}
      </div>
    </div>
  );
}
