import { cn } from "cn";

export function TeaserCard({
  teaser,
  variant = "pinned",
}: {
  teaser: string;
  variant?: "presented" | "pinned";
}) {
  const presented = variant === "presented";

  return (
    <section
      aria-labelledby="teaser-label"
      className={cn(
        "flex w-full flex-col gap-3 border border-border bg-card",
        presented ? "rounded-2xl p-4" : "px-5 py-4",
      )}
    >
      <p
        className={cn(
          "flex items-center text-foreground",
          presented ? "gap-2 text-base" : "gap-1.5 text-[0.625rem] tracking-[0.4px]",
        )}
        id="teaser-label"
      >
        <span aria-hidden>🌿</span>
        Question
      </p>
      <p className={cn("text-foreground", presented ? "text-lg" : "text-sm")}>
        {teaser}
      </p>
    </section>
  );
}
