"use client"

import * as React from "react"

const Select = ({ children, value, onValueChange }: any) => {
  const [open, setOpen] = React.useState(false)
  const selectRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={selectRef}>
      {React.Children.map(children, child =>
        React.cloneElement(child, { value, onValueChange, open, setOpen })
      )}
    </div>
  )
}

const SelectTrigger = ({ children, className, open, setOpen }: any) => {
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ${className}`}
    >
      {children}
      <svg
        className="h-4 w-4 opacity-50"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
}

const SelectValue = ({ placeholder, value }: any) => {
  return <span className="block truncate">{value || placeholder}</span>
}

const SelectContent = ({ children, onValueChange, setOpen, open }: any) => {
  if (!open) return null

  return (
    <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg max-h-60 overflow-auto">
      {React.Children.map(children, child =>
        React.cloneElement(child, { onValueChange, setOpen })
      )}
    </div>
  )
}

const SelectItem = ({ children, value, onValueChange, setOpen }: any) => (
  <div
    onClick={() => {
      onValueChange?.(value)
      setOpen?.(false)
    }}
    className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-100 transition-colors"
  >
    {children}
  </div>
)

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
