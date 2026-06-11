'use client';

import React from 'react';

export default function AdminDashboard() {
  return (
    <div className="flex gap-6 h-full font-serif text-[#1a1f18] dark:text-[#F4F4F0] transition-colors duration-500">
      
      {/* Left Column (Main Content) */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Top Header Row */}
        <div className="flex justify-between items-start">
          {/* Greeting */}
          <div>
            <p className="text-sm font-medium mb-4 text-[#1a1f18] dark:text-[#A3B19B] transition-colors duration-500">Wednesday, February 3, 2026</p>
            <h2 className="text-3xl font-bold mb-1 text-[#1a1f18] dark:text-[#F4F4F0] transition-colors duration-500">Hello, Jeyy! 👋</h2>
            <p className="text-sm text-[#1a1f18] dark:text-[#A3B19B] transition-colors duration-500">Track event progress and manage bookings here.</p>
          </div>

          {/* Zentra AI Summary */}
          <div className="bg-[#121A2F] dark:bg-[#141A13] border dark:border-[#D6B53B]/20 text-white rounded-xl p-4 w-[400px] shadow-md transition-colors duration-500">
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#B29DFB] dark:text-[#D6B53B]">
                <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z" clipRule="evenodd" />
              </svg>
              <h3 className="font-bold text-sm tracking-wide">ZENTRA AI Summary</h3>
            </div>
            <p className="text-xs text-gray-300 dark:text-[#A3B19B] mb-3 leading-relaxed">
              You have <span className="font-bold text-white dark:text-[#F4F4F0]">3 unanswered inquiries</span> from last night. Client <span className="font-bold text-white dark:text-[#F4F4F0]">Mark & Julia</span> needs contract validation today.
            </p>
            <ul className="text-[11px] text-gray-400 dark:text-[#A3B19B]/80 space-y-1 list-disc pl-4 mb-3">
              <li>2 pending downpayments expiring within 24h.</li>
              <li>1 automated email failed to send (Invoice #1042).</li>
              <li>Ocular visit scheduled today at 2:00 PM for Sarah's Debut.</li>
            </ul>
            <button className="text-[11px] text-[#B29DFB] dark:text-[#D6B53B] hover:underline font-medium">View full briefing →</button>
          </div>
        </div>

        {/* Chart Area */}
        <div className="bg-[#1a1f18] dark:bg-[#141A13] border dark:border-white/5 rounded-xl p-6 shadow-md h-[250px] relative mt-2 transition-colors duration-500">
          {/* Mock Chart UI */}
          <div className="flex justify-between h-full relative">
            {/* Y Axis */}
            <div className="flex flex-col justify-between text-xs text-gray-400 h-full pb-6">
              <span>₱600k</span>
              <span>₱450k</span>
              <span>₱300k</span>
              <span>₱150k</span>
              <span>₱0k</span>
            </div>
            
            {/* Grid & Line */}
            <div className="flex-1 ml-4 relative">
              {/* Horizontal Grid lines */}
              <div className="absolute top-0 w-full border-t border-gray-700 dark:border-white/5"></div>
              <div className="absolute top-[25%] w-full border-t border-gray-700 dark:border-white/5"></div>
              <div className="absolute top-[50%] w-full border-t border-gray-700 dark:border-white/5"></div>
              <div className="absolute top-[75%] w-full border-t border-gray-700 dark:border-white/5"></div>
              <div className="absolute bottom-6 w-full border-t border-gray-700 dark:border-white/5"></div>

              {/* X Axis */}
              <div className="absolute bottom-0 w-full flex justify-between text-xs text-gray-400 px-4">
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
              </div>

              {/* Mock SVG Line */}
              <svg className="absolute inset-0 w-full h-[calc(100%-24px)]" preserveAspectRatio="none">
                <polyline 
                  points="20,120 150,90 280,105 410,40 540,60 670,10" 
                  fill="none" 
                  stroke="#D6B53B" 
                  strokeWidth="3" 
                />
                <circle cx="20" cy="120" r="4" fill="#D6B53B" className="ring-2 ring-black" />
                <circle cx="150" cy="90" r="4" fill="#D6B53B" className="ring-2 ring-black" />
                <circle cx="280" cy="105" r="4" fill="#D6B53B" className="ring-2 ring-black" />
                <circle cx="410" cy="40" r="4" fill="#D6B53B" className="ring-2 ring-black" />
                <circle cx="540" cy="60" r="4" fill="#D6B53B" className="ring-2 ring-black" />
                <circle cx="670" cy="10" r="4" fill="#D6B53B" className="ring-2 ring-black" />
              </svg>
            </div>
          </div>
        </div>

        {/* Needs Action Box */}
        <div className="bg-[#FDF5CC] dark:bg-[#141A13] rounded-xl p-6 shadow-sm border border-black/5 dark:border-white/5 flex-1 transition-colors duration-500">
          <h3 className="text-xl font-bold mb-6 text-[#1a1f18] dark:text-[#F4F4F0] transition-colors duration-500">Needs Action</h3>
          
          <div className="space-y-4">
            
            {/* Item 1 */}
            <div className="bg-white dark:bg-[#1A2218] rounded-lg p-4 flex gap-4 items-start shadow-sm border border-transparent dark:border-white/5 transition-colors duration-500">
              <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500 dark:text-orange-400 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h4 className="font-bold text-sm text-[#1a1f18] dark:text-[#F4F4F0] transition-colors duration-500">Booking Nearing Expiration</h4>
                  <span className="text-xs text-gray-400 dark:text-[#A3B19B]">2 hrs left</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-[#A3B19B]/80 mt-1 mb-3 transition-colors duration-500">Client <span className="font-bold text-[#1a1f18] dark:text-[#F4F4F0]">Alice & Bob</span> (Wedding) has not paid the downpayment. Hold expires soon.</p>
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded text-xs font-medium border border-gray-200 dark:border-white/10 dark:text-[#F4F4F0] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">Extend Hold</button>
                  <button className="px-3 py-1 rounded text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">Release Date</button>
                </div>
              </div>
            </div>

            {/* Item 2 */}
            <div className="bg-white dark:bg-[#1A2218] rounded-lg p-4 flex gap-4 items-start shadow-sm border border-transparent dark:border-white/5 transition-colors duration-500">
              <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-500 dark:text-pink-400 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h4 className="font-bold text-sm text-[#1a1f18] dark:text-[#F4F4F0] transition-colors duration-500">Email Delivery Failed</h4>
                  <span className="text-xs text-gray-400 dark:text-[#A3B19B]">Just now</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-[#A3B19B]/80 mt-1 mb-3 transition-colors duration-500">System failed to send contract draft to <span className="font-bold text-[#1a1f18] dark:text-[#F4F4F0]">Company XMAS Party</span>.</p>
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">Resolve Fallback</button>
                </div>
              </div>
            </div>

             {/* Item 3 */}
             <div className="bg-white dark:bg-[#1A2218] rounded-lg p-4 flex gap-4 items-start shadow-sm border border-transparent dark:border-white/5 transition-colors duration-500">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 dark:text-blue-400 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h4 className="font-bold text-sm text-[#1a1f18] dark:text-[#F4F4F0] transition-colors duration-500">Ocular Visit Today</h4>
                  <span className="text-xs text-gray-400 dark:text-[#A3B19B]">2:00 PM</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-[#A3B19B]/80 mt-1 mb-1 transition-colors duration-500">Sarah's 18th Debut (50 Pax). Expected arrival in 4 hours.</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Right Column (Sidebar Widgets) */}
      <div className="w-[300px] flex flex-col gap-6">
        
        {/* Schedule Calendar Widget */}
        <div className="bg-[#FDF5CC] dark:bg-[#141A13] rounded-xl p-6 shadow-sm border border-black/5 dark:border-white/5 transition-colors duration-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[#1a1f18] dark:text-[#F4F4F0] transition-colors duration-500">Schedule</h3>
            <span className="text-xs text-gray-400 dark:text-[#A3B19B] cursor-pointer hover:underline">See All</span>
          </div>
          
          <div className="bg-white dark:bg-[#1A2218] rounded-lg p-3 transition-colors duration-500">
            <div className="flex justify-between items-center mb-3">
              <button className="bg-gray-100 dark:bg-white/5 dark:text-[#F4F4F0] p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg></button>
              <span className="text-sm font-bold text-[#1a1f18] dark:text-[#F4F4F0] transition-colors duration-500">February 2026</span>
              <button className="bg-gray-100 dark:bg-white/5 dark:text-[#F4F4F0] p-1 rounded hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg></button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              <span className="font-medium text-gray-500 dark:text-[#A3B19B] mb-1">Sun</span>
              <span className="font-medium text-gray-500 dark:text-[#A3B19B] mb-1">Mon</span>
              <span className="font-medium text-gray-500 dark:text-[#A3B19B] mb-1">Tue</span>
              <span className="font-medium text-gray-500 dark:text-[#A3B19B] mb-1">Wed</span>
              <span className="font-medium text-gray-500 dark:text-[#A3B19B] mb-1">Thu</span>
              <span className="font-medium text-gray-500 dark:text-[#A3B19B] mb-1">Fri</span>
              <span className="font-medium text-gray-500 dark:text-[#A3B19B] mb-1">Sat</span>
              
              <span className="text-gray-800 dark:text-[#F4F4F0]">1</span><span className="text-gray-800 dark:text-[#F4F4F0]">2</span><span className="text-[#D6B53B] font-bold border-b-2 border-[#D6B53B]">3</span><span className="text-gray-800 dark:text-[#F4F4F0]">4</span><span className="text-gray-800 dark:text-[#F4F4F0]">5</span><span className="text-gray-800 dark:text-[#F4F4F0]">6</span><span className="text-red-500 dark:text-red-400 font-bold">7</span>
              <span className="text-gray-800 dark:text-[#F4F4F0]">8</span><span className="text-gray-800 dark:text-[#F4F4F0]">9</span><span className="text-red-500 dark:text-red-400 font-bold">10</span><span className="text-gray-800 dark:text-[#F4F4F0]">11</span><span className="text-gray-800 dark:text-[#F4F4F0]">12</span><span className="text-gray-800 dark:text-[#F4F4F0]">13</span><span className="text-red-500 dark:text-red-400 font-bold">14</span>
              <span className="text-gray-800 dark:text-[#F4F4F0]">15</span><span className="text-gray-800 dark:text-[#F4F4F0]">16</span><span className="text-gray-800 dark:text-[#F4F4F0]">17</span><span className="text-gray-800 dark:text-[#F4F4F0]">18</span><span className="text-red-500 dark:text-red-400 font-bold">19</span><span className="text-gray-800 dark:text-[#F4F4F0]">20</span><span className="text-gray-800 dark:text-[#F4F4F0]">21</span>
              <span className="text-red-500 dark:text-red-400 font-bold">22</span><span className="text-gray-800 dark:text-[#F4F4F0]">23</span><span className="text-gray-800 dark:text-[#F4F4F0]">24</span><span className="text-gray-800 dark:text-[#F4F4F0]">25</span><span className="text-gray-800 dark:text-[#F4F4F0]">26</span><span className="text-gray-800 dark:text-[#F4F4F0]">27</span><span className="text-gray-800 dark:text-[#F4F4F0]">28</span>
            </div>
          </div>
        </div>

        {/* Today's Agenda Widget */}
        <div className="bg-[#FDF5CC] dark:bg-[#141A13] rounded-xl p-6 shadow-sm border border-black/5 dark:border-white/5 flex-1 transition-colors duration-500">
           <div className="flex justify-between items-center mb-1">
            <h3 className="font-bold text-lg text-[#1a1f18] dark:text-[#F4F4F0] transition-colors duration-500">Today's Agenda</h3>
            <span className="text-gray-400 dark:text-[#A3B19B] tracking-widest text-xl leading-none">...</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-[#A3B19B] mb-4 transition-colors duration-500">3 February 2026</p>

          <div className="space-y-3">
            <div className="bg-[#EBE3AE] dark:bg-white/5 h-12 rounded-lg border-l-4 border-white dark:border-[#D6B53B] transition-colors duration-500"></div>
            <div className="bg-[#EBE3AE] dark:bg-white/5 h-12 rounded-lg border-l-4 border-white dark:border-[#D6B53B] transition-colors duration-500"></div>
            <div className="bg-[#EBE3AE] dark:bg-white/5 h-12 rounded-lg border-l-4 border-white dark:border-[#D6B53B] transition-colors duration-500"></div>
          </div>
        </div>

        {/* Upcoming Events Widget */}
        <div className="bg-[#FDF5CC] dark:bg-[#141A13] rounded-xl p-6 shadow-sm border border-black/5 dark:border-white/5 flex-1 transition-colors duration-500">
           <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-[#1a1f18] dark:text-[#F4F4F0] transition-colors duration-500">Upcoming Events</h3>
            <span className="text-xs text-gray-600 dark:text-[#A3B19B] font-medium cursor-pointer hover:underline">View All</span>
          </div>

          <div className="space-y-3">
            <div className="bg-[#EBE3AE] dark:bg-white/5 h-10 rounded-lg transition-colors duration-500"></div>
            <div className="bg-[#EBE3AE] dark:bg-white/5 h-10 rounded-lg transition-colors duration-500"></div>
            <div className="bg-[#EBE3AE] dark:bg-white/5 h-10 rounded-lg transition-colors duration-500"></div>
          </div>
        </div>

      </div>

    </div>
  );
}
