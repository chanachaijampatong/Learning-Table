"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  UserCheck, 
  GraduationCap, 
  LogIn, 
  Sparkles,
  CalendarDays,
  Lock,
  Mail,
  ArrowRight
} from "lucide-react";
import { UserRole } from "@/types/database";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleQuickLogin = (role: UserRole) => {
    localStorage.setItem("learning_table_role", role);
    window.dispatchEvent(new Event("roleChanged"));
    if (role === "STUDENT") {
      router.push("/timetables");
    } else if (role === "TEACHER") {
      router.push("/official-timetable");
    } else {
      router.push("/");
    }
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Standard mock auth redirect
    setTimeout(() => {
      localStorage.setItem("learning_table_role", "ADMIN");
      window.dispatchEvent(new Event("roleChanged"));
      router.push("/");
    }, 400);
  };

  return (
    <div className="max-w-md mx-auto my-12 space-y-8 animate-fadeIn">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
          <CalendarDays className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          เข้าสู่ระบบ Learning-Table
        </h1>
        <p className="text-xs text-slate-500">
          ระบบจัดตารางการเรียนการสอนอัตโนมัติ (Zero-Conflict Scheduler)
        </p>
      </div>

      {/* 1-Click Quick Test Login (Recommended) */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-3xl border border-blue-200/80 shadow-md space-y-4">
        <div className="flex items-center space-x-2 text-blue-900">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold">Quick Test Login 3 บทบาท (1 คลิกเพื่อทดสอบ)</h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          อำนวยความสะดวกในการทดสอบระบบ สามารถสลับสิทธิ์การใช้งานได้ทันทีโดยไม่ต้องจำรหัสผ่าน:
        </p>

        <div className="space-y-2.5">
          <button
            onClick={() => handleQuickLogin("ADMIN")}
            className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-blue-600 text-slate-800 hover:text-white rounded-2xl border border-slate-200 hover:border-blue-600 shadow-xs hover:shadow-md transition-all group"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-blue-100 group-hover:bg-white/20 text-blue-700 group-hover:text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold">งานวิชาการ (Admin)</div>
                <div className="text-[10px] text-slate-500 group-hover:text-blue-100">
                  สิทธิ์เต็ม: จัดการข้อมูล, สั่งรัน AI, สลับคาบเรียน
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => handleQuickLogin("TEACHER")}
            className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-emerald-600 text-slate-800 hover:text-white rounded-2xl border border-slate-200 hover:border-emerald-600 shadow-xs hover:shadow-md transition-all group"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 group-hover:bg-white/20 text-emerald-700 group-hover:text-white flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold">ครูผู้สอน (Teacher - อ.ปริญญา)</div>
                <div className="text-[10px] text-slate-500 group-hover:text-emerald-100">
                  ดูตารางสอนของตนเอง, พิมพ์ตารางราชการ A4 แนวนอน
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => handleQuickLogin("STUDENT")}
            className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-indigo-600 text-slate-800 hover:text-white rounded-2xl border border-slate-200 hover:border-indigo-600 shadow-xs hover:shadow-md transition-all group"
          >
            <div className="flex items-center space-x-3 text-left">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 group-hover:bg-white/20 text-indigo-700 group-hover:text-white flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold">นักศึกษา (Student - สปT.1/2)</div>
                <div className="text-[10px] text-slate-500 group-hover:text-indigo-100">
                  ดูตารางเรียนประจำห้องตนเอง (ซ่อนเมนูจัดการของแอดมิน)
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Standard Form Login */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          หรือเข้าสู่ระบบด้วยอีเมลสถานศึกษา
        </h3>
        <form onSubmit={handleEmailLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">อีเมลผู้ใช้งาน</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="teacher@rayongtech.ac.th"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-xl shadow-md transition-all"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}

