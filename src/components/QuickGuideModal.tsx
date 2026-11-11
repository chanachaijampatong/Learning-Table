"use client";

import React, { useState } from "react";
import { 
  X, 
  BookOpen, 
  Sparkles, 
  CalendarDays, 
  Printer, 
  FileSpreadsheet, 
  ShieldCheck, 
  Lightbulb, 
  ArrowRight, 
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickGuideModal({ isOpen, onClose }: QuickGuideModalProps) {
  const [activeTab, setActiveTab] = useState<number>(1);

  if (!isOpen) return null;

  const steps = [
    {
      id: 1,
      title: "1. จัดการข้อมูลหลัก",
      subtitle: "เตรียมข้อมูลวิชา, ครู, ห้อง",
      icon: BookOpen,
      color: "blue",
      content: {
        heading: "ขั้นตอนที่ 1: จัดการข้อมูลหลัก (Master Data Management)",
        desc: "ฝ่ายวิชาการเตรียมข้อมูลพื้นฐานที่จำเป็นต่อการจัดตารางเรียน โดยสามารถกรอกผ่านหน้าเว็บหรือนำเข้าผ่าน Excel",
        bullets: [
          "กำหนดรายวิชาตามหลักสูตร สอศ. พร้อมค่า ทฤษฎี-ปฏิบัติ-หน่วยกิต-ชั่วโมง (ท-ป-น-ช)",
          "ระบุข้อมูลครูผู้สอน พร้อมกำหนด 'คาบที่ไม่สะดวกสอน' (Unavailable Slots)",
          "ระบุห้องเรียนและประเภทห้อง (เช่น ห้องปฏิบัติการคอมพิวเตอร์, โรงฝึกงานช่าง, ห้องบรรยายทั่วไป)",
          "นำเข้าข้อมูลอย่างรวดเร็วด้วยปุ่ม 'ดาวน์โหลด Template' แล้วกด 'นำเข้า Excel'",
        ],
        linkHref: "/management",
        linkLabel: "ไปที่หน้าจัดการข้อมูลหลัก",
      },
    },
    {
      id: 2,
      title: "2. รัน AI จัดตาราง",
      subtitle: "CSP Solver ไร้ข้อขัดแย้ง",
      icon: Sparkles,
      color: "indigo",
      content: {
        heading: "ขั้นตอนที่ 2: รัน AI จัดตารางอัตโนมัติ (Zero-Conflict Solver)",
        desc: "ระบบใช้อัลกอริทึม Constraint Satisfaction Problem (CSP) + Heuristic MRV Backtracking จัดตารางเรียนทั้งเทอมในไม่กี่วินาที",
        bullets: [
          "ตรวจจับเงื่อนไข Zero-Conflict 3 มิติ: ครูไม่สอนซ้อนคาบ, ห้องเรียนไม่ถูกใช้ซ้ำ, กลุ่มเรียนไม่เรียนชนกัน",
          "จัดวิชาปฏิบัติเป็น 'คาบคู่' (2 คาบติดกัน) และลงในห้องปฏิบัติการที่ถูกต้องตามประเภทวิชา",
          "เกลี่ยตารางเรียนให้สมดุล ลดคาบว่าง (Gap periods) และไม่จัดวิชาลงในคาบกิจกรรมหน้าเสาธงหรือคาบพักเที่ยง",
          "เมื่อ AI คำนวณสำเร็จ กดปุ่ม 'บันทึกตารางลง Firestore' เพื่ออัปเดตทั้งระบบแบบเรียลไทม์",
        ],
        linkHref: "/scheduler",
        linkLabel: "ไปที่หน้ารัน AI จัดตาราง",
      },
    },
    {
      id: 3,
      title: "3. ตรวจสอบ & สลับคาบ",
      subtitle: "ตาราง 4 มุมมอง + Live Swap",
      icon: CalendarDays,
      color: "emerald",
      content: {
        heading: "ขั้นตอนที่ 3: ตรวจสอบและสลับคาบเรียน (Interactive Matrix)",
        desc: "ตรวจสอบตารางเรียนได้ครบทุกมุมมอง และฝ่ายวิชาการสามารถคลิกขยับสลับคาบเรียนได้อย่างอิสระ",
        bullets: [
          "สลับดูตารางได้ 4 มิติ: ตามกลุ่มเรียน (นักเรียน), ตามครูผู้สอน, ตามห้องเรียน, และตามรายวิชา",
          "สำหรับฝ่ายวิชาการ: คลิกที่ช่องวิชาใดก็ได้ จะมีหน้าต่าง Conflict Modal แจ้งเตือนล่วงหน้าว่าสามารถสลับไปคาบใดได้บ้างโดยไม่ชน",
          "สำหรับนักศึกษา: ตารางจะถูกล็อกเป็น 'โหมดอ่านอย่างเดียว (Read-Only)' ปลอดภัย ไม่สามารถแก้ไขตารางได้",
          "รองรับการใช้งานบนมือถือ แท็บเล็ต และคอมพิวเตอร์",
        ],
        linkHref: "/timetables",
        linkLabel: "ไปที่หน้าตารางเรียน 4 มุมมอง",
      },
    },
    {
      id: 4,
      title: "4. พิมพ์แบบ สอศ. A4",
      subtitle: "แนวนอน 1 หน้าเป๊ะ 100%",
      icon: Printer,
      color: "amber",
      content: {
        heading: "ขั้นตอนที่ 4: พิมพ์แบบฟอร์มทางการ สอศ. (Official A4 Landscape)",
        desc: "ส่งออกตารางสอนราชการตามมาตรฐานสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.)",
        bullets: [
          "สัดส่วนพอดีกระดาษ A4 แนวนอน (285mm x 200mm) 1 หน้าเป๊ะ 100% ไม่มีปัญหาหน้าเกินหรือล้นขอบ",
          "มีตารางสรุปภาระการสอน ท-ป-น-ช รวมชั่วโมงสอนต่อสัปดาห์ครบถ้วน",
          "รวมจุดลงนามทางการ 4 ฝ่าย: ครูผู้สอน, หัวหน้าแผนกวิชา, รองผู้อำนวยการฝ่ายวิชาการ, และผู้อำนวยการสถานศึกษา",
          "กดปุ่ม 'พิมพ์ตารางสอนทางการ' หรือใช้คีย์ลัด Ctrl + P เพื่อพิมพ์หรือบันทึกเป็น PDF",
        ],
        linkHref: "/official-timetable",
        linkLabel: "ไปที่แบบฟอร์มทางการ สอศ. A4",
      },
    },
  ];

  const currentStep = steps.find(s => s.id === activeTab) || steps[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/15">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">
                คู่มือการใช้งานระบบ (Quick Guide)
              </h2>
              <p className="text-xs text-blue-200 font-normal">
                ระบบจัดตารางการเรียนการสอน Learning-Table มาตรฐาน สอศ.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Step Navigation Tabs */}
        <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50 text-xs font-bold shrink-0">
          {steps.map(step => {
            const Icon = step.icon;
            const isActive = step.id === activeTab;
            return (
              <button
                key={step.id}
                onClick={() => setActiveTab(step.id)}
                className={`py-3 px-2 flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 transition-all cursor-pointer border-r border-slate-200/60 last:border-r-0 relative ${
                  isActive 
                    ? "bg-white text-blue-700 font-extrabold shadow-xs" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/60"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <span className="truncate text-center">{step.title}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-5">
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              {currentStep.content.heading}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {currentStep.content.desc}
            </p>
          </div>

          {/* Bullet Points */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-2.5">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              แนวทางและข้อควรรู้:
            </div>
            {currentStep.content.bullets.map((bullet, idx) => (
              <div key={idx} className="flex items-start space-x-2.5 text-xs sm:text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{bullet}</span>
              </div>
            ))}
          </div>

          {/* Quick Tip Box */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5">
            <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>เคล็ดลับ:</strong> คุณสามารถกดปุ่มลัด <kbd className="px-1.5 py-0.5 bg-white border border-amber-300 rounded font-mono font-bold text-slate-800 text-[11px]">Ctrl + P</kbd> ในหน้าแบบฟอร์มทางการเพื่อเปิดหน้าต่างสั่งพิมพ์ตารางสอนได้ทันที
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            ขั้นตอนที่ <span className="font-bold text-slate-800">{activeTab}</span> จาก 4
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href={currentStep.content.linkHref}
              onClick={onClose}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              <span>{currentStep.content.linkLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              ปิดคู่มือ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

