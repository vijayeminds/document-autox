"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  ClipboardList,
  Settings,
  Inbox,
  Link2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { name: "Documents", page: "Document-Processing", icon: Inbox },
  { name: "Lifecycle", page: "Lifecycle", icon: Link2 },
  { name: "Exceptions", page: "Exceptions", icon: AlertTriangle },
  { name: "Chargebacks", page: "Chargebacks", icon: FileText },
  { name: "Approvals", page: "Approvals", icon: CheckCircle },
  { name: "Analytics", page: "Analytics", icon: BarChart3 },
  { name: "Audit Log", page: "Audit-Log", icon: ClipboardList },
  { name: "Settings", page: "Settings", icon: Settings },
];

export default function Sidebar({ currentPage, collapsed, onToggle }) {
  const [hovering, setHovering] = useState(false);
  const isExpanded = !collapsed || hovering;

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "bg-white border-r border-slate-200 flex flex-col h-screen transition-all duration-200 fixed left-0 top-0 z-40",
          isExpanded ? "w-64" : "w-16"
        )}
        onMouseEnter={() => collapsed && setHovering(true)}
        onMouseLeave={() => collapsed && setHovering(false)}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-slate-100 justify-between">
          <div className="flex items-center min-w-0">
            {isExpanded ? (
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695565823d5de6cb79ac9cec/c41be3fc4_Autox48b0021800be820c74201.png"
                alt="AUTOX"
                className="h-8 w-auto object-contain"
              />
            ) : (
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.page;
            const Icon = item.icon;

            return isExpanded ? (
              <Link
                key={item.name}
                href={createPageUrl(item.page)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0",
                    isActive ? "text-white" : "text-slate-400"
                  )}
                />
                <span className="whitespace-nowrap">{item.name}</span>
              </Link>
            ) : (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Link
                    href={createPageUrl(item.page)}
                    className={cn(
                      "flex items-center justify-center p-3 rounded-lg transition-all duration-150",
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4",
                        isActive ? "text-white" : "text-slate-400"
                      )}
                    />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.name}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Status Legend - only when expanded */}
        {isExpanded && (
          <div className="px-4 py-4 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              Status Legend
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Linked / Approved</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Needs Review</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Exception</span>
              </div>
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <div className="absolute -right-3 top-20 z-50">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6 rounded-full bg-white shadow-md border-slate-200 hover:bg-slate-50"
            onClick={() => onToggle()}
          >
            {collapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
