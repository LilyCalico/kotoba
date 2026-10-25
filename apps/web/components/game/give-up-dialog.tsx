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
 * ギブアップの確認。Give up は取り消せない操作なので、淡い赤の主ボタンに旗のアイコンを添える。
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
      <DialogFooter className="gap-3 pr-[0.1875rem] pb-[0.1875rem]">
        <DialogClose variant="outline">Cancel</DialogClose>
        <Button
          className="data-[pending]:opacity-50"
          isPending={isPending}
          onPress={onConfirm}
          variant="destructive"
        >
          <FlagIcon aria-hidden />
          Give up
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
