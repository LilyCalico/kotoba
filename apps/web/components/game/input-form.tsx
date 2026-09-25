"use client";

import { MAX_INPUT_LENGTH } from "@kotoba/shared";
import { ChevronUpIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { remainingLength, validateInput } from "@/lib/game/input";

const INPUT_ID = "player-input";
const COUNTER_ID = "player-input-counter";

export const INPUT_LABEL = "Ask a question or make a guess";

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
  const canSubmit = !disabled && validateInput(value) === null;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        onSubmit(value.trim());
      }}
    >
      <Field>
        <FieldLabel className="sr-only" htmlFor={INPUT_ID}>
          {INPUT_LABEL}
        </FieldLabel>
        <div className="flex w-full items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 has-[[data-focus-visible]]:border-ring has-[[data-focus-visible]]:ring-3 has-[[data-focus-visible]]:ring-ring/50">
          <Input
            aria-describedby={COUNTER_ID}
            autoComplete="off"
            className="h-auto flex-1 rounded-none border-0 bg-transparent p-0 text-sm data-[focus-visible]:ring-0"
            disabled={disabled}
            id={INPUT_ID}
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
            <ChevronUpIcon className="size-5" />
          </Button>
        </div>
        <FieldDescription className="text-right" id={COUNTER_ID}>
          {remainingLength(value)} characters left
        </FieldDescription>
      </Field>
    </form>
  );
}
