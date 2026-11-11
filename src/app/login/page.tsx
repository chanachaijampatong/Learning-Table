"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  CalendarDays,
  Lock,
  Mail,
  LogIn,
  AlertCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithEmail, userProfile, role } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg("กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน");
      return;
    }

    setLoading(true);
    const res = await loginWithEmail(email.trim(), password);
    setLoading(false);

    if (res.success) {
      // Smart role redirect
      const savedRole = localStorage.getItem("learning_table_role");
      if (savedRole === "STUDENT") {
        router.push("/timetables");
      } else if (savedRole === "TEACHER") {
        router.push("/official-timetable");
      } else {
        router.push("/");
      }
    } else {
      setErrorMsg(res.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-auto animate-fadeIn">
      {/* Brand Header */}
      <div className="text-center space-y-2.5 mb-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-xl shadow-blue-500/25">
          <CalendarDays className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            เข้าสู่ระบบ Learning-Table
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ระบบจัดตารางการเรียนการสอนอัตโนมัติ (Smart Class Scheduler)
          </p>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="bg-white p-7 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 space-y-5">
        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start space-x-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
            <span className="leading-relaxed font-medium">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleFormLogin} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              อีเมลผู้ใช้งาน (Email)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="teacher@rayongtech.ac.th"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              รหัสผ่าน (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2.5 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 ${
              loading
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 hover:scale-[1.01] active:scale-[0.99]"
            }`}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>กำลังเข้าสู่ระบบ...</span>
              </div>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบ</span>
              </>
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="pt-3 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            ยังไม่มีบัญชีผู้ใช้งานสถานศึกษา?{" "}
            <Link 
              href="/register" 
              className="font-bold text-blue-600 hover:text-blue-800 hover:underline"
            >
              สมัครสมาชิกใหม่
            </Link>
          </p>
        </div>
      </div>

      {/* Security Footer Notice */}
      <div className="text-center mt-6 text-xs text-slate-400 flex items-center justify-center space-x-1.5">
        <ShieldCheck className="w-4 h-4 text-emerald-500" />
        <span>ระบบความปลอดภัยมาตรฐานสถานศึกษา เชื่อมต่อ Google Firebase</span>
      </div>
    </div>
  );
}
