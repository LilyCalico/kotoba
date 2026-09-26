"use client";

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
 * ギブアップの確認。Esc と外側のクリックは Cancel と同じく閉じるだけで、ギブアップは確定しない。
 * フォーカストラップと開いたときのフォーカス移動は React Aria Components に任せる。
 */
export function GiveUpDialog({
  isOpen,
  onOpenChange,
  onConfirm,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog isDismissable isOpen={isOpen} onOpenChange={onOpenChange} showCloseButton={false}>
      <DialogHeader>
        <DialogTitle>Give up?</DialogTitle>
        <DialogDescription>The word and its meaning will be revealed, and this round ends.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose variant="outline">Cancel</DialogClose>
        <Button onPress={onConfirm}>Give up</Button>
      </DialogFooter>
    </Dialog>
  );
}
