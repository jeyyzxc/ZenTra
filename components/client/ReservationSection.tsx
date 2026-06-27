import React from 'react';

import EventCalendar from '@/components/booking/EventCalendar';

export default function ReservationSection() {
  return (
    <section className="bg-transparent w-full px-4 py-12 md:px-12 border-t border-neutral-900/10 border-b border-neutral-900/10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        
        {/* Left Side: Calendar */}
        <div className="flex flex-col items-center w-full max-w-xl mx-auto">
          <EventCalendar />
          
          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 font-serif bg-white/60 px-8 py-3 rounded-full border border-neutral-900/10 shadow-sm w-fit backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border border-neutral-900/20 shadow-sm rounded-sm"></div>
              <span className="text-sm text-neutral-900 font-medium tracking-wide">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#E0E0E0] border border-black/5 shadow-inner rounded-sm"></div>
              <span className="text-sm text-[#9E9E9E] font-medium tracking-wide">Booked</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div>
          <h3 className="font-serif text-neutral-900 mb-4 text-lg tracking-wide">For Inquiries:</h3>
          <form className="flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="Full Name" 
              className="w-full bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full placeholder:text-neutral-500 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 shadow-inner border border-neutral-900/10 font-sans text-sm transition-all"
            />
            <input 
              type="tel" 
              placeholder="Phone Number" 
              className="w-full bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full placeholder:text-neutral-500 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 shadow-inner border border-neutral-900/10 font-sans text-sm transition-all"
            />
            <input 
              type="text" 
              placeholder="Time" 
              className="w-full bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full placeholder:text-neutral-500 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 shadow-inner border border-neutral-900/10 font-sans text-sm transition-all"
            />
            <input 
              type="email" 
              placeholder="Email" 
              className="w-full bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full placeholder:text-neutral-500 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 shadow-inner border border-neutral-900/10 font-sans text-sm transition-all"
            />
            <textarea 
              placeholder="Message" 
              rows={3}
              className="w-full bg-white/80 backdrop-blur-sm px-6 py-4 rounded-3xl placeholder:text-neutral-500 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/50 shadow-inner border border-neutral-900/10 font-sans text-sm resize-none transition-all"
            ></textarea>
            
            <button 
              type="submit" 
              className="self-start px-10 py-2.5 mt-2 bg-transparent border-[1.5px] border-neutral-900 text-neutral-900 hover:bg-[#DFD48A] hover:border-[#DFD48A] hover:shadow-[0_0_20px_rgba(223,212,138,0.4)] rounded-full transition-all font-sans text-sm uppercase tracking-[0.2em]"
            >
              Submit
            </button>
          </form>
        </div>

      </div>
    </section>
  );
}
