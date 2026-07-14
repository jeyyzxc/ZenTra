'use client';

import React, { useState } from 'react';
import PublicSubpageShell from '@/components/client/PublicSubpageShell';
import FadeIn from '@/components/shared/FadeIn';
import AnimatedDivider from '@/components/shared/AnimatedDivider';

// Define the event categories
type Category = 'All' | 'Weddings' | 'Birthdays' | 'Debuts' | 'Gender Reveal' | 'Christmas Party' | 'Christening';
const categories: Category[] = ['All', 'Weddings', 'Birthdays', 'Debuts', 'Gender Reveal', 'Christmas Party', 'Christening'];

// Define the image data structure
const galleryData = [
  // Weddings
  { id: 1, category: 'Weddings', src: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop', alt: 'Wedding Ceremony Setup' },
  { id: 2, category: 'Weddings', src: '/zion/684222572_17948428422152473_4013856636383990076_n.jpg', alt: 'Wedding Reception Decor' },
  { id: 3, category: 'Weddings', src: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop', alt: 'Wedding Details' },
  { id: 4, category: 'Weddings', src: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2070&auto=format&fit=crop', alt: 'Wedding Couple' },

  // Birthdays
  { id: 5, category: 'Birthdays', src: 'https://images.unsplash.com/photo-1530103862676-de8892f12703?q=80&w=2070&auto=format&fit=crop', alt: 'Birthday Celebration' },
  { id: 6, category: 'Birthdays', src: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?q=80&w=2069&auto=format&fit=crop', alt: 'Birthday Cake and Decor' },
  { id: 7, category: 'Birthdays', src: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=2070&auto=format&fit=crop', alt: 'Birthday Party Setup' },

  // Debuts
  { id: 8, category: 'Debuts', src: 'https://images.unsplash.com/photo-1542614471-001ccf2bb8cb?q=80&w=2070&auto=format&fit=crop', alt: 'Debutante Gown' },
  { id: 9, category: 'Debuts', src: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?q=80&w=2162&auto=format&fit=crop', alt: 'Debut Celebration Lights' },
  { id: 10, category: 'Debuts', src: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop', alt: 'Debut Venue Setup' },

  // Gender Reveal
  { id: 11, category: 'Gender Reveal', src: 'https://images.unsplash.com/photo-1596770289871-38290378b2d1?q=80&w=2070&auto=format&fit=crop', alt: 'Gender Reveal Balloons' },
  { id: 12, category: 'Gender Reveal', src: 'https://images.unsplash.com/photo-1543419997-7690a2a53716?q=80&w=2070&auto=format&fit=crop', alt: 'Gender Reveal Party Box' },

  // Christmas Party
  { id: 13, category: 'Christmas Party', src: 'https://images.unsplash.com/photo-1512474932049-78ac69ede12c?q=80&w=2070&auto=format&fit=crop', alt: 'Christmas Party Table' },
  { id: 14, category: 'Christmas Party', src: 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?q=80&w=2070&auto=format&fit=crop', alt: 'Christmas Celebration' },

  // Christening
  { id: 15, category: 'Christening', src: 'https://images.unsplash.com/photo-1555529733-0e67056058bb?q=80&w=2070&auto=format&fit=crop', alt: 'Christening Decor' },
  { id: 16, category: 'Christening', src: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?q=80&w=2075&auto=format&fit=crop', alt: 'Baby Toys and Decor' },
];

export default function GalleryFallback() {
  const [activeFilter, setActiveFilter] = useState<Category>('All');

  // Filter categories to render rows for
  const categoriesToRender = activeFilter === 'All'
    ? categories.filter(c => c !== 'All')
    : [activeFilter];

  return (
    <PublicSubpageShell heroKey="gallery">

      <section className="max-w-7xl mx-auto px-4 md:px-12 py-16 md:py-24 w-full">

        {/* Elegant Filter Bar */}
        <FadeIn direction="up" className="flex flex-col items-center mb-16 md:mb-24">
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 pb-4 border-b border-[#D6B53B]/20 w-full max-w-4xl">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveFilter(category)}
                className={`relative pb-4 font-sans text-xs md:text-sm uppercase tracking-[0.2em] transition-all duration-500 ${
                  activeFilter === category
                    ? 'text-[#D6B53B] font-bold'
                    : 'text-neutral-500 hover:text-[#1a1f18]'
                }`}
              >
                {category}
                {activeFilter === category && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#D6B53B] shadow-[0_0_10px_rgba(214,181,59,0.5)] transform translate-y-[1px]"></div>
                )}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* Categorized Image Rows */}
        <div className="flex flex-col gap-24 md:gap-32">
          {categoriesToRender.map((cat) => {
            const allImagesForCategory = galleryData.filter(img => img.category === cat);
            const isAllView = activeFilter === 'All';
            const imagesForCategory = isAllView ? allImagesForCategory.slice(0, 3) : allImagesForCategory;
            const hasMore = isAllView && allImagesForCategory.length > 3;
            const extraCount = allImagesForCategory.length - 3;

            // Skip empty categories
            if (allImagesForCategory.length === 0) return null;

            return (
              <div key={cat} className="flex flex-col gap-10 md:gap-16">

                {/* Centered Row Header with Home Page Lines */}
                <FadeIn direction="up" className="flex flex-col items-center text-center">
                  <div className="group relative flex items-center justify-center gap-4 md:gap-6 cursor-default mb-4">
                    {/* Left line */}
                    <div className="h-[1.5px] w-12 md:w-24 bg-gradient-to-r from-transparent to-[#D6B53B]/80 transition-all duration-700 ease-out opacity-70 group-hover:opacity-100" />
                    
                    <h2 className="text-4xl md:text-6xl font-sahitya text-[#1a1f18] transition-all duration-700 ease-out">{cat}</h2>
                    
                    {/* Right line */}
                    <div className="h-[1.5px] w-12 md:w-24 bg-gradient-to-l from-transparent to-[#D6B53B]/80 transition-all duration-700 ease-out opacity-70 group-hover:opacity-100" />
                  </div>
                  <p className="font-serif text-lg text-neutral-500 italic max-w-xl">
                    {cat === 'Weddings' ? 'A collection of timeless and elegant moments.' :
                     cat === 'Birthdays' ? 'Celebrating milestones with joy and style.' :
                     cat === 'Debuts' ? 'Stepping into a new chapter with grace.' :
                     cat === 'Gender Reveal' ? 'Beautiful reveals that capture the anticipation.' :
                     cat === 'Christmas Party' ? 'Festive gatherings filled with warmth and cheer.' :
                     cat === 'Christening' ? 'A sacred beginning embraced by loved ones.' :
                     'A showcase of our unforgettable events.'}
                  </p>
                </FadeIn>

                {/* Premium Image Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {imagesForCategory.map((img, idx) => {
                    const isLast = idx === 2 && hasMore;

                    return (
                      <FadeIn key={img.id} direction="up" delay={idx * 100}>
                        <div 
                          onClick={() => {
                            if (isLast) setActiveFilter(cat);
                          }}
                          className="relative group overflow-hidden rounded-2xl shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(214,181,59,0.3)] transition-all duration-700 aspect-[4/3] bg-neutral-100 cursor-pointer"
                        >
                          <img
                            src={img.src}
                            alt={img.alt}
                            className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-[1.04] ${isLast ? 'scale-105 blur-[2px]' : ''}`}
                          />
                          {/* Premium Overlay */}
                          <div className={`absolute inset-0 transition-opacity duration-700 flex flex-col justify-end p-8 ${
                            isLast 
                              ? 'bg-black/40 opacity-100 items-center justify-center' 
                              : 'bg-gradient-to-t from-[#1a1f18]/80 via-[#1a1f18]/10 to-transparent opacity-0 group-hover:opacity-100'
                          }`}>
                            {isLast ? (
                              <div className="text-center transform transition-transform duration-700 hover:scale-110 flex flex-col items-center justify-center h-full">
                                <h3 className="font-sans text-white text-sm tracking-[0.2em] uppercase font-bold mb-3">View All {cat}</h3>
                                <div className="w-12 h-[2px] bg-[#D6B53B]"></div>
                              </div>
                            ) : (
                              <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                                <h3 className="font-sans text-white text-xs tracking-[0.2em] uppercase font-bold mb-3">View Image</h3>
                                <div className="w-10 h-[2px] bg-[#D6B53B]"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </FadeIn>
                    );
                  })}
                </div>

                {/* Show Less / Go Back Button */}
                {!isAllView && (
                  <FadeIn direction="up" className="flex justify-center mt-8">
                    <button
                      onClick={() => setActiveFilter('All')}
                      className="group relative inline-flex items-center gap-4 px-10 py-4 bg-transparent border border-[#1a1f18] text-[#1a1f18] font-sans text-sm font-bold uppercase tracking-widest overflow-hidden rounded-full transition-all hover:border-[#D6B53B]"
                    >
                      <div className="absolute inset-0 bg-[#1a1f18] transition-transform duration-500 ease-in-out -translate-x-full group-hover:translate-x-0" />
                      <span className="relative z-10 transition-colors duration-500 group-hover:text-white">Back to Gallery</span>
                    </button>
                  </FadeIn>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </PublicSubpageShell>
  );
}
