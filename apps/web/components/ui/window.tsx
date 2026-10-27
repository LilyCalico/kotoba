import { cn } from "cn";

/** タイトルバーの色。ウィンドウが何を載せているかを見分けさせる。 */
const TITLE_BAR_TONE = {
  /** 設問。ラベンダー */
  question: "bg-label",
  /** ヒント。ピーチ */
  hint: "bg-titlebar-hint",
  /** 結果とスタート画面。ピンク */
  result: "bg-titlebar-result",
  /** 応答待ちとダイアログ。ペリウィンクル */
  system: "bg-titlebar-system",
} as const;

export type WindowTone = keyof typeof TITLE_BAR_TONE;

type WindowControl = "minimize" | "maximize" | "close";

/** タイトルバーに載せる文字の組み方。タイトルの要素（見出しや `id` を持つ段落）に当てる。 */
export const WINDOW_TITLE_CLASS = "font-pixel text-[0.9375rem] leading-none font-medium";

const CONTROL_GLYPH: Record<WindowControl, React.ReactNode> = {
  minimize: <path d="M1 6.5h6" />,
  maximize: <rect height="6" width="6" x="1" y="1" />,
  close: <path d="M1 1l6 6M7 1L1 7" />,
};

/**
 * ウィンドウの最小化・最大化・閉じるの箱。昔のデスクトップを思わせる飾りで、押せず、読み上げない。
 */
function WindowControls({ controls }: { controls: readonly WindowControl[] }) {
  return (
    <span aria-hidden className="ml-auto flex shrink-0 gap-[3px]">
      {controls.map((control) => (
        <span
          className="flex size-[1.0625rem] items-center justify-center border-[1.5px] border-border bg-card"
          key={control}
        >
          <svg
            className="size-2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 8 8"
          >
            {CONTROL_GLYPH[control]}
          </svg>
        </span>
      ))}
    </span>
  );
}

/**
 * ウィンドウのタイトルバー。`window` の枠の上端に置き、下に 1.5px の罫を引く。
 * `children` にはタイトルの要素を渡し、`WINDOW_TITLE_CLASS` で組む。ウィンドウの名前（`aria-labelledby` の先）を兼ねる。
 * `controls` は右端に並べる飾りの箱。何も渡さなければ置かない。
 */
export function WindowTitleBar({
  tone,
  controls = [],
  className,
  children,
}: {
  tone: WindowTone;
  controls?: readonly WindowControl[];
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-7 shrink-0 items-center justify-between gap-2 border-b-[1.5px] border-border py-1 pr-1.5 pl-2.5 text-foreground",
        TITLE_BAR_TONE[tone],
        className,
      )}
    >
      {children}
      {controls.length > 0 && <WindowControls controls={controls} />}
    </div>
  );
}

/**
 * 重ねたウィンドウ。手前のウィンドウ（`children`）の後ろに、右下へずらした白いウィンドウを 2 枚置く。
 * スタート画面と結果のように、画面の主役になるウィンドウにだけ使う。後ろの 2 枚は飾りで、読み上げない。
 * 手前のウィンドウは `relative` にして、後ろの 2 枚より上に重ねる。ずらした分だけ右と下を空ける。
 */
export function WindowStack({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("relative mr-4 mb-4", className)}>
      <div aria-hidden className="window absolute inset-0 translate-4" />
      <div aria-hidden className="absolute inset-0 translate-2 border-[1.5px] border-border bg-card" />
      {children}
    </div>
  );
}
