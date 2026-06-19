import React from 'react';
import { format, isAfter, startOfDay } from 'date-fns';
import { CalendarEvent, getStatusColor } from './MockData';
import { Clock, MapPin, Users } from 'lucide-react';

interface ListViewProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
}

export function ListView({ events, onEventClick }: ListViewProps) {
  // Sort events chronologically and filter out past events (optional, but usually list view is upcoming)
  const sortedEvents = [...events]
    .filter(e => isAfter(e.start, startOfDay(new Date())) || format(e.start, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  // Group by date
  const groupedEvents = sortedEvents.reduce((acc, event) => {
    const dateKey = format(event.start, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  if (sortedEvents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-[#141A13] rounded-xl shadow-sm border border-gray-200 dark:border-white/10">
        <div className="text-center text-gray-500 dark:text-[#A3B19B]">
          <p className="text-lg font-medium mb-1">No upcoming events</p>
          <p className="text-sm">Enjoy your free time!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-[#141A13] rounded-xl shadow-sm border border-gray-200 dark:border-white/10 p-6 calendar-scroll">
      <div className="space-y-8">
        {Object.entries(groupedEvents).map(([dateKey, dayEvents]) => {
          const date = new Date(dateKey);
          return (
            <div key={dateKey}>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 pb-2 border-b border-gray-100 dark:border-white/10 flex items-center gap-3">
                <span className="text-[#1a1f18] dark:text-[#F4F4F0] uppercase tracking-widest">{format(date, 'EEE')}</span>
                <span className="text-gray-400 dark:text-[#A3B19B]/80 font-medium text-sm">{format(date, 'MMMM d, yyyy')}</span>
              </h3>
              
              <div className="space-y-3">
                {dayEvents.map(event => (
                  <div 
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-gray-100 dark:border-white/5 hover:shadow-md transition-all cursor-pointer bg-gray-50/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 group"
                  >
                    <div className="w-32 flex-shrink-0">
                      <div className="text-sm font-bold text-gray-700 dark:text-[#F4F4F0]">{format(event.start, 'h:mm a')}</div>
                      <div className="text-xs text-gray-500 dark:text-[#A3B19B]/80">{format(event.end, 'h:mm a')}</div>
                    </div>
                    
                    <div className="flex-1 flex flex-col sm:flex-row gap-4 justify-between">
                      <div>
                        <h4 className="font-bold text-lg text-[#1a1f18] dark:text-white group-hover:text-blue-600 dark:group-hover:text-[#D6B53B] transition-colors">{event.title}</h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-gray-600 dark:text-[#A3B19B]">
                          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {event.venue}</span>
                          <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {event.guestCount} pax</span>
                          <span className="text-gray-500 dark:text-[#A3B19B]/80">Client: {event.clientName}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-start sm:justify-end">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
