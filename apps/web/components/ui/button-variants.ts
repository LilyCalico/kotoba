import { cva } from "class-variance-authority"

/**
 * ボタンの見た目。押せるものは 1px の枠とずらした影（`pressable`）を持ち、押すと沈む。
 * 主は `default`（ライム）、副は `outline`（白）。`ghost` と `link` は影を持たず、目立たせない操作に使う。
 *
 * サーバーコンポーネントからも `Link` などに当てられるよう、"use client" を持たないこのモジュールに置く。
 */
export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-none border border-transparent text-sm font-medium whitespace-nowrap select-none focus-ring data-disabled:pointer-events-none data-disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "pressable bg-primary text-primary-foreground hover:bg-[color-mix(in_oklch,var(--primary),var(--foreground)_6%)]",
        outline: "pressable bg-secondary text-secondary-foreground hover:bg-accent",
        secondary: "pressable bg-secondary text-secondary-foreground hover:bg-accent",
        ghost: "text-foreground underline underline-offset-4 decoration-1 hover:decoration-2",
        destructive: "pressable bg-destructive text-destructive-foreground hover:bg-[color-mix(in_oklch,var(--destructive),var(--foreground)_6%)]",
        link: "text-foreground underline underline-offset-4 hover:decoration-2",
      },
      size: {
        default: "h-11 px-4",
        xs: "h-6 gap-1 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-3",
        lg: "h-14 px-6 text-base",
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
