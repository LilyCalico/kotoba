"use client";

import type { Outcome } from "@kotoba/shared";
import { motion } from "motion/react";
import { useId } from "react";

import { cardAppear } from "@/components/game/motion";

export function resultHeading(outcome: Outcome): string {
  return outcome === "cleared" ? "You found it" : "The word was";
}

/**
 * 正解の単語と定義。クリアとギブアップで見出しを変える。
 * 見出しはゲーム終了時のフォーカス先になるため、`ref` を受け付けて `tabIndex={-1}` を持つ。
 * 描画された時点で、わずかに拡大しながら現れる。
 */
export function ResultCard({
  outcome,
  word,
  definition,
  ref,
}: {
  outcome: Outcome;
  word: string;
  definition: string;
  ref?: React.Ref<HTMLHeadingElement>;
}) {
  const headingId = useId();

  return (
    <motion.section
      {...cardAppear}
      aria-labelledby={headingId}
      className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-card p-4"
    >
      <h2
        className="text-[0.625rem] tracking-[0.4px] text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        id={headingId}
        ref={ref}
        tabIndex={-1}
      >
        {resultHeading(outcome)}
      </h2>
      <p className="text-lg text-foreground">{word}</p>
      <p className="text-sm text-muted-foreground">{definition}</p>
    </motion.section>
  );
}
