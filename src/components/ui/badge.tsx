import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "outline"
          ? "border-slate-200 bg-white text-slate-900"
          : "border-transparent bg-slate-900 text-slate-50",
        className
      )}
      {...props}
    />
  )
}

export { Badge }
