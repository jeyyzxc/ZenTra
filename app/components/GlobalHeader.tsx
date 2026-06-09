"use client";

import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { usePathname } from 'next/navigation';

export default function GlobalHeader() {
  const [scrollY, setScrollY] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial calculation
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  const isHomePage = pathname === '/';

  // Calculate animations based on scroll
  const scrollLimit = 500; // Pixels to scroll to complete the logo animation
  
  // Force progress to 1 (final top state) if we are on any subpage
  const progress = isHomePage ? Math.min(1, scrollY / scrollLimit) : 1;
  
  // Logo scales down from 1.0 to 0.35
  const logoScale = 1 - (progress * 0.65);
  // Logo translates up to the navbar area (approx 42vh up from center)
  const logoTranslateY = -(progress * 42); // in vh units

  return (
    <div className="fixed inset-0 h-screen pointer-events-none z-[100]">
      {/* Navigation */}
      <div className="absolute top-0 left-0 right-0 pointer-events-auto">
        <Navbar />
      </div>

      {/* Center Logo */}
      <div 
        className="absolute inset-0 flex items-center justify-center transition-transform duration-75"
        style={{ 
          transform: `translateY(${logoTranslateY}vh) scale(${logoScale})`,
        }}
      >
        <div className="relative w-80 md:w-96 lg:w-[450px]">
          {/* Hidden image to force natural aspect ratio */}
          <img 
            src="/c98908fb-9a78-41df-9a97-95623bdf6114.png" 
            alt="Zion Events Place Logo" 
            className="w-full h-auto opacity-0"
          />
          {/* Colored Mask */}
          <div 
            className="absolute inset-0 bg-gradient-to-tr from-[#C5B87D] via-[#FFFDF8] to-[#E6D5A7] drop-shadow-2xl opacity-95"
            style={{
              WebkitMaskImage: 'url(/c98908fb-9a78-41df-9a97-95623bdf6114.png)',
              WebkitMaskSize: 'contain',
              WebkitMaskPosition: 'center',
              WebkitMaskRepeat: 'no-repeat',
              maskImage: 'url(/c98908fb-9a78-41df-9a97-95623bdf6114.png)',
              maskSize: 'contain',
              maskPosition: 'center',
              maskRepeat: 'no-repeat'
            }}
          />
        </div>
      </div>
    </div>
  );
}
