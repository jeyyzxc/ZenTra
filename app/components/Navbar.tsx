"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Dropdown data
  const menuItems = [
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "FAQ", href: "/faq" },
    { label: "Rules & Regulation", href: "/rules" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ];

  const homeItems = [
    { label: "Back to Home", href: "/" },
  ];

  const packagesItems = [
    { label: "Weddings", href: "/events/weddings" },
    { label: "Debuts", href: "/events/debuts" },
    { label: "Birthdays", href: "/events/birthdays" },
    { label: "Gender Reveals", href: "/events/gender-reveal" },
    { label: "Christenings", href: "/events/christening" },
    { label: "Christmas Parties", href: "/events/christmas-party" },
  ];

  const galleryItems = [
    { label: "Weddings", href: "/events/weddings#gallery" },
    { label: "Debuts", href: "/events/debuts#gallery" },
    { label: "Birthdays", href: "/events/birthdays#gallery" },
    { label: "Gender Reveals", href: "/events/gender-reveal#gallery" },
    { label: "Christenings", href: "/events/christening#gallery" },
    { label: "Christmas Parties", href: "/events/christmas-party#gallery" },
  ];

  // Reusable Nav Item Component
  const NavDropdown = ({ 
    title, 
    items, 
    id, 
    isMenu = false 
  }: { 
    title: string, 
    items: {label: string, href: string}[], 
    id: string,
    isMenu?: boolean
  }) => {
    const isOpen = activeDropdown === id;
    
    return (
      <div 
        className="relative flex flex-col items-center"
        onMouseEnter={() => setActiveDropdown(id)}
        onMouseLeave={() => setActiveDropdown(null)}
      >
        <Link 
          href={`#${id}`} 
          className={`px-6 py-1.5 text-center rounded-full transition-all duration-300 text-sm font-serif shadow-sm border border-transparent z-10
            ${isOpen ? 'bg-[#FBF4C4] text-black scale-105' : 'bg-[#FBF4C4] text-black hover:brightness-95 hover:scale-105'}
          `}
        >
          {title}
        </Link>
        
        {/* Dropdown Container */}
        <div 
          className={`absolute top-full pt-2 flex flex-col gap-2 w-32 transition-all duration-300 origin-top
            ${isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none scale-95'}
          `}
        >
          {items.map((item, index) => (
            <Link 
              key={index}
              href={item.href} 
              className="px-4 py-1.5 bg-[#DDD181] hover:bg-[#FBF4C4] text-black text-center rounded-full transition-all duration-200 text-xs font-serif shadow-sm hover:scale-105 hover:shadow-md border border-transparent hover:border-black/5"
              style={{ transitionDelay: `${isOpen ? index * 30 : 0}ms` }}
            >
              {item.label === "Rules & Regulation" ? (
                <span className="text-[10px] leading-tight block">Rules &<br/>Regulation</span>
              ) : (
                item.label
              )}
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <nav className="absolute top-0 left-0 right-0 z-50 flex items-start justify-between px-12 py-8 pointer-events-auto">
      
      {/* Left: Menu */}
      <NavDropdown title="Menu" items={menuItems} id="menu" isMenu={true} />

      {/* Right: Navigation Links */}
      <div className="flex gap-4">
        <NavDropdown title="Home" items={homeItems} id="home" />
        <NavDropdown title="Packages" items={packagesItems} id="packages" />
        <NavDropdown title="Gallery" items={galleryItems} id="gallery" />
        
        {/* Book Now (No Dropdown) */}
        <Link 
          href="#book" 
          className="px-6 py-1.5 bg-[#FBF4C4] hover:brightness-95 text-black text-center rounded-full transition-all duration-300 hover:scale-105 text-sm font-serif shadow-sm h-fit"
          onMouseEnter={() => setActiveDropdown(null)}
        >
          Book Now
        </Link>
      </div>
      
    </nav>
  );
}

