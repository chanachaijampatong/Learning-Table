# 📋 แผนการพัฒนาและสถาปัตยกรรมระบบ: Learning-Table
> **ระบบจัดตารางการเรียนการสอนอัตโนมัติอัจฉริยะ (Smart Class & Course Scheduler)**  
> มาตรฐานสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) และกระทรวงศึกษาธิการ

---

## 📑 สารบัญ
1. [ภาพรวมโครงการและเป้าหมาย (Project Overview)](#1-ภาพรวมโครงการและเป้าหมาย)
2. [สถาปัตยกรรมระบบและเทคโนโลยี (System Architecture & Tech Stack)](#2-สถาปัตยกรรมระบบและเทคโนโลยี)
3. [การตั้งค่า Firebase Configuration](#3-การตั้งค่า-firebase-configuration)
4. [การออกแบบฐานข้อมูล Cloud Firestore (Collections & Data Schema)](#4-การออกแบบฐานข้อมูล-cloud-firestore)
5. [ดัชนีและการคิวรี (Composite Indexes & Security Rules)](#5-ดัชนีและการคิวรี)
6. [การออกแบบอัลกอริทึมจัดตารางสอน (Scheduling Engine Design)](#6-การออกแบบอัลกอริทึมจัดตารางสอน)
7. [ผังกระบวนการทำงานและโครงสร้างหน้าจอ (User Flows & UI/UX Structure)](#7-ผังกระบวนการทำงานและโครงสร้างหน้าจอ)
8. [แผนงานพัฒนาแบ่งตามระยะ (Development Roadmap & Milestones)](#8-แผนงานพัฒนาแบ่งตามระยะ)

---

## 1. ภาพรวมโครงการและเป้าหมาย

โครงการ **Learning-Table** เป็นเว็บแอปพลิเคชันจัดตารางสอนอัตโนมัติที่ช่วยลดภาระงานของฝ่ายวิชาการในการจัดตารางเรียน โดยมีฟังก์ชันสำคัญ:
* **Zero-Conflict Auto Scheduling:** แก้ไขปัญหาคาบซ้ำซ้อน 3 มิติ (ครูชน, ห้องชน, กลุ่มเรียนชน) ด้วยอัลกอริทึม Constraint Satisfaction Problem (CSP) + Heuristic MRV Backtracking
* **Real-time Live Swap:** สลับคาบเรียนบนตารางแบบโต้ตอบ พร้อมระบบตรวจจับตารางชนทันที
* **Multi-View Timetable:** แสดงตารางเรียน 4 รูปแบบ (กลุ่มผู้เรียน, ครูผู้สอน, ห้องเรียน, รายวิชา)
* **Standard Vocational Print Form:** พิมพ์แบบฟอร์มทางการราชการ/สอศ. ขนาด A4 แนวนอน (1 หน้าเป๊ะ 100%) พร้อมตาราง ท-ป-น-ช และจุดลงนาม 4 ฝ่าย
* **Role-Based Access Control:** สิทธิ์ 3 ระดับ (ผู้ดูแลระบบวิชาการ, ครูผู้สอน, นักเรียน) และ Quick Demo Login

---

## 2. สถาปัตยกรรมระบบและเทคโนโลยี

```
+-------------------------------------------------------------------------+
|                              LEARNING-TABLE                             |
+-------------------------------------------------------------------------+
| [Frontend] Next.js 15 (App Router, React 19, TypeScript)                |
|  - Tailwind CSS + Lucide React Icons (Responsive: Web/Tablet/Mobile)    |
|  - ExcelJS (XLSX Import/Export) + jsPDF/html2canvas (A4 Print Export)   |
|  - Zustand / React Context (State Management for Drag/Drop & Realtime)  |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
| [Scheduling Core Engine]                                                |
|  - CSP (Constraint Satisfaction Problem) Solver                         |
|  - MRV (Minimum Remaining Values) + LCV (Least Constraining Value)      |
|  - Conflict Matrix Hash Table Cache for O(1) Constraint Verification    |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
| [Backend & Database] Google Firebase Ecosystem                          |
|  - Firebase Authentication: Email/Password + Role Claims                |
|  - Cloud Firestore: NoSQL Collections with Composite Indexes            |
|  - Firebase Cloud Storage: สัญลักษณ์วิทยาลัย, ไฟล์นำเข้า-ส่งออก          |
+-------------------------------------------------------------------------+
```

---

## 3. การตั้งค่า Firebase Configuration

ข้อมูลเชื่อมต่อ Firebase สำหรับโปรเจกต์:

```typescript
// src/lib/firebase/config.ts
export const firebaseConfig = {
  apiKey: "AIzaSyDin4i5Qtv-f1FMr3itesZohmQPywqlI50",
  authDomain: "learning-time-cf6d1.firebaseapp.com",
  projectId: "learning-time-cf6d1",
  storageBucket: "learning-time-cf6d1.firebasestorage.app",
  messagingSenderId: "181098948366",
  appId: "1:181098948366:web:b50092b08ac2c52ac9195f"
};
```

---

## 4. การออกแบบฐานข้อมูล Cloud Firestore

ระบบจัดเก็บข้อมูลใน Firestore ประกอบด้วย **9 คอลเลกชันหลัก** เพื่อให้รองรับความเร็วในการอ่านข้อมูลและการตรวจจับตารางชนอย่างมีประสิทธิภาพ:

```mermaid
erDiagram
    academic_terms ||--o{ course_enrollments : "has"
    academic_terms ||--o{ schedules : "contains"
    student_groups ||--o{ course_enrollments : "enrolls"
    student_groups ||--o{ schedules : "assigned"
    subjects ||--o{ course_enrollments : "defines"
    subjects ||--o{ schedules : "scheduled"
    teachers ||--o{ course_enrollments : "teaches"
    teachers ||--o{ schedules : "assigned"
    classrooms ||--o{ schedules : "hosts"
    users ||--o| teachers : "links_to"
    users ||--o| student_groups : "links_to"
```

### 1) คอลเลกชัน `users` (ผู้ใช้งานและสิทธิ์การเข้าถึง)
* **Path:** `/users/{userId}`
* **วัตถุประสงค์:** จัดเก็บข้อมูลผู้ใช้งาน กำหนดสิทธิ์ Role-Based Access Control

```typescript
export type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

export interface UserProfile {
  id: string; // Firebase Auth UID
  email: string;
  role: UserRole; // ADMIN = วิชาการ, TEACHER = ครูผู้สอน, STUDENT = นักเรียน
  displayName: string;
  avatarUrl?: string;
  linkedTeacherId?: string; // ถ้าเป็น TEACHER จะอ้างอิง Document ID ใน teachers
  linkedGroupId?: string;   // ถ้าเป็น STUDENT จะอ้างอิง Document ID ใน student_groups
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
```

---

### 2) คอลเลกชัน `academic_terms` (ปีการศึกษาและภาคเรียน)
* **Path:** `/academic_terms/{termId}`
* **วัตถุประสงค์:** กำหนดโครงสร้างเวลาของภาคเรียนที่กำลังจัดตาราง

```typescript
export interface AcademicTerm {
  id: string; // เช่น "2569-1"
  academicYear: string; // "2569"
  semester: number; // 1 หรือ 2
  name: string; // "ภาคเรียนที่ 1 ปีการศึกษา 2569"
  isActive: boolean; // ภาคเรียนปัจจุบัน
  daysPerWeek: number[]; // [1, 2, 3, 4, 5] (1=จันทร์, 2=อังคาร ... 5=ศุกร์)
  periodsPerDay: number; // 9 หรือ 10 คาบ
  startDate?: string; // วันเริ่มภาคเรียน (YYYY-MM-DD)
  endDate?: string; // วันสิ้นสุดภาคเรียน (YYYY-MM-DD)
  createdAt: number;
  updatedAt: number;
}
```

---

### 3) คอลเลกชัน `subjects` (รายชื่อหลักสูตรและรายวิชา)
* **Path:** `/subjects/{subjectId}`
* **วัตถุประสงค์:** กำหนดรายวิชา ทักษะ ท-ป-น-ช และประเภทห้องเรียนที่ต้องใช้

```typescript
export type RoomType = "GENERAL" | "COMPUTER_LAB" | "SCIENCE_LAB" | "WORKSHOP" | "GYM";

export interface Subject {
  id: string; // เช่น "SUB_31901_2008"
  subjectCode: string; // รหัสวิชา เช่น "31901-2008"
  nameTh: string; // ชื่อวิชาภาษาไทย เช่น "การพัฒนาเว็บแอปพลิเคชัน"
  nameEn?: string; // ชื่อวิชาภาษาอังกฤษ
  department: string; // แผนกวิชา เช่น "เทคโนโลยีสารสนเทศ"
  credits: number; // หน่วยกิต (น.) เช่น 3
  theoryPeriods: number; // คาบทฤษฎี (ท.) เช่น 2
  practicePeriods: number; // คาบปฏิบัติ (ป.) เช่น 2
  totalPeriodsPerWeek: number; // คาบรวมต่อสัปดาห์ (ช.) เช่น 4 (ท+ป)
  preferredConsecutivePeriods: number; // 1 = คาบเดี่ยว, 2 = จัดเป็นบล็อก 2 คาบติดกัน
  requiredRoomType: RoomType; // ประเภทห้องเรียนที่ต้องใช้
  colorHex: string; // สีแท็กประจำวิชาบนตาราง เช่น "#3B82F6"
  createdAt: number;
  updatedAt: number;
}
```

---

### 4) คอลเลกชัน `teachers` (ครูผู้สอน)
* **Path:** `/teachers/{teacherId}`
* **วัตถุประสงค์:** จัดเก็บข้อมูลครู ข้อจำกัดเวลา และวิชาที่สามารถสอนได้

```typescript
export interface UnavailableSlot {
  dayOfWeek: number; // 1=จันทร์ ... 7=อาทิตย์
  periodNumber: number; // คาบที่ เช่น 1 ถึง 10
  reason?: string; // เช่น "ติดภารกิจประชุมบริหาร", "ไปราชการ"
}

export interface Teacher {
  id: string; // เช่น "TCH_PARINYA"
  teacherCode: string; // เช่น "T0104"
  prefix: string; // เช่น "นาย", "ดร."
  firstName: string;
  lastName: string;
  fullName: string; // "นายปริญญา ชัยชนะ"
  department: string; // "เทคโนโลยีสารสนเทศ"
  education?: string; // วุฒิการศึกษา เช่น "วท.ม. วิทยาการคอมพิวเตอร์"
  specialDuty?: string; // หน้าที่พิเศษ เช่น "หัวหน้างานศูนย์ข้อมูลสารสนเทศ"
  phone?: string;
  email?: string;
  maxPeriodsPerWeek: number; // คาบสอนสูงสุดต่อสัปดาห์ เช่น 22 หรือ 30
  qualifiedSubjectCodes: string[]; // รหัสวิชาที่ครูท่านนี้สอนได้
  unavailableSlots: UnavailableSlot[]; // คาบเวลาที่ครูไม่สะดวกสอน
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}
```

---

### 5) คอลเลกชัน `classrooms` (ห้องเรียนและห้องปฏิบัติการ)
* **Path:** `/classrooms/{classroomId}`
* **วัตถุประสงค์:** จัดการห้องเรียน สถานที่ตั้ง ประเภทห้อง และขีดความจุ

```typescript
export interface Classroom {
  id: string; // เช่น "ROOM_IT5"
  roomCode: string; // "IT5", "321", "LAB-COM1"
  roomName: string; // "ห้องปฏิบัติการคอมพิวเตอร์ 5"
  building: string; // "อาคาร 3 ชั้น 2"
  capacity: number; // ความจุที่นั่ง (คน) เช่น 40
  roomType: RoomType; // "GENERAL" | "COMPUTER_LAB" | "SCIENCE_LAB" | "WORKSHOP" | "GYM"
  roomTypeNameTh: string; // "ห้องปฏิบัติการคอมพิวเตอร์"
  isAvailable: boolean; // เปิดใช้งานหรือไม่
  createdAt: number;
  updatedAt: number;
}
```

---

### 6) คอลเลกชัน `timeslots` (ตารางเวลาคาบเรียนมาตรฐาน)
* **Path:** `/timeslots/{timeslotId}`
* **วัตถุประสงค์:** โครงสร้างคาบเวลาในแต่ละวันของสัปดาห์

```typescript
export type SlotType = "LEARN" | "BREAK" | "ACTIVITY";

export interface TimeSlot {
  id: string; // เช่น "D1_P1" (Day 1, Period 1)
  dayOfWeek: number; // 1 (จันทร์) ถึง 7 (อาทิตย์)
  dayNameTh: string; // "จันทร์", "อังคาร"
  dayShortTh: string; // "จ.", "อ."
  periodNumber: number; // 1 ถึง 10
  startTime: string; // "08:30"
  endTime: string; // "09:30"
  slotType: SlotType; // LEARN (เรียนปกติ), BREAK (พักกลางวัน), ACTIVITY (หน้าเสาธง/โฮมรูม)
  isLocked: boolean; // ห้ามจัดวิชาลงทับ (สำหรับคาบพัก หรือกิจกรรม)
}
```

---

### 7) คอลเลกชัน `student_groups` (กลุ่มผู้เรียน / ห้องเรียน)
* **Path:** `/student_groups/{groupId}`
* **วัตถุประสงค์:** จัดการกลุ่มผู้เรียน ระดับชั้น และกลุ่มที่เรียนร่วมกัน

```typescript
export interface StudentGroup {
  id: string; // เช่น "GRP_IT_1_2"
  groupCode: string; // เช่น "สปT.1/2"
  groupName: string; // เช่น "สปT.1/2 (จบ ม.6, ต่างสาขา)"
  gradeLevel: string; // "ปวช.1", "ปวส.1", "ปวส.2"
  department: string; // "แผนกวิชาเทคโนโลยีสารสนเทศ"
  studentCount: number; // จำนวนนักเรียนในกลุ่ม เช่น 29
  defaultClassroomId?: string; // ห้องประจำกลุ่ม (ถ้ามี)
  parentGroupId?: string | null;
  linkedGroupIds?: string[]; // กลุ่มเรียนร่วม เพื่อป้องกันตารางชนกัน
  createdAt: number;
  updatedAt: number;
}
```

---

### 8) คอลเลกชัน `course_enrollments` (แผนการเรียนที่ต้องจัดลงตาราง)
* **Path:** `/course_enrollments/{enrollmentId}`
* **วัตถุประสงค์:** บันทึกภาระงานสอนที่ต้องนำไปจัดลงตารางในแต่ละภาคเรียน

```typescript
export interface CourseEnrollment {
  id: string; // UUID
  termId: string; // อ้างอิง academic_terms
  studentGroupId: string; // อ้างอิง student_groups
  studentGroupCode: string; // "สปT.1/2"
  studentCount: number; // จำนวนนักเรียน
  subjectId: string; // อ้างอิง subjects
  subjectCode: string; // "31901-2008"
  subjectNameTh: string; // "การพัฒนาเว็บแอปพลิเคชัน"
  teacherId: string; // อ้างอิง teachers
  teacherName: string; // "นายปริญญา ชัยชนะ"
  periodsPerWeek: number; // จำนวนคาบต่อสัปดาห์ (เช่น 4)
  preferredConsecutivePeriods: number; // 1 หรือ 2 (คาบคู่)
  requiredRoomType: RoomType; // "COMPUTER_LAB"
  assignedPeriodCount?: number; // จำนวนคาบที่จัดลงตารางแล้ว (สำหรับการติดตาม)
  createdAt: number;
  updatedAt: number;
}
```

---

### 9) คอลเลกชัน `schedules` (ผลลัพธ์ตารางสอนที่จัดแล้ว)
* **Path:** `/schedules/{scheduleItemId}`
* **วัตถุประสงค์:** ผลการจัดคาบเรียนจริง พร้อม Conflict Key สำหรับสืบค้นในระดับ $O(1)$

```typescript
export interface ScheduleItem {
  id: string; // เช่น "SCH_2569_1_D1_P3_GRP_IT_1_2"
  termId: string; // "2569-1"
  dayOfWeek: number; // 1=จันทร์ ... 5=ศุกร์
  dayNameTh: string; // "จันทร์"
  periodNumber: number; // คาบที่ 1-10
  startTime: string; // "10:30"
  endTime: string; // "11:30"
  
  // ข้อมูลกลุ่มเรียน
  studentGroupId: string;
  studentGroupCode: string;
  studentCount: number;
  
  // ข้อมูลวิชา
  subjectId: string;
  subjectCode: string;
  subjectNameTh: string;
  colorHex: string;
  
  // ข้อมูลครู
  teacherId: string;
  teacherName: string;
  
  // ข้อมูลห้องเรียน
  classroomId: string;
  roomCode: string;
  roomType: RoomType;

  // คีย์ความเร็วสูงสำหรับตรวจจับตารางชน (Deterministic Hash Keys)
  groupSlotKey: string;   // รูปแบบ: `{termId}_D{dayOfWeek}_P{periodNumber}_G{studentGroupId}`
  teacherSlotKey: string; // รูปแบบ: `{termId}_D{dayOfWeek}_P{periodNumber}_T{teacherId}`
  roomSlotKey: string;    // รูปแบบ: `{termId}_D{dayOfWeek}_P{periodNumber}_R{classroomId}`
  
  isManualOverride: boolean; // เป็นคาบที่ผู้ใช้ขยับเองหรือไม่
  createdAt: number;
  updatedAt: number;
}
```

---

### 10) คอลเลกชัน `system_settings` (การตั้งค่าทั่วไปและข้อมูลสถานศึกษา)
* **Path:** `/system_settings/general`

```typescript
export interface SystemSettings {
  institutionName: string; // เช่น "วิทยาลัยเทคนิคระยอง"
  institutionNameEn?: string;
  vocationalCommissionName: string; // "สำนักงานคณะกรรมการการอาชีวศึกษา"
  logoUrl: string; // URL โลโก้ สอศ.
  directorName: string; // ผู้อำนวยการสถานศึกษา
  academicDeputyName: string; // รองผู้อำนวยการฝ่ายวิชาการ
  curriculumHeadName: string; // หัวหน้างานพัฒนาหลักสูตรฯ
  defaultTermId: string; // ภาคเรียนที่เปิดใช้งานหลัก
  quickTestMode: boolean; // เปิดปุ่ม Quick Login 3 บทบาท
}
```

---

## 5. ดัชนีและการคิวรี (Composite Indexes & Security Rules)

### Composite Indexes (firestore.indexes.json)
```json
{
  "indexes": [
    {
      "collectionGroup": "schedules",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "termId", "order": "ASCENDING" },
        { "fieldPath": "studentGroupId", "order": "ASCENDING" },
        { "fieldPath": "dayOfWeek", "order": "ASCENDING" },
        { "fieldPath": "periodNumber", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "schedules",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "termId", "order": "ASCENDING" },
        { "fieldPath": "teacherId", "order": "ASCENDING" },
        { "fieldPath": "dayOfWeek", "order": "ASCENDING" },
        { "fieldPath": "periodNumber", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "schedules",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "termId", "order": "ASCENDING" },
        { "fieldPath": "classroomId", "order": "ASCENDING" },
        { "fieldPath": "dayOfWeek", "order": "ASCENDING" },
        { "fieldPath": "periodNumber", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## 6. การออกแบบอัลกอริทึมจัดตารางสอน (Scheduling Engine Design)

### 6.1 โครงสร้าง CSP Solver
อัลกอริทึมใช้หลักการ **Constraint Satisfaction Problem (CSP)** ผสานกับ **MRV (Minimum Remaining Values)** และ **Backtracking Search**:

```mermaid
flowchart TD
    A[รับ Course Enrollments & กฎเกณฑ์] --> B[แตกเป็น Lesson Units: คาบคู่ / คาบเดี่ยว]
    B --> C[เรียงลำดับความสำคัญ Heuristic MRV]
    C --> C1[1. ห้องปฏิบัติการเฉพาะทาง]
    C --> C2[2. วิชาคาบคู่ 2 คาบติดกัน]
    C --> C3[3. ครูที่มีข้อจำกัดเวลามากที่สุด]
    
    C1 & C2 & C3 --> D[เลือก Lesson Unit ถัดไป]
    D --> E[ค้นหา Timeslot & Room ที่เข้าเกณฑ์]
    
    E --> F{ผ่าน Hard Constraints หรือไม่?}
    F -- ไม่ผ่าน --> G[ลอง Slot/Room ถัดไป]
    G --> E
    
    F -- ผ่าน --> H[คำนวณ Soft Score: กระจายวัน, ลดฟันหลอ]
    H --> I[วาง Lesson Unit ลงตารางชั่วคราว]
    I --> J{จัดครบทุกวิชาหรือยัง?}
    J -- ยังไม่ครบ --> D
    J -- ครบแล้ว --> K[บันทึกลง Cloud Firestore ใน Batch]
    
    G -- ไม่มีทางเลือกเหลือ --> L[Backtrack: ย้อนกลับไปปรับ Unit ก่อนหน้า]
```

### 6.2 กฎเกณฑ์ที่ตรวจสอบ (Hard vs Soft Constraints)
* **Hard Constraints (Zero Tolerance):**
  1. `Teacher Conflict = 0`: ครูต้องไม่สอนซ้อนคาบ และไม่ลงใน `unavailableSlots`
  2. `Room Conflict = 0`: ห้องเรียนต้องไม่ถูกใช้ซ้ำในคาบเดียวกัน
  3. `Student Group Conflict = 0`: กลุ่มเรียน (และกลุ่มเชื่อมโยงใน `linkedGroupIds`) ต้องไม่เรียนซ้อนคาบ
  4. `Room Type Matching`: ประเภทห้องต้องตรงกับ `requiredRoomType`
  5. `Room Capacity Check`: ความจุห้อง $\ge$ จำนวนนักเรียน
  6. `Activity/Break Lock`: ห้ามจัดวิชาลงในคาบพักหรือกิจกรรมหน้าเสาธง
* **Soft Constraints (Optimization Scoring):**
  1. กระจายวิชาเดี่ยวไม่ให้กระจุกในวันเดียวกัน
  2. ลดคาบว่าง (Idle/Gap Periods) ระหว่างวันของนักเรียนและครู
  3. เกลี่ยชั่วโมงสอนของครูแต่ละวันให้สมดุล

---

## 7. ผังกระบวนการทำงานและโครงสร้างหน้าจอ

### แผนผังหน้าจอระบบ (Site Architecture)
* `/login` : หน้าเข้าสู่ระบบ พร้อมแถบ **Quick Test Login 3 บทบาท** (วิชาการ, ครู, นักเรียน)
* `/dashboard` : ภาพรวมสถิติ จำนวนวิชา, ครู, ห้องเรียน, สถานะการจัดตาราง
* `/management` : จัดการข้อมูลพื้นฐาน (CRUD + Excel Import)
  * `/management/terms` : ปีการศึกษาและภาคเรียน
  * `/management/subjects` : รายวิชา (ท-ป-น-ช)
  * `/management/teachers` : ครูผู้สอนและคาบไม่สะดวก
  * `/management/classrooms` : ห้องเรียนและความจุ
  * `/management/groups` : กลุ่มเรียนและระดับชั้น
  * `/management/enrollments` : แผนการเรียนในแต่ละเทอม
* `/scheduler` : หน้ารัน AI จัดตารางอัตโนมัติ (Progress Bar, แสดงผล Conflict Report)
* `/timetables` : แสดงตารางเรียน 4 รูปแบบ (Interactive Matrix พร้อม Real-time Drag/Swap)
  * แท็บ 1: กลุ่มเรียน (Student Group View)
  * แท็บ 2: ครูผู้สอน (Teacher View)
  * แท็บ 3: ห้องเรียน (Classroom View)
  * แท็บ 4: รายวิชา (Subject View)
* `/official-timetable` : แบบฟอร์มทางการราชการ สอศ. สำหรับพิมพ์ A4 แนวนอน (1 หน้าเป๊ะ 100%)

---

## 8. แผนงานพัฒนาแบ่งตามระยะ (Development Roadmap)

| ระยะ (Phase) | รายละเอียดงาน | ผลลัพธ์ที่ได้ |
|---|---|---|
| **Phase 1: Project Setup & Firebase Core** | ติดตั้ง Next.js 15, TypeScript, Tailwind CSS, ติดตั้ง Firebase SDK และทำ Mock/Seed Data | โครงการรันได้, เชื่อมต่อ Firestore สำเร็จ |
| **Phase 2: Master Data Management & Import** | หน้าจัดการข้อมูลหลัก 7 โมดูล + นำเข้าไฟล์ Excel (`xlsx`) ด้วย Template มาตรฐาน | คลังข้อมูลครู, วิชา, ห้อง, กลุ่มเรียน พร้อมใช้งาน |
| **Phase 3: Scheduling Engine (CSP + MRV)** | สร้างอัลกอริทึมจัดตารางสอนอัตโนมัติ และระบบตรวจจับตารางชน | รันจัดตารางได้โดยไม่มีข้อขัดแย้ง 100% |
| **Phase 4: Interactive Matrix & Real-time Swap** | หน้าแสดงผลตารางสอน 4 มุมมอง + ระบบสลับคาบเรียน Live Drag/Click Swap | ผู้ใช้สามารถตรวจดูและปรับขยับคาบได้อย่างอิสระ |
| **Phase 5: Official A4 Vocational Print** | พัฒนาระบบแบบฟอร์มทางการ สอศ. สัดส่วน A4 แนวนอน 285mm x 200mm พร้อมส่งออก PDF/Excel | พิมพ์ตารางสอนทางการ 1 หน้าแนวนอนสมบูรณ์แบบ |
| **Phase 6: Auth RBAC, Verification & Deploy** | ระบบสิทธิ์ 3 ระดับ, Quick Demo Login, Unit/Integration Test และนำขึ้น Vercel/Firebase | ระบบเสร็จสมบูรณ์พร้อมส่งมอบ |

