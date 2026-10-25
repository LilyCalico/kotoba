import { cn } from "cn";
import { TriangleAlertIcon } from "lucide-react";

export const ERROR_TEXT = "Something went wrong. Please send it again.";
export const EXPIRED_TEXT = "This game has expired. Start a new one.";

const BUBBLE_CLASS =
  "mr-auto flex w-fit max-w-[85%] items-center gap-2 rounded-md border border-input bg-card px-4 py-2 text-sm text-card-foreground";

export function ErrorMessage() {
  return (
    <p className={BUBBLE_CLASS}>
      <TriangleAlertIcon aria-hidden className="size-4 shrink-0" />
      {ERROR_TEXT}
    </p>
  );
}

/**
 * ゲームが見つからないときの案内。ゲームはここで終わり、入力欄の代わりに Play again が続く。
 * 入力欄が消えるため、フォーカスの移り先として `ref` を受ける。
 */
export function ExpiredMessage({ ref }: { ref?: React.Ref<HTMLParagraphElement> }) {
  return (
    <p
      className={cn(BUBBLE_CLASS, "outline-none focus-visible:ring-3 focus-visible:ring-ring/50")}
      ref={ref}
      tabIndex={-1}
    >
      <TriangleAlertIcon aria-hidden className="size-4 shrink-0" />
      {EXPIRED_TEXT}
    </p>
  );
}
