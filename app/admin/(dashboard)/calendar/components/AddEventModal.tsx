import React from 'react';
import { X, Calendar as CalendarIcon, Clock, Users, MapPin, AlignLeft } from 'lucide-react';
import { format } from 'date-fns';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
}

export function AddEventModal({ isOpen, onClose, initialDate }: AddEventModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900">Add New Booking</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5 text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Event Title</label>
              <input type="text" placeholder="e.g. Smith Wedding Reception" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1a1f18] focus:ring-1 focus:ring-[#1a1f18] outline-none transition-all" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="date" defaultValue={initialDate ? format(initialDate, 'yyyy-MM-dd') : ''} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1a1f18] focus:ring-1 focus:ring-[#1a1f18] outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Event Type</label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1a1f18] focus:ring-1 focus:ring-[#1a1f18] outline-none transition-all bg-white">
                  <option>Wedding</option>
                  <option>Debut</option>
                  <option>Corporate</option>
                  <option>Meeting</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="time" defaultValue="09:00" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1a1f18] focus:ring-1 focus:ring-[#1a1f18] outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">End Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="time" defaultValue="17:00" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1a1f18] focus:ring-1 focus:ring-[#1a1f18] outline-none transition-all" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Client Name</label>
                <input type="text" placeholder="John Doe" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1a1f18] focus:ring-1 focus:ring-[#1a1f18] outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Guest Count</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input type="number" placeholder="100" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1a1f18] focus:ring-1 focus:ring-[#1a1f18] outline-none transition-all" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Venue / Space</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1a1f18] focus:ring-1 focus:ring-[#1a1f18] outline-none transition-all bg-white">
                  <option>Grand Hall</option>
                  <option>Garden View</option>
                  <option>Crystal Room</option>
                  <option>Entire Facility</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
              <div className="relative">
                <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea rows={3} placeholder="Any special requirements..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1a1f18] focus:ring-1 focus:ring-[#1a1f18] outline-none transition-all resize-none"></textarea>
              </div>
            </div>

          </form>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-[#1a1f18] rounded-lg hover:bg-black transition-colors shadow-sm">Save Booking</button>
        </div>
      </div>
    </div>
  );
}
