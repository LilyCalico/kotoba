import Image from "next/image";

import { LeafScatter } from "@/components/game/leaf-scatter";
import { LinkButton } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 justify-center">
      <div className="relative flex w-full max-w-[42rem] flex-1 items-center justify-center overflow-hidden px-5 pt-18">
        <LeafScatter variant="start" />
        <div className="relative flex w-[20rem] max-w-full flex-col items-start gap-6">
          <div className="flex w-full flex-col gap-5">
            <h1>
              <Image alt="kotoba" height={66} priority src="/kotoba-logo.png" width={220} />
            </h1>
            <p className="text-sm text-muted-foreground">
              Somewhere in Swedish there&apos;s a word
              <br />
              for a feeling you&apos;ve never been able to name.
            </p>
          </div>
          <hr className="w-6 border-t border-muted-foreground" />
          <p className="text-base font-medium text-balance text-foreground">
            Ask yes-or-no questions to uncover the hidden word.
          </p>
          <LinkButton className="mt-13" href="/play" size="lg">
            START
          </LinkButton>
        </div>
      </div>
    </main>
  );
}
