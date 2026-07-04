"use client";

import Image from 'next/image';
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
  // Logo translates up to the navbar area
  const logoTranslateY = -(progress * 40.5); // in vh units
  const logoOpacity = 1 - (progress * 0.12);

  return (
    <div className="fixed inset-0 h-screen pointer-events-none z-[100]">
      {/* Navigation */}
      <div className="absolute top-0 left-0 right-0 pointer-events-auto">
        <Navbar />
      </div>

      {/* Center Logo */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-150 pointer-events-none z-[60]"
        style={{
          transform: `translateY(${logoTranslateY}vh) scale(${logoScale})`,
          opacity: logoOpacity,
        }}
      >
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (window.scrollY > 0) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              window.location.reload();
            }
          }}
          className="relative block w-80 md:w-96 lg:w-[450px] transition-transform duration-300 pointer-events-auto hover:scale-[1.02] cursor-pointer"
          style={{ pointerEvents: 'auto' }}
        >
          {/* Hidden image to force natural aspect ratio */}
          <Image
            src="/zion-logo.png"
            alt="Zion Events Place Logo"
            width={960}
            height={960}
            className="w-full h-auto opacity-0"
          />
          {/* Colored Mask */}
          <div
            className="absolute inset-0 bg-gradient-to-tr from-[#C5B87D] via-[#FFFDF8] to-[#E6D5A7] drop-shadow-[0_0_20px_rgba(223,212,138,0.6)] opacity-100"
            style={{
              WebkitMaskImage: 'url(/zion-logo.png)',
              WebkitMaskSize: 'contain',
              WebkitMaskPosition: 'center',
              WebkitMaskRepeat: 'no-repeat',
              maskImage: 'url(/zion-logo.png)',
              maskSize: 'contain',
              maskPosition: 'center',
              maskRepeat: 'no-repeat'
            }}
          />
        </a>
      </div>
    </div>
  );
}
