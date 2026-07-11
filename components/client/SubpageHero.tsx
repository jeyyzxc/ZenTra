"use client";
import React, { useState, useEffect } from 'react';

export interface SlideData {
  title: string;
  subtitle: string;
  imageSrc?: string;
}

interface SubpageHeroProps {
  title?: string;
  subtitle?: string;
  imageSrc?: string;
  slides?: SlideData[];
}

export default function SubpageHero({ title, subtitle, imageSrc, slides }: SubpageHeroProps) {
  const heroSlides = slides && slides.length > 0
    ? slides
    : [{ title: title || '', subtitle: subtitle || '', imageSrc }];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    if (heroSlides.length <= 1) return;

    const interval = setInterval(() => {
      setFade(false); // trigger fade out

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % heroSlides.length);
        setFade(true); // trigger fade in
      }, 1000); // 1-second transition duration

    }, 10000); // 10 seconds per slide

    return () => clearInterval(interval);
  }, [heroSlides.length]);

  const currentSlide = heroSlides[currentIndex];
  const activeImage = currentSlide.imageSrc || imageSrc;

  return (
    <section className="relative z-0 flex h-[65vh] min-h-[500px] w-full flex-col items-center justify-center overflow-hidden bg-transparent px-4 text-center">
      {/* Background Images Container for Seamless Crossfade */}
      {heroSlides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 -z-10 h-full w-full bg-cover bg-center grayscale-[20%] transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url("${slide.imageSrc}")` }}
        />
      ))}

      {/* Light Black Overlay */}
      <div className="absolute inset-0 -z-10 bg-black/50"></div>

      {/* Animated Text Content */}
      <div
        className={`relative z-10 flex w-full flex-col items-center pt-16 transition-opacity duration-1000 ease-in-out ${
          fade ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <h1 className="font-segoe mb-5 max-w-5xl text-center text-[40px] leading-tight text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] md:text-[56px] lg:text-[72px] text-shadow-lg">
          {currentSlide.title}
        </h1>
        <p className="font-serif mx-auto max-w-3xl text-center text-[18px] leading-relaxed tracking-wide text-white drop-shadow-[0_5px_15px_rgba(0,0,0,0.8)] md:text-[22px] lg:text-[24px] text-shadow-lg">
          {currentSlide.subtitle}
        </p>
      </div>

      {/* Elegant Progress Indicators */}
      {heroSlides.length > 1 && (
        <div className="absolute bottom-8 z-10 flex gap-3">
          {heroSlides.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-700 ease-out ${
                idx === currentIndex
                  ? 'w-8 bg-[#FDEB9E] shadow-[0_0_8px_rgba(253,235,158,0.5)]'
                  : 'w-2 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
