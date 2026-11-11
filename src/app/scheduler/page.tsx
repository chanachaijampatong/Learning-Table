"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  collection, 
  getDocs, 
  writeBatch, 
  doc, 
  query, 
  where 
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { 
  Sparkles, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Save, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Layers
} from "lucide-react";
import { 
  CourseEnrollment, 
  Teacher, 
  Classroom, 
  StudentGroup, 
  Subject, 
  TimeSlot, 
  ScheduleItem 
} from "@/types/database";
import { 
  initialSubjects, 
  initialTeachers, 
  initialClassrooms, 
  initialStudentGroups, 
  initialCourseEnrollments,
  standardPeriodTimes
} from "@/lib/firebase/mockData";
import { ScheduleSolver, SolverResult } from "@/lib/scheduler/solver";

export default function SchedulerPage() {
  const [termId, setTermId] = useState("2569-1");
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<SolverResult | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Loaded inputs
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>(initialCourseEnrollments);
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [classrooms, setClassrooms] = useState<Classroom[]>(initialClassrooms);
  const [groups, setGroups] = useState<StudentGroup[]>(initialStudentGroups);
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [timeslots, setTimeslots] = useState<TimeSlot[]>([]);

  useEffect(() => {
    // Generate default timeslots
    const defaultSlots: TimeSlot[] = [];
    const days = [
      { day: 1, name: "วันจันทร์", short: "จ." },
      { day: 2, name: "วันอังคาร", short: "อ." },
      { day: 3, name: "วันพุธ", short: "พ." },
      { day: 4, name: "วันพฤหัสบดี", short: "พฤ." },
      { day: 5, name: "วันศุกร์", short: "ศ." },
    ];
    for (const d of days) {
      for (const p of standardPeriodTimes) {
        defaultSlots.push({
          id: `D${d.day}_P${p.period}`,
          dayOfWeek: d.day,
          dayNameTh: d.name,
          dayShortTh: d.short,
          periodNumber: p.period,
          startTime: p.start,
          endTime: p.end,
          slotType: p.isBreak ? "BREAK" : "LEARN",
          isLocked: !!p.isBreak,
        });
      }
    }
    setTimeslots(defaultSlots);

    // Fetch live data from Firestore if available
    const fetchData = async () => {
      try {
        const [enrSnap, tchSnap, roomSnap, grpSnap, subSnap] = await Promise.all([
          getDocs(collection(db, "course_enrollments")),
          getDocs(collection(db, "teachers")),
          getDocs(collection(db, "classrooms")),
          getDocs(collection(db, "student_groups")),
          getDocs(collection(db, "subjects")),
        ]);

        if (!enrSnap.empty) setEnrollments(enrSnap.docs.map(d => ({ id: d.id, ...d.data() } as CourseEnrollment)));
        if (!tchSnap.empty) setTeachers(tchSnap.docs.map(d => ({ id: d.id, ...d.data() } as Teacher)));
        if (!roomSnap.empty) setClassrooms(roomSnap.docs.map(d => ({ id: d.id, ...d.data() } as Classroom)));
        if (!grpSnap.empty) setGroups(grpSnap.docs.map(d => ({ id: d.id, ...d.data() } as StudentGroup)));
        if (!subSnap.empty) setSubjects(subSnap.docs.map(d => ({ id: d.id, ...d.data() } as Subject)));
      } catch (e) {
        console.warn("Using offline mock data:", e);
      }
    };
    fetchData();
  }, []);

  // Run AI Solver
  const handleRunSolver = () => {
    setRunning(true);
    setSavedSuccess(false);

    setTimeout(() => {
      const solver = new ScheduleSolver(
        termId,
        enrollments,
        teachers,
        classrooms,
        groups,
        subjects,
        timeslots
      );

      const res = solver.solve();
      setResult(res);
      setRunning(false);
    }, 300);
  };

  // Save generated schedules to Firestore
  const handleSaveToFirestore = async () => {
    if (!result || result.schedules.length === 0) return;
    setSaving(true);
    try {
      const batch = writeBatch(db);

      // Save each schedule item
      for (const item of result.schedules) {
        const itemRef = doc(db, "schedules", item.id);
        batch.set(itemRef, item);
      }

      await batch.commit();
      setSavedSuccess(true);
      window.dispatchEvent(new Event("schedulesUpdated"));
    } catch (e: any) {
      alert("Error saving schedules to Firestore: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2 border border-blue-200">
            <Cpu className="w-3.5 h-3.5" />
            <span>CSP (Constraint Satisfaction Problem) Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">AI จัดตารางการเรียนการสอนอัตโนมัติ</h1>
          <p className="text-sm text-slate-500 mt-1">
            อัลกอริทึม Heuristic MRV Backtracking ค้นหาคาบเรียนที่ดีที่สุดโดยปราศจากข้อขัดแย้ง 100%
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={termId}
            onChange={e => setTermId(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="2569-1">ภาคเรียนที่ 1/2569</option>
            <option value="2569-2">ภาคเรียนที่ 2/2569</option>
          </select>

          <button
            onClick={handleRunSolver}
            disabled={running}
            className={`inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-md transition-all ${
              running
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25 hover:scale-105 active:scale-95"
            }`}
          >
            {running ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>กำลังคำนวณ...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>สั่ง AI จัดตารางทันที</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Constraints Checklist */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>เงื่อนไขบังคับเด็ดขาดที่ AI ตรวจสอบอัตโนมัติ (Hard Constraints - Zero Conflict)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center space-x-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ครูไม่สอนซ้ำซ้อนในเวลาเดียวกัน</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ห้องเรียนไม่ถูกใช้ซ้ำในคาบเดียวกัน</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>กลุ่มเรียนไม่เรียนซ้อนคาบ</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ประเภทห้องตรงกับวิชา (Lab คอม, ช่าง)</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ความจุห้องเพียงพอกับจำนวนนักเรียน</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-800/80 p-3 rounded-xl border border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ไม่ลงในเวลาพักเที่ยงหรือกิจกรรม</span>
          </div>
        </div>
      </div>

      {/* Solver Execution Results */}
      {result && (
        <div className="space-y-6">
          {/* Metrics Card */}
          <div className={`p-6 rounded-2xl border shadow-sm ${
            result.success
              ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
              : "bg-amber-50/80 border-amber-200 text-amber-950"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl ${result.success ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"}`}>
                  {result.success ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {result.success
                      ? "จัดตารางสำเร็จสมบูรณ์ 100% (Zero-Conflict)!"
                      : `จัดได้บางส่วน (${result.assignedUnits}/${result.totalUnits} หน่วยเรียน)`}
                  </h3>
                  <p className="text-xs opacity-80 mt-0.5">
                    ประมวลผลสำเร็จในเวลา {result.executionTimeMs} มิลลิวินาที • จำนวนคาบเรียนที่สร้างขึ้น: {result.schedules.length} คาบ
                  </p>
                </div>
              </div>

              {/* Action Save Button */}
              {result.schedules.length > 0 && (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleSaveToFirestore}
                    disabled={saving || savedSuccess}
                    className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all ${
                      savedSuccess
                        ? "bg-emerald-600 text-white cursor-default"
                        : "bg-slate-900 hover:bg-black text-white hover:scale-105"
                    }`}
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>กำลังบันทึก...</span>
                      </>
                    ) : savedSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>บันทึกสำเร็จเรียบร้อย!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>บันทึกลง Cloud Firestore</span>
                      </>
                    )}
                  </button>

                  <Link
                    href="/timetables"
                    className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-semibold shadow-sm transition-colors"
                  >
                    <span>ดูตารางเรียน 4 มุมมอง</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>

            {/* Conflict Report if any */}
            {result.conflictReport.length > 0 && (
              <div className="mt-4 pt-4 border-t border-amber-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">
                  รายงานปัญหาข้อจำกัด (Conflict Report):
                </h4>
                <ul className="list-disc list-inside space-y-1 text-xs text-amber-900">
                  {result.conflictReport.map((rep, idx) => (
                    <li key={idx}>{rep}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Schedule Preview Grid */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">
                ตัวอย่างผลลัพธ์คาบเรียนที่ AI จัดวางได้ ({result.schedules.length} คาบ)
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                Real-time CSP Generated Items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">วัน</th>
                    <th className="py-2.5 px-3">คาบที่ / เวลา</th>
                    <th className="py-2.5 px-3">กลุ่มผู้เรียน</th>
                    <th className="py-2.5 px-3">รหัสวิชา</th>
                    <th className="py-2.5 px-3">ชื่อรายวิชา</th>
                    <th className="py-2.5 px-3">ครูผู้สอน</th>
                    <th className="py-2.5 px-3">ห้องเรียน</th>
                    <th className="py-2.5 px-3">Deterministic Key</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.schedules.slice(0, 15).map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-900">{item.dayNameTh}</td>
                      <td className="py-2 px-3 font-medium text-slate-600">คาบ {item.periodNumber} ({item.startTime}-{item.endTime})</td>
                      <td className="py-2 px-3 font-bold text-blue-700">{item.studentGroupCode}</td>
                      <td className="py-2 px-3 font-mono font-semibold text-slate-800">{item.subjectCode}</td>
                      <td className="py-2 px-3 text-slate-700 truncate max-w-[200px]">{item.subjectNameTh}</td>
                      <td className="py-2 px-3 text-slate-800">{item.teacherName}</td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 font-bold text-slate-800 border">
                          {item.roomCode}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono text-[10px] text-slate-400 truncate max-w-[150px]">
                        {item.groupSlotKey}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {result.schedules.length > 15 && (
              <div className="mt-3 text-center text-xs text-slate-500">
                ... และอีก {result.schedules.length - 15} คาบเรียน กด &quot;บันทึกลง Cloud Firestore&quot; เพื่อดูตารางฉบับเต็ม ...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

