"use client";

import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';

export default function HeroSection() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate animations based on scroll
  // Text is visible on load and fades out as you scroll down
  const textOpacity = Math.max(0, 1 - (scrollY / 400));
  const textTransform = `translateY(${Math.max(-100, -(scrollY * 0.3))}px)`;

  return (
    <section className="relative w-full h-[150vh] min-h-[1000px] flex flex-col bg-transparent z-0">
      {/* Background Image Setup - globally fixed behind everything */}
      <div 
        className="fixed inset-0 w-full h-full bg-cover bg-center -z-10"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop")',
        }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      {/* Sticky container for the hero content to stay in view while scrolling the 150vh */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden pointer-events-none">


        {/* Hero Text Content */}
        <div 
          className="relative z-10 flex flex-col items-center justify-center text-center px-4 pointer-events-auto mt-32"
          style={{ 
            opacity: textOpacity,
            transform: textTransform 
          }}
        >
          <h1 className="text-white text-5xl md:text-6xl lg:text-7xl mb-4 drop-shadow-md font-segoe leading-tight">
            The best view in San Pedro City
          </h1>
          <p className="text-white text-xl md:text-2xl lg:text-3xl font-sahitya max-w-3xl mb-8 drop-shadow-md tracking-wide">
            Celebrate life's best moments with the view you'll always remember.
          </p>
          <button className="px-10 py-2 bg-[#D2CB96] hover:bg-[#C5B87D] text-[#3A4B3C] font-serif uppercase tracking-widest rounded-full transition-all shadow-md pointer-events-auto cursor-pointer">
            OUR STORY
          </button>
        </div>
      </div>
    </section>
  );
}
