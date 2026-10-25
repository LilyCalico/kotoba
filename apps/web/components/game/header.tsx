"use client";

import { FlagIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * プレイ画面のヘッダー。背景はチャットと地続きにする。ワードマークを画面の `h1` にする。
 * Give up はギブアップの確認ダイアログを開く。押せるが目立たせないため、枠と影のない文字のボタンにする。
 * ゲームの終了後は `onGiveUp` を渡さず、Give up ボタンを消す。ボタンが無くてもヘッダーの高さは変えない。
 */
export function Header({ onGiveUp }: { onGiveUp?: () => void }) {
  return (
    <header className="flex min-h-16 w-full items-center justify-between bg-background pr-3 pl-5">
      <h1 className="text-lg font-semibold tracking-tight">kotoba</h1>
      {onGiveUp && (
        <Button className="px-2" onPress={onGiveUp} variant="ghost">
          <FlagIcon aria-hidden />
          Give up
        </Button>
      )}
    </header>
  );
}
