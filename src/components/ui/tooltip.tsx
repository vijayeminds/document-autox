"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const TooltipProvider = ({ children }: any) => <>{children}</>

const Tooltip = ({ children }: any) => {
  const [open, setOpen] = React.useState(false)
  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="relative inline-block"
    >
      {React.Children.map(children, child =>
        React.cloneElement(child, { open })
      )}
    </div>
  )
}

const TooltipTrigger = ({ children, open }: any) => <>{children}</>

const TooltipContent = ({ children, open, className }: any) => {
  if (!open) return null
  return (
    <div className={cn(
      "absolute z-50 overflow-hidden rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-md",
      "bottom-full left-1/2 -translate-x-1/2 -translate-y-2",
      className
    )}>
      {children}
    </div>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
