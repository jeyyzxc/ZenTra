import React, { useEffect, useState } from 'react';
import Image from 'next/image';

interface Props {
  nextStep: () => void;
}

const loadingSteps = [
  "Scanning preferences...",
  "Calculating estimations...",
  "Reviewing details...",
  "Drafting final plan..."
];

export default function Step10Generating({ nextStep }: Props) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Sequentially advance through tasks
    if (currentTaskIndex < loadingSteps.length) {
      const timer = setTimeout(() => {
        setCurrentTaskIndex(prev => prev + 1);
      }, 1200); // 1.2s per task
      return () => clearTimeout(timer);
    } else {
      // All tasks complete, show final state briefly then proceed
      const completeTimer = setTimeout(() => {
        setIsComplete(true);
      }, 0);
      const nextTimer = setTimeout(() => {
        nextStep();
      }, 1500);
      return () => {
        clearTimeout(completeTimer);
        clearTimeout(nextTimer);
      };
    }
  }, [currentTaskIndex, nextStep]);

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center px-3 py-10 sm:px-4 sm:py-16" data-motion="decorative">
      
      {/* Dynamic luxury spinner or check */}
      <div className="relative mb-10 flex h-28 w-28 items-center justify-center sm:mb-16 sm:h-36 sm:w-36">
        {isComplete ? (
           <div className="w-full h-full bg-gradient-to-br from-[#ECDD77] to-[#D4A017] rounded-full flex items-center justify-center shadow-[0_20px_40px_rgba(212,160,23,0.4)] transform transition-transform animate-[scaleIn_0.5s_ease-out]">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-[#1a1f18]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
             </svg>
           </div>
        ) : (
          <>
            {/* Outer glowing rings */}
            <div className="absolute inset-0 border-[3px] border-[#D4A017]/20 rounded-full"></div>
            <div className="absolute inset-0 border-[3px] border-t-[#D4A017] border-r-[#ECDD77] border-b-transparent border-l-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-3 border-[3px] border-b-[#2c3328] border-l-[#1a1f18] border-t-transparent border-r-transparent rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
            
            {/* Center Icon */}
            <div className="absolute z-10">
              <Image src="/zion-logo.png" alt="Zion" width={48} height={48} className="h-12 w-12 animate-pulse object-contain opacity-80 drop-shadow-md" />
            </div>

            {/* Background Glow */}
            <div className="absolute inset-0 bg-[#ECDD77] opacity-10 blur-2xl rounded-full animate-pulse" />
          </>
        )}
      </div>

      {/* Aligned List Container */}
      <div className="mx-auto flex w-full max-w-sm flex-col gap-5 sm:gap-8">
        {loadingSteps.map((step, index) => {
          const isDone = index < currentTaskIndex;
          const isActive = index === currentTaskIndex;
          const isPending = index > currentTaskIndex;

          return (
            <div 
              key={index} 
              className={`flex items-center gap-4 text-left transition-all duration-500 ease-out sm:gap-6 sm:duration-700 sm:ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                isPending ? 'translate-x-3 scale-[0.98] opacity-30 sm:translate-x-8 sm:scale-95' : 'translate-x-0 scale-100 opacity-100'
              } ${isActive ? 'sm:scale-105' : ''}`}
            >
              {/* Status Circle */}
              <div className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full shadow-sm transition-all duration-500 sm:h-12 sm:w-12 ${
                isDone ? 'bg-gradient-to-br from-[#ECDD77] to-[#D4A017] text-[#1a1f18] shadow-[0_0_20px_rgba(212,160,23,0.3)]' : 
                isActive ? 'bg-gradient-to-br from-[#2c3328] to-[#1a1f18] text-white shadow-[0_10px_25px_rgba(44,51,40,0.4)] ring-2 ring-[#D4A017] ring-offset-4 ring-offset-[#EAE5C3]' : 
                'bg-white/50 backdrop-blur-sm border border-[#D2CB96]/60 text-transparent'
              }`}>
                {isDone && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 animate-[scaleIn_0.3s_ease-out]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {isActive && (
                  <div className="w-3 h-3 bg-[#ECDD77] rounded-full animate-ping"></div>
                )}
              </div>

              {/* Step Text */}
              <span className={`min-w-0 font-serif text-xl leading-tight transition-all duration-500 sm:text-2xl ${
                isDone ? 'text-[#3A4B3C] drop-shadow-sm' : 
                isActive ? 'text-[#D4A017] font-semibold tracking-wide drop-shadow-md' : 
                'text-[#3A4B3C]/50'
              }`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
}
