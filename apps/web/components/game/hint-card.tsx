import { MAX_HINTS } from "@kotoba/shared";

/**
 * 開示したヒント。フル幅・枠線・💡 ラベルの 3 点で回答バブルと見分けられる。
 * ヒントはライブリージョンに載せないため、開示したときのフォーカス先になって読み上げさせる。
 * そのため `ref` を受け付けて `tabIndex={-1}` を持つ。
 */
export function HintCard({
  index,
  text,
  ref,
}: {
  index: number;
  text: string;
  ref?: React.Ref<HTMLElement>;
}) {
  return (
    <section
      aria-label={`Hint ${index} of ${MAX_HINTS}`}
      className="flex w-full flex-col gap-3 rounded-2xl border border-border bg-card p-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      ref={ref}
      tabIndex={-1}
    >
      <p className="flex items-center gap-1.5 text-[0.625rem] tracking-[0.4px] text-foreground">
        <span aria-hidden>💡</span>
        Hint {index}/{MAX_HINTS}
      </p>
      <p className="text-sm text-foreground">{text}</p>
    </section>
  );
}
