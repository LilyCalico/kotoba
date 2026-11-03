"use client";

import type { UiLocale } from "@kotoba/shared";
import { MotionConfig } from "motion/react";
import { I18nProvider } from "react-aria-components";

import { Toaster } from "@/components/ui/toast";
import { LocaleProvider } from "@/lib/i18n/locale-context";

export function Providers({ locale, children }: { locale: UiLocale; children: React.ReactNode }) {
  return (
    <LocaleProvider locale={locale}>
      <I18nProvider locale={locale}>
        <MotionConfig reducedMotion="user">
          {children}
          <Toaster />
        </MotionConfig>
      </I18nProvider>
    </LocaleProvider>
  );
}
