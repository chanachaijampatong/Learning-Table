"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound
} from "lucide-react";
import { useAuth, DEMO_ACCOUNTS } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail, quickDemoLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleQuickLogin = async (key: "admin" | "teacher" | "student") => {
    await quickDemoLogin(key);
    if (key === "student") {
      router.push("/timetables");
    } else if (key === "teacher") {
      router.push("/official-timetable");
    } else {
      router.push("/");
    }
  };

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email || !password) {
      setErrorMsg("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    setLoading(true);
    const res = await loginWithEmail(email, password);
    setLoading(false);

    if (res.success) {
      router.push("/");
    } else {
      setErrorMsg(res.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  return (
    <div className="max-w-xl mx-auto my-6 space-y-6 animate-fadeIn">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
          <CalendarDays className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          เข้าสู่ระบบ Learning-Table
        </h1>
        <p className="text-xs text-slate-500">
          ระบบจัดตารางการเรียนการสอนอัตโนมัติ (Zero-Conflict Scheduler)
        </p>
      </div>

      {/* 1-Click Quick Demo Test Accounts Box */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-3xl border border-blue-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-blue-900">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold">บัญชีทดสอบระบบ 3 สิทธิ์ (คลิก 1 ครั้งเพื่อล็อกอินทันที)</h2>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
            ไม่ต้องพิมพ์
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          กดปุ่มด้านล่างเพื่อทดสอบระบบตามระดับสิทธิ์ที่แตกต่างกันได้ทันที:
        </p>

        {/* 3 Predefined Test Accounts */}
        <div className="space-y-3">
          {/* 1. ADMIN */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900">{DEMO_ACCOUNTS.admin.displayName}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 font-bold text-blue-700 border border-blue-200">
                    ADMIN
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  อีเมล: <strong className="text-slate-700">{DEMO_ACCOUNTS.admin.email}</strong> • รหัส: <span className="text-slate-700">{DEMO_ACCOUNTS.admin.password}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{DEMO_ACCOUNTS.admin.description}</div>
              </div>
            </div>
            <button
              onClick={() => handleQuickLogin("admin")}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all whitespace-nowrap self-end sm:self-center"
            >
              ทดลองสิทธิ์นี้
            </button>
          </div>

          {/* 2. TEACHER */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900">{DEMO_ACCOUNTS.teacher.displayName}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 font-bold text-emerald-700 border border-emerald-200">
                    TEACHER
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  อีเมล: <strong className="text-slate-700">{DEMO_ACCOUNTS.teacher.email}</strong> • รหัส: <span className="text-slate-700">{DEMO_ACCOUNTS.teacher.password}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{DEMO_ACCOUNTS.teacher.description}</div>
              </div>
            </div>
            <button
              onClick={() => handleQuickLogin("teacher")}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all whitespace-nowrap self-end sm:self-center"
            >
              ทดลองสิทธิ์นี้
            </button>
          </div>

          {/* 3. STUDENT */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900">{DEMO_ACCOUNTS.student.displayName}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-50 font-bold text-indigo-700 border border-indigo-200">
                    STUDENT
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  อีเมล: <strong className="text-slate-700">{DEMO_ACCOUNTS.student.email}</strong> • รหัส: <span className="text-slate-700">{DEMO_ACCOUNTS.student.password}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{DEMO_ACCOUNTS.student.description}</div>
              </div>
            </div>
            <button
              onClick={() => handleQuickLogin("student")}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all whitespace-nowrap self-end sm:self-center"
            >
              ทดลองสิทธิ์นี้
            </button>
          </div>
        </div>
      </div>

      {/* Standard Form Login */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            หรือเข้าสู่ระบบด้วยบัญชีของคุณ
          </h3>
          <Link href="/register" className="text-xs font-bold text-blue-600 hover:underline">
            สมัครสมาชิกใหม่ &rarr;
          </Link>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleFormLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">อีเมลผู้ใช้งาน</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@learningtable.ac.th"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
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
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span>กำลังตรวจสอบข้อมูล...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบ</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
