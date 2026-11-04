"use client"

import * as React from "react"
import { cn } from "cn"
import {
  Dialog as DialogPrimitive,
  DialogTrigger as DialogTriggerPrimitive,
  Heading,
  ModalOverlay as ModalOverlayPrimitive,
  Modal as ModalPrimitive,
  type DialogProps as DialogPrimitiveProps,
  type DialogTriggerProps as DialogTriggerPrimitiveProps,
  type ModalOverlayProps as ModalOverlayPrimitiveProps,
} from "react-aria-components"

import { Button } from "@/components/ui/button"
import { WindowTitleBar } from "@/components/ui/window"
import { useMessages } from "@/lib/i18n/locale-context"
import { XIcon } from "lucide-react"

const DialogDescriptionContext = React.createContext<{
  id: string
  setIsMounted: (isMounted: boolean) => void
} | null>(null)

function DialogTrigger({ ...props }: DialogTriggerPrimitiveProps) {
  return <DialogTriggerPrimitive data-slot="dialog-trigger" {...props} />
}

function DialogClose({
  className,
  variant = "outline",
  size = "default",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      slot="close"
      data-slot="dialog-close"
      variant={variant}
      size={size}
      className={cn(className)}
      {...props}
    />
  )
}

function DialogOverlay({
  className,
  children,
  ...props
}: Omit<ModalOverlayPrimitiveProps, "className" | "children"> & {
  className?: string
  children: React.ReactNode
}) {
  return (
    <ModalOverlayPrimitive
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-foreground/40 duration-100 data-entering:animate-in data-entering:fade-in-0 data-exiting:animate-out data-exiting:fade-out-0",
        className
      )}
      {...props}
    >
      {children}
    </ModalOverlayPrimitive>
  )
}

function Dialog({
  className,
  children,
  showCloseButton = true,
  isDismissable = true,
  ...props
}: Omit<ModalOverlayPrimitiveProps, "className" | "children"> &
  Pick<React.ComponentProps<typeof ModalPrimitive>, "isDismissable"> & {
    className?: string
    children: React.ReactNode
    showCloseButton?: boolean
  }) {
  const t = useMessages().common
  const descriptionId = React.useId()
  const [hasDescription, setHasDescription] = React.useState(false)
  const descriptionContext = React.useMemo(
    () => ({ id: descriptionId, setIsMounted: setHasDescription }),
    [descriptionId]
  )

  return (
    <DialogOverlay isDismissable={isDismissable} {...props}>
      <ModalPrimitive
        data-slot="dialog-content"
        className={cn(
          "window fixed top-1/2 left-1/2 z-50 flex w-full max-w-[calc(100%-2.5rem)] -translate-x-1/2 -translate-y-1/2 flex-col bg-popover text-sm text-popover-foreground duration-100 outline-none data-entering:animate-in data-entering:fade-in-0 data-entering:zoom-in-95 data-exiting:animate-out data-exiting:fade-out-0 data-exiting:zoom-out-95 sm:max-w-md",
          className
        )}
      >
        {/* ダイアログもウィンドウとして描く。タイトルバーは飾りで、ダイアログの名前は DialogTitle が持つ */}
        <WindowTitleBar controls={["minimize", "maximize"]} tone="system" />
        <DialogPrimitive
          data-slot="dialog"
          className={cn(
            "relative grid gap-5 p-6 outline-none",
            showCloseButton && "*:data-[slot=dialog-header]:pr-8"
          )}
          aria-describedby={hasDescription ? descriptionId : undefined}
        >
          <DialogDescriptionContext value={descriptionContext}>
            {children}
          </DialogDescriptionContext>
          {showCloseButton && (
            <DialogClose
              variant="ghost"
              className="absolute top-3 right-3"
              size="icon"
            >
              <XIcon
              />
              <span className="sr-only">{t.close}</span>
            </DialogClose>
          )}
        </DialogPrimitive>
      </ModalPrimitive>
    </DialogOverlay>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  const t = useMessages().common

  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && <DialogClose variant="outline">{t.close}</DialogClose>}
    </div>
  )
}

function DialogTitle({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Heading>, "slot">) {
  return (
    <Heading
      slot="title"
      data-slot="dialog-title"
      className={cn(
        "font-serif text-2xl leading-tight font-semibold",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "slot" | "id">) {
  const context = React.useContext(DialogDescriptionContext)

  React.useLayoutEffect(() => {
    if (!context) return
    context.setIsMounted(true)
    return () => context.setIsMounted(false)
  }, [context])

  return (
    <div
      id={context?.id}
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  type DialogPrimitiveProps,
  type DialogTriggerPrimitiveProps,
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
}
