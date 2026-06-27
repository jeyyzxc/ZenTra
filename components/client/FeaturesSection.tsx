import React from 'react';

const galleryImages = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1530103862676-de8892ebeea6?q=80&w=800&auto=format&fit=crop',
];

export default function FeaturesSection() {
  return (
    <section className="bg-transparent w-full px-4 py-16 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="font-serif text-neutral-900 text-xl md:text-2xl uppercase tracking-widest mb-1">
            OUR EVENT FEATURES
          </h2>
          <p className="font-serif text-neutral-900 text-sm opacity-80">
            Celebrate your dream event with us.
          </p>
        </div>

        {/* 2 Column Bento Grid */}
        <div className="flex flex-col md:flex-row gap-3 md:h-[500px] lg:h-[650px] mb-4">
          
          {/* Left Column (3 equal rows) */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="relative rounded-2xl overflow-hidden group shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all h-40 md:h-auto" style={{ flex: '1' }}>
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1542360663-8f4023704c71?q=80&w=2070&auto=format&fit=crop')" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 group-hover:via-[#D4AF37]/20 transition-all duration-500" />
              <h3 className="absolute bottom-3 left-4 md:bottom-5 md:left-6 font-script text-[#FFFDF8] text-3xl md:text-4xl lg:text-5xl drop-shadow-2xl tracking-wide">Debuts</h3>
            </div>
            
            <div className="relative rounded-2xl overflow-hidden group shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all h-40 md:h-auto" style={{ flex: '1' }}>
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop')" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 group-hover:via-[#D4AF37]/20 transition-all duration-500" />
              <h3 className="absolute bottom-3 left-4 md:bottom-5 md:left-6 font-script text-[#FFFDF8] text-3xl md:text-4xl lg:text-5xl drop-shadow-2xl tracking-wide">Christenings</h3>
            </div>
            
            <div className="relative rounded-2xl overflow-hidden group shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all h-40 md:h-auto" style={{ flex: '1' }}>
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544078754-0a3ce1ad1364?q=80&w=2074&auto=format&fit=crop')" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 group-hover:via-[#D4AF37]/20 transition-all duration-500" />
              <h3 className="absolute bottom-3 left-4 md:bottom-5 md:left-6 font-script text-[#FFFDF8] text-3xl md:text-4xl lg:text-5xl drop-shadow-2xl tracking-wide">Gender Reveal</h3>
            </div>
          </div>

          {/* Right Column (25% / 50% / 25%) */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="relative rounded-2xl overflow-hidden group shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all h-40 md:h-auto" style={{ flex: '3' }}>
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1530103862676-de8892ebeea6?q=80&w=2070&auto=format&fit=crop')" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 group-hover:via-[#D4AF37]/20 transition-all duration-500" />
              <h3 className="absolute bottom-3 left-4 md:bottom-5 md:left-6 font-script text-[#FFFDF8] text-3xl md:text-4xl lg:text-5xl drop-shadow-2xl tracking-wide">Birthdays</h3>
            </div>
            
            <div className="relative rounded-2xl overflow-hidden group shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all h-56 md:h-auto" style={{ flex: '6' }}>
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2069&auto=format&fit=crop')" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 group-hover:via-[#D4AF37]/20 transition-all duration-500" />
              <h3 className="absolute bottom-3 left-4 md:bottom-5 md:left-6 font-script text-[#FFFDF8] text-3xl md:text-4xl lg:text-5xl drop-shadow-2xl tracking-wide">Weddings</h3>
            </div>
            
            <div className="relative rounded-2xl overflow-hidden group shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all h-40 md:h-auto" style={{ flex: '3' }}>
              <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1543362906-acfc16c67564?q=80&w=1965&auto=format&fit=crop')" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/90 group-hover:via-[#D4AF37]/20 transition-all duration-500" />
              <h3 className="absolute bottom-3 left-4 md:bottom-5 md:left-6 font-script text-[#FFFDF8] text-3xl md:text-4xl lg:text-5xl drop-shadow-2xl tracking-wide">Christmas Parties</h3>
            </div>
          </div>

        </div>

        {/* 4 Vertical Images below */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
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

