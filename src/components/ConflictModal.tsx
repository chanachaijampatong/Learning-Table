"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  reason: string;
}

export default function ConflictModal({
  isOpen,
  onClose,
  title = "ไม่สามารถย้ายหรือสลับคาบเรียนได้ (พบข้อขัดแย้ง)",
  reason,
}: ConflictModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-red-100 overflow-hidden">
        {/* Header */}
        <div className="bg-red-50 p-4 border-b border-red-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 text-red-700">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-base font-bold text-red-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-red-100/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-3">
          <p className="text-sm font-medium text-slate-700">เหตุผลที่พบข้อขัดแย้ง:</p>
          <div className="p-3.5 bg-red-50/70 border border-red-200 rounded-xl text-sm text-red-800 leading-relaxed font-normal">
            {reason}
          </div>
          <p className="text-xs text-slate-500 italic">
            * ระบบจัดตารางอัตโนมัติรักษาความปลอดภัย Zero-Conflict เพื่อป้องกันตารางเรียนและครูผู้สอนชนกัน
          </p>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-xl hover:bg-slate-900 transition-colors shadow-sm"
          >
            รับทราบและปิด
          </button>
        </div>
      </div>
    </div>
  );
}

