import React from 'react';
import { MapPin, Share2 } from 'lucide-react';

import PublicSubpageShell from '@/components/client/PublicSubpageShell';
import SupportFaqPreview from '@/components/client/SupportFaqPreview';
import SocialLinks from '@/components/layout/SocialLinks';
import InquiryForm from './InquiryForm';

export default function ContactPage() {
  return (
    <PublicSubpageShell heroKey="contact">

      <div className="w-full relative z-10 bg-transparent pt-12 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          <SupportFaqPreview />

          {/* Top Section: Info Cards and Form */}
          <div className="grid grid-cols-1 lg:grid-cols-[55%_1fr] gap-8 lg:gap-12 mb-16 items-start">

            {/* Left Column: Cards */}
            <div className="flex flex-col gap-6">

              {/* Location Card */}
              <div className="group bg-white/60 backdrop-blur-sm rounded-3xl p-7 shadow-sm hover:shadow-[0_20px_40px_rgba(212,160,23,0.1)] border border-[#D4AF37]/20 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden" style={{ animation: 'fadeInUp 0.6s ease-out 0.1s both' }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150"></div>

                <h3 className="flex items-center gap-4 text-xl font-serif text-[neutral-900] mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-[#D4AF37]/30 group-hover:bg-[#D4AF37]/10 transition-colors duration-500 text-[#D4AF37]">
                    <MapPin className="w-5 h-5" aria-hidden="true" />
                  </div>
                  Our Location
                </h3>
                <p className="font-serif text-[neutral-900]/80 text-base leading-relaxed pl-16 w-full relative z-10">
                  Father Masi Street, Holiday Hills, Barangay San Antonio, San Pedro, Philippines, 4023
                </p>
              </div>

              {/* Business Hours Card */}
              <div className="group bg-white/60 backdrop-blur-sm rounded-3xl p-7 shadow-sm hover:shadow-[0_20px_40px_rgba(212,160,23,0.1)] border border-[#D4AF37]/20 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden" style={{ animation: 'fadeInUp 0.6s ease-out 0.2s both' }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150"></div>

                <h3 className="flex items-center gap-4 text-xl font-serif text-[neutral-900] mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-[#D4AF37]/30 group-hover:bg-[#D4AF37]/10 transition-colors duration-500 text-[#D4AF37]">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  Business Hours
                </h3>
                <div className="flex flex-col w-full pl-16 relative z-10">
                  <div className="flex justify-between items-center py-3 border-b border-[#D4AF37]/20 font-serif text-base text-[neutral-900] group-hover:border-[#D4AF37]/40 transition-colors">
                    <span className="font-medium opacity-90">Tuesdays to Saturdays</span>
                    <span className="text-[neutral-900]/80">10:00 AM to 6:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-[#D4AF37]/20 font-serif text-base text-[neutral-900] group-hover:border-[#D4AF37]/40 transition-colors">
                    <span className="font-medium opacity-90">Sundays</span>
                    <span className="text-[neutral-900]/80">2:00 PM to 6:00 PM</span>
                  </div>
                </div>
                <div className="text-left w-full mt-5 pl-16 font-sans tracking-widest uppercase text-[#D4AF37] text-[11px] font-bold">
                  All visits are strictly by appointment only
                </div>
              </div>

              {/* Contact Information Card */}
              <div className="group bg-white/60 backdrop-blur-sm rounded-3xl p-7 shadow-sm hover:shadow-[0_20px_40px_rgba(212,160,23,0.1)] border border-[#D4AF37]/20 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden" style={{ animation: 'fadeInUp 0.6s ease-out 0.3s both' }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150"></div>

                <h3 className="flex items-center gap-4 text-xl font-serif text-[neutral-900] mb-5 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-[#D4AF37]/30 group-hover:bg-[#D4AF37]/10 transition-colors duration-500 text-[#D4AF37]">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  </div>
                  Contact Information
                </h3>
                <div className="flex flex-col gap-5 pl-16 relative z-10">
                  <div className="flex items-center gap-4 group/item cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#D4AF37]/20 flex items-center justify-center group-hover/item:scale-110 group-hover/item:bg-[#D4AF37] group-hover/item:text-white transition-all text-[#D4AF37] shadow-sm">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V8L12 13L20 8V18ZM12 11L4 6H20L12 11Z" />
                      </svg>
                    </div>
                    <a href="mailto:teamzioneventsplace@gmail.com" className="font-serif text-[neutral-900]/90 hover:text-[#D4AF37] transition-colors break-all text-base font-medium">
                      teamzioneventsplace@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-4 group/item cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#D4AF37]/20 flex items-center justify-center group-hover/item:scale-110 group-hover/item:bg-[#D4AF37] group-hover/item:text-white transition-all text-[#D4AF37] shadow-sm">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                      </svg>
                    </div>
                    <a href="tel:09194442327" className="font-serif text-[neutral-900]/90 hover:text-[#D4AF37] transition-colors text-base font-medium">
                      0919 444 2327
                    </a>
                  </div>
                </div>
              </div>

              {/* Social Media Card */}
              <div className="group bg-white/60 backdrop-blur-sm rounded-3xl p-7 shadow-sm hover:shadow-[0_20px_40px_rgba(212,160,23,0.1)] border border-[#D4AF37]/20 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden" style={{ animation: 'fadeInUp 0.6s ease-out 0.4s both' }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-2xl -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150"></div>

                <h3 className="flex items-center gap-4 text-xl font-serif text-[neutral-900] mb-0 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-[#D4AF37]/30 group-hover:bg-[#D4AF37]/10 transition-colors duration-500 text-[#D4AF37]">
                    <Share2 className="w-5 h-5" aria-hidden="true" />
                  </div>
                  Social Media
                </h3>
                <p className="relative z-10 pl-0 sm:pl-16 mb-4 -mt-2 font-serif text-sm leading-relaxed text-neutral-900/65">
                  Follow us for our latest celebrations, venue styling, and event highlights.
                </p>
                <SocialLinks variant="contact" className="relative z-10 pl-0 sm:pl-16" />
              </div>

            </div>

            {/* Right Column: Form */}
            <div className="flex flex-col items-start w-full" style={{ animation: 'fadeInUp 0.6s ease-out 0.5s both' }}>
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#ECDD77] text-white px-4 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase mb-4 shadow-md">
                Message Us
              </span>
              <h2 className="text-4xl md:text-5xl font-serif text-[neutral-900] mb-8">How can we help?</h2>

              <div className="w-full bg-white/60 backdrop-blur-sm rounded-[2rem] p-6 md:p-8 shadow-[0_20px_40px_rgba(212,160,23,0.1)] border border-[#D4AF37]/20 relative overflow-hidden group/form">
                {/* Decorative background element */}
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl transition-transform duration-1000 group-hover/form:scale-150"></div>

                <InquiryForm />
              </div>
            </div>

          </div>

          {/* Bottom Section: Map & Direction */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-stretch mt-8">

            {/* Map */}
            <div className="w-full min-h-[300px] lg:min-h-[400px] rounded-[24px] overflow-hidden shadow-sm border-4 border-white relative z-20">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3864.83416!2d121.0367932!3d14.3530466!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397d72b190b476f%3A0x73af84eaa4dfacb7!2sZion%20Events%20Place!5e0!3m2!1sen!2sph!4v1700000000000!5m2!1sen!2sph"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full object-cover"
              ></iframe>
            </div>

            {/* Direction Card */}
            <div className="bg-white/60 backdrop-blur-sm border border-neutral-900/10 rounded-2xl p-6 shadow-sm h-full flex flex-col justify-center">
              <h3 className="flex items-center text-xl font-serif text-neutral-900 mb-5">
                <a href="https://maps.app.goo.gl/3aBAKMMpWj19gFUK6" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-[#D4AF37] transition-colors group cursor-pointer w-fit">
                  <img src="/direction.png" alt="Direction Icon" className="w-6 h-6 object-contain group-hover:scale-110 transition-transform" />
                  <span className="border-b border-transparent group-hover:border-[#D4AF37] transition-colors pb-0.5">Direction</span>
                </a>
              </h3>
              <ul className="flex flex-col gap-5 font-serif text-neutral-900 text-base leading-relaxed opacity-90 w-full">
                <li className="flex items-start gap-3">
                  <img src="/right-arrow.png" alt="Arrow" className="w-5 h-5 mt-1 flex-shrink-0 object-contain" />
                  <p>When coming from United San Pedro, do not turn right in Iglesia Ni Cristo, go straight ahead.</p>
                </li>
                <li className="flex items-start gap-3">
                  <img src="/right-arrow.png" alt="Arrow" className="w-5 h-5 mt-1 flex-shrink-0 object-contain" />
                  <p>If you&apos;re coming from the San Pedro Exit via Magsaysay Road, once you see the &quot;ZION EVENTS PLACE&quot; signage, turn left. After going down the short slope, turn left again. You&apos;ll find our wooden door entrance just ahead - proceed there to enter the venue.</p>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </PublicSubpageShell>
  );
}
