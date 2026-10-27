"use client";

import { FlagIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * ギブアップの確認。Give up は確定の操作なので主ボタンのキーキャップにし、旗のアイコンを添える。Cancel は副ボタン。
 * Esc と外側のクリックは Cancel と同じく閉じるだけで、ギブアップは確定しない。
 * フォーカストラップと開いたときのフォーカス移動は React Aria Components に任せる。
 * `isPending` はギブアップの要求中を表し、Give up を押せなくして要求の重複を防ぐ。
 */
export function GiveUpDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  isPending = false,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
  isPending?: boolean;
}) {
  return (
    <Dialog isDismissable isOpen={isOpen} onOpenChange={onOpenChange} showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>Give up?</DialogTitle>
        <DialogDescription>The word and its meaning will be revealed, and this round ends.</DialogDescription>
      </DialogHeader>
      <DialogFooter className="gap-3 pr-1 pb-1">
        <DialogClose variant="outline">Cancel</DialogClose>
        <Button className="data-[pending]:opacity-50" isPending={isPending} onPress={onConfirm}>
          <FlagIcon aria-hidden />
          Give up
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
