"use client";

import type { GameResult, Outcome } from "@kotoba/shared";
import { CheckIcon, FlagIcon } from "lucide-react";
import { motion } from "motion/react";
import { useId } from "react";

import { LabelPill } from "@/components/game/label-pill";
import { cardAppear, stickerStick } from "@/components/game/motion";

export function resultHeading(outcome: Outcome): string {
  return outcome === "cleared" ? "You found it" : "The word was";
}

/**
 * 正解の単語を辞書の一項目として見せるカード。見出し・単語・品詞・直訳・定義・補足・例文の順に組む。
 * クリアとギブアップで見出しとステッカーのアイコンを変える。
 *
 * カードの右上にホログラムのステッカーが貼られる。画面で唯一の演出で、カードが現れてから一拍おいて貼られる。
 * 見出しはゲーム終了時のフォーカス先になるため、`ref` を受け付けて `tabIndex={-1}` を持つ。
 */
export function ResultCard({
  result,
  ref,
}: {
  result: GameResult;
  ref?: React.Ref<HTMLHeadingElement>;
}) {
  const headingId = useId();
  const { outcome, word, partOfSpeech, definition, literal, note, example } = result;
  const StickerIcon = outcome === "cleared" ? CheckIcon : FlagIcon;

  return (
    <motion.section
      {...cardAppear}
      aria-labelledby={headingId}
      className="relative mt-7 flex w-full flex-col gap-4 border border-border bg-card px-5 pt-6 pb-6 text-card-foreground"
    >
      <motion.div
        {...stickerStick}
        aria-hidden
        className="holo absolute -top-7 -right-2 flex size-[5.75rem] items-center justify-center rounded-full border border-border"
      >
        <span className="flex size-[3.625rem] items-center justify-center rounded-full border border-border bg-card">
          <StickerIcon className="size-6" strokeWidth={2.4} />
        </span>
      </motion.div>

      <div className="flex flex-col gap-1.5 pr-20">
        <h2 className="w-fit text-sm font-semibold focus-ring" id={headingId} ref={ref} tabIndex={-1}>
          {resultHeading(outcome)}
        </h2>
        <p className="font-serif text-[3.25rem] leading-none font-semibold wrap-anywhere" lang="sv">
          {word}
        </p>
      </div>
      <div className="-mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <LabelPill>{partOfSpeech}</LabelPill>
        {literal && <p className="text-sm text-muted-foreground">Literally “{literal}”</p>}
      </div>

      <p className="font-serif text-[1.375rem] leading-snug">{definition}</p>
      {note && <p className="text-sm leading-relaxed text-muted-foreground">{note}</p>}
      {example && (
        <figure className="flex flex-col gap-0.5 bg-muted px-3.5 py-3">
          <blockquote className="text-[0.9375rem] font-medium" lang="sv">
            {example.sv}
          </blockquote>
          <figcaption className="text-[0.8125rem] leading-relaxed text-muted-foreground">
            {example.translation}
          </figcaption>
        </figure>
      )}
    </motion.section>
  );
}
