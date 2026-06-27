'use client';

import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { EmailLogFilters } from '../types';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-[#A3B19B]">
      {children}
    </label>
  );
}

function formatEnum(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-[#D6B53B]/20 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-[#D6B53B] focus:ring-2 focus:ring-[#D6B53B]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
      >
        {children}
      </select>
    </div>
  );
}

export default function EmailLogFiltersComponent({
  activeFilterCount,
  emailTypeOptions,
  filters,
  onChange,
  onClear,
  relatedModuleOptions,
  statusOptions,
  triggerSourceOptions,
  workflowOptions,
}: {
  activeFilterCount: number;
  emailTypeOptions: string[];
  filters: EmailLogFilters;
  onChange: (key: keyof EmailLogFilters, value: string) => void;
  onClear: () => void;
  relatedModuleOptions: string[];
  statusOptions: string[];
  triggerSourceOptions: string[];
  workflowOptions: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm font-bold text-[#1a1f18] dark:text-white">
          <SlidersHorizontal className="h-4 w-4 text-[#D6B53B]" />
          Email Filters
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-[#FDF5CC] px-2 py-0.5 text-[10px] font-bold text-[#8E7722] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={activeFilterCount === 0}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/5 dark:hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
          Clear Filters
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="md:col-span-2">
          <FieldLabel>Search</FieldLabel>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => onChange('search', event.target.value)}
              placeholder="Search recipient, subject, workflow, or record ID..."
              className="h-10 w-full rounded-xl border border-[#D6B53B]/20 bg-white pl-10 pr-3 text-sm text-gray-800 outline-none transition focus:border-[#D6B53B] focus:ring-2 focus:ring-[#D6B53B]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
        </div>

        <div>
          <FieldLabel>Start Date</FieldLabel>
          <input
            type="date"
            value={filters.startDate}
            onChange={(event) => onChange('startDate', event.target.value)}
            className="h-10 w-full rounded-xl border border-[#D6B53B]/20 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-[#D6B53B] focus:ring-2 focus:ring-[#D6B53B]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>

        <div>
          <FieldLabel>End Date</FieldLabel>
          <input
            type="date"
            value={filters.endDate}
            onChange={(event) => onChange('endDate', event.target.value)}
            className="h-10 w-full rounded-xl border border-[#D6B53B]/20 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-[#D6B53B] focus:ring-2 focus:ring-[#D6B53B]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </div>

        <SelectField label="Email Type" value={filters.emailType} onChange={(value) => onChange('emailType', value)}>
          <option value="">All Email Types</option>
          {emailTypeOptions.map((emailType) => (
            <option key={emailType} value={emailType}>{formatEnum(emailType)}</option>
          ))}
        </SelectField>

        <SelectField label="Status" value={filters.status} onChange={(value) => onChange('status', value)}>
          <option value="">All Statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>{formatEnum(status)}</option>
          ))}
        </SelectField>

        <SelectField label="Trigger Source" value={filters.triggerSource} onChange={(value) => onChange('triggerSource', value)}>
          <option value="">All Sources</option>
          {triggerSourceOptions.map((source) => (
            <option key={source} value={source}>{formatEnum(source)}</option>
          ))}
        </SelectField>

        <SelectField label="Workflow Name" value={filters.workflowName} onChange={(value) => onChange('workflowName', value)}>
          <option value="">All Workflows</option>
          {workflowOptions.map((workflow) => (
            <option key={workflow} value={workflow}>{workflow}</option>
          ))}
        </SelectField>

        <SelectField label="Related Module" value={filters.relatedModule} onChange={(value) => onChange('relatedModule', value)}>
          <option value="">All Related Modules</option>
          {relatedModuleOptions.map((module) => (
            <option key={module} value={module}>{formatEnum(module)}</option>
          ))}
        </SelectField>
      </div>
    </div>
  );
}
