"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";

interface AppLayoutWrapperProps {
  children: React.ReactNode;
}

export default function AppLayoutWrapper({ children }: AppLayoutWrapperProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // If on authentication pages (login / register), render full screen without Sidebar or TopHeader
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    return (
      <div className="min-h-screen w-full bg-white p-0 m-0">
        <main className="w-full min-h-screen">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Fixed Left Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area (offset by sidebar width on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-72 transition-all duration-300">
        {/* Top Minimalist Header */}
        <TopHeader onToggleSidebar={() => setMobileOpen(!mobileOpen)} />

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
