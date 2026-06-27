import React from 'react';

export default function PartnersSection() {
  const partners = [
    { id: 1, name: 'R-GIE GARCIA', sub: 'EST. 2011', color: 'bg-white', text: 'text-[#E02D2D]' },
    { id: 2, name: "Gaily's", sub: 'EST. 1919', color: 'bg-[#FDF2E3]', text: 'text-black font-script text-2xl' },
    { id: 3, name: '4A', sub: '', color: 'bg-white', text: 'text-black font-serif text-3xl' },
    { id: 4, name: 'Y K PHOTO BOOTH', sub: 'EST 2025', color: 'bg-[#E5E5E5]', text: 'text-black' },
    { id: 5, name: 'M|T', sub: 'MARVIN TOMANDAO FILMS', color: 'bg-black', text: 'text-white font-sans text-xs' }
  ];

  return (
    <section className="bg-transparent w-full px-4 py-16 md:px-12 border-t border-neutral-900/10">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-serif text-neutral-900 text-xl md:text-2xl uppercase tracking-[0.2em] mb-12 text-center drop-shadow-sm">
          Partners
        </h2>
        <div className="flex flex-wrap justify-center gap-4 md:gap-8 items-center">
          {partners.map((partner) => (
            <div 
              key={partner.id} 
              className={`w-[160px] h-16 md:w-[200px] md:h-20 ${partner.color} rounded-full flex flex-col items-center justify-center shadow-sm hover:shadow-[0_0_15px_rgba(223,212,138,0.3)] hover:scale-105 transition-all border border-neutral-900/10 hover:border-neutral-900/40 relative group overflow-hidden`}
            >
              <div className="absolute inset-0 border border-neutral-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
              <span className={`font-bold text-center ${partner.text} leading-tight`}>
                {partner.name}
              </span>
              {partner.sub && (
                <span className={`text-[8px] md:text-[10px] tracking-widest ${partner.color === 'bg-black' ? 'text-white' : 'text-black'} opacity-80 mt-1`}>
                  {partner.sub}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

