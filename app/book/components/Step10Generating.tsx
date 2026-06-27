import React, { useEffect, useState } from 'react';

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
    <div className="w-full max-w-2xl mx-auto px-4 py-16 flex flex-col items-center relative z-10">
      
      {/* Dynamic luxury spinner or check */}
      <div className="mb-16 relative w-36 h-36 flex items-center justify-center">
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
              <img src="/zion-logo.png" alt="Zion" className="w-12 h-12 object-contain opacity-80 animate-pulse drop-shadow-md" />
            </div>

            {/* Background Glow */}
            <div className="absolute inset-0 bg-[#ECDD77] opacity-10 blur-2xl rounded-full animate-pulse" />
          </>
        )}
      </div>

      {/* Aligned List Container */}
      <div className="w-full max-w-sm mx-auto flex flex-col gap-8">
        {loadingSteps.map((step, index) => {
          const isDone = index < currentTaskIndex;
          const isActive = index === currentTaskIndex;
          const isPending = index > currentTaskIndex;

          return (
            <div 
              key={index} 
              className={`flex items-center gap-6 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] text-left ${
                isPending ? 'opacity-30 translate-x-8 scale-95' : 'opacity-100 translate-x-0 scale-100'
              } ${isActive ? 'scale-105' : ''}`}
            >
              {/* Status Circle */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 shadow-sm relative ${
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
              <span className={`font-serif text-2xl transition-all duration-500 ${
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
