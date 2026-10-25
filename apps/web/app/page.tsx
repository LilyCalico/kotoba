import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";

/**
 * 重ねた 2 枚のカードと、「?」のホログラムのステッカー。まだ空欄の単語を表す飾りで、読み上げない。
 * ステッカーは結果のカードに貼られるものと同じで、正解したときにこの「?」が埋まることを予告する。
 */
function BlankWordCards() {
  return (
    <div aria-hidden className="relative h-48 w-60">
      <div className="absolute top-4.5 left-5.5 h-[9.375rem] w-49 -rotate-5 border border-border bg-card" />
      <div className="absolute top-4.5 left-5.5 flex h-[9.375rem] w-49 rotate-3 items-center justify-center border border-border bg-card">
        <span className="block h-10 w-30 border-b-2 border-foreground" />
      </div>
      <div className="holo absolute top-0 right-0 flex size-18 rotate-12 items-center justify-center rounded-full border border-border">
        <span className="font-serif text-3xl leading-none italic">?</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 justify-center">
      <div className="flex w-full max-w-[42rem] flex-1 flex-col px-5 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <header className="flex min-h-16 items-center pt-[env(safe-area-inset-top)]">
          <p className="text-lg font-semibold tracking-tight">kotoba</p>
        </header>
        <main className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
          <BlankWordCards />
          <div className="flex max-w-[30rem] flex-col items-center gap-3.5">
            <h1 className="font-serif text-[2.75rem] leading-[1.1] font-normal text-balance">
              A word for a feeling you’ve never named
            </h1>
            <p className="max-w-[19rem] text-[0.9375rem] leading-relaxed text-muted-foreground">
              Somewhere in Swedish it exists. Ask yes-or-no questions to uncover it.
            </p>
          </div>
        </main>
        <Link
          className={buttonVariants({ size: "lg", className: "mr-1 w-[calc(100%-0.25rem)] self-center md:w-80" })}
          href="/play"
        >
          Start a game
        </Link>
      </div>
    </div>
  );
}
