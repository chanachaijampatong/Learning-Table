# 📊 ผังงานการทำงานของระบบ (System Flowcharts)
> โปรเจกต์: **Learning-Table** (Smart Class & Course Scheduler)

---

## 1. ผังงานภาพรวมการทำงานของระบบ (Overall System Flow)

```mermaid
flowchart TD
    Start([เริ่มต้นเข้าสู่ระบบ]) --> Auth{เข้าสู่ระบบด้วยสิทธิ์ใด?}
    
    Auth -->|Admin ฝ่ายวิชาการ| AdminHub[แผงควบคุมฝ่ายวิชาการ]
    Auth -->|Teacher ครูผู้สอน| TeacherHub[ดูตารางสอนตนเอง / พิมพ์แบบฟอร์ม A4]
    Auth -->|Student นักเรียน| StudentHub[ดูตารางเรียนประจำห้อง]
    
    AdminHub --> DataMgmt[จัดการข้อมูลพื้นฐาน: วิชา, ครู, ห้อง, กลุ่มเรียน]
    DataMgmt --> ExcelImport[นำเข้าข้อมูลจากไฟล์ Excel หรือบันทึกตรง]
    ExcelImport --> Enrollment[กำหนดแผนการเรียน Course Enrollment ประจำภาคเรียน]
    
    Enrollment --> RunAI[สั่งรัน AI อัลกอริทึม CSP + MRV จัดตารางสอน]
    RunAI --> CheckConflict{พบข้อขัดแย้งหรือไม่?}
    
    CheckConflict -- พบข้อขัดแย้ง --> ShowReport[แสดงรายงานปัญหา คาบไม่พอ/ครูติดภารกิจ]
    ShowReport --> DataMgmt
    
    CheckConflict -- สำเร็จ 100% --> ViewTimetable[แสดงผลตารางสอน 4 มุมมอง]
    ViewTimetable --> ManualSwap[สลับคาบเรียน Live Drag & Drop ปรับแต่ง]
    ManualSwap --> ExportDocs[ส่งออกตาราง: A4 Landscape PDF, Excel, พิมพ์]
    ExportDocs --> End([สิ้นสุดกระบวนการ])
```

---

## 2. ผังงานอัลกอริทึมจัดตารางสอน (CSP + Heuristic MRV Scheduler)

```mermaid
flowchart TD
    A[รับรายการ Course Enrollments ทั้งหมดในเทอม] --> B[แตกเป็น Lesson Units: คาบคู่ 2 คาบ / คาบเดี่ยว 1 คาบ]
    B --> C[จัดเรียงความยาก-ง่ายด้วย Heuristic MRV]
    
    C --> C1[1. ห้องแล็บเฉพาะทาง เช่น Com Lab, Workshop]
    C --> C2[2. วิชาคาบคู่ 2 คาบต่อเนื่อง]
    C --> C3[3. ครูที่มีตารางจำกัดหรือคาบสอนสูง]
    
    C1 & C2 & C3 --> D[ดึง Lesson Unit ที่มีข้อจำกัดสูงสุดมาพิจารณา]
    D --> E[สุ่มสำรวจช่องเวลา Timeslot และห้องเรียนที่ตรงเงื่อนไข]
    
    E --> H1{ตรวจครูชน? ครูว่างไหม?}
    H1 -- ชน --> NextSlot[ลองช่องเวลา/ห้องถัดไป]
    H1 -- ว่าง --> H2{ตรวจห้องชน? ห้องว่างไหม?}
    
    H2 -- ชน --> NextSlot
    H2 -- ว่าง --> H3{ตรวจกลุ่มเรียนชน? กลุ่มว่างไหม?}
    
    H3 -- ชน --> NextSlot
    H3 -- ว่าง --> H4{ความจุห้องเพียงพอไหม?}
    
    H4 -- ไม่พอ --> NextSlot
    H4 -- พอ --> CalcScore[คำนวณ Soft Score: กระจายวัน, ลดช่องว่างคาบฟันหลอ]
    
    CalcScore --> Assign[วาง Lesson Unit ลงตารางชั่วคราว]
    Assign --> AllDone{จัดครบทุกวิชาหรือยัง?}
    
    AllDone -- ยังไม่ครบ --> D
    AllDone -- ครบทุกวิชาแล้ว --> SaveDB[(บันทึกลง Firestore: คอลเลกชัน schedules)]
    
    NextSlot --> HasSlotsLeft{ยังมีช่องเวลาเหลือให้ลองไหม?}
    HasSlotsLeft -- มี --> E
    HasSlotsLeft -- หมดทางเลือก --> Backtrack[ย้อนกลับไปเปลี่ยนคาบของวิชาก่อนหน้า Backtracking]
    Backtrack --> E
```

