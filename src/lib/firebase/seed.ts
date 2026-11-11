import { 
  collection, 
  doc, 
  writeBatch, 
  getDocs, 
  query, 
  limit,
  setDoc
} from "firebase/firestore";
import { db } from "./config";
import {
  initialSystemSettings,
  initialAcademicTerms,
  initialSubjects,
  initialTeachers,
  initialClassrooms,
  initialStudentGroups,
  initialCourseEnrollments,
  standardPeriodTimes
} from "./mockData";
import { TimeSlot } from "@/types/database";

export async function isDatabaseSeeded(): Promise<boolean> {
  try {
    const q = query(collection(db, "subjects"), limit(1));
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (error) {
    console.error("Error checking database status:", error);
    return false;
  }
}

export async function seedDemoData(): Promise<{ success: boolean; message: string }> {
  try {
    const batch = writeBatch(db);

    // 1. System Settings
    const settingsRef = doc(db, "system_settings", "general");
    batch.set(settingsRef, initialSystemSettings);

    // 2. Academic Terms
    for (const term of initialAcademicTerms) {
      const termRef = doc(db, "academic_terms", term.id);
      batch.set(termRef, term);
    }

    // 3. Subjects
    for (const sub of initialSubjects) {
      const subRef = doc(db, "subjects", sub.id);
      batch.set(subRef, sub);
    }

    // 4. Teachers
    for (const tch of initialTeachers) {
      const tchRef = doc(db, "teachers", tch.id);
      batch.set(tchRef, tch);
    }

    // 5. Classrooms
    for (const room of initialClassrooms) {
      const roomRef = doc(db, "classrooms", room.id);
      batch.set(roomRef, room);
    }

    // 6. Student Groups
    for (const grp of initialStudentGroups) {
      const grpRef = doc(db, "student_groups", grp.id);
      batch.set(grpRef, grp);
    }

    // 7. Course Enrollments
    for (const enr of initialCourseEnrollments) {
      const enrRef = doc(db, "course_enrollments", enr.id);
      batch.set(enrRef, enr);
    }

    // 8. Timeslots (Mon - Fri, Periods 1 - 10)
    const days = [
      { day: 1, name: "วันจันทร์", short: "จ." },
      { day: 2, name: "วันอังคาร", short: "อ." },
      { day: 3, name: "วันพุธ", short: "พ." },
      { day: 4, name: "วันพฤหัสบดี", short: "พฤ." },
      { day: 5, name: "วันศุกร์", short: "ศ." },
    ];

    for (const day of days) {
      for (const p of standardPeriodTimes) {
        const slotId = `D${day.day}_P${p.period}`;
        const slotRef = doc(db, "timeslots", slotId);
        const slotData: TimeSlot = {
          id: slotId,
          dayOfWeek: day.day,
          dayNameTh: day.name,
          dayShortTh: day.short,
          periodNumber: p.period,
          startTime: p.start,
          endTime: p.end,
          slotType: p.isBreak ? "BREAK" : "LEARN",
          isLocked: !!p.isBreak, // Lock lunch break by default
        };
        batch.set(slotRef, slotData);
      }
    }

    await batch.commit();
    return { success: true, message: "นำเข้าข้อมูลจำลองลง Firestore สำเร็จครบทั้ง 8 คอลเลกชัน!" };
  } catch (error: any) {
    console.error("Failed to seed database:", error);
    return { success: false, message: error?.message || "เกิดข้อผิดพลาดในการ Seed ข้อมูล" };
  }
}

