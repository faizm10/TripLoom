import * as React from "react"

import { cn } from "@/lib/utils"

/** React 19: `ref` is a normal prop on function components (no forwardRef needed). */
function Input({ className, type, ref, ...props }: React.ComponentPropsWithRef<"input">) {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-[var(--r-2)] border border-input bg-card px-3 py-2 text-[13px] outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/10 disabled:cursor-not-allowed disabled:opacity-50 file:inline-flex file:border-0 file:bg-transparent file:text-[13px] file:font-medium file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
