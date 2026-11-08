"use client";

import type { GameMode } from "@kotoba/shared";
import { createContext, use } from "react";

import { gameModeFor } from "@/lib/game/mode";
import { useLocale } from "@/lib/i18n/locale-context";

const GameModeContext = createContext<GameMode | null>(null);

/** 始まったゲームの遊び方を、ゲームの画面の部品に配る。 */
export function GameModeProvider({ mode, children }: { mode: GameMode; children: React.ReactNode }) {
  return <GameModeContext value={mode}>{children}</GameModeContext>;
}

/**
 * 今の遊び方。辞書の遊び方で変わる文言は、これで引く。
 * ゲームの画面の中では、始まったゲームの遊び方（開始の応答の `mode`）を返す。最初に見せるカードと文言が、同じ遊び方に従う。
 * それ以外（スタート画面とゲーム開始のリクエスト）では、UI 言語から `gameModeFor` で決める。
 */
export function useGameMode(): GameMode {
  const locale = useLocale();
  return use(GameModeContext) ?? gameModeFor(locale);
}
