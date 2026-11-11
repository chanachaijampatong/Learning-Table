"use client";

import React, { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  doc, 
  writeBatch, 
  setDoc,
  deleteDoc 
} from "firebase/firestore";
import { db, cleanFirestoreData } from "@/lib/firebase/config";
import { 
  Users, 
  GraduationCap, 
  Building2, 
  BookOpen, 
  ArrowLeftRight, 
  CheckCircle2, 
  Info,
  Calendar,
  Layers,
  Sparkles
} from "lucide-react";
import { 
  ScheduleItem, 
  StudentGroup, 
  Teacher, 
  Classroom, 
  Subject, 
  TimeSlot 
} from "@/types/database";
import { 
  initialSubjects, 
  initialTeachers, 
  initialClassrooms, 
  initialStudentGroups, 
  initialCourseEnrollments,
  standardPeriodTimes,
  dayNamesTh 
} from "@/lib/firebase/mockData";
import { ScheduleSolver } from "@/lib/scheduler/solver";
import { validateSwap, validateCandidatePlacement } from "@/lib/scheduler/conflict";
import ConflictModal from "@/components/ConflictModal";
import { useAuth } from "@/context/AuthContext";

type TimetableViewMode = "GROUP" | "TEACHER" | "CLASSROOM" | "SUBJECT";

