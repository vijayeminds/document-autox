"use client";

import React, { useState } from "react";
import { Search, Bell, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { base44 } from "@/api/base44Client";

export default function TopBar({ user, onSearch }) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search */}
      {/* <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search documents, vendors, or exceptions..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
          />
        </div>
      </div> */}

      {/* Spacer to push content to the right */}
      <div className="flex-1"></div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="sm"
          className="relative text-slate-500 hover:text-slate-700 w-10 h-10 p-0"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <span className="text-sm font-medium hidden sm:inline">
                {user?.full_name || user?.email || "User"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="text-sm">Profile</DropdownMenuItem>
            <DropdownMenuItem className="text-sm">Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-sm text-rose-600"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
