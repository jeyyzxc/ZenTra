import React from 'react';
import SubpageHero from '../components/SubpageHero';

export default function ContactPage() {
  return (
    <main className="flex flex-col min-h-screen bg-zentra-bg relative">
      <SubpageHero 
        title="Contact Us" 
        subtitle="We'd love to hear from you." 
        imageSrc="https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop" 
      />
      
      <div className="w-full relative z-10 bg-[#FBF4C4] pb-24">
        <div className="max-w-4xl mx-auto px-4 pt-16 text-center">
          <h2 className="text-4xl font-sahitya text-[#3A4B3C] mb-8">Get In Touch</h2>
          <p className="text-xl font-serif text-black leading-relaxed mb-8">
            Have questions about our packages or want to schedule an ocular visit? 
            Reach out to us and our event specialists will gladly assist you.
          </p>
          <div className="flex flex-col items-center gap-4 text-lg font-serif">
            <p><strong>Email:</strong> reservations@zioneventsplace.com</p>
            <p><strong>Phone:</strong> +63 912 345 6789</p>
            <p><strong>Address:</strong> Overlooking Laguna, San Pedro City</p>
          </div>
        </div>
      </div>
    </main>
  );
}
