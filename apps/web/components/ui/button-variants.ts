import { cva } from "class-variance-authority"

/**
 * ボタンの見た目。主は `default`（ピンクのキーキャップ）、送信のような四角い主ボタンは `key`、
 * 副は `outline`（白い面に枠と小さな影）。`ghost` と `link` は影を持たず、目立たせない操作に使う。
 * キーキャップと副ボタンの文字は、画面の部品の書体（`font-pixel`）で組む。
 *
 * サーバーコンポーネントからも `Link` などに当てられるよう、"use client" を持たないこのモジュールに置く。
 */
export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 text-sm font-medium whitespace-nowrap select-none focus-ring data-disabled:pointer-events-none data-disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "keycap font-pixel text-base font-semibold tracking-[0.02em]",
        key: "keycap [--keycap-radius:0.5625rem] [--keycap-face:radial-gradient(circle_at_35%_30%,#ffffff,var(--keycap-face-via)_45%,var(--keycap-face-from))]",
        outline: "pressable bg-secondary font-pixel text-base text-secondary-foreground hover:bg-accent",
        secondary: "pressable bg-secondary font-pixel text-base text-secondary-foreground hover:bg-accent",
        ghost: "text-foreground underline underline-offset-4 decoration-1 hover:decoration-2",
        link: "text-foreground underline underline-offset-4 hover:decoration-2",
      },
      size: {
        default: "h-11 px-4",
        xs: "h-6 gap-1 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-3",
        lg: "h-14 px-6 text-xl",
        icon: "size-11",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
