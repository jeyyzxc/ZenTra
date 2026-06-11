import React from 'react';
import SubpageHero from '../components/SubpageHero';

export default function RulesPage() {
  return (
    <main className="flex flex-col min-h-screen bg-zentra-bg relative">
      <SubpageHero 
        title="Rules & Regulation" 
        subtitle="Guidelines for a seamless event experience." 
        imageSrc="https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop" 
      />
      
      <div className="w-full relative z-10 bg-[#FBF4C4] pb-24">
        <div className="max-w-5xl mx-auto px-6 pt-20">
          <div className="font-serif text-black">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 mt-10 tracking-wide">1. Venue Guidelines</h2>
            <p className="text-lg md:text-xl lg:text-2xl leading-relaxed mb-8 opacity-90">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 mt-10 tracking-wide">2. Vendor Setup</h2>
            <p className="text-lg md:text-xl lg:text-2xl leading-relaxed mb-8 opacity-90">Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 mt-10 tracking-wide">3. Noise & Curfew</h2>
            <p className="text-lg md:text-xl lg:text-2xl leading-relaxed mb-8 opacity-90">Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
