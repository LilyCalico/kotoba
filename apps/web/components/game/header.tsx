"use client";

import Image from "next/image";

import { Button } from "@/components/ui/button";

/**
 * プレイ画面のヘッダー。背景はチャットと地続きにする。Give up ボタンはギブアップの確認ダイアログを開く。
 * ロゴを画面の `h1` にする。
 * ゲームの終了後は `onGiveUp` を渡さず、Give up ボタンを消す。ボタンが無くてもヘッダーの高さは変えない。
 */
export function Header({ onGiveUp }: { onGiveUp?: () => void }) {
  return (
    <header className="flex min-h-16 w-full items-center justify-between bg-background px-5 py-4">
      <h1>
        <Image alt="kotoba" height={24} priority src="/kotoba-logo.png" width={80} />
      </h1>
      {onGiveUp && (
        <Button onPress={onGiveUp} size="sm" variant="outline">
          Give up
        </Button>
      )}
    </header>
  );
}
