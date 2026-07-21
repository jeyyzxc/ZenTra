import React from 'react';
import { BookFormData } from './BookFlow';

interface Props {
  data: BookFormData;
  updateData: (fields: Partial<BookFormData>) => void;
}

const budgetOptions = [
  { 
    id: 'Under ₱ 150k', 
    title: 'Intimate & Minimalist',
    description: 'Perfect for small gatherings and elegant simplicity.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    )
  },
  { 
    id: '₱ 150k - ₱180k', 
    title: 'Classic Zion',
    description: 'The standard package with beautiful inclusions for a complete experience.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  { 
    id: '₱ 180k - ₱240k', 
    title: 'Premium Elegance',
    description: 'Upgraded styling, premium menus, and a more lavish affair.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )
  },
  { 
    id: 'Ultimate ( ₱240k+ )', 
    title: 'The Grand Experience',
    description: 'No compromises. The finest of everything Zion has to offer.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
];

export default function Step6Budget({ data, updateData }: Props) {
  return (
    <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 px-2 sm:px-4 md:grid-cols-2 md:gap-6">
      {budgetOptions.map((option) => {
        const isSelected = data.budget === option.id;
        
        return (
          <button
            aria-pressed={isSelected}
            data-touch-surface
            key={option.id}
            onClick={() => updateData({ budget: option.id })}
            type="button"
            className={`group relative w-full cursor-pointer overflow-hidden rounded-2xl p-5 text-left transition-all duration-500 sm:rounded-3xl sm:p-7 md:p-8 ${
              isSelected 
                ? 'bg-[#E5DCA5] shadow-2xl ring-2 ring-[#3A4B3C] ring-offset-2 ring-offset-[#EAE5C3] sm:scale-[1.01] sm:ring-[3px] sm:ring-offset-4'
                : 'border border-[#3A4B3C]/10 bg-white/40 shadow-md hover:bg-[#F5F1DA] md:hover:scale-[1.02] md:hover:shadow-xl'
            }`}
          >
            {/* Background animated gradient for hover effect */}
            <div className={`absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

            <div className="relative z-10 flex flex-col items-center text-center h-full">
              {/* Icon Container */}
              <div className={`mb-4 flex h-13 w-13 items-center justify-center rounded-xl transition-all duration-500 sm:mb-6 sm:h-16 sm:w-16 sm:rounded-2xl ${
                isSelected ? 'bg-[#3A4B3C] text-[#EAE5C3] shadow-lg sm:scale-110' : 'bg-[#EAE5C3] text-[#3A4B3C] group-hover:bg-[#3A4B3C] group-hover:text-[#EAE5C3]'
              }`}>
                {option.icon}
              </div>

              {/* Text Content */}
              <h3 className="mb-1.5 font-serif text-xl font-bold text-[#3A4B3C] transition-colors sm:mb-2 sm:text-2xl">
                {option.title}
              </h3>
              
              <div className={`mb-2 font-sans text-lg font-bold tracking-wide sm:mb-4 sm:text-xl ${isSelected ? 'text-black' : 'text-[#3A4B3C]/80'}`}>
                {option.id}
              </div>

              <p className="mt-auto max-w-xs font-sans text-sm leading-relaxed text-[#3A4B3C]/70 md:text-base">
                {option.description}
              </p>
            </div>

            {/* Selection Checkmark */}
            {isSelected && (
              <div className="absolute top-4 right-4 bg-[#3A4B3C] w-8 h-8 rounded-full flex items-center justify-center shadow-md transform transition-transform scale-in animate-[popIn_0.3s_ease-out]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
