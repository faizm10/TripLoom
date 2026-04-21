import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-transparent px-2.5 py-0.5 text-[11px] font-medium transition-all [&>svg]:size-3! [&>svg]:pointer-events-none has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-[inset_0_0_0_1px_var(--hair)]",
        destructive: "bg-[oklch(0.58_0.22_27_/0.08)] text-destructive",
        outline: "border-border bg-card text-foreground shadow-[inset_0_0_0_1px_var(--hair)]",
        ghost: "text-[var(--ink-3)] hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
