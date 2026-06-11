import React from 'react';
import { BookFormData } from './BookFlow';

interface Props {
  data: BookFormData;
  updateData: (fields: Partial<BookFormData>) => void;
}

export default function Step8Notes({ data, updateData }: Props) {
  const maxLength = 1000;
  
  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="bg-[#F3EBB8] rounded-3xl p-8 md:p-12 shadow-lg relative text-left">
        <label className="block text-[#3A4B3C] font-serif text-2xl mb-6 font-bold text-left">
          QuickTags:
        </label>
        
        <div className="relative">
          {/* Lined background effect */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #3A4B3C 31px, #3A4B3C 32px)',
              backgroundPosition: '0 4px'
            }}
          />
          
          <textarea
            value={data.notes}
            onChange={(e) => {
              if (e.target.value.length <= maxLength) {
                updateData({ notes: e.target.value });
              }
            }}
            placeholder="Type your notes here..."
            className="w-full h-80 bg-transparent resize-none focus:outline-none text-[#3A4B3C] font-sans text-xl leading-[32px] placeholder:text-[#3A4B3C]/40 relative z-10 text-left"
          />
        </div>
        
        <div className="absolute bottom-6 right-8 text-[#3A4B3C]/60 font-sans text-sm">
          {data.notes.length}/{maxLength} characters
        </div>
      </div>
    </div>
  );
}
