"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const DropdownMenu = ({ children }: any) => {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="relative">
      {React.Children.map(children, child =>
        React.cloneElement(child, { open, setOpen })
      )}
    </div>
  )
}

const DropdownMenuTrigger = ({ children, asChild, open, setOpen }: any) => {
  return (
    <div onClick={() => setOpen(!open)}>
      {children}
    </div>
  )
}

const DropdownMenuContent = ({ children, align = "start", className, open, setOpen }: any) => {
  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => setOpen(false)}
      />
      <div
        className={cn(
          "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border border-slate-200 bg-white p-1 shadow-md",
          align === "end" && "right-0",
          align === "start" && "left-0",
          className
        )}
      >
        {children}
      </div>
    </>
  )
}

const DropdownMenuItem = ({ children, className, onClick }: any) => (
  <div
    onClick={onClick}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100",
      className
    )}
  >
    {children}
  </div>
)

const DropdownMenuSeparator = ({ className }: any) => (
  <div className={cn("-mx-1 my-1 h-px bg-slate-200", className)} />
)

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
}
