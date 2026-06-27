import React, { useState } from 'react';
import { BookFormData } from './BookFlow';

interface Props {
  data: BookFormData;
  updateData: (fields: Partial<BookFormData>) => void;
}

export default function Step2Date({ data, updateData }: Props) {
  const [today] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [currentDate, setCurrentDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

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
    <div className="flex flex-col lg:flex-row items-center justify-center gap-12 w-full max-w-5xl mx-auto px-4">
      
      {/* Calendar Card */}
      <div className="bg-[#EAE5C3] border border-[#3A4B3C]/10 rounded-[2.5rem] p-8 md:p-10 shadow-2xl w-full max-w-2xl relative overflow-hidden">
        
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/40 blur-3xl rounded-full pointer-events-none" />

        {/* Month Selector */}
        <div className="flex items-center justify-between bg-white/60 backdrop-blur-md rounded-2xl py-4 px-6 mb-8 shadow-sm border border-white/50 relative z-10">
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
          
          <div className="flex items-center gap-2 text-2xl font-serif text-[#3A4B3C] font-semibold tracking-wide">
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
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <div key={day} className="text-center font-serif text-[#3A4B3C]/60 text-sm uppercase tracking-widest font-bold">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 md:gap-3">
            {/* Empty padding slots */}
            {paddingDays.map(pad => (
              <div key={`pad-${pad}`} className="h-12 md:h-14 w-full" />
            ))}

            {/* Actual Days */}
            {days.map(day => {
              const dateObj = new Date(year, month, day);
              const isPast = dateObj < today;
              const isBooked = !isPast && (day % 11 === 0 || day % 17 === 0);
              
              const dateString = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
              const isSelected = data.date === dateString;
              
              return (
                <div 
                  key={day}
                  onClick={() => {
                    if (!isPast && !isBooked) updateData({ date: dateString });
                  }}
                  className={`
                    relative h-12 md:h-14 w-full flex items-center justify-center rounded-xl md:rounded-2xl text-lg font-sans transition-all duration-300
                    ${isPast 
                      ? 'text-[#3A4B3C]/20 cursor-not-allowed' 
                      : isBooked
                        ? 'bg-black/5 text-[#3A4B3C]/40 cursor-not-allowed border border-black/5 shadow-inner'
                        : isSelected
                          ? 'bg-[#2F3E32] text-[#EAE5C3] shadow-xl scale-110 font-bold z-10 ring-2 ring-[#2F3E32]/30'
                            : 'bg-white text-[#2F3E32] font-semibold hover:bg-[#D4A017] hover:text-white cursor-pointer shadow-sm hover:shadow-lg hover:scale-105 border border-[#3A4B3C]/10'
                    }
                  `}
                >
                  {day}
                  {/* Subtle indicator dot for today */}
                  {dateObj.getTime() === today.getTime() && !isSelected && (
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#D4A017]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-col gap-6 items-center font-serif text-center bg-white/60 backdrop-blur-sm p-8 rounded-[2rem] border border-[#3A4B3C]/10 shadow-sm h-fit">
        <h3 className="text-2xl font-bold text-[#2F3E32] mb-2 tracking-wide">Availability</h3>
        
        <div className="flex gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-12 bg-white border border-[#3A4B3C]/10 shadow-sm rounded-xl flex items-center justify-center text-[#2F3E32] font-sans font-bold text-base">
              15
            </div>
            <span className="text-lg text-[#2F3E32] font-medium">Available</span>
          </div>

          <div className="flex flex-col items-center gap-2 opacity-60">
            <div className="w-14 h-12 bg-black/5 border border-black/5 shadow-inner rounded-xl flex items-center justify-center text-[#3A4B3C]/60 font-sans font-bold text-base relative">
              <div className="w-full h-[1px] bg-[#3A4B3C]/20 absolute rotate-45 transform origin-center"></div>
            </div>
            <span className="text-lg text-[#2F3E32] font-medium">Booked</span>
          </div>
        </div>
        
        <p className="max-w-48 text-sm leading-6 text-[#3A4B3C]/60">
          Final availability is reviewed by the Zion Events Place team after submission.
        </p>
      </div>
      
    </div>
  );
}
