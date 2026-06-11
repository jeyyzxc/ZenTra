import React from 'react';
import { BookFormData } from './BookFlow';

interface Props {
  data: BookFormData;
  updateData: (fields: Partial<BookFormData>) => void;
  nextStep: () => void;
}

const eventTypes = [
  { id: 'Wedding', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop' },
  { id: 'Debut', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop' },
  { id: 'Birthday', image: 'https://images.unsplash.com/photo-1530103862676-de3c9de59f9e?q=80&w=2070&auto=format&fit=crop' },
  { id: 'Christening', image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=2070&auto=format&fit=crop' },
  { id: 'Gender Reveal', image: 'https://images.unsplash.com/photo-1621252179027-94459d278660?q=80&w=2070&auto=format&fit=crop' },
  { id: 'Christmas Party', image: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?q=80&w=2069&auto=format&fit=crop' },
];

export default function Step1EventType({ data, updateData, nextStep }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 w-full max-w-4xl mx-auto px-4">
      {eventTypes.map((event) => {
        const isSelected = data.eventType === event.id;
        
        return (
          <div 
            key={event.id}
            onClick={() => {
              updateData({ eventType: event.id });
              setTimeout(nextStep, 300); // Slight delay so user sees the checkmark
            }}
            className={`relative rounded-3xl overflow-hidden aspect-[4/3] cursor-pointer transition-all duration-300 transform ${
              isSelected ? 'scale-105 shadow-2xl ring-4 ring-[#4CAF50] ring-offset-4 ring-offset-[#EAE5C3]' : 'hover:scale-105 shadow-md hover:shadow-xl'
            }`}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
              style={{ backgroundImage: `url("${event.image}")` }}
            />
            
            {/* Dark Overlay */}
            <div className={`absolute inset-0 transition-colors duration-300 ${isSelected ? 'bg-black/20' : 'bg-black/40 hover:bg-black/30'}`} />
            
            {/* Text Content */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <h3 className="text-white text-3xl md:text-4xl font-sahitya text-center drop-shadow-md whitespace-nowrap">
                {event.id}
              </h3>
            </div>

            {/* Selection Checkmark */}
            {isSelected && (
              <div className="absolute top-4 right-4 bg-[#4CAF50] w-10 h-10 rounded-full flex items-center justify-center shadow-lg transform transition-transform scale-in">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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
