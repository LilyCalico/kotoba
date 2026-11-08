"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useEffectEvent, useId, useRef, useState, useSyncExternalStore } from "react";

import { LanguageSwitch } from "@/components/game/language-switch";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { WINDOW_TITLE_CLASS, WindowStack, WindowTitleBar } from "@/components/ui/window";
import {
  BOOT_HOLD_MS,
  BOOT_START_DELAY_MS,
  BOOT_TEXT,
  type BootStorage,
  getSessionStorage,
  hasSeenBoot,
  keystrokeDelay,
  markBootSeen,
} from "@/lib/game/boot";
import { localizedPath } from "@/lib/i18n/locale";
import { useGameMode } from "@/lib/game/mode-context";
import { useLocale, useMessages } from "@/lib/i18n/locale-context";

/** 起動画面の記録先。省略時はブラウザの `sessionStorage`、`null` なら記録しない。 */
function resolveStorage(storage: BootStorage | null | undefined): BootStorage | null {
  return storage === undefined ? getSessionStorage() : storage;
}

/** 記録は描画の外から変わらないため、購読するものはない。 */
function subscribeNothing() {
  return () => {};
}

/** 起動画面のパソコン。画面に打ち込んだ文字と、点滅するカーソルを映す。飾りで、読み上げない。 */
function BootComputer({ text }: { text: string }) {
  return (
    <div aria-hidden className="flex flex-col items-center">
      <div className="h-58 w-80 rounded-[0.75rem] border-[1.5px] border-border bg-titlebar-system p-4 shadow-[0.3125rem_0.3125rem_0_var(--foreground)]">
        <div className="size-full rounded-[0.25rem] border-[1.5px] border-border bg-card p-3">
          <p
            className="size-full rounded-[0.25rem] bg-[linear-gradient(135deg,#addbff,#dcd0ff_45%,#f4a9d2)] px-3.5 py-4 font-pixel text-[1.375rem] leading-[1.4] font-semibold whitespace-pre-line"
            lang="sv"
          >
            {text}
            <span className="animate-caret motion-reduce:animate-none">_</span>
          </p>
        </div>
      </div>
      <div className="h-3.5 w-24 border-[1.5px] border-t-0 border-border bg-titlebar-system" />
      <div className="h-4 w-55 border-[1.5px] border-border bg-meter shadow-[0.3125rem_0.3125rem_0_var(--foreground)]" />
    </div>
  );
}

/** Start a game を指すマウスカーソル。飾りで、読み上げない。 */
function PointerCursor() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute right-9 -bottom-4 h-[1.625rem] w-[1.375rem]"
      viewBox="0 0 22 26"
    >
      <path
        d="M2 2v19l5-5 4 8 3-1.5-4-8h7z"
        fill="#ffffff"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/**
 * `/` の画面。サイトを開くと、まず起動画面でパソコンに「Hej hej! / Jag heter Kotoba」を 1 文字ずつ打ち込む。
 * 打ち終えて一拍おくか、Skip を押すと、スタート画面のウィンドウ（welcome.txt）が開く。
 * ヘッダーには、ワードマークと反対側に言語の切り替えを置く。
 *
 * 起動画面はタブごとに 1 回だけ見せ、見たことを `storage` に記録する。Play again で戻ったときは、スタート画面から始める。
 * `storage` を省略するとブラウザの `sessionStorage` を使い、`null` なら記録せず毎回起動画面から始める。
 * 記録はサーバーで読めないため、サーバーの描画とハイドレーションの間は中身を描かず、ワードマークだけを出す。
 *
 * 動きを減らす設定では、文を最初から全部出し、一拍おいてスタート画面へ移る。
 * `autoplay={false}` は打ち込みを止め、文を全部出したまま留まる（Storybook で起動画面を見せるため）。
 * Skip を押したとき、または Skip にフォーカスがあるまま移ったときは、スタート画面の見出しへフォーカスを移す。
 */
