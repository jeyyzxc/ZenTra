"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type ClientAvailabilityCalendarProps = {
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  className?: string;
  layout?: 'horizontal' | 'vertical';
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function dateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function monthKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
  ].join('-');
}

function displayDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function selectedDateKey(value: string) {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return dateKey(parsed);
}

export default function ClientAvailabilityCalendar({
  selectedDate = '',
  onSelectDate,
  className,
  layout = 'horizontal',
}: ClientAvailabilityCalendarProps) {
  const [today] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [currentDate, setCurrentDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [availability, setAvailability] = useState({
    month: '',
    bookedDates: [] as string[],
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = monthNames[month];
  const isPrevDisabled = year === today.getFullYear() && month === today.getMonth();

  const currentMonthKey = monthKey(currentDate);
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, index) => index);
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const selectedKey = selectedDateKey(selectedDate);
  const bookedDateSet = useMemo(() => new Set(availability.bookedDates), [availability.bookedDates]);
  const isAvailabilityReady = availability.month === currentMonthKey;

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      fetch(`/api/client/calendar-availability?month=${encodeURIComponent(currentMonthKey)}`, {
        cache: 'no-store',
        signal: controller.signal,
      })
        .then(async (response) => {
          const payload = await response.json() as {
            data?: {
              month: string;
              bookedDates: string[];
            };
            error?: string;
          };

          if (!response.ok || !payload.data) {
            throw new Error(payload.error || 'Unable to load calendar availability.');
          }

          setAvailability({
            month: payload.data.month,
            bookedDates: payload.data.bookedDates,
          });
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setAvailability({
              month: '',
              bookedDates: [],
            });
          }
        });
    }, 0);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [currentMonthKey]);

  useEffect(() => {
    if (!onSelectDate || !isAvailabilityReady || !selectedKey || !bookedDateSet.has(selectedKey)) {
      return;
    }

    const timeout = window.setTimeout(() => {
      onSelectDate('');
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [bookedDateSet, isAvailabilityReady, onSelectDate, selectedKey]);

  const nextMonth = () => {
    setCurrentDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    if (isPrevDisabled) {
      return;
    }

    setCurrentDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  };

  const selectDate = (dateObj: Date, isBlocked: boolean) => {
    if (isBlocked) {
      return;
    }

    onSelectDate?.(displayDate(dateObj));
  };

  return (
    <div className={cx('mx-auto flex w-full max-w-6xl flex-col items-stretch justify-center gap-6 px-4', layout === 'horizontal' ? 'lg:flex-row lg:gap-8' : '', className)}>
      <section className="relative w-full overflow-hidden rounded-[2rem] border border-[#D6B53B]/30 bg-gradient-to-b from-[#FFFDF2]/90 to-white/70 p-5 shadow-[0_24px_60px_rgba(47,62,50,0.08)] backdrop-blur-xl transition-all duration-500 sm:p-6 md:p-8 lg:max-w-3xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(214,181,59,0.15),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.4),transparent_50%)]" />
        <div className="relative z-10">
          <div className="mb-6 flex items-center justify-between rounded-3xl border border-white/60 bg-white/50 px-5 py-4 shadow-sm backdrop-blur-md">
            <button
              type="button"
              onClick={prevMonth}
              disabled={isPrevDisabled}
              aria-label="Previous month"
              className={cx(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all',
                isPrevDisabled
                  ? 'cursor-not-allowed border-[#3A4B3C]/10 bg-white/30 text-[#3A4B3C]/25'
                  : 'border-white bg-white text-[#2F3E32] shadow-sm hover:-translate-y-0.5 hover:border-[#D6B53B] hover:text-[#8E7722] hover:shadow-md',
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <h3 className="text-center font-serif text-2xl font-medium text-[#2F3E32] sm:text-3xl md:text-4xl">
              {monthName} {year}
            </h3>

            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next month"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white bg-white text-[#2F3E32] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#D6B53B] hover:bg-[#FFF2DB] hover:text-[#8E7722] hover:shadow-md"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {weekdayLabels.map((day) => (
              <div key={day} className="pb-2 text-center font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-[#3A4B3C]/55 sm:text-xs">
                {day}
              </div>
            ))}

            {paddingDays.map((pad) => (
              <div key={`pad-${pad}`} aria-hidden="true" className="h-10 w-full sm:h-12 md:h-14" />
            ))}

            {days.map((day) => {
              const dateObj = new Date(year, month, day);
              const key = dateKey(dateObj);
              const hasSchedule = isAvailabilityReady && bookedDateSet.has(key);
              const isPast = dateObj < today;
              const isToday = dateObj.getTime() === today.getTime();
              const isSelected = selectedKey === key && !hasSchedule;
              const isSyncingAvailability = !isPast && !isSelected && !isAvailabilityReady;
              const isBlocked = isPast || hasSchedule || isSyncingAvailability;
              const dateLabel = `${day}`;

              const label = isPast
                ? `${displayDate(dateObj)} is a past date`
                : hasSchedule
                  ? `${displayDate(dateObj)} already has a scheduled event`
                  : isSyncingAvailability
                    ? `${displayDate(dateObj)} is unavailable while calendar availability is syncing`
                    : `Select ${displayDate(dateObj)}`;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectDate(dateObj, isBlocked)}
                  disabled={isBlocked}
                  aria-label={label}
                  aria-pressed={isSelected}
                  title={label}
                  className={cx(
                    'group relative flex h-10 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border text-sm font-medium transition-all duration-300 sm:h-12 sm:text-base md:h-14',
                    isSelected
                      ? 'z-10 scale-105 border border-[#FDEB9E] bg-[#FDEB9E] text-[#1a1f18] shadow-[0_8px_20px_rgba(253,235,158,0.4)]'
                      : '',
                    !isSelected && !isBlocked
                      ? 'border-white/80 bg-white/60 text-black shadow-sm hover:-translate-y-0.5 hover:border-[#FDEB9E]/50 hover:bg-[#FFF2DB] hover:text-[#8E7722] hover:shadow-[0_8px_16px_rgba(214,181,59,0.1)]'
                      : '',
                    isPast
                      ? 'cursor-not-allowed border-transparent bg-transparent text-gray-400'
                      : '',
                    hasSchedule || isSyncingAvailability
                      ? 'cursor-not-allowed border-transparent bg-black/[0.03] text-gray-500'
                      : '',
                  )}
                >
                  {isToday && !isSelected && (
                    <span className="absolute left-1/2 top-1 h-1.5 w-5 -translate-x-1/2 rounded-full bg-[#FDEB9E] shadow-[0_1px_4px_rgba(253,235,158,0.4)]" />
                  )}

                  <span>{dateLabel}</span>

                  {hasSchedule && (
                    <span className="absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#FFDA62] shadow-[0_0_4px_rgba(255,218,98,0.5)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <aside className={cx("group relative flex w-full flex-col self-center overflow-hidden rounded-[2rem] border border-[#D6B53B]/30 bg-gradient-to-b from-[#FFFDF2]/95 to-white/80 shadow-[0_24px_60px_rgba(47,62,50,0.08)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_32px_80px_rgba(47,62,50,0.12)]", layout === 'horizontal' ? 'h-fit p-7 lg:max-w-[320px]' : 'mt-2 p-4 sm:p-5')}>
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-transparent via-[#D6B53B]/40 to-transparent opacity-60" />

        <div className={cx("relative z-10 flex h-full", layout === 'horizontal' ? 'flex-col' : 'flex-col sm:flex-row items-center justify-between gap-4')}>
          {layout === 'horizontal' && (
            <div className="flex flex-col gap-1.5">
              <h3 className="font-serif text-xl font-medium text-[#2F3E32]">Date Selection</h3>
              <p className="text-sm text-[#3A4B3C]/60">
                Please choose an available date for your event.
              </p>
            </div>
          )}

          <div className={cx("flex", layout === 'horizontal' ? 'mt-7 flex-col gap-3' : 'w-full flex-row flex-wrap justify-center gap-2 sm:gap-4')}>
            <div className="group flex cursor-default items-center gap-2 sm:gap-3.5 rounded-full border border-white/60 bg-white/50 px-3 sm:px-4 py-2 sm:py-3 shadow-[0_4px_12px_rgba(47,62,50,0.03)] backdrop-blur-md transition-all hover:bg-[#FFF2DB] hover:shadow-sm">
              <div className="h-3 sm:h-3.5 w-3 sm:w-3.5 shrink-0 rounded-full border border-[#D6B53B]/50 bg-white shadow-sm transition-colors group-hover:border-[#FDEB9E]/50 group-hover:bg-white" />
              <span className="text-xs sm:text-sm font-semibold tracking-wide text-black transition-colors group-hover:text-[#8E7722]">Available</span>
            </div>

            <div className="flex cursor-default items-center gap-2 sm:gap-3.5 rounded-full border border-[#FDEB9E] bg-[#FDEB9E] px-3 sm:px-4 py-2 sm:py-3 shadow-[0_8px_16px_rgba(253,235,158,0.2)] transition-all hover:border-white/50 hover:shadow-[0_12px_24px_rgba(253,235,158,0.3)]">
              <div className="h-3 sm:h-3.5 w-3 sm:w-3.5 shrink-0 rounded-full bg-white shadow-sm" />
              <span className="text-xs sm:text-sm font-semibold tracking-wide text-[#1a1f18]">Selected</span>
            </div>

            <div className="flex cursor-default items-center gap-2 sm:gap-3.5 rounded-full border border-transparent bg-black/[0.03] px-3 sm:px-4 py-2 sm:py-3 transition-colors hover:bg-black/[0.05]">
              <div className="relative flex h-3 sm:h-3.5 w-3 sm:w-3.5 shrink-0 items-center justify-center rounded-full bg-[#3A4B3C]/15">
                <div className="absolute -bottom-1 sm:-bottom-1.5 h-1 w-1 rounded-full bg-[#FFDA62] shadow-[0_1px_3px_rgba(255,218,98,0.5)]" />
              </div>
              <span className="text-xs sm:text-sm font-medium tracking-wide text-gray-500 whitespace-nowrap">Already booked</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
