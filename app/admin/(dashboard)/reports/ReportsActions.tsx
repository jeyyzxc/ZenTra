'use client';

import { Download, Printer } from 'lucide-react';

export default function ReportsActions() {
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <span className="rounded-lg border border-gray-200 bg-[#FDF5CC] px-4 py-2 text-sm font-bold dark:border-white/10">Last 6 months</span>
      <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-bold hover:bg-gray-50 dark:border-white/10 dark:bg-[#141A13]">
        <Printer className="h-4 w-4" /> Export PDF
      </button>
      <a href="/api/reports/export" className="inline-flex items-center gap-2 rounded-lg bg-[#1a1f18] px-4 py-2 text-sm font-bold text-white hover:bg-[#D6B53B] hover:text-[#1a1f18]">
        <Download className="h-4 w-4" /> Export CSV
      </a>
    </div>
  );
}
