import React from 'react';
import Link from 'next/link';

import PublicSubpageShell from '@/components/client/PublicSubpageShell';

export default function RulesFallback() {
  return (
    <PublicSubpageShell heroKey="rules">
      
      <div className="relative z-10 w-full bg-transparent pb-24">
        <div className="mx-auto max-w-5xl px-6 pt-16 md:pt-20">
          <div className="mb-12 text-center font-serif text-neutral-900">
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-neutral-600 md:text-xl">
              These general guidelines help protect guests, suppliers, and the venue. Your signed agreement and the latest instructions from the Zion team remain the final authority for your event.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                title: 'Venue access and approved areas',
                text: 'Use only the spaces included in your confirmed booking. Guests and suppliers should follow on-site signs, staff instructions, and any restricted-area notices.',
              },
              {
                title: 'Supplier setup and pull-out',
                text: 'Coordinate arrival, installation, and removal schedules with the Zion team before event day. Suppliers should not begin work without the agreed access window.',
              },
              {
                title: 'Decorations and venue care',
                text: 'Confirm hanging, fastening, electrical, flame, confetti, and special-effect requirements in advance. Decorations must not damage venue surfaces, landscaping, fixtures, or equipment.',
              },
              {
                title: 'Guest safety and supervision',
                text: 'Keep walkways and exits clear, follow the approved layout, and supervise children around the pool, steps, gardens, and other outdoor areas at all times.',
              },
              {
                title: 'Program, sound, and event timing',
                text: 'Follow the confirmed event schedule and any sound limits or closing arrangements in your agreement. Program changes that affect operations should be raised with the assigned coordinator.',
              },
              {
                title: 'Clean closeout and accountability',
                text: 'Before leaving, suppliers should remove their materials and guests should return any venue property. Report damage, spills, safety issues, or lost items promptly to the Zion team.',
              },
            ].map((rule, index) => (
              <section
                key={rule.title}
                className="rounded-3xl border border-[#D6B53B]/25 bg-white/55 p-7 shadow-sm backdrop-blur-sm md:p-9"
              >
                <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#B69222]">
                  Guideline {index + 1}
                </p>
                <h2 className="mb-4 font-sahitya text-2xl text-[#1a1f18] md:text-3xl">
                  {rule.title}
                </h2>
                <p className="font-serif text-lg leading-relaxed text-neutral-600">
                  {rule.text}
                </p>
              </section>
            ))}
          </div>

          <div className="mt-12 rounded-3xl bg-[#1a1f18] px-7 py-10 text-center text-white md:px-12">
            <h2 className="mb-4 font-sahitya text-3xl md:text-4xl">Need to confirm a venue requirement?</h2>
            <p className="mx-auto mb-7 max-w-2xl font-serif text-lg leading-relaxed text-white/80">
              Contact the Zion team before finalizing suppliers, equipment, or special effects so the correct event-specific guidance can be documented.
            </p>
            <Link
              href="/contact"
              className="inline-flex rounded-full border border-[#FDEB9E] px-8 py-3 text-sm font-bold uppercase tracking-[0.18em] text-[#FDEB9E] transition-colors hover:bg-[#FDEB9E] hover:text-[#1a1f18]"
            >
              Contact Zion
            </Link>
          </div>
        </div>
      </div>
    </PublicSubpageShell>
  );
}
