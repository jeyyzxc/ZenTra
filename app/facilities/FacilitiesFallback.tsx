import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Accessibility, CalendarDays, MapPin, Sparkles } from 'lucide-react';

import PublicSubpageShell from '@/components/client/PublicSubpageShell';

export const metadata: Metadata = {
  title: 'Facilities | Zion Events Place',
  description: 'Explore the indoor and outdoor event spaces available at Zion Events Place in San Pedro, Laguna.',
};

const spaces = [
  {
    name: 'The Glass Hall',
    description: 'A refined indoor setting for ceremonies, receptions, milestone dinners, and programs that benefit from a polished all-weather space.',
    imageSrc: '/zion/684222572_17948428422152473_4013856636383990076_n.jpg',
  },
  {
    name: 'The Pavilion Garden',
    description: 'An open-air venue surrounded by greenery, well suited to garden ceremonies, relaxed gatherings, and celebrations that flow into the outdoors.',
    imageSrc: '/zion/ChatGPT Image Jul 2, 2026, 10_19_13 PM.png',
  },
  {
    name: 'The Pool and Grounds',
    description: 'A distinctive outdoor backdrop for portraits, guest experiences, and event moments shaped by the scenery of Zion.',
    imageSrc: '/zion/620971763_782204770989828_1960603748204775146_n.jpg',
  },
] as const;

export default function FacilitiesFallback() {
  return (
    <PublicSubpageShell heroKey="facilities">
      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 py-16 md:px-12 md:py-24">
        <div className="mx-auto mb-14 max-w-3xl text-center md:mb-20">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-[#B69222]">Explore Zion</p>
          <h2 className="mb-6 font-sahitya text-4xl text-[#1a1f18] md:text-6xl">A Space for Every Part of Your Celebration</h2>
          <p className="font-serif text-lg leading-relaxed text-neutral-600 md:text-xl">
            Choose an indoor setting, an open-air garden, or a combination that supports your event flow. Final access, layout, and availability are confirmed with the Zion team during planning.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {spaces.map((space) => (
            <article
              key={space.name}
              className="group overflow-hidden rounded-3xl border border-white/70 bg-white/55 shadow-[0_18px_50px_-24px_rgba(26,31,24,0.35)] backdrop-blur-sm"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-neutral-200">
                <Image
                  src={space.imageSrc}
                  alt={space.name}
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-7 md:p-8">
                <h3 className="mb-4 font-sahitya text-3xl text-[#1a1f18]">{space.name}</h3>
                <p className="font-serif text-lg leading-relaxed text-neutral-600">{space.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="relative z-10 border-y border-[#D6B53B]/20 bg-white/35 py-14 backdrop-blur-sm md:py-20">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Sparkles, title: 'Flexible styling', text: 'Spaces can support many event themes and arrangements, subject to venue approval.' },
            { icon: Accessibility, title: 'Plan guest access', text: 'Discuss mobility, senior, child, and supplier access needs before confirming the layout.' },
            { icon: MapPin, title: 'San Pedro location', text: 'Visit Zion at Father Masi Street, Holiday Hills, Barangay San Antonio, San Pedro, Laguna.' },
            { icon: CalendarDays, title: 'Verified availability', text: 'Facility access is confirmed against the live event calendar and your chosen package.' },
          ].map((item) => (
            <div key={item.title} className="text-center">
              <item.icon className="mx-auto mb-5 h-8 w-8 text-[#B69222]" strokeWidth={1.5} />
              <h3 className="mb-3 font-sahitya text-2xl text-[#1a1f18]">{item.title}</h3>
              <p className="font-serif leading-relaxed text-neutral-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-6 py-16 text-center md:py-24">
        <h2 className="mb-5 font-sahitya text-4xl text-[#1a1f18] md:text-6xl">See the Spaces in Person</h2>
        <p className="mb-8 max-w-2xl font-serif text-lg leading-relaxed text-neutral-600 md:text-xl">
          Arrange a conversation or site visit before choosing your setup. The team can help confirm which spaces best support your guest experience and event program.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/contact"
            className="rounded-full bg-[#1a1f18] px-9 py-4 text-sm font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#B69222]"
          >
            Plan a Site Visit
          </Link>
          <Link
            href="/book"
            className="rounded-full border border-[#1a1f18] px-9 py-4 text-sm font-bold uppercase tracking-[0.18em] text-[#1a1f18] transition-colors hover:bg-[#1a1f18] hover:text-white"
          >
            Start Planning
          </Link>
        </div>
      </section>
    </PublicSubpageShell>
  );
}
