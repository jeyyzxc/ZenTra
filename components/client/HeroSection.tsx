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
    <section className="relative z-0 flex h-[150dvh] min-h-[60rem] w-full flex-col bg-transparent" data-motion="decorative">
      {/* Background Image Setup - sticky within the hero section instead of globally fixed */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <div className="sticky top-0 -z-10 h-dvh w-full">
          <BackgroundSlideshow />
        </div>
      </div>

      {/* Sticky container for the hero content to stay in view while scrolling the 150vh */}
      <div className="pointer-events-none sticky top-0 flex h-dvh w-full items-center justify-center overflow-hidden">


        {/* Hero Text Content */}
        <div
          className="pointer-events-auto relative z-10 mt-[clamp(11rem,34dvh,18rem)] flex max-w-6xl flex-col items-center justify-center px-[var(--layout-gutter)] text-center"
          style={{
            opacity: textOpacity,
            transform: textTransform
          }}
        >
          <h1 className="font-segoe mb-3 text-[clamp(2.15rem,8vw,4.5rem)] leading-[1.08] text-white drop-shadow-md">
            Overlooking San Pedro City lights
          </h1>
          <p className="mb-6 w-full max-w-5xl px-0 font-serif text-[clamp(1.05rem,3.5vw,1.85rem)] font-light italic leading-relaxed tracking-wide text-white opacity-90 drop-shadow-md sm:px-8">
            Elevate your celebrations with a breathtaking panoramic view of the sparkling city below.
          </p>
          <Link href="/about" className="pointer-events-auto mt-8 inline-flex min-h-12 items-center justify-center rounded-md border-[1.5px] border-white bg-transparent px-8 py-2.5 font-serif text-base tracking-widest text-white transition-all hover:border-[#DFD48A] hover:bg-[#DFD48A] hover:text-neutral-900 hover:shadow-[0_0_20px_rgba(223,212,138,0.4)] sm:mt-12">
            OUR STORY
          </Link>
        </div>
      </div>
    </section>
  );
}
