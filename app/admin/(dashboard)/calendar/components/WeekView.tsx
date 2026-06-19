import React from 'react';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isToday } from 'date-fns';
import { CalendarEvent, getStatusColor } from './MockData';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
}

export function WeekView({ currentDate, events, onEventClick, onDateClick }: WeekViewProps) {
  const startDate = startOfWeek(currentDate);
  const endDate = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#141A13] rounded-xl shadow-sm border border-gray-200 dark:border-white/10">
      <div className="flex border-b border-gray-200 dark:border-white/10 pr-[4px]">
        <div className="w-16 flex-shrink-0 border-r border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"></div>
        {days.map(day => (
          <div key={day.toISOString()} className={`flex-1 p-3 text-center border-r last:border-r-0 border-gray-200 dark:border-white/10 ${isToday(day) ? 'bg-[#FDF5CC]/30 dark:bg-[#D6B53B]/10' : ''}`}>
            <div className="text-xs font-semibold text-gray-500 dark:text-[#A3B19B] uppercase tracking-wider">{format(day, 'EEE')}</div>
            <div className={`font-medium mt-1 mx-auto flex items-center justify-center rounded-full ${isToday(day) ? 'text-[#1a1f18] dark:text-[#F4F4F0] bg-[#FDF5CC] dark:bg-[#D6B53B] shadow-sm w-10 h-10' : 'text-gray-700 dark:text-[#A3B19B]'} ${day.getDate() === 1 ? 'text-sm px-2 w-auto h-10' : 'text-xl w-10 h-10'}`}>
              {format(day, day.getDate() === 1 ? 'MMM d' : 'd')}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto calendar-scroll">
        <div className="relative" style={{ height: '1440px' }}> {/* 24 hours * 60px */}
          {/* Grid lines */}
          {hours.map(hour => (
            <div key={hour} className="absolute w-full flex border-b border-gray-100 dark:border-white/5" style={{ top: `${hour * 60}px`, height: '60px' }}>
              <div className="w-16 flex-shrink-0 border-r border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs text-gray-400 dark:text-[#A3B19B]/60 text-right pr-2 pt-2">
                {hour === 0 ? <span className="text-[9px] font-bold tracking-widest">GMT+00</span> : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              <div className="flex-1 flex">
                {days.map(day => (
                  <div 
                    key={day.toISOString()} 
                    className="flex-1 border-r last:border-r-0 border-gray-100 dark:border-white/5 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                    onClick={() => {
                      const newDate = new Date(day);
                      newDate.setHours(hour);
                      onDateClick(newDate);
                    }}
                  ></div>
                ))}
              </div>
            </div>
          ))}

          {/* Events */}
          {events.map(event => {
            const eventDayIndex = days.findIndex(d => isSameDay(d, event.start));
            if (eventDayIndex === -1) return null;

            const top = event.start.getHours() * 60 + event.start.getMinutes();
            const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
            const height = Math.max(duration, 30); // minimum 30px height

            return (
              <div
                key={event.id}
                onClick={() => onEventClick(event)}
                className={`absolute left-16 rounded-md p-1.5 text-xs overflow-hidden cursor-pointer shadow-sm border hover:shadow-md transition-shadow z-10 ${getStatusColor(event.status)}`}
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  left: `calc(4rem + ${eventDayIndex} * ((100% - 4rem) / 7) + 4px)`,
                  width: `calc(((100% - 4rem) / 7) - 8px)`,
                }}
              >
                <div className="font-semibold truncate">{event.title}</div>
                <div className="text-[10px] opacity-80 truncate">{format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
