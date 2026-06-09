import React from 'react';
import SubpageHero from './SubpageHero';
import SpacesSection from './SpacesSection';

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
      
      <div className="w-full relative z-10 bg-[#FBF4C4] pb-20">
        
        {/* Content Blocks (Alternating Layout) */}
        <div className="w-full max-w-7xl mx-auto py-16 px-4 md:px-12 flex flex-col gap-0">
          {contentBlocks.map((block, index) => (
            <div key={index} className={`flex flex-col ${block.imagePosition === 'left' ? 'md:flex-row' : 'md:flex-row-reverse'} items-stretch min-h-[400px]`}>
              <div className="flex-1">
                <img src={block.imageSrc} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex items-center justify-center p-8 md:p-16 text-center">
                <p className="font-serif text-2xl md:text-3xl lg:text-4xl leading-snug text-black">
                  {block.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Our Spaces (Reused from Home) */}
        <div className="bg-[#EAE6D1] py-8">
          <SpacesSection />
        </div>

        {/* Our Packages */}
        <div className="w-full max-w-7xl mx-auto py-20 px-4 md:px-12 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 flex flex-col items-start text-left">
            <h2 className="text-4xl md:text-5xl font-segoe uppercase tracking-wider text-[#3A4B3C] mb-8">
              OUR PACKAGES
            </h2>
            <p className="font-serif text-2xl md:text-3xl leading-snug text-black mb-12">
              {packageText}
            </p>
            <button className="px-8 py-3 bg-[#D2CB96] hover:bg-[#C5B87D] text-[#3A4B3C] font-serif tracking-widest rounded-full transition-all shadow-md cursor-pointer">
              Reserve Your Moment
            </button>
          </div>
          <div className="flex-1 flex flex-col items-start w-full">
            <p className="font-serif text-xl mb-2 text-[#3A4B3C]">VIEW DETAILS:</p>
            <div className="w-full aspect-square bg-[#B5B5B5] flex items-center justify-center">
              {/* ZION Placeholder Box */}
              <div className="w-1/2 opacity-70">
                <img src="/c98908fb-9a78-41df-9a97-95623bdf6114.png" alt="Zion" className="w-full h-auto filter brightness-0" />
              </div>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="w-full bg-[#FBF4C4] py-16">
          <h2 className="text-4xl md:text-5xl font-segoe uppercase tracking-wider text-center text-[#3A4B3C] mb-12">
            GALLERY
          </h2>
          <div className="w-full max-w-[1400px] mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {galleryImages.map((src, i) => (
              <div key={i} className="aspect-[3/4] overflow-hidden">
                <img src={src} alt="Gallery image" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
