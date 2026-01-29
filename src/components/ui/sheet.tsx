"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Sheet = ({ children, open, onOpenChange }: any) => {
  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => onOpenChange?.(false)}
      />
      {children}
    </>
  )
}

const SheetContent = ({ children, className, side = "right" }: any) => (
  <div
    className={cn(
      "fixed z-50 gap-4 bg-white p-6 shadow-lg transition ease-in-out",
      side === "right" && "inset-y-0 right-0 h-full w-3/4 max-w-2xl border-l",
      side === "left" && "inset-y-0 left-0 h-full w-3/4 max-w-2xl border-r",
      className
    )}
  >
    {children}
  </div>
)

const SheetHeader = ({ children, className }: any) => (
  <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}>
    {children}
  </div>
)

const SheetTitle = ({ children, className }: any) => (
  <h2 className={cn("text-lg font-semibold text-slate-900", className)}>
    {children}
  </h2>
)

const SheetDescription = ({ children, className }: any) => (
  <p className={cn("text-sm text-slate-500", className)}>
    {children}
  </p>
)

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription }
