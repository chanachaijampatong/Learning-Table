"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { useAuth } from "@/context/AuthContext";

interface AppLayoutWrapperProps {
  children: React.ReactNode;
}

export default function AppLayoutWrapper({ children }: AppLayoutWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, role, userProfile, loading: authLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // If on authentication pages (login / register), render full screen without Sidebar or TopHeader
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Global Route Guard: If not on an auth page and not authenticated, redirect to /login
  useEffect(() => {
    if (!isAuthPage && !authLoading) {
      const hasLocalRole = typeof window !== "undefined" && Boolean(localStorage.getItem("learning_table_role"));
      const isAuthenticated = Boolean(currentUser) || hasLocalRole;

      if (!isAuthenticated) {
        router.replace("/login");
        return;
      }

      // Role permission guard: Students cannot access management or scheduler
      const activeRole = userProfile?.role || role;
      if (activeRole === "STUDENT" && (pathname === "/management" || pathname === "/scheduler")) {
        router.replace("/timetables");
      }
    }
  }, [isAuthPage, authLoading, currentUser, role, userProfile, pathname, router]);

  if (isAuthPage) {
    return (
      <div className="min-h-screen w-full bg-white p-0 m-0">
        <main className="w-full min-h-screen">
          {children}
        </main>
      </div>
    );
  }

  // If checking authentication for protected pages, show a smooth loading indicator
  const hasLocalRole = typeof window !== "undefined" && Boolean(localStorage.getItem("learning_table_role"));
  const isAuth = Boolean(currentUser) || hasLocalRole;

  if (authLoading || !isAuth) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-500">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</p>
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
