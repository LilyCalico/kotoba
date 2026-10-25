"use client";

import { MAX_HINTS } from "@kotoba/shared";
import { LightbulbIcon } from "lucide-react";
import { motion } from "motion/react";

import { cardAppear } from "@/components/game/motion";

/**
 * 開示したヒント。読ませるものなので、設問と同じ白いカードに 1px の枠をとり、明朝で組む。
 * 何番目かは塗りのない小さな文字とアイコンで添え、ラベルや回答のピルと見分ける。
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
  return (
    <motion.section
      {...cardAppear}
      aria-label={`Hint ${index} of ${MAX_HINTS}`}
      className="flex w-full flex-col gap-1.5 border border-border bg-card px-4 pt-3 pb-4 text-card-foreground focus-ring"
      ref={ref}
      tabIndex={-1}
    >
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <LightbulbIcon aria-hidden className="size-3.5" />
        Hint {index} of {MAX_HINTS}
      </p>
      <p className="font-serif text-xl leading-snug">{text}</p>
    </motion.section>
  );
}
