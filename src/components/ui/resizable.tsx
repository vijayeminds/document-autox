"use client"

import * as React from "react"

const ResizablePanelGroup = ({ children, direction = "horizontal", className }: any) => (
  <div className={`flex ${direction === "vertical" ? "flex-col" : "flex-row"} ${className}`}>
    {children}
  </div>
)

const ResizablePanel = ({ children, defaultSize, className }: any) => (
  <div className={className} style={{ flex: defaultSize || 1 }}>
    {children}
  </div>
)

const ResizableHandle = ({ className }: any) => (
  <div className={`w-px bg-slate-200 ${className}`} />
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
