"use client";

import React, { useState, useEffect, Suspense } from "react";
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
  KeyRound, 
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
import { initialTeachers, initialStudentGroups } from "@/lib/firebase/mockData";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithEmail, registerWithEmail } = useAuth();

  // Mode: "cloud" (Firebase จริง) vs "demo" (โหมดทดลองใช้งาน)
  const [authMode, setAuthMode] = useState<"cloud" | "demo">("cloud");

  // Tab: "login" (เข้าสู่ระบบ) vs "register" (สมัครสมาชิกใหม่)
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Form states - Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Form states - Register
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("TEACHER");
  const [linkedTeacherId, setLinkedTeacherId] = useState(initialTeachers[0].id);
  const [linkedGroupId, setLinkedGroupId] = useState(initialStudentGroups[0].id);
  const [adminKey, setAdminKey] = useState("");

  // Loading & error
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    // If query string has ?tab=register, switch to register tab
    const tabParam = searchParams.get("tab");
    if (tabParam === "register") {
      setActiveTab("register");
    }
  }, [searchParams]);

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMsg("กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน");
      return;
    }

    setLoading(true);
    const res = await loginWithEmail(loginEmail.trim(), loginPassword);
    setLoading(false);

    if (res.success) {
      const savedRole = localStorage.getItem("learning_table_role");
      if (savedRole === "STUDENT") router.push("/timetables");
      else if (savedRole === "TEACHER") router.push("/official-timetable");
      else router.push("/");
    } else {
      setErrorMsg(res.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
    }
  };

  // Handle Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    if (selectedRole === "ADMIN") {
      if (adminKey !== "ADMIN2026" && adminKey !== "admin123") {
        setErrorMsg("รหัส Admin Secret Key ไม่ถูกต้อง (สำหรับการทดสอบใช้: ADMIN2026)");
        return;
      }
    }

    setLoading(true);
    const linkedId = selectedRole === "TEACHER" ? linkedTeacherId : selectedRole === "STUDENT" ? linkedGroupId : undefined;
    const res = await registerWithEmail(regEmail.trim(), regPassword, regName.trim(), selectedRole, linkedId);
    setLoading(false);

    if (res.success) {
      setSuccessMsg("สมัครสมาชิกสำเร็จเรียบร้อย! กำลังนำคุณเข้าสู่ระบบ...");
      setTimeout(() => {
        if (selectedRole === "STUDENT") router.push("/timetables");
        else if (selectedRole === "TEACHER") router.push("/official-timetable");
        else router.push("/");
      }, 1000);
    } else {
      setErrorMsg(res.error || "เกิดข้อผิดพลาดในการลงทะเบียน");
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
        LEFT SIDE: BLUEPRINT BLUE BRANDING PANEL (MATCHING REFERENCE SCREENSHOT)
        ========================================================================
      */}
      <div 
        className="w-full lg:w-[52%] bg-[#0d59b8] text-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden"
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
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center font-black text-blue-700 text-lg shadow-md">
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
          </div>

          {/* Status Pill */}
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-900/60 border border-white/20 text-xs font-medium text-white backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>ระบบพร้อมใช้งาน</span>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="my-auto py-10 relative z-10 max-w-xl space-y-6">
          {/* Engine Tag */}
          <div className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold tracking-wider uppercase text-blue-100">
            NEXT.JS + FIREBASE CLOUD ENGINE
          </div>

          {/* Large Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-white tracking-tight leading-[1.2]">
            จัดตารางการเรียนการสอน<br />
            ครบ จบ ในระบบเดียว
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-blue-100/90 leading-relaxed font-normal">
            ตรวจจับข้อขัดแย้งอัตโนมัติ 100% รองรับครู ห้องเรียน กลุ่มเรียน และส่งออก PDF / Excel ตามแบบฟอร์มทางการ
          </p>

          {/* 4 Feature Pills / Cards */}
          <div className="space-y-3 pt-2">
            {/* Feature 1 */}
            <div className="flex items-start space-x-3.5 p-3 rounded-2xl bg-blue-900/35 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-xl bg-white/10 text-white shrink-0 mt-0.5">
                <Cpu className="w-4 h-4 text-blue-200" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white">
                  จัดตารางอัตโนมัติด้วย AI & GA
                </div>
                <div className="text-[11px] sm:text-xs text-blue-200/80 leading-normal mt-0.5">
                  อัลกอริทึม Heuristic, Genetic Algorithm และ Agent ตรวจซ้ำ
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start space-x-3.5 p-3 rounded-2xl bg-blue-900/35 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-xl bg-white/10 text-white shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white">
                  ไม่ละเมิดเงื่อนไขบังคับ 100%
                </div>
                <div className="text-[11px] sm:text-xs text-blue-200/80 leading-normal mt-0.5">
                  ตรวจการชนของครู ห้อง กลุ่มเรียน และนักเรียนทุกครั้งก่อนบันทึก
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start space-x-3.5 p-3 rounded-2xl bg-blue-900/35 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-xl bg-white/10 text-white shrink-0 mt-0.5">
                <CalendarDays className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white">
                  มุมมองคาบทุกกลุ่มผู้ใช้
                </div>
                <div className="text-[11px] sm:text-xs text-blue-200/80 leading-normal mt-0.5">
                  ตารางครู ห้อง กลุ่มเรียน นักเรียน และรายวิชา สลับดูได้ทันที
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex items-start space-x-3.5 p-3 rounded-2xl bg-blue-900/35 border border-white/10 backdrop-blur-xs">
              <div className="p-2 rounded-xl bg-white/10 text-white shrink-0 mt-0.5">
                <FileSpreadsheet className="w-4 h-4 text-blue-300" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold text-white">
                  ส่งออก PDF & Excel ถูกต้องสมบูรณ์
                </div>
                <div className="text-[11px] sm:text-xs text-blue-200/80 leading-normal mt-0.5">
                  ภาษาไทยครบถ้วน สระไม่ลอย A4 แนวนอน พร้อมพิมพ์
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer Row */}
        <div className="flex items-center justify-between text-xs text-blue-200/80 pt-6 border-t border-white/10 relative z-10">
          <span>วิทยาลัยเทคนิคตัวอย่าง (ข้อมูลจำลอง)</span>
          <span className="hover:text-white transition-colors cursor-pointer">
            เอกสารคู่มือ & สถาปัตยกรรม
          </span>
        </div>
      </div>

      {/* 
        ========================================================================
        RIGHT SIDE: CLEAN AUTH CARD (LOGIN & REGISTER TABS)
        ========================================================================
      */}
      <div className="w-full lg:w-[48%] bg-slate-50/60 p-6 sm:p-10 lg:p-12 flex flex-col justify-center items-center">
        <div className="w-full max-w-md space-y-4">
          {/* Top Auth Mode Toggle Pill (Matching Screenshot) */}
          <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-xs flex">
            <button
              type="button"
              onClick={() => setAuthMode("cloud")}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center ${
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
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-center ${
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
                <span>คลิกเพื่อใส่ข้อมูลบัญชีทดสอบอัตโนมัติ:</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleDemoPrefill("admin")}
                  className="py-1.5 px-2 bg-white hover:bg-blue-600 hover:text-white text-slate-700 font-bold rounded-xl border border-blue-200 shadow-2xs transition-all text-center"
                >
                  วิชาการ (Admin)
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoPrefill("teacher")}
                  className="py-1.5 px-2 bg-white hover:bg-emerald-600 hover:text-white text-slate-700 font-bold rounded-xl border border-emerald-200 shadow-2xs transition-all text-center"
                >
                  ครูผู้สอน
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoPrefill("student")}
                  className="py-1.5 px-2 bg-white hover:bg-indigo-600 hover:text-white text-slate-700 font-bold rounded-xl border border-indigo-200 shadow-2xs transition-all text-center"
                >
                  นักศึกษา
                </button>
              </div>
            </div>
          )}

          {/* Main Auth Container Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/60 overflow-hidden">
            {/* Tab Bar: เข้าสู่ระบบ | สมัครสมาชิกใหม่ */}
            <div className="flex border-b border-slate-200 text-sm font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("login");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-3.5 text-center transition-colors relative ${
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
                className={`flex-1 py-3.5 text-center transition-colors relative ${
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

              {/* TAB 1: LOGIN FORM */}
              {activeTab === "login" && (
                <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fadeIn">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      อีเมล <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder="example@school.ac.th"
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      รหัสผ่าน <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                        placeholder="กรอกรหัสผ่าน"
                        required
                        className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 transition-all placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 transition-colors"
                        aria-label="แสดงรหัสผ่าน"
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Sub links */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span 
                      onClick={() => alert("กรุณาติดต่อผู้ดูแลระบบสถานศึกษาเพื่อรีเซ็ตรหัสผ่าน")}
                      className="text-blue-600 hover:underline cursor-pointer"
                    >
                      ลืมรหัสผ่าน?
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab("register")}
                      className="text-slate-500 hover:text-blue-600"
                    >
                      ยังไม่มีบัญชี? <strong className="text-blue-600 underline">สมัครสมาชิก</strong>
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2.5 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 ${
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

              {/* TAB 2: REGISTER FORM WITH 100% CLICKABLE ROLE SELECTION */}
              {activeTab === "register" && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5 animate-fadeIn">
                  {/* Role Selector - 100% Clickable & Responsive */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      เลือกบทบาทของคุณในสถานศึกษา <span className="text-red-500">*</span>
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      {/* TEACHER */}
                      <button
                        type="button"
                        onClick={() => setSelectedRole("TEACHER")}
                        className={`p-2.5 rounded-xl border cursor-pointer select-none text-center transition-all flex flex-col items-center justify-center space-y-0.5 ${
                          selectedRole === "TEACHER"
                            ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/25 font-bold shadow-xs"
                            : "bg-slate-50/80 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center space-x-1">
                          <span className={`w-2.5 h-2.5 rounded-full border ${selectedRole === "TEACHER" ? "bg-emerald-600 border-emerald-600" : "border-slate-400"}`} />
                          <span className="text-xs font-bold">ครูผู้สอน</span>
                        </div>
                        <span className="text-[10px] text-slate-500">ดูตารางสอน/พิมพ์ A4</span>
                      </button>

                      {/* STUDENT */}
                      <button
                        type="button"
                        onClick={() => setSelectedRole("STUDENT")}
                        className={`p-2.5 rounded-xl border cursor-pointer select-none text-center transition-all flex flex-col items-center justify-center space-y-0.5 ${
                          selectedRole === "STUDENT"
                            ? "bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/25 font-bold shadow-xs"
                            : "bg-slate-50/80 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center space-x-1">
                          <span className={`w-2.5 h-2.5 rounded-full border ${selectedRole === "STUDENT" ? "bg-indigo-600 border-indigo-600" : "border-slate-400"}`} />
                          <span className="text-xs font-bold">นักศึกษา</span>
                        </div>
                        <span className="text-[10px] text-slate-500">ตารางเรียนประจำห้อง</span>
                      </button>

                      {/* ADMIN */}
                      <button
                        type="button"
                        onClick={() => setSelectedRole("ADMIN")}
                        className={`p-2.5 rounded-xl border cursor-pointer select-none text-center transition-all flex flex-col items-center justify-center space-y-0.5 ${
                          selectedRole === "ADMIN"
                            ? "bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/25 font-bold shadow-xs"
                            : "bg-slate-50/80 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center space-x-1">
                          <span className={`w-2.5 h-2.5 rounded-full border ${selectedRole === "ADMIN" ? "bg-blue-600 border-blue-600" : "border-slate-400"}`} />
                          <span className="text-xs font-bold">งานวิชาการ</span>
                        </div>
                        <span className="text-[10px] text-slate-500">สิทธิ์เต็มรัน AI</span>
                      </button>
                    </div>
                  </div>

                  {/* Conditional Role Linking Fields */}
                  {selectedRole === "TEACHER" && (
                    <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                      <label className="block text-[11px] font-bold text-emerald-900">
                        เชื่อมโยงข้อมูลครูผู้สอนในระบบ:
                      </label>
                      <select
                        value={linkedTeacherId}
                        onChange={e => setLinkedTeacherId(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {initialTeachers.map(t => (
                          <option key={t.id} value={t.id}>{t.fullName} ({t.department})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedRole === "STUDENT" && (
                    <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
                      <label className="block text-[11px] font-bold text-indigo-900">
                        เลือกกลุ่มเรียนประจำห้องของคุณ:
                      </label>
                      <select
                        value={linkedGroupId}
                        onChange={e => setLinkedGroupId(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {initialStudentGroups.map(g => (
                          <option key={g.id} value={g.id}>{g.groupCode} - {g.groupName} ({g.studentCount} คน)</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedRole === "ADMIN" && (
                    <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
                      <label className="block text-[11px] font-bold text-blue-900">
                        รหัสความปลอดภัยสำหรับงานวิชาการ (Admin Secret Key):
                      </label>
                      <div className="relative">
                        <KeyRound className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-blue-500" />
                        <input
                          type="password"
                          value={adminKey}
                          onChange={e => setAdminKey(e.target.value)}
                          placeholder="กรอกรหัส ADMIN2026"
                          className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ชื่อ - นามสกุล <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      placeholder="เช่น นายปริญญา ชัยชนะ"
                      required
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      อีเมลสถานศึกษา <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder="user@school.ac.th"
                      required
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  {/* Passwords */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        รหัสผ่าน <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        placeholder="อย่างน้อย 6 ตัว"
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={regConfirmPassword}
                        onChange={e => setRegConfirmPassword(e.target.value)}
                        placeholder="พิมพ์ซ้ำอีกครั้ง"
                        required
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* Submit Register Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2.5 rounded-xl text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 mt-2 ${
                      loading
                        ? "bg-slate-400 cursor-not-allowed"
                        : "bg-[#0b57d0] hover:bg-blue-700 shadow-blue-500/25 active:scale-[0.99]"
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>กำลังสร้างบัญชี...</span>
                      </div>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>สร้างบัญชีผู้ใช้งาน</span>
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
        <span>กำลังโหลดหน้าเข้าสู่ระบบ...</span>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
