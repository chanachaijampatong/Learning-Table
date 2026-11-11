"use client";

import React, { Suspense } from "react";
import AuthView from "@/components/AuthView";

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
        <span>กำลังโหลดหน้าสมัครสมาชิก...</span>
      </div>
    }>
      <AuthView initialTab="register" />
    </Suspense>
  );
}
