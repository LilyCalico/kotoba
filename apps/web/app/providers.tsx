"use client";

import { MotionConfig } from "motion/react";
import { I18nProvider } from "react-aria-components";

/**
 * アプリ全体に効く 2 つの設定をまとめる。
 *
 * - `I18nProvider` が支援技術向けの組み込みラベルと、日付・数値の書式をロケールに追従させる
 * - `MotionConfig reducedMotion="user"` が `prefers-reduced-motion` への追従を Motion 全体に効かせる
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider locale="ja">
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </I18nProvider>
  );
}
