"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import BackgroundSlideshow from '@/components/shared/BackgroundSlideshow';

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
      {/* Background Image Setup - sticky within the hero section instead of globally fixed */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <div className="sticky top-0 w-full h-screen -z-10">
          <BackgroundSlideshow />
        </div>
      </div>

      {/* Sticky container for the hero content to stay in view while scrolling the 150vh */}
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden pointer-events-none">


        {/* Hero Text Content */}
        <div
          className="relative z-10 flex flex-col items-center justify-center text-center px-4 pointer-events-auto mt-72"
          style={{
            opacity: textOpacity,
            transform: textTransform
          }}
        >
          <h1 className="text-white text-4xl md:text-5xl lg:text-[4.5rem] mb-3 drop-shadow-md font-segoe leading-tight">
            Overlooking San Pedro City lights
          </h1>
          <p className="text-white text-xl md:text-2xl lg:text-[1.85rem] font-serif font-light italic tracking-wide max-w-none w-full px-4 sm:px-8 mb-6 drop-shadow-md opacity-90">
            Elevate your celebrations with a breathtaking panoramic view of the sparkling city below.
          </p>
          <Link href="/about" className="px-8 py-2.5 rounded-md bg-transparent border-[1.5px] border-white text-white font-serif transition-all hover:bg-[#DFD48A] hover:border-[#DFD48A] hover:text-neutral-900 hover:shadow-[0_0_20px_rgba(223,212,138,0.4)] pointer-events-auto mt-12 inline-block text-base tracking-widest">
            OUR STORY
          </Link>
        </div>
      </div>
    </section>
  );
}
