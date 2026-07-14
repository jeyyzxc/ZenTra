import React from 'react';
import { connection } from 'next/server';

import ClientFeatureUnavailable from '@/components/client/ClientFeatureUnavailable';
import PublicSubpageShell from '@/components/client/PublicSubpageShell';
import type { PublicPageHeroKey } from '@/config/public-page-heroes';
import { getClientFeatureAvailability } from '@/lib/system-settings';
import PackageFlipbook from './PackageFlipbook';

export interface ContentBlock {
  text: string;
  imageSrc: string;
  imagePosition: 'left' | 'right';
}

interface PackageLayoutProps {
  heroKey: PublicPageHeroKey;
  contentBlocks: ContentBlock[];
  packageText: string;
  galleryImages: string[];
}

export default async function PackageLayout({
  heroKey,
  contentBlocks,
  packageText,
  galleryImages
}: PackageLayoutProps) {
  await connection();
  const packageAvailability = await getClientFeatureAvailability('packages');

  return (
    <PublicSubpageShell heroKey={heroKey}>
      {!packageAvailability.enabled ? (
        <ClientFeatureUnavailable
          title="Packages Are Paused"
          message={packageAvailability.message}
        />
      ) : (
      <div className="w-full relative z-10 bg-transparent pb-0">

        {/* Content Blocks (Alternating Layout) */}
        <div className="w-full max-w-7xl mx-auto py-8 md:py-10 px-4 md:px-12 flex flex-col gap-8 md:gap-12">
          {contentBlocks.map((block, index) => (
            <div key={index} className={`flex flex-col ${block.imagePosition === 'left' ? 'md:flex-row' : 'md:flex-row-reverse'} items-center`}>
              <div className="w-full md:w-1/2 p-4 md:p-6">
                <div className="aspect-[4/3] w-full overflow-hidden shadow-md max-w-md mx-auto">
                  <img src={block.imageSrc} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 text-left">
                <p className="font-serif text-xl md:text-2xl lg:text-3xl leading-relaxed text-neutral-900 tracking-wide">
                  {block.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Our Spaces (Reused from Home) */}
        <div className="bg-transparent py-8 md:py-10">
          <div className="max-w-7xl mx-auto px-4 md:px-12">
            <h2 className="font-serif text-neutral-900 text-2xl md:text-3xl text-center uppercase mb-6 tracking-widest">
              OUR SPACES
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Manual Spaces rendering to match the design exactly without altering global SpacesSection */}
              <div className="relative aspect-[3/4] overflow-hidden group cursor-pointer shadow-md max-w-sm mx-auto w-full">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('/zion/684222572_17948428422152473_4013856636383990076_n.jpg')" }} />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white drop-shadow-md">
                  <h3 className="font-script text-3xl md:text-4xl text-center leading-tight">The<br/>glass hall</h3>
                </div>
              </div>
              <div className="relative aspect-[3/4] overflow-hidden group cursor-pointer shadow-md max-w-sm mx-auto w-full">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('/zion/ChatGPT Image Jul 2, 2026, 10_19_13 PM.png')" }} />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white drop-shadow-md">
                  <h3 className="font-script text-3xl md:text-4xl text-center leading-tight">The<br/>Pavilion<br/>garden</h3>
                </div>
              </div>
              <div className="relative aspect-[3/4] overflow-hidden group cursor-pointer shadow-md max-w-sm mx-auto w-full">
                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('/zion/620971763_782204770989828_1960603748204775146_n.jpg')" }} />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white drop-shadow-md">
                  <h3 className="font-script text-3xl md:text-4xl text-center leading-tight">The pool</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Our Packages */}
        <div className="w-full bg-transparent py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-12 flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1 flex flex-col items-start text-left md:pr-8">
              <h2 className="text-2xl md:text-3xl font-serif uppercase tracking-widest text-neutral-900 mb-6">
                OUR PACKAGES
              </h2>
              <p className="font-serif text-xl md:text-2xl lg:text-3xl leading-relaxed text-neutral-900 mb-8">
                {packageText}
              </p>
              <button className="px-6 py-2.5 bg-transparent border-[1.5px] border-neutral-900 text-neutral-900 font-serif transition-all hover:bg-[#DFD48A] hover:border-[#DFD48A] hover:text-neutral-900 hover:shadow-[0_0_20px_rgba(223,212,138,0.4)] pointer-events-auto text-sm tracking-widest">
                Reserve Your Moment
              </button>
            </div>
            <div className="flex-1 flex flex-col items-start w-full md:pl-8">
              <p className="font-serif text-lg md:text-xl mb-3 text-neutral-900 tracking-wider">VIEW DETAILS:</p>
              <PackageFlipbook />
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="w-full bg-transparent py-12">
          <h2 className="text-2xl md:text-3xl font-serif tracking-widest text-center text-neutral-900 mb-8 uppercase">
            GALLERY
          </h2>
          <div className="w-full max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {galleryImages.map((src, i) => (
              <div key={i} className="aspect-[3/4] overflow-hidden shadow-sm">
                <img src={src} alt="Gallery image" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            ))}
          </div>
        </div>

      </div>
      )}
    </PublicSubpageShell>
  );
}
