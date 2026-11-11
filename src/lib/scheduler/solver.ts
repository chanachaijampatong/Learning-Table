import {
  CourseEnrollment,
  Teacher,
  Classroom,
  StudentGroup,
  Subject,
  TimeSlot,
  ScheduleItem,
  RoomType
} from "@/types/database";

export interface LessonUnit {
  unitId: string;
  enrollmentId: string;
  termId: string;
  studentGroupId: string;
  studentGroupCode: string;
  studentCount: number;
  subjectId: string;
  subjectCode: string;
  subjectNameTh: string;
  colorHex: string;
  teacherId: string;
  teacherName: string;
  duration: number; // 1 or 2 periods
  requiredRoomType: RoomType;
  constraintScore: number; // Higher means more constrained (MRV)
}

export interface SolverResult {
  success: boolean;
  schedules: ScheduleItem[];
  unassignedUnits: LessonUnit[];
  totalUnits: number;
  assignedUnits: number;
  conflictReport: string[];
  executionTimeMs: number;
}

export class ScheduleSolver {
  private enrollments: CourseEnrollment[];
  private teachersMap: Map<string, Teacher>;
  private classrooms: Classroom[];
  private classroomsMap: Map<string, Classroom>;
  private studentGroupsMap: Map<string, StudentGroup>;
  private subjectsMap: Map<string, Subject>;
  private timeslots: TimeSlot[];
  private termId: string;

  // Conflict Tracking Sets for O(1) checking
  private teacherSlots: Set<string> = new Set(); // termId_D_P_teacherId
  private roomSlots: Set<string> = new Set();    // termId_D_P_roomId
  private groupSlots: Set<string> = new Set();   // termId_D_P_groupId
  
  // Daily distribution tracking: groupId_D_subjectId -> count
  private groupDailySubjectCount: Map<string, number> = new Map();

  constructor(
    termId: string,
    enrollments: CourseEnrollment[],
    teachers: Teacher[],
    classrooms: Classroom[],
    studentGroups: StudentGroup[],
    subjects: Subject[],
    timeslots: TimeSlot[]
  ) {
    this.termId = termId;
    this.enrollments = enrollments;
    this.teachersMap = new Map(teachers.map(t => [t.id, t]));
    this.classrooms = classrooms.filter(r => r.isAvailable);
    this.classroomsMap = new Map(classrooms.map(r => [r.id, r]));
    this.studentGroupsMap = new Map(studentGroups.map(g => [g.id, g]));
    this.subjectsMap = new Map(subjects.map(s => [s.id, s]));
    this.timeslots = timeslots;
  }

  /**
   * Break CourseEnrollments into LessonUnits (e.g., 4 periods -> two 2-period units)
   */
  private generateLessonUnits(): LessonUnit[] {
    const units: LessonUnit[] = [];

    for (const enr of this.enrollments) {
      const subject = this.subjectsMap.get(enr.subjectId);
      const teacher = this.teachersMap.get(enr.teacherId);
      let remainingPeriods = enr.periodsPerWeek;
      const prefConsecutive = enr.preferredConsecutivePeriods || 2;
      let unitCounter = 1;

      while (remainingPeriods > 0) {
        let duration = 1;
        if (remainingPeriods >= prefConsecutive && prefConsecutive >= 2) {
          duration = prefConsecutive;
        } else if (remainingPeriods >= 2 && prefConsecutive >= 2) {
          duration = 2;
        } else {
          duration = 1;
        }

        // Calculate MRV Constraint Score:
        // +100 for specialized labs (fewer rooms available)
        // +50 for 2-consecutive periods (harder to fit)
        // +10 per teacher unavailable slot
        let score = 0;
        if (enr.requiredRoomType !== "GENERAL") score += 100;
        if (duration === 2) score += 50;
        if (teacher && teacher.unavailableSlots) {
          score += teacher.unavailableSlots.length * 15;
        }

        units.push({
          unitId: `${enr.id}_U${unitCounter++}`,
          enrollmentId: enr.id,
          termId: this.termId,
          studentGroupId: enr.studentGroupId,
          studentGroupCode: enr.studentGroupCode,
          studentCount: enr.studentCount,
          subjectId: enr.subjectId,
          subjectCode: enr.subjectCode,
          subjectNameTh: enr.subjectNameTh,
          colorHex: subject?.colorHex || "#3B82F6",
          teacherId: enr.teacherId,
          teacherName: enr.teacherName,
          duration,
          requiredRoomType: enr.requiredRoomType,
          constraintScore: score,
        });

        remainingPeriods -= duration;
      }
    }

    // Sort by Most Constrained Variable (MRV) first
    return units.sort((a, b) => b.constraintScore - a.constraintScore);
  }

