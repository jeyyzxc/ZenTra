import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function TestimonialSection() {
  return (
    <section className="bg-zentra-bg w-full px-4 py-16 md:px-12">
      <div className="max-w-5xl mx-auto bg-[#EBE7CF] rounded-[60px] px-8 py-16 md:px-24 md:py-20 flex flex-col items-center relative shadow-sm border border-white/40">
        
        <h2 className="font-script text-[#3A4B3C] text-6xl md:text-8xl mb-16 drop-shadow-sm">
          Testimonies
        </h2>
        
        {/* Navigation Arrows */}
        <button className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 text-black hover:text-black/70 transition-colors">
          <ChevronLeft size={48} strokeWidth={2} />
        </button>
        <button className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 text-black hover:text-black/70 transition-colors">
          <ChevronRight size={48} strokeWidth={2} />
        </button>

        {/* Content */}
        <div className="relative w-full max-w-3xl flex justify-center text-center">
          <span className="absolute -top-12 -left-8 font-serif text-[120px] text-black leading-none drop-shadow-md">
            “
          </span>
          <p className="font-serif text-[#3A4B3C] text-xl md:text-2xl leading-relaxed px-4 md:px-12 z-10">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.
          </p>
          <span className="absolute -bottom-24 -right-12 font-serif text-[120px] text-black leading-none drop-shadow-md">
            ”
          </span>
        </div>

        {/* Author */}
        <p className="mt-20 font-serif italic text-[#3A4B3C]/80 text-sm md:text-base self-start md:self-auto md:ml-12 uppercase tracking-wide">
          DELA CRUZ, JUAN, JANUARY 31 2026 Wedding
        </p>

      </div>
    </section>
  );
}

