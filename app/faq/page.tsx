"use client";

import React, { useState } from 'react';
import SubpageHero from '../components/SubpageHero';

export default function FAQPage() {
  const allFaqs = [
    "Is the venue fully air-conditioned?",
    "Do you provide a generator in case of power outages?",
    "Do you provide parking for guests?",
    "Is there a dedicated room for the celebrant or bride?",
    "What is the maximum guest capacity of Zion Events Place?",
    "How do I check if my preferred date is available?",
    "Do you have an \"Open Vendor\" policy?",
    "Can we hold a Christian ceremony or a Christening on-site?"
  ];

  const [search, setSearch] = useState("");

  const faqs = allFaqs.filter(faq => faq.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="flex flex-col min-h-screen bg-zentra-bg relative">
      <SubpageHero 
        title="Get Help" 
        subtitle="Your peace of mind is our priority. Find everything you need to know about our venue, from logistics to tiny details, all in one place." 
        imageSrc="https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop" 
      />
      
      <div className="w-full relative z-10 bg-[#FBF4C4] pb-24">
        <div className="max-w-4xl mx-auto px-4 pt-16 flex flex-col items-center">
          <h2 className="text-4xl md:text-5xl font-sahitya text-[#3A4B3C] italic mb-10">
            Frequently Asked Questions
          </h2>
          
          <div className="w-full max-w-2xl bg-[#EAE6D1] rounded-full flex items-center px-6 py-3 mb-12 shadow-sm">
            <input 
              type="text" 
              placeholder="Looking for something?" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none flex-1 text-lg font-serif text-[#3A4B3C] placeholder:text-[#3A4B3C]/60"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#3A4B3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="w-full max-w-3xl flex flex-col gap-6">
            {faqs.map((faq, index) => (
              <div key={index} className="w-full bg-[#DDD181] rounded-[2rem] px-8 py-5 flex justify-between items-center cursor-pointer hover:bg-[#D2CB96] transition-colors shadow-sm group">
                <h3 className="text-xl md:text-2xl font-serif text-black">{faq}</h3>
                <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-black flex items-center justify-center transition-transform group-hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            ))}
            
            {faqs.length === 0 && (
              <p className="text-center font-serif text-lg text-black/60 mt-8">No results found for "{search}"</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
