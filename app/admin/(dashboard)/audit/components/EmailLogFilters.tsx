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
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()).replace(/\bN8n\b/g, 'n8n').replace(/\bAi\b/g, 'AI');
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
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options = React.Children.toArray(children)
    .flatMap((child) => {
      if (!React.isValidElement<React.OptionHTMLAttributes<HTMLOptionElement>>(child) || child.type !== 'option') {
        return [];
      }

      return [{
        value: String(child.props.value ?? ''),
        label: child.props.children,
      }];
    });

  const selected = options.find(opt => opt.value === value) || options[0];

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative group/input" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`flex h-10 w-full items-center justify-between rounded-xl border ${open ? 'border-[#D6B53B] bg-white ring-2 ring-[#D6B53B]/20 dark:bg-[#1a1f18] dark:border-[#D6B53B]' : 'border-[#D6B53B]/30 bg-white dark:border-white/10 dark:bg-white/5'} px-3 font-sans text-sm shadow-[0_4px_12px_rgba(47,62,50,0.03)] backdrop-blur-md transition-all duration-300 hover:border-[#D6B53B]/50 hover:bg-[#FFF2DB]/30 dark:hover:bg-white/10 hover:shadow-sm cursor-pointer`}
        >
          <span className={`block min-w-0 truncate pr-7 text-left ${value ? 'text-gray-900 font-medium dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
            {selected?.label || 'Select...'}
          </span>
        </button>

        <div className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-300 ${open ? 'text-[#D6B53B] rotate-180' : 'text-gray-400 group-hover/input:text-[#D6B53B]'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>

        {open && (
          <div className="absolute top-full left-0 mt-2 w-full max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(47,62,50,0.15)] z-50 py-1.5 audit-scrollbar dark:border-white/10 dark:bg-[#1a1f18]/95">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`flex w-full items-center px-3 py-2.5 text-left text-sm transition-colors ${value === opt.value ? 'bg-[#FFF2DB] text-[#8E7722] font-semibold dark:bg-[#D6B53B]/20 dark:text-[#D6B53B]' : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CustomDatePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const [currentDate, setCurrentDate] = React.useState(() => {
    return value ? new Date(value) : new Date();
  });

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleSelectDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(dateStr);
    setOpen(false);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="relative group/input" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`flex h-10 w-full items-center justify-between rounded-xl border ${open ? 'border-[#D6B53B] bg-white ring-2 ring-[#D6B53B]/20 dark:bg-[#1a1f18] dark:border-[#D6B53B]' : 'border-[#D6B53B]/30 bg-white dark:border-white/10 dark:bg-white/5'} px-3 font-sans text-sm shadow-[0_4px_12px_rgba(47,62,50,0.03)] backdrop-blur-md transition-all duration-300 hover:border-[#D6B53B]/50 hover:bg-[#FFF2DB]/30 dark:hover:bg-white/10 hover:shadow-sm cursor-pointer`}
        >
          <span className={`block min-w-0 truncate pr-7 text-left ${value ? 'text-gray-900 font-medium dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
            {value || 'Select date...'}
          </span>
          <div className={`pointer-events-none transition-all duration-300 ${open ? 'text-[#D6B53B]' : 'text-gray-400 group-hover/input:text-[#D6B53B]'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-2 w-[280px] rounded-2xl border border-gray-200 bg-white/95 p-4 backdrop-blur-xl shadow-[0_12px_40px_rgba(47,62,50,0.15)] z-50 dark:border-white/10 dark:bg-[#1a1f18]/95">
            <div className="mb-4 flex items-center justify-between">
              <button type="button" onClick={handlePrevMonth} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-700 dark:text-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                {monthNames[month]} {year}
              </div>
              <button type="button" onClick={handleNextMonth} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-700 dark:text-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekdayLabels.map(day => (
                <div key={day} className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                  {day}
                </div>
              ))}
              
              {paddingDays.map(pad => (
                <div key={`pad-${pad}`} className="h-8" />
              ))}
              
              {days.map(day => {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = value === dateStr;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelectDate(day)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm mx-auto transition-all duration-200 ${isSelected ? 'bg-[#D6B53B] text-white shadow-md font-bold' : 'text-gray-700 hover:bg-[#FFF2DB] hover:text-[#8E7722] dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white'}`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-white/10 pt-3">
              <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="text-xs font-semibold text-gray-500 hover:text-[#8E7722] dark:hover:text-[#D6B53B] transition-colors">
                Clear
              </button>
              <button type="button" onClick={() => { 
                const today = new Date();
                onChange(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
                setCurrentDate(today);
                setOpen(false);
              }} className="text-xs font-semibold text-[#8E7722] dark:text-[#D6B53B] hover:opacity-80 transition-opacity">
                Today
              </button>
            </div>
          </div>
        )}
      </div>
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
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => onChange('search', event.target.value)}
              placeholder="Search recipient, subject, workflow, or record ID..."
              className="h-10 w-full rounded-xl border border-[#D6B53B]/30 bg-white pl-10 pr-3 font-sans text-sm text-gray-900 shadow-[0_4px_12px_rgba(47,62,50,0.03)] backdrop-blur-md transition-all duration-300 placeholder:text-gray-500 hover:border-[#D6B53B]/50 hover:bg-[#FFF2DB]/30 hover:shadow-sm focus:border-[#D6B53B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D6B53B]/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-400 dark:hover:bg-white/10 dark:focus:border-[#D6B53B] dark:focus:bg-[#1a1f18]"
            />
          </div>
        </div>

        <CustomDatePicker
          label="Start Date"
          value={filters.startDate}
          onChange={(value) => onChange('startDate', value)}
        />

        <CustomDatePicker
          label="End Date"
          value={filters.endDate}
          onChange={(value) => onChange('endDate', value)}
        />

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
