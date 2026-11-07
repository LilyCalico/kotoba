import type { UiLocale } from "@kotoba/shared";

import { en } from "./en";
import { ja } from "./ja";

/** UI の文言の形。英語の辞書の形から作り、言語ごとの辞書はこの型を満たす。 */
export type Messages = typeof en;

/** UI 言語ごとの辞書。どの言語も `Messages` の形を満たさなければ型検査で落ちる。 */
export const messages: Record<UiLocale, Messages> = {
  en,
  ja,
};

export { en, ja };
