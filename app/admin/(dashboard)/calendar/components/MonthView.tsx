import React from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay, isToday } from 'date-fns';
import { CalendarEvent } from './types';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function MonthView({ currentDate, events, onEventClick, onDateClick, onPrevMonth, onNextMonth }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const lastWheelTime = React.useRef(0);
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheelTime.current < 400) return; // 400ms cooldown to prevent rapid skipping
    
    if (e.deltaY > 0) {
      onNextMonth();
      lastWheelTime.current = now;
    } else if (e.deltaY < 0) {
      onPrevMonth();
      lastWheelTime.current = now;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative z-10" onWheel={handleWheel}>
      {/* Continuous 1px Grid Container */}
      <div 
        className="flex-1 grid grid-cols-7 gap-[1px] bg-gray-200 dark:bg-white/5 rounded-xl sm:rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-inner"
        style={{ gridTemplateRows: `repeat(${days.length / 7}, minmax(0, 1fr))` }}
      >
        {days.map((day, i) => {
          const dayEvents = events.filter(e => isSameDay(e.start, day));
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isDayToday = isToday(day);
          
          return (
            <div 
              key={i} 
              onClick={() => onDateClick(day)}
              className={`p-1.5 sm:p-2 transition-all duration-300 cursor-pointer relative group flex flex-col overflow-hidden min-h-[80px] bg-white dark:bg-[#141A13] hover:bg-gray-50/80 dark:hover:bg-[#1A2218]`}
            >
              {/* Subtle hover bloom */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#D6B53B]/0 to-[#D6B53B]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

              {/* Date Header (Centered) */}
              <div className="flex flex-col items-center justify-start mb-1 relative z-10 w-full">
                {i < 7 && (
                  <span className="text-[11px] font-bold text-gray-500 dark:text-[#A3B19B] uppercase tracking-widest mt-0.5 mb-0.5">
                    {format(day, 'EEE')}
                  </span>
                )}
                <span className={`h-7 flex items-center justify-center rounded-full font-sans transition-all ${
                  isDayToday 
                    ? 'bg-[#D6B53B] text-white shadow-[0_2px_8px_rgba(214,181,59,0.5)] font-bold px-2' 
                    : isCurrentMonth 
                      ? 'text-gray-700 dark:text-[#F4F4F0] group-hover:bg-gray-100 dark:group-hover:bg-white/10' 
                      : 'text-gray-400 dark:text-[#A3B19B]/40'
                } ${day.getDate() === 1 ? 'text-[12px] sm:text-[13px] px-2 font-semibold' : 'text-[13px] sm:text-[14px] font-medium w-7'}`}>
                  {format(day, day.getDate() === 1 ? 'MMM d' : 'd')}
                </span>
              </div>
              
              {/* Events Container */}
              <div 
                className="flex-1 overflow-y-auto space-y-[2px] custom-scrollbar relative z-10"
                onWheel={(e) => e.stopPropagation()}
              >
                {dayEvents.map(event => {
                  // Determine solid block colors based on status, but with a luxurious muted tone
                  const blockColors = event.status === 'Confirmed' 
                    ? 'bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-800/50' 
                    : event.status === 'Pending'
                      ? 'bg-amber-100/80 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200/50 dark:border-amber-800/50'
                      : event.status === 'Payment Due'
                        ? 'bg-blue-100/80 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200/50 dark:border-blue-800/50'
                        : event.status === 'Overdue'
                          ? 'bg-red-100/80 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200/50 dark:border-red-800/50'
                      : 'bg-gray-100/80 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-200/50 dark:border-gray-700/50';

                  return (
                    <div 
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      className={`text-[10px] sm:text-[11px] font-semibold px-1.5 py-0.5 rounded-[4px] truncate border hover:opacity-80 transition-opacity ${blockColors}`}
                    >
                      {event.title}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
