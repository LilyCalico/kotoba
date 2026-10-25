"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { useId } from "react";

import { LabelPill } from "@/components/game/label-pill";

/** 設問の提示からチャットへ移るとき、設問カードが収まるまでの動き。 */
export const TEASER_LAYOUT_TRANSITION = { duration: 0.4, ease: [0.22, 1, 0.36, 1] } as const;

/**
 * 設問。白いカードに 1px の枠をとり、「Question」のラベルと、明朝の設問を載せる。
 * `floating` は設問の提示で画面中央に浮かべる様式、`pinned` はチャットでヘッダー直下に固定する様式。
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
        "flex w-full flex-col border border-border bg-card text-card-foreground",
        floating ? "gap-4 px-6 py-7" : "gap-2.5 px-4.5 pt-4 pb-4.5",
      )}
      layoutId={layoutId}
      transition={TEASER_LAYOUT_TRANSITION}
    >
      <motion.div layout={layoutId ? "position" : undefined} transition={TEASER_LAYOUT_TRANSITION}>
        <LabelPill id={labelId}>Question</LabelPill>
      </motion.div>
      <motion.p
        className={cn(
          "font-serif leading-tight text-balance",
          floating ? "text-[2rem]" : "text-[1.5rem]",
        )}
        layout={layoutId ? "position" : undefined}
        transition={TEASER_LAYOUT_TRANSITION}
      >
        {teaser}
      </motion.p>
    </motion.section>
  );
}
