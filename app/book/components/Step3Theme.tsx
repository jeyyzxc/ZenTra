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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 w-full max-w-4xl mx-auto px-4">
      {themes.map((theme) => {
        const isSelected = data.theme === theme.id;
        
        return (
          <div 
            key={theme.id}
            onClick={() => updateData({ theme: theme.id })}
            className={`relative rounded-[2rem] overflow-hidden aspect-[16/9] cursor-pointer transition-all duration-300 transform ${
              isSelected ? 'scale-105 shadow-2xl ring-4 ring-[#4CAF50] ring-offset-4 ring-offset-[#EAE5C3]' : 'hover:scale-105 shadow-md hover:shadow-xl'
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
              <h3 className="text-white text-3xl md:text-5xl font-sahitya text-center drop-shadow-lg">
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
              <div className="absolute top-4 right-4 bg-[#4CAF50] w-12 h-12 rounded-full flex items-center justify-center shadow-lg transform transition-transform scale-in">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