  /**
   * Run the CSP Solver
   */
  public solve(maxBacktrackIterations = 5000): SolverResult {
    const startTime = Date.now();
    const units = this.generateLessonUnits();
    const resultSchedules: ScheduleItem[] = [];
    const unassignedUnits: LessonUnit[] = [];
    const conflictReport: string[] = [];

    // Pre-populate locked timeslots (breaks, activities) into slots map
    const lockedTimeslots = new Map<string, TimeSlot>();
    for (const ts of this.timeslots) {
      if (ts.isLocked || ts.slotType !== "LEARN") {
        lockedTimeslots.set(`D${ts.dayOfWeek}_P${ts.periodNumber}`, ts);
      }
    }

    // Days to schedule (Mon-Fri)
    const days = [1, 2, 3, 4, 5];
    const maxPeriod = 10;

    let iterations = 0;

    const backtrack = (unitIndex: number): boolean => {
      iterations++;
      if (iterations > maxBacktrackIterations) return false;
      if (unitIndex >= units.length) return true; // All assigned!

      const unit = units[unitIndex];
      const teacher = this.teachersMap.get(unit.teacherId);
      const studentGroup = this.studentGroupsMap.get(unit.studentGroupId);

      // Candidate rooms matching requiredRoomType and capacity
      const suitableRooms = this.classrooms.filter(
        r => r.roomType === unit.requiredRoomType && r.capacity >= unit.studentCount
      );

      if (suitableRooms.length === 0) {
        conflictReport.push(
          `ไม่พบห้องเรียนที่ตรงกับประเภท ${unit.requiredRoomType} หรือความจุไม่พอสำหรับ ${unit.studentGroupCode} (${unit.studentCount} คน)`
        );
        return false;
      }

      // Collect candidate positions: (day, startPeriod, room)
      interface CandidatePlacement {
        day: number;
        startPeriod: number;
        room: Classroom;
        softScore: number;
      }
      const candidates: CandidatePlacement[] = [];

      for (const day of days) {
        for (let p = 1; p <= maxPeriod - unit.duration + 1; p++) {
          // 1. Check Hard Constraints for all periods in this block
          let isHardValid = true;

          for (let offset = 0; offset < unit.duration; offset++) {
            const currentPeriod = p + offset;
            const slotKey = `D${day}_P${currentPeriod}`;

            // Check if slot is locked or break
            if (lockedTimeslots.has(slotKey)) {
              isHardValid = false;
              break;
            }

            // Check teacher unavailable slots
            if (teacher?.unavailableSlots) {
              const isUnavail = teacher.unavailableSlots.some(
                u => u.dayOfWeek === day && u.periodNumber === currentPeriod
              );
              if (isUnavail) {
                isHardValid = false;
                break;
              }
            }

            // Check teacher overlap
            const tKey = `${this.termId}_D${day}_P${currentPeriod}_T${unit.teacherId}`;
            if (this.teacherSlots.has(tKey)) {
              isHardValid = false;
              break;
            }

            // Check student group overlap
            const gKey = `${this.termId}_D${day}_P${currentPeriod}_G${unit.studentGroupId}`;
            if (this.groupSlots.has(gKey)) {
              isHardValid = false;
              break;
            }

            // Check linked groups overlap
            if (studentGroup?.linkedGroupIds) {
              for (const linkedId of studentGroup.linkedGroupIds) {
                const linkKey = `${this.termId}_D${day}_P${currentPeriod}_G${linkedId}`;
                if (this.groupSlots.has(linkKey)) {
                  isHardValid = false;
                  break;
                }
              }
              if (!isHardValid) break;
            }
          }

          if (!isHardValid) continue;

          // Check suitable rooms
          for (const room of suitableRooms) {
            let roomValid = true;
            for (let offset = 0; offset < unit.duration; offset++) {
              const currentPeriod = p + offset;
              const rKey = `${this.termId}_D${day}_P${currentPeriod}_R${room.id}`;
              if (this.roomSlots.has(rKey)) {
                roomValid = false;
                break;
              }
            }

            if (roomValid) {
              // Calculate Soft Constraint Score:
              // Prefer days where this subject hasn't been taught yet
              const dailyCountKey = `${unit.studentGroupId}_D${day}_${unit.subjectId}`;
              const dailyCount = this.groupDailySubjectCount.get(dailyCountKey) || 0;
              let softScore = 100 - dailyCount * 50;

              // Prefer morning/early afternoon over late periods
              if (p <= 4) softScore += 10;

              candidates.push({
                day,
                startPeriod: p,
                room,
                softScore,
              });
            }
          }
        }
      }

      // Sort candidates by softScore descending (Least Constraining Value)
      candidates.sort((a, b) => b.softScore - a.softScore);

      // Try candidates
      for (const cand of candidates) {
        // Place unit
        const placedSlots: { tKey: string; rKey: string; gKey: string }[] = [];
        const dailyCountKey = `${unit.studentGroupId}_D${cand.day}_${unit.subjectId}`;
        this.groupDailySubjectCount.set(
          dailyCountKey,
          (this.groupDailySubjectCount.get(dailyCountKey) || 0) + 1
        );

        for (let offset = 0; offset < unit.duration; offset++) {
          const currentP = cand.startPeriod + offset;
          const tKey = `${this.termId}_D${cand.day}_P${currentP}_T${unit.teacherId}`;
          const rKey = `${this.termId}_D${cand.day}_P${currentP}_R${cand.room.id}`;
          const gKey = `${this.termId}_D${cand.day}_P${currentP}_G${unit.studentGroupId}`;

          this.teacherSlots.add(tKey);
          this.roomSlots.add(rKey);
          this.groupSlots.add(gKey);
          placedSlots.push({ tKey, rKey, gKey });
        }

        // Recurse to next unit
        if (backtrack(unitIndex + 1)) {
          // Success! Record this unit's schedule items
          const dayNames = ["", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์"];
          for (let offset = 0; offset < unit.duration; offset++) {
            const currentP = cand.startPeriod + offset;
            const ts = this.timeslots.find(
              t => t.dayOfWeek === cand.day && t.periodNumber === currentP
            );
            const startTime = ts?.startTime || `0${7 + currentP}:30`;
            const endTime = ts?.endTime || `0${8 + currentP}:30`;

            resultSchedules.push({
              id: `SCH_${this.termId}_D${cand.day}_P${currentP}_G${unit.studentGroupId}`,
              termId: this.termId,
              dayOfWeek: cand.day,
              dayNameTh: dayNames[cand.day] || "",
              periodNumber: currentP,
              startTime,
              endTime,
              studentGroupId: unit.studentGroupId,
              studentGroupCode: unit.studentGroupCode,
              studentCount: unit.studentCount,
              subjectId: unit.subjectId,
              subjectCode: unit.subjectCode,
              subjectNameTh: unit.subjectNameTh,
              colorHex: unit.colorHex,
              teacherId: unit.teacherId,
              teacherName: unit.teacherName,
              classroomId: cand.room.id,
              roomCode: cand.room.roomCode,
              roomType: cand.room.roomType,
              groupSlotKey: `${this.termId}_D${cand.day}_P${currentP}_G${unit.studentGroupId}`,
              teacherSlotKey: `${this.termId}_D${cand.day}_P${currentP}_T${unit.teacherId}`,
              roomSlotKey: `${this.termId}_D${cand.day}_P${currentP}_R${cand.room.id}`,
              isManualOverride: false,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          }
          return true;
        }

        // Backtrack: Remove placed slots
        for (const slot of placedSlots) {
          this.teacherSlots.delete(slot.tKey);
          this.roomSlots.delete(slot.rKey);
          this.groupSlots.delete(slot.gKey);
        }
        const prevCount = this.groupDailySubjectCount.get(dailyCountKey) || 1;
        if (prevCount <= 1) {
          this.groupDailySubjectCount.delete(dailyCountKey);
        } else {
          this.groupDailySubjectCount.set(dailyCountKey, prevCount - 1);
        }
      }

      // If no candidates worked for this unit
      unassignedUnits.push(unit);
      return false;
    };

    const isComplete = backtrack(0);
    const executionTimeMs = Date.now() - startTime;

    return {
      success: isComplete && unassignedUnits.length === 0,
      schedules: resultSchedules,
      unassignedUnits,
      totalUnits: units.length,
      assignedUnits: units.length - unassignedUnits.length,
      conflictReport,
      executionTimeMs,
    };
  }
}

