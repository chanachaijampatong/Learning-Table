"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  LogIn
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface TopHeaderProps {
  onToggleSidebar: () => void;
}

export default function TopHeader({ onToggleSidebar }: TopHeaderProps) {
  const pathname = usePathname();
  const { role, userProfile } = useAuth();

  // Determine current page title
  const getPageTitle = () => {
    switch (pathname) {
      case "/":
        return { title: "ภาพรวมระบบ (Dashboard)", subtitle: "สถิติและภาพรวมการจัดตารางเรียน" };
      case "/management":
        return { title: "จัดการข้อมูลหลัก (Master Data)", subtitle: "รายวิชา (ท-ป-น-ช), ครูผู้สอน, ห้องปฏิบัติการ, และแผนการเรียน" };
      case "/scheduler":
        return { title: "AI จัดตารางสอนอัตโนมัติ (Smart Scheduler)", subtitle: "อัลกอริทึม CSP + MRV คำนวณตารางสอนไร้ข้อขัดแย้ง 100%" };
      case "/timetables":
        return { title: "ตารางเรียน 4 มุมมอง (Interactive Timetables)", subtitle: "กลุ่มผู้เรียน, ครูผู้สอน, ห้องเรียน, รายวิชา พร้อมระบบสลับคาบ Real-time" };
      case "/official-timetable":
        return { title: "ตารางสอนทางการ สอศ. (Official A4)", subtitle: "แบบฟอร์มทางการมาตรฐานวิทยาลัยเทคนิคระยอง ขนาด A4 แนวนอน 1 หน้าเป๊ะ" };
      case "/login":
        return { title: "เข้าสู่ระบบ (Login)", subtitle: "เลือกบทบาทเพื่อเข้าใช้งานระบบ" };
      case "/register":
        return { title: "สมัครสมาชิกใหม่ (Register)", subtitle: "สร้างบัญชีผู้ใช้งานใหม่สำหรับสถานศึกษา" };
      default:
        return { title: "Learning-Table", subtitle: "ระบบจัดตารางการเรียนการสอนอัตโนมัติ" };
    }
  };

  const pageInfo = getPageTitle();

  return (
    <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Left: Mobile Hamburger & Page Title */}
      <div className="flex items-center space-x-3.5">
        {/* Mobile Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
          aria-label="เปิดเมนูนำทาง"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Page Title & Breadcrumb */}
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {pageInfo.title}
            </h1>
          </div>
          <p className="hidden sm:block text-xs text-slate-500 mt-0.5 font-normal">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Active Role Pill */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
          {role === "ADMIN" && (
            <>
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>สิทธิ์: <strong className="text-blue-700">งานวิชาการ (Admin)</strong></span>
            </>
          )}
          {role === "TEACHER" && (
            <>
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>สิทธิ์: <strong className="text-emerald-700">ครูผู้สอน</strong></span>
            </>
          )}
          {role === "STUDENT" && (
            <>
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>สิทธิ์: <strong className="text-indigo-700">นักศึกษา</strong></span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
