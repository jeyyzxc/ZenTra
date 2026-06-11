import React from 'react';
import { BookFormData } from './BookFlow';

interface Props {
  data: BookFormData;
  updateData: (fields: Partial<BookFormData>) => void;
}

const times = [
  { id: 'Luminous', image: 'https://images.unsplash.com/photo-1544813545-4827b64fcacb?q=80&w=2070&auto=format&fit=crop' },
  { id: 'Zenith', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop' },
  { id: 'Golden Hour', image: 'https://images.unsplash.com/photo-1516997121675-4c2d1684aa3e?q=80&w=2072&auto=format&fit=crop' },
  { id: 'Starlit', image: 'https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?q=80&w=1974&auto=format&fit=crop' },
];

export default function Step5Time({ data, updateData }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 w-full max-w-4xl mx-auto px-4">
      {times.map((time) => {
        const isSelected = data.time === time.id;
        
        return (
          <div 
            key={time.id}
            onClick={() => updateData({ time: time.id })}
            className={`relative rounded-[2rem] overflow-hidden aspect-[16/9] cursor-pointer transition-all duration-300 transform ${
              isSelected ? 'scale-105 shadow-2xl ring-4 ring-[#4CAF50] ring-offset-4 ring-offset-[#EAE5C3]' : 'hover:scale-105 shadow-md hover:shadow-xl'
            }`}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
              style={{ backgroundImage: `url("${time.image}")` }}
            />
            
            {/* Dark Overlay */}
            <div className={`absolute inset-0 transition-colors duration-300 ${isSelected ? 'bg-black/30' : 'bg-black/50 hover:bg-black/40'}`} />
            
            {/* Text Content */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <h3 className="text-white text-3xl md:text-5xl font-sahitya text-center drop-shadow-lg">
                {time.id.split(' ').map((word, i) => (
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
