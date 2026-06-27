'use client';

import React, { useState, Suspense, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus, Filter, Calendar as CalendarIcon, ChevronDown, CheckCircle2 } from 'lucide-react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, addYears, subYears, startOfWeek, endOfWeek } from 'date-fns';

// Components
import { MonthView } from './components/MonthView';
import { WeekView } from './components/WeekView';
import { DayView } from './components/DayView';
import { YearView } from './components/YearView'; // Force TS Server re-index
import { FourDaysView } from './components/FourDaysView'; // Force TS Server re-iscndex
import { ListView } from './components/ListView';
import { EventModal } from './components/EventModal';
import { AddEventModal } from './components/AddEventModal';
import { CalendarEvent } from './components/types';
import { TasksSidebar } from './components/TasksSidebar';
import { TasksMain } from './components/TasksMain';

type ViewMode = 'Month' | 'Week' | 'Day' | 'List' | 'Year' | 'Schedule' | '4 Days';

type DatabaseCalendarEvent = {
  id: string;
  bookingId: string | null;
  title: string;
  clientName: string;
  date: string | Date;
  startTime: string | null;
  endTime: string | null;
  status: string;
  eventType: string;
  venue: string;
  pax: number;
  notes: string | null;
};

type PaymentCalendarItem = {
  id: string;
  date: string;
  type: string;
  title: string;
  related_record_id: string | null;
  status: string | null;
};

type PaymentCalendarResponse = {
  success: boolean;
  data?: {
    items: PaymentCalendarItem[];
  };
};

function mapEventStatus(status: string): CalendarEvent['status'] {
  if (status === 'CONFIRMED' || status === 'COMPLETED') {
    return 'Confirmed';
  }

  if (status === 'DECLINED') {
    return 'Cancelled';
  }

  return 'Pending';
}

function mapEventType(eventType: string): CalendarEvent['type'] {
  const normalized = eventType.toLowerCase();

  if (normalized.includes('wedding')) return 'Wedding';
  if (normalized.includes('debut')) return 'Debut';
  if (normalized.includes('corporate')) return 'Corporate';
  if (normalized.includes('meeting') || normalized.includes('tour') || normalized.includes('ocular')) return 'Meeting';

  return 'Other';
}

function combineDateAndTime(date: string | Date, time: string | null, fallbackHour: number) {
  const result = new Date(date);
  const [hourValue, minuteValue] = time?.split(':') ?? [];
  const hour = Number(hourValue);
  const minute = Number(minuteValue);

  if (Number.isFinite(hour) && Number.isFinite(minute)) {
    result.setHours(hour, minute, 0, 0);
  } else {
    result.setHours(fallbackHour, 0, 0, 0);
  }

  return result;
}

function CalendarContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  const [appMode, setAppMode] = useState<'calendar' | 'tasks'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('Month');
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [showWeekends, setShowWeekends] = useState(true);
  const [showDeclined, setShowDeclined] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const viewDropdownRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [clickedDate, setClickedDate] = useState<Date | undefined>(undefined);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (viewDropdownRef.current && !viewDropdownRef.current.contains(event.target as Node)) {
        setIsViewDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handlers
  const handlePrev = () => {
    if (viewMode === 'Month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'Week') setCurrentDate(subWeeks(currentDate, 1));
    else if (viewMode === 'Day') setCurrentDate(subDays(currentDate, 1));
    else if (viewMode === 'Year') setCurrentDate(subYears(currentDate, 1));
    else if (viewMode === '4 Days') setCurrentDate(subDays(currentDate, 4));
  };

  const handleNext = () => {
    if (viewMode === 'Month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'Week') setCurrentDate(addWeeks(currentDate, 1));
    else if (viewMode === 'Day') setCurrentDate(addDays(currentDate, 1));
    else if (viewMode === 'Year') setCurrentDate(addYears(currentDate, 1));
    else if (viewMode === '4 Days') setCurrentDate(addDays(currentDate, 4));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleDateClick = (date: Date) => {
    setClickedDate(date);
    setIsAddModalOpen(true);
  };

  // Fetch events on mount
  const [dbEvents, setDbEvents] = useState<CalendarEvent[]>([]);
  const [paymentEvents, setPaymentEvents] = useState<CalendarEvent[]>([]);
  useEffect(() => {
    import('./event-actions').then(({ getEvents }) => {
      getEvents().then(data => {
        // Map Prisma Event to our CalendarEvent interface
        const formattedEvents = (data as DatabaseCalendarEvent[]).map((evt) => ({
          id: evt.id,
          bookingId: evt.bookingId,
          title: evt.title,
          type: mapEventType(evt.eventType),
          clientName: evt.clientName,
          contact: '',
          guestCount: evt.pax,
          status: mapEventStatus(evt.status),
          start: combineDateAndTime(evt.date, evt.startTime, 9),
          end: combineDateAndTime(evt.date, evt.endTime, 17),
          venue: evt.venue,
          notes: evt.notes ?? undefined,
        }));
        setDbEvents(formattedEvents);
      });
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const month = format(currentDate, 'yyyy-MM');
    fetch(`/api/dashboard/calendar?month=${month}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then((response) => response.json() as Promise<PaymentCalendarResponse>)
      .then((payload) => {
        const items = payload.success ? payload.data?.items ?? [] : [];
        setPaymentEvents(items
          .filter((item) => item.type === 'payment_due')
          .map((item) => {
            const start = new Date(`${item.date}T09:00:00`);
            const end = new Date(`${item.date}T10:00:00`);
            const isOverdue = item.status === 'overdue';
            return {
              id: item.id,
              bookingId: item.related_record_id,
              title: item.title,
              type: 'Payment' as const,
              clientName: 'Payment deadline',
              contact: '',
              guestCount: 0,
              status: isOverdue ? 'Overdue' as const : 'Payment Due' as const,
              start,
              end,
              venue: 'Payment & History',
              notes: isOverdue
                ? 'This booking has an outstanding balance past its payment deadline.'
                : 'This booking has an upcoming payment deadline.',
            };
          }));
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setPaymentEvents([]);
        }
      });
    return () => controller.abort();
  }, [currentDate]);

  // Filter events based on global search query
  const filteredEvents = [...dbEvents, ...paymentEvents].filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="-m-4 h-[calc(100vh-112px)] bg-white dark:bg-[#141A13] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col font-serif relative">

      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#141A13] p-4 sm:p-6 border-b border-gray-200 dark:border-white/10 relative z-20">

        {/* Decorative glowing orb */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          <div className="absolute top-0 right-1/4 w-64 h-64 bg-[#D6B53B]/5 dark:bg-[#D6B53B]/10 rounded-full blur-3xl"></div>
        </div>

        {/* Left Side: Today, Arrows, Title */}
        {appMode === 'calendar' ? (
          <div className="flex items-center gap-3 sm:gap-6 relative z-10">
            <button
              onClick={handleToday}
              className="px-4 py-1.5 rounded-full border border-gray-300 dark:border-white/20 text-[#1a1f18] dark:text-[#F4F4F0] text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors focus:outline-none"
            >
              Today
            </button>

            <div className="flex items-center gap-1">
              <button onClick={handlePrev} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus:outline-none">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={handleNext} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus:outline-none">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-xl sm:text-[22px] font-normal text-[#1a1f18] dark:text-[#F4F4F0] min-w-[150px] font-sans tracking-tight">
              {(() => {
                if (viewMode === 'Month') return format(currentDate, 'MMMM yyyy');
                if (viewMode === 'Year') return format(currentDate, 'yyyy');
                if (viewMode === 'Day') return format(currentDate, 'MMMM d, yyyy');
                if (viewMode === 'Schedule') return 'Upcoming Events';
                
                if (viewMode === 'Week' || viewMode === '4 Days') {
                  const start = viewMode === 'Week' ? startOfWeek(currentDate) : currentDate;
                  const end = viewMode === 'Week' ? endOfWeek(currentDate) : addDays(currentDate, 3);
                  if (start.getMonth() === end.getMonth()) {
                    return format(start, 'MMMM yyyy');
                  } else if (start.getFullYear() === end.getFullYear()) {
                    return `${format(start, 'MMM')} - ${format(end, 'MMM yyyy')}`;
                  } else {
                    return `${format(start, 'MMM yyyy')} - ${format(end, 'MMM yyyy')}`;
                  }
                }
                return '';
              })()}
            </h2>
          </div>
        ) : (
          <div className="flex items-center gap-3 sm:gap-6 relative z-10">
            <h2 className="text-xl sm:text-[22px] font-normal text-[#1a1f18] dark:text-[#F4F4F0] min-w-[150px] font-sans tracking-tight">
              My Tasks
            </h2>
          </div>
        )}

        {/* Right Side */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">

          {/* Active Search Indicator */}
          {appMode === 'calendar' && searchQuery && (
            <div className="flex items-center gap-2 bg-[#D6B53B]/10 text-[#D6B53B] px-3 py-1.5 rounded-full text-sm font-semibold tracking-wide font-sans border border-[#D6B53B]/20">
              <Filter className="w-3.5 h-3.5" />
              &ldquo;{searchQuery}&rdquo;
            </div>
          )}

          {/* View Switcher Dropdown */}
          {appMode === 'calendar' && (
            <div className="relative" ref={viewDropdownRef}>
              <button
                onClick={() => setIsViewDropdownOpen(!isViewDropdownOpen)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-300 dark:border-white/20 text-[#1a1f18] dark:text-[#F4F4F0] text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors focus:outline-none min-w-[100px] justify-between"
              >
                {viewMode}
                <ChevronDown className="w-4 h-4 ml-1 opacity-70" />
              </button>

              {isViewDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-[#28292A] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-100 dark:border-white/10 overflow-hidden py-2 z-50">
                  <div className="flex flex-col">
                    {([
                      { name: 'Day', shortcut: 'D' },
                      { name: 'Week', shortcut: 'W' },
                      { name: 'Month', shortcut: 'M' },
                      { name: 'Year', shortcut: 'Y' },
                      { name: 'Schedule', shortcut: 'A' },
                      { name: '4 Days', shortcut: 'X' }
                    ] as const).map((mode) => (
                      <button 
                        key={mode.name}
                        onClick={() => {
                          setViewMode(mode.name as ViewMode);
                          setIsViewDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2 text-[13px] font-sans transition-colors ${viewMode === mode.name ? 'bg-gray-100/50 dark:bg-white/5 text-gray-900 dark:text-[#F4F4F0] font-medium' : 'text-gray-700 dark:text-[#F4F4F0] hover:bg-gray-50 dark:hover:bg-white/5'}`}
                      >
                        <span>{mode.name}</span>
                        <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">{mode.shortcut}</span>
                      </button>
                    ))}
                    
                    <div className="h-px bg-gray-200 dark:bg-white/10 my-2"></div>
                    
                    {/* Toggles */}
                    <button 
                      onClick={() => setShowWeekends(!showWeekends)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-[13px] font-sans text-gray-700 dark:text-[#F4F4F0] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      {showWeekends ? <CheckCircle2 className="w-4 h-4 text-blue-500 dark:text-blue-400" /> : <div className="w-4 h-4" />}
                      <span>Show weekends</span>
                    </button>
                    <button 
                      onClick={() => setShowDeclined(!showDeclined)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-[13px] font-sans text-gray-700 dark:text-[#F4F4F0] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      {showDeclined ? <CheckCircle2 className="w-4 h-4 text-blue-500 dark:text-blue-400" /> : <div className="w-4 h-4" />}
                      <span>Show declined events</span>
                    </button>
                    <button 
                      onClick={() => setShowCompleted(!showCompleted)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-[13px] font-sans text-gray-700 dark:text-[#F4F4F0] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      {showCompleted ? <CheckCircle2 className="w-4 h-4 text-blue-500 dark:text-blue-400" /> : <div className="w-4 h-4" />}
                      <span>Show completed tasks</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Segmented Control (Calendar / Tasks) */}
          <div className="flex items-center bg-gray-100 dark:bg-black/20 rounded-full p-0.5 border border-gray-200 dark:border-white/10">
            <button 
              onClick={() => setAppMode('calendar')}
              className={`flex items-center justify-center px-4 py-1.5 rounded-full shadow-sm transition-colors focus:outline-none ${appMode === 'calendar' ? 'bg-[#1a73e8] dark:bg-[#D6B53B] text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-[#F4F4F0]'}`}
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setAppMode('tasks')}
              className={`flex items-center justify-center px-4 py-1.5 rounded-full shadow-sm transition-colors focus:outline-none ${appMode === 'tasks' ? 'bg-[#1a73e8] dark:bg-[#D6B53B] text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-[#F4F4F0]'}`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </div>

          {/* Add Booking Button */}
          {appMode === 'calendar' && (
            <button
              onClick={() => { setClickedDate(new Date()); setIsAddModalOpen(true); }}
              className="flex items-center gap-1.5 bg-[#D6B53B] hover:bg-[#BEA542] text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors shadow-sm focus:outline-none ml-2"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 min-h-0 gap-4 mt-2">
        
        {/* Main Content Area (Conditional based on appMode) */}
        {appMode === 'tasks' ? (
          <>
            <TasksSidebar />
            <TasksMain />
          </>
        ) : (
          <div className="flex-1 min-h-0 bg-white dark:bg-[#141A13] overflow-hidden flex flex-col relative z-10 group/calendar">
            {/* Inner glow for the main calendar space */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[#D6B53B]/5 dark:bg-[#D6B53B]/10 rounded-full blur-[100px] pointer-events-none opacity-50 group-hover/calendar:opacity-100 transition-opacity duration-1000"></div>

            <div className="relative z-10 flex-1 flex flex-col h-full">
              {viewMode === 'Month' && <MonthView currentDate={currentDate} events={filteredEvents} onEventClick={handleEventClick} onDateClick={handleDateClick} onPrevMonth={handlePrev} onNextMonth={handleNext} />}
              {viewMode === 'Week' && <WeekView currentDate={currentDate} events={filteredEvents} onEventClick={handleEventClick} onDateClick={handleDateClick} />}
              {viewMode === 'Day' && <DayView currentDate={currentDate} events={filteredEvents} onEventClick={handleEventClick} onDateClick={handleDateClick} />}
              {viewMode === 'Schedule' && <ListView events={filteredEvents} onEventClick={handleEventClick} />}
              {viewMode === 'Year' && <YearView currentDate={currentDate} events={filteredEvents} onDateClick={handleDateClick} />}
              {viewMode === '4 Days' && <FourDaysView currentDate={currentDate} events={filteredEvents} onEventClick={handleEventClick} onDateClick={handleDateClick} />}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <EventModal
        event={selectedEvent}
        isOpen={isEventModalOpen}
        onClose={() => { setIsEventModalOpen(false); setSelectedEvent(null); }}
      />

      <AddEventModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setClickedDate(undefined); }}
        initialDate={clickedDate}
      />

    </div>
  );
}

export default function Calendar() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center font-serif text-gray-500">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#D6B53B]/20 flex items-center justify-center">
            <CalendarIcon className="w-6 h-6 text-[#D6B53B]" />
          </div>
          <p>Loading your calendar...</p>
        </div>
      </div>
    }>
      <CalendarContent />
    </Suspense>
  );
}