export default function TimetablesPage() {
  const { role, userProfile } = useAuth();
  const isStudent = role === "STUDENT";

  const [viewMode, setViewMode] = useState<TimetableViewMode>("GROUP");
  const [termId] = useState("2569-1");

  // Selected filter targets
  const [selectedGroupId, setSelectedGroupId] = useState<string>("GRP_IT_1_2");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("TCH_PARINYA");
  const [selectedRoomId, setSelectedRoomId] = useState<string>("ROOM_IT5");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("SUB_31901_2008");

  // Mobile selected day
  const [activeMobileDay, setActiveMobileDay] = useState<number>(1);

  // Data states
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>(initialStudentGroups);
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [classrooms, setClassrooms] = useState<Classroom[]>(initialClassrooms);
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [timeslots, setTimeslots] = useState<TimeSlot[]>([]);

  // Interactive Swap selection state
  const [selectedItemForSwap, setSelectedItemForSwap] = useState<ScheduleItem | null>(null);

  // Conflict Modal state
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictReason, setConflictReason] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Build standard timeslots
  const buildTimeslots = () => {
    const slots: TimeSlot[] = [];
    for (const d of dayNamesTh) {
      for (const p of standardPeriodTimes) {
        slots.push({
          id: `D${d.day}_P${p.period}`,
          dayOfWeek: d.day,
          dayNameTh: d.full,
          dayShortTh: d.short,
          periodNumber: p.period,
          startTime: p.start,
          endTime: p.end,
          slotType: p.isBreak ? "BREAK" : "LEARN",
          isLocked: !!p.isBreak,
        });
      }
    }
    return slots;
  };

  // Load schedules from Firestore (or run solver locally if empty)
  const loadSchedules = async () => {
    const slots = buildTimeslots();
    setTimeslots(slots);

    try {
      const [schSnap, grpSnap, tchSnap, roomSnap, subSnap] = await Promise.all([
        getDocs(collection(db, "schedules")),
        getDocs(collection(db, "student_groups")),
        getDocs(collection(db, "teachers")),
        getDocs(collection(db, "classrooms")),
        getDocs(collection(db, "subjects")),
      ]);

      const loadedGroups = !grpSnap.empty ? grpSnap.docs.map(d => ({ id: d.id, ...d.data() } as StudentGroup)) : initialStudentGroups;
      const loadedTeachers = !tchSnap.empty ? tchSnap.docs.map(d => ({ id: d.id, ...d.data() } as Teacher)) : initialTeachers;
      const loadedRooms = !roomSnap.empty ? roomSnap.docs.map(d => ({ id: d.id, ...d.data() } as Classroom)) : initialClassrooms;
      const loadedSubjects = !subSnap.empty ? subSnap.docs.map(d => ({ id: d.id, ...d.data() } as Subject)) : initialSubjects;

      setGroups(loadedGroups);
      setTeachers(loadedTeachers);
      setClassrooms(loadedRooms);
      setSubjects(loadedSubjects);

      if (!schSnap.empty) {
        const items = schSnap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleItem));
        setSchedules(items);
      } else {
        // Run solver on-the-fly with initial mock data so users immediately see a full timetable!
        const solver = new ScheduleSolver(
          termId,
          initialCourseEnrollments,
          loadedTeachers,
          loadedRooms,
          loadedGroups,
          loadedSubjects,
          slots
        );
        const res = solver.solve();
        setSchedules(res.schedules);
      }
    } catch (e) {
      console.error(e);
      // Run solver fallback
      const solver = new ScheduleSolver(
        termId,
        initialCourseEnrollments,
        initialTeachers,
        initialClassrooms,
        initialStudentGroups,
        initialSubjects,
        slots
      );
      const res = solver.solve();
      setSchedules(res.schedules);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  // Filter schedules based on active view mode
  const currentFilteredSchedules = schedules.filter(item => {
    if (viewMode === "GROUP") return item.studentGroupId === selectedGroupId;
    if (viewMode === "TEACHER") return item.teacherId === selectedTeacherId;
    if (viewMode === "CLASSROOM") return item.classroomId === selectedRoomId;
    if (viewMode === "SUBJECT") return item.subjectId === selectedSubjectId;
    return true;
  });

  // Handle cell click (Interactive Swap / Move)
  const handleCellClick = async (day: number, period: number, itemAtCell: ScheduleItem | undefined) => {
    // If student, strictly disable editing and swapping
    if (isStudent) {
      showToast("🔒 โหมดนักศึกษา: ดูตารางเรียนอย่างเดียว (ไม่อนุญาตให้แก้ไขหรือสลับคาบเรียน)");
      return;
    }

    // 1. If clicking on lunch break, show warning
    if (period === 5) {
      setConflictReason("คาบที่ 5 เป็นเวลาพักรับประทานอาหารกลางวัน (12:30 - 13:30) ไม่อนุญาตให้จัดวิชาลง");
      setConflictModalOpen(true);
      return;
    }

    // 2. If nothing selected yet, select this item (if cell has an item)
    if (!selectedItemForSwap) {
      if (itemAtCell) {
        setSelectedItemForSwap(itemAtCell);
        showToast(`เลือกวิชา ${itemAtCell.subjectCode} แล้ว คลิกช่องปลายทางเพื่อสลับหรือย้าย`);
      }
      return;
    }

    // 3. User clicked the same item -> Deselect
    if (selectedItemForSwap.id === itemAtCell?.id) {
      setSelectedItemForSwap(null);
      return;
    }

    // 4. User clicked another cell to swap or move:
    const itemA = selectedItemForSwap;

    // CASE A: Target cell has an existing schedule item -> SWAP
    if (itemAtCell) {
      const itemB = itemAtCell;
      const validation = validateSwap(itemA, itemB, schedules, teachers, timeslots);

      if (!validation.isValid) {
        setConflictReason(validation.conflictReason || "พบข้อขัดแย้งในการสลับคาบเรียน");
        setConflictModalOpen(true);
        setSelectedItemForSwap(null);
        return;
      }

      // Perform swap in local state and Firestore
      const updatedSchedules = schedules.map(s => {
        if (s.id === itemA.id) {
          return {
            ...s,
            dayOfWeek: itemB.dayOfWeek,
            dayNameTh: itemB.dayNameTh,
            periodNumber: itemB.periodNumber,
            startTime: itemB.startTime,
            endTime: itemB.endTime,
            groupSlotKey: `${s.termId}_D${itemB.dayOfWeek}_P${itemB.periodNumber}_G${s.studentGroupId}`,
            teacherSlotKey: `${s.termId}_D${itemB.dayOfWeek}_P${itemB.periodNumber}_T${s.teacherId}`,
            roomSlotKey: `${s.termId}_D${itemB.dayOfWeek}_P${itemB.periodNumber}_R${s.classroomId}`,
            isManualOverride: true,
          };
        }
        if (s.id === itemB.id) {
          return {
            ...s,
            dayOfWeek: itemA.dayOfWeek,
            dayNameTh: itemA.dayNameTh,
            periodNumber: itemA.periodNumber,
            startTime: itemA.startTime,
            endTime: itemA.endTime,
            groupSlotKey: `${s.termId}_D${itemA.dayOfWeek}_P${itemA.periodNumber}_G${s.studentGroupId}`,
            teacherSlotKey: `${s.termId}_D${itemA.dayOfWeek}_P${itemA.periodNumber}_T${s.teacherId}`,
            roomSlotKey: `${s.termId}_D${itemA.dayOfWeek}_P${itemA.periodNumber}_R${s.classroomId}`,
            isManualOverride: true,
          };
        }
        return s;
      });

      setSchedules(updatedSchedules);
      setSelectedItemForSwap(null);
      showToast(`สลับคาบเรียนสำเร็จ! (${itemA.subjectCode} <-> ${itemB.subjectCode})`);

      // Persist to Firestore
      try {
        const batch = writeBatch(db);
        const itemANew = updatedSchedules.find(s => s.id === itemA.id)!;
        const itemBNew = updatedSchedules.find(s => s.id === itemB.id)!;
        batch.set(doc(db, "schedules", itemANew.id), itemANew);
        batch.set(doc(db, "schedules", itemBNew.id), itemBNew);
        await batch.commit();
      } catch (err) {
        console.warn("Firestore sync skipped:", err);
      }
      return;
    }

    // CASE B: Target cell is empty -> MOVE itemA to target
    const targetSlot = timeslots.find(t => t.dayOfWeek === day && t.periodNumber === period);
    const dayName = dayNamesTh.find(d => d.day === day)?.full || "";

    const validation = validateCandidatePlacement(
      itemA,
      day,
      period,
      schedules,
      teachers,
      timeslots
    );

    if (!validation.isValid) {
      setConflictReason(validation.conflictReason || "พบข้อขัดแย้งในการย้ายคาบเรียน");
      setConflictModalOpen(true);
      setSelectedItemForSwap(null);
      return;
    }

    const updatedSchedules = schedules.map(s => {
      if (s.id === itemA.id) {
        return {
          ...s,
          dayOfWeek: day,
          dayNameTh: dayName,
          periodNumber: period,
          startTime: targetSlot?.startTime || `0${7 + period}:30`,
          endTime: targetSlot?.endTime || `0${8 + period}:30`,
          groupSlotKey: `${s.termId}_D${day}_P${period}_G${s.studentGroupId}`,
          teacherSlotKey: `${s.termId}_D${day}_P${period}_T${s.teacherId}`,
          roomSlotKey: `${s.termId}_D${day}_P${period}_R${s.classroomId}`,
          isManualOverride: true,
        };
      }
      return s;
    });

    setSchedules(updatedSchedules);
    setSelectedItemForSwap(null);
    showToast(`ย้ายวิชา ${itemA.subjectCode} ไปที่ ${dayName} คาบที่ ${period} สำเร็จ!`);

    // Persist to Firestore
    try {
      const movedItem = updatedSchedules.find(s => s.id === itemA.id)!;
      await setDoc(doc(db, "schedules", movedItem.id), cleanFirestoreData(movedItem));
    } catch (err) {
      console.warn("Firestore sync skipped:", err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Conflict Modal */}
      <ConflictModal
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        reason={conflictReason}
      />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-sm border border-slate-700 animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & View Mode Switcher */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ตารางเรียนและการสอน (4 มุมมอง)</h1>
          <p className="text-sm text-slate-500 mt-1">
            สลับคาบเรียนแบบ Real-time Live Swap พร้อมระบบตรวจจับตารางชนอัตโนมัติ
          </p>
        </div>

        {/* Student Read-Only Badge */}
        {isStudent && (
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold shadow-sm">
            <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>โหมดนักศึกษา: ดูตารางเรียนประจำห้อง (อ่านอย่างเดียว)</span>
          </div>
        )}

        {/* View Mode Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode("GROUP")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === "GROUP" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>กลุ่มผู้เรียน</span>
          </button>
          <button
            onClick={() => setViewMode("TEACHER")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === "TEACHER" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>ครูผู้สอน</span>
          </button>
          <button
            onClick={() => setViewMode("CLASSROOM")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === "CLASSROOM" ? "bg-white text-purple-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>ห้องเรียน</span>
          </button>
          <button
            onClick={() => setViewMode("SUBJECT")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === "SUBJECT" ? "bg-white text-amber-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>รายวิชา</span>
          </button>
        </div>
      </div>

      {/* Target Selector Dropdown */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {viewMode === "GROUP" && "เลือกกลุ่มเรียน:"}
            {viewMode === "TEACHER" && "เลือกครูผู้สอน:"}
            {viewMode === "CLASSROOM" && "เลือกห้องเรียน:"}
            {viewMode === "SUBJECT" && "เลือกรายวิชา:"}
          </span>

          {viewMode === "GROUP" && (
            <select
              value={selectedGroupId}
              onChange={e => setSelectedGroupId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.groupCode} - {g.groupName} ({g.studentCount} คน)</option>
              ))}
            </select>
          )}

          {viewMode === "TEACHER" && (
            <select
              value={selectedTeacherId}
              onChange={e => setSelectedTeacherId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.fullName} ({t.department})</option>
              ))}
            </select>
          )}

          {viewMode === "CLASSROOM" && (
            <select
              value={selectedRoomId}
              onChange={e => setSelectedRoomId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {classrooms.map(r => (
                <option key={r.id} value={r.id}>{r.roomCode} - {r.roomName} ({r.capacity} ที่นั่ง)</option>
              ))}
            </select>
          )}

          {viewMode === "SUBJECT" && (
            <select
              value={selectedSubjectId}
              onChange={e => setSelectedSubjectId(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.subjectCode} - {s.nameTh} ({s.credits} น.)</option>
              ))}
            </select>
          )}
        </div>

        {/* Selected for Swap Indicator */}
        {selectedItemForSwap ? (
          <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl text-xs font-semibold border border-blue-200 animate-pulse">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>กำลังเลือก: {selectedItemForSwap.subjectCode} (คลิกช่องเป้าหมายเพื่อสลับ หรือคลิกซ้ำเพื่อยกเลิก)</span>
          </div>
        ) : (
          <div className="text-xs text-slate-400 flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            <span>เคล็ดลับ: คลิกที่ช่องวิชา แล้วคลิกช่องเป้าหมายเพื่อสลับคาบเรียนทันที</span>
          </div>
        )}
      </div>

      {/* MOBILE DAILY TIMELINE VIEW (Visible on small screens) */}
      <div className="block lg:hidden space-y-4">
        {/* Mobile Day Selector Tabs */}
        <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          {dayNamesTh.map(d => (
            <button
              key={d.day}
              onClick={() => setActiveMobileDay(d.day)}
              className={`flex-1 min-w-[70px] py-2 px-3 rounded-xl text-xs font-bold text-center transition-all ${
                activeMobileDay === d.day
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              <div>{d.short}</div>
              <div className="text-[10px] font-normal opacity-80">{d.full.replace("วัน", "")}</div>
            </button>
          ))}
        </div>

        {/* Timeline Cards */}
        <div className="space-y-2.5">
          {standardPeriodTimes.map(p => {
            const item = currentFilteredSchedules.find(
              s => s.dayOfWeek === activeMobileDay && s.periodNumber === p.period
            );

            if (p.isBreak) {
              return (
                <div key={p.period} className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-center">
                  <div className="text-xs font-bold text-amber-800">พักกลางวัน (12:30 - 13:30)</div>
                  <div className="text-[10px] text-amber-600">รับประทานอาหารกลางวันและพักผ่อน</div>
                </div>
              );
            }

            return (
              <div
                key={p.period}
                onClick={() => handleCellClick(activeMobileDay, p.period, item)}
                className={`p-3.5 rounded-2xl border transition-all ${isStudent ? "cursor-default" : "cursor-pointer"} ${
                  item
                    ? selectedItemForSwap?.id === item.id
                      ? "bg-blue-100 border-blue-500 ring-2 ring-blue-500 shadow-md"
                      : "bg-white border-slate-200 hover:border-blue-300 shadow-sm"
                    : "bg-slate-50/60 border-dashed border-slate-200 hover:bg-slate-100 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    คาบที่ {p.period} ({p.start} - {p.end})
                  </span>
                  {item && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      ห้อง {item.roomCode}
                    </span>
                  )}
                </div>

                {item ? (
                  <div>
                    <div className="text-sm font-bold text-slate-900">{item.subjectCode} {item.subjectNameTh}</div>
                    <div className="text-xs text-slate-600 mt-0.5 flex items-center justify-between">
                      <span>ครู: {item.teacherName}</span>
                      <span className="font-semibold text-blue-600">{item.studentGroupCode}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs italic py-1 text-slate-400">ว่าง (คลิกเพื่อย้ายวิชามาลงช่องนี้)</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DESKTOP MATRIX TIMETABLE GRID (Visible on lg screens) */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-center">
            {/* Table Header: Periods & Times */}
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                <th className="py-3 px-3 w-28 text-xs font-bold border-r border-slate-200">
                  วัน / คาบ
                </th>
                {standardPeriodTimes.map(p => (
                  <th
                    key={p.period}
                    className={`py-2 px-1 text-xs border-r border-slate-200 min-w-[110px] ${
                      p.isBreak ? "bg-amber-100/50 text-amber-900" : ""
                    }`}
                  >
                    <div className="font-bold">คาบที่ {p.period}</div>
                    <div className="text-[10px] font-normal text-slate-500">{p.start} - {p.end}</div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body: Days */}
            <tbody className="divide-y divide-slate-200 text-xs">
              {dayNamesTh.map(d => (
                <tr key={d.day} className="hover:bg-slate-50/40">
                  {/* Day Column */}
                  <td className="py-3 px-2 font-bold text-slate-800 bg-slate-50/80 border-r border-slate-200">
                    <div className="text-sm">{d.full}</div>
                    <div className="text-[11px] text-slate-500 font-normal">({d.short})</div>
                  </td>

                  {/* Period Columns 1..10 */}
                  {standardPeriodTimes.map(p => {
                    const item = currentFilteredSchedules.find(
                      s => s.dayOfWeek === d.day && s.periodNumber === p.period
                    );

                    // Break Column
                    if (p.isBreak) {
                      return (
                        <td
                          key={p.period}
                          className="py-2 px-1 bg-amber-50/60 border-r border-slate-200 text-amber-800/80 font-bold text-[11px]"
                        >
                          พักกลางวัน
                        </td>
                      );
                    }

                    const isSelected = selectedItemForSwap?.id === item?.id;

                    return (
                      <td
                        key={p.period}
                        onClick={() => handleCellClick(d.day, p.period, item)}
                        className={`py-2 px-1 border-r border-slate-200 transition-all align-top h-24 ${isStudent ? "cursor-default" : "cursor-pointer"} ${
                          isSelected
                            ? "bg-blue-100 ring-2 ring-blue-500 shadow-inner"
                            : item
                            ? "hover:bg-blue-50/60"
                            : "hover:bg-slate-100/60"
                        }`}
                      >
                        {item ? (
                          <div
                            className={`h-full p-2 rounded-xl text-left flex flex-col justify-between shadow-sm border transition-transform ${isStudent ? "" : "hover:scale-[1.02]"}`}
                            style={{
                              backgroundColor: `${item.colorHex}12`,
                              borderColor: `${item.colorHex}40`,
                            }}
                          >
                            <div>
                              <div className="font-mono font-bold text-[11px] leading-tight" style={{ color: item.colorHex }}>
                                {item.subjectCode}
                              </div>
                              <div className="font-bold text-slate-900 text-[11px] line-clamp-2 leading-tight mt-0.5">
                                {item.subjectNameTh}
                              </div>
                            </div>

                            <div className="mt-1 pt-1 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-600">
                              <span className="font-bold px-1.5 py-0.2 rounded bg-white border border-slate-200">
                                {item.roomCode}
                              </span>
                              <span className="font-medium truncate max-w-[65px]" title={item.teacherName}>
                                {item.teacherName.replace("นาย", "").replace("นางสาว", "")}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-300 text-[11px]">
                            -
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

