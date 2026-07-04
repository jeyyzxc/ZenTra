import React, { useEffect, useState } from 'react';
import { BookFormData } from './BookFlow';

interface Props {
  data: BookFormData;
  updateData: (fields: Partial<BookFormData>) => void;
  nextStep: () => void;
}

type PublicEventCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImageUrl: string | null;
  activePackageCount: number;
};

export default function Step1EventType({ data, updateData, nextStep }: Props) {
  const [eventCategories, setEventCategories] = useState<PublicEventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/client/event-categories', { cache: 'no-store' });
        const payload = await response.json() as {
          data?: PublicEventCategory[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || 'Unable to load event categories.');
        }

        if (!cancelled) {
          setEventCategories(payload.data ?? []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load event categories.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-[#D6B53B]/20 border-t-[#D6B53B] shadow-[0_0_15px_rgba(214,181,59,0.2)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl rounded-[2rem] border border-red-200/50 bg-red-50/80 px-8 py-6 text-center shadow-lg backdrop-blur-md">
        <p className="font-serif text-xl text-red-800">{error}</p>
      </div>
    );
  }

  if (eventCategories.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-[2rem] border border-[#D6B53B]/30 bg-white/60 px-8 py-6 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] backdrop-blur-xl">
        <p className="font-serif text-xl text-[#2F3E32]">No event categories are available for booking right now.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-full px-4 pb-8">
      {/* Decorative background glow behind the grid */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(253,235,158,0.15),transparent_60%)] blur-3xl" />

      <div className="flex flex-wrap justify-center gap-6 lg:gap-8">
        {eventCategories.map((event) => {
          const isSelected = data.eventCategoryId === event.id;

          return (
            <div
              key={event.id}
              onClick={() => {
                updateData({
                  eventType: event.name,
                  eventCategoryId: event.id,
                  eventCategorySlug: event.slug,
                });
                // Slightly longer timeout to allow the luxurious animation to register
                setTimeout(nextStep, 350);
              }}
              className={`group relative overflow-hidden rounded-[2rem] h-[200px] w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.5rem)] cursor-pointer transition-all duration-300 ease-out border-2 ${
                isSelected
                  ? 'border-[#FDEB9E] bg-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.06)] scale-[1.02]'
                  : 'border-transparent bg-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.8),0_0_50px_rgba(214,181,59,0.7),inset_0_0_15px_rgba(255,255,255,0.5)] hover:ring-4 hover:ring-[#FDEB9E]/50 hover:scale-[1.05] hover:z-50 hover:brightness-105'
              }`}
            >
              {/* Background Image with Slow Zoom on Hover */}
              <div
                className={`absolute inset-0 bg-cover bg-center transition-transform duration-[1.5s] ease-out ${
                  isSelected ? 'scale-105' : 'scale-100'
                }`}
                style={{
                  backgroundImage: `url("${event.coverImageUrl || 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop'}")`,
                }}
              />

              {/* Elegant Gradient Overlay */}
              <div
                className={`absolute inset-0 transition-opacity duration-700 ${
                  isSelected
                    ? 'bg-gradient-to-t from-black/95 via-black/60 to-black/30 opacity-100'
                    : 'bg-gradient-to-t from-black via-black/70 to-black/40 opacity-100 group-hover:opacity-100 group-hover:from-black/90 group-hover:via-black/60'
                }`}
              />

              {/* Content Container */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-8 text-center">
                <div className="flex flex-col items-center transform transition-transform duration-500 ease-out">
                  <h3 className="font-serif italic text-[1.75rem] md:text-[2.25rem] leading-tight font-light tracking-wider text-[#FDFCEE] drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)] mb-5 transition-all duration-500 group-hover:text-white group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] group-hover:-translate-y-1">
                    {event.name}
                  </h3>

                  {/* Badges Container */}
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <span className="font-sans rounded-full border border-white/20 bg-black/20 px-5 py-2 text-[10px] sm:text-[11px] font-light uppercase tracking-[0.2em] text-[#EAE6D1] backdrop-blur-md transition-all duration-500 group-hover:border-white/40 group-hover:bg-white/10 group-hover:text-white">
                      {event.activePackageCount} Packages
                    </span>

                    {isSelected && (
                      <span className="rounded-full border border-[#FDEB9E]/50 bg-[#FDEB9E] px-4 py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.15em] text-[#1a1f18] shadow-[0_0_15px_rgba(253,235,158,0.5)] animate-[fadeIn_0.3s_ease-out]">
                        Selected
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Subtle inner ring for glass effect */}
              <div className="pointer-events-none absolute inset-0 rounded-[2rem] border border-white/10" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
