"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login?tab=register");
  }, [router]);

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex items-center space-x-2 text-slate-500 text-sm">
        <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span>กำลังเปิดหน้าสมัครสมาชิกใหม่...</span>
      </div>
    </div>
  );
}
