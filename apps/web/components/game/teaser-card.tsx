"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { useId } from "react";

/** 設問の提示からチャットへ移るとき、設問カードが収まるまでの動き。 */
export const TEASER_LAYOUT_TRANSITION = { duration: 0.4, ease: [0.22, 1, 0.36, 1] } as const;

const FLOATING_RADIUS_PX = 18;

/**
 * 設問。`floating` は設問の提示で画面中央に浮かべる様式、
 * `pinned` はチャットでヘッダー直下に固定するフル幅の様式。
 *
 * 2 つの様式に同じ `layoutId` を渡すと、様式が切り替わるとき位置と大きさを保ったまま変形してつなぐ。
 * 文字の大きさは切り替わった時点で新しい様式に移し、位置だけを動かす。文字を拡大縮小でつなぐと字が歪むため。
 */
export function TeaserCard({
  teaser,
  variant = "pinned",
  layoutId,
}: {
  teaser: string;
  variant?: "floating" | "pinned";
  layoutId?: string;
}) {
  const labelId = useId();
  const floating = variant === "floating";

  return (
    <motion.section
      aria-labelledby={labelId}
      className={cn(
        "flex w-full flex-col gap-3 border border-border bg-card",
        floating ? "p-4" : "px-5 py-4",
      )}
      layoutId={layoutId}
      // 角丸は style に px で与えると、変形の途中でも歪まずに補間される。
      // Motion は calc() や rem を補間できないため、base 段階の rounded-2xl（1.125rem）を px で置く。
      style={{ borderRadius: floating ? FLOATING_RADIUS_PX : 0 }}
      transition={TEASER_LAYOUT_TRANSITION}
    >
      <motion.p
        className={cn(
          "flex items-center text-foreground",
          floating ? "gap-2 text-base" : "gap-1.5 text-[0.625rem] tracking-[0.4px]",
        )}
        id={labelId}
        layout={layoutId ? "position" : undefined}
        transition={TEASER_LAYOUT_TRANSITION}
      >
        <span aria-hidden>🌿</span>
        Question
      </motion.p>
      <motion.p
        className={cn("text-foreground", floating ? "text-lg" : "text-sm")}
        layout={layoutId ? "position" : undefined}
        transition={TEASER_LAYOUT_TRANSITION}
      >
        {teaser}
      </motion.p>
    </motion.section>
  );
}
