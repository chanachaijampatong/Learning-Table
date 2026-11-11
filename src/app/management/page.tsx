"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  writeBatch
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { 
  BookOpen, 
  Users, 
  Building2, 
  GraduationCap, 
  Layers, 
  Plus, 
  Trash2, 
  Edit2, 
  Download, 
  Upload, 
  Search,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet
} from "lucide-react";
import { 
  Subject, 
  Teacher, 
  Classroom, 
  StudentGroup, 
  CourseEnrollment, 
  RoomType,
  ROOM_TYPE_NAMES 
} from "@/types/database";
import { 
  initialSubjects, 
  initialTeachers, 
  initialClassrooms, 
  initialStudentGroups, 
  initialCourseEnrollments 
} from "@/lib/firebase/mockData";
import * as XLSX from "xlsx";

type TabType = "subjects" | "teachers" | "classrooms" | "groups" | "enrollments";

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState<TabType>("subjects");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data states
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [classrooms, setClassrooms] = useState<Classroom[]>(initialClassrooms);
  const [groups, setGroups] = useState<StudentGroup[]>(initialStudentGroups);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>(initialCourseEnrollments);

  // Fetch data from Firestore
  const loadData = async () => {
    setLoading(true);
    try {
      const [subSnap, tchSnap, roomSnap, grpSnap, enrSnap] = await Promise.all([
        getDocs(collection(db, "subjects")),
        getDocs(collection(db, "teachers")),
        getDocs(collection(db, "classrooms")),
        getDocs(collection(db, "student_groups")),
        getDocs(collection(db, "course_enrollments")),
      ]);

      if (!subSnap.empty) {
        setSubjects(subSnap.docs.map(d => ({ id: d.id, ...d.data() } as Subject)));
      }
      if (!tchSnap.empty) {
        setTeachers(tchSnap.docs.map(d => ({ id: d.id, ...d.data() } as Teacher)));
      }
      if (!roomSnap.empty) {
        setClassrooms(roomSnap.docs.map(d => ({ id: d.id, ...d.data() } as Classroom)));
      }
      if (!grpSnap.empty) {
        setGroups(grpSnap.docs.map(d => ({ id: d.id, ...d.data() } as StudentGroup)));
      }
      if (!enrSnap.empty) {
        setEnrollments(enrSnap.docs.map(d => ({ id: d.id, ...d.data() } as CourseEnrollment)));
      }
    } catch (e: any) {
      console.error("Firestore read error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3500);
  };

  // Export current tab to Excel
  const handleExportExcel = () => {
    let dataToExport: any[] = [];
    let filename = "";

    if (activeTab === "subjects") {
      dataToExport = subjects.map(s => ({
        "รหัสวิชา": s.subjectCode,
        "ชื่อวิชา (ภาษาไทย)": s.nameTh,
        "แผนกวิชา": s.department,
        "หน่วยกิต (น.)": s.credits,
        "ทฤษฎี (ท.)": s.theoryPeriods,
        "ปฏิบัติ (ป.)": s.practicePeriods,
        "คาบรวม (ช.)": s.totalPeriodsPerWeek,
        "ประเภทห้อง": ROOM_TYPE_NAMES[s.requiredRoomType] || s.requiredRoomType,
      }));
      filename = "รายวิชา_Learning-Table.xlsx";
    } else if (activeTab === "teachers") {
      dataToExport = teachers.map(t => ({
        "รหัสครู": t.teacherCode,
        "คำนำหน้า": t.prefix,
        "ชื่อ": t.firstName,
        "นามสกุล": t.lastName,
        "แผนกวิชา": t.department,
        "วุฒิการศึกษา": t.education || "",
        "หน้าที่พิเศษ": t.specialDuty || "",
        "คาบสูงสุดต่อสัปดาห์": t.maxPeriodsPerWeek,
      }));
      filename = "ครูผู้สอน_Learning-Table.xlsx";
    } else if (activeTab === "classrooms") {
      dataToExport = classrooms.map(r => ({
        "รหัสห้อง": r.roomCode,
        "ชื่อห้อง": r.roomName,
        "อาคาร": r.building,
        "ความจุ (คน)": r.capacity,
        "ประเภทห้อง": ROOM_TYPE_NAMES[r.roomType] || r.roomType,
      }));
      filename = "ห้องเรียน_Learning-Table.xlsx";
    } else if (activeTab === "groups") {
      dataToExport = groups.map(g => ({
        "รหัสกลุ่ม": g.groupCode,
        "ชื่อกลุ่ม": g.groupName,
        "ระดับชั้น": g.gradeLevel,
        "จำนวนนักเรียน": g.studentCount,
      }));
      filename = "กลุ่มผู้เรียน_Learning-Table.xlsx";
    } else if (activeTab === "enrollments") {
      dataToExport = enrollments.map(e => ({
        "กลุ่มผู้เรียน": e.studentGroupCode,
        "รหัสวิชา": e.subjectCode,
        "ชื่อวิชา": e.subjectNameTh,
        "ครูผู้สอน": e.teacherName,
        "จำนวนคาบต่อสัปดาห์": e.periodsPerWeek,
        "ลักษณะคาบ": e.preferredConsecutivePeriods === 2 ? "คาบคู่ (2 คาบติดกัน)" : "คาบเดี่ยว",
      }));
      filename = "แผนการเรียน_Learning-Table.xlsx";
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, filename);
    showToast(`ส่งออกไฟล์ Excel สำเร็จ: ${filename}`);
  };

  // Download Sample Template for Excel Import
  const handleDownloadTemplate = () => {
    let sampleData: any[] = [];
    let filename = "";

    if (activeTab === "subjects") {
      sampleData = [
        {
          "รหัสวิชา": "31901-2011",
          "ชื่อวิชา (ภาษาไทย)": "การเขียนโปรแกรมระบบสมองกล",
          "แผนกวิชา": "เทคโนโลยีสารสนเทศ",
          "หน่วยกิต (น.)": 3,
          "ทฤษฎี (ท.)": 2,
          "ปฏิบัติ (ป.)": 2,
          "คาบรวม (ช.)": 4,
          "ประเภทห้อง": "ห้องปฏิบัติการคอมพิวเตอร์"
        }
      ];
      filename = "Template_นำเข้ารายวิชา.xlsx";
    } else if (activeTab === "teachers") {
      sampleData = [
        {
          "รหัสครู": "T0109",
          "คำนำหน้า": "นาย",
          "ชื่อ": "ธีรภัทร",
          "นามสกุล": "แก้วมณี",
          "แผนกวิชา": "เทคโนโลยีสารสนเทศ",
          "วุฒิการศึกษา": "วท.บ. วิทยาการคอมพิวเตอร์",
          "หน้าที่พิเศษ": "งานสื่อการสอน",
          "คาบสูงสุดต่อสัปดาห์": 22
        }
      ];
      filename = "Template_นำเข้าครูผู้สอน.xlsx";
    } else {
      sampleData = [
        {
          "รหัสห้อง": "LAB-IT7",
          "ชื่อห้อง": "ห้องปฏิบัติการคอมพิวเตอร์ 7",
          "อาคาร": "อาคาร 3 ชั้น 3",
          "ความจุ (คน)": 40,
          "ประเภทห้อง": "ห้องปฏิบัติการคอมพิวเตอร์"
        }
      ];
      filename = "Template_นำเข้าห้องเรียน.xlsx";
    }

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, filename);
    showToast(`ดาวน์โหลดแม่แบบสำเร็จ: ${filename}`);
  };

  // Handle Excel File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        if (!data || data.length === 0) {
          alert("ไม่พบข้อมูลในไฟล์ Excel ที่เลือก");
          return;
        }

        const batch = writeBatch(db);

        if (activeTab === "subjects") {
          const newSubjects: Subject[] = [];
          for (const row of data) {
            const subCode = String(row["รหัสวิชา"] || "").trim();
            const nameTh = String(row["ชื่อวิชา (ภาษาไทย)"] || row["ชื่อวิชา"] || "").trim();
            if (!subCode || !nameTh) continue;

            const subItem: Subject = {
              id: `SUB_${subCode.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now().toString().slice(-4)}`,
              subjectCode: subCode,
              nameTh,
              department: String(row["แผนกวิชา"] || "เทคโนโลยีสารสนเทศ").trim(),
              credits: Number(row["หน่วยกิต (น.)"] || row["หน่วยกิต"] || 3),
              theoryPeriods: Number(row["ทฤษฎี (ท.)"] || row["ทฤษฎี"] || 2),
              practicePeriods: Number(row["ปฏิบัติ (ป.)"] || row["ปฏิบัติ"] || 2),
              totalPeriodsPerWeek: Number(row["คาบรวม (ช.)"] || row["คาบรวม"] || 4),
              preferredConsecutivePeriods: 2,
              requiredRoomType: "COMPUTER_LAB",
              colorHex: "#0284C7",
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };

            newSubjects.push(subItem);
            batch.set(doc(db, "subjects", subItem.id), subItem);
          }

          await batch.commit();
          setSubjects([...subjects, ...newSubjects]);
          showToast(`นำเข้าสำเร็จ ${newSubjects.length} รายวิชา!`);
        } else if (activeTab === "teachers") {
          const newTeachers: Teacher[] = [];
          for (const row of data) {
            const tCode = String(row["รหัสครู"] || `T${Date.now().toString().slice(-4)}`).trim();
            const firstName = String(row["ชื่อ"] || "").trim();
            const lastName = String(row["นามสกุล"] || "").trim();
            const prefix = String(row["คำนำหน้า"] || "นาย").trim();
            if (!firstName) continue;

            const tchItem: Teacher = {
              id: `TCH_${Date.now().toString().slice(-4)}_${firstName}`,
              teacherCode: tCode,
              prefix,
              firstName,
              lastName,
              fullName: `${prefix}${firstName} ${lastName}`.trim(),
              department: String(row["แผนกวิชา"] || "เทคโนโลยีสารสนเทศ").trim(),
              education: String(row["วุฒิการศึกษา"] || "").trim(),
              specialDuty: String(row["หน้าที่พิเศษ"] || "").trim(),
              maxPeriodsPerWeek: Number(row["คาบสูงสุดต่อสัปดาห์"] || 22),
              qualifiedSubjectCodes: [],
              unavailableSlots: [],
              isActive: true,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };

            newTeachers.push(tchItem);
            batch.set(doc(db, "teachers", tchItem.id), tchItem);
          }

          await batch.commit();
          setTeachers([...teachers, ...newTeachers]);
          showToast(`นำเข้าสำเร็จ ${newTeachers.length} ท่าน!`);
        }

        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = "";
      } catch (err: any) {
        console.error("Error parsing excel:", err);
        alert("เกิดข้อผิดพลาดในการอ่านไฟล์: " + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Quick Add Item Modals / Direct Firestore Add
  const handleAddQuickSubject = async () => {
    const code = prompt("กรอกรหัสวิชา (เช่น 31901-2010):", "31901-2010");
    if (!code) return;
    const name = prompt("กรอกชื่อวิชาภาษาไทย:", "การเขียนโปรแกรมขั้นสูง");
    if (!name) return;

    const newSub: Subject = {
      id: `SUB_${Date.now()}`,
      subjectCode: code,
      nameTh: name,
      department: "เทคโนโลยีสารสนเทศ",
      credits: 3,
      theoryPeriods: 2,
      practicePeriods: 2,
      totalPeriodsPerWeek: 4,
      preferredConsecutivePeriods: 2,
      requiredRoomType: "COMPUTER_LAB",
      colorHex: "#0284C7",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await setDoc(doc(db, "subjects", newSub.id), newSub);
      setSubjects([...subjects, newSub]);
      showToast("เพิ่มรายวิชาสำเร็จ!");
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm("คุณแน่ใจว่าต้องการลบวิชานี้?")) return;
    try {
      await deleteDoc(doc(db, "subjects", id));
      setSubjects(subjects.filter(s => s.id !== id));
      showToast("ลบรายวิชาสำเร็จ!");
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const tabs = [
    { key: "subjects", label: "รายวิชา (Subjects)", icon: BookOpen, count: subjects.length },
    { key: "teachers", label: "ครูผู้สอน (Teachers)", icon: Users, count: teachers.length },
    { key: "classrooms", label: "ห้องเรียน (Classrooms)", icon: Building2, count: classrooms.length },
    { key: "groups", label: "กลุ่มผู้เรียน (Student Groups)", icon: GraduationCap, count: groups.length },
    { key: "enrollments", label: "แผนการเรียน (Course Enrollments)", icon: Layers, count: enrollments.length },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast */}
      {message && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 text-sm border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {/* Hidden File Input for Excel Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">จัดการข้อมูลหลัก (Master Data)</h1>
          <p className="text-sm text-slate-500 mt-1">
            จัดการข้อมูลรายวิชา (ท-ป-น-ช), ครูผู้สอน, คาบไม่สะดวก, ห้องปฏิบัติการ และภาระงานสอน
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Template */}
          <button
            onClick={handleDownloadTemplate}
            title="ดาวน์โหลดแม่แบบ Excel ที่มีหัวคอลัมน์ถูกต้อง"
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>ดาวน์โหลด Template</span>
          </button>

          {/* Import Excel */}
          <button
            onClick={() => fileInputRef.current?.click()}
            title="นำเข้าไฟล์ Excel (.xlsx, .xls) เข้าระบบ"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Upload className="w-4 h-4 text-blue-600" />
            <span>นำเข้า Excel</span>
          </button>

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>ส่งออก Excel</span>
          </button>

          {activeTab === "subjects" && (
            <button
              onClick={handleAddQuickSubject}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มรายวิชา</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key as TabType);
                setSearchQuery("");
              }}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="ค้นหาข้อมูลในตารางนี้..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* SUBJECTS TAB */}
        {activeTab === "subjects" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">รหัสวิชา</th>
                  <th className="py-3 px-4">ชื่อรายวิชา</th>
                  <th className="py-3 px-4">แผนก</th>
                  <th className="py-3 px-4 text-center">ท.</th>
                  <th className="py-3 px-4 text-center">ป.</th>
                  <th className="py-3 px-4 text-center">น.</th>
                  <th className="py-3 px-4 text-center">ช.</th>
                  <th className="py-3 px-4">ห้องเรียนที่ต้องใช้</th>
                  <th className="py-3 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects
                  .filter(s => 
                    s.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    s.nameTh.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{sub.subjectCode}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.colorHex }} />
                          <span>{sub.nameTh}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{sub.department}</td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-700">{sub.theoryPeriods}</td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-700">{sub.practicePeriods}</td>
                      <td className="py-3 px-4 text-center font-bold text-blue-600">{sub.credits}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-900">{sub.totalPeriodsPerWeek}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {ROOM_TYPE_NAMES[sub.requiredRoomType] || sub.requiredRoomType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteSubject(sub.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="ลบวิชานี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TEACHERS TAB */}
        {activeTab === "teachers" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">รหัส</th>
                  <th className="py-3 px-4">ชื่อ-สกุล</th>
                  <th className="py-3 px-4">แผนกวิชา</th>
                  <th className="py-3 px-4">วุฒิการศึกษา</th>
                  <th className="py-3 px-4">หน้าที่พิเศษ</th>
                  <th className="py-3 px-4 text-center">คาบสอนสูงสุด</th>
                  <th className="py-3 px-4">คาบที่ไม่สะดวกสอน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers
                  .filter(t => t.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(tch => (
                    <tr key={tch.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-600">{tch.teacherCode}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{tch.fullName}</td>
                      <td className="py-3 px-4 text-slate-600">{tch.department}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{tch.education || "-"}</td>
                      <td className="py-3 px-4 text-xs text-slate-500">{tch.specialDuty || "-"}</td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">{tch.maxPeriodsPerWeek} คาบ/สัปดาห์</td>
                      <td className="py-3 px-4">
                        {tch.unavailableSlots && tch.unavailableSlots.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {tch.unavailableSlots.map((u, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded text-[11px] bg-red-50 text-red-700 border border-red-200">
                                วันที่ {u.dayOfWeek} คาบ {u.periodNumber} ({u.reason || "ติดภารกิจ"})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-600 font-medium">พร้อมสอนทุกคาบ</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CLASSROOMS TAB */}
        {activeTab === "classrooms" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">รหัสห้อง</th>
                  <th className="py-3 px-4">ชื่อห้องเรียน</th>
                  <th className="py-3 px-4">อาคาร / สถานที่ตั้ง</th>
                  <th className="py-3 px-4 text-center">ความจุ (คน)</th>
                  <th className="py-3 px-4">ประเภทห้อง</th>
                  <th className="py-3 px-4 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classrooms.map(room => (
                  <tr key={room.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{room.roomCode}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{room.roomName}</td>
                    <td className="py-3 px-4 text-slate-600">{room.building}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800">{room.capacity} ที่นั่ง</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                        {ROOM_TYPE_NAMES[room.roomType] || room.roomType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        พร้อมใช้งาน
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* STUDENT GROUPS TAB */}
        {activeTab === "groups" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">รหัสกลุ่ม</th>
                  <th className="py-3 px-4">ชื่อกลุ่มผู้เรียน</th>
                  <th className="py-3 px-4">ระดับชั้น</th>
                  <th className="py-3 px-4">แผนกวิชา</th>
                  <th className="py-3 px-4 text-center">จำนวนนักเรียน</th>
                  <th className="py-3 px-4">ห้องประจำ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {groups.map(grp => (
                  <tr key={grp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-blue-700">{grp.groupCode}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{grp.groupName}</td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{grp.gradeLevel}</td>
                    <td className="py-3 px-4 text-slate-600">{grp.department}</td>
                    <td className="py-3 px-4 text-center font-bold text-indigo-700">{grp.studentCount} คน</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{grp.defaultClassroomId || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ENROLLMENTS TAB */}
        {activeTab === "enrollments" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">กลุ่มผู้เรียน</th>
                  <th className="py-3 px-4">รหัสวิชา</th>
                  <th className="py-3 px-4">ชื่อรายวิชา</th>
                  <th className="py-3 px-4">ครูผู้สอน</th>
                  <th className="py-3 px-4 text-center">คาบ/สัปดาห์</th>
                  <th className="py-3 px-4">ลักษณะคาบ</th>
                  <th className="py-3 px-4">ห้องที่ต้องการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrollments.map(enr => (
                  <tr key={enr.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-blue-700">{enr.studentGroupCode}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{enr.subjectCode}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{enr.subjectNameTh}</td>
                    <td className="py-3 px-4 text-slate-800">{enr.teacherName}</td>
                    <td className="py-3 px-4 text-center font-black text-rose-600">{enr.periodsPerWeek} คาบ</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {enr.preferredConsecutivePeriods === 2 ? "คาบคู่ (2 คาบติดกัน)" : "คาบเดี่ยว"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-600">
                      {ROOM_TYPE_NAMES[enr.requiredRoomType] || enr.requiredRoomType}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
