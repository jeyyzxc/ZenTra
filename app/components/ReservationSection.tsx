import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ReservationSection() {
  // Generate random days for visual representation
  const days = Array.from({ length: 30 }, (_, i) => {
    // some predefined booked days for realistic look
    const bookedDays = [3, 4, 8, 12, 17, 21, 25, 26, 28];
    return {
      day: i + 1,
      isBooked: bookedDays.includes(i + 1),
    };
  });

  return (
    <section className="bg-[#DFDAC1] w-full px-4 py-16 md:px-12 border-t border-[#3A4B3C]/10 border-b border-[#3A4B3C]/10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-start">
        
        {/* Left Side: Calendar */}
        <div className="flex gap-8 items-start">
          <div className="bg-[#C5BE9A] rounded-2xl p-6 w-full max-w-[340px] shadow-md border border-white/20">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <button className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-white hover:bg-gray-800 transition-colors">
                <ChevronLeft size={14} />
              </button>
              <div className="bg-white/90 px-4 py-1.5 rounded-sm flex-1 mx-3 flex justify-between items-center text-sm font-sans text-gray-800 shadow-sm">
                <span>March 2026</span>
                <span className="text-gray-400 text-[10px]">▼</span>
              </div>
              <button className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-white hover:bg-gray-800 transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-5 gap-2">
              {days.map((d, i) => (
                <div 
                  key={i} 
                  className={`aspect-square rounded-sm ${d.isBooked ? 'bg-[#FF6B6B]' : 'bg-[#51DF7E]'} shadow-sm`}
                />
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-6 pt-6">
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-[#FF6B6B] rounded-md shadow-sm"></div>
              <span className="text-sm font-serif text-[#3A4B3C] tracking-wide">Booked</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 bg-[#51DF7E] rounded-md shadow-sm"></div>
              <span className="text-sm font-serif text-[#3A4B3C] tracking-wide">Available</span>
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

