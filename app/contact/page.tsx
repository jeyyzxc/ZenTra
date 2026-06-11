import React from 'react';
import SubpageHero from '../components/SubpageHero';

export default function ContactPage() {
  return (
    <main className="flex flex-col min-h-screen bg-gradient-to-br from-[#DCD48E]/60 via-[#FBF4C4] to-white relative">
      <SubpageHero 
        title="Get in Touch" 
        subtitle="Seamless events start here. Reach out to secure your date or inquire about our exclusive packages." 
        imageSrc="https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop" 
      />
      
      <div className="w-full relative z-10 bg-transparent pt-12 pb-20">
        <div className="max-w-6xl mx-auto px-6">
          
          {/* Top Section: Info Cards and Form */}
          <div className="grid grid-cols-1 lg:grid-cols-[55%_1fr] gap-8 lg:gap-12 mb-16 items-start">
            
            {/* Left Column: Cards */}
            <div className="flex flex-col gap-4">
              
              {/* Location Card */}
              <div className="bg-[#EBE5C4] rounded-2xl p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-lg font-serif text-black mb-3">
                  <img src="/placeholder (1).png" alt="Location Icon" className="w-5 h-5 object-contain" />
                  Our Location
                </h3>
                <p className="font-serif text-black text-sm leading-relaxed pl-6 opacity-90 w-full">
                  Father Masi Street, Holiday Hills,<br />
                  Barangay San Antonio, San Pedro,<br />
                  Philippines, 4023
                </p>
              </div>

              {/* Business Hours Card */}
              <div className="bg-[#EBE5C4] rounded-2xl p-6 shadow-sm flex flex-col">
                <h3 className="flex items-center gap-2 text-lg font-serif text-black mb-3">
                  <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  Business Hours
                </h3>
                <div className="flex flex-col gap-0 w-full px-2 opacity-90">
                  <div className="flex justify-between items-center py-2 border-b border-black/20 font-serif text-sm text-black">
                    <span>Tuesdays to Saturdays</span>
                    <span>10:00 AM to 6:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-black/20 font-serif text-sm text-black">
                    <span>Sundays</span>
                    <span>2:00 PM to 6:00 PM</span>
                  </div>
                </div>
                <div className="text-center w-full mt-3 font-serif text-black text-xs opacity-70">
                  All visits are strictly by appointment only.
                </div>
              </div>

              {/* Combined Contact Methods */}
              <div className="bg-[#EBE5C4] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-around text-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V8L12 13L20 8V18ZM12 11L4 6H20L12 11Z"/>
                  </svg>
                  <h4 className="font-serif text-lg text-black">Email Us</h4>
                  <a href="mailto:teamzioneventsplace@gmail.com" className="font-serif text-black border-b border-black/30 pb-0.5 hover:border-black transition-colors break-all text-xs opacity-90">
                    teamzioneventsplace@gmail.com
                  </a>
                </div>
                
                {/* Divider for desktop view */}
                <div className="hidden sm:block h-16 w-[1px] bg-black/10"></div>
                
                <div className="flex flex-col items-center gap-2">
                  <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                  <h4 className="font-serif text-lg text-black">Call Us</h4>
                  <a href="tel:09194442327" className="font-serif text-black border-b border-black/30 pb-0.5 hover:border-black transition-colors text-sm opacity-90">
                    0919 444 2327
                  </a>
                </div>
              </div>

              {/* Social Media Card */}
              <div className="bg-[#EBE5C4] rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center gap-4">
                <h3 className="font-serif text-lg text-black">Visit Us on our Social Medias</h3>
                <div className="flex gap-8 items-center">
                  <a href="#" className="hover:-translate-y-1 transform duration-300">
                    <img src="/communication.png" alt="Facebook" className="w-8 h-8 object-contain transition-transform" />
                  </a>
                  <a href="#" className="hover:-translate-y-1 transform duration-300">
                    <img src="/instagram.png" alt="Instagram" className="w-8 h-8 object-contain transition-transform" />
                  </a>
                  <a href="#" className="hover:-translate-y-1 transform duration-300">
                    <img src="/tik-tok.png" alt="TikTok" className="w-8 h-8 object-contain transition-transform" />
                  </a>
                </div>
              </div>

            </div>

            {/* Right Column: Form */}
            <div className="flex flex-col items-start w-full">
              <span className="bg-[#DCD48E] text-[#3A4B3C] px-3 py-1 rounded-full text-[11px] font-semibold tracking-widest uppercase mb-3 shadow-sm">
                Message Us
              </span>
              <h2 className="text-3xl md:text-4xl font-serif text-[#3A4B3C] mb-6">How can we help?</h2>
              
              <div className="w-full bg-[#E5DFB3] rounded-[24px] p-6 md:p-8 shadow-sm">
                <form className="flex flex-col gap-4 w-full">
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    className="w-full bg-[#F5F2DE] rounded-full px-5 py-3 text-sm font-serif text-[#3A4B3C] placeholder:text-[#8D886F] outline-none focus:ring-1 focus:ring-[#D4AF37] transition-shadow shadow-sm"
                  />
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    className="w-full bg-[#F5F2DE] rounded-full px-5 py-3 text-sm font-serif text-[#3A4B3C] placeholder:text-[#8D886F] outline-none focus:ring-1 focus:ring-[#D4AF37] transition-shadow shadow-sm"
                  />
                  <input 
                    type="tel" 
                    placeholder="Phone Number" 
                    className="w-full bg-[#F5F2DE] rounded-full px-5 py-3 text-sm font-serif text-[#3A4B3C] placeholder:text-[#8D886F] outline-none focus:ring-1 focus:ring-[#D4AF37] transition-shadow shadow-sm"
                  />
                  <input 
                    type="text" 
                    placeholder="Subject" 
                    className="w-full bg-[#F5F2DE] rounded-full px-5 py-3 text-sm font-serif text-[#3A4B3C] placeholder:text-[#8D886F] outline-none focus:ring-1 focus:ring-[#D4AF37] transition-shadow shadow-sm"
                  />
                  <textarea 
                    placeholder="Message" 
                    className="w-full bg-[#F5F2DE] rounded-2xl px-5 py-4 text-sm font-serif text-[#3A4B3C] placeholder:text-[#8D886F] outline-none focus:ring-1 focus:ring-[#D4AF37] transition-shadow min-h-[140px] resize-none shadow-sm"
                  ></textarea>
                  
                  <button 
                    type="button" 
                    className="mt-2 w-fit border-[1.5px] border-[#3A4B3C] rounded-full px-6 py-2.5 flex items-center justify-center gap-2 bg-transparent text-[#3A4B3C] hover:bg-[#DFD48A] hover:border-[#DFD48A] hover:text-[#3A4B3C] hover:shadow-[0_0_15px_rgba(223,212,138,0.4)] transition-all duration-300 group"
                  >
                    <span className="text-base font-serif group-hover:text-[#3A4B3C] transition-colors">Send Message</span>
                    <img src="/send.png" alt="Send" className="w-5 h-5 object-contain group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
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
            <div className="bg-[#EBE5C4] rounded-2xl p-6 shadow-sm h-full flex flex-col justify-center">
              <h3 className="flex items-center text-xl font-serif text-black mb-5">
                <a href="https://maps.app.goo.gl/3aBAKMMpWj19gFUK6" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-[#D4AF37] transition-colors group cursor-pointer w-fit">
                  <img src="/direction.png" alt="Direction Icon" className="w-6 h-6 object-contain group-hover:scale-110 transition-transform" />
                  <span className="border-b border-transparent group-hover:border-[#D4AF37] transition-colors pb-0.5">Direction</span>
                </a>
              </h3>
              <ul className="flex flex-col gap-5 font-serif text-black text-base leading-relaxed opacity-90 w-full">
                <li className="flex items-start gap-3">
                  <img src="/right-arrow.png" alt="Arrow" className="w-5 h-5 mt-1 flex-shrink-0 object-contain" />
                  <p>When coming from United San Pedro, Do not turn right in Iglesia Ni Cristo, go straight ahead.</p>
                </li>
                <li className="flex items-start gap-3">
                  <img src="/right-arrow.png" alt="Arrow" className="w-5 h-5 mt-1 flex-shrink-0 object-contain" />
                  <p>If you're coming from the San Pedro Exit via Magsaysay Road, once you see the "ZION EVENTS PLACE" signage, turn left. After going down the short slope, turn left again. You'll find our wooden door entrance just ahead — proceed there to enter the venue.</p>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
