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
      <div className="flex min-h-[280px] w-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D4A017]/30 border-t-[#D4A017]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-center text-red-700">
        <p className="font-serif text-xl">{error}</p>
      </div>
    );
  }

  if (eventCategories.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-[#D2CB96]/40 bg-white/70 px-6 py-5 text-center text-[#3A4B3C]">
        <p className="font-serif text-xl">No event categories are available for booking right now.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 w-full max-w-4xl mx-auto px-4">
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
              setTimeout(nextStep, 300);
            }}
            className={`relative rounded-3xl overflow-hidden aspect-[4/3] cursor-pointer transition-all duration-300 transform ${
              isSelected ? 'scale-105 shadow-2xl ring-4 ring-[#4CAF50] ring-offset-4 ring-offset-[#EAE5C3]' : 'hover:scale-105 shadow-md hover:shadow-xl'
            }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
              style={{ backgroundImage: `url("${event.coverImageUrl || 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop'}")` }}
            />
            <div className={`absolute inset-0 transition-colors duration-300 ${isSelected ? 'bg-black/20' : 'bg-black/45 hover:bg-black/35'}`} />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <h3 className="text-white text-3xl md:text-4xl font-sahitya text-center drop-shadow-md">
                {event.name}
              </h3>
              <p className="mt-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white backdrop-blur">
                {event.activePackageCount} offers
              </p>
            </div>

            {isSelected && (
              <div className="absolute top-4 right-4 bg-[#4CAF50] w-10 h-10 rounded-full flex items-center justify-center shadow-lg transform transition-transform scale-in">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
