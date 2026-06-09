import React from 'react';
import SubpageHero from '../components/SubpageHero';
import TestimonialSection from '../components/TestimonialSection';

export default function AboutPage() {
  return (
    <main className="flex flex-col min-h-screen bg-zentra-bg relative">
      <SubpageHero 
        title="The Experience" 
        subtitle="Experience the art of effortless celebration. We combine premium spaces with meticulous management to deliver a flawless experience." 
        imageSrc="https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop" 
      />
      
      <div className="w-full relative z-10 bg-[#FBF4C4] pb-20">
        
        {/* Story Section */}
        <div className="max-w-7xl mx-auto px-4 md:px-12 py-20 flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1">
            <h3 className="font-serif text-sm tracking-widest text-[#3A4B3C] uppercase mb-4">OUR JOURNEY</h3>
            <h2 className="text-4xl md:text-5xl font-sahitya text-[#3A4B3C] mb-8">The Zion Events<br/>Place Story</h2>
            <p className="font-serif text-lg text-black leading-relaxed mb-8">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <button className="px-8 py-3 bg-[#DDD181] hover:bg-[#D2CB96] text-black font-serif rounded-full transition-all shadow-sm">
              Book Now
            </button>
          </div>
          <div className="flex-1 flex flex-col gap-4">
            <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop" alt="Event setup" className="w-full h-64 object-cover" />
            <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop" alt="Altar setup" className="w-full h-64 object-cover" />
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-7xl mx-auto px-4 md:px-12 pb-20 flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div className="bg-[#EAE6D1] rounded-2xl p-8 flex flex-col items-center justify-center text-center">
              <span className="text-5xl font-segoe text-[#C5B87D] mb-2">12+</span>
              <span className="text-xs font-serif uppercase tracking-wider">YEARS OF EXCELLENCE</span>
            </div>
            <div className="bg-[#EAE6D1] rounded-2xl p-8 flex flex-col items-center justify-center text-center">
              <span className="text-5xl font-segoe text-[#C5B87D] mb-2">100+</span>
              <span className="text-xs font-serif uppercase tracking-wider">HAPPY CUSTOMERS</span>
            </div>
            <div className="bg-[#EAE6D1] rounded-2xl p-8 flex flex-col items-center justify-center text-center">
              <span className="text-5xl font-segoe text-[#C5B87D] mb-2">70+</span>
              <span className="text-xs font-serif uppercase tracking-wider">EVENTS ORGANIZED</span>
            </div>
            <div className="bg-[#EAE6D1] rounded-2xl p-8 flex flex-col items-center justify-center text-center">
              <span className="text-5xl font-segoe text-[#C5B87D] mb-2">98%</span>
              <span className="text-xs font-serif uppercase tracking-wider">SATISFACTION</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="font-serif text-xl text-black leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </p>
          </div>
        </div>

        {/* Full width image banner */}
        <div className="w-full h-[400px]">
          <img src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop" alt="Full width banner" className="w-full h-full object-cover" />
        </div>

        {/* Founders */}
        <div className="max-w-7xl mx-auto px-4 md:px-12 py-20 flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1">
            <img src="https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2070&auto=format&fit=crop" alt="Founders" className="w-full h-[600px] object-cover" />
          </div>
          <div className="flex-1">
            <h2 className="text-5xl md:text-6xl font-segoe text-[#3A4B3C] mb-8 uppercase text-right">OUR<br/>FOUNDERS</h2>
            <p className="font-serif text-lg text-black leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          </div>
        </div>

        {/* Advantages */}
        <div className="max-w-7xl mx-auto px-4 md:px-12 py-20 flex flex-col items-center">
          <h3 className="font-serif text-sm tracking-widest text-[#3A4B3C] uppercase mb-4 bg-[#DDD181] px-4 py-1 rounded-full">OUR ADVANTAGES</h3>
          <h2 className="text-4xl md:text-5xl font-sahitya text-[#3A4B3C] mb-12">Why Choose Zion?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <div className="bg-[#EAE6D1] rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500 rounded-full mb-4"></div>
              <h4 className="font-serif text-xl mb-2">Premium Venue</h4>
              <p className="font-serif text-sm opacity-70">Meticulously designed interiors featuring elegant finishes and adaptable layouts for any occasion.</p>
            </div>
            <div className="bg-[#EAE6D1] rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full mb-4"></div>
              <h4 className="font-serif text-xl mb-2">Sustainable Celebrations</h4>
              <p className="font-serif text-sm opacity-70">Partnering with eco-conscious caterers and local suppliers to minimize our environmental footprint.</p>
            </div>
            <div className="bg-[#EAE6D1] rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full mb-4"></div>
              <h4 className="font-serif text-xl mb-2">Seamless Planning</h4>
              <p className="font-serif text-sm opacity-70">Comprehensive event packages and coordination assistance to ensure a stress-free experience.</p>
            </div>
            <div className="bg-[#EAE6D1] rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-yellow-500 rounded-full mb-4"></div>
              <h4 className="font-serif text-xl mb-2">Award-Winning Aesthetic</h4>
              <p className="font-serif text-sm opacity-70">A stunning architectural backdrop recognized for its unique blend of modern style and comfort.</p>
            </div>
            <div className="bg-[#EAE6D1] rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-pink-500 rounded-full mb-4"></div>
              <h4 className="font-serif text-xl mb-2">Satisfaction Guarantee</h4>
              <p className="font-serif text-sm opacity-70">Our commitment to excellence ensures your event runs smoothly, backed by a dedicated service pledge.</p>
            </div>
            <div className="bg-[#EAE6D1] rounded-2xl p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full mb-4"></div>
              <h4 className="font-serif text-xl mb-2">Expert Coordination 24/7</h4>
              <p className="font-serif text-sm opacity-70">Our dedicated team of event specialists is always available to assist with your planning needs.</p>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="w-full bg-[#EAE6D1] py-16">
          <TestimonialSection />
        </div>

        {/* CTA */}
        <div className="max-w-4xl mx-auto px-4 py-24 flex flex-col items-center text-center">
          <h2 className="text-4xl md:text-5xl font-sahitya text-[#3A4B3C] mb-6">Ready to Bring Your Vision to Life?</h2>
          <p className="font-serif text-xl text-black mb-10">Discover a beautiful setting where your special moments become lasting memories.</p>
          <button className="px-10 py-4 bg-[#B8B17A] hover:bg-[#A39D63] text-black font-segoe text-xl uppercase tracking-widest rounded-full transition-all shadow-md">
            BOOK NOW
          </button>
        </div>

      </div>
    </main>
  );
}
