import type { UiLocale } from "@kotoba/shared";

import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/locale";
import { type Messages, messages } from "@/lib/i18n/messages";

/**
 * Storybook のツールバーで選んだ UI 言語。Story の `globals.locale` から読む。
 * Story の中身（設問・ヒント・結果）と、play 関数で確かめる文言を、この言語に合わせるために使う。
 */
export function storyLocale(globals: Record<string, unknown>): UiLocale {
  const { locale } = globals;
  return typeof locale === "string" && isLocale(locale) ? locale : DEFAULT_LOCALE;
}

/** Storybook のツールバーで選んだ UI 言語の辞書。 */
export function storyMessages(globals: Record<string, unknown>): Messages {
  return messages[storyLocale(globals)];
}
