import React from 'react';
import { BookFormData } from './BookFlow';

interface Props {
  data: BookFormData;
  goToStep: (step: number) => void;
}

const themeImages: Record<string, string> = {
  'Minimalist': 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop',
  'Garden': 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop',
  'Elegant': 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop',
  'Modern Luxury': 'https://images.unsplash.com/photo-1543348750-466b55f32f16?q=80&w=1974&auto=format&fit=crop',
  'default': 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop'
};

const packages = [
  { 
    id: 1, 
    name: 'Zion Classic', 
    price: 'PHP 168K', 
    image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop',
    color1: 'bg-[#C2AC36]', 
    color2: 'bg-[#B19D31]', 
    color3: 'bg-[#C7B342]',
    isBestMatch: true 
  },
  { 
    id: 2, 
    name: 'Zion Premium', 
    price: 'PHP 180K', 
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop',
    color1: 'bg-[#9BA3A9]', 
    color2: 'bg-[#B4B9BE]', 
    color3: 'bg-[#B4B9BE]',
    isBestMatch: false 
  },
  { 
    id: 3, 
    name: 'Intimate Wedding', 
    price: 'PHP 150K', 
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop',
    color1: 'bg-[#C3B872]', 
    color2: 'bg-[#D6CE94]', 
    color3: 'bg-[#D6CE94]',
    isBestMatch: false 
  },
];

const generateNarrative = (data: BookFormData) => {
  const event = (data.eventType || 'event').toLowerCase();
  const theme = data.theme || 'Modern Luxury';
  const guests = data.guestCount || '50-75';
  
  let narrative = `Your ${theme} vision for this ${event} is elegantly refined for ${guests} guests. `;
  
  const timeStr = (data.time || '').toLowerCase();
  if (timeStr.includes('morning') || timeStr.includes('am')) {
    narrative += 'This blueprint masterfully pairs morning radiance with elite artistry, ';
  } else if (timeStr.includes('sunset') || timeStr.includes('afternoon')) {
    narrative += 'This blueprint masterfully pairs Golden Hour brilliance with elite artistry, ';
  } else if (timeStr.includes('evening') || timeStr.includes('night') || timeStr.includes('pm') || timeStr.includes('luminous')) {
    narrative += 'This blueprint masterfully pairs enchanting evening ambiance with elite artistry, ';
  } else {
    narrative += 'This blueprint masterfully pairs timeless brilliance with elite artistry, ';
  }

  if (event.includes('wedding')) {
    narrative += 'crafting a romantic legacy. ';
  } else if (event.includes('corporate')) {
    narrative += 'crafting an atmosphere of professional prestige. ';
  } else {
    narrative += 'crafting an unforgettable celebration. ';
  }

  const budgetStr = (data.budget || '').toLowerCase();
  if (budgetStr.includes('500k') || budgetStr.includes('1m') || budgetStr.includes('luxury')) {
    narrative += 'Expect unparalleled opulence in every meticulously curated detail.';
  } else {
    narrative += 'Every single detail is meticulously curated to absolute perfection.';
  }

  return narrative;
};

