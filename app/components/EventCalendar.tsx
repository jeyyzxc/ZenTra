"use client";

import React, { useState } from 'react';

export default function EventCalendar() {
  const [today] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [currentDate, setCurrentDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    const prev = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(prev);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthName = monthNames[month];

  // Disable "Previous" button if we are in the current month/year to prevent browsing past months
  const isPrevDisabled = year === today.getFullYear() && month === today.getMonth();

  return (
    <div className="bg-[#EAE5C3] border border-[#3A4B3C]/10 rounded-[2.5rem] p-6 md:p-8 shadow-xl w-full relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/40 blur-3xl rounded-full pointer-events-none" />

      {/* Month Selector */}
      <div className="flex items-center justify-between bg-white/60 backdrop-blur-md rounded-2xl py-3 px-5 mb-6 shadow-sm border border-white/50 relative z-10">
        <button 
          onClick={prevMonth} 
          disabled={isPrevDisabled}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
            isPrevDisabled 
              ? 'text-black/20 cursor-not-allowed' 
              : 'bg-white text-[#3A4B3C] shadow-sm hover:shadow-md hover:scale-105'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex items-center gap-2 text-xl md:text-2xl font-serif text-[#3A4B3C] font-semibold tracking-wide">
          <span>{monthName} {year}</span>
        </div>
        
        <button 
          onClick={nextMonth} 
          className="w-10 h-10 flex items-center justify-center bg-white text-[#3A4B3C] shadow-sm rounded-full hover:shadow-md hover:scale-105 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      {/* Calendar Grid */}
      <div className="relative z-10">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 md:mb-4">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} className="text-center font-serif text-[#3A4B3C]/60 text-xs md:text-sm uppercase tracking-widest font-bold">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {/* Empty padding slots */}
          {paddingDays.map(pad => (
            <div key={`pad-${pad}`} className="h-10 md:h-12 w-full" />
          ))}

          {/* Actual Days */}
          {days.map(day => {
            const dateObj = new Date(year, month, day);
            const isPast = dateObj < today;
            
            // Deterministically mock some days as booked for aesthetic/demo purposes
            const isBooked = !isPast && (day % 11 === 0 || day % 17 === 0);
            
            const dateString = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            const isSelected = selectedDate === dateString;
            
            return (
              <div 
                key={day}
                onClick={() => {
                  if (!isPast && !isBooked) setSelectedDate(dateString);
                }}
                className={`
                  relative h-10 md:h-12 w-full flex items-center justify-center rounded-xl text-base md:text-lg font-sans transition-all duration-300
                  ${isPast 
                    ? 'text-[#3A4B3C]/20 cursor-not-allowed' 
                    : isBooked 
                      ? 'bg-[#E0E0E0] text-[#9E9E9E] cursor-not-allowed border border-black/5 shadow-inner' 
                      : isSelected 
                        ? 'bg-[#2F3E32] text-[#EAE5C3] shadow-lg scale-110 font-bold z-10 ring-2 ring-[#2F3E32]/30' 
                        : 'bg-white text-[#2F3E32] font-semibold hover:bg-[#D4A017] hover:text-white cursor-pointer shadow-sm hover:shadow-md hover:scale-105 border border-[#3A4B3C]/10'
                  }
                `}
              >
                {day}
                {/* Subtle indicator dot for today */}
                {dateObj.getTime() === today.getTime() && !isSelected && !isBooked && (
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-[#D4A017]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
