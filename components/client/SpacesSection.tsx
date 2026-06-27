import React from 'react';

const spaces = [
  {
    id: 1,
    titleLine1: 'The',
    titleLine2: 'glass hall',
    image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop',
  },
  {
    id: 2,
    titleLine1: 'The',
    titleLine2: 'Pavilion garden',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop',
  },
  {
    id: 3,
    titleLine1: 'The pool',
    titleLine2: '',
    image: 'https://images.unsplash.com/photo-1572331165267-854da2b10ccc?q=80&w=2070&auto=format&fit=crop',
  }
];

export default function SpacesSection() {
  return (
    <section className="bg-transparent w-full px-4 py-8 md:px-12">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-serif text-neutral-900 text-xl md:text-2xl uppercase tracking-[0.2em] mb-4">
          OUR SPACES
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {spaces.map((space) => (
            <div 
              key={space.id} 
              className="relative aspect-[3/4] md:aspect-[2/3] overflow-hidden group cursor-pointer"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url('${space.image}')` }}
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white drop-shadow-md">
                <h3 className="font-script text-4xl md:text-5xl text-center leading-tight">
                  {space.titleLine1}
                </h3>
                {space.titleLine2 && (
                  <h3 className="font-script text-4xl md:text-5xl text-center leading-tight">
                    {space.titleLine2}
                  </h3>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

