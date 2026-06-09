import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative z-10 bg-zentra-bg w-full px-4 py-12 md:px-12 border-t-2 border-black mt-auto">
      <div className="w-full mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8 pt-4">
          
          {/* Left: Brand */}
          <div className="flex flex-col gap-2 md:col-span-5">
            <h3 className="font-serif text-black text-lg md:text-xl font-medium tracking-wide">ZION EVENTS PLACE</h3>
            <p className="text-black text-xs md:text-sm font-serif max-w-xs opacity-80 mt-1">
              Sophisticated Celebrations, Excellent Service - Overlooking Laguna
            </p>
          </div>

          {/* Middle: Explore Links */}
          <div className="flex flex-col gap-3 items-start text-left md:col-span-4">
            <h4 className="font-serif text-black text-xs md:text-sm font-bold uppercase mb-1">EXPLORE</h4>
            <div className="flex flex-col gap-2 items-start">
              <Link href="/about" className="text-black text-xs md:text-sm font-serif hover:underline">Menu</Link>
              <Link href="/" className="text-black text-xs md:text-sm font-serif hover:underline">Home</Link>
              <Link href="/events/weddings" className="text-black text-xs md:text-sm font-serif hover:underline">Packages</Link>
              <Link href="/events/weddings#gallery" className="text-black text-xs md:text-sm font-serif hover:underline">Gallery</Link>
            </div>
          </div>

          {/* Right: Socials */}
          <div className="flex flex-col gap-3 items-start text-left md:col-span-3">
            <h4 className="font-serif text-black text-xs md:text-sm font-bold uppercase mb-1">FOLLOW US</h4>
            <p className="text-black text-xs md:text-sm font-serif mb-2">Join our community.</p>
            <div className="flex gap-4">
              {/* Facebook */}
              <Link href="#" className="hover:opacity-90 transition-opacity">
                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="12" fill="#1877F2"/>
                  <path d="M14.6562 12H12.5V19.5H9.375V12H8.125V9.375H9.375V7.8125C9.375 6.075 10.125 4.5 12.8125 4.5H15V7.03125H13.4375C12.4375 7.03125 12.5 7.46875 12.5 8.125V9.375H15L14.6562 12Z" fill="white"/>
                </svg>
              </Link>
              
              {/* Instagram */}
              <Link href="#" className="hover:opacity-90 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7ZM9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12Z" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M16.5 9C17.3284 9 18 8.32843 18 7.5C18 6.67157 17.3284 6 16.5 6C15.6716 6 15 6.67157 15 7.5C15 8.32843 15.6716 9 16.5 9Z" />
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12Z" />
                  </svg>
                </div>
              </Link>

              {/* TikTok */}
              <Link href="#" className="hover:opacity-90 transition-opacity">
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.976-4.686H12v13.319a2.656 2.656 0 1 1-2.656-2.656c.11 0 .218.007.324.019V9.227a6.114 6.114 0 1 0 6.114 6.114V9.824a8.23 8.23 0 0 0 4.02 1.045V7.41a4.78 4.78 0 0 1-2.213-.724Z" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-6 border-t border-black text-black text-xs md:text-sm font-serif gap-4">
          <p>© 2026 Zion Events Place. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="#terms" className="hover:underline">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

