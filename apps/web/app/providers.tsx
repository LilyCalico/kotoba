"use client";

import { MotionConfig } from "motion/react";
import { I18nProvider } from "react-aria-components";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider locale="en">
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </I18nProvider>
  );
}
