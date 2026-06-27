import React from 'react';
import { format, isSameDay } from 'date-fns';
import { CalendarEvent, getStatusColor } from './types';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
}

export function DayView({ currentDate, events, onEventClick, onDateClick }: DayViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dayEvents = events.filter(e => isSameDay(e.start, currentDate));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-[#141A13] rounded-xl shadow-sm border border-gray-200 dark:border-white/10">
      <div className="flex border-b border-gray-200 dark:border-white/10 pr-[4px]">
        <div className="w-16 flex-shrink-0 border-r border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"></div>
        <div className="flex-1 p-3 text-center bg-gray-50/50 dark:bg-white/5">
          <div className="text-sm font-semibold text-gray-500 dark:text-[#A3B19B] uppercase tracking-widest">{format(currentDate, 'EEE')}</div>
          <div className="text-3xl font-bold text-[#1a1f18] dark:text-[#F4F4F0] mt-1">{format(currentDate, 'MMMM d, yyyy')}</div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto calendar-scroll">
        <div className="relative" style={{ height: '1440px' }}> {/* 24 hours * 60px */}
          {/* Grid lines */}
          {hours.map(hour => (
            <div key={hour} className="absolute w-full flex border-b border-gray-100 dark:border-white/5" style={{ top: `${hour * 60}px`, height: '60px' }}>
              <div className="w-16 flex-shrink-0 border-r border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-medium text-gray-500 dark:text-[#A3B19B]/80 text-right pr-2 pt-2">
                {hour === 0 ? <span className="text-[9px] font-bold tracking-widest">GMT+00</span> : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              <div 
                className="flex-1 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                onClick={() => {
                  const newDate = new Date(currentDate);
                  newDate.setHours(hour);
                  onDateClick(newDate);
                }}
              ></div>
            </div>
          ))}

          {/* Events */}
          {dayEvents.map(event => {
            const top = event.start.getHours() * 60 + event.start.getMinutes();
            const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
            const height = Math.max(duration, 30); // minimum 30px height

            return (
              <div
                key={event.id}
                onClick={() => onEventClick(event)}
                className={`absolute rounded-md p-3 text-sm overflow-hidden cursor-pointer shadow-sm border hover:shadow-md transition-shadow z-10 ${getStatusColor(event.status)}`}
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  left: `calc(4rem + 12px)`, // 4rem (w-16) + padding
                  right: `12px`,
                }}
              >
                <div className="font-bold flex items-center justify-between">
                  <span>{event.title}</span>
                  <span className="text-xs opacity-80 bg-white/30 px-2 py-0.5 rounded-full">{event.status}</span>
                </div>
                <div className="text-xs opacity-90 mt-1 font-medium">{format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}</div>
                {height >= 60 && (
                  <div className="mt-2 text-xs opacity-80 line-clamp-2">
                    <span className="font-semibold block">{event.clientName} ({event.guestCount} pax)</span>
                    <span>Venue: {event.venue}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
