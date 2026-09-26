import Image from "next/image";

import { LeafScatter } from "@/components/game/leaf-scatter";
import { LinkButton } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-5 pt-18">
      <LeafScatter variant="start" />
      <div className="relative z-10 flex w-[18.625rem] max-w-full flex-col items-start gap-6">
        <div className="flex w-full flex-col gap-5">
          <h1>
            <Image
              alt="kotoba"
              height={66}
              priority
              src="/kotoba-logo.png"
              width={220}
            />
          </h1>
          <p className="text-[0.625rem] text-muted-foreground">
            Somewhere in Swedish there&apos;s a word
            <br />
            for a feeling you&apos;ve never been able to name.
          </p>
        </div>
        <hr className="w-6 border-t border-muted-foreground" />
        <p className="text-xs font-medium text-foreground">
          Ask yes-or-no questions to uncover the hidden word.
        </p>
        <LinkButton
          className="mt-13 h-auto px-3 py-1.5 text-xl font-bold tracking-[0.16em]"
          href="/play"
        >
          START
        </LinkButton>
      </div>
    </main>
  );
}
