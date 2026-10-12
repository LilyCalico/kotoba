import { CircleCheckIcon, CircleSlashIcon } from "lucide-react";

export function answerText(correct: boolean): string {
  return correct ? "That's the word!" : "Not the word this time.";
}

/** 解答の正誤。誤答に回数制限はないため、何度でもログに積まれる。 */
export function AnswerFeedback({
  correct,
  ref,
}: {
  correct: boolean;
  ref?: React.Ref<HTMLParagraphElement>;
}) {
  const Icon = correct ? CircleCheckIcon : CircleSlashIcon;

  return (
    <p
      className="mr-auto flex w-fit max-w-[85%] items-center gap-2 rounded-md border border-input bg-card px-4 py-2 text-sm text-card-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      ref={ref}
      tabIndex={-1}
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      {answerText(correct)}
    </p>
  );
}
