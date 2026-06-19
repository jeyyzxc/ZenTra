import { addDays, subDays, setHours, setMinutes } from 'date-fns';

export type EventStatus = 'Pending' | 'Confirmed' | 'Cancelled';
export type EventType = 'Wedding' | 'Debut' | 'Corporate' | 'Meeting' | 'Other';

export interface CalendarEvent {
  id: string;
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

const now = new Date();

export const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Jerome & Steph Wedding',
    type: 'Wedding',
    clientName: 'Jerome & Steph',
    contact: '+63 912 345 6789',
    guestCount: 150,
    status: 'Confirmed',
    start: setHours(setMinutes(addDays(now, 2), 0), 14), // 2:00 PM, 2 days from now
    end: setHours(setMinutes(addDays(now, 2), 0), 22),   // 10:00 PM
    venue: 'Grand Hall',
    notes: 'Requires projector and full sound system. Catering by partner A.',
  },
  {
    id: '2',
    title: 'Mark & Julia Reception',
    type: 'Wedding',
    clientName: 'Mark & Julia',
    contact: '+63 998 765 4321',
    guestCount: 100,
    status: 'Pending',
    start: setHours(setMinutes(addDays(now, 8), 30), 17), // 5:30 PM
    end: setHours(setMinutes(addDays(now, 8), 0), 23),
    venue: 'Garden View',
    notes: 'Awaiting deposit confirmation.',
  },
  {
    id: '3',
    title: "Sarah's 18th Debut",
    type: 'Debut',
    clientName: 'Sarah Santos',
    contact: '+63 922 111 2222',
    guestCount: 80,
    status: 'Confirmed',
    start: setHours(setMinutes(subDays(now, 1), 0), 18), // 6:00 PM yesterday
    end: setHours(setMinutes(subDays(now, 1), 0), 23),
    venue: 'Crystal Room',
    notes: 'Floral arrangements to be delivered early.',
  },
  {
    id: '4',
    title: 'Tech Corp Annual Summit',
    type: 'Corporate',
    clientName: 'Tech Innovations Inc.',
    contact: 'events@techinnovations.com',
    guestCount: 200,
    status: 'Confirmed',
    start: setHours(setMinutes(addDays(now, 15), 0), 9), // 9:00 AM
    end: setHours(setMinutes(addDays(now, 15), 0), 17),  // 5:00 PM
    venue: 'Entire Facility',
    notes: 'Need high speed internet and multiple breakout areas.',
  },
  {
    id: '5',
    title: 'Venue Tour & Meeting',
    type: 'Meeting',
    clientName: 'Alice & Bob',
    contact: '+63 955 444 3333',
    guestCount: 4,
    status: 'Pending',
    start: setHours(setMinutes(now, 0), 10), // 10:00 AM today
    end: setHours(setMinutes(now, 0), 11),   // 11:00 AM today
    venue: 'Office',
    notes: 'Showing them the Grand Hall and Garden.',
  }
];

export const getStatusColor = (status: EventStatus) => {
  switch (status) {
    case 'Confirmed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Pending': return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Cancelled': return 'bg-rose-100 text-rose-800 border-rose-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};
