import Link from "next/link";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4 text-amber-600 shadow-sm">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-2">404 - ไม่พบหน้าที่ต้องการ</h1>
      <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
        หน้าที่คุณกำลังเข้าชมอาจถูกลบ ย้าย หรือไม่มีอยู่ในระบบจัดตารางสอน กรุณาตรวจสอบ URL อีกครั้ง
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Home className="w-4 h-4" />
          <span>กลับสู่หน้าหลัก</span>
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold shadow-sm transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ไปหน้าเข้าสู่ระบบ</span>
        </Link>
      </div>
    </div>
  );
}

