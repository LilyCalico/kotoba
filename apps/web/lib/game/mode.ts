// E2E からも読み込む。E2E の型検査ではこのファイルが CommonJS として扱われるため、ESM の shared を ESM として解決させる。
import type { GameMode, UiLocale } from "@kotoba/shared" with { "resolution-mode": "import" };

/**
 * UI 言語で遊ぶ遊び方。日本語は意味当て、英語は単語当て（ADR 0012）。
 * 意味当てのヒントは日本語でだけ持つため、api は英語の UI での意味当てを受けない。
 */
const GAME_MODE: Record<UiLocale, GameMode> = {
  ja: "guess_meaning",
  en: "guess_word",
};

export function gameModeFor(locale: UiLocale): GameMode {
  return GAME_MODE[locale];
}
