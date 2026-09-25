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
    <Dialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      showCloseButton={false}
      isDismissable
    >
      <DialogHeader>
        <DialogTitle>Give up?</DialogTitle>
        <DialogDescription>
          The word and its meaning will be revealed, and this round ends.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose variant="outline">Keep playing</DialogClose>
        <Button onPress={onConfirm}>Reveal the word</Button>
      </DialogFooter>
    </Dialog>
  );
}
