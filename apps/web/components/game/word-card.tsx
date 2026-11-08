"use client";

import { cn } from "cn";
import { motion } from "motion/react";
import { useId, useLayoutEffect, useRef, useState } from "react";

import { TEASER_LAYOUT_TRANSITION } from "@/components/game/teaser-card";
import { WINDOW_TITLE_CLASS, WindowTitleBar } from "@/components/ui/window";
import { useMessages } from "@/lib/i18n/locale-context";

/** floating の単語の文字の大きさの上限。 */
const FLOATING_WORD_MAX_SIZE = "3.5rem";

/**
 * 1 行に並べた文字が、外側の要素の幅に収まる文字の大きさ（px）を返す。`null` は測る前を表す。
 * 文字の幅は文字の大きさに比例するため、いまの大きさで測った幅と使える幅の比から、収まる大きさを一度で求める。
 * 外側と文字の両方の大きさの変化（画面の幅、ルートの文字の大きさ、Web フォントの読み込み）を見て測り直す。
 */
function useFitFontSize(enabled: boolean) {
  const boxRef = useRef<HTMLParagraphElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState<number | null>(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const text = textRef.current;
    if (!enabled || !box || !text) return;

    const fit = () => {
      const current = Number.parseFloat(getComputedStyle(text).fontSize);
      const width = text.getBoundingClientRect().width;
      if (width === 0) return;
      // 小数点以下の丸めで 1px はみ出さないよう、0.1px 単位で切り捨てる。
      setFontSize(Math.floor(((current * box.clientWidth) / width) * 10) / 10);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    observer.observe(text);
    return () => observer.disconnect();
  }, [enabled]);

  return { boxRef, textRef, fontSize };
}

/**
 * 意味当てで最初に見せる単語。ラベンダーのタイトルバー「ことば」を持つウィンドウに、
 * 明朝のスウェーデン語の単語と、その下にカタカナの読みを載せる。設問カードと同じ役割（読ませるもの）の見た目にする。
 * `floating` はゲーム開始時に画面中央に浮かべる様式で、意味を問いかける一文を添える。
 * 単語は 3.5rem で出し、長い単語（Allemansrätten など）は表示した幅を測り、カードの幅に収まるまで小さくする。
 * `pinned` はチャットでヘッダー直下に固定する様式で、単語と読みを 1 行に並べる。単語がカードの幅を超えるときは単語の中で折り返す。
 * 読みはカタカナのため、UI の言語によらず `lang="ja"` を付ける。
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
  const { boxRef, textRef, fontSize } = useFitFontSize(floating);

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
            ? "flex-col gap-1.5 px-6 pt-7 pb-7.5"
            : "flex-wrap items-baseline gap-x-2.5 px-4 pt-3 pb-3.5",
        )}
        layout={layout}
        transition={TEASER_LAYOUT_TRANSITION}
      >
        <p
          className={cn(
            "font-serif leading-none",
            floating ? "whitespace-nowrap" : "min-w-0 text-[2rem] hyphens-auto wrap-break-word",
          )}
          lang="sv"
          ref={boxRef}
          style={
            floating
              ? {
                  fontSize:
                    fontSize === null ? FLOATING_WORD_MAX_SIZE : `min(${FLOATING_WORD_MAX_SIZE}, ${fontSize}px)`,
                }
              : undefined
          }
        >
          <span ref={textRef}>{word}</span>
        </p>
        <p className={cn("text-muted-foreground", floating ? "text-base" : "text-sm")} lang="ja">
          {reading}
        </p>
        {floating && <p className="mt-3.5 font-serif text-xl text-phrase">{t.prompt}</p>}
      </motion.div>
    </motion.section>
  );
}
