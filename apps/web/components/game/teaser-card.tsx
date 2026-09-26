import { cn } from "cn";
import { useId } from "react";

/**
 * 設問。`floating` は設問の提示で画面中央に浮かべる様式、
 * `pinned` はチャットでヘッダー直下に固定するフル幅の様式。
 */
export function TeaserCard({
  teaser,
  variant = "pinned",
}: {
  teaser: string;
  variant?: "floating" | "pinned";
}) {
  const labelId = useId();
  const floating = variant === "floating";

  return (
    <section
      aria-labelledby={labelId}
      className={cn(
        "flex w-full flex-col gap-3 border border-border bg-card",
        floating ? "rounded-2xl p-4" : "px-5 py-4",
      )}
    >
      <p
        className={cn(
          "flex items-center text-foreground",
          floating ? "gap-2 text-base" : "gap-1.5 text-[0.625rem] tracking-[0.4px]",
        )}
        id={labelId}
      >
        <span aria-hidden>🌿</span>
        Question
      </p>
      <p className={cn("text-foreground", floating ? "text-lg" : "text-sm")}>{teaser}</p>
    </section>
  );
}
