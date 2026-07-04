'use client';

import React, { useState } from 'react';
import SubpageHero from '@/components/client/SubpageHero';
import FadeIn from '@/components/shared/FadeIn';

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

export default function GalleryPage() {
  const [activeFilter, setActiveFilter] = useState<Category>('All');

  // Filter categories to render rows for
  const categoriesToRender = activeFilter === 'All'
    ? categories.filter(c => c !== 'All')
    : [activeFilter];

  return (
    <main className="flex flex-col min-h-screen bg-[#faf9f6]">
      <SubpageHero
        title="A Glimpse of Perfection"
        subtitle="Explore our stunning gallery of past events, from luxurious weddings to grand debuts. Let these moments inspire your own unforgettable celebration at Zion."
        imageSrc="/zion/684222572_17948428422152473_4013856636383990076_n.jpg"
      />

      <section className="max-w-7xl mx-auto px-4 md:px-12 py-16 md:py-24 w-full">

        {/* Filter Bar */}
        <FadeIn direction="up">
          <div className="flex flex-wrap justify-center gap-4 mb-16 md:mb-24">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveFilter(category)}
                className={`px-8 py-3 rounded-full font-serif text-sm md:text-base transition-all duration-300 border border-[#D6B53B] ${
                  activeFilter === category
                    ? 'bg-[#D6B53B] text-white shadow-lg scale-105'
                    : 'bg-transparent text-[#1a1f18] hover:bg-[#D6B53B]/10'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* Categorized Image Rows */}
        <div className="flex flex-col gap-20 md:gap-32">
          {categoriesToRender.map((cat) => {
            const imagesForCategory = galleryData.filter(img => img.category === cat);

            // Skip empty categories
            if (imagesForCategory.length === 0) return null;

            return (
              <div key={cat} className="flex flex-col gap-8 md:gap-12">

                {/* Row Header */}
                <FadeIn direction="up">
                  <div className="inline-flex items-center gap-4">
                    <h2 className="text-3xl md:text-5xl font-sahitya text-[#1a1f18]">{cat}</h2>
                    <div className="flex-1 h-[1px] bg-gradient-to-r from-[#D6B53B]/50 to-transparent min-w-[50px] md:min-w-[150px]"></div>
                  </div>
                </FadeIn>

                {/* Masonry/Grid of Images */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {imagesForCategory.map((img, idx) => (
                    <FadeIn key={img.id} direction="up" delay={idx * 100}>
                      <div className="relative group overflow-hidden rounded-2xl shadow-md aspect-[4/3] bg-neutral-200">
                        <img
                          src={img.src}
                          alt={img.alt}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500"></div>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
