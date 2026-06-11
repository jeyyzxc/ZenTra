import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import EventCalendar from './EventCalendar';

export default function ReservationSection() {
  return (
    <section className="bg-[#DFDAC1] w-full px-4 py-16 md:px-12 border-t border-[#3A4B3C]/10 border-b border-[#3A4B3C]/10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
        
        {/* Left Side: Calendar */}
        <div className="flex flex-col items-center w-full max-w-xl mx-auto">
          <EventCalendar />
          
          {/* Legend */}
          <div className="flex items-center gap-6 mt-8 font-serif bg-white/40 px-8 py-3 rounded-full backdrop-blur-sm border border-[#3A4B3C]/10 shadow-sm w-fit">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border border-[#3A4B3C]/10 shadow-sm rounded-sm"></div>
              <span className="text-sm text-[#2F3E32] font-medium tracking-wide">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#E0E0E0] border border-black/5 shadow-inner rounded-sm"></div>
              <span className="text-sm text-[#9E9E9E] font-medium tracking-wide">Booked</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div>
          <h3 className="font-serif text-[#3A4B3C] mb-6 text-lg tracking-wide">For Reservations:</h3>
          <form className="flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="Full Name" 
              className="w-full bg-[#C5BE9A] px-6 py-3 rounded-full placeholder:text-[#3A4B3C]/60 text-[#3A4B3C] focus:outline-none shadow-inner border border-white/10 font-sans text-sm"
            />
            <input 
              type="tel" 
              placeholder="Phone Number" 
              className="w-full bg-[#C5BE9A] px-6 py-3 rounded-full placeholder:text-[#3A4B3C]/60 text-[#3A4B3C] focus:outline-none shadow-inner border border-white/10 font-sans text-sm"
            />
            <input 
              type="text" 
              placeholder="Time" 
              className="w-full bg-[#C5BE9A] px-6 py-3 rounded-full placeholder:text-[#3A4B3C]/60 text-[#3A4B3C] focus:outline-none shadow-inner border border-white/10 font-sans text-sm"
            />
            <input 
              type="email" 
              placeholder="Email" 
              className="w-full bg-[#C5BE9A] px-6 py-3 rounded-full placeholder:text-[#3A4B3C]/60 text-[#3A4B3C] focus:outline-none shadow-inner border border-white/10 font-sans text-sm"
            />
            <textarea 
              placeholder="Message" 
              rows={3}
              className="w-full bg-[#C5BE9A] px-6 py-4 rounded-3xl placeholder:text-[#3A4B3C]/60 text-[#3A4B3C] focus:outline-none shadow-inner border border-white/10 font-sans text-sm resize-none"
            ></textarea>
            
            <button 
              type="submit" 
              className="self-start px-10 py-2.5 mt-2 bg-[#AFA77B] hover:bg-[#978D63] text-white rounded-full transition-colors font-sans text-sm shadow-md"
            >
              Submit
            </button>
          </form>
        </div>

      </div>
    </section>
  );
}

