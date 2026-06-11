'use client';

import React from 'react';

const mockKnowledgeBase = [
  { id: 'KB-001', category: 'Payment Policy', title: 'Standard Payment Terms', date: '2026-05-01 by Jeyy', status: 'Active', statusColor: 'bg-green-100 text-green-700' },
  { id: 'KB-002', category: 'Venue Rules', title: 'Corkage Fees for Outside Food/Drinks', date: '2026-04-15 by System', status: 'Active', statusColor: 'bg-green-100 text-green-700' },
  { id: 'KB-003', category: 'FAQ', title: 'Can we extend party hours?', date: '2026-05-20 by Jeyy', status: 'Active', statusColor: 'bg-green-100 text-green-700' },
  { id: 'KB-004', category: 'FAQ', title: 'Do you provide parking?', date: '2026-03-10 by System', status: 'Active', statusColor: 'bg-green-100 text-green-700' },
  { id: 'KB-005', category: 'Inclusions', title: 'Standard Lights & Sounds Specs', date: '2026-05-25 by Jeyy', status: 'Draft', statusColor: 'bg-gray-100 text-gray-600 border border-gray-200' },
];

export default function SupportCenter() {
  return (
    <div className="flex flex-col gap-6 h-full font-serif text-[#1a1f18]">
      
      {/* Header */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h2 className="text-2xl font-bold mb-1">Knowledge Base Repository</h2>
          <p className="text-gray-500 text-sm">Manage the ground-truth data that powers ZENTRA's AI responses. Ensure information here is accurate.</p>
        </div>
        
        <button className="flex items-center gap-2 bg-[#FDF5CC] hover:bg-[#EADE81] border border-[#EADE81] text-[#1a1f18] px-5 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add New Entry
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-[#FDF5CC] rounded-xl p-6 shadow-sm border border-black/5 flex-1 flex flex-col">
        
        {/* Inner White Box */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
          
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#fafafa]">
            <div className="flex gap-4">
              {/* Search */}
              <div className="relative w-[300px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </div>
                <input 
                  type="text" 
                  placeholder="Search knowledge entries..." 
                  className="w-full border border-gray-200 rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#BEA542] focus:ring-1 focus:ring-[#BEA542]"
                />
              </div>

              {/* Category Dropdown */}
              <select className="border border-gray-200 rounded-md py-2 px-3 text-sm text-gray-600 focus:outline-none focus:border-[#BEA542] focus:ring-1 focus:ring-[#BEA542] bg-white">
                <option>All Categories</option>
                <option>Payment Policy</option>
                <option>Venue Rules</option>
                <option>FAQ</option>
                <option>Inclusions</option>
              </select>
            </div>

            {/* Settings Icon */}
            <button className="text-gray-400 hover:text-[#1a1f18] transition-colors p-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[11px] text-gray-400 uppercase tracking-wider font-bold">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Title / Question</th>
                  <th className="px-6 py-4 text-right">Last Updated</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mockKnowledgeBase.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors cursor-pointer group">
                    <td className="px-6 py-4 text-sm text-gray-500">{item.id}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-[10px] font-bold text-blue-600 bg-blue-50 rounded border border-blue-100">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-[#1a1f18] flex items-center gap-2 group-hover:text-[#BEA542] transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                      </svg>
                      {item.title}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 text-right">{item.date}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase rounded tracking-wider ${item.statusColor}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>

    </div>
  );
}
