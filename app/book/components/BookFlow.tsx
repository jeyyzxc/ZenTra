"use client";

import React, { useState } from 'react';
import SubpageHero from '../../components/SubpageHero';
import Step1EventType from './Step1EventType';
import Step2Date from './Step2Date'; 
import Step3Theme from './Step3Theme';
import Step4Guests from './Step4Guests';
import Step5Time from './Step5Time';
import Step6Budget from './Step6Budget';
import Step7AddOns from './Step7AddOns';
import Step8Notes from './Step8Notes';
import Step9Review from './Step9Review';
import Step10Generating from './Step10Generating';
import Step11Result from './Step11Result';

export type BookFormData = {
  eventType: string;
  date: string;
  theme: string;
  guestCount: string;
  time: string;
  budget: string;
  addOns: string[];
  notes: string;
};

export default function BookFlow() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<BookFormData>({
    eventType: '',
    date: '',
    theme: '',
    guestCount: '',
    time: '',
    budget: '',
    addOns: [],
    notes: ''
  });

  const updateData = (fields: Partial<BookFormData>) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 11));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
  const goToStep = (s: number) => setStep(s);

  // Constants for design
  const totalSteps = 9; // Not counting generating/result for the progress bar
  
  // Custom headers per step
  const stepHeaders: Record<number, { title: string; subtitle: string }> = {
    1: { title: "What are we celebrating?", subtitle: "Tell us what we're celebrating." },
    2: { title: "When is your 'Special Day'?", subtitle: "Secure your spot on the calendar." },
    3: { title: "What is the 'vibe' or theme of your event?", subtitle: "Define the look and feel" },
    4: { title: "Estimated Guest Count", subtitle: "Let's prepare for your crowd." },
    5: { title: "Preferred Time of Celebration", subtitle: "Pick your preferred event hours." },
    6: { title: "Estimated Budget Range", subtitle: "We'll find your best value." },
    7: { title: "The Finishing Touches", subtitle: "Elevate your celebration with our curated luxuries." },
    8: { title: "The Finer Details", subtitle: "Tell us the specifics that matter most to you." },
    9: { title: "Your Event Summary", subtitle: "Review the details of your event below. Make sure everything looks correct before generating your final preview." },
    10: { title: "Harmonizing Your Vision", subtitle: "" }, // Special screen
    11: { title: "The Signature Narrative", subtitle: "" }, // Special screen
  };

  const currentHeader = stepHeaders[step];

  // Render current step component
  const renderStep = () => {
    switch (step) {
      case 1: return <Step1EventType data={formData} updateData={updateData} nextStep={nextStep} />;
      case 2: return <Step2Date data={formData} updateData={updateData} />;
      case 3: return <Step3Theme data={formData} updateData={updateData} />;
      case 4: return <Step4Guests data={formData} updateData={updateData} />;
      case 5: return <Step5Time data={formData} updateData={updateData} />;
      case 6: return <Step6Budget data={formData} updateData={updateData} />;
      case 7: return <Step7AddOns data={formData} updateData={updateData} />;
      case 8: return <Step8Notes data={formData} updateData={updateData} />;
      case 9: return <Step9Review data={formData} nextStep={nextStep} goToStep={goToStep} />;
      case 10: return <Step10Generating nextStep={nextStep} />;
      case 11: return <Step11Result data={formData} goToStep={goToStep} />;
      default: return null;
    }
  };

  // Special layout for Step 11
  if (step === 11) {
    return (
      <div className="w-full flex flex-col animate-[fadeIn_0.5s_ease-out]">
        <SubpageHero 
          title="Craft Your Legacy at Zion"
          subtitle="Every great event starts with a plan. Share your details with us, and our team will review your preferences to ensure every moment at Zion is perfectly captured."
          imageSrc="https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop"
        />
        <div className="w-full relative z-10 bg-[#FDFCEE] min-h-screen">
           {renderStep()}
        </div>
      </div>
    );
  }

  // Calculate progress bar width (Steps 1-9)
  const progressPercent = step <= 9 ? (step / totalSteps) * 100 : 100;

  return (
    <div className="flex flex-col w-full">
      {step <= 9 && (
        <SubpageHero 
          title="Craft Your Legacy at Zion"
          subtitle="Every great event starts with a plan. Share your details with us, and our team will review your preferences to ensure every moment at Zion is perfectly captured."
          imageSrc="https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop"
        />
      )}
      
      <div className="w-full relative z-10 bg-[#EAE5C3] min-h-[80vh] flex flex-col items-center pt-16 pb-24 px-4 md:px-8">
        
        {/* Header section (except step 10/11) */}
        {step !== 10 && (
          <div className="text-center mb-10 max-w-4xl mx-auto px-4">
            <h2 className="font-serif text-4xl md:text-5xl text-[#2F3E32] mb-4 md:whitespace-nowrap">
              {currentHeader?.title}
            </h2>
            {currentHeader?.subtitle && (
              <p className="font-serif text-xl text-[#3A4B3C]">
                {currentHeader.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Progress Bar (only steps 1-9) */}
        {step <= 9 && (
          <div className="w-full max-w-2xl h-2.5 bg-[#D2CB96]/40 rounded-full mb-16 overflow-hidden flex shadow-inner relative">
            {/* Embedded style for flowing shimmer animation */}
            <style>{`
              @keyframes shimmerFlow {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
              }
            `}</style>
            
            <div 
              className="h-full bg-gradient-to-r from-[#978D52] via-[#C5BC47] to-[#D4A017] rounded-full transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative overflow-hidden shadow-[0_0_15px_rgba(212,160,23,0.5)]"
              style={{ width: `${progressPercent}%` }}
            >
              {/* Flowing shine element */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent w-[150%] h-full"
                style={{ animation: 'shimmerFlow 2s infinite linear' }}
              />
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="w-full max-w-5xl flex-grow flex flex-col justify-center mb-16">
          {renderStep()}
        </div>

        {/* Navigation Buttons (only steps 1-9) */}
        {step > 1 && step <= 9 && (
          <div className="flex gap-8 justify-center mt-auto pt-8">
            {/* Back Button */}
            <button 
              onClick={prevStep}
              className="w-16 h-16 rounded-full border-[3px] border-black flex items-center justify-center transition-all hover:bg-black/5 hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Next Button */}
            {step < 9 && (
              <button 
                onClick={nextStep}
                className="w-16 h-16 rounded-full border-[3px] border-black flex items-center justify-center transition-all hover:bg-black/5 hover:scale-105"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
