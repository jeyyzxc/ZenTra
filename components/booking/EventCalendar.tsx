"use client";

import { useState } from 'react';
import ClientAvailabilityCalendar from './ClientAvailabilityCalendar';

type EventCalendarProps = {
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  layout?: 'horizontal' | 'vertical';
};

export default function EventCalendar({
  selectedDate,
  onSelectDate,
  layout = 'horizontal',
}: EventCalendarProps) {
  const [internalSelectedDate, setInternalSelectedDate] = useState('');
  const activeSelectedDate = selectedDate ?? internalSelectedDate;

  const selectDate = (date: string) => {
    if (selectedDate === undefined) {
      setInternalSelectedDate(date);
    }
    onSelectDate?.(date);
  };

  return (
    <ClientAvailabilityCalendar
      selectedDate={activeSelectedDate}
      onSelectDate={selectDate}
      layout={layout}
    />
  );
}
