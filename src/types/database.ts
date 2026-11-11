export type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

export interface UserProfile {
  id: string; // Firebase Auth UID
  email: string;
  role: UserRole;
  displayName: string;
  avatarUrl?: string;
  linkedTeacherId?: string; // Links to Teacher.id
  linkedGroupId?: string;   // Links to StudentGroup.id
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AcademicTerm {
  id: string; // e.g. "2569-1"
  academicYear: string; // "2569"
  semester: number; // 1 or 2
  name: string; // "ภาคเรียนที่ 1 ปีการศึกษา 2569"
  isActive: boolean;
  daysPerWeek: number[]; // [1, 2, 3, 4, 5] (1=Monday ... 5=Friday)
  periodsPerDay: number; // 9 or 10 periods
  startDate?: string;
  endDate?: string;
  createdAt: number;
  updatedAt: number;
}

export type RoomType = "GENERAL" | "COMPUTER_LAB" | "SCIENCE_LAB" | "WORKSHOP" | "GYM";

export const ROOM_TYPE_NAMES: Record<RoomType, string> = {
  GENERAL: "ห้องเรียนทั่วไป / บรรยาย",
  COMPUTER_LAB: "ห้องปฏิบัติการคอมพิวเตอร์",
  SCIENCE_LAB: "ห้องปฏิบัติการวิทยาศาสตร์",
  WORKSHOP: "โรงฝึกงาน / ปฏิบัติการช่าง",
  GYM: "โรงยิมเนเซียม / สนามกีฬา",
};

export interface Subject {
  id: string; // e.g. "SUB_31901_2008"
  subjectCode: string; // "31901-2008"
  nameTh: string; // "การพัฒนาเว็บแอปพลิเคชัน"
  nameEn?: string;
  department: string; // "เทคโนโลยีสารสนเทศ"
  credits: number; // หน่วยกิต (น.)
  theoryPeriods: number; // ทฤษฎี (ท.)
  practicePeriods: number; // ปฏิบัติ (ป.)
  totalPeriodsPerWeek: number; // คาบรวมต่อสัปดาห์ (ช. = ท+ป)
  preferredConsecutivePeriods: number; // 1 = เดี่ยว, 2 = คาบคู่
  requiredRoomType: RoomType;
  colorHex: string; // e.g. "#3B82F6"
  createdAt: number;
  updatedAt: number;
}

export interface UnavailableSlot {
  dayOfWeek: number; // 1=Mon ... 7=Sun
  periodNumber: number; // 1..10
  reason?: string;
}

export interface Teacher {
  id: string; // e.g. "TCH_PARINYA"
  teacherCode: string;
  prefix: string;
  firstName: string;
  lastName: string;
  fullName: string;
  department: string;
  education?: string; // e.g. "วท.ม. เทคโนโลยีสารสนเทศ"
  specialDuty?: string; // e.g. "หัวหน้างานศูนย์ข้อมูลสารสนเทศ"
  phone?: string;
  email?: string;
  maxPeriodsPerWeek: number; // e.g. 22
  qualifiedSubjectCodes: string[];
  unavailableSlots: UnavailableSlot[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Classroom {
  id: string; // e.g. "ROOM_IT5"
  roomCode: string; // "IT5"
  roomName: string;
  building: string;
  capacity: number; // seated capacity
  roomType: RoomType;
  roomTypeNameTh: string;
  isAvailable: boolean;
  createdAt: number;
  updatedAt: number;
}

export type SlotType = "LEARN" | "BREAK" | "ACTIVITY";

export interface TimeSlot {
  id: string; // e.g. "D1_P1"
  dayOfWeek: number; // 1..5 (or 7)
  dayNameTh: string;
  dayShortTh: string;
  periodNumber: number; // 1..10
  startTime: string; // "08:30"
  endTime: string; // "09:30"
  slotType: SlotType;
  isLocked: boolean; // Locked against auto scheduling
}

export interface StudentGroup {
  id: string; // e.g. "GRP_IT_1_2"
  groupCode: string; // e.g. "สปT.1/2"
  groupName: string; // e.g. "สปT.1/2 (จบ ม.6, ต่างสาขา)"
  gradeLevel: string; // e.g. "ปวส.1"
  department: string;
  studentCount: number;
  defaultClassroomId?: string;
  parentGroupId?: string | null;
  linkedGroupIds?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface CourseEnrollment {
  id: string;
  termId: string;
  studentGroupId: string;
  studentGroupCode: string;
  studentCount: number;
  subjectId: string;
  subjectCode: string;
  subjectNameTh: string;
  teacherId: string;
  teacherName: string;
  periodsPerWeek: number;
  preferredConsecutivePeriods: number; // 1 or 2
  requiredRoomType: RoomType;
  assignedPeriodCount?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ScheduleItem {
  id: string; // e.g. "SCH_2569_1_D1_P1_G1"
  termId: string;
  dayOfWeek: number;
  dayNameTh: string;
  periodNumber: number;
  startTime: string;
  endTime: string;
  
  studentGroupId: string;
  studentGroupCode: string;
  studentCount: number;
  
  subjectId: string;
  subjectCode: string;
  subjectNameTh: string;
  colorHex: string;
  
  teacherId: string;
  teacherName: string;
  
  classroomId: string;
  roomCode: string;
  roomType: RoomType;
  
  // High-performance deterministic conflict keys
  groupSlotKey: string;   // `{termId}_D{dayOfWeek}_P{periodNumber}_G{studentGroupId}`
  teacherSlotKey: string; // `{termId}_D{dayOfWeek}_P{periodNumber}_T{teacherId}`
  roomSlotKey: string;    // `{termId}_D{dayOfWeek}_P{periodNumber}_R{classroomId}`
  
  isManualOverride?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SystemSettings {
  institutionName: string; // e.g. "วิทยาลัยเทคนิคระยอง"
  institutionNameEn?: string;
  vocationalCommissionName: string; // "สำนักงานคณะกรรมการการอาชีวศึกษา"
  logoUrl?: string;
  directorName: string;
  academicDeputyName: string;
  curriculumHeadName: string;
  departmentHeadName?: string;
  defaultTermId: string;
  quickTestMode: boolean;
  updatedAt: number;
}

