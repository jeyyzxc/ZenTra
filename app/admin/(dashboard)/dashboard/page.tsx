'use client';

import React, { useState, useEffect } from 'react';

// Mock Data
const initialActionItems = [
  { id: 1, type: 'warning', title: 'Booking Nearing Expiration', time: '2 hrs left', desc: 'Client Alice & Bob (Wedding) has not paid the downpayment. Hold expires soon.', actions: ['Extend Hold', 'Release Date'] },
  { id: 2, type: 'error', title: 'Email Delivery Failed', time: 'Just now', desc: 'System failed to send contract draft to Company XMAS Party.', actions: ['Resolve Fallback'] },
  { id: 3, type: 'info', title: 'Ocular Visit Today', time: '2:00 PM', desc: 'Sarah\'s 18th Debut (50 Pax). Expected arrival in 4 hours.', actions: [] }
];

const initialAgenda = [
  { id: 1, text: 'Finalize catering menu with Chef', completed: false, time: '10:00 AM' },
  { id: 2, text: 'Review floral arrangement mockup', completed: false, time: '11:30 AM' },
  { id: 3, text: 'Approve new lighting vendor contract', completed: false, time: '2:00 PM' },
];

const upcomingEventsData = [
  { id: 1, name: 'Alice & Bob Wedding', date: 'Feb 14, 2026', type: 'Wedding', status: 'Confirmed' },
  { id: 2, name: 'Tech Corp Gala', date: 'Feb 18, 2026', type: 'Corporate', status: 'Pending' },
  { id: 3, name: 'Sarah 18th Debut', date: 'Feb 25, 2026', type: 'Birthday', status: 'Confirmed' },
];

