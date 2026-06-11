"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Dropdown data
  const menuItems = [
    { label: "Home", href: "/" },
    { 
      label: "Packages", 
      href: "/events/weddings",
      subItems: [
        { label: "Weddings", href: "/events/weddings" },
        { label: "Debuts", href: "/events/debuts" },
        { label: "Christening", href: "/events/christening" },
        { label: "Birthdays", href: "/events/birthdays" },
        { label: "Gender Reveal", href: "/events/gender-reveal" },
        { label: "Christmas Party", href: "/events/christmas-party" },
      ]
    },
    { label: "Gallery", href: "/events/weddings#gallery" },
    { label: "About Us", href: "/about" },
    { label: "Facilities", href: "/facilities" },
    { label: "Testimonies", href: "/testimonies" },
    { label: "Contact Us", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Rules & Regulation", href: "/rules" },
  ];

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 flex items-start justify-end px-8 md:px-12 py-8 pointer-events-auto">
      
      {/* Menu Container */}
      <div
        className="relative flex flex-col items-center"
        onMouseEnter={() => setIsMenuOpen(true)}
        onMouseLeave={() => setIsMenuOpen(false)}
      >
        {/* Hamburger Icon */}
        <Link
          href="#"
          onClick={(e) => e.preventDefault()}
          className={`flex items-center justify-center text-center transition-all duration-300 z-10 p-2 ${isMenuOpen ? 'scale-110 text-[#DFD48A] drop-shadow-[0_0_10px_rgba(223,212,138,0.6)]' : 'text-white drop-shadow-md hover:text-[#DFD48A] hover:drop-shadow-[0_0_10px_rgba(223,212,138,0.4)] hover:scale-110'}`}
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </Link>

        {/* Sidebar Panel - Modern Glassmorphism */}
        <div
          className={`fixed top-0 right-0 h-screen pt-28 pb-8 px-6 md:px-10 bg-gradient-to-br from-[#FBF4C4]/95 via-white/95 to-white/95 backdrop-blur-xl shadow-[-20px_0_50px_-15px_rgba(0,0,0,0.1)] flex flex-col w-[70vw] md:w-72 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] rounded-none -z-10
            ${isMenuOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-full opacity-0 pointer-events-none'}
          `}
        >
          {/* Menu Items */}
          <div className="flex flex-col gap-5 md:gap-6 flex-grow overflow-y-auto overflow-x-hidden pr-2 no-scrollbar">
            {menuItems.map((item, index) => (
              <div key={index} className="flex flex-col items-end group">
                <Link
                  href={item.href}
                  className="text-neutral-900 group-hover:text-[#D4AF37] group-hover:-translate-x-1 text-right transition-all duration-300 text-base md:text-lg font-serif tracking-[0.2em] uppercase font-medium"
                  style={{ transitionDelay: `${isMenuOpen ? index * 40 : 0}ms` }}
                >
                  {item.label}
                </Link>
                {item.subItems && (
                  <div className="flex flex-col gap-4 overflow-y-auto overflow-x-hidden max-h-0 opacity-0 group-hover:max-h-[200px] group-hover:opacity-100 group-hover:mt-4 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] items-end pr-4 border-r-2 border-[#D4AF37]/50 events-scrollbar">
                    {item.subItems.map((sub, idx) => (
                      <Link
                        key={idx}
                        href={sub.href}
                        className="text-neutral-600 hover:text-[#D4AF37] hover:-translate-x-1 text-right transition-all duration-300 text-sm md:text-base font-serif tracking-[0.15em] uppercase flex-shrink-0"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Book Now Button at bottom */}
          <Link
            href="/book"
            className="mt-8 px-6 py-4 bg-transparent border-[1.5px] border-neutral-900 text-neutral-900 hover:bg-[#DFD48A] hover:border-[#DFD48A] hover:text-neutral-900 hover:shadow-[0_0_20px_rgba(223,212,138,0.4)] text-center transition-all duration-500 text-sm font-serif tracking-[0.3em] uppercase flex items-center justify-center gap-3 group"
            style={{ transitionDelay: `${isMenuOpen ? menuItems.length * 40 + 100 : 0}ms` }}
          >
            <span className="group-hover:text-neutral-900 transition-colors">Book Now</span>
            <svg className="w-4 h-4 text-neutral-900 group-hover:text-neutral-900 transform group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </Link>
        </div>
      </div>
    </nav>
  );
}

