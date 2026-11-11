import type { Metadata } from "next";
import "./globals.css";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Learning-Table | ระบบจัดตารางการเรียนการสอนอัตโนมัติ",
  description: "ระบบจัดตารางการเรียนการสอนอัจฉริยะ (Zero-Conflict Scheduler) มาตรฐาน สอศ. และสถานศึกษา",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        <AuthProvider>
          <AppLayoutWrapper>
            {children}
          </AppLayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
