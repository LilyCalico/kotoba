"use client"

import { XIcon } from "lucide-react"
import {
  Text,
  UNSTABLE_Toast as ToastPrimitive,
  UNSTABLE_ToastContent as ToastContentPrimitive,
  UNSTABLE_ToastQueue as ToastQueuePrimitive,
  UNSTABLE_ToastRegion as ToastRegionPrimitive,
} from "react-aria-components"

import { Button } from "@/components/ui/button"

/** スナックバーの中身。`action` を添えると、閉じるボタンの手前に操作ボタンを置く。 */
export type ToastContent = {
  title: string
  action?: { label: string; onAction: () => void }
}

/** 操作ボタンのないスナックバーが自動で閉じるまでの時間。React Aria が推奨する最短の 5 秒にとる。 */
export const TOAST_TIMEOUT_MS = 5000

/**
 * アプリ全体で 1 つのスナックバーのキュー。同時に出すのは 1 件で、後から積んだものは前が閉じるまで待つ。
 * 操作ボタンのあるスナックバーは、読み終える前に消えて操作できなくなるのを防ぐため自動で閉じない。
 */
export const toastQueue = new ToastQueuePrimitive<ToastContent>({ maxVisibleToasts: 1 })

export function toast(content: ToastContent) {
  return toastQueue.add(content, content.action ? {} : { timeout: TOAST_TIMEOUT_MS })
}

/**
 * スナックバーの置き場所。`Providers` に 1 つだけ置く。
 * `<body>` の直下に描画され、モーダルのダイアログが開いていても隠されず操作できる。
 */
export function Toaster() {
  return (
    <ToastRegionPrimitive
      className="fixed inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-60 flex justify-center px-4 outline-none"
      queue={toastQueue}
    >
      {({ toast: item }) => (
        <ToastPrimitive
          className="flex w-full max-w-[40rem] items-center gap-3 border border-border bg-popover py-2 pr-2 pl-4 text-sm font-medium text-popover-foreground focus-ring"
          toast={item}
        >
          <ToastContentPrimitive className="min-w-0 flex-1 py-1">
            <Text slot="title">{item.content.title}</Text>
          </ToastContentPrimitive>
          {item.content.action && (
            <Button
              onPress={() => {
                item.content.action?.onAction()
                toastQueue.close(item.key)
              }}
            >
              {item.content.action.label}
            </Button>
          )}
          <Button
            aria-label="Close"
            className="no-underline"
            size="icon"
            slot="close"
            variant="ghost"
          >
            <XIcon aria-hidden className="size-5" />
          </Button>
        </ToastPrimitive>
      )}
    </ToastRegionPrimitive>
  )
}
