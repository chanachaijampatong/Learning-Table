"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Sparkles, 
  ShieldCheck, 
  CalendarDays, 
  FileSpreadsheet, 
  Lock, 
  Mail, 
  User, 
  UserCheck,
  GraduationCap,
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  LogIn, 
  UserPlus,
  Cpu
} from "lucide-react";
import { useAuth, DEMO_ACCOUNTS } from "@/context/AuthContext";
import { UserRole } from "@/types/database";

interface AuthViewProps {
  initialTab?: "login" | "register";
}

export default function AuthView({ initialTab = "login" }: AuthViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    currentUser, 
    userProfile, 
    role, 
    loading: authLoading, 
    loginWithEmail, 
    registerWithEmail, 
    quickDemoLogin 
  } = useAuth();

  // Mode: "cloud" (Firebase จริง) vs "demo" (โหมดทดลองใช้งาน)
  const [authMode, setAuthMode] = useState<"cloud" | "demo">("cloud");

  // Tab: "login" (เข้าสู่ระบบ) vs "register" (สมัครสมาชิกใหม่)
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab);

  // Form states - Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Form states - Register (Cleaned: Only 4 essential fields)
  const [selectedRole, setSelectedRole] = useState<UserRole>("TEACHER");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Loading & notification states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync tab with URL search parameter ?tab=register / ?tab=login
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "register") {
      setActiveTab("register");
    } else if (tabParam === "login") {
      setActiveTab("login");
    }
  }, [searchParams]);

  // Session Guard: If already logged in, redirect to system
  useEffect(() => {
    if (!authLoading && currentUser) {
      const targetRole = userProfile?.role || role;
      if (targetRole === "STUDENT") {
        router.push("/timetables");
      } else if (targetRole === "TEACHER") {
        router.push("/official-timetable");
      } else {
        router.push("/");
      }
    }
  }, [authLoading, currentUser, userProfile, role, router]);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const emailTrimmed = loginEmail.trim();
    if (!emailTrimmed || !loginPassword) {
      setErrorMsg("กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน");
      return;
    }

    setLoading(true);

    // If Demo Mode or matching demo accounts, perform seamless login
    if (authMode === "demo") {
      const matched = Object.entries(DEMO_ACCOUNTS).find(
        ([_, acc]) => acc.email.toLowerCase() === emailTrimmed.toLowerCase()
      );
      if (matched) {
        await quickDemoLogin(matched[0] as any);
        setLoading(false);
        setSuccessMsg("เข้าสู่ระบบโหมดทดลองใช้งานสำเร็จ! กำลังนำทาง...");
        const targetRole = matched[1].role;
        setTimeout(() => {
          if (targetRole === "STUDENT") router.push("/timetables");
          else if (targetRole === "TEACHER") router.push("/official-timetable");
          else router.push("/");
        }, 500);
        return;
      }
    }

    // Attempt Firebase Authentication
    const res = await loginWithEmail(emailTrimmed, loginPassword);
    setLoading(false);

    if (res.success) {
      setSuccessMsg("เข้าสู่ระบบสำเร็จ! กำลังนำทางเข้าสู่ระบบ...");
      const savedRole = localStorage.getItem("learning_table_role");
      setTimeout(() => {
        if (savedRole === "STUDENT") router.push("/timetables");
        else if (savedRole === "TEACHER") router.push("/official-timetable");
        else router.push("/");
      }, 500);
    } else {
      // Offline / demo fallback check
      const matched = Object.entries(DEMO_ACCOUNTS).find(
        ([_, acc]) => acc.email.toLowerCase() === emailTrimmed.toLowerCase() && acc.password === loginPassword
      );
      if (matched) {
        await quickDemoLogin(matched[0] as any);
        setSuccessMsg("เข้าสู่ระบบสำเร็จ! กำลังนำทาง...");
        const targetRole = matched[1].role;
        setTimeout(() => {
          if (targetRole === "STUDENT") router.push("/timetables");
          else if (targetRole === "TEACHER") router.push("/official-timetable");
          else router.push("/");
        }, 500);
        return;
      }
      setErrorMsg(res.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
    }
  };

  // Handle Register (Streamlined 4-field submit)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const nameTrimmed = regName.trim();
    const emailTrimmed = regEmail.trim();

    if (!nameTrimmed || !emailTrimmed || !regPassword) {
      setErrorMsg("กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง");
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);
    const linkedId = selectedRole === "TEACHER" ? "TCH_PARINYA" : selectedRole === "STUDENT" ? "GRP_IT_1_2" : undefined;
    const res = await registerWithEmail(emailTrimmed, regPassword, nameTrimmed, selectedRole, linkedId);
    setLoading(false);

    if (res.success) {
      setSuccessMsg("สร้างบัญชีสำเร็จเรียบร้อย! กำลังนำคุณเข้าสู่ระบบ...");
      setTimeout(() => {
        if (selectedRole === "STUDENT") router.push("/timetables");
        else if (selectedRole === "TEACHER") router.push("/official-timetable");
        else router.push("/");
      }, 700);
    } else {
      // If Firebase blocked by network or sandbox, fallback gracefully
      if (res.error?.includes("network") || res.error?.includes("internal") || res.error?.includes("api-key")) {
        localStorage.setItem("learning_table_role", selectedRole);
        setSuccessMsg("ลงทะเบียนโหมดทดลองใช้งานสำเร็จ! กำลังนำคุณเข้าสู่ระบบ...");
        setTimeout(() => {
          if (selectedRole === "STUDENT") router.push("/timetables");
          else if (selectedRole === "TEACHER") router.push("/official-timetable");
          else router.push("/");
        }, 700);
      } else {
        setErrorMsg(res.error || "เกิดข้อผิดพลาดในการสร้างบัญชี");
      }
    }
  };

  // Quick Demo Login helper
  const handleDemoPrefill = (roleKey: "admin" | "teacher" | "student") => {
    const acc = DEMO_ACCOUNTS[roleKey];
    setLoginEmail(acc.email);
    setLoginPassword(acc.password);
  };

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row font-sans">
      {/* 
        ========================================================================
        LEFT SIDE: BLUEPRINT BLUE BRANDING PANEL
        ========================================================================
      */}
      <div 
        className="w-full lg:w-[50%] bg-[#0d59b8] text-white p-6 sm:p-10 lg:p-12 flex flex-col justify-between relative overflow-hidden shrink-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "36px 36px",
        }}
      >
        {/* Top Header Row */}
        <div className="flex items-center justify-between relative z-10">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center font-black text-blue-700 text-lg shadow-md group-hover:scale-105 transition-transform">
              LT
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight text-white leading-tight">
                Learning Table
              </div>
              <div className="text-xs text-blue-200 font-medium">
                ระบบจัดตารางการเรียนการสอน
              </div>
            </div>
          </Link>

          {/* Status Pill */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-900/60 border border-white/20 text-xs font-medium text-white backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>ระบบพร้อมใช้งาน</span>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="my-auto py-8 relative z-10 max-w-xl space-y-5">
          {/* Engine Tag */}
          <div className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold tracking-wider uppercase text-blue-100">
            NEXT.JS + FIREBASE CLOUD ENGINE
          </div>

          {/* Large Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-white tracking-tight leading-[1.2]">
            จัดตารางการเรียนการสอน<br />
            ครบ จบ ในระบบเดียว
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed font-normal">
            ตรวจจับข้อขัดแย้งอัตโนมัติ 100% รองรับครู ห้องเรียน กลุ่มเรียน และส่งออก PDF / Excel ตามแบบฟอร์มทางการ สอศ.
          </p>

          {/* 4 Feature Cards */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-blue-900/35 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-xl bg-white/10 text-white shrink-0 mt-0.5">
                <Cpu className="w-4 h-4 text-blue-200" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white">
                  จัดตารางอัตโนมัติด้วย AI & CSP Solver
                </div>
                <div className="text-[11px] sm:text-xs text-blue-200/80 leading-normal mt-0.5">
                  อัลกอริทึม Heuristic MRV Backtracking คำนวณตารางไร้ข้อขัดแย้ง 100%
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-blue-900/35 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-xl bg-white/10 text-white shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white">
                  ไม่ละเมิดเงื่อนไขบังคับ 100% (Zero-Conflict)
                </div>
                <div className="text-[11px] sm:text-xs text-blue-200/80 leading-normal mt-0.5">
                  ตรวจการชนของครู ห้อง กลุ่มเรียน และนักเรียนทุกครั้งก่อนบันทึก
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-blue-900/35 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-xl bg-white/10 text-white shrink-0 mt-0.5">
                <CalendarDays className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white">
                  มุมมองคาบทุกกลุ่มผู้ใช้ 4 มิติ
                </div>
                <div className="text-[11px] sm:text-xs text-blue-200/80 leading-normal mt-0.5">
                  ตารางครู ห้อง กลุ่มเรียน นักเรียน และรายวิชา สลับดูและสลับคาบได้ทันที
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-blue-900/35 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-xl bg-white/10 text-white shrink-0 mt-0.5">
                <FileSpreadsheet className="w-4 h-4 text-blue-300" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white">
                  พิมพ์แบบฟอร์มทางการ สอศ. A4 แนวนอน
                </div>
                <div className="text-[11px] sm:text-xs text-blue-200/80 leading-normal mt-0.5">
                  ตาราง ท-ป-น-ช พร้อมช่องลงนาม 4 ฝ่าย พอดีหน้ากระดาษ 1 หน้า 100%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer Row */}
        <div className="flex items-center justify-between text-xs text-blue-200/80 pt-4 border-t border-white/10 relative z-10">
          <span>วิทยาลัยเทคนิคระยอง / อาชีวศึกษา</span>
          <span className="hover:text-white transition-colors cursor-pointer">
            Learning-Table v1.0
          </span>
        </div>
      </div>

      {/* 
        ========================================================================
        RIGHT SIDE: CLEAN AUTH CARD (LOGIN & REGISTER TABS)
        ========================================================================
      */}
      <div className="w-full lg:w-[50%] bg-slate-50/70 p-6 sm:p-10 lg:p-12 flex flex-col justify-center items-center overflow-y-auto">
        <div className="w-full max-w-md space-y-4 my-auto">
          {/* Top Auth Mode Toggle Pill */}
          <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-xs flex">
            <button
              type="button"
              onClick={() => setAuthMode("cloud")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                authMode === "cloud"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              โหมด Firebase จริง (Cloud Auth)
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("demo")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                authMode === "demo"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              โหมดทดลองใช้งาน (Demo)
            </button>
          </div>

          {/* Quick Demo Accounts Selection (Shown only when in demo mode) */}
          {authMode === "demo" && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 space-y-2 animate-fadeIn">
              <div className="text-xs font-bold text-blue-900 flex items-center justify-between">
                <span>คลิกบัญชีทดลองเพื่อใส่ข้อมูลอัตโนมัติ:</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleDemoPrefill("admin")}
                  className="py-1.5 px-2 bg-white hover:bg-blue-600 hover:text-white text-slate-700 font-bold rounded-xl border border-blue-200 shadow-2xs transition-all text-center cursor-pointer"
                >
                  วิชาการ (Admin)
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoPrefill("teacher")}
                  className="py-1.5 px-2 bg-white hover:bg-emerald-600 hover:text-white text-slate-700 font-bold rounded-xl border border-emerald-200 shadow-2xs transition-all text-center cursor-pointer"
                >
                  ครูผู้สอน
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoPrefill("student")}
                  className="py-1.5 px-2 bg-white hover:bg-indigo-600 hover:text-white text-slate-700 font-bold rounded-xl border border-indigo-200 shadow-2xs transition-all text-center cursor-pointer"
                >
                  นักศึกษา
                </button>
              </div>
            </div>
          )}

          {/* Main Auth Container Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            {/* Tab Bar: เข้าสู่ระบบ | สมัครสมาชิกใหม่ */}
            <div className="flex border-b border-slate-200 text-sm font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-3.5 text-center transition-colors relative cursor-pointer ${
                  activeTab === "login"
                    ? "text-blue-700 font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>เข้าสู่ระบบ</span>
                {activeTab === "login" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("register");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-3.5 text-center transition-colors relative cursor-pointer ${
                  activeTab === "register"
                    ? "text-blue-700 font-extrabold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>สมัครสมาชิกใหม่</span>
                {activeTab === "register" && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            </div>

            {/* Form Container */}
            <div className="p-6 sm:p-7 space-y-4">
              {/* Alert Messages */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <span className="font-medium leading-relaxed">{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start space-x-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span className="font-medium leading-relaxed">{successMsg}</span>
                </div>
              )}

              {/* ======================================================= */}
              {/* TAB 1: LOGIN FORM                                       */}
              {/* ======================================================= */}
              {activeTab === "login" && (
                <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fadeIn">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      อีเมล <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                        placeholder="example@school.ac.th"
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      รหัสผ่าน <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="กรอกรหัสผ่าน"
                        required
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 transition-all placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 transition-colors cursor-pointer"
                        aria-label="แสดงรหัสผ่าน"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Sub links */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span 
                      onClick={() => alert("กรุณาติดต่อผู้ดูแลระบบฝ่ายวิชาการเพื่อรีเซ็ตรหัสผ่าน")}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      ลืมรหัสผ่าน?
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("register")}
                      className="text-slate-500 hover:text-blue-600 cursor-pointer"
                    >
                      ยังไม่มีบัญชี? <strong className="text-blue-600 underline">สมัครสมาชิก</strong>
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2.5 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                      loading
                        ? "bg-slate-400 cursor-not-allowed"
                        : "bg-[#0b57d0] hover:bg-blue-700 shadow-blue-500/25 active:scale-[0.99]"
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
              )}

              {/* ======================================================= */}
              {/* TAB 2: REGISTER FORM - 100% CLICKABLE & ZERO EXCESS     */}
              {/* ======================================================= */}
              {activeTab === "register" && (
                <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fadeIn">
                  {/* 1. Large Clickable Role Selector (3 Roles) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      เลือกบทบาทของคุณในสถานศึกษา <span className="text-red-500">*</span>
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      {/* ครูผู้สอน (TEACHER) */}
                      <button
                        type="button"
                        onClick={() => setSelectedRole("TEACHER")}
                        className={`relative p-2.5 sm:p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                          selectedRole === "TEACHER"
                            ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm ring-2 ring-emerald-500/20"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 transition-colors ${
                          selectedRole === "TEACHER" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                        }`}>
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-extrabold leading-tight">ครูผู้สอน</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">ดูตาราง/พิมพ์ A4</span>
                        {selectedRole === "TEACHER" && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                      </button>

                      {/* นักศึกษา (STUDENT) */}
                      <button
                        type="button"
                        onClick={() => setSelectedRole("STUDENT")}
                        className={`relative p-2.5 sm:p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                          selectedRole === "STUDENT"
                            ? "border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm ring-2 ring-indigo-500/20"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 transition-colors ${
                          selectedRole === "STUDENT" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                        }`}>
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-extrabold leading-tight">นักศึกษา</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">ตารางเรียนห้อง</span>
                        {selectedRole === "STUDENT" && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500" />
                        )}
                      </button>

                      {/* งานวิชาการ (ADMIN) */}
                      <button
                        type="button"
                        onClick={() => setSelectedRole("ADMIN")}
                        className={`relative p-2.5 sm:p-3 rounded-2xl border-2 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                          selectedRole === "ADMIN"
                            ? "border-blue-600 bg-blue-50 text-blue-900 shadow-sm ring-2 ring-blue-500/20"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 transition-colors ${
                          selectedRole === "ADMIN" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                        }`}>
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-extrabold leading-tight">งานวิชาการ</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">สิทธิ์เต็ม/รัน AI</span>
                        {selectedRole === "ADMIN" && (
                          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 2. Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อ - นามสกุล <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={regName}
                        onChange={e => setRegName(e.target.value)}
                        placeholder={
                          selectedRole === "TEACHER"
                            ? "เช่น อ.สมชาย ใจดี"
                            : selectedRole === "STUDENT"
                            ? "เช่น นายสมศักดิ์ สุขใจ"
                            : "เช่น เจ้าหน้าที่งานวิชาการ"
                        }
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  {/* 3. Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      อีเมลสถานศึกษา <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                        placeholder="example@school.ac.th"
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  {/* 4. Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      รหัสผ่าน <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type={showRegPassword ? "text" : "password"}
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        placeholder="อย่างน้อย 6 ตัวอักษร"
                        required
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 transition-colors cursor-pointer"
                        aria-label="แสดงรหัสผ่าน"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Register Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2.5 sm:py-3 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 mt-2 cursor-pointer ${
                      loading
                        ? "bg-slate-400 cursor-not-allowed"
                        : "bg-[#0b57d0] hover:bg-blue-700 shadow-blue-500/25 active:scale-[0.99]"
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>กำลังสร้างบัญชีผู้ใช้งาน...</span>
                      </div>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>สร้างบัญชีและเข้าสู่ระบบทันที</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