---

## 3. ผังงานระบบสลับคาบเรียน Real-time (Interactive Swap Flow)

```mermaid
flowchart TD
    Click1[ผู้ใช้คลิกเลือกคาบเรียนต้นทาง Cell A] --> Highlight[ไฮไลต์คาบเรียนที่เลือก]
    Highlight --> Click2[ผู้ใช้คลิกเลือกช่องเป้าหมาย Cell B บนตาราง]
    
    Click2 --> CheckRule[เรียกฟังก์ชัน validateCandidatePlacement]
    CheckRule --> VerifyTeacher{ครูผู้สอนทั้ง 2 คาบ ติดสอนห้องอื่นไหม?}
    
    VerifyTeacher -- ชน --> ShowError[แสดง Modal สีแดง: ครูติดภารกิจ/สอนซ้อน]
    VerifyTeacher -- ผ่าน --> VerifyRoom{ห้องเรียนทั้ง 2 ว่างตรงกันไหม?}
    
    VerifyRoom -- ชน --> ShowError
    VerifyRoom -- ผ่าน --> VerifyGroup{กลุ่มเรียนทั้ง 2 ว่างตรงกันไหม?}
    
    VerifyGroup -- ชน --> ShowError
    VerifyGroup -- ผ่าน --> SwapConfirm[ทำการสลับคาบเรียน A <-> B]
    
    SwapConfirm --> UpdateKeys[สร้าง Conflict Key ใหม่ทันที]
    UpdateKeys --> BatchWrite[(อัปเดตลง Cloud Firestore แบบ Transaction)]
    BatchWrite --> Toast[แสดงแจ้งเตือนสีเขียว: สลับคาบเรียนสำเร็จ]
```

---

## 4. ผังงานการพิมพ์และส่งออกเอกสารราชการ A4 แนวนอน (Official Export Flow)

```mermaid
flowchart TD
    SelectTeacher[เลือกครูผู้สอนและภาคเรียน] --> FetchData[ดึงข้อมูลตารางสอน + ข้อมูลวิชา ท-ป-น-ช]
    FetchData --> BuildA4[เรนเดอร์โครงสร้างหน้ากระดาษ A4 Landscape 285mm x 200mm]
    
    BuildA4 --> AddHeader[ใส่ตราสัญลักษณ์ สอศ., ข้อมูลครู, ตารางสรุป ท-ป-น-ช]
    AddHeader --> AddFlagSlot[แทรกคอลัมน์แนวตั้ง 08:00 - 08:30 กิจกรรมหน้าเสาธง]
    AddHeader --> BuildGrid[แทรกตารางคาบเรียน 9-10 คาบ พร้อมผสานเซลล์คาบคู่]
    
    BuildGrid --> AddFooter[ใส่จุดลงนาม 4 ตำแหน่ง: หน.แผนก, หน.หลักสูตร, รอง ผอ., ผอ.]
    AddFooter --> Action{ผู้ใช้เลือกคำสั่งใด?}
    
    Action -->|พิมพ์ลงกระดาษ| PrintCSS[เรียก window.print ด้วย @page A4 Landscape บังคับ 1 หน้า]
    Action -->|ดาวน์โหลด PDF| JsPDF[ประมวลผล PDF เวกเตอร์ภาษาไทยคมชัดสูง]
    Action -->|ส่งออก Excel| ExcelJS[สร้างไฟล์ .xlsx พร้อมจัดกึ่งกลางและใส่กรอบสี]
```

