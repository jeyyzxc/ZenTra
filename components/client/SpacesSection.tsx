import React from 'react';

const spaces = [
  {
    id: 1,
    titleLine1: 'The',
    titleLine2: 'glass hall',
    image: '/zion/684222572_17948428422152473_4013856636383990076_n.jpg',
  },
  {
    id: 2,
    titleLine1: 'The',
    titleLine2: 'Pavilion garden',
    image: '/zion/ChatGPT Image Jul 2, 2026, 10_19_13 PM.png',
  },
  {
    id: 3,
    titleLine1: 'The pool',
    titleLine2: '',
    image: '/zion/620971763_782204770989828_1960603748204775146_n.jpg',
  }
];

export default function SpacesSection() {
  return (
    <section className="bg-transparent w-full px-4 pt-12 pb-10 md:pt-16 md:pb-12 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-center w-full overflow-hidden">
          <div className="group relative flex items-center justify-center gap-4 md:gap-6 cursor-default">
            {/* Left elegant fading line */}
            <div className="h-[1.5px] w-12 md:w-24 bg-gradient-to-r from-transparent to-[#D4AF37]/80 transition-all duration-700 ease-out group-hover:w-24 md:group-hover:w-48 group-hover:to-[#D4AF37] opacity-70 group-hover:opacity-100" />

            <h2 className="font-serif text-neutral-900 text-2xl md:text-4xl uppercase tracking-[0.2em] transition-all duration-700 ease-out group-hover:text-[#D4AF37] group-hover:tracking-[0.3em] whitespace-nowrap">
              OUR SPACES
            </h2>

            {/* Right elegant fading line */}
            <div className="h-[1.5px] w-12 md:w-24 bg-gradient-to-l from-transparent to-[#D4AF37]/80 transition-all duration-700 ease-out group-hover:w-24 md:group-hover:w-48 group-hover:to-[#D4AF37] opacity-70 group-hover:opacity-100" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {spaces.map((space) => (
            <div
              key={space.id}
              className={`relative aspect-[3/4] md:aspect-[2/3] overflow-hidden group cursor-pointer transition-all duration-500 ${
                space.id === 1 ? 'rounded-b-2xl md:rounded-bl-none md:rounded-r-2xl' :
                space.id === 2 ? 'rounded-2xl' :
                space.id === 3 ? 'rounded-t-2xl md:rounded-tr-none md:rounded-l-2xl' : ''
              }`}
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

