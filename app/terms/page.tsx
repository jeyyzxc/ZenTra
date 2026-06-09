import React from 'react';
import SubpageHero from '../components/SubpageHero';

export default function TermsPage() {
  return (
    <main className="flex flex-col min-h-screen bg-zentra-bg relative">
      <SubpageHero 
        title="Terms of Service" 
        subtitle="Please read these terms carefully." 
        imageSrc="https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop" 
      />
      
      <div className="w-full relative z-10 bg-[#FBF4C4] pb-24">
        <div className="max-w-4xl mx-auto px-4 pt-16">
          <div className="prose prose-lg font-serif text-black max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            <h2>2. Reservation Policies</h2>
            <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            <h2>3. Cancellations & Refunds</h2>
            <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
