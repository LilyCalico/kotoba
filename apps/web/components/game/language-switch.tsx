"use client";

import { GlobeIcon } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button-variants";
import { LOCALES, LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, LOCALE_NAMES, localizedPath } from "@/lib/i18n/locale";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * スタート画面のヘッダーに置く、言語の切り替え。今の言語以外の UI 言語ごとに、その言語のスタート画面へのリンクを並べる。
 * 地球のアイコンと言語の短い名前（「En」）を、Give up と同じ下線付きの文字で出す。読み上げ名は短い名前に言語の正式名を続け（「En English」）、
 * 見えている名前で始めて音声操作でも呼べるようにしつつ、どの言語へ移るかを伝える。
 *
 * 押すと、選んだ言語を cookie に残す。言語のない URL（`/`）に来たとき、ブラウザの言語より先にこの言語へ振り分けられる。
 * プレイ画面を離れるとゲームが終わるため、プレイ画面には置かない。
 */
export function LanguageSwitch() {
  const locale = useLocale();

  return (
    <div className="-mr-2 flex">
      {LOCALES.filter((target) => target !== locale).map((target) => (
        <Link
          className={buttonVariants({ variant: "ghost", className: "px-2" })}
          href={localizedPath(target, "/")}
          hrefLang={target}
          key={target}
          onClick={() => {
            document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
          }}
        >
          <GlobeIcon aria-hidden />
          {LOCALE_NAMES[target].short}{" "}
          <span className="sr-only" lang={target}>
            {LOCALE_NAMES[target].name}
          </span>
        </Link>
      ))}
    </div>
  );
}
