import React from 'react';
import { BookFormData } from './BookFlow';

interface Props {
  data: BookFormData;
  updateData: (fields: Partial<BookFormData>) => void;
}

const guestOptions = [
  { 
    id: '30-50', 
    title: 'Intimate Gathering',
    desc: 'Perfect for close friends and family'
  },
  { 
    id: '50-75', 
    title: 'Classic Celebration',
    desc: 'A beautiful medium-sized event'
  },
  { 
    id: '75-100', 
    title: 'Grand Affair',
    desc: 'A large, vibrant gathering'
  },
  { 
    id: '100+', 
    title: 'Spectacular Event',
    desc: 'Our maximum capacity'
  },
];

export default function Step4Guests({ data, updateData }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 w-full max-w-6xl mx-auto px-4">
      {guestOptions.map((option) => {
        const isSelected = data.guestCount === option.id;
        
        return (
          <div 
            key={option.id}
            onClick={() => updateData({ guestCount: option.id })}
            className={`relative rounded-[2rem] flex flex-col items-center justify-center p-10 cursor-pointer transition-all duration-500 transform group overflow-hidden ${
              isSelected 
                ? 'bg-gradient-to-br from-[#2c3328] to-[#1a1f18] scale-105 shadow-[0_20px_40px_rgba(44,51,40,0.4)] ring-2 ring-[#D4A017] ring-offset-4 ring-offset-[#EAE5C3]' 
                : 'bg-white/70 backdrop-blur-md border border-[#D2CB96]/40 hover:bg-white hover:scale-105 hover:shadow-[0_15px_35px_rgba(151,141,82,0.15)] hover:border-[#D4A017]/60'
            }`}
          >
            {/* Elegant Icon Container */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors duration-500 ${
              isSelected ? 'bg-gradient-to-br from-[#ECDD77] to-[#D4A017] shadow-[0_0_20px_rgba(212,160,23,0.3)]' : 'bg-[#F5F1DA] group-hover:bg-[#FBF4C4]'
            }`}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={1.5} 
                stroke="currentColor" 
                className={`w-8 h-8 transition-colors duration-500 ${isSelected ? 'text-[#1a1f18]' : 'text-[#978D52] group-hover:text-[#D4A017]'}`}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>

            <h3 className={`text-4xl md:text-5xl font-serif mb-4 transition-colors duration-500 ${
              isSelected ? 'text-[#ECDD77]' : 'text-[#2c3328]'
            }`}>
              {option.id}
            </h3>
            
            <h4 className={`text-sm font-sans uppercase tracking-[0.2em] font-bold text-center mb-2 transition-colors duration-500 ${
              isSelected ? 'text-white' : 'text-[#3a4b3c]'
            }`}>
              {option.title}
            </h4>
            
            <p className={`text-xs text-center font-sans leading-relaxed transition-colors duration-500 ${
              isSelected ? 'text-white/70' : 'text-[#3a4b3c]/60'
            }`}>
              {option.desc}
            </p>

            {/* Selection Checkmark */}
            {isSelected && (
              <div className="absolute top-5 right-5 w-6 h-6 rounded-full bg-[#ECDD77] flex items-center justify-center animate-[scaleIn_0.3s_ease-out]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#1a1f18]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            
            {/* Background Accent Glow for Selected State */}
            {isSelected && (
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#D4A017] opacity-20 blur-[30px] rounded-full pointer-events-none" />
            )}
          </div>
        );
      })}
    </div>
  );
}
