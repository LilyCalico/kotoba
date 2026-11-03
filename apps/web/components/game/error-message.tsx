import { TriangleAlertIcon } from "lucide-react";

import type { GameClientErrorCode } from "@/lib/game/client";

export const ERROR_TEXT = "Something went wrong. Please send it again.";
export const AI_ERROR_TEXT = "Sorry, the free AI plan hiccupped. Please send it again — a few tries usually does it.";
export const EXPIRED_TEXT = "This game has expired. Start a new one.";

const NOTICE_CLASS = "mr-auto flex w-fit max-w-[85%] items-center gap-2 py-1 text-sm font-medium text-foreground";

/**
 * 待つ時間を「about N minutes」の形にする。1 時間未満は分に切り上げ、それ以上は時間に丸める。
 * 秒数がなければ、時間を言わずに「in a little while」にする。
 */
export function waitText(seconds: number | undefined): string {
  if (seconds === undefined) return "in a little while";
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  if (minutes === 1) return "in about a minute";
  if (minutes < 60) return `in about ${minutes} minutes`;
  const hours = Math.max(1, Math.round(seconds / 3600));
  return hours === 1 ? "in about an hour" : `in about ${hours} hours`;
}

/** 無料枠の AI が上限に達したときの案内。上限が戻るまでの時間を添える。 */
export function aiLimitText(retryAfterSeconds: number | undefined): string {
  return `The free AI plan hit its limit. Please try again ${waitText(retryAfterSeconds)}.`;
}

/** 入力がレートリミットを超えたときの案内。数え直されるまでの時間を添える。 */
export function rateLimitText(retryAfterSeconds: number | undefined): string {
  return `You're sending too fast. Please try again ${waitText(retryAfterSeconds)}.`;
}

/**
 * 再送の案内の文言。`docs/specifications/api.md`「エラー」の「画面の扱い」に従う。
 *
 * - `rate_limited`: 数え直されるまで通らないため、待つ時間を伝える
 * - `ai_rate_limited`: 無料枠の上限が戻るまで通らないため、待つ時間を伝える
 * - `ai_unavailable`: 無料枠の AI は一時的に失敗しやすく、送り直せば通ることが多いため、その旨を伝える
 * - それ以外: 共通の文言
 */
export function errorText(code: GameClientErrorCode, retryAfterSeconds?: number): string {
  switch (code) {
    case "rate_limited":
      return rateLimitText(retryAfterSeconds);
    case "ai_rate_limited":
      return aiLimitText(retryAfterSeconds);
    case "ai_unavailable":
      return AI_ERROR_TEXT;
    default:
      return ERROR_TEXT;
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
  return (
    <p className={NOTICE_CLASS}>
      <TriangleAlertIcon aria-hidden className="size-4 shrink-0" />
      {errorText(code, retryAfterSeconds)}
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
