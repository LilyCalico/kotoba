import type { Verdict } from "@kotoba/shared";
import { cn } from "cn";
import { MessageCircleQuestionMarkIcon } from "lucide-react";

const VERDICT_TEXT: Record<Verdict, string> = {
  yes: "Yes",
  no: "No",
  unclear: "Hard to say",
  irrelevant: "That's not related",
  not_a_question: "Try a yes-or-no question",
};

export function verdictText(verdict: Verdict): string {
  return VERDICT_TEXT[verdict];
}

/**
 * 質問への 5 値の回答。
 * `not_a_question` は単語についての答えではなく質問の形への指摘なので、
 * 破線の枠とアイコンで他の 4 値と見分けられるようにする。
 */
export function VerdictMessage({
  verdict,
  ref,
}: {
  verdict: Verdict;
  ref?: React.Ref<HTMLParagraphElement>;
}) {
  const meta = verdict === "not_a_question";

  return (
    <p
      className={cn(
        "mr-auto flex w-fit max-w-[85%] items-center gap-2 rounded-md bg-card px-4 py-2 text-sm text-card-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        meta && "border border-dashed border-input",
      )}
      ref={ref}
      tabIndex={-1}
    >
      {meta && <MessageCircleQuestionMarkIcon aria-hidden className="size-4 shrink-0" />}
      {verdictText(verdict)}
    </p>
  );
}
