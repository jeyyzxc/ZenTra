'use client';

import React from 'react';

const packages = [
  { name: 'Debut', image: 'https://images.unsplash.com/photo-1549471013-3364d7220b75?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Gender Reveal', image: 'https://images.unsplash.com/photo-1621364531235-97b77ab6ef80?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Wedding Reception', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop' },
  { name: 'Christening', image: 'https://images.unsplash.com/photo-1544126592-807ade215a0b?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Birthday', image: 'https://images.unsplash.com/photo-1530103862676-de389de4b786?q=80&w=2070&auto=format&fit=crop' },
  { name: 'Christmas Party', image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=2070&auto=format&fit=crop' },
];

export default function ServicesAndPackages() {
  return (
    <div className="flex flex-col gap-6 h-full font-serif text-[#1a1f18]">
      
      {/* Header Area */}
      <div className="flex justify-between items-end mb-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Services & Packages</h2>
          <p className="text-gray-500">Manage what Zion can offer to inquiring clients.</p>
        </div>
        
        <button className="flex items-center gap-2 bg-[#FDF5CC] hover:bg-[#EADE81] border border-gray-200 text-[#1a1f18] px-6 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add New Package
        </button>
      </div>

      {/* Grid Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg, idx) => (
          <div 
            key={idx} 
            className="group relative h-[300px] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer border border-black/5"
          >
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: `url('${pkg.image}')` }}
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
            
            {/* Content */}
            <div className="absolute bottom-0 left-0 p-6 w-full flex items-center justify-between">
              <h3 className="text-white text-3xl font-serif italic tracking-wide drop-shadow-md">
                {pkg.name}
              </h3>
              
              {/* Edit Icon (shows on hover) */}
              <button className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 hover:bg-white/40">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
