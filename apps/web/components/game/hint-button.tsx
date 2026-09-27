"use client";

import { Button } from "@/components/ui/button";

export function hintButtonText(remaining: number): string {
  return `Hint (${remaining} left)`;
}

/** 入力欄の上に置くヒントボタン。残りが 0 のとき、または送信中は押せない。 */
export function HintButton({
  remaining,
  onPress,
  disabled = false,
}: {
  remaining: number;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      className="h-auto gap-1.5 self-start rounded-md border-border bg-card px-3 py-2 text-sm text-card-foreground"
      isDisabled={disabled || remaining <= 0}
      onPress={onPress}
      variant="outline"
    >
      <span aria-hidden>💡</span>
      {hintButtonText(remaining)}
    </Button>
  );
}
