"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";

/** プレイ画面のヘッダー。背景はチャットと地続きにする。Give up ボタンはギブアップの確認ダイアログを開く。 */
export function Header({ onGiveUp }: { onGiveUp: () => void }) {
  return (
    <header className="flex w-full items-center justify-between bg-background px-5 py-4">
      <Image alt="kotoba" height={24} priority src="/kotoba-logo.png" width={80} />
      <Button onPress={onGiveUp} size="sm" variant="outline">
        Give up
      </Button>
    </header>
  );
}
