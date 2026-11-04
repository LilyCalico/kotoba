"use client";

import { MAX_INPUT_LENGTH } from "@kotoba/shared";
import { ArrowUpIcon } from "lucide-react";
import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { remainingLength, validateInput } from "@/lib/game/input";
import { useMessages } from "@/lib/i18n/locale-context";

/**
 * 質問と解答を兼ねる単一の入力欄と、四角いキーキャップの送信。
 * 入力値は親が持ち、送信に失敗したときも同じ文字列を残して再送できるようにする。
 * `validateInput` が弾く入力は送信できず、送る文字列は `trim` する。
 * `actions` は残りの文字数と同じ行の左に置く副ボタン（ヒント）。
 */
export function InputForm({
  value,
  onValueChange,
  onSubmit,
  disabled = false,
  actions,
  ref,
}: {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (text: string) => void;
  disabled?: boolean;
  actions?: React.ReactNode;
  ref?: React.Ref<HTMLInputElement>;
}) {
  const t = useMessages().input;
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
      <Field className="gap-3">
        <FieldLabel className="sr-only" htmlFor={inputId}>
          {t.label}
        </FieldLabel>
        <div className="flex w-full items-stretch gap-2.5 pr-1">
          <Input
            aria-describedby={counterId}
            autoComplete="off"
            className="flex-1"
            disabled={disabled}
            id={inputId}
            maxLength={MAX_INPUT_LENGTH}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder={t.label}
            ref={ref}
            value={value}
          />
          <Button aria-label={t.send} className="size-12" isDisabled={!canSubmit} type="submit" variant="key">
            <ArrowUpIcon aria-hidden className="size-5" strokeWidth={2.4} />
          </Button>
        </div>
        <div className="flex items-center justify-between gap-3">
          {actions}
          <FieldDescription className="ml-auto text-right text-xs" id={counterId}>
            {t.remaining(remainingLength(value))}
          </FieldDescription>
        </div>
      </Field>
    </form>
  );
}
