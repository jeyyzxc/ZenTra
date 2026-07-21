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
    <section className="bg-transparent w-full px-4 pt-6 pb-16 md:pt-8 md:px-12 border-t border-neutral-900/10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 flex w-full justify-center overflow-hidden md:mb-12">
          <div className="group relative flex w-full min-w-0 items-center justify-center gap-3 md:gap-6 cursor-default">
            {/* Left elegant fading line */}
            <div className="h-[1.5px] min-w-0 flex-1 bg-gradient-to-r from-transparent to-[#D4AF37]/80 opacity-70 transition-all duration-700 ease-out group-hover:to-[#D4AF37] group-hover:opacity-100 md:max-w-20 md:group-hover:max-w-40" />

            <h2 className="shrink-0 text-center font-serif text-[1.05rem] uppercase tracking-[0.08em] text-neutral-900 transition-colors duration-700 ease-out group-hover:text-[#D4AF37] min-[360px]:text-xl min-[360px]:tracking-[0.1em] md:text-4xl md:tracking-[0.2em] md:group-hover:tracking-[0.24em]">
              OUR TRUSTED PARTNERS
            </h2>

            {/* Right elegant fading line */}
            <div className="h-[1.5px] min-w-0 flex-1 bg-gradient-to-l from-transparent to-[#D4AF37]/80 opacity-70 transition-all duration-700 ease-out group-hover:to-[#D4AF37] group-hover:opacity-100 md:max-w-20 md:group-hover:max-w-40" />
          </div>
        </div>
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
