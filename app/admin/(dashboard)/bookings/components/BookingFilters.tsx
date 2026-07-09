'use client';

import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { BookingFilters as BookingFiltersType } from '../types';

function formatEnum(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()).replace(/\bN8n\b/g, 'n8n').replace(/\bAi\b/g, 'AI');
}

function SelectField({
  children,
  label,
  onChange,
  value,
}: {
  children: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-[#A3B19B]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-[#D6B53B]/20 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-[#D6B53B] focus:ring-2 focus:ring-[#D6B53B]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
      >
        {children}
      </select>
    </label>
  );
}

export default function BookingFilters({
  activeFilterCount,
  automationOptions,
  coordinatorOptions,
  eventTypeOptions,
  filters,
  onChange,
  onClear,
  paymentOptions,
  sourceOptions,
  statusOptions,
  syncOptions,
}: {
  activeFilterCount: number;
  automationOptions: string[];
  coordinatorOptions: string[];
  eventTypeOptions: string[];
  filters: BookingFiltersType;
  onChange: (key: keyof BookingFiltersType, value: string) => void;
  onClear: () => void;
  paymentOptions: string[];
  sourceOptions: string[];
  statusOptions: string[];
  syncOptions: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-sm font-bold text-[#1a1f18] dark:text-white">
          <SlidersHorizontal className="h-4 w-4 text-[#D6B53B]" />
          Filters
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-[#FDF5CC] px-2 py-0.5 text-[10px] text-[#8E7722] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]">
              {activeFilterCount} active
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={activeFilterCount === 0}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40 dark:hover:bg-white/5 dark:hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
          Clear Filters
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <label className="space-y-1.5 md:col-span-2">
          <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-[#A3B19B]">
            Search
          </span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => onChange('search', event.target.value)}
              placeholder="Reference, client, email, or event..."
              className="h-10 w-full rounded-xl border border-[#D6B53B]/20 bg-white pl-10 pr-3 text-sm text-gray-800 outline-none transition focus:border-[#D6B53B] focus:ring-2 focus:ring-[#D6B53B]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
            />
          </div>
        </label>

        <label className="space-y-1.5">
          <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-[#A3B19B]">Start Date</span>
          <input
            type="date"
            value={filters.startDate}
            onChange={(event) => onChange('startDate', event.target.value)}
            className="h-10 w-full rounded-xl border border-[#D6B53B]/20 bg-white px-3 text-sm text-gray-800 outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </label>

        <label className="space-y-1.5">
          <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-[#A3B19B]">End Date</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(event) => onChange('endDate', event.target.value)}
            className="h-10 w-full rounded-xl border border-[#D6B53B]/20 bg-white px-3 text-sm text-gray-800 outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5 dark:text-white"
          />
        </label>

        <SelectField label="Status" value={filters.status} onChange={(value) => onChange('status', value)}>
          <option value="">All Statuses</option>
          {statusOptions.map((option) => <option key={option} value={option}>{formatEnum(option)}</option>)}
        </SelectField>

        <SelectField label="Payment" value={filters.paymentStatus} onChange={(value) => onChange('paymentStatus', value)}>
          <option value="">All Payments</option>
          {paymentOptions.map((option) => <option key={option} value={option}>{formatEnum(option)}</option>)}
        </SelectField>

        <SelectField label="Source" value={filters.source} onChange={(value) => onChange('source', value)}>
          <option value="">All Sources</option>
          {sourceOptions.map((option) => <option key={option} value={option}>{formatEnum(option)}</option>)}
        </SelectField>

        <SelectField label="Sync" value={filters.syncStatus} onChange={(value) => onChange('syncStatus', value)}>
          <option value="">All Sync States</option>
          {syncOptions.map((option) => <option key={option} value={option}>{formatEnum(option)}</option>)}
        </SelectField>

        <SelectField label="Automation" value={filters.automationStatus} onChange={(value) => onChange('automationStatus', value)}>
          <option value="">All Automation</option>
          {automationOptions.map((option) => <option key={option} value={option}>{formatEnum(option)}</option>)}
        </SelectField>

        <SelectField label="Coordinator" value={filters.coordinator} onChange={(value) => onChange('coordinator', value)}>
          <option value="">All Coordinators</option>
          {coordinatorOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </SelectField>

        <SelectField label="Event Type" value={filters.eventType} onChange={(value) => onChange('eventType', value)}>
          <option value="">All Event Types</option>
          {eventTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </SelectField>
      </div>
    </div>
  );
}
