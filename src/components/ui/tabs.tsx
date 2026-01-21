"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Tabs = ({ children, defaultValue, value, onValueChange, className }: any) => {
  const [selectedValue, setSelectedValue] = React.useState(value || defaultValue)

  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value)
    }
  }, [value])

  const handleChange = (newValue: string) => {
    setSelectedValue(newValue)
    onValueChange?.(newValue)
  }

  return (
    <div className={className}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { value: selectedValue, onValueChange: handleChange })
      )}
    </div>
  )
}

const TabsList = ({ children, value, onValueChange, className }: any) => (
  <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500", className)}>
    {React.Children.map(children, child =>
      React.cloneElement(child, { selectedValue: value, onValueChange })
    )}
  </div>
)

const TabsTrigger = ({ children, value, selectedValue, onValueChange, className }: any) => (
  <button
    type="button"
    onClick={() => onValueChange?.(value)}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      selectedValue === value
        ? "bg-white text-slate-900 shadow-sm"
        : "text-slate-600 hover:text-slate-900",
      className
    )}
  >
    {children}
  </button>
)

const TabsContent = ({ children, value, value: tabValue, className }: any) => {
  if (tabValue !== value) return null
  return <div className={className}>{children}</div>
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
