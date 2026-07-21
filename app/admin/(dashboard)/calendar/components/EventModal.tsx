import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { CalendarEvent, getStatusColor } from './types';
import { X, MapPin, Users, Phone, Clock, FileText, Tag } from 'lucide-react';

interface EventModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EventModal({ event, isOpen, onClose }: EventModalProps) {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label={event.title}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-lg transform flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all sm:max-h-[90dvh]">
        {/* Header (Dynamic color based on status) */}
        <div className={`px-6 py-4 flex items-start justify-between border-b ${getStatusColor(event.status).split(' ')[0]} bg-opacity-30`}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(event.status)}`}>
                {event.status}
              </span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3" /> {event.type}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">{event.title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 overflow-y-auto p-4 sm:p-6">
          {/* Time & Date */}
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 text-center min-w-[70px]">
              <div className="text-xs font-bold text-red-500 uppercase">{format(event.start, 'MMM')}</div>
              <div className="text-2xl font-black text-gray-900 leading-none my-1">{format(event.start, 'd')}</div>
            </div>
            <div className="flex-1 pt-1">
              <div className="font-semibold text-gray-900">{format(event.start, 'EEEE, MMMM d, yyyy')}</div>
              <div className="text-gray-600 flex items-center gap-1.5 mt-1">
                <Clock className="w-4 h-4 text-gray-400" />
                {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Client Details</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                    {event.clientName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{event.clientName}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" /> {event.contact}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Event Info</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-sm">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Venue</span>
                    <span className="font-medium text-gray-900">{event.venue}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-gray-500 block text-xs">Guest Count</span>
                    <span className="font-medium text-gray-900">{event.guestCount} pax</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {event.notes && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Notes
              </h3>
              <div className="bg-yellow-50 text-yellow-900 p-3 rounded-lg text-sm border border-yellow-100">
                {event.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex flex-col-reverse justify-end gap-3 border-t border-gray-100 bg-gray-50 px-4 py-4 sm:flex-row sm:px-6">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          {event.bookingId && (
            <Link href={`/admin/bookings?selected=${encodeURIComponent(event.bookingId)}`} className="px-4 py-2 text-sm font-medium text-white bg-[#1a1f18] rounded-lg hover:bg-black transition-colors shadow-sm">
              View / Edit Booking
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
