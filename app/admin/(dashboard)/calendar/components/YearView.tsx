import React from 'react';
import { format, eachMonthOfInterval, startOfYear, endOfYear, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { CalendarEvent } from './types';

interface YearViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
}

export function YearView({ currentDate, events, onDateClick }: YearViewProps) {
  const yearStart = startOfYear(currentDate);
  const yearEnd = endOfYear(currentDate);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  const renderMonth = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div key={month.toISOString()} className="flex flex-col mb-4 p-2">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-[#F4F4F0] mb-2 px-1">
          {format(month, 'MMMM')}
        </h3>
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-[10px] font-medium text-gray-400 dark:text-[#A3B19B]/60 pb-1">
              {day}
            </div>
          ))}
          
          {days.map(day => {
            const hasEvent = events.some(e => isSameDay(e.start, day));
            const isCurrentMonth = isSameMonth(day, month);
            return (
              <div 
                key={day.toISOString()} 
                onClick={() => onDateClick(day)}
                className={`w-7 h-7 mx-auto flex items-center justify-center rounded-full text-[11px] font-medium cursor-pointer relative hover:bg-gray-100 dark:hover:bg-white/10 transition-colors
                  ${isToday(day) 
                    ? 'bg-[#1a73e8] dark:bg-[#D6B53B] text-white shadow-sm' 
                    : isCurrentMonth 
                      ? 'text-gray-700 dark:text-[#F4F4F0]' 
                      : 'text-gray-300 dark:text-[#A3B19B]/30'
                  }
                `}
              >
                {format(day, 'd')}
                {hasEvent && !isToday(day) && (
                  <div className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isCurrentMonth ? 'bg-blue-500 dark:bg-[#D6B53B]' : 'bg-gray-300 dark:bg-[#A3B19B]/30'}`}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#141A13] rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 relative z-10 p-4">
      <div className="flex-1 overflow-y-auto calendar-scroll pr-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-8 w-full mx-auto">
          {months.map(renderMonth)}
        </div>
      </div>
    </div>
  );
}
