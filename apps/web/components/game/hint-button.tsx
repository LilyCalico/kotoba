"use client";

import { MAX_HINTS } from "@kotoba/shared";
import { cn } from "cn";
import { LightbulbIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMessages } from "@/lib/i18n/locale-context";

/**
 * 入力欄の下に置く副ボタン。残りの回数を読み込みバーの 3 つのブロックで示し、塗ったブロックが残りの数になる。
 * 残りが 0 のとき、または送信中は押せない。ヒントの要求が失敗したときのフォーカス先になるため、`ref` を受け付ける。
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
  const t = useMessages().hint;

  return (
    <Button
      aria-label={t.buttonLabel(remaining)}
      className="mr-0.5 self-start"
      isDisabled={disabled || remaining <= 0}
      onPress={onPress}
      ref={ref}
      variant="outline"
    >
      <LightbulbIcon aria-hidden />
      {t.button}
      <span aria-hidden className="ml-0.5 inline-flex gap-0.5 border-[1.5px] border-border p-0.5">
        {Array.from({ length: MAX_HINTS }, (_, index) => (
          <span className={cn("h-[0.6875rem] w-2", index < remaining && "bg-meter")} key={index} />
        ))}
      </span>
    </Button>
  );
}
