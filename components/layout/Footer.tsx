import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative z-10 bg-white/95 dark:bg-[#0C100B]/95 backdrop-blur-xl w-full mt-auto shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#FBF4C4] via-white/0 to-transparent dark:from-[#111610] dark:via-[#0C100B]/0 dark:to-transparent"></div>
        <div className="absolute inset-0 w-full h-full bg-gradient-to-bl from-[#FBF4C4] via-white/0 to-transparent dark:from-[#111610] dark:via-[#0C100B]/0 dark:to-transparent"></div>
      </div>

      <div className="relative z-10 w-full pt-8 pb-4 border-t border-neutral-900/10">
      <div className="w-full mx-auto px-4 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-2">

          {/* Left: Brand */}
          <div className="flex flex-col gap-1 md:col-span-3">
            <h3 className="font-serif text-neutral-900 text-2xl md:text-3xl font-medium tracking-wide transition-all duration-300 hover:text-[#D4AF37] hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.3)] cursor-pointer">ZION EVENTS PLACE</h3>
            <p className="text-neutral-900 text-sm md:text-base font-serif max-w-xs opacity-80">
              Overlooking San Pedro City lights.
            </p>
          </div>

          {/* Middle 1: Explore Links */}
          <div className="flex flex-col gap-3 items-start text-left md:col-span-2 md:pl-4 lg:pl-16 xl:pl-20">
            <h4 className="font-serif text-neutral-600 text-sm md:text-base font-bold uppercase mb-1 drop-shadow-sm">EXPLORE</h4>
            <div className="flex flex-col gap-2 items-start">
              <Link href="/" className="relative text-neutral-900 text-sm md:text-base font-serif transition-all duration-300 hover:translate-x-1.5 opacity-80 hover:opacity-100 hover:text-[#D4AF37] w-fit after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[1px] after:-bottom-0.5 after:left-0 after:bg-[#D4AF37] after:origin-bottom-right hover:after:origin-bottom-left hover:after:scale-x-100 after:transition-transform after:duration-300">Home</Link>
              <Link href="/about" className="relative text-neutral-900 text-sm md:text-base font-serif transition-all duration-300 hover:translate-x-1.5 opacity-80 hover:opacity-100 hover:text-[#D4AF37] w-fit after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[1px] after:-bottom-0.5 after:left-0 after:bg-[#D4AF37] after:origin-bottom-right hover:after:origin-bottom-left hover:after:scale-x-100 after:transition-transform after:duration-300">About Us</Link>
              <Link href="/events/weddings" className="relative text-neutral-900 text-sm md:text-base font-serif transition-all duration-300 hover:translate-x-1.5 opacity-80 hover:opacity-100 hover:text-[#D4AF37] w-fit after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[1px] after:-bottom-0.5 after:left-0 after:bg-[#D4AF37] after:origin-bottom-right hover:after:origin-bottom-left hover:after:scale-x-100 after:transition-transform after:duration-300">Packages</Link>
              <Link href="/gallery" className="relative text-neutral-900 text-sm md:text-base font-serif transition-all duration-300 hover:translate-x-1.5 opacity-80 hover:opacity-100 hover:text-[#D4AF37] w-fit after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[1px] after:-bottom-0.5 after:left-0 after:bg-[#D4AF37] after:origin-bottom-right hover:after:origin-bottom-left hover:after:scale-x-100 after:transition-transform after:duration-300">Gallery</Link>
            </div>
          </div>

          {/* Middle 2: Contact Details */}
          <div className="flex flex-col items-start text-left md:col-span-5 md:pl-4 lg:pl-8 xl:pl-16">
            <div className="flex items-stretch gap-3 md:gap-4">
              {/* Address (Left) */}
              <div className="flex flex-col gap-2">
                <h4 className="font-serif text-neutral-600 text-sm md:text-base font-bold uppercase drop-shadow-sm">VISIT US</h4>
                <div className="flex flex-col text-neutral-900 text-sm md:text-base font-serif leading-relaxed">
                  <span className="whitespace-nowrap">Father Masi Street,</span>
                  <span className="whitespace-nowrap">Holiday Hills, Barangay San&nbsp;Antonio,</span>
                  <span className="whitespace-nowrap">San Pedro, Philippines, 4023</span>
                </div>
              </div>

              {/* Vertical Divider */}
              <div className="w-px bg-neutral-900 opacity-20 mt-1 mx-1 md:mx-2"></div>

              {/* Contact (Right) */}
              <div className="flex flex-col gap-2">
                <h4 className="font-serif text-neutral-600 text-sm md:text-base font-bold uppercase drop-shadow-sm">CONTACT US</h4>
                <div className="flex flex-col gap-1 text-neutral-900 text-sm md:text-base font-serif leading-relaxed">
                  <a href="tel:09194442327" className="relative transition-all duration-300 hover:translate-x-1.5 opacity-80 hover:opacity-100 hover:text-[#D4AF37] w-fit after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[1px] after:-bottom-0.5 after:left-0 after:bg-[#D4AF37] after:origin-bottom-right hover:after:origin-bottom-left hover:after:scale-x-100 after:transition-transform after:duration-300">
                    Tel: 0919 444 2327
                  </a>
                  <a href="mailto:teamzioneventsplace@gmail.com" className="relative transition-all duration-300 hover:translate-x-1.5 opacity-80 hover:opacity-100 hover:text-[#D4AF37] w-fit after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[1px] after:-bottom-0.5 after:left-0 after:bg-[#D4AF37] after:origin-bottom-right hover:after:origin-bottom-left hover:after:scale-x-100 after:transition-transform after:duration-300">
                    teamzioneventsplace@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Socials */}
          <div className="flex flex-col gap-3 items-start text-left md:col-span-2 justify-self-end">
            <div className="flex flex-col gap-1">
              <h4 className="font-serif text-neutral-600 text-sm md:text-base font-bold uppercase drop-shadow-sm">FOLLOW US</h4>
              <p className="text-neutral-900 text-sm md:text-base font-serif opacity-90">Join our community.</p>
            </div>
            <div className="flex gap-4 mt-1">
              {/* Facebook */}
              <Link href="https://www.facebook.com/ZionEventsPlace" target="_blank" rel="noopener noreferrer" className="hover:-translate-y-1 transform duration-300">
                <img src="/communication.png" alt="Facebook" className="w-9 h-9 object-contain transition-transform" />
              </Link>

              {/* Instagram */}
              <Link href="https://www.instagram.com/zioneventsplace?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="hover:-translate-y-1 transform duration-300">
                <img src="/instagram.png" alt="Instagram" className="w-9 h-9 object-contain transition-transform" />
              </Link>

              {/* TikTok */}
              <Link href="https://www.tiktok.com/@zioneventsvenue?_r=1&_t=ZS-97KTDZ4I1Ka" target="_blank" rel="noopener noreferrer" className="hover:-translate-y-1 transform duration-300">
                <img src="/tik-tok.png" alt="TikTok" className="w-9 h-9 object-contain transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legal Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center pt-2 px-4 md:px-12 border-t border-neutral-900/10 text-neutral-900 text-sm md:text-base font-serif gap-4 mt-2">
        <p>© 2026 Zion Events Place. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/privacy" className="relative transition-all duration-300 opacity-80 hover:opacity-100 hover:text-[#D4AF37] hover:drop-shadow-[0_0_4px_rgba(212,175,55,0.5)] after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[1px] after:-bottom-0.5 after:left-0 after:bg-[#D4AF37] after:origin-bottom-right hover:after:origin-bottom-left hover:after:scale-x-100 after:transition-transform after:duration-300">Privacy Policy</Link>
          <Link href="/terms" className="relative transition-all duration-300 opacity-80 hover:opacity-100 hover:text-[#D4AF37] hover:drop-shadow-[0_0_4px_rgba(212,175,55,0.5)] after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[1px] after:-bottom-0.5 after:left-0 after:bg-[#D4AF37] after:origin-bottom-right hover:after:origin-bottom-left hover:after:scale-x-100 after:transition-transform after:duration-300">Terms of Service</Link>
        </div>
      </div>
      </div>
    </footer>
  );
}

  