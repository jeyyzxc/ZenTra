"use client";

import React, { useEffect, useState } from 'react';

export interface SlideData {
  title: string;
  subtitle: string;
  imageSrc?: string;
  imageAlt?: string;
}

interface SubpageHeroProps {
  title?: string;
  subtitle?: string;
  imageSrc?: string;
  slides?: readonly SlideData[];
  rotationMs?: number;
  transitionMs?: number;
  pauseOnHover?: boolean;
}

export default function SubpageHero({
  title,
  subtitle,
  imageSrc,
  slides,
  rotationMs = 10000,
  transitionMs = 1000,
  pauseOnHover = true,
}: SubpageHeroProps) {
  const heroSlides = slides && slides.length > 0
    ? slides
    : [{ title: title || '', subtitle: subtitle || '', imageSrc }];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotionPreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener('change', updateMotionPreference);

    return () => mediaQuery.removeEventListener('change', updateMotionPreference);
  }, []);

  useEffect(() => {
    const updateVisibility = () => setIsDocumentVisible(document.visibilityState === 'visible');

    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);

    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  useEffect(() => {
    if (
      heroSlides.length <= 1 ||
      prefersReducedMotion ||
      !isDocumentVisible ||
      (pauseOnHover && isHovered)
    ) {
      return;
    }

    let transitionTimeout: ReturnType<typeof setTimeout> | undefined;

    const interval = setInterval(() => {
      setFade(false);

      transitionTimeout = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % heroSlides.length);
        setFade(true);
      }, transitionMs);

    }, rotationMs);

    return () => {
      clearInterval(interval);
      if (transitionTimeout) clearTimeout(transitionTimeout);
      setFade(true);
    };
  }, [heroSlides.length, isDocumentVisible, isHovered, pauseOnHover, prefersReducedMotion, rotationMs, transitionMs]);

  const currentSlide = heroSlides[currentIndex];

  const selectSlide = (index: number) => {
    setCurrentIndex(index);
    setFade(true);
  };

  return (
    <section
      className="relative z-0 flex h-[65vh] min-h-[500px] w-full flex-col items-center justify-center overflow-hidden bg-transparent px-4 text-center"
      aria-label={`${currentSlide.title}. Slide ${currentIndex + 1} of ${heroSlides.length}.`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Images Container for Seamless Crossfade */}
      {heroSlides.map((slide, index) => (
        <div
          key={`${slide.imageSrc ?? 'hero'}-${index}`}
          aria-hidden="true"
          className={`absolute inset-0 -z-10 h-full w-full bg-cover bg-center grayscale-[20%] transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            backgroundImage: slide.imageSrc ? `url("${slide.imageSrc}")` : undefined,
            transitionDuration: prefersReducedMotion ? '0ms' : `${transitionMs}ms`,
          }}
        />
      ))}

      {/* Light Black Overlay */}
      <div className="absolute inset-0 -z-10 bg-black/50"></div>

      {/* Animated Text Content */}
      <div
        className={`relative z-10 flex w-full flex-col items-center pt-16 transition-opacity duration-1000 ease-in-out ${
          fade ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transitionDuration: prefersReducedMotion ? '0ms' : `${transitionMs}ms` }}
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
            <button
              key={idx}
              type="button"
              aria-label={`Show slide ${idx + 1}`}
              aria-current={idx === currentIndex ? 'true' : undefined}
              onClick={() => selectSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-700 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FDEB9E] ${
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
