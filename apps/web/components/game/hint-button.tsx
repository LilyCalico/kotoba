"use client";

import { Button } from "@/components/ui/button";

export function hintButtonText(remaining: number): string {
  return `Hint (${remaining} left)`;
}

/**
 * 入力欄の上に置くヒントボタン。残りが 0 のとき、または送信中は押せない。
 * ヒントの要求が失敗したときのフォーカス先になるため、`ref` を受け付ける。
 */
export function HintButton({
  remaining,
  onPress,
  disabled = false,
  ref,
}: {
  remaining: number;
  onPress: () => void;
  disabled?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <Button
      className="h-auto gap-1.5 self-start rounded-md border-border bg-card px-3 py-2 text-sm text-card-foreground"
      isDisabled={disabled || remaining <= 0}
      onPress={onPress}
      ref={ref}
      variant="outline"
    >
      <span aria-hidden>💡</span>
      {hintButtonText(remaining)}
    </Button>
  );
}
