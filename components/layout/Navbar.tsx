"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const menuItems = [
  { label: 'Home', href: '/' },
  {
    label: 'Packages',
    href: '/events/weddings',
    subItems: [
      { label: 'Weddings', href: '/events/weddings' },
      { label: 'Debuts', href: '/events/debuts' },
      { label: 'Christening', href: '/events/christening' },
      { label: 'Birthdays', href: '/events/birthdays' },
      { label: 'Gender Reveal', href: '/events/gender-reveal' },
      { label: 'Christmas Party', href: '/events/christmas-party' },
    ],
  },
  { label: 'Gallery', href: '/gallery' },
  { label: 'About Us', href: '/about' },
  { label: 'Facilities', href: '/facilities' },
  { label: 'Testimonies', href: '/testimonies' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Rules & Regulation', href: '/rules' },
] as const;

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.dataset.publicMenuOpen = 'true';

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      delete document.documentElement.dataset.publicMenuOpen;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isMenuOpen]);

  const closeMenu = () => {
    setIsMenuOpen(false);
    setExpandedItem(null);
  };

  const handleDesktopEnter = () => {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      setIsMenuOpen(true);
    }
  };

  const handleDesktopLeave = () => {
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      closeMenu();
    }
  };

  return (
    <nav
      aria-label="Primary navigation"
      className="pointer-events-auto absolute inset-x-0 top-0 z-50 flex items-start justify-end px-[var(--layout-gutter)] pb-4"
      onMouseEnter={handleDesktopEnter}
      onMouseLeave={handleDesktopLeave}
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
    >
      <button
        aria-controls="primary-navigation-panel"
        aria-expanded={isMenuOpen}
        aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
        className={`touch-target relative z-[70] flex items-center justify-center rounded-full text-center transition-all duration-300 ${
          isMenuOpen
            ? 'scale-105 bg-black/10 text-[#DFD48A] drop-shadow-[0_0_10px_rgba(223,212,138,0.6)] backdrop-blur-sm'
            : 'text-white drop-shadow-md hover:scale-105 hover:bg-black/10 hover:text-[#DFD48A] hover:drop-shadow-[0_0_10px_rgba(223,212,138,0.4)]'
        }`}
        onClick={() => setIsMenuOpen((open) => !open)}
        type="button"
      >
        <svg aria-hidden="true" className="h-7 w-7 sm:h-8 sm:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M6 18 18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      <button
        aria-label="Close navigation menu"
        className={`fixed inset-0 z-[50] bg-black/25 backdrop-blur-[1px] transition-opacity duration-300 ${
          isMenuOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeMenu}
        tabIndex={isMenuOpen ? 0 : -1}
        type="button"
      />

      <div
        aria-hidden={!isMenuOpen}
        aria-label="Primary navigation menu"
        className={`fixed right-0 top-0 z-[60] flex h-dvh w-[90vw] max-w-[20rem] flex-col overflow-hidden bg-gradient-to-br from-[#FBF4C4]/98 via-white/98 to-white/98 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(5rem,calc(env(safe-area-inset-top)+4rem))] shadow-[-20px_0_50px_-15px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-[transform,opacity] duration-400 ease-[cubic-bezier(0.25,1,0.5,1)] sm:w-full sm:max-w-[22rem] sm:px-7 sm:pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pt-[max(6rem,calc(env(safe-area-inset-top)+5rem))] ${
          isMenuOpen ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-full opacity-0'
        }`}
        id="primary-navigation-panel"
        role="dialog"
      >
        <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden pr-1 sm:gap-4">
          {menuItems.map((item, index) => {
            const hasSubItems = 'subItems' in item;
            const isExpanded = expandedItem === item.label;

            return (
              <div
                className="flex flex-col items-end"
                key={item.label}
                onMouseEnter={() => {
                  if (hasSubItems && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                    setExpandedItem(item.label);
                  }
                }}
                onMouseLeave={() => {
                  if (hasSubItems && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
                    setExpandedItem(null);
                  }
                }}
              >
                <div className="flex w-full items-center justify-end gap-1">
                  <Link
                    href={item.href}
                    className="py-1.5 text-right font-serif text-[0.95rem] font-medium uppercase tracking-[0.13em] text-neutral-900 transition-all duration-300 hover:-translate-x-1 hover:text-[#A88718] sm:py-2 sm:text-lg sm:tracking-[0.2em]"
                    onClick={closeMenu}
                    style={{ transitionDelay: `${isMenuOpen ? index * 35 : 0}ms` }}
                    tabIndex={isMenuOpen ? 0 : -1}
                  >
                    {item.label}
                  </Link>
                  {hasSubItems ? (
                    <button
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Hide' : 'Show'} package categories`}
                      className="touch-target flex items-center justify-center rounded-full text-neutral-700 transition-colors hover:bg-[#D4AF37]/10 hover:text-[#A88718]"
                      onClick={() => setExpandedItem(isExpanded ? null : item.label)}
                      tabIndex={isMenuOpen ? 0 : -1}
                      type="button"
                    >
                      <svg
                        aria-hidden="true"
                        className={`h-4 w-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m6 9 6 6 6-6" />
                      </svg>
                    </button>
                  ) : null}
                </div>

                {hasSubItems ? (
                  <div
                    className={`events-scrollbar flex flex-col items-end gap-1 overflow-y-auto border-r-2 border-[#D4AF37]/50 pr-4 transition-[max-height,opacity,margin] duration-300 ${
                      isExpanded ? 'mt-1 max-h-64 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    {item.subItems.map((subItem) => (
                      <Link
                        className="py-2 text-right font-serif text-sm uppercase tracking-[0.12em] text-neutral-600 transition-all duration-300 hover:-translate-x-1 hover:text-[#A88718] sm:text-base sm:tracking-[0.15em]"
                        href={subItem.href}
                        key={subItem.href}
                        onClick={closeMenu}
                        tabIndex={isMenuOpen && isExpanded ? 0 : -1}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <Link
          className="mt-4 flex min-h-12 items-center justify-center gap-3 border-[1.5px] border-neutral-900 bg-transparent px-5 py-3 text-center font-serif text-sm uppercase tracking-[0.22em] text-neutral-900 transition-all duration-500 hover:border-[#DFD48A] hover:bg-[#DFD48A] hover:shadow-[0_0_20px_rgba(223,212,138,0.4)] sm:mt-5 sm:px-6 sm:tracking-[0.25em]"
          href="/book"
          onClick={closeMenu}
          tabIndex={isMenuOpen ? 0 : -1}
        >
          <span>Book Now</span>
          <svg aria-hidden="true" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </nav>
  );
}
