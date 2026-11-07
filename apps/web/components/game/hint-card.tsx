"use client";

import { MAX_HINTS } from "@kotoba/shared";
import { LightbulbIcon } from "lucide-react";
import { motion } from "motion/react";

import { cardAppear } from "@/components/game/motion";
import { WINDOW_TITLE_CLASS, WindowTitleBar } from "@/components/ui/window";
import { useMessages } from "@/lib/i18n/locale-context";

/**
 * 開示したヒント。ピーチのタイトルバー「Hint N of 3」を持つウィンドウに、明朝のヒントを載せる。
 * タイトルバーの色で、設問（ラベンダー）や結果（ピンク）のウィンドウと見分ける。
 * ヒントはライブリージョンに載せないため、開示したときのフォーカス先になって読み上げさせる。
 * そのため `ref` を受け付けて `tabIndex={-1}` を持つ。描画された時点で、わずかに拡大しながら現れる。
 */
export function HintCard({
  index,
  text,
  ref,
}: {
  index: number;
  text: string;
  ref?: React.Ref<HTMLElement>;
}) {
  const title = useMessages().hint.title(index, MAX_HINTS);

  return (
    <motion.section
      {...cardAppear}
      aria-label={title}
      className="window mr-1 mb-1 flex flex-col focus-ring"
      ref={ref}
      tabIndex={-1}
    >
      <WindowTitleBar controls={["close"]} tone="hint">
        <p className={`${WINDOW_TITLE_CLASS} flex items-center gap-1.5`}>
          <LightbulbIcon aria-hidden className="size-3.5" />
          {title}
        </p>
      </WindowTitleBar>
      <p className="px-3.5 pt-2.5 pb-3.5 font-serif text-xl leading-snug">{text}</p>
    </motion.section>
  );
}
