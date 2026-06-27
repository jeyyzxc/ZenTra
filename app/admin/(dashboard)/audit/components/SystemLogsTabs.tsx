'use client';

import React from 'react';
import { ClipboardList, Mail } from 'lucide-react';

export type SystemLogsTab = 'audit' | 'email';

const TABS = [
  { id: 'audit' as const, label: 'Audit Logs', icon: ClipboardList },
  { id: 'email' as const, label: 'Email Logs', icon: Mail },
];

export default function SystemLogsTabs({
  activeTab,
  onChange,
}: {
  activeTab: SystemLogsTab;
  onChange: (tab: SystemLogsTab) => void;
}) {
  return (
    <div className="flex gap-2 border-b border-[#D6B53B]/20">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition ${
              isActive
                ? 'border-[#D6B53B] text-[#8E7722] dark:text-[#D6B53B]'
                : 'border-transparent text-gray-500 hover:text-[#8E7722] dark:text-[#A3B19B] dark:hover:text-[#D6B53B]'
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
