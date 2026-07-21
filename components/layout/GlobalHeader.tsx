"use client";

import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { usePathname } from 'next/navigation';

const LOGO_REFRESH_SCROLL_TOP_KEY = 'zion-logo-refresh-scroll-top';

export default function GlobalHeader() {
  const [scrollY, setScrollY] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const shouldScrollTop = window.sessionStorage.getItem(LOGO_REFRESH_SCROLL_TOP_KEY) === 'true';

    if (!shouldScrollTop) {
      return;
    }

    window.sessionStorage.removeItem(LOGO_REFRESH_SCROLL_TOP_KEY);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    const frameId = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

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

  const refreshCurrentPage = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    window.sessionStorage.setItem(LOGO_REFRESH_SCROLL_TOP_KEY, 'true');

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    window.location.reload();
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] h-dvh" data-motion="decorative">
      {/* Navigation */}
      <div className="pointer-events-auto absolute inset-x-0 top-0 z-[80]">
        <Navbar />
      </div>

      {/* Center Logo */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-150 pointer-events-none z-[60]"
        style={{
          transform: `translateY(${logoTranslateY}dvh) scale(${logoScale})`,
          opacity: logoOpacity,
        }}
      >
        <a
          href={pathname || '/'}
          aria-label="Refresh current Zion Events Place page"
          onClick={refreshCurrentPage}
          className="pointer-events-auto relative block w-[min(76vw,450px)] cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
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
