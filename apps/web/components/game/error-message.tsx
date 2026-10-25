import { TriangleAlertIcon } from "lucide-react";

export const ERROR_TEXT = "Something went wrong. Please send it again.";
export const EXPIRED_TEXT = "This game has expired. Start a new one.";

const NOTICE_CLASS = "mr-auto flex w-fit max-w-[85%] items-center gap-2 py-1 text-sm font-medium text-foreground";

/** 送信とヒントの失敗の案内。塗りも枠も持たない、警告のアイコン付きの文字にする。 */
export function ErrorMessage() {
  return (
    <p className={NOTICE_CLASS}>
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
    <p className={`${NOTICE_CLASS} focus-ring`} ref={ref} tabIndex={-1}>
      <TriangleAlertIcon aria-hidden className="size-4 shrink-0" />
      {EXPIRED_TEXT}
    </p>
  );
}
