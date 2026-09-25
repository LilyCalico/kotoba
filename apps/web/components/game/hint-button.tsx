"use client";

import { Button } from "@/components/ui/button";

export function hintButtonText(remaining: number): string {
  return remaining === 1 ? "Hint (1 left)" : `Hint (${remaining} left)`;
}

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
      className="h-auto gap-1.5 self-start rounded-md border-border bg-card px-3 py-2 text-[0.625rem] text-card-foreground"
      isDisabled={disabled || remaining === 0}
      onPress={onPress}
      variant="outline"
    >
      <span aria-hidden>💡</span>
      {hintButtonText(remaining)}
    </Button>
  );
}
