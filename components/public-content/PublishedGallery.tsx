'use client';

import { useMemo, useState } from 'react';
import FadeIn from '@/components/shared/FadeIn';
import StructuredContentRenderer from './StructuredContentRenderer';

export type PublishedContentRecord = {
  id: string;
  type: string;
  title: string;
  collection: { id: string; name: string; slug: string } | null;
  version: { payload: unknown } | null;
};

export default function PublishedGallery({ items }: { items: PublishedContentRecord[] }) {
  const categories = useMemo(() => [
    'All',
    ...Array.from(new Set(items.map((item) => item.collection?.name || 'Gallery'))),
  ], [items]);
  const [active, setActive] = useState('All');
  const visible = active === 'All'
    ? items
    : items.filter((item) => (item.collection?.name || 'Gallery') === active);

  return (
    <>
      <div className="mb-12 flex flex-wrap justify-center gap-3 border-b border-[#D6B53B]/20 pb-6">
        {categories.map((category) => (
          <button
            type="button"
            key={category}
            onClick={() => setActive(category)}
            className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${active === category ? 'bg-[#1a1f18] text-[#FDEB9E]' : 'bg-white/60 text-neutral-600 hover:text-[#B69222]'}`}
          >
            {category}
          </button>
        ))}
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((item, index) => (
          <FadeIn key={item.id} direction="up" delay={index * 70}>
            <StructuredContentRenderer type={item.type} payload={item.version?.payload} />
          </FadeIn>
        ))}
      </div>
    </>
  );
}
