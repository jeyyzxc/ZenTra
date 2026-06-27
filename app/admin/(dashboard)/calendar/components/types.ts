export type EventStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Payment Due' | 'Overdue';
export type EventType = 'Wedding' | 'Debut' | 'Corporate' | 'Meeting' | 'Payment' | 'Other';

export interface CalendarEvent {
  id: string;
  bookingId?: string | null;
  title: string;
  type: EventType;
  clientName: string;
  contact: string;
  guestCount: number;
  status: EventStatus;
  start: Date;
  end: Date;
  venue: string;
  notes?: string;
}

export const getStatusColor = (status: EventStatus) => {
  switch (status) {
    case 'Confirmed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
    case 'Payment Due': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Overdue': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};
