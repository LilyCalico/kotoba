"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { useId } from "react";

import { TEASER_LAYOUT_TRANSITION } from "@/components/game/teaser-card";
import { WINDOW_TITLE_CLASS, WindowTitleBar } from "@/components/ui/window";
import { useMessages } from "@/lib/i18n/locale-context";

/** 明朝の単語 1 文字あたりの幅のおよその上限（em）。floating で単語をカードの幅に収める計算に使う。 */
const SERIF_CHAR_WIDTH_EM = 0.55;

/**
 * 意味当てで最初に見せる単語。ラベンダーのタイトルバー「ことば」を持つウィンドウに、
 * 明朝のスウェーデン語の単語と、その下にカタカナの読みを載せる。設問カードと同じ役割（読ませるもの）の見た目にする。
 * `floating` はゲーム開始時に画面中央に浮かべる様式で、意味を問いかける一文を添える。
 * 単語は 3.5rem で出し、長い単語（Allemansrätten など）はカードの幅に収まるまで小さくする。
 * `pinned` はチャットでヘッダー直下に固定する様式で、単語と読みを 1 行に並べる。
 *
 * 2 つの様式に同じ `layoutId` を渡すと、設問カードと同じく、位置と大きさを保ったまま変形してつなぐ。
 * 文字の大きさは切り替わった時点で新しい様式に移し、位置だけを動かす。
 */
export function WordCard({
  word,
  reading,
  variant = "pinned",
  layoutId,
}: {
  word: string;
  reading: string;
  variant?: "floating" | "pinned";
  layoutId?: string;
}) {
  const t = useMessages().wordCard;
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
      <motion.div
        className={cn(
          "flex",
          floating
            ? "@container flex-col gap-1.5 px-6 pt-7 pb-7.5"
            : "flex-wrap items-baseline gap-x-2.5 px-4 pt-3 pb-3.5",
        )}
        layout={layout}
        transition={TEASER_LAYOUT_TRANSITION}
      >
        <p
          className={cn("font-serif leading-none", !floating && "text-[2rem]")}
          lang="sv"
          style={
            floating
              ? { fontSize: `min(3.5rem, calc(100cqi / ${word.length * SERIF_CHAR_WIDTH_EM}))` }
              : undefined
          }
        >
          {word}
        </p>
        <p className={cn("text-muted-foreground", floating ? "text-base" : "text-sm")}>{reading}</p>
        {floating && <p className="mt-3.5 font-serif text-xl text-phrase">{t.prompt}</p>}
      </motion.div>
    </motion.section>
  );
}
