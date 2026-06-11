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
    <section className="bg-[#EAE6D1] w-full px-4 py-16 md:px-12">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-serif text-black text-2xl md:text-3xl text-center uppercase tracking-widest mb-12">
          ACCREDITED PARTNERS
        </h2>
        
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 items-center">
          {partners.map((partner) => (
            <div 
              key={partner.id} 
              className={`w-[180px] h-20 md:w-[220px] md:h-24 ${partner.color} rounded-full flex flex-col items-center justify-center shadow-sm hover:scale-105 transition-transform border border-black/5`}
            >
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