const chartData = [
  { month: 'Aug', revenue: 210, bookings: 5 },
  { month: 'Sep', revenue: 320, bookings: 12 },
  { month: 'Oct', revenue: 280, bookings: 9 },
  { month: 'Nov', revenue: 450, bookings: 18 },
  { month: 'Dec', revenue: 580, bookings: 24 },
  { month: 'Jan', revenue: 420, bookings: 15 },
  { month: 'Feb', revenue: 610, bookings: 28 },
];

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  
  // Interactive States
  const [actionItems, setActionItems] = useState(initialActionItems);
  const [agenda, setAgenda] = useState(initialAgenda);
  
  // Calendar States
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  
  // Chart Hover State
  const [hoveredData, setHoveredData] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
    setCurrentDate(new Date());
  }, []);

  if (!mounted || !currentDate) return null;

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(currentDate);

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  
  const currentYear = calendarDate.getFullYear();
  const currentMonthNum = calendarDate.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonthNum);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonthNum);
  
  const handlePrevMonth = () => setCalendarDate(new Date(currentYear, currentMonthNum - 1, 1));
  const handleNextMonth = () => setCalendarDate(new Date(currentYear, currentMonthNum + 1, 1));

  const handleActionClick = (id: number) => {
    setActionItems(items => items.filter(i => i.id !== id));
  };

  const toggleAgenda = (id: number) => {
    setAgenda(items => items.map(i => i.id === id ? { ...i, completed: !i.completed } : i));
  };

  return (
    <div className={`flex gap-6 h-full font-serif text-[#1a1f18] dark:text-[#F4F4F0] transition-all duration-700 ease-out transform ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      
      {/* Left Column (Main Content) */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Top Header Row */}
        <div className="flex justify-between items-start">
          {/* Page Title */}
          <div>
            <p className="text-[13px] font-bold tracking-widest uppercase mb-4 text-[#D6B53B] transition-colors duration-500">
              {formattedDate}
            </p>
            <h2 className="text-3xl font-bold mb-1 text-[#1a1f18] dark:text-[#F4F4F0] transition-colors duration-500 tracking-tight">
              Dashboard
            </h2>
            <p className="text-sm text-gray-500 dark:text-[#A3B19B] transition-colors duration-500 font-sans tracking-wide font-medium">
              Track event progress and manage bookings here.
            </p>
          </div>

          {/* Zeni AI Greeting & Summary */}
          <div className="bg-white dark:bg-[#141A13] border border-gray-100 dark:border-white/5 rounded-2xl p-5 w-[460px] shadow-sm hover:shadow-md transition-all duration-500 flex flex-col gap-4 relative overflow-hidden group">
            {/* Soft background glow to make Zeni feel magical and generous */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-[#FDF5CC]/50 to-transparent dark:from-[#D6B53B]/10 dark:to-transparent rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
            
            {/* Chat Header / Identity */}
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FDF5CC] to-white dark:from-[#D6B53B]/20 dark:to-[#1A2218] border border-[#D6B53B]/30 flex items-center justify-center shadow-sm relative">
                {/* Online indicator dot */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white dark:border-[#141A13] rounded-full"></div>
                <img src="/zion-logo.png" alt="Zeni" className="w-6 h-6 object-contain filter dark:invert dark:brightness-0" />
              </div>
              <div>
                <h3 className="font-bold text-[15px] text-gray-900 dark:text-[#F4F4F0] tracking-wide font-sans flex items-center gap-2">
                  Zeni ✨
                  <span className="bg-[#D6B53B]/10 text-[#D6B53B] text-[8.5px] uppercase tracking-widest px-2 py-0.5 rounded-full font-bold">Your Smart Assistant</span>
                </h3>
                <p className="text-[11.5px] text-gray-400 dark:text-[#A3B19B] font-medium italic mt-0.5">Online & ready to help you!</p>
              </div>
            </div>

            {/* Chat Bubble Style Summary */}
            <div className="bg-gray-50/80 dark:bg-[#1A2218] rounded-2xl rounded-tl-sm p-4.5 text-[13px] text-gray-700 dark:text-[#A3B19B] font-medium leading-relaxed shadow-inner border border-gray-100/50 dark:border-white/5 relative z-10">
              <p className="mb-3 text-gray-800 dark:text-[#F4F4F0]">
                Good morning, Jeyy! 👋 I hope you're having a beautiful day today. 💕 I've happily reviewed your dashboard and compiled a quick summary for you:
              </p>
              <ul className="space-y-2 list-none font-sans bg-white/50 dark:bg-[#141A13]/50 p-3 rounded-xl border border-white/50 dark:border-white/5">
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-[#B29DFB]/20 text-[#B29DFB] dark:bg-[#D6B53B]/20 dark:text-[#D6B53B] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fi fi-rr-comment-alt text-[10px] leading-[0]"></i>
                  </div>
                  <span className="text-[12.5px] leading-snug">You have <strong className="text-gray-900 dark:text-white">3 unanswered inquiries</strong>. Mark & Julia need contract validation.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fi fi-rr-time-fast text-[10px] leading-[0]"></i>
                  </div>
                  <span className="text-[12.5px] leading-snug">There are <strong className="text-gray-900 dark:text-white">2 downpayments</strong> expiring very soon!</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-green-100 text-green-500 dark:bg-green-900/30 dark:text-green-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <i className="fi fi-rr-calendar-star text-[10px] leading-[0]"></i>
                  </div>
                  <span className="text-[12.5px] leading-snug">A lovely ocular visit is scheduled today at 2:00 PM.</span>
                </li>
              </ul>
              <p className="mt-3 text-[11.5px] text-[#D6B53B] font-semibold italic text-center">
                I'm always here if you need me!
              </p>
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="bg-white dark:bg-[#141A13] border border-gray-100 dark:border-white/5 rounded-2xl p-6 shadow-sm h-[320px] relative mt-2 transition-all duration-500 group hover:shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[16px] font-bold text-gray-900 dark:text-[#F4F4F0] tracking-tight font-sans">Revenue & Booking Trends</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#D6B53B]"></div>
                <span className="text-xs font-semibold text-gray-500 dark:text-[#A3B19B] uppercase tracking-widest">Revenue (k)</span>
              </div>
            </div>
          </div>

          {/* Interactive Chart UI */}
          <div className="flex justify-between h-[200px] relative">
            {/* Y Axis */}
            <div className="flex flex-col justify-between text-[11px] font-bold text-gray-400 dark:text-[#A3B19B]/70 h-full pb-6 z-10 w-12 font-sans">
              <span>₱600k</span>
              <span>₱450k</span>
              <span>₱300k</span>
              <span>₱150k</span>
              <span>₱0k</span>
            </div>
            
            {/* Grid & Line */}
            <div className="flex-1 ml-2 relative group/chart cursor-crosshair">
              {/* Horizontal Grid lines */}
              {[0, 25, 50, 75, 100].map((pos, i) => (
                <div key={i} className="absolute w-full border-t border-gray-100 dark:border-white/5 transition-colors duration-500" style={{ top: `${pos}%` }}></div>
              ))}

              {/* X Axis */}
              <div className="absolute bottom-[-24px] w-full flex justify-between text-[11px] font-bold text-gray-400 dark:text-[#A3B19B]/70 font-sans px-2">
                {chartData.map((d, i) => <span key={i}>{d.month}</span>)}
              </div>

              {/* Custom SVG Line Chart */}
              <svg className="absolute inset-0 w-full h-[calc(100%-24px)] overflow-visible" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D6B53B" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#D6B53B" stopOpacity="0" />
                  </linearGradient>
                </defs>
                
                {/* Dynamically calculated polyline points */}
                <polygon 
                  points={`0,200 ${chartData.map((d, i) => `${(i / (chartData.length - 1)) * 100}%,${200 - (d.revenue / 600) * 200}`).join(' ')} 100%,200`} 
                  fill="url(#revenueGradient)" 
                  className="transition-all duration-1000 ease-out"
                />
                
                <polyline 
                  points={chartData.map((d, i) => `${(i / (chartData.length - 1)) * 100}%,${200 - (d.revenue / 600) * 200}`).join(' ')}
                  fill="none" 
                  stroke="#D6B53B" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-1000 ease-out drop-shadow-[0_4px_8px_rgba(214,181,59,0.5)]"
                />
                
                {/* Interactive Points */}
                {chartData.map((d, i) => (
                  <g 
                    key={i} 
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredData(i)}
                    onMouseLeave={() => setHoveredData(null)}
                  >
                    {/* Invisible larger circle for easier hovering */}
                    <circle 
                      cx={`${(i / (chartData.length - 1)) * 100}%`} 
                      cy={`${200 - (d.revenue / 600) * 200}`} 
                      r="20" 
                      fill="transparent" 
                    />
                    {/* Visible circle */}
                    <circle 
                      cx={`${(i / (chartData.length - 1)) * 100}%`} 
                      cy={`${200 - (d.revenue / 600) * 200}`} 
                      r={hoveredData === i ? "6" : "4"} 
                      fill={hoveredData === i ? "#fff" : "#D6B53B"} 
                      stroke="#141A13"
                      strokeWidth="2"
                      className="transition-all duration-300"
                    />
                    
                    {/* Tooltip */}
                    <g className={`transition-all duration-300 ${hoveredData === i ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} pointer-events-none`} transform={`translate(0, ${200 - (d.revenue / 600) * 200 - 45})`}>
                      <rect x={`calc(${(i / (chartData.length - 1)) * 100}% - 40px)`} y="0" width="80" height="35" rx="6" fill="#1a1f18" className="dark:fill-[#1A2218] shadow-lg border dark:border-white/10" />
                      <text x={`${(i / (chartData.length - 1)) * 100}%`} y="15" textAnchor="middle" fill="#A3B19B" fontSize="10" fontWeight="bold" fontFamily="sans-serif">₱{d.revenue}k</text>
                      <text x={`${(i / (chartData.length - 1)) * 100}%`} y="28" textAnchor="middle" fill="#fff" fontSize="9" fontFamily="sans-serif">{d.bookings} Bookings</text>
                    </g>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* Needs Action Box */}
        <div className="bg-white dark:bg-[#141A13] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5 flex-1 transition-all duration-500 hover:shadow-md flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-[18px] font-bold text-gray-900 dark:text-[#F4F4F0] tracking-tight font-sans flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              Needs Action
            </h3>
            <span className="text-[11px] font-bold text-gray-400 dark:text-[#A3B19B] uppercase tracking-widest">{actionItems.length} Pending</span>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {actionItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-[#A3B19B]/50 gap-2">
                <i className="fi fi-rr-check-circle text-4xl"></i>
                <p className="font-sans text-sm font-medium">All caught up!</p>
              </div>
            ) : (
              actionItems.map(item => (
                <div key={item.id} className="bg-gray-50/50 dark:bg-[#1A2218] rounded-xl p-4 flex gap-4 items-start border border-gray-100 dark:border-white/5 transition-all duration-500 hover:border-[#D6B53B]/30 hover:shadow-sm group">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    item.type === 'warning' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400' :
                    item.type === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400' :
                    'bg-blue-100 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400'
                  }`}>
                    {item.type === 'warning' && <i className="fi fi-rr-time-fast text-lg leading-[0]"></i>}
                    {item.type === 'error' && <i className="fi fi-rr-envelope text-lg leading-[0]"></i>}
                    {item.type === 'info' && <i className="fi fi-rr-eye text-lg leading-[0]"></i>}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-[13.5px] text-gray-900 dark:text-[#F4F4F0] font-sans tracking-wide transition-colors duration-500">{item.title}</h4>
                      <span className="text-[11px] font-bold text-gray-400 dark:text-[#A3B19B] uppercase tracking-widest">{item.time}</span>
                    </div>
                    <p className="text-[13px] text-gray-500 dark:text-[#A3B19B]/90 font-medium mb-3 transition-colors duration-500 leading-relaxed font-sans">{item.desc}</p>
                    <div className="flex gap-2">
                      {item.actions.map(action => (
                        <button 
                          key={action}
                          onClick={() => handleActionClick(item.id)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all duration-300 transform active:scale-95 ${
                            action.includes('Release') 
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40' 
                              : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-[#F4F4F0] hover:bg-gray-50 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20'
                          }`}
                        >
                          {action}
                        </button>
                      ))}
                      {item.actions.length === 0 && (
                         <button 
                         onClick={() => handleActionClick(item.id)}
                         className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all duration-300 transform active:scale-95 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-[#F4F4F0] hover:bg-gray-50 dark:hover:bg-white/10"
                       >
                         Acknowledge
                       </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Column (Sidebar Widgets) */}
      <div className="w-[340px] flex flex-col gap-6">
        
        {/* Schedule Calendar Widget */}
        <div className="relative rounded-2xl bg-white dark:bg-[#141A13] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 dark:border-white/5 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] group overflow-hidden">
          {/* Decorative glowing orb */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#D6B53B]/5 dark:bg-[#D6B53B]/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-700"></div>

          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="font-bold text-[16px] text-gray-900 dark:text-[#F4F4F0] font-sans tracking-tight flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#D6B53B]/10 flex items-center justify-center text-[#D6B53B] transition-transform duration-300 group-hover:scale-110">
                <i className="fi fi-rr-calendar leading-[0] text-sm"></i>
              </div>
              Schedule
            </h3>
            <button className="text-[11px] font-bold text-gray-400 hover:text-[#D6B53B] dark:text-[#A3B19B] transition-colors bg-gray-50 hover:bg-[#D6B53B]/10 dark:bg-white/5 dark:hover:bg-[#D6B53B]/20 px-2.5 py-1.5 rounded-md uppercase tracking-widest flex items-center gap-1.5 shadow-sm active:scale-95 transform duration-300">
              <i className="fi fi-rr-add text-[9px]"></i> Add
            </button>
          </div>
          
          <div className="bg-gradient-to-b from-gray-50/80 to-transparent dark:from-[#1A2218]/80 dark:to-transparent rounded-xl p-4 transition-colors duration-500 border border-gray-100/50 dark:border-white/5 relative z-10 backdrop-blur-sm shadow-inner">
            {/* Elegant Month Selector */}
            <div className="flex justify-between items-center mb-5 bg-white dark:bg-[#141A13] rounded-full p-1 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow transition-shadow duration-300">
              <button onClick={handlePrevMonth} className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 dark:text-[#A3B19B] hover:bg-gray-50 dark:hover:bg-white/5 hover:text-[#D6B53B] transition-all transform active:scale-90"><i className="fi fi-rr-angle-small-left text-lg leading-[0]"></i></button>
              <span className="text-[12.5px] font-bold tracking-widest uppercase text-gray-800 dark:text-[#F4F4F0] transition-colors duration-500 select-none">
                {new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(calendarDate)}
              </span>
              <button onClick={handleNextMonth} className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 dark:text-[#A3B19B] hover:bg-gray-50 dark:hover:bg-white/5 hover:text-[#D6B53B] transition-all transform active:scale-90"><i className="fi fi-rr-angle-small-right text-lg leading-[0]"></i></button>
            </div>
            
            <div className="grid grid-cols-7 gap-1.5 text-center mb-3 pb-2 border-b border-gray-100 dark:border-white/5">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <span key={day} className="text-[9px] font-extrabold text-gray-400 dark:text-[#A3B19B]/70 uppercase tracking-widest">{day}</span>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-y-2 gap-x-1.5 text-center">
              {/* Empty cells for starting day */}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`}></div>)}
              
              {/* Calendar Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isSelected = day === selectedDate && currentMonthNum === new Date().getMonth();
                const isToday = day === new Date().getDate() && currentMonthNum === new Date().getMonth() && currentYear === new Date().getFullYear();
                const hasEvent = [14, 18, 25].includes(day) && currentMonthNum === 1; // Fake events in Feb
                
                return (
                  <button 
                    key={day}
                    onClick={() => setSelectedDate(day)}
                    className={`h-8 w-full rounded-[10px] text-[12.5px] font-semibold tracking-wide transition-all duration-300 relative font-sans flex items-center justify-center
                      ${isSelected ? 'bg-gradient-to-br from-[#D6B53B] to-[#B39327] text-white shadow-[0_4px_12px_rgba(214,181,59,0.35)] transform scale-110 z-10 border border-[#D6B53B]/50' 
                        : 'text-gray-600 dark:text-[#A3B19B] hover:bg-[#D6B53B]/10 hover:text-[#D6B53B] dark:hover:bg-[#D6B53B]/20 hover:scale-105 active:scale-95 border border-transparent hover:border-[#D6B53B]/20'}
                      ${isToday && !isSelected ? 'ring-1 ring-inset ring-[#D6B53B]/40 bg-[#D6B53B]/5 dark:bg-[#D6B53B]/10 text-[#D6B53B]' : ''}
                    `}
                  >
                    {day}
                    {/* Event Indicator Dot */}
                    {hasEvent && !isSelected && (
                      <span className="absolute bottom-[3px] w-[3px] h-[3px] rounded-full bg-[#D6B53B] shadow-[0_0_4px_rgba(214,181,59,0.8)]"></span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Today's Agenda Widget */}
        <div className="bg-white dark:bg-[#141A13] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5 flex-1 transition-all duration-500 hover:shadow-md flex flex-col">
           <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-[16px] text-gray-900 dark:text-[#F4F4F0] font-sans tracking-tight flex items-center gap-2">
              <i className="fi fi-rr-list-check leading-[0] text-[#D6B53B]"></i>
              Today's Agenda
            </h3>
            <button className="text-[11px] font-bold text-gray-400 hover:text-[#D6B53B] dark:text-[#A3B19B] uppercase tracking-widest transition-colors"><i className="fi fi-rr-add"></i> Add</button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {agenda.map(item => (
              <div 
                key={item.id} 
                onClick={() => toggleAgenda(item.id)}
                className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 cursor-pointer group hover:border-[#D6B53B]/50 ${item.completed ? 'bg-gray-50/50 dark:bg-white/[0.02] border-transparent opacity-60' : 'bg-white dark:bg-[#1A2218] border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md'}`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors duration-300 ${item.completed ? 'bg-[#D6B53B] text-white' : 'border-2 border-gray-300 dark:border-white/20 group-hover:border-[#D6B53B]'}`}>
                  {item.completed && <i className="fi fi-rr-check text-[10px] leading-[0] font-bold"></i>}
                </div>
                <div>
                  <h4 className={`text-[13.5px] font-sans font-semibold tracking-wide transition-all duration-300 ${item.completed ? 'text-gray-400 dark:text-[#A3B19B] line-through' : 'text-gray-800 dark:text-[#F4F4F0]'}`}>{item.text}</h4>
                  <p className="text-[11px] font-bold text-gray-400 dark:text-[#A3B19B]/70 uppercase tracking-widest mt-1"><i className="fi fi-rr-clock-three mr-1"></i>{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events Widget */}
        <div className="bg-white dark:bg-[#141A13] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-white/5 flex-1 transition-all duration-500 hover:shadow-md flex flex-col">
           <div className="flex justify-between items-center mb-5">
            <h3 className="font-bold text-[16px] text-gray-900 dark:text-[#F4F4F0] font-sans tracking-tight flex items-center gap-2">
              <i className="fi fi-rr-star leading-[0] text-[#D6B53B]"></i>
              Upcoming Events
            </h3>
            <span className="text-[11px] font-bold text-[#D6B53B] cursor-pointer hover:underline uppercase tracking-widest">View All</span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {upcomingEventsData.map(event => (
              <div key={event.id} className="group relative flex items-center justify-between p-3 rounded-xl bg-gray-50/50 dark:bg-[#1A2218] border border-gray-100 dark:border-white/5 transition-all duration-300 hover:border-[#D6B53B]/30 hover:shadow-sm overflow-hidden">
                <div>
                  <h4 className="text-[13.5px] font-semibold text-gray-900 dark:text-[#F4F4F0] font-sans tracking-wide mb-1 transition-colors duration-500">{event.name}</h4>
                  <p className="text-[11px] font-bold text-gray-400 dark:text-[#A3B19B] uppercase tracking-widest flex items-center gap-2">
                    <i className="fi fi-rr-calendar-day"></i>{event.date}
                  </p>
                </div>
                <div className="text-right transition-transform duration-300 group-hover:-translate-x-10">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${event.status === 'Confirmed' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'}`}>
                    {event.status}
                  </span>
                </div>
                {/* Hover Reveal Button */}
                <div className="absolute right-3 opacity-0 translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#D6B53B] text-white shadow-md hover:scale-110 transition-transform">
                    <i className="fi fi-rr-arrow-right leading-[0]"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Inject custom scrollbar style specifically for these small containers to keep it elegant */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(214, 181, 59, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: rgba(214, 181, 59, 0.5);
        }
      `}} />
    </div>
  );
}
