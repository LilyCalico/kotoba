"use client";

import type { GameResult } from "@kotoba/shared";
import { CheckIcon, FlagIcon } from "lucide-react";
import { motion } from "motion/react";
import { useId } from "react";

import { LabelPill } from "@/components/game/label-pill";
import { cardAppear, stickerStick } from "@/components/game/motion";
import { WINDOW_TITLE_CLASS, WindowStack, WindowTitleBar } from "@/components/ui/window";
import { useGameMode } from "@/lib/game/mode-context";
import { useMessages } from "@/lib/i18n/locale-context";

/**
 * 正解の単語を辞書の一項目として見せるウィンドウ。ピンクのタイトルバーに見出しを置き、
 * 単語・読み・品詞・直訳・定義・補足・例文の順に組む。読み（カタカナ）は日本語の UI の結果だけが持ち、単語の下に補足の文字で添える。後ろに 2 枚のウィンドウを重ね、画面の主役にする。
 * クリアとギブアップで見出しとステッカーのアイコンを変える。
 *
 * ウィンドウの右上の角にホログラムのステッカーが貼られる。ゲームの見せ場で、ウィンドウが現れてから一拍おいて貼られる。
 * 見出しはゲーム終了時のフォーカス先になるため、`ref` を受け付けて `tabIndex={-1}` を持つ。
 */
export function ResultCard({
  result,
  ref,
}: {
  result: GameResult;
  ref?: React.Ref<HTMLHeadingElement>;
}) {
  const t = useMessages().result;
  const mode = useGameMode();
  const headingId = useId();
  const { outcome, word, reading, partOfSpeech, definition, literal, note, example } = result;
  const StickerIcon = outcome === "cleared" ? CheckIcon : FlagIcon;

  return (
    <motion.div {...cardAppear} className="mt-7">
      <WindowStack>
        <section
          aria-labelledby={headingId}
          className="relative flex flex-col border-[1.5px] border-border bg-card text-card-foreground"
        >
          <WindowTitleBar tone="result">
            <h2 className={`${WINDOW_TITLE_CLASS} focus-ring`} id={headingId} ref={ref} tabIndex={-1}>
              {t.heading[outcome][mode]}
            </h2>
          </WindowTitleBar>

          <motion.div
            {...stickerStick}
            aria-hidden
            className="holo absolute -top-[1.375rem] -right-5 flex size-[4.75rem] items-center justify-center rounded-full border-[1.5px] border-border shadow-[0.1875rem_0.1875rem_0_var(--foreground)]"
          >
            <span className="flex size-[2.875rem] items-center justify-center rounded-full border-[1.5px] border-border bg-card">
              <StickerIcon className="size-[1.375rem]" strokeWidth={2.6} />
            </span>
          </motion.div>

          <div className="flex flex-col gap-4 px-5 pt-6 pb-5.5">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <p
                  className="font-serif text-[2.5rem] leading-none font-semibold hyphens-auto wrap-break-word md:text-[3.25rem]"
                  lang="sv"
                >
                  {word}
                </p>
                {reading && <p className="text-sm text-muted-foreground">{reading}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <LabelPill>{t.partOfSpeech[partOfSpeech]}</LabelPill>
                {literal && <p className="text-sm text-muted-foreground">{t.literal(literal)}</p>}
              </div>
            </div>

            <p className="font-serif text-[1.3125rem] leading-snug">{definition}</p>
            {note && <p className="text-sm leading-relaxed text-muted-foreground">{note}</p>}
            {example && (
              <figure className="flex flex-col gap-0.5 border border-border bg-muted px-3.5 py-3 shadow-[inset_0.125rem_0.125rem_0_var(--grid)]">
                <blockquote className="text-[0.9375rem] font-medium" lang="sv">
                  {example.sv}
                </blockquote>
                <figcaption className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                  {example.translation}
                </figcaption>
              </figure>
            )}
          </div>
        </section>
      </WindowStack>
    </motion.div>
  );
}
