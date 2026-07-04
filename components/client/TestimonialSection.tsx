'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, MessageSquareQuote, Star } from 'lucide-react';
import type { PublicTestimony } from '@/app/testimonies/types';

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-1" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`h-5 w-5 ${star <= value ? 'fill-[#D6B53B] text-[#D6B53B]' : 'text-neutral-300'}`} />
      ))}
    </span>
  );
}

export default function TestimonialSection() {
  const [testimonies, setTestimonies] = useState<PublicTestimony[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch('/api/client/testimonies/featured?limit=6', { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload: { testimonies?: PublicTestimony[] }) => {
        if (active) setTestimonies(payload.testimonies ?? []);
      })
      .catch(() => {
        if (active) setTestimonies([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const move = useCallback((direction: 1 | -1) => {
    setActiveIndex((current) => {
      if (!testimonies.length) return 0;
      return (current + direction + testimonies.length) % testimonies.length;
    });
  }, [testimonies.length]);

  useEffect(() => {
    if (isPaused || testimonies.length < 2) return;
    const interval = window.setInterval(() => move(1), 5000);
    return () => window.clearInterval(interval);
  }, [isPaused, move, testimonies.length]);

  const testimony = testimonies[activeIndex];

  return (
    <section className="w-full px-4 py-12 md:px-12">
      <div
        className="relative mx-auto flex max-w-5xl flex-col items-center overflow-hidden rounded-[3rem] border border-[#DFD48A]/30 bg-gradient-to-br from-[#FBF4C4]/95 via-white/95 to-white/95 px-7 py-12 text-center shadow-[0_18px_60px_rgba(0,0,0,0.06)] backdrop-blur-sm md:px-20 md:py-16"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#8E7722]">Celebrated at Zion</p>
        <h2 className="mt-3 font-script text-5xl text-neutral-900 drop-shadow-sm md:text-7xl">Testimonies</h2>

        {testimony ? (
          <>
            <button type="button" onClick={() => move(-1)} className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-neutral-700 shadow-sm transition hover:bg-white hover:text-[#D4AF37] md:left-8" aria-label="Previous testimony">
              <ChevronLeft className="h-7 w-7" />
            </button>
            <button type="button" onClick={() => move(1)} className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-neutral-700 shadow-sm transition hover:bg-white hover:text-[#D4AF37] md:right-8" aria-label="Next testimony">
              <ChevronRight className="h-7 w-7" />
            </button>

            <div key={testimony.id} className="mt-8 max-w-3xl animate-[fadeInUp_500ms_ease-out] px-8 md:px-12">
              <Stars value={testimony.overallRating} />
              <MessageSquareQuote className="mx-auto mt-5 h-9 w-9 text-[#D6B53B]/60" />
              <p className="mt-4 line-clamp-4 font-serif text-lg leading-8 text-neutral-700 md:text-xl">
                “{testimony.comment}”
              </p>
              <p className="mt-7 font-sahitya text-xl font-bold text-[#1a1f18]">{testimony.clientName}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">{testimony.eventType}</p>
            </div>

            <div className="mt-7 flex gap-2">
              {testimonies.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-2 rounded-full transition-all ${index === activeIndex ? 'w-7 bg-[#D6B53B]' : 'w-2 bg-neutral-300 hover:bg-neutral-400'}`}
                  aria-label={`Show testimony ${index + 1}`}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="mt-8 max-w-xl">
            <MessageSquareQuote className="mx-auto h-10 w-10 text-[#D6B53B]/70" />
            <p className="mt-4 font-serif text-lg leading-7 text-neutral-600">Your story belongs here. Share your unforgettable Zion experience.</p>
          </div>
        )}

        <Link href="/testimonies" className="mt-8 rounded-full border border-[#1a1f18] px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[#1a1f18] transition hover:border-[#D6B53B] hover:bg-[#D6B53B]">
          Read all testimonies
        </Link>
      </div>
    </section>
  );
}
