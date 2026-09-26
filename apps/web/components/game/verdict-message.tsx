import type { Verdict } from "@kotoba/shared";

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

export function VerdictMessage({
  verdict,
  ref,
}: {
  verdict: Verdict;
  ref?: React.Ref<HTMLParagraphElement>;
}) {
  return (
    <p
      className="mr-auto w-fit max-w-[85%] rounded-md bg-card px-4 py-2 text-sm text-card-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      ref={ref}
      tabIndex={-1}
    >
      {verdictText(verdict)}
    </p>
  );
}
