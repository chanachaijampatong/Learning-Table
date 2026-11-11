"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, 
  UserCheck, 
  GraduationCap, 
  UserPlus, 
  CalendarDays,
  Lock,
  Mail,
  User,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/database";
import { initialTeachers, initialStudentGroups } from "@/lib/firebase/mockData";

export default function RegisterPage() {
  const router = useRouter();
  const { registerWithEmail } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("TEACHER");
  
  // Specific role bindings
  const [linkedTeacherId, setLinkedTeacherId] = useState(initialTeachers[0].id);
  const [linkedGroupId, setLinkedGroupId] = useState(initialStudentGroups[0].id);
  const [adminSecurityKey, setAdminSecurityKey] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!displayName || !email || !password) {
      setErrorMsg("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    // Admin security validation
    if (selectedRole === "ADMIN") {
      if (adminSecurityKey !== "ADMIN2026" && adminSecurityKey !== "admin123") {
        setErrorMsg("รหัสความปลอดภัยสำหรับสิทธิ์ผู้ดูแลระบบ (Admin Key) ไม่ถูกต้อง (ทดสอบใช้: ADMIN2026)");
        return;
      }
    }

    setLoading(true);
    const linkedId = selectedRole === "TEACHER" ? linkedTeacherId : selectedRole === "STUDENT" ? linkedGroupId : undefined;
    const res = await registerWithEmail(email, password, displayName, selectedRole, linkedId);
    setLoading(false);

    if (res.success) {
      if (selectedRole === "STUDENT") {
        router.push("/timetables");
      } else if (selectedRole === "TEACHER") {
        router.push("/official-timetable");
      } else {
        router.push("/");
      }
    } else {
      setErrorMsg(res.error || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto my-auto animate-fadeIn">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
          <CalendarDays className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          ลงทะเบียนผู้ใช้งานใหม่
        </h1>
        <p className="text-xs text-slate-500">
          สมัครบัญชีสำหรับเข้าใช้งานระบบจัดตารางการเรียนการสอน Learning-Table
        </p>
      </div>

      {/* Main Registration Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* 1. Role Selection Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              เลือกบทบาทการใช้งาน (Role)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole("TEACHER")}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                  selectedRole === "TEACHER"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/30"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold">ครูผู้สอน</span>
                <span className="text-[10px] text-slate-500">ดูตารางสอน/พิมพ์ A4</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole("STUDENT")}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                  selectedRole === "STUDENT"
                    ? "bg-indigo-50 border-indigo-500 text-indigo-800 ring-2 ring-indigo-500/30"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-bold">นักศึกษา</span>
                <span className="text-[10px] text-slate-500">ดูตารางเรียนประจำห้อง</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole("ADMIN")}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1 ${
                  selectedRole === "ADMIN"
                    ? "bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/30"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-bold">งานวิชาการ</span>
                <span className="text-[10px] text-slate-500">สิทธิ์เต็มรัน AI</span>
              </button>
            </div>
          </div>

          {/* Conditional Role Fields */}
          {selectedRole === "TEACHER" && (
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
              <label className="block text-xs font-bold text-emerald-900 mb-1">
                เชื่อมโยงข้อมูลครูผู้สอนในระบบ
              </label>
              <select
                value={linkedTeacherId}
                onChange={e => setLinkedTeacherId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {initialTeachers.map(t => (
                  <option key={t.id} value={t.id}>{t.fullName} ({t.department})</option>
                ))}
              </select>
            </div>
          )}

          {selectedRole === "STUDENT" && (
            <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 rounded-2xl">
              <label className="block text-xs font-bold text-indigo-900 mb-1">
                เชื่อมโยงกลุ่มเรียนประจำห้อง
              </label>
              <select
                value={linkedGroupId}
                onChange={e => setLinkedGroupId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {initialStudentGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.groupCode} - {g.groupName}</option>
                ))}
              </select>
            </div>
          )}

          {selectedRole === "ADMIN" && (
            <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-1">
              <label className="block text-xs font-bold text-blue-900 mb-1">
                รหัสความปลอดภัยฝ่ายวิชาการ (Admin Secret Key)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-blue-500" />
                <input
                  type="password"
                  value={adminSecurityKey}
                  onChange={e => setAdminSecurityKey(e.target.value)}
                  placeholder="กรอกรหัส ADMIN2026 สำหรับทดสอบ"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-[10px] text-blue-600 italic">
                * สำหรับการทดสอบ กรอก: <strong>ADMIN2026</strong>
              </p>
            </div>
          )}

          {/* 2. Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อ - นามสกุล</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="เช่น นายปริญญา ชัยชนะ"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          {/* 3. Email */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">อีเมลผู้ใช้งาน</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="user@learningtable.ac.th"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          {/* 4. Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">รหัสผ่าน</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="อย่างน้อย 6 ตัวอักษร"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ยืนยันรหัสผ่าน</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="พิมพ์ซ้ำอีกครั้ง"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? (
              <span>กำลังสร้างบัญชี...</span>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>สมัครสมาชิกและเริ่มใช้งาน</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="font-bold text-blue-600 hover:underline">
            เข้าสู่ระบบที่นี่
          </Link>
        </div>
      </div>
    </div>
  );
}

