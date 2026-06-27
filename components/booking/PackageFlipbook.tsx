"use client";

import React, { useState } from 'react';

export default function PackageFlipbook() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div 
      className={`bg-white shadow-lg border border-[#D4AF37]/30 overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] relative ${
        isExpanded 
          ? 'w-full h-[600px] sm:h-[700px] max-w-none' 
          : 'w-full max-w-sm aspect-[4/5] cursor-pointer hover:shadow-xl'
      }`}
      onClick={() => {
        if (!isExpanded) setIsExpanded(true);
      }}
    >
      {!isExpanded ? (
        <div className="w-full h-full flex items-center justify-center relative group">
          <div className="w-2/3 opacity-80 transition-transform duration-500 group-hover:scale-105">
            <img src="/zion-logo.png" alt="Zion" className="w-full h-auto filter brightness-0" />
          </div>
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
            <div className="bg-gradient-to-r from-[#D4AF37] to-[#C5B358] text-white px-6 py-3 rounded-full font-serif tracking-widest shadow-[0_4px_15px_rgba(212,175,55,0.4)] text-sm uppercase flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 border-none">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              View Flipbook
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col bg-white animate-in fade-in duration-500">
          <div className="w-full bg-gradient-to-r from-[#D4AF37] to-[#C5B358] flex justify-between items-center px-6 py-3 text-white shadow-md z-10">
            <span className="font-serif tracking-[0.2em] text-sm uppercase">Package Details</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
              className="hover:text-white transition-colors flex items-center gap-2 text-xs uppercase tracking-wider font-sans bg-white/10 px-3 py-1.5 rounded-full hover:bg-red-500/80"
            >
              Close
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <iframe
            src="https://heyzine.com/flip-book/eeabcd2f18.html"
            className="w-full flex-1 border-none bg-white"
            allowFullScreen
            scrolling="no"
            title="Package Details Flipbook"
          />
        </div>
      )}
    </div>
  );
}
