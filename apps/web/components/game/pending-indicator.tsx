"use client";

import { motion } from "motion/react";

const DOTS = [0, 1, 2];

/**
 * 応答待ち。回答のピルが入る位置に、破線の枠のピルとして左に寄せて置く。
 * 不透明度だけを動かすため、`reducedMotion="user"` の下でも位置は動かない。
 */
export function PendingIndicator() {
  return (
    <p className="mr-auto flex h-9 w-fit items-center gap-1.5 rounded-full border border-dashed border-border px-4">
      <span className="sr-only">Waiting for an answer</span>
      {DOTS.map((index) => (
        <motion.span
          animate={{ opacity: [0.25, 1, 0.25] }}
          aria-hidden
          className="size-1.5 rounded-full bg-foreground"
          key={index}
          transition={{
            delay: index * 0.15,
            duration: 1.2,
            ease: "easeInOut",
            repeat: Infinity,
          }}
        />
      ))}
    </p>
  );
}
