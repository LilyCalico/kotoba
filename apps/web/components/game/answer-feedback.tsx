"use client";

import { CircleCheckIcon, CircleSlashIcon } from "lucide-react";

import { useMessages } from "@/lib/i18n/locale-context";

/**
 * 解答の正誤。塗りも枠も持たない、アイコン付きの文字にする。
 * 回答のピルと形を変え、質問への答えではなく解答の判定だと見分けさせる。誤答に回数制限はないため、何度でもログに積まれる。
 */
export function AnswerFeedback({
  correct,
  ref,
}: {
  correct: boolean;
  ref?: React.Ref<HTMLParagraphElement>;
}) {
  const t = useMessages().answerFeedback;
  const Icon = correct ? CircleCheckIcon : CircleSlashIcon;

  return (
    <p
      className="mr-auto flex w-fit max-w-[85%] items-center gap-2 py-1 text-sm font-medium text-foreground focus-ring"
      ref={ref}
      tabIndex={-1}
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      {correct ? t.correct : t.incorrect}
    </p>
  );
}
