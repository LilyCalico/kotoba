"use client";

import { TriangleAlertIcon } from "lucide-react";

import type { GameClientErrorCode } from "@/lib/game/client";
import { useMessages } from "@/lib/i18n/locale-context";
import type { Messages } from "@/lib/i18n/messages";

const NOTICE_CLASS = "mr-auto flex w-fit max-w-[85%] items-center gap-2 py-1 text-sm font-medium text-foreground";

/**
 * 再送の案内の文言。`t` は辞書の `error` の節。`docs/specifications/api.md`「エラー」の「画面の扱い」に従う。
 *
 * - `rate_limited`: 数え直されるまで通らないため、待つ時間を伝える
 * - `ai_rate_limited`: 無料枠の上限が戻るまで通らないため、待つ時間を伝える
 * - `ai_unavailable`: 無料枠の AI は一時的に失敗しやすく、送り直せば通ることが多いため、その旨を伝える
 * - それ以外: 共通の文言
 */
export function errorText(
  t: Messages["error"],
  code: GameClientErrorCode,
  retryAfterSeconds?: number,
): string {
  switch (code) {
    case "rate_limited":
      return t.rateLimit(retryAfterSeconds);
    case "ai_rate_limited":
      return t.aiLimit(retryAfterSeconds);
    case "ai_unavailable":
      return t.aiUnavailable;
    default:
      return t.generic;
  }
}

/** 送信とヒントの失敗の案内。塗りも枠も持たない、警告のアイコン付きの文字にする。 */
export function ErrorMessage({
  code,
  retryAfterSeconds,
}: {
  code: GameClientErrorCode;
  retryAfterSeconds?: number;
}) {
  const t = useMessages().error;

  return (
    <p className={NOTICE_CLASS}>
      <TriangleAlertIcon aria-hidden className="size-4 shrink-0" />
      {errorText(t, code, retryAfterSeconds)}
    </p>
  );
}

/**
 * ゲームが見つからないときの案内。ゲームはここで終わり、入力欄の代わりに Play again が続く。
 * 入力欄が消えるため、フォーカスの移り先として `ref` を受ける。
 */
export function ExpiredMessage({ ref }: { ref?: React.Ref<HTMLParagraphElement> }) {
  const t = useMessages().error;

  return (
    <p className={`${NOTICE_CLASS} focus-ring`} ref={ref} tabIndex={-1}>
      <TriangleAlertIcon aria-hidden className="size-4 shrink-0" />
      {t.expired}
    </p>
  );
}
