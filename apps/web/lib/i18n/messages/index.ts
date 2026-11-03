import type { UiLocale } from "@kotoba/shared";

import { en } from "./en";

/** UI の文言の形。英語の辞書の形から作り、言語ごとの辞書はこの型を満たす。 */
export type Messages = typeof en;

/**
 * UI 言語ごとの辞書。どの言語も `Messages` の形を満たさなければ型検査で落ちる。
 * 日本語の辞書を書くまでは、日本語の UI でも英語の辞書を引く。
 */
export const messages: Record<UiLocale, Messages> = {
  en,
  ja: en,
};

export { en };
