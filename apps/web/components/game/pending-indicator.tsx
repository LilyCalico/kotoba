"use client";

import { HourglassIcon } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { chatItemAppear } from "@/components/game/motion";
import { WINDOW_TITLE_CLASS, WindowTitleBar } from "@/components/ui/window";

export const PENDING_TEXT = "Thinking…";

/** 応答待ちが長引いたときに、読み込みバーの下に添える詫びの文言。 */
export const SLOW_PENDING_TEXT =
  "Sorry, give me a moment to think — this is taking a little longer than usual.";

/** 応答待ちがこの長さ（ミリ秒）を超えたら、`SLOW_PENDING_TEXT` を出す。 */
export const SLOW_PENDING_AFTER_MS = 2000;

const BLOCK_COUNT = 12;
const BLOCKS = Array.from({ length: BLOCK_COUNT }, (_, index) => index);

/** ブロックが左から右へ灯っていく 1 周の長さ（秒）。 */
const SWEEP_SECONDS = 1.8;

/**
 * 応答待ち。回答のピルが入る位置に、ペリウィンクルのタイトルバー「Thinking…」を持つ小さなウィンドウを左に寄せて置く。
 * 中の読み込みバーは、ブロックが左から順に灯っては消える。終わりの見えない待ちなので、進み具合は表さない。
 * 不透明度だけを動かすため、`reducedMotion="user"` の下でも位置は動かない。
 *
 * `slowNotice` を渡すと、応答待ちが `SLOW_PENDING_AFTER_MS` を超えたところで、ウィンドウの下に詫びの文言を出す。
 * AI の判定を待つチャットで使う。文言は判定と案内と同じく塗りも枠もないアイコン付きの文字にし、
 * 読み上げのため `aria-live` の領域に入れる。領域は応答待ちの間ずっと置き、文言だけを後から差し込む。
 */
export function PendingIndicator({ slowNotice = false }: { slowNotice?: boolean }) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!slowNotice) return;
    const timer = setTimeout(() => setSlow(true), SLOW_PENDING_AFTER_MS);
    return () => clearTimeout(timer);
  }, [slowNotice]);

  if (!slowNotice) return <PendingWindow />;

  return (
    <div className="mr-auto flex max-w-[85%] flex-col gap-2">
      <PendingWindow />
      <div aria-live="polite">
        {slow && (
          <motion.p
            {...chatItemAppear}
            className="flex items-start gap-2 py-1 text-sm font-medium text-foreground"
          >
            <HourglassIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
            {SLOW_PENDING_TEXT}
          </motion.p>
        )}
      </div>
    </div>
  );
}

function PendingWindow() {
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
