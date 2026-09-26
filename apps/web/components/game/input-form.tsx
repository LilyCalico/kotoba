"use client";

import { MAX_INPUT_LENGTH } from "@kotoba/shared";
import { ChevronUpIcon } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { remainingLength, validateInput } from "@/lib/game/input";

export const INPUT_LABEL = "Ask a question or guess the word";

/**
 * 質問と解答を兼ねる単一の入力欄。
 * 入力値は親が持ち、送信に失敗したときも同じ文字列を残して再送できるようにする。
 * `validateInput` が弾く入力は送信できず、送る文字列は `trim` する。
 */
export function InputForm({
  value,
  onValueChange,
  onSubmit,
  disabled = false,
  ref,
}: {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (text: string) => void;
  disabled?: boolean;
  ref?: React.Ref<HTMLInputElement>;
}) {
  const inputId = useId();
  const counterId = useId();
  const canSubmit = !disabled && validateInput(value) === null;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        onSubmit(value.trim());
      }}
    >
      <Field className="gap-2">
        <FieldLabel className="sr-only" htmlFor={inputId}>
          {INPUT_LABEL}
        </FieldLabel>
        <div className="flex w-full items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 has-[[data-focus-visible]]:border-ring has-[[data-focus-visible]]:ring-3 has-[[data-focus-visible]]:ring-ring/50">
          <Input
            aria-describedby={counterId}
            autoComplete="off"
            className="h-auto flex-1 rounded-none border-0 bg-transparent p-0 text-sm disabled:bg-transparent data-[focus-visible]:ring-0"
            disabled={disabled}
            id={inputId}
            maxLength={MAX_INPUT_LENGTH}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder={INPUT_LABEL}
            ref={ref}
            value={value}
          />
          <Button
            aria-label="Send"
            className="size-11 shrink-0 rounded-md"
            isDisabled={!canSubmit}
            type="submit"
          >
            <ChevronUpIcon aria-hidden className="size-5" />
          </Button>
        </div>
        <FieldDescription className="text-right" id={counterId}>
          {remainingLength(value)} characters left
        </FieldDescription>
      </Field>
    </form>
  );
}
