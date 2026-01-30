"use client";

import React, { useState } from "react";
import "./globals.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/navigation/Sidebar";
import TopBar from "@/components/navigation/TopBar";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Toaster } from "sonner";

const queryClient = new QueryClient();

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  // Get current page name from pathname
  const getCurrentPage = () => {
    const path = pathname.slice(1); // Remove leading /
    if (!path || path === "") return "Analytics";
    // Convert pathname to match the format in navItems (e.g., "/document-processing" -> "Document-Processing")
    return path
      .split("/")[0]
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("-");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        currentPage={getCurrentPage()}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div
        className="min-h-screen transition-all duration-200"
        style={{ paddingLeft: sidebarCollapsed ? "64px" : "256px" }}
      >
        <TopBar user={user} onSearch={setSearchQuery} />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <LayoutContent>{children}</LayoutContent>
          <Toaster position="top-right" richColors />
        </QueryClientProvider>
      </body>
    </html>
  );
}
