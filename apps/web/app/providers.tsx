"use client";

import { MotionConfig } from "motion/react";
import { I18nProvider } from "react-aria-components";

import { Toaster } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider locale="en">
      <MotionConfig reducedMotion="user">
        {children}
        <Toaster />
      </MotionConfig>
    </I18nProvider>
  );
}
