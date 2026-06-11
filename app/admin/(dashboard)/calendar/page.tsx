'use client';

import React from 'react';

export default function Calendar() {
  // Generate a mock array for a 30-day month starting on Monday
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);
  const emptyDaysStart = 0; // Starts on Sunday (1st is Monday, so 1 empty slot for Sunday)

  return (
    <div className="h-full bg-[#FDF5CC] rounded-xl shadow-sm border border-black/5 flex flex-col font-serif">
      
      {/* Calendar Header */}
      <div className="p-6 flex items-center gap-6 border-b border-black/5 bg-[#FDF5CC] rounded-t-xl">
        <h2 className="text-2xl font-bold text-[#1a1f18]">June 2026</h2>
        
        {/* Navigation Buttons */}
        <div className="flex bg-white rounded-md shadow-sm overflow-hidden border border-gray-200">
          <button className="px-3 py-1.5 hover:bg-gray-50 text-gray-600 transition-colors border-r border-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
          </button>
          <button className="px-4 py-1.5 hover:bg-gray-50 text-[#1a1f18] transition-colors border-r border-gray-200 font-medium">
            Today
          </button>
          <button className="px-3 py-1.5 hover:bg-gray-50 text-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-6">
        <div className="h-full grid grid-cols-7 gap-4">
          
          {/* Days of Week */}
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
            <div key={day} className="text-center font-medium text-gray-500 mb-2 tracking-widest text-sm">
              {day}
            </div>
          ))}

          {/* Empty Cells for alignment */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[120px] p-3 text-gray-300"></div>

          {/* Month Days */}
          {daysInMonth.map((day) => (
            <div 
              key={day} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[120px] p-3 hover:shadow-md transition-shadow cursor-pointer relative group"
            >
              <span className="text-gray-500 text-lg group-hover:text-black font-medium">{day}</span>
              
              {/* Mock event indicators for some days */}
              {day === 12 && (
                <div className="absolute bottom-3 left-3 right-3 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded truncate">
                  Jerome & Steph Wedding
                </div>
              )}
              {day === 18 && (
                <div className="absolute bottom-3 left-3 right-3 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded truncate">
                  Mark & Julia Reception
                </div>
              )}
              {day === 20 && (
                <div className="absolute bottom-3 left-3 right-3 bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-1 rounded truncate">
                  Sarah's 18th Debut
                </div>
              )}
            </div>
          ))}
          
          {/* Padding empty cells for the end of the grid (to make 35 total cells = 5 rows) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[120px] p-3 text-gray-300"></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[120px] p-3 text-gray-300"></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[120px] p-3 text-gray-300"></div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[120px] p-3 text-gray-300"></div>

        </div>
      </div>

    </div>
  );
}
