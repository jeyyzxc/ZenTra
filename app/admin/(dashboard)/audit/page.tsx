'use client';

import React from 'react';

const mockLogs = [
  { time: '2026-06-09 14:32:01', level: '[INFO]', levelColor: 'text-[#10b981]', source: 'User: Jeyy', msg: "Admin user updated payment status for Client 001 to 'Verified'." },
  { time: '2026-06-09 14:15:22', level: '[ERROR]', levelColor: 'text-[#ef4444]', source: 'System: n8n', msg: "Workflow failed to send contract email to Mark & Julia. Fallback triggered." },
  { time: '2026-06-09 12:00:00', level: '[WARN]', levelColor: 'text-[#f59e0b]', source: 'System: Core', msg: "Auto-tagged booking B-1046 as Expired (Downpayment SLA unmet)." },
  { time: '2026-06-09 10:45:12', level: '[INFO]', levelColor: 'text-[#10b981]', source: 'User: Jeyy', msg: "Added new package 'Premium Corporate' to Knowledge Base." },
  { time: '2026-06-08 22:10:05', level: '[INFO]', levelColor: 'text-[#10b981]', source: 'System: Agent', msg: "LLM responded to 3 client inquiries successfully." },
  { time: '2026-06-08 18:30:00', level: '[INFO]', levelColor: 'text-[#10b981]', source: 'User: Jeyy', msg: "Logged out of system." },
];

export default function AuditLogs() {
  return (
    <div className="flex flex-col gap-6 h-full font-serif text-[#1a1f18]">
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold mb-2">Audit & Email Logs</h2>
        <p className="text-gray-500">Track user actions, automated workflows, and system errors in real-time.</p>
      </div>

      {/* Main Container */}
      <div className="bg-[#FDF5CC] rounded-xl p-6 shadow-sm border border-black/5 flex-1 flex flex-col">
        
        {/* Toolbar */}
        <div className="flex justify-between items-center mb-6">
          {/* Search */}
          <div className="relative w-[400px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Search logs......" 
              className="w-full border border-black rounded-full py-2 pl-10 pr-4 text-sm font-serif focus:outline-none focus:ring-1 focus:ring-black bg-white"
            />
          </div>

          <div className="flex gap-4">
            <select className="border border-gray-200 rounded-md py-2 px-4 text-sm focus:outline-none focus:border-[#BEA542] focus:ring-1 focus:ring-[#BEA542] bg-white">
              <option>All Levels</option>
              <option>INFO</option>
              <option>WARN</option>
              <option>ERROR</option>
            </select>
            <button className="flex items-center gap-2 bg-white border border-gray-200 text-[#1a1f18] px-6 py-2 rounded-md text-sm shadow-sm hover:bg-gray-50 transition-colors">
              Filter Date
            </button>
          </div>
        </div>

        {/* Terminal/Console Box */}
        <div className="bg-[#121A2F] flex-1 rounded-xl shadow-inner border border-black overflow-hidden font-mono text-[13px] text-gray-300 p-8">
          <div className="flex flex-col gap-3">
            
            {mockLogs.map((log, idx) => (
              <div key={idx} className="flex hover:bg-white/5 p-1 -mx-1 rounded transition-colors">
                <span className="w-40 text-gray-500 shrink-0">{log.time}</span>
                <span className={`w-20 font-bold shrink-0 ${log.levelColor}`}>{log.level}</span>
                <span className="w-32 text-[#B29DFB] shrink-0">{log.source}</span>
                <span className="flex-1 text-gray-300">{log.msg}</span>
              </div>
            ))}

            {/* Waiting prompt */}
            <div className="flex p-1 -mx-1 mt-4">
              <span className="text-gray-600 mr-2">Waiting for input</span>
              <span className="animate-pulse bg-gray-500 w-2.5 h-4 mt-0.5"></span>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
