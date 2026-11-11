"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  collection, 
  getDocs, 
  query, 
  where 
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { 
  Printer, 
  Download, 
  FileSpreadsheet, 
  User, 
  Building, 
  Sparkles,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { 
  Teacher, 
  ScheduleItem, 
  Subject, 
  SystemSettings 
} from "@/types/database";
import { 
  initialTeachers, 
  initialSubjects, 
  initialSystemSettings,
  standardPeriodTimes,
  dayNamesTh 
} from "@/lib/firebase/mockData";
import { ScheduleSolver } from "@/lib/scheduler/solver";
import { initialCourseEnrollments, initialClassrooms, initialStudentGroups } from "@/lib/firebase/mockData";
import { useAuth } from "@/context/AuthContext";
import * as XLSX from "xlsx";

export default function OfficialTimetablePage() {
  const { role, userProfile } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("TCH_PARINYA");
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(initialSystemSettings);
  const [loading, setLoading] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Sync teacher ID with logged in profile
  useEffect(() => {
    if (role === "TEACHER" && userProfile?.linkedTeacherId) {
      setSelectedTeacherId(userProfile.linkedTeacherId);
    }
  }, [role, userProfile]);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [tchSnap, subSnap, schSnap] = await Promise.all([
          getDocs(collection(db, "teachers")),
          getDocs(collection(db, "subjects")),
          getDocs(collection(db, "schedules")),
        ]);

        const loadedTeachers = !tchSnap.empty 
          ? tchSnap.docs.map(d => ({ id: d.id, ...d.data() } as Teacher)) 
          : initialTeachers;
        const loadedSubjects = !subSnap.empty 
          ? subSnap.docs.map(d => ({ id: d.id, ...d.data() } as Subject)) 
          : initialSubjects;

        setTeachers(loadedTeachers);
        setSubjects(loadedSubjects);

        if (!schSnap.empty) {
          setSchedules(schSnap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleItem)));
        } else {
          // Generate fallback schedules with solver
          const solver = new ScheduleSolver(
            "2569-1",
            initialCourseEnrollments,
            loadedTeachers,
            initialClassrooms,
            initialStudentGroups,
            loadedSubjects,
            []
          );
          const res = solver.solve();
          setSchedules(res.schedules);
        }
      } catch (err) {
        console.warn("Using offline fallback:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentTeacher = teachers.find(t => t.id === selectedTeacherId) || teachers[0];

  // Schedules taught by current teacher
  const teacherSchedules = schedules.filter(s => s.teacherId === currentTeacher?.id);

  // Distinct subjects taught by this teacher in this term
  const taughtSubjectCodes = Array.from(new Set(teacherSchedules.map(s => s.subjectCode)));
  const taughtSubjects = taughtSubjectCodes.map(code => {
    const found = subjects.find(s => s.subjectCode === code);
    if (found) return found;
    const item = teacherSchedules.find(s => s.subjectCode === code);
    return {
      id: code,
      subjectCode: code,
      nameTh: item?.subjectNameTh || code,
      department: currentTeacher.department,
      theoryPeriods: 2,
      practicePeriods: 2,
      credits: 3,
      totalPeriodsPerWeek: 4,
      preferredConsecutivePeriods: 2,
      requiredRoomType: "COMPUTER_LAB" as const,
      colorHex: "#3B82F6",
      createdAt: 0,
      updatedAt: 0,
    };
  });

  // Calculate totals
  const totalTheory = taughtSubjects.reduce((acc, s) => acc + s.theoryPeriods, 0);
  const totalPractice = taughtSubjects.reduce((acc, s) => acc + s.practicePeriods, 0);
  const totalCredits = taughtSubjects.reduce((acc, s) => acc + s.credits, 0);
  const totalHours = taughtSubjects.reduce((acc, s) => acc + s.totalPeriodsPerWeek, 0);

  // Browser Print
  const handlePrint = () => {
    window.print();
  };

  // Export to Excel
  const handleExportExcel = () => {
    const rows: any[] = [];
    rows.push(["ตารางสอนและตารางกิจกรรมบุคคล (มาตรฐาน สอศ.)"]);
    rows.push([settings.institutionName, `ภาคเรียนที่ 1 ปีการศึกษา 2569`]);
    rows.push([`ชื่อครูผู้สอน: ${currentTeacher.fullName}`, `แผนกวิชา: ${currentTeacher.department}`]);
    rows.push([]);
    rows.push(["วัน", "คาบที่ 1", "คาบที่ 2", "คาบที่ 3", "คาบที่ 4", "พักกลางวัน", "คาบที่ 6", "คาบที่ 7", "คาบที่ 8", "คาบที่ 9", "คาบที่ 10"]);

    for (const d of dayNamesTh) {
      const row = [d.full];
      for (const p of standardPeriodTimes) {
        if (p.isBreak) {
          row.push("พักกลางวัน");
          continue;
        }
        const item = teacherSchedules.find(s => s.dayOfWeek === d.day && s.periodNumber === p.period);
        if (item) {
          row.push(`${item.subjectCode} (${item.roomCode}) [${item.studentGroupCode}]`);
        } else {
          row.push("-");
        }
      }
      rows.push(row);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ตารางสอนราชการ");
    XLSX.writeFile(wb, `ตารางสอนทางการ_${currentTeacher.fullName}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar (Hidden in Print) */}
      <div className="no-print bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>แบบฟอร์มทางการราชการ / สอศ. มาตรฐานวิทยาลัยเทคนิคระยอง</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">ตารางสอนและตารางกิจกรรมบุคคล (A4 แนวนอน)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            สัดส่วน 285mm x 200mm พอดี 1 หน้า A4 แนวนอน 100% พร้อมตาราง ท-ป-น-ช และจุดลงนาม 4 ฝ่าย
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Teacher Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600">เลือกครู:</span>
            <select
              value={selectedTeacherId}
              onChange={e => setSelectedTeacherId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.fullName} ({t.department})</option>
              ))}
            </select>
          </div>

          {/* Export & Print Buttons */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>ส่งออก Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์ A4 แนวนอน (1 หน้าเป๊ะ)</span>
          </button>
        </div>
      </div>

      {/* 
        OFFICIAL PRINT DOCUMENT CONTAINER
        Dimensions strictly enforced: 285mm x 200mm for A4 landscape 1-page fit
      */}
      <div className="flex justify-center overflow-x-auto pb-6">
        <div
          ref={printAreaRef}
          className="official-page-wrapper bg-white text-black p-4 sm:p-6 shadow-2xl border border-slate-300 print:shadow-none print:border-none print:p-0"
          style={{
            width: "285mm",
            minHeight: "200mm",
            maxHeight: "200mm",
            boxSizing: "border-box",
            fontSize: "11px",
            lineHeight: 1.25,
            fontFamily: "'Sarabun', 'TH Sarabun New', sans-serif",
          }}
        >
          {/* HEADER SECTION (Top info + Summary Table) */}
          <div className="flex justify-between items-start mb-2 border-b-2 border-black pb-2">
            {/* Left Header: Logo & Institution Info */}
            <div className="flex items-start space-x-3 max-w-[55%]">
              {/* Emblem / Logo */}
              <div className="w-16 h-16 shrink-0 flex items-center justify-center p-1 border border-black/40 rounded-lg bg-white">
                {/* SVG Emblem Representation of OVEC / Vocational Logo */}
                <svg viewBox="0 0 100 100" className="w-14 h-14 text-blue-900 fill-current">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="4" />
                  <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4,2" />
                  <path d="M50 20 L58 36 L76 39 L63 52 L66 70 L50 61 L34 70 L37 52 L24 39 L42 36 Z" fill="currentColor" opacity="0.85" />
                  <text x="50" y="86" fontSize="8" textAnchor="middle" fontWeight="bold">สอศ.</text>
                </svg>
              </div>

              <div>
                <h2 className="text-base font-extrabold tracking-tight text-black">
                  ตารางสอนและตารางกิจกรรมบุคคล
                </h2>
                <div className="text-xs font-bold text-black mt-0.5">
                  {settings.institutionName} {settings.vocationalCommissionName}
                </div>
                <div className="text-[11px] text-black mt-0.5">
                  <strong>ภาคเรียนที่:</strong> 1 &nbsp;&nbsp; <strong>ปีการศึกษา:</strong> 2569
                </div>
                <div className="text-[11px] text-black mt-0.5">
                  <strong>ชื่อผู้สอน:</strong> {currentTeacher.fullName} &nbsp;&nbsp;
                  <strong>วุฒิ:</strong> {currentTeacher.education || "-"}
                </div>
                <div className="text-[11px] text-black mt-0.5">
                  <strong>แผนกวิชา:</strong> {currentTeacher.department} &nbsp;&nbsp;
                  <strong>หน้าที่พิเศษ:</strong> {currentTeacher.specialDuty || "-"}
                </div>
              </div>
            </div>

            {/* Right Header: Subject Summary Table (ท-ป-น-ช) */}
            <div className="w-[43%] text-[10px]">
              <table className="w-full border-collapse border border-black text-center">
                <thead>
                  <tr className="bg-slate-100 font-bold border-b border-black">
                    <th className="border border-black py-0.5 px-1 w-20">รหัสวิชา</th>
                    <th className="border border-black py-0.5 px-1 text-left">ชื่อรายวิชา</th>
                    <th className="border border-black py-0.5 px-1 w-6">ท.</th>
                    <th className="border border-black py-0.5 px-1 w-6">ป.</th>
                    <th className="border border-black py-0.5 px-1 w-6">น.</th>
                    <th className="border border-black py-0.5 px-1 w-6">ช.</th>
                  </tr>
                </thead>
                <tbody>
                  {taughtSubjects.slice(0, 4).map((s, idx) => (
                    <tr key={idx} className="border-b border-black">
                      <td className="border border-black py-0.5 px-1 font-mono font-bold">{s.subjectCode}</td>
                      <td className="border border-black py-0.5 px-1 text-left truncate max-w-[130px] font-medium">{s.nameTh}</td>
                      <td className="border border-black py-0.5 px-1">{s.theoryPeriods}</td>
                      <td className="border border-black py-0.5 px-1">{s.practicePeriods}</td>
                      <td className="border border-black py-0.5 px-1 font-bold">{s.credits}</td>
                      <td className="border border-black py-0.5 px-1 font-bold">{s.totalPeriodsPerWeek}</td>
                    </tr>
                  ))}
                  {/* Totals Summary Row */}
                  <tr className="bg-slate-100 font-bold border-t-2 border-black">
                    <td colSpan={2} className="border border-black py-0.5 px-1 text-right">
                      รวมทั้งหมด
                    </td>
                    <td className="border border-black py-0.5 px-1">{totalTheory}</td>
                    <td className="border border-black py-0.5 px-1">{totalPractice}</td>
                    <td className="border border-black py-0.5 px-1">{totalCredits}</td>
                    <td className="border border-black py-0.5 px-1 font-extrabold">{totalHours}</td>
                  </tr>
                </tbody>
              </table>
              <div className="text-[9px] text-right mt-0.5 text-slate-600">
                รวมจำนวนชั่วโมงสอนจริง: <strong>{totalHours}</strong> คาบ/สัปดาห์
              </div>
            </div>
          </div>

          {/* MAIN TIMETABLE MATRIX */}
          <div className="w-full">
            <table className="w-full border-collapse border-2 border-black text-center text-[10px]">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-black font-bold">
                  <th className="border border-black py-1 px-1 w-16 text-center">วัน / เวลา</th>
                  {/* Vertical flag ceremony column header */}
                  <th className="border border-black py-1 px-0.5 w-7 text-[9px] font-bold">
                    08.00<br/>08.30
                  </th>
                  {standardPeriodTimes.map(p => (
                    <th key={p.period} className="border border-black py-1 px-0.5">
                      <div>คาบ {p.period}</div>
                      <div className="text-[9px] font-normal">{p.start}-{p.end}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dayNamesTh.map((d, dayIndex) => {
                  return (
                    <tr key={d.day} className="border-b border-black" style={{ height: "24mm" }}>
                      {/* Day Name */}
                      <td className="border border-black font-bold bg-slate-50 text-[11px] py-1 px-1">
                        {d.full}
                      </td>

                      {/* Flag Ceremony Column (08:00 - 08:30) with vertical text on Monday */}
                      {dayIndex === 0 ? (
                        <td
                          rowSpan={5}
                          className="border border-black bg-slate-100 text-[10px] font-extrabold py-1 px-0.5 align-middle select-none"
                          style={{
                            writingMode: "vertical-rl",
                            textOrientation: "mixed",
                            letterSpacing: "2px",
                          }}
                        >
                          กิจกรรมหน้าเสาธงและโฮมรูม (08:00 - 08:30 น.)
                        </td>
                      ) : null}

                      {/* Periods 1 to 10 */}
                      {(() => {
                        const cells: React.ReactNode[] = [];
                        let p = 1;

                        while (p <= 10) {
                          const currentPeriod = p;
                          const currentPConfig = standardPeriodTimes.find(t => t.period === currentPeriod);

                          // Lunch Break (Period 5)
                          if (currentPConfig?.isBreak) {
                            cells.push(
                              <td
                                key={currentPeriod}
                                className="border border-black bg-slate-100 font-bold text-[10px] text-slate-800 align-middle py-1 px-0.5"
                              >
                                พัก<br/>กลางวัน
                              </td>
                            );
                            p++;
                            continue;
                          }

                          // Check if there's a class at currentPeriod
                          const item = teacherSchedules.find(
                            s => s.dayOfWeek === d.day && s.periodNumber === currentPeriod
                          );

                          // Check if next period has the exact same class (Double Period Consecutive block!)
                          const nextPeriod = currentPeriod + 1;
                          const nextItem = teacherSchedules.find(
                            s => s.dayOfWeek === d.day && s.periodNumber === nextPeriod
                          );

                          const isDoubleBlock = (
                            item &&
                            nextItem &&
                            nextPeriod !== 5 &&
                            item.subjectCode === nextItem.subjectCode &&
                            item.studentGroupId === nextItem.studentGroupId &&
                            item.classroomId === nextItem.classroomId
                          );

                          if (isDoubleBlock) {
                            // Merge horizontally colSpan=2
                            cells.push(
                              <td
                                key={currentPeriod}
                                colSpan={2}
                                className="border border-black p-1 align-middle bg-blue-50/50"
                              >
                                <div className="font-bold text-[11px] text-blue-900 leading-tight">
                                  {item.subjectCode}
                                </div>
                                <div className="font-extrabold text-[10px] text-black leading-tight mt-0.5">
                                  ห้อง {item.roomCode}
                                </div>
                                <div className="text-[10px] text-slate-700 font-semibold leading-tight mt-0.5">
                                  {item.studentGroupCode} ({item.studentCount} คน)
                                </div>
                              </td>
                            );
                            p += 2; // skip next period
                            continue;
                          }

                          if (item) {
                            // Single period item
                            cells.push(
                              <td
                                key={currentPeriod}
                                className="border border-black p-1 align-middle bg-blue-50/40"
                              >
                                <div className="font-bold text-[10px] text-blue-900 leading-tight">
                                  {item.subjectCode}
                                </div>
                                <div className="font-extrabold text-[9px] text-black leading-tight mt-0.5">
                                  ห้อง {item.roomCode}
                                </div>
                                <div className="text-[9px] text-slate-700 font-medium leading-tight mt-0.5">
                                  {item.studentGroupCode}
                                </div>
                              </td>
                            );
                          } else {
                            // Empty period
                            cells.push(
                              <td key={currentPeriod} className="border border-black p-1 align-middle text-slate-300">
                                -
                              </td>
                            );
                          }

                          p++;
                        }

                        return cells;
                      })()}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 4 SIGNATURES FOOTER */}
          <div className="mt-3 pt-2 grid grid-cols-4 gap-2 text-center text-[10px] border-t border-black">
            <div className="space-y-1">
              <div className="h-7 flex items-end justify-center font-serif italic text-slate-400">
                ...................................................
              </div>
              <div className="font-bold text-black">({settings.departmentHeadName || "นายปริญญา ชัยชนะ"})</div>
              <div className="text-slate-700">หัวหน้าแผนกวิชา</div>
            </div>

            <div className="space-y-1">
              <div className="h-7 flex items-end justify-center font-serif italic text-slate-400">
                ...................................................
              </div>
              <div className="font-bold text-black">({settings.curriculumHeadName})</div>
              <div className="text-slate-700">หัวหน้างานพัฒนาหลักสูตรฯ</div>
            </div>

            <div className="space-y-1">
              <div className="h-7 flex items-end justify-center font-serif italic text-slate-400">
                ...................................................
              </div>
              <div className="font-bold text-black">({settings.academicDeputyName})</div>
              <div className="text-slate-700">รองผู้อำนวยการฝ่ายวิชาการ</div>
            </div>

            <div className="space-y-1">
              <div className="h-7 flex items-end justify-center font-serif italic text-slate-400">
                ...................................................
              </div>
              <div className="font-bold text-black">({settings.directorName})</div>
              <div className="text-slate-700">ผู้อำนวยการสถานศึกษา</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

