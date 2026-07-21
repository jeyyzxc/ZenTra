import React from 'react';
import { BookFormData } from './BookFlow';

interface Props {
  data: BookFormData;
  updateData: (fields: Partial<BookFormData>) => void;
}

const themes = [
  { id: 'Minimalist', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop' },
  { id: 'Garden', image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop' },
  { id: 'Elegant', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop' },
  { id: 'Modern Luxury', image: 'https://images.unsplash.com/photo-1543348750-466b55f32f16?q=80&w=1974&auto=format&fit=crop' },
];

export default function Step3Theme({ data, updateData }: Props) {
  return (
    <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 px-2 sm:px-4 md:grid-cols-2 md:gap-10 lg:gap-16">
      {themes.map((theme) => {
        const isSelected = data.theme === theme.id;
        
        return (
          <button
            aria-pressed={isSelected}
            data-touch-surface
            key={theme.id}
            onClick={() => updateData({ theme: theme.id })}
            type="button"
            className={`relative aspect-[16/9] w-full cursor-pointer overflow-hidden rounded-2xl text-left transition-all duration-300 sm:rounded-[2rem] ${
              isSelected ? 'shadow-2xl ring-2 ring-[#4CAF50] ring-offset-2 ring-offset-[#EAE5C3] sm:scale-[1.02] sm:ring-4 sm:ring-offset-4' : 'shadow-md md:hover:scale-[1.03] md:hover:shadow-xl'
            }`}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
              style={{ backgroundImage: `url("${theme.image}")` }}
            />
            
            {/* Dark Overlay */}
            <div className={`absolute inset-0 transition-colors duration-300 ${isSelected ? 'bg-black/30' : 'bg-black/50 hover:bg-black/40'}`} />
            
            {/* Text Content */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <h3 className="text-center font-sahitya text-3xl text-white drop-shadow-lg md:text-5xl">
                {theme.id.split(' ').map((word, i) => (
                  <React.Fragment key={i}>
                    {word}
                    <br />
                  </React.Fragment>
                ))}
              </h3>
            </div>

            {/* Selection Checkmark */}
            {isSelected && (
              <div className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#4CAF50] shadow-lg transition-transform sm:right-4 sm:top-4 sm:h-12 sm:w-12">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
