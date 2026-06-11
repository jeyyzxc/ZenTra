'use client';

import React from 'react';

export default function ReportsAndAnalytics() {
  return (
    <div className="flex flex-col gap-6 h-full font-serif text-[#1a1f18] pb-10">
      
      {/* Header Area */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Reports & Analytics</h2>
          <p className="text-gray-500">Business intelligence and performance metrics.</p>
        </div>
        
        <div className="flex gap-4">
          <button className="flex items-center gap-2 bg-[#FDF5CC] hover:bg-[#EADE81] border border-gray-200 text-[#1a1f18] px-4 py-2 rounded font-bold text-sm shadow-sm transition-colors">
            Last 6 months
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
          </button>
          <button className="bg-[#FDF5CC] hover:bg-[#EADE81] border border-gray-200 text-[#1a1f18] px-6 py-2 rounded font-bold text-sm shadow-sm transition-colors">
            Export PDF
          </button>
          <button className="bg-[#FDF5CC] hover:bg-[#EADE81] border border-gray-200 text-[#1a1f18] px-6 py-2 rounded font-bold text-sm shadow-sm transition-colors">
            Export CSV
          </button>
        </div>
      </div>

      {/* Top Row: Total Revenue & Placeholder */}
      <div className="flex gap-6 h-[350px]">
        
        {/* Total Revenue Line Chart */}
        <div className="flex-1 bg-[#FDF5CC] rounded-xl p-4 shadow-sm border border-black/5">
          <div className="bg-white rounded-lg h-full w-full p-6 shadow-sm flex flex-col relative border border-gray-100">
            <h3 className="text-[11px] font-bold text-black uppercase tracking-wider mb-6">Total Revenue Analytics</h3>
            
            <div className="flex-1 flex justify-between relative">
              {/* Y Axis */}
              <div className="flex flex-col justify-between text-[11px] text-gray-400 h-[calc(100%-20px)] pb-4 font-sans pr-2">
                <span>₱600k</span>
                <span>₱450k</span>
                <span>₱300k</span>
                <span>₱150k</span>
                <span>₱0k</span>
              </div>
              
              {/* Grid & Line */}
              <div className="flex-1 ml-2 relative">
                {/* Horizontal Grid lines */}
                <div className="absolute top-0 w-full border-t border-gray-100"></div>
                <div className="absolute top-[25%] w-full border-t border-gray-100"></div>
                <div className="absolute top-[50%] w-full border-t border-gray-100"></div>
                <div className="absolute top-[75%] w-full border-t border-gray-100"></div>
                <div className="absolute bottom-[20px] w-full border-t border-gray-200"></div>

                {/* X Axis */}
                <div className="absolute bottom-0 w-full flex justify-between text-[11px] text-gray-400 px-4 font-sans">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>

                {/* Mock SVG Line Chart */}
                <svg className="absolute inset-0 w-full h-[calc(100%-24px)]" preserveAspectRatio="none">
                  <polyline 
                    points="30,150 150,130 270,110 390,100 510,60 630,40" 
                    fill="none" 
                    stroke="#6366f1" 
                    strokeWidth="3" 
                  />
                  <circle cx="30" cy="150" r="5" fill="#6366f1" className="ring-2 ring-white" />
                  <circle cx="150" cy="130" r="5" fill="#6366f1" className="ring-2 ring-white" />
                  <circle cx="270" cy="110" r="5" fill="#6366f1" className="ring-2 ring-white" />
                  <circle cx="390" cy="100" r="5" fill="#6366f1" className="ring-2 ring-white" />
                  <circle cx="510" cy="60" r="5" fill="#6366f1" className="ring-2 ring-white" />
                  <circle cx="630" cy="40" r="5" fill="#6366f1" className="ring-2 ring-white" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Empty Placeholder Box */}
        <div className="w-[400px] bg-[#FDF5CC] rounded-xl shadow-sm border border-black/5"></div>

      </div>

      {/* Bottom Row: Monthly Bookings Status */}
      <div className="bg-[#FDF5CC] rounded-xl p-4 shadow-sm border border-black/5 h-[400px]">
        <div className="bg-white rounded-lg h-full w-full p-6 shadow-sm flex flex-col relative border border-gray-100">
          <h3 className="text-[11px] font-bold text-black uppercase tracking-wider mb-6">Monthly Bookings Status</h3>
          
          <div className="flex-1 flex justify-between relative mt-4">
            {/* Y Axis */}
            <div className="flex flex-col justify-between text-[11px] text-gray-400 h-[calc(100%-40px)] font-sans pr-4 w-8">
              <span>60</span>
              <span>45</span>
              <span>30</span>
              <span>15</span>
              <span>0</span>
            </div>
            
            {/* Grid & Bars */}
            <div className="flex-1 relative">
              {/* Horizontal Grid lines */}
              <div className="absolute top-0 w-full border-t border-gray-100"></div>
              <div className="absolute top-[25%] w-full border-t border-gray-100"></div>
              <div className="absolute top-[50%] w-full border-t border-gray-100"></div>
              <div className="absolute top-[75%] w-full border-t border-gray-100"></div>
              <div className="absolute bottom-[40px] w-full border-t border-gray-200"></div>

              {/* X Axis & Legend */}
              <div className="absolute bottom-4 w-full flex justify-around text-[11px] text-gray-400 font-sans px-8">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
              </div>

              {/* Legend at very bottom */}
              <div className="absolute -bottom-2 w-full flex justify-center gap-6 text-[10px] font-sans">
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#10b981]"></span><span className="text-gray-500">Secured</span></div>
                <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-300"></span><span className="text-gray-400">Cancelled</span></div>
              </div>

              {/* Bars (Mock implementation using absolute positioning for the design) */}
              {/* Jan */}
              <div className="absolute bottom-[40px] left-[12%] w-6 h-[25%] bg-[#cbd5e1] rounded-t-sm"></div>
              {/* Feb */}
              <div className="absolute bottom-[40px] left-[28%] w-6 h-[35%] bg-[#cbd5e1] rounded-t-sm"></div>
              {/* Mar */}
              <div className="absolute bottom-[40px] left-[45%] w-6 h-[45%] bg-[#cbd5e1] rounded-t-sm"></div>
              {/* Apr */}
              <div className="absolute bottom-[40px] left-[61%] w-6 h-[60%] bg-[#cbd5e1] rounded-t-sm group">
                {/* Tooltip on Apr */}
                <div className="absolute -top-[70px] -left-10 bg-white shadow-xl border border-gray-100 rounded-lg p-3 z-10 w-28 pointer-events-none">
                  <div className="text-[10px] font-bold text-gray-600 mb-1">Jan</div>
                  <div className="text-[10px] text-[#10b981] font-bold">Secured : 15</div>
                  <div className="text-[10px] text-gray-400">Cancelled : 3</div>
                </div>
              </div>
              {/* May */}
              <div className="absolute bottom-[40px] left-[78%] w-6 h-[75%] bg-[#cbd5e1] rounded-t-sm"></div>
              {/* Jun */}
              <div className="absolute bottom-[40px] left-[94%] w-6 h-[80%] bg-[#cbd5e1] rounded-t-sm"></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