export default function Step11Result({ data, goToStep }: Props) {
  const heroImage = themeImages[data.theme] || themeImages['default'];
  const dynamicNarrative = generateNarrative(data);

  return (
    <div className="w-full flex flex-col items-center bg-[#FDFCEE] pb-24 pt-16">
      <div className="max-w-6xl mx-auto w-full px-4 md:px-8">
        
        {/* Title */}
        <h1 className="text-5xl md:text-6xl font-serif text-[#1a1f18] text-center mb-10 tracking-tight animate-[fadeInUp_0.6s_ease-out]">
          The Signature Narrative
        </h1>

        {/* Hero Image Block */}
        <div className="relative w-full h-[60vh] min-h-[500px] rounded-3xl overflow-hidden shadow-2xl mb-12 group animate-[fadeInUp_0.8s_ease-out]">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms] group-hover:scale-[1.03]"
            style={{ backgroundImage: `url("${heroImage}")` }}
          />
          
          {/* Refine Plan Button */}
          <button 
            onClick={() => goToStep(9)}
            className="absolute bottom-6 right-6 px-6 py-3 bg-white/70 backdrop-blur-md rounded-[2rem] font-serif text-xl text-[#1a1f18] hover:bg-white transition-all shadow-lg flex items-center gap-2 border border-white/40 group/btn"
          >
            <span className="text-2xl transition-transform duration-500 group-hover/btn:rotate-12 group-hover/btn:scale-110">✨</span> Refine Plan
          </button>
        </div>

        {/* Description Text */}
        <div className="text-center max-w-4xl mx-auto mb-20 px-4 animate-[fadeInUp_1s_ease-out]">
          <p className="font-serif italic text-2xl md:text-[28px] text-[#1a1f18] leading-relaxed">
            {dynamicNarrative}
          </p>
        </div>

        {/* Recommended Packages */}
        <div className="mb-20 animate-[fadeInUp_1.2s_ease-out]">
          <h2 className="font-serif italic text-4xl text-[#1a1f18] mb-10">
            Recommended Packages
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2">
            {packages.map((pkg, index) => (
              <div 
                key={pkg.id} 
                className="rounded-3xl overflow-hidden flex flex-col shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative group cursor-pointer"
                style={{ animationDelay: `${1.2 + (index * 0.1)}s` }}
              >
                {pkg.isBestMatch && (
                  <div className="absolute top-0 left-0 bg-[#FFD700] text-[#1a1f18] text-xs font-bold px-3 py-1.5 rounded-br-xl z-10 shadow-sm uppercase tracking-wider animate-[scaleIn_0.5s_ease-out_1.5s_both]">
                    Best Match
                  </div>
                )}
                
                {/* Package Image */}
                <div className="relative h-48 w-full overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url("${pkg.image}")` }}
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                </div>
                
                {/* Title Band */}
                <div className={`${pkg.color1} py-5 text-center text-white text-[28px] font-serif tracking-wide border-b border-black/10 transition-colors duration-300 group-hover:brightness-110`}>
                  {pkg.name}
                </div>
                
                {/* Blank space band */}
                <div className={`${pkg.color2} h-10 w-full border-b border-black/10 transition-colors duration-300 group-hover:brightness-110`}></div>
                
                {/* Price Band */}
                <div className={`${pkg.color3} py-5 text-center text-white text-[28px] font-serif tracking-wide transition-colors duration-300 group-hover:brightness-110`}>
                  {pkg.price}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form and Details Section */}
        <div className="bg-[#DFD79D] rounded-[2rem] py-6 px-8 md:py-8 md:px-12 shadow-lg max-w-6xl mx-auto w-full flex flex-col md:flex-row gap-10 md:gap-16 animate-[fadeInUp_1.4s_ease-out]">
          
          {/* Left side: Details List */}
          <div className="flex-1 flex flex-col justify-center space-y-4">
            <div className="flex items-end justify-between border-b-[2px] border-[#1a1f18]/30 pb-1.5 group/row transition-all duration-300 hover:border-[#1a1f18]">
              <span className="text-xl font-serif text-[#1a1f18]/70 transition-colors group-hover/row:text-[#1a1f18]">Event:</span>
              <span className="text-2xl font-serif text-[#1a1f18]">{data.eventType || 'Wedding'}</span>
            </div>
            <div className="flex items-end justify-between border-b-[2px] border-[#1a1f18]/30 pb-1.5 group/row transition-all duration-300 hover:border-[#1a1f18]">
              <span className="text-xl font-serif text-[#1a1f18]/70 transition-colors group-hover/row:text-[#1a1f18]">Guests:</span>
              <span className="text-2xl font-serif text-[#1a1f18]">{data.guestCount || '50-75'}</span>
            </div>
            <div className="flex items-end justify-between border-b-[2px] border-[#1a1f18]/30 pb-1.5 group/row transition-all duration-300 hover:border-[#1a1f18]">
              <span className="text-xl font-serif text-[#1a1f18]/70 transition-colors group-hover/row:text-[#1a1f18]">Theme:</span>
              <span className="text-2xl font-serif text-[#1a1f18]">{data.theme || 'Modern Luxury'}</span>
            </div>
            <div className="flex items-end justify-between border-b-[2px] border-[#1a1f18]/30 pb-1.5 group/row transition-all duration-300 hover:border-[#1a1f18]">
              <span className="text-xl font-serif text-[#1a1f18]/70 transition-colors group-hover/row:text-[#1a1f18]">Date:</span>
              <span className="text-2xl font-serif text-[#1a1f18]">{data.date || 'February 14, 2026'}</span>
            </div>
            <div className="flex items-end justify-between border-b-[2px] border-[#1a1f18]/30 pb-1.5 group/row transition-all duration-300 hover:border-[#1a1f18]">
              <span className="text-xl font-serif text-[#1a1f18]/70 transition-colors group-hover/row:text-[#1a1f18]">Time:</span>
              <span className="text-2xl font-serif text-[#1a1f18]">{data.time || '5:00PM'}</span>
            </div>
            <div className="flex items-end justify-between border-b-[2px] border-[#1a1f18]/30 pb-1.5 group/row transition-all duration-300 hover:border-[#1a1f18]">
              <span className="text-xl font-serif text-[#1a1f18]/70 transition-colors group-hover/row:text-[#1a1f18]">Budget:</span>
              <span className="text-2xl font-serif text-[#1a1f18]">{data.budget || 'TBD'}</span>
            </div>
            <div className="flex items-end justify-between border-b-[2px] border-[#1a1f18]/30 pb-1.5 group/row transition-all duration-300 hover:border-[#1a1f18]">
              <span className="text-xl font-serif text-[#1a1f18]/70 transition-colors group-hover/row:text-[#1a1f18]">Add-ons:</span>
              <span className="text-xl font-serif text-[#1a1f18] truncate max-w-[60%] text-right" title={data.addOns.length > 0 ? data.addOns.join(', ') : 'None'}>
                {data.addOns.length > 0 ? data.addOns.join(', ') : 'None'}
              </span>
            </div>
            <div className="flex items-end justify-between border-b-[2px] border-[#1a1f18]/30 pb-1.5 group/row transition-all duration-300 hover:border-[#1a1f18]">
              <span className="text-xl font-serif text-[#1a1f18]/70 transition-colors group-hover/row:text-[#1a1f18]">Notes:</span>
              <span className="text-xl font-serif text-[#1a1f18] truncate max-w-[60%] text-right">{data.notes || 'None'}</span>
            </div>
          </div>

          {/* Right side: Form */}
          <div className="flex-1 flex flex-col justify-center">
            <form className="space-y-3 flex flex-col" onSubmit={(e) => e.preventDefault()}>
              <input type="text" className="w-full bg-white/60 backdrop-blur-sm px-6 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-white shadow-sm text-lg font-serif placeholder-[#1a1f18]/50 text-[#1a1f18] transition-all hover:bg-white/80 focus:bg-white" placeholder="Full Name" />
              <input type="email" className="w-full bg-white/60 backdrop-blur-sm px-6 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-white shadow-sm text-lg font-serif placeholder-[#1a1f18]/50 text-[#1a1f18] transition-all hover:bg-white/80 focus:bg-white" placeholder="Email Address" />
              <input type="text" className="w-full bg-white/60 backdrop-blur-sm px-6 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-white shadow-sm text-lg font-serif placeholder-[#1a1f18]/50 text-[#1a1f18] transition-all hover:bg-white/80 focus:bg-white" placeholder="Facebook" />
              <input type="tel" className="w-full bg-white/60 backdrop-blur-sm px-6 py-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-white shadow-sm text-lg font-serif placeholder-[#1a1f18]/50 text-[#1a1f18] transition-all hover:bg-white/80 focus:bg-white" placeholder="Phone Number" />
              
              <div className="flex flex-col items-center mt-4 gap-2 pt-1">
                <button className="px-8 py-2.5 bg-[#BEB167] hover:bg-[#A89C5A] text-[#1a1f18] font-serif text-xl rounded-full transition-all shadow-[0_4px_10px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_15px_rgba(0,0,0,0.15)] hover:-translate-y-1 w-fit border border-black/10 active:scale-95">
                  Book this package
                </button>
                <button className="px-6 py-1.5 bg-[#EFE9CC]/80 hover:bg-white text-[#1a1f18] font-serif text-[15px] rounded-full transition-all border border-black/5 shadow-sm hover:-translate-y-0.5 active:scale-95">
                  Send this to my email
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
