"use client";

import type { UiLocale } from "@kotoba/shared";
import { createContext, use } from "react";

import { DEFAULT_LOCALE } from "@/lib/i18n/locale";

const LocaleContext = createContext<UiLocale>(DEFAULT_LOCALE);

/** `[lang]` のレイアウトが URL の言語を渡す。Storybook など、渡さない場所では `DEFAULT_LOCALE` になる。 */
export function LocaleProvider({ locale, children }: { locale: UiLocale; children: React.ReactNode }) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

/** 今の UI 言語。ゲーム開始の `locale` と、画面内のリンクの言語に使う。 */
export function useLocale(): UiLocale {
  return use(LocaleContext);
}
