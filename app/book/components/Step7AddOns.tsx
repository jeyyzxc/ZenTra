import React from 'react';
import { BookFormData } from './BookFlow';

interface Props {
  data: BookFormData;
  updateData: (fields: Partial<BookFormData>) => void;
}

const addOnsList = [
  { id: 'Food Carts', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1981&auto=format&fit=crop' },
  { id: 'Rooms', image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=2070&auto=format&fit=crop' },
  { id: 'Photobooth', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1938&auto=format&fit=crop' },
  { id: 'Ceremony Styling', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop' },
  { id: 'Photo & Video', image: 'https://images.unsplash.com/photo-1516961642265-531546e84af2?q=80&w=1974&auto=format&fit=crop' },
  { id: 'Menu', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop' },
];

export default function Step7AddOns({ data, updateData }: Props) {
  
  const toggleAddOn = (id: string) => {
    const current = data.addOns || [];
    const updated = current.includes(id) 
      ? current.filter(item => item !== id)
      : [...current, id];
    updateData({ addOns: updated });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 w-full max-w-5xl mx-auto px-4">
      {addOnsList.map((addon) => {
        const isSelected = (data.addOns || []).includes(addon.id);
        
        return (
          <div 
            key={addon.id}
            onClick={() => toggleAddOn(addon.id)}
            className={`relative rounded-[2rem] overflow-hidden aspect-square cursor-pointer transition-all duration-300 transform ${
              isSelected ? 'scale-105 shadow-2xl ring-4 ring-[#4CAF50] ring-offset-4 ring-offset-[#EAE5C3]' : 'hover:scale-105 shadow-md hover:shadow-xl'
            }`}
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
              style={{ backgroundImage: `url("${addon.image}")` }}
            />
            
            {/* Dark Overlay */}
            <div className={`absolute inset-0 transition-colors duration-300 ${isSelected ? 'bg-black/30' : 'bg-black/50 hover:bg-black/40'}`} />
            
            {/* Text Content */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <h3 className="text-white text-3xl md:text-4xl font-sahitya text-center drop-shadow-lg">
                {addon.id}
              </h3>
            </div>

            {/* Selection Checkmark */}
            {isSelected && (
              <div className="absolute top-4 right-4 bg-[#4CAF50] w-10 h-10 rounded-full flex items-center justify-center shadow-lg transform transition-transform scale-in z-10">
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
