"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
  // Text starts hidden on load, and fades in as you scroll down
  const textOpacity = Math.max(0, Math.min(1, (scrollY - 100) / 300));
  const textTransform = `translateY(${Math.max(0, 30 - (scrollY * 0.1))}px)`;

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
        <div className="absolute inset-0 bg-neutral-900/70"></div>
      </div>

      {/* Sticky container for the hero content to stay in view while scrolling the 150vh */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden pointer-events-none">


        {/* Hero Text Content */}
        <div 
          className="relative z-10 flex flex-col items-center justify-center text-center px-4 pointer-events-auto mt-64"
          style={{ 
            opacity: textOpacity,
            transform: textTransform 
          }}
        >
          <h1 className="text-white text-5xl md:text-6xl lg:text-7xl mb-4 drop-shadow-md font-segoe leading-tight">
            The best view in San Pedro City
          </h1>
          <p className="text-white text-xl md:text-2xl lg:text-3xl font-sahitya max-w-3xl mb-8 drop-shadow-md">
            Celebrate life's best moments with the view you'll always remember.
          </p>
          <Link href="/about" className="px-8 py-3 bg-white hover:bg-[#DDD181] hover:text-black text-black font-serif rounded-full transition-all shadow-lg hover:scale-105 pointer-events-auto mt-8 inline-block">
            OUR STORY
          </Link>
        </div>
      </div>
    </section>
  );
}