export function StartScreen({
  storage,
  autoplay = true,
}: {
  storage?: BootStorage | null;
  autoplay?: boolean;
}) {
  const locale = useLocale();
  const t = useMessages().start;
  const mode = useGameMode();
  const seen = useSyncExternalStore(
    subscribeNothing,
    () => hasSeenBoot(resolveStorage(storage)),
    () => null,
  );
  const [typed, setTyped] = useState(0);
  const [booted, setBooted] = useState(false);
  const reduceMotion = useReducedMotion();
  const skipRef = useRef<HTMLButtonElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusHeading = useRef(false);
  const headingId = useId();

  const phase = seen === null ? "loading" : seen || booted ? "welcome" : "boot";
  const showAll = !autoplay || reduceMotion;

  function finishBoot(fromSkip: boolean) {
    focusHeading.current = fromSkip || document.activeElement === skipRef.current;
    markBootSeen(resolveStorage(storage));
    setBooted(true);
  }
  const finishTyping = useEffectEvent(() => finishBoot(false));

  useEffect(() => {
    if (phase !== "boot" || !autoplay) return;

    let timer: ReturnType<typeof setTimeout>;
    const finish = () => {
      timer = setTimeout(finishTyping, BOOT_HOLD_MS);
    };
    if (reduceMotion) {
      finish();
      return () => clearTimeout(timer);
    }
    const typeNext = (count: number) => {
      const delay = count === 1 ? BOOT_START_DELAY_MS : keystrokeDelay(BOOT_TEXT[count - 2] ?? "", Math.random());
      timer = setTimeout(() => {
        setTyped(count);
        if (count < BOOT_TEXT.length) typeNext(count + 1);
        else finish();
      }, delay);
    };
    typeNext(1);
    return () => clearTimeout(timer);
  }, [phase, autoplay, reduceMotion]);

  useEffect(() => {
    if (phase === "welcome" && focusHeading.current) headingRef.current?.focus();
  }, [phase]);

  return (
    <div className="flex flex-1 justify-center">
      <div className="flex w-full max-w-[42rem] flex-1 flex-col px-5 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <header className="flex min-h-16 items-center justify-between pt-[env(safe-area-inset-top)]">
          <p className="font-pixel text-[1.375rem] font-semibold">kotoba</p>
          <LanguageSwitch />
        </header>

        {phase === "boot" && (
          <main className="flex flex-1 flex-col items-center justify-center gap-7 py-8">
            <h1 className="sr-only" lang="sv">
              {BOOT_TEXT.replace("\n", " ")}
            </h1>
            <BootComputer text={showAll ? BOOT_TEXT : BOOT_TEXT.slice(0, typed)} />
            <Button
              className="mt-9 min-w-22 font-pixel text-lg underline-offset-[5px]"
              onPress={() => finishBoot(true)}
              ref={skipRef}
              variant="ghost"
            >
              <span aria-hidden>&gt;</span>
              {t.skip}
            </Button>
          </main>
        )}

        {phase === "welcome" && (
          <main className="flex flex-1 flex-col items-center justify-center py-8">
            <motion.div
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-[30rem]"
              initial={booted ? { opacity: 0, scale: 0.92 } : false}
              transition={{ type: "spring", stiffness: 420, damping: 26 }}
            >
              <WindowStack>
                <section
                  aria-labelledby={headingId}
                  className="relative flex flex-col border-[1.5px] border-border bg-card text-card-foreground"
                >
                  <WindowTitleBar controls={["minimize", "maximize", "close"]} tone="result">
                    <p aria-hidden className={WINDOW_TITLE_CLASS}>
                      welcome.txt
                    </p>
                  </WindowTitleBar>
                  <div className="flex flex-col items-center gap-3.5 px-5 pt-6 pb-6.5 text-center">
                    <h1
                      className="font-serif text-[2.5rem] leading-[1.1] font-normal text-phrase focus-ring"
                      id={headingId}
                      ref={headingRef}
                      tabIndex={-1}
                    >
                      {t.heading[mode]}
                    </h1>
                    <p className="max-w-[17rem] text-sm leading-relaxed text-muted-foreground">{t.lead[mode]}</p>
                    <div className="relative mt-2 mr-1 self-stretch">
                      <Link
                        className={buttonVariants({ size: "lg", className: "w-full" })}
                        href={localizedPath(locale, "/play")}
                      >
                        {t.startGame}
                      </Link>
                      <PointerCursor />
                    </div>
                  </div>
                </section>
              </WindowStack>
            </motion.div>
          </main>
        )}
      </div>
    </div>
  );
}
