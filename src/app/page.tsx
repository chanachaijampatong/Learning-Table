"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  collection, 
  getDocs, 
  query, 
  where 
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { 
  CalendarDays, 
  Users, 
  BookOpen, 
  Building2, 
  Sparkles, 
  Table, 
  Printer, 
  ArrowRight,
  CheckCircle,
  Database,
  Layers,
  GraduationCap
} from "lucide-react";
import { 
  initialSubjects, 
  initialTeachers, 
  initialClassrooms, 
  initialStudentGroups,
  initialCourseEnrollments 
} from "@/lib/firebase/mockData";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    terms: 1,
    subjects: 0,
    teachers: 0,
    classrooms: 0,
    groups: 0,
    enrollments: 0,
    schedules: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [subSnap, tchSnap, roomSnap, grpSnap, enrSnap, schSnap] = await Promise.all([
        getDocs(collection(db, "subjects")),
        getDocs(collection(db, "teachers")),
        getDocs(collection(db, "classrooms")),
        getDocs(collection(db, "student_groups")),
        getDocs(collection(db, "course_enrollments")),
        getDocs(collection(db, "schedules")),
      ]);

      setStats({
        terms: 1,
        subjects: subSnap.size || initialSubjects.length,
        teachers: tchSnap.size || initialTeachers.length,
        classrooms: roomSnap.size || initialClassrooms.length,
        groups: grpSnap.size || initialStudentGroups.length,
        enrollments: enrSnap.size || initialCourseEnrollments.length,
        schedules: schSnap.size,
      });
    } catch (e) {
      console.error(e);
      // Fallback to initial mock stats if offline
      setStats({
        terms: 1,
        subjects: initialSubjects.length,
        teachers: initialTeachers.length,
        classrooms: initialClassrooms.length,
        groups: initialStudentGroups.length,
        enrollments: initialCourseEnrollments.length,
        schedules: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const handleSeeded = () => fetchStats();
    window.addEventListener("dataSeeded", handleSeeded);
    return () => window.removeEventListener("dataSeeded", handleSeeded);
  }, []);

  const statCards = [
    { label: "รายวิชาในหลักสูตร", count: stats.subjects, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "ครูผู้สอน", count: stats.teachers, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "ห้องเรียน / ห้องปฏิบัติการ", count: stats.classrooms, icon: Building2, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "กลุ่มผู้เรียน (ปวช./ปวส.)", count: stats.groups, icon: GraduationCap, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "ภาระงานสอนที่ต้องจัด", count: stats.enrollments, icon: Layers, color: "text-rose-600", bg: "bg-rose-50" },
    { label: "คาบเรียนที่จัดลงตารางแล้ว", count: stats.schedules, icon: CheckCircle, color: "text-teal-600", bg: "bg-teal-50" },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 p-8 sm:p-10 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-blue-200 border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI-Powered Constraint Satisfaction Problem (CSP) Solver</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            ระบบจัดตารางการเรียนการสอนอัตโนมัติ
          </h1>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
            โครงการ <strong className="text-white font-semibold">Learning-Table</strong> ช่วยจัดตารางสอนไร้ข้อขัดแย้ง 100% (Zero-Conflict) 
            วิเคราะห์ความพร้อมของครู ห้องปฏิบัติการ และกลุ่มเรียนตามระเบียบ สอศ. และสถานศึกษา
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href="/scheduler"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white text-blue-900 font-bold text-sm shadow-md hover:bg-blue-50 transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>เริ่มจัดตารางด้วย AI</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/timetables"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white/10 backdrop-blur-md text-white font-medium text-sm border border-white/20 hover:bg-white/20 transition-all"
            >
              <Table className="w-4 h-4" />
              <span>เปิดดูตารางเรียน 4 มุมมอง</span>
            </Link>
            <Link
              href="/official-timetable"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white/10 backdrop-blur-md text-white font-medium text-sm border border-white/20 hover:bg-white/20 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์แบบฟอร์มทางการ A4</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">ข้อมูลสถิติของระบบ</h2>
          <span className="text-xs text-slate-500">ภาคเรียนที่ 1 ปีการศึกษา 2569</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`w-9 h-9 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black text-slate-900 mb-0.5">
                  {loading ? "..." : stat.count}
                </div>
                <div className="text-xs font-medium text-slate-500 leading-tight">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Steps / Workflow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900">จัดการข้อมูลพื้นฐาน</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              นำเข้าหรือแก้ไขข้อมูลรายวิชา (ท-ป-น-ช), ครูผู้สอน, คาบไม่สะดวก, ห้องปฏิบัติการ, และกลุ่มเรียน
            </p>
          </div>
          <Link
            href="/management"
            className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            ไปที่หน้าจัดการข้อมูล <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900">รัน AI อัลกอริทึมจัดตาราง</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              ใช้อัลกอริทึม CSP + MRV คำนวณจัดตารางเรียนอัตโนมัติ ตรวจสอบเงื่อนไข Zero-Conflict 3 มิติในไม่กี่วินาที
            </p>
          </div>
          <Link
            href="/scheduler"
            className="mt-4 inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            ไปที่หน้าจัดตาราง AI <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900">ตรวจสอบ & พิมพ์แบบ สอศ.</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              ดูตารางได้ 4 มุมมอง สลับคาบเรียนแบบ Real-time และพิมพ์แบบฟอร์มทางการ A4 แนวนอน 1 หน้าเป๊ะ 100%
            </p>
          </div>
          <Link
            href="/official-timetable"
            className="mt-4 inline-flex items-center text-sm font-semibold text-emerald-600 hover:text-emerald-800"
          >
            ไปที่แบบฟอร์มทางการ A4 <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}

