'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';

export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'print';
export type ExportScope = 'filtered' | 'selected' | 'all' | 'single';

const EXPORT_OPTIONS: Array<{
  label: string;
  description: string;
  format: ExportFormat;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    label: 'CSV',
    description: 'Clean spreadsheet data',
    format: 'csv',
    icon: FileText,
  },
  {
    label: 'Excel',
    description: 'Formatted workbook',
    format: 'excel',
    icon: FileSpreadsheet,
  },
  {
    label: 'PDF',
    description: 'Readable review copy',
    format: 'pdf',
    icon: FileText,
  },
  {
    label: 'Print',
    description: 'Browser print view',
    format: 'print',
    icon: Printer,
  },
];

export default function ExportFormatMenu({
  formats = ['csv', 'excel', 'pdf'],
  label = 'Export',
  onExport,
  scopeOptions,
}: {
  formats?: ExportFormat[];
  label?: string;
  onExport: (format: ExportFormat, scope: ExportScope) => void;
  scopeOptions?: Array<{
    scope: ExportScope;
    label: string;
    description: string;
    disabled?: boolean;
  }>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const availableOptions = EXPORT_OPTIONS.filter((option) => formats.includes(option.format));
  const scopes = scopeOptions?.length
    ? scopeOptions
    : [{ scope: 'filtered' as const, label: 'Current View', description: 'Current filtered results' }];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl border border-[#D6B53B]/40 bg-white/90 px-4 py-2.5 font-sans text-[12px] font-bold uppercase tracking-[0.1em] text-[#1a1f18] shadow-[0_10px_24px_rgba(26,31,24,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#D6B53B] hover:bg-[#FDF5CC] hover:text-[#8E7722] hover:shadow-[0_14px_30px_rgba(214,181,59,0.18)] focus:outline-none focus:ring-2 focus:ring-[#D6B53B]/30 focus:ring-offset-2 focus:ring-offset-white active:translate-y-0 active:scale-[0.98] dark:border-[#D6B53B]/25 dark:bg-white/[0.04] dark:text-[#F4F4F0] dark:hover:bg-[#D6B53B]/10 dark:hover:text-[#D6B53B] dark:focus:ring-offset-[#141A13]"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <Download className="relative h-4 w-4 transition-transform duration-300" />
        <span className="relative">{label}</span>
        <ChevronDown className={`relative h-4 w-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-[#D6B53B]/20 bg-white/95 p-1.5 shadow-[0_24px_70px_rgba(26,31,24,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-[#141A13]/95"
        >
          {availableOptions.map((option, optionIndex) => {
            const Icon = option.icon;

            return (
              <div key={option.format}>
                {scopes.map((scope) => (
                  <button
                    key={`${option.format}-${scope.scope}`}
                    type="button"
                    role="menuitem"
                    disabled={scope.disabled}
                    onClick={() => {
                      setIsOpen(false);
                      onExport(option.format, scope.scope);
                    }}
                    className="group/item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#FDF5CC] disabled:cursor-not-allowed disabled:opacity-45 dark:hover:bg-white/5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FDF5CC] text-[#8E7722] ring-1 ring-[#D6B53B]/20 transition group-hover/item:bg-[#D6B53B] group-hover/item:text-white dark:bg-[#D6B53B]/10 dark:text-[#D6B53B] dark:group-hover/item:bg-[#D6B53B] dark:group-hover/item:text-[#1a1f18]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-gray-900 dark:text-white">
                        {option.format === 'print' ? 'Print' : `Export ${option.label}`}
                        {scopeOptions?.length ? ` - ${scope.label}` : ''}
                      </span>
                      <span className="block text-xs font-semibold text-gray-500 dark:text-[#A3B19B]">
                        {scopeOptions?.length ? scope.description : option.description}
                      </span>
                    </span>
                  </button>
                ))}
                {optionIndex < availableOptions.length - 1 && <div className="my-1 h-px bg-[#D6B53B]/10" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

