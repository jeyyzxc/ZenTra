'use client';

import { useState } from 'react';
import ExportFormatMenu, { type ExportFormat } from '@/components/admin/ExportFormatMenu';

type ReportCsvDataset = 'monthly' | 'metrics' | 'categories';

export default function ReportsActions() {
  const [csvDataset, setCsvDataset] = useState<ReportCsvDataset>('monthly');

  const exportReport = (format: ExportFormat) => {
    if (format === 'print') {
      window.print();
      return;
    }

    const params = new URLSearchParams({
      format,
      dataset: csvDataset,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    window.location.href = `/api/reports/export?${params.toString()}`;
  };

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <span className="rounded-lg border border-gray-200 bg-[#FDF5CC] px-4 py-2 text-sm font-bold dark:border-white/10">Last 6 months</span>
      <label className="sr-only" htmlFor="reports-csv-dataset">CSV dataset</label>
      <select
        id="reports-csv-dataset"
        value={csvDataset}
        onChange={(event) => setCsvDataset(event.target.value as ReportCsvDataset)}
        className="rounded-lg border border-[#D6B53B]/40 bg-white px-3 py-2 text-sm font-semibold text-[#1a1f18] shadow-sm transition hover:border-[#D6B53B] focus:border-[#D6B53B] focus:outline-none focus:ring-2 focus:ring-[#D6B53B]/20 dark:border-white/10 dark:bg-[#141A13] dark:text-[#FDF5CC]"
        title="CSV dataset"
      >
        <option value="monthly">CSV: Monthly breakdown</option>
        <option value="metrics">CSV: Executive metrics</option>
        <option value="categories">CSV: Category breakdowns</option>
      </select>
      <ExportFormatMenu
        formats={['pdf', 'excel', 'csv', 'print']}
        onExport={exportReport}
      />
    </div>
  );
}
