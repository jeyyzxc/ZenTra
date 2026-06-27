'use client';

import React, { useState } from 'react';
import { ChevronDown, Download, FileSpreadsheet, FileText } from 'lucide-react';

export default function AuditLogExport({
  onExport,
}: {
  onExport: (format: 'csv' | 'excel' | 'pdf') => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { label: 'CSV', format: 'csv' as const, icon: FileText },
    { label: 'Excel', format: 'excel' as const, icon: FileSpreadsheet },
    { label: 'PDF', format: 'pdf' as const, icon: FileText },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1a1f18] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#D6B53B]"
      >
        <Download className="h-4 w-4" />
        Export
        <ChevronDown className={`h-4 w-4 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-2xl border border-gray-100 bg-white p-1 shadow-xl dark:border-white/10 dark:bg-[#1C1D21]">
          {options.map((option) => {
            const Icon = option.icon;

            return (
              <button
                key={option.format}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onExport(option.format);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-gray-700 transition hover:bg-[#FDF5CC] hover:text-[#8E7722] dark:text-gray-200 dark:hover:bg-white/5 dark:hover:text-[#D6B53B]"
              >
                <Icon className="h-4 w-4" />
                Export {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
