"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Dialog = ({ children, open, onOpenChange }: any) => {
  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => onOpenChange?.(false)}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {children}
      </div>
    </>
  )
}

const DialogContent = ({ children, className }: any) => (
  <div
    className={cn(
      "relative bg-white rounded-lg shadow-lg w-full max-w-lg p-6",
      className
    )}
    onClick={(e) => e.stopPropagation()}
  >
    {children}
  </div>
)

const DialogHeader = ({ children, className }: any) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)}>
    {children}
  </div>
)

const DialogTitle = ({ children, className }: any) => (
  <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
    {children}
  </h2>
)

const DialogDescription = ({ children, className }: any) => (
  <p className={cn("text-sm text-slate-500", className)}>
    {children}
  </p>
)

const DialogFooter = ({ children, className }: any) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4", className)}>
    {children}
  </div>
)

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter }
