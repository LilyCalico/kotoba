"use client";

import { FlagIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useMessages } from "@/lib/i18n/locale-context";

/**
 * プレイ画面のヘッダー。面を持たず、方眼の地をチャットと地続きにする。ワードマークを画面の `h1` にする。
 * Give up はギブアップの確認ダイアログを開く。押せるが目立たせないため、枠と影のない文字のボタンにする。
 * ゲームの終了後は `onGiveUp` を渡さず、Give up ボタンを消す。ボタンが無くてもヘッダーの高さは変えない。
 */
export function Header({ onGiveUp }: { onGiveUp?: () => void }) {
  const t = useMessages().header;

  return (
    <header className="flex min-h-16 w-full items-center justify-between pr-3 pl-5">
      <h1 className="font-pixel text-[1.375rem] font-semibold">kotoba</h1>
      {onGiveUp && (
        <Button className="px-2" onPress={onGiveUp} variant="ghost">
          <FlagIcon aria-hidden />
          {t.giveUp}
        </Button>
      )}
    </header>
  );
}
