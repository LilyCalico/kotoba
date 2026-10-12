import { MAX_HINTS } from "@kotoba/shared";

/** 開示したヒント。フル幅・枠線・💡 ラベルの 3 点で回答バブルと見分けられる。 */
export function HintCard({ index, text }: { index: number; text: string }) {
  return (
    <section
      aria-label={`Hint ${index} of ${MAX_HINTS}`}
      className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-card p-4"
    >
      <p className="flex items-center gap-1.5 text-[0.625rem] tracking-[0.4px] text-foreground">
        <span aria-hidden>💡</span>
        Hint {index}/{MAX_HINTS}
      </p>
      <p className="text-sm text-foreground">{text}</p>
    </section>
  );
}
