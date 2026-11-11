"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  CalendarDays, 
  Settings, 
  Sparkles, 
  Table, 
  Printer, 
  UserCheck, 
  Database,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { seedDemoData, isDatabaseSeeded } from "@/lib/firebase/seed";
import { UserRole } from "@/types/database";

export default function Navbar() {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole>("ADMIN");
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [hasData, setHasData] = useState<boolean | null>(null);

  useEffect(() => {
    // Read saved role from localStorage
    const savedRole = localStorage.getItem("learning_table_role") as UserRole;
    if (savedRole) setRole(savedRole);

    // Check if db is seeded
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const seeded = await isDatabaseSeeded();
    setHasData(seeded);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    localStorage.setItem("learning_table_role", newRole);
    window.dispatchEvent(new Event("roleChanged"));
  };

  const handleSeed = async () => {
    if (seeding) return;
    setSeeding(true);
    setSeedMessage("กำลังบันทึกข้อมูลจำลองลง Firestore...");
    const res = await seedDemoData();
    setSeeding(false);
    setSeedMessage(res.message);
    if (res.success) {
      setHasData(true);
      window.dispatchEvent(new Event("dataSeeded"));
    }
    setTimeout(() => setSeedMessage(null), 4000);
  };

  const navItems = [
    { label: "ภาพรวม", href: "/", icon: CalendarDays, roles: ["ADMIN", "TEACHER", "STUDENT"] },
    { label: "จัดการข้อมูล", href: "/management", icon: Settings, roles: ["ADMIN"] },
    { label: "AI จัดตารางสอน", href: "/scheduler", icon: Sparkles, roles: ["ADMIN"] },
    { label: "ตารางเรียน 4 มุมมอง", href: "/timetables", icon: Table, roles: ["ADMIN", "TEACHER", "STUDENT"] },
    { label: "ตารางสอนทางการ สอศ.", href: "/official-timetable", icon: Printer, roles: ["ADMIN", "TEACHER"] },
  ];

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Project Title */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  Learning-Table
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Smart Scheduler
                </span>
              </div>
            </Link>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems
              .filter(item => item.roles.includes(role))
              .map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
          </nav>

          {/* Right Controls: Quick Seed & Role Switcher */}
          <div className="flex items-center space-x-3">
            {/* Quick Demo Data Seed Button */}
            <button
              onClick={handleSeed}
              disabled={seeding}
              title="กดเพื่อบันทึกข้อมูลจำลองมาตรฐาน (วิชา, ครู, ห้อง, ตารางเวลา) ลง Firestore"
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                hasData
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                  : "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 animate-pulse"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{seeding ? "กำลัง Seed..." : hasData ? "มีข้อมูลจำลองแล้ว" : "คลิก 1 ครั้งเพื่อ Seed ข้อมูล"}</span>
            </button>

            {/* Quick Role Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => handleRoleChange("ADMIN")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  role === "ADMIN"
                    ? "bg-white text-blue-700 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                วิชาการ (Admin)
              </button>
              <button
                onClick={() => handleRoleChange("TEACHER")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  role === "TEACHER"
                    ? "bg-white text-emerald-700 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                ครูผู้สอน
              </button>
              <button
                onClick={() => handleRoleChange("STUDENT")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  role === "STUDENT"
                    ? "bg-white text-indigo-700 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                นักศึกษา
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Toast for Seed */}
      {seedMessage && (
        <div className="bg-blue-600 text-white text-xs py-1.5 px-4 text-center flex items-center justify-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>{seedMessage}</span>
        </div>
      )}
    </header>
  );
}

