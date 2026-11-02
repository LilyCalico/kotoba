"use client"

import * as React from "react"
import { cn } from "cn"
import {
  composeRenderProps,
  Input as InputPrimitive,
} from "react-aria-components"

function Input({
  className,
  type,
  ...props
}: React.ComponentProps<typeof InputPrimitive>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={composeRenderProps(className, (className) =>
        cn(
          "h-12 w-full min-w-0 rounded-none border-[1.5px] border-input bg-card shadow-[inset_0.125rem_0.125rem_0_#e4e6f8] px-3.5 text-base text-card-foreground outline-none placeholder:text-muted-foreground focus-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-destructive",
          className
        )
      )}
      {...props}
    />
  )
}

export { Input }
