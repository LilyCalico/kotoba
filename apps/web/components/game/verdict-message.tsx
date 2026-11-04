"use client";

import type { Verdict } from "@kotoba/shared";
import { cn } from "cn";
import {
  CheckIcon,
  LanguagesIcon,
  type LucideIcon,
  MessageCircleQuestionMarkIcon,
  MinusIcon,
  UnlinkIcon,
  XIcon,
} from "lucide-react";

import { useMessages } from "@/lib/i18n/locale-context";

const PILL_CLASS =
  "mr-auto inline-flex min-h-9 w-fit max-w-[85%] items-center gap-1.5 rounded-full px-4 py-1.5 text-[0.9375rem] font-semibold text-foreground focus-ring";

/** 回答ごとの見た目。色だけに頼らず、文字とアイコンでも区別する。 */
const VERDICT_STYLE: Record<Verdict, { icon: LucideIcon; className: string }> = {
  yes: { icon: CheckIcon, className: "bg-answer-yes" },
  no: { icon: XIcon, className: "bg-answer-no" },
  unclear: { icon: MinusIcon, className: "bg-answer-unclear" },
  irrelevant: { icon: UnlinkIcon, className: "border border-dashed border-border bg-card" },
  not_a_question: { icon: MessageCircleQuestionMarkIcon, className: "bg-answer-meta" },
};

/**
 * 質問への 5 値の回答。画面で唯一の、アイコン付きの太字の丸いピル。平たく影を持たず、立体のボタンと形で見分ける。
 * Yes はライム、No はコーラル、Hard to say は空色、That's not related は白に破線の枠、
 * Try a yes-or-no question（質問の形への指摘）は黄にする。
 */
export function VerdictMessage({
  verdict,
  ref,
}: {
  verdict: Verdict;
  ref?: React.Ref<HTMLParagraphElement>;
}) {
  const t = useMessages();
  const { icon: Icon, className } = VERDICT_STYLE[verdict];

  return (
    <p className={cn(PILL_CLASS, className)} ref={ref} tabIndex={-1}>
      <Icon aria-hidden className="size-4 shrink-0" strokeWidth={2.6} />
      {t.verdict[verdict]}
    </p>
  );
}

/**
 * 日本語・英語・スウェーデン語以外の入力への案内。単語についての答えではなく入力の仕方への指摘なので、
 * Try a yes-or-no question と同じ黄のピルにし、言語のアイコンで見分ける。
 */
export function UnsupportedLanguageMessage({ ref }: { ref?: React.Ref<HTMLParagraphElement> }) {
  const t = useMessages();

  return (
    <p className={cn(PILL_CLASS, "bg-answer-meta")} ref={ref} tabIndex={-1}>
      <LanguagesIcon aria-hidden className="size-4 shrink-0" strokeWidth={2.6} />
      {t.unsupportedLanguage}
    </p>
  );
}
