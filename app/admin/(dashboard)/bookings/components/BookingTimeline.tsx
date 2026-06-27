import React from 'react';
import { Activity, Bot, CalendarClock, CreditCard, UserRound } from 'lucide-react';
import type { BookingTimelineItem } from '../types';

function sourceIcon(source: string) {
  if (source === 'Admin') return <UserRound className="h-4 w-4" />;
  if (source === 'Payment Management') return <CreditCard className="h-4 w-4" />;
  if (source === 'n8n Workflow') return <Bot className="h-4 w-4" />;
  return <Activity className="h-4 w-4" />;
}

export default function BookingTimeline({ entries }: { entries: BookingTimelineItem[] }) {
  if (entries.length === 0) {
    return <p className="text-sm italic text-gray-400">No timeline entries yet.</p>;
  }

  return (
    <div className="space-y-0">
      {entries.map((entry, index) => (
        <div key={entry.id} className="relative flex gap-4 pb-6">
          {index < entries.length - 1 && (
            <div className="absolute left-5 top-10 h-[calc(100%-2rem)] w-px bg-[#D6B53B]/25" />
          )}
          <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FDF5CC] text-[#8E7722] dark:bg-[#D6B53B]/10 dark:text-[#D6B53B]">
            {sourceIcon(entry.source)}
          </div>
          <div className="min-w-0 flex-1 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-[#141A13]">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{entry.action}</h4>
                <p className="mt-0.5 text-xs font-semibold text-[#8E7722] dark:text-[#D6B53B]">{entry.source} · {entry.performedBy}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                <CalendarClock className="h-3.5 w-3.5" />
                {new Date(entry.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{entry.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
