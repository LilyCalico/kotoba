"use client";

import type { UiLocale } from "@kotoba/shared";
import { createContext, use } from "react";

import { DEFAULT_LOCALE } from "@/lib/i18n/locale";
import { type Messages, messages } from "@/lib/i18n/messages";

const LocaleContext = createContext<UiLocale>(DEFAULT_LOCALE);

/** `[lang]` のレイアウトが URL の言語を渡す。Storybook など、渡さない場所では `DEFAULT_LOCALE` になる。 */
export function LocaleProvider({ locale, children }: { locale: UiLocale; children: React.ReactNode }) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

/** 今の UI 言語。ゲーム開始の `locale` と、画面内のリンクの言語に使う。 */
export function useLocale(): UiLocale {
  return use(LocaleContext);
}

/**
 * 今の UI 言語の文言の辞書。辞書は値を取る文言を関数で持ち、サーバーからクライアントへ props で渡せないため、
 * クライアントで言語から引く。
 */
export function useMessages(): Messages {
  return messages[useLocale()];
}
