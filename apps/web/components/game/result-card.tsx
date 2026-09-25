import type { GameResult } from "@kotoba/shared";

export function resultHeading(outcome: GameResult["outcome"]): string {
  return outcome === "cleared" ? "You found it" : "The word was";
}

export function ResultCard({
  result,
  headingId = "result-heading",
  ref,
}: {
  result: GameResult;
  headingId?: string;
  ref?: React.Ref<HTMLHeadingElement>;
}) {
  return (
    <section
      aria-labelledby={headingId}
      className="flex w-full flex-col gap-2 rounded-2xl border border-border bg-card p-4"
    >
      <h2
        className="text-[0.625rem] tracking-[0.4px] text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        id={headingId}
        ref={ref}
        tabIndex={-1}
      >
        {resultHeading(result.outcome)}
      </h2>
      <p className="text-lg text-foreground">{result.word}</p>
      <p className="text-sm text-muted-foreground">{result.definition}</p>
    </section>
  );
}
