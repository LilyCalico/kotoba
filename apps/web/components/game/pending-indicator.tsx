"use client";

import { motion } from "motion/react";

const DOTS = [0, 1, 2];

/**
 * 応答待ち。AI の回答が入る位置に左寄せのバブルとして置く。
 * 不透明度だけを動かすため、`reducedMotion="user"` の下でも位置は動かない。
 */
export function PendingIndicator() {
  return (
    <p className="mr-auto flex w-fit items-center gap-1 rounded-md bg-card px-4 py-3">
      <span className="sr-only">Waiting for an answer</span>
      {DOTS.map((index) => (
        <motion.span
          animate={{ opacity: [0.25, 1, 0.25] }}
          aria-hidden
          className="size-1.5 rounded-full bg-muted-foreground"
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
