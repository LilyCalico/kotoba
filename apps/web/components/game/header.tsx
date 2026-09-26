"use client";

import { XIcon } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";

export function Header({ onGiveUp }: { onGiveUp: () => void }) {
  return (
    <header className="flex w-full items-center justify-between bg-card px-5 pt-8 pb-4">
      <Image alt="kotoba" height={24} priority src="/kotoba-logo.png" width={80} />
      <Button aria-label="Give up" onPress={onGiveUp} size="icon-xs" variant="ghost">
        <XIcon />
      </Button>
    </header>
  );
}
