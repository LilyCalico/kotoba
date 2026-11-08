import { gameModeFor } from "../../apps/web/lib/game/mode.js";
import { en } from "../../apps/web/lib/i18n/messages/en.js";
import { ja } from "../../apps/web/lib/i18n/messages/ja.js";

export type Messages = typeof en;

/** UI 言語ごとの辞書。web の `messages` は拡張子のない import を含み E2E から読めないため、ここで組む。 */
export const dictionaries = { en, ja } satisfies Record<string, Messages>;

export type Locale = keyof typeof dictionaries;

/** 最初に見せるカードの名前。遊び方は web と同じく `gameModeFor` で UI 言語から決める。 */
export function openingTitle(locale: Locale): string {
  const t = dictionaries[locale];
  return gameModeFor(locale) === "guess_meaning" ? t.wordCard.title : t.teaser.title;
}
