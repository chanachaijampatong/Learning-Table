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
  ShieldCheck,
  GraduationCap,
  Menu,
  X,
  Layers,
  ChevronRight,
  Info
} from "lucide-react";
import { seedDemoData, isDatabaseSeeded } from "@/lib/firebase/seed";
import { UserRole } from "@/types/database";

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole>("ADMIN");
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [hasData, setHasData] = useState<boolean | null>(null);

  useEffect(() => {
    const savedRole = localStorage.getItem("learning_table_role") as UserRole;
    if (savedRole) setRole(savedRole);

    checkStatus();

    const handleRoleChanged = () => {
      const r = localStorage.getItem("learning_table_role") as UserRole;
      if (r) setRole(r);
    };
    const handleDataSeeded = () => checkStatus();

    window.addEventListener("roleChanged", handleRoleChanged);
    window.addEventListener("dataSeeded", handleDataSeeded);

    return () => {
      window.removeEventListener("roleChanged", handleRoleChanged);
      window.removeEventListener("dataSeeded", handleDataSeeded);
    };
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
    { 
      label: "ภาพรวมระบบ", 
      desc: "Dashboard สถิติและข้อมูลทั่วไป", 
      href: "/", 
      icon: CalendarDays, 
      roles: ["ADMIN", "TEACHER", "STUDENT"] 
    },
    { 
      label: "จัดการข้อมูลหลัก", 
      desc: "วิชา, ครู, ห้อง, กลุ่มเรียน, แผนการเรียน", 
      href: "/management", 
      icon: Settings, 
      roles: ["ADMIN"] 
    },
    { 
      label: "AI จัดตารางสอน", 
      desc: "รัน CSP Solver จัดตารางไร้ข้อขัดแย้ง", 
      href: "/scheduler", 
      icon: Sparkles, 
      roles: ["ADMIN"] 
    },
    { 
      label: "ตารางเรียน 4 มุมมอง", 
      desc: "กลุ่มเรียน, ครู, ห้อง, วิชา (สลับคาบได้)", 
      href: "/timetables", 
      icon: Table, 
      roles: ["ADMIN", "TEACHER", "STUDENT"] 
    },
    { 
      label: "ตารางสอนทางการ สอศ.", 
      desc: "แบบฟอร์ม A4 แนวนอน พร้อม ท-ป-น-ช", 
      href: "/official-timetable", 
      icon: Printer, 
      roles: ["ADMIN", "TEACHER"] 
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="no-print fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`no-print fixed top-0 bottom-0 left-0 z-50 w-64 sm:w-72 bg-white border-r border-slate-200/90 shadow-lg lg:shadow-none flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Header & Brand */}
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo Section */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <Link 
              href="/" 
              onClick={() => setMobileOpen(false)}
              className="flex items-center space-x-3 group"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <div className="text-lg font-black bg-gradient-to-r from-blue-700 to-indigo-800 bg-clip-text text-transparent tracking-tight">
                  Learning-Table
                </div>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[11px] font-medium text-slate-500">Smart Scheduler v1.0</span>
                </div>
              </div>
            </Link>

            {/* Mobile Close Button */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Semester Badge */}
          <div className="px-5 pt-4 pb-2">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/80 rounded-xl p-2.5 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  ปีการศึกษาปัจจุบัน
                </div>
                <div className="text-xs font-bold text-slate-800">
                  ภาคเรียนที่ 1 / 2569
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-blue-700 border border-blue-200 shadow-sm">
                ใช้งานอยู่
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-3 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              เมนูหลัก (Navigation)
            </div>

            {navItems
              .filter(item => item.roles.includes(role))
              .map(item => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`group flex items-start space-x-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                        : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${
                      isActive ? "text-white" : "text-slate-500 group-hover:text-blue-600"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold leading-tight flex items-center justify-between">
                        <span>{item.label}</span>
                        {isActive && <ChevronRight className="w-4 h-4 text-white/80" />}
                      </div>
                      <div className={`text-[11px] truncate font-normal mt-0.5 leading-snug ${
                        isActive ? "text-blue-100" : "text-slate-400 group-hover:text-slate-500"
                      }`}>
                        {item.desc}
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>

          {/* Quick Database Seed Section */}
          <div className="px-5 py-3 mt-auto">
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  <span>ข้อมูลจำลอง Firestore</span>
                </span>
                <span className={`w-2 h-2 rounded-full ${hasData ? "bg-emerald-500" : "bg-amber-500 animate-ping"}`} />
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed">
                {hasData 
                  ? "มีข้อมูลจำลองมาตรฐาน (วิชา, ครู, ห้อง, คาบ) พร้อมใช้งาน"
                  : "ยังไม่มีข้อมูลเริ่มต้น กดปุ่มด้านล่างเพื่อ Seed ข้อมูล"}
              </p>

              <button
                onClick={handleSeed}
                disabled={seeding}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all shadow-sm ${
                  hasData
                    ? "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                    : "bg-amber-500 hover:bg-amber-600 text-white animate-pulse"
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>{seeding ? "กำลังบันทึกข้อมูล..." : hasData ? "บันทึกข้อมูลจำลองซ้ำ" : "คลิกเพื่อ Seed ข้อมูล"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom User Role Switcher Card */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/70">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span>บทบาทการใช้งาน (Role)</span>
            <span className="text-[9px] font-semibold text-blue-600">Quick Switch</span>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
            <button
              onClick={() => handleRoleChange("ADMIN")}
              title="สิทธิ์เต็ม: จัดการข้อมูลและรัน AI จัดตาราง"
              className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center flex flex-col items-center justify-center ${
                role === "ADMIN"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 mb-0.5" />
              <span>วิชาการ</span>
            </button>

            <button
              onClick={() => handleRoleChange("TEACHER")}
              title="สิทธิ์ครู: ดูตารางสอนตนเอง และพิมพ์แบบ A4"
              className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center flex flex-col items-center justify-center ${
                role === "TEACHER"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 mb-0.5" />
              <span>ครูผู้สอน</span>
            </button>

            <button
              onClick={() => handleRoleChange("STUDENT")}
              title="สิทธิ์นักศึกษา: ดูตารางเรียนประจำห้อง"
              className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center flex flex-col items-center justify-center ${
                role === "STUDENT"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 mb-0.5" />
              <span>นักศึกษา</span>
            </button>
          </div>
        </div>

        {/* Seed Notification Toast */}
        {seedMessage && (
          <div className="absolute top-4 left-4 right-4 z-50 bg-slate-900 text-white text-xs py-2 px-3 rounded-xl shadow-xl flex items-center space-x-2 animate-fadeIn border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{seedMessage}</span>
          </div>
        )}
      </aside>
    </>
  );
}

