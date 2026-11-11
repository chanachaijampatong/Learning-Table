import { ScheduleItem, Teacher, Classroom, TimeSlot } from "@/types/database";

export interface ConflictValidationResult {
  isValid: boolean;
  conflictType?: "TEACHER_BUSY" | "ROOM_BUSY" | "GROUP_BUSY" | "TEACHER_UNAVAILABLE" | "LOCKED_SLOT";
  conflictReason?: string;
}

/**
 * Validates moving a schedule item to an empty target slot (targetDay, targetPeriod)
 */
export function validateCandidatePlacement(
  item: ScheduleItem,
  targetDay: number,
  targetPeriod: number,
  existingSchedules: ScheduleItem[],
  teachers: Teacher[],
  timeslots: TimeSlot[]
): ConflictValidationResult {
  // 1. Check if target slot is locked (e.g. Lunch Break or Activity)
  const slot = timeslots.find(t => t.dayOfWeek === targetDay && t.periodNumber === targetPeriod);
  if (slot?.isLocked || slot?.slotType !== "LEARN") {
    return {
      isValid: false,
      conflictType: "LOCKED_SLOT",
      conflictReason: `คาบที่ ${targetPeriod} วัน${item.dayNameTh} ถูกล็อก (เป็น${slot?.slotType === "BREAK" ? "เวลาพักกลางวัน" : "กิจกรรมกลาง"}) ไม่สามารถจัดวิชาลงได้`,
    };
  }

  // Filter out the item itself
  const otherSchedules = existingSchedules.filter(s => s.id !== item.id);

  // 2. Check Teacher Conflict
  const teacherConflict = otherSchedules.find(
    s => s.dayOfWeek === targetDay && s.periodNumber === targetPeriod && s.teacherId === item.teacherId
  );
  if (teacherConflict) {
    return {
      isValid: false,
      conflictType: "TEACHER_BUSY",
      conflictReason: `ครูผู้สอน (${item.teacherName}) ติดสอนกลุ่ม ${teacherConflict.studentGroupCode} (วิชา ${teacherConflict.subjectCode}) ในคาบนี้อยู่แล้ว`,
    };
  }

  // 3. Check Teacher Unavailable Slots
  const teacher = teachers.find(t => t.id === item.teacherId);
  if (teacher?.unavailableSlots) {
    const unavail = teacher.unavailableSlots.find(
      u => u.dayOfWeek === targetDay && u.periodNumber === targetPeriod
    );
    if (unavail) {
      return {
        isValid: false,
        conflictType: "TEACHER_UNAVAILABLE",
        conflictReason: `ครูผู้สอน (${item.teacherName}) มีภารกิจไม่สะดวกสอนในคาบนี้: ${unavail.reason || "ติดภารกิจ"}`,
      };
    }
  }

  // 4. Check Classroom Conflict
  const roomConflict = otherSchedules.find(
    s => s.dayOfWeek === targetDay && s.periodNumber === targetPeriod && s.classroomId === item.classroomId
  );
  if (roomConflict) {
    return {
      isValid: false,
      conflictType: "ROOM_BUSY",
      conflictReason: `ห้องเรียน (${item.roomCode}) ถูกใช้งานโดยกลุ่ม ${roomConflict.studentGroupCode} (วิชา ${roomConflict.subjectCode}) ในคาบนี้อยู่แล้ว`,
    };
  }

  // 5. Check Student Group Conflict
  const groupConflict = otherSchedules.find(
    s => s.dayOfWeek === targetDay && s.periodNumber === targetPeriod && s.studentGroupId === item.studentGroupId
  );
  if (groupConflict) {
    return {
      isValid: false,
      conflictType: "GROUP_BUSY",
      conflictReason: `กลุ่มผู้เรียน (${item.studentGroupCode}) มีเรียนวิชา ${groupConflict.subjectCode} (${groupConflict.subjectNameTh}) ในคาบนี้อยู่แล้ว`,
    };
  }

  return { isValid: true };
}

/**
 * Validates swapping two schedule items
 */
export function validateSwap(
  itemA: ScheduleItem,
  itemB: ScheduleItem,
  existingSchedules: ScheduleItem[],
  teachers: Teacher[],
  timeslots: TimeSlot[]
): ConflictValidationResult {
  // Check if moving itemA to itemB's position is valid (excluding itemB)
  const schedulesExcludingBoth = existingSchedules.filter(s => s.id !== itemA.id && s.id !== itemB.id);

  const checkA = validateCandidatePlacement(
    itemA,
    itemB.dayOfWeek,
    itemB.periodNumber,
    schedulesExcludingBoth,
    teachers,
    timeslots
  );
  if (!checkA.isValid) return checkA;

  const checkB = validateCandidatePlacement(
    itemB,
    itemA.dayOfWeek,
    itemA.periodNumber,
    schedulesExcludingBoth,
    teachers,
    timeslots
  );
  if (!checkB.isValid) return checkB;

  return { isValid: true };
}

