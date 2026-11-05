"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { useId } from "react";

import { WINDOW_TITLE_CLASS, WindowTitleBar } from "@/components/ui/window";
import { useMessages } from "@/lib/i18n/locale-context";

/** 設問の提示からチャットへ移るとき、設問のウィンドウが収まるまでの動き。 */
export const TEASER_LAYOUT_TRANSITION = { duration: 0.4, ease: [0.22, 1, 0.36, 1] } as const;

/**
 * 設問。ラベンダーのタイトルバー「Question」を持つウィンドウに、明朝の設問を載せる。
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
  const t = useMessages().teaser;
  const labelId = useId();
  const floating = variant === "floating";
  const layout = layoutId ? "position" : undefined;

  return (
    <motion.section
      aria-labelledby={labelId}
      className="window flex w-full flex-col"
      layoutId={layoutId}
      // 変形の間に影が引き伸ばされないよう、Motion が補正できる px の値で `style` に渡す。値は `window` の影と同じ。
      style={{ boxShadow: "4px 4px 0 #2b2f5c" }}
      transition={TEASER_LAYOUT_TRANSITION}
    >
      <motion.div layout={layout} transition={TEASER_LAYOUT_TRANSITION}>
        <WindowTitleBar controls={["minimize", "maximize"]} tone="question">
          <p className={WINDOW_TITLE_CLASS} id={labelId}>
            {t.title}
          </p>
        </WindowTitleBar>
      </motion.div>
      <motion.p
        className={cn(
          "font-serif leading-tight text-phrase",
          floating ? "px-6 pt-5 pb-7 text-[2rem]" : "px-4 pt-3 pb-4 text-[1.5rem]",
        )}
        layout={layout}
        transition={TEASER_LAYOUT_TRANSITION}
      >
        {teaser}
      </motion.p>
    </motion.section>
  );
}
