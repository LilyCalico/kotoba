import Image from "next/image";
import Link from "next/link";

import { LeafScatter } from "@/components/game/leaf-scatter";

export default function Home() {
  return (
    <main className="flex flex-1 justify-center">
      <div className="relative flex w-full max-w-[42rem] flex-1 items-center justify-center overflow-hidden px-5 pt-18">
        <LeafScatter variant="start" />
        <div className="relative z-10 flex w-full max-w-[30rem] flex-col items-start gap-6">
          <div className="flex w-full flex-col gap-5">
            <h1>
              <Image
                alt="kotoba"
                fetchPriority="high"
                height={66}
                loading="eager"
                src="/kotoba-logo.png"
                width={220}
              />
            </h1>
            <p className="text-sm text-muted-foreground text-outline">
              Somewhere in Swedish there&apos;s a word
              <br />
              for a feeling you&apos;ve never been able to name.
            </p>
          </div>
          <hr className="w-6 border-t border-muted-foreground" />
          <p className="text-base font-medium text-balance text-foreground text-outline">
            Ask yes-or-no questions to uncover the hidden word.
          </p>
          <Link
            className="mt-13 rounded-md outline-none transition-transform hover:brightness-110 focus-visible:ring-3 focus-visible:ring-ring/30 active:translate-y-px"
            href="/play"
          >
            <Image
              alt="START"
              height={54}
              src="/start-button.png"
              width={120}
            />
          </Link>
        </div>
      </div>
    </main>
  );
}
