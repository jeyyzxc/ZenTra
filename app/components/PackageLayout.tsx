import React from 'react';
import SubpageHero from './SubpageHero';
import SpacesSection from './SpacesSection';
import EventCalendar from './EventCalendar';

export interface ContentBlock {
  text: string;
  imageSrc: string;
  imagePosition: 'left' | 'right';
}

interface PackageLayoutProps {
  title: string;
  subtitle: string;
  heroImage: string;
  contentBlocks: ContentBlock[];
  packageText: string;
  galleryImages: string[];
}

export default function PackageLayout({ 
  title, 
  subtitle, 
  heroImage, 
  contentBlocks, 
  packageText, 
  galleryImages 
}: PackageLayoutProps) {
  return (
    <main className="flex flex-col min-h-screen bg-zentra-bg relative">
      <SubpageHero title={title} subtitle={subtitle} imageSrc={heroImage} />
      
      <div className="w-full relative z-10 bg-[#F5F1C6] pb-0">
        
        {/* Content Blocks (Alternating Layout) */}
        <div className="w-full max-w-7xl mx-auto py-12 px-4 md:px-12 flex flex-col gap-12 md:gap-16">
          {contentBlocks.map((block, index) => (
            <div key={index} className={`flex flex-col ${block.imagePosition === 'left' ? 'md:flex-row' : 'md:flex-row-reverse'} items-center`}>
              <div className="w-full md:w-1/2 p-4 md:p-6">
                <div className="aspect-[4/3] w-full overflow-hidden shadow-md">
                  <img src={block.imageSrc} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 text-left">
                <p className="font-serif text-2xl md:text-3xl lg:text-4xl leading-relaxed text-black tracking-wide">
                  {block.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Our Spaces (Reused from Home) */}
        <div className="bg-[#E5DFB3] py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-12">
            <h2 className="font-serif text-black text-3xl md:text-4xl text-center uppercase mb-8 tracking-widest">
              OUR SPACES
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Manual Spaces rendering to match mockup exactly without altering global SpacesSection */}
              <div className="relative aspect-[3/4] overflow-hidden group cursor-pointer shadow-md">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop')" }} />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white drop-shadow-md">
                  <h3 className="font-script text-4xl md:text-5xl text-center leading-tight">The<br/>glass hall</h3>
                </div>
              </div>
              <div className="relative aspect-[3/4] overflow-hidden group cursor-pointer shadow-md">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2098&auto=format&fit=crop')" }} />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white drop-shadow-md">
                  <h3 className="font-script text-4xl md:text-5xl text-center leading-tight">The<br/>Pavilion<br/>garden</h3>
                </div>
              </div>
              <div className="relative aspect-[3/4] overflow-hidden group cursor-pointer shadow-md">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1572331165267-854da2b10ccc?q=80&w=2070&auto=format&fit=crop')" }} />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white drop-shadow-md">
                  <h3 className="font-script text-4xl md:text-5xl text-center leading-tight">The pool</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Our Packages */}
        <div className="w-full bg-[#DCD48E] py-16">
          <div className="max-w-7xl mx-auto px-4 md:px-12 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 flex flex-col items-start text-left md:pr-8">
              <h2 className="text-3xl md:text-4xl font-serif uppercase tracking-widest text-[#2c3328] mb-8">
                OUR PACKAGES
              </h2>
              <p className="font-serif text-2xl md:text-3xl lg:text-4xl leading-relaxed text-black mb-10">
                {packageText}
              </p>
              <button className="px-8 py-3 bg-[#B0A763] hover:bg-[#8D8846] text-[#2c3328] font-serif rounded-[20px] transition-all shadow-md cursor-pointer text-lg border border-black/10">
                Reserve Your Moment
              </button>
            </div>
            <div className="flex-1 flex flex-col items-start w-full md:pl-8">
              <p className="font-serif text-xl mb-4 text-[#2c3328] tracking-wider">VIEW DETAILS:</p>
              <div className="w-full max-w-sm aspect-square bg-[#B5B5B5] flex items-center justify-center shadow-lg border-2 border-[#2c3328]/10">
                <div className="w-2/3 opacity-80">
                  <img src="/zion-logo.png" alt="Zion" className="w-full h-auto filter brightness-0" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="w-full bg-[#F5F1C6] py-16">
          <h2 className="text-3xl md:text-4xl font-serif tracking-widest text-center text-[#2c3328] mb-10 uppercase">
            GALLERY
          </h2>
          <div className="w-full max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {galleryImages.map((src, i) => (
              <div key={i} className="aspect-[3/4] overflow-hidden shadow-sm">
                <img src={src} alt="Gallery image" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
