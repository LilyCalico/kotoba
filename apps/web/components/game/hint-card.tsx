import { type Hint, MAX_HINTS } from "@kotoba/shared";

export function HintCard({ hint }: { hint: Hint }) {
  return (
    <section
      aria-label={`Hint ${hint.index} of ${MAX_HINTS}`}
      className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-card p-4"
    >
      <p className="flex items-center gap-1.5 text-[0.625rem] tracking-[0.4px] text-foreground">
        <span aria-hidden>💡</span>
        Hint {hint.index}/{MAX_HINTS}
      </p>
      <p className="text-sm text-foreground">{hint.text}</p>
    </section>
  );
}
