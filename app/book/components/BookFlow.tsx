"use client";

import React, { useEffect, useRef, useState } from 'react';
import SubpageHero from '@/components/client/SubpageHero';
import { publicPageHeroes } from '@/config/public-page-heroes';
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
  eventCategoryId: string;
  eventCategorySlug: string;
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
    eventCategoryId: '',
    eventCategorySlug: '',
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
  const [validationMessage, setValidationMessage] = useState('');
  const workflowRef = useRef<HTMLDivElement>(null);
  const previousStepRef = useRef(step);

  useEffect(() => {
    if (previousStepRef.current === step) {
      return;
    }

    previousStepRef.current = step;
    const animationFrame = window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      workflowRef.current?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [step]);

  const cancelBooking = () => {
    setFormData({
      eventType: '',
      eventCategoryId: '',
      eventCategorySlug: '',
      date: '',
      theme: '',
      guestCount: '',
      time: '',
      budget: '',
      addOns: [],
      notes: '',
    });
    setValidationMessage('');
    setStep(1);
  };

  const advanceWithValidation = () => {
    const requiredField: Partial<Record<number, keyof BookFormData>> = {
      2: 'date',
      3: 'theme',
      4: 'guestCount',
      5: 'time',
      6: 'budget',
    };
    const field = requiredField[step];

    if (field && !formData[field]) {
      setValidationMessage('Please make a selection before continuing.');
      return;
    }

    setValidationMessage('');
    nextStep();
  };

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
      case 9: return <Step9Review data={formData} nextStep={advanceWithValidation} goToStep={goToStep} />;
      case 10: return <Step10Generating nextStep={nextStep} />;
      case 11: return (
        <Step11Result
          cancelBooking={cancelBooking}
          data={formData}
          goToStep={goToStep}
        />
      );
      default: return null;
    }
  };

  // Special layout for Step 11
  if (step === 11) {
    return (
      <div className="w-full flex flex-col animate-[fadeIn_0.5s_ease-out]">
        <SubpageHero slides={publicPageHeroes.book} />
        <div ref={workflowRef} id="booking-workflow" className="relative z-10 min-h-dvh w-full scroll-mt-4 bg-[#FDFCEE]">
          {renderStep()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {step <= 9 && (
        <SubpageHero slides={publicPageHeroes.book} />
      )}

      <div ref={workflowRef} id="booking-workflow" className="relative z-10 flex min-h-[80dvh] w-full scroll-mt-4 flex-col items-center bg-transparent px-3 pb-10 pt-6 sm:px-4 sm:pb-12 sm:pt-8 md:px-8">

        {/* Header section (except step 10/11) */}
        {step !== 10 && (
          <div className="mx-auto mb-5 max-w-4xl px-2 text-center sm:mb-6 sm:px-4">
            <h2 className="mb-2 text-center font-sahitya text-[clamp(1.85rem,8vw,2.5rem)] leading-tight text-[#2F3E32] sm:mb-3 md:text-5xl">
              {currentHeader?.title}
            </h2>
            {currentHeader?.subtitle && (
              <p className="mx-auto text-center font-sans text-sm font-medium tracking-wide text-[#3A4B3C] sm:text-base md:text-lg">
                {currentHeader.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Progress Bar with Stations and Carpet Effect (only steps 1-9) */}
        {step <= 9 && (
          <div className="mx-auto mb-7 mt-3 w-full max-w-4xl px-1 sm:mb-10 sm:mt-4 sm:px-6" data-motion="decorative">
            <div className="relative flex items-center">

              {/* Background Track */}
              <div className="absolute left-[16px] right-[16px] h-3 bg-[#EAE6D1] border border-[#2F3E32]/10 shadow-inner rounded-full" />

              {/* The "Carpet" Rolling Out */}
              <div
                className="absolute left-[16px] h-3 rounded-full transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_2px_15px_rgba(139,0,0,0.5)] z-0"
                style={{
                  width: `calc(${((step - 1) / 8) * 100}% - ${((step - 1) / 8) * 32}px)`,
                  // Luxurious red carpet with golden trims
                  background: 'repeating-linear-gradient(45deg, #9b111e 0px, #9b111e 10px, #8a0f1b 10px, #8a0f1b 20px)',
                  borderTop: '1px solid #D4A017',
                  borderBottom: '1px solid #D4A017'
                }}
              />

              {/* Shimmer on Carpet */}
              <div
                className="absolute left-[16px] h-3 overflow-hidden rounded-full pointer-events-none z-0"
                style={{ width: `calc(${((step - 1) / 8) * 100}% - ${((step - 1) / 8) * 32}px)` }}
              >
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-[200%] h-full"
                  style={{ animation: 'carpetShimmer 2.5s infinite linear' }}
                />
              </div>

              {/* Embedded animation for shimmer */}
              <style>{`
                @keyframes carpetShimmer {
                  0% { transform: translateX(-100%); }
                  100% { transform: translateX(50%); }
                }
              `}</style>

              {/* Stations */}
              <div className="relative w-full flex justify-between z-10">
                {Array.from({ length: 9 }).map((_, i) => {
                  const stationStep = i + 1;
                  const isPassed = step > stationStep;
                  const isCurrent = step === stationStep;

                  return (
                    <div key={stationStep} className="flex flex-col items-center">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-500 ease-out sm:h-8 sm:w-8 sm:border-[3px] ${
                          isCurrent
                            ? 'bg-[#FDFCEE] border-[#D4A017] shadow-[0_0_20px_rgba(212,160,23,0.6)] scale-[1.3] ring-4 ring-[#D4A017]/20'
                            : isPassed
                              ? 'bg-[#9b111e] border-[#D4A017]'
                              : 'bg-[#F9F8F1] border-[#D2CB96]/60'
                        }`}
                      >
                        {isPassed ? (
                          <svg className="w-4 h-4 text-[#D4A017]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <span className={`text-[11px] font-bold ${isCurrent ? 'text-[#8a0f1b]' : 'text-gray-400'}`}>
                            {stationStep}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className={`mb-4 flex w-full flex-grow flex-col justify-center ${step === 1 ? 'max-w-[95%]' : 'max-w-5xl'}`}>
          {renderStep()}
        </div>

        {/* Navigation Buttons (only steps 1-9) */}
        {step > 1 && step <= 9 && (
          <div className="mt-2 flex flex-col items-center gap-3 sm:gap-4">
            {validationMessage && (
              <p className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
                {validationMessage}
              </p>
            )}
            <div className="flex justify-center gap-5 sm:gap-8">
              {/* Back Button */}
              <button
                aria-label="Previous step"
                onClick={prevStep}
                className="touch-target flex h-12 w-12 items-center justify-center rounded-full border-2 border-black transition-all hover:bg-black/5 sm:h-16 sm:w-16 sm:border-[3px] sm:hover:scale-105"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="h-6 w-6 sm:h-8 sm:w-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Next Button */}
              {step < 9 && (
                <button
                  onClick={advanceWithValidation}
                  aria-label="Next step"
                  className="touch-target flex h-12 w-12 items-center justify-center rounded-full border-2 border-black transition-all hover:bg-black/5 sm:h-16 sm:w-16 sm:border-[3px] sm:hover:scale-105"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="h-6 w-6 sm:h-8 sm:w-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={cancelBooking}
              className="text-sm font-bold uppercase tracking-[0.16em] text-[#3A4B3C]/60 underline-offset-4 hover:text-[#1a1f18] hover:underline"
            >
              Cancel booking
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
