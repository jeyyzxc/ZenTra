import React from 'react';

const galleryImages = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1530103862676-de8892ebeea6?q=80&w=800&auto=format&fit=crop',
];

export default function FeaturesSection() {
  return (
    <section className="bg-zentra-bg w-full px-4 py-16 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="font-serif text-[#3A4B3C] text-2xl md:text-3xl uppercase tracking-widest mb-1">
            OUR EVENT FEATURES
          </h2>
          <p className="font-serif text-[#3A4B3C] text-md opacity-80">
            Celebrate your dream event with us.
          </p>
        </div>

        {/* 2 Column Feature Grid */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          
          {/* Left Column */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="relative h-40 md:h-56 rounded-2xl overflow-hidden group shadow-md">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542360663-8f4023704c71?q=80&w=2070&auto=format&fit=crop')" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <h3 className="absolute bottom-4 left-6 font-script text-white text-4xl drop-shadow-lg tracking-wide">Debuts</h3>
            </div>
            
            <div className="relative h-40 md:h-56 rounded-2xl overflow-hidden group shadow-md">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop')" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <h3 className="absolute bottom-4 left-6 font-script text-white text-4xl drop-shadow-lg tracking-wide">Christenings</h3>
            </div>
            
            <div className="relative h-40 md:h-56 rounded-2xl overflow-hidden group shadow-md">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544078754-0a3ce1ad1364?q=80&w=2074&auto=format&fit=crop')" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <h3 className="absolute bottom-4 left-6 font-script text-white text-4xl drop-shadow-lg tracking-wide">Gender Reveal</h3>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="relative h-40 md:h-56 rounded-2xl overflow-hidden group shadow-md">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1530103862676-de8892ebeea6?q=80&w=2070&auto=format&fit=crop')" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <h3 className="absolute bottom-4 left-6 font-script text-white text-4xl drop-shadow-lg tracking-wide">Birthdays</h3>
            </div>
            
            {/* Taller card */}
            <div className="relative h-56 md:h-[18rem] rounded-2xl overflow-hidden group shadow-md">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop')" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <h3 className="absolute bottom-4 left-6 font-script text-white text-5xl drop-shadow-lg tracking-wide">Weddings</h3>
            </div>
            
            <div className="relative h-40 md:h-56 rounded-2xl overflow-hidden group shadow-md">
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1543362906-acfc16c67564?q=80&w=1965&auto=format&fit=crop')" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <h3 className="absolute bottom-4 left-6 font-script text-white text-4xl drop-shadow-lg tracking-wide">Christmas Parties</h3>
            </div>
          </div>

        </div>

        {/* 4 Vertical Images below */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {galleryImages.map((img, i) => (
            <div key={i} className="relative aspect-[3/4] overflow-hidden hover:opacity-90 transition-opacity rounded-sm">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${img}')` }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

