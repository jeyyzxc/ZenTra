'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, HelpCircle } from 'lucide-react';

type PreviewFaq = {
  id: string;
  question: string;
  answer: string;
  categoryName: string | null;
};

async function readJson<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : 'Unable to load FAQs.');
  return payload as T;
}

export default function SupportFaqPreview() {
  const [faqs, setFaqs] = useState<PreviewFaq[]>([]);

  useEffect(() => {
    let active = true;
    async function loadFaqs() {
      try {
        const payload = await readJson<{ faqs: PreviewFaq[] }>(
          await fetch('/api/client/faqs/popular?limit=3', { cache: 'no-store' }),
        );
        if (active) setFaqs(payload.faqs);
      } catch {
        if (active) setFaqs([]);
      }
    }
    void loadFaqs();
    return () => {
      active = false;
    };
  }, []);

  if (!faqs.length) return null;

  return (
    <section className="mb-14 rounded-[1.5rem] border border-[#D4AF37]/20 bg-white/60 p-6 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#FBF4C4] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#8E7722]">
            <HelpCircle className="h-3.5 w-3.5" />
            Help Answers
          </div>
          <h2 className="font-sahitya text-3xl font-bold text-neutral-900">Common Questions</h2>
        </div>
        <Link href="/faq" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-[#8E7722] hover:text-[#D4AF37]">
          Full FAQ
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        {faqs.map((faq) => (
          <article key={faq.id} className="rounded-2xl border border-[#D4AF37]/15 bg-white/70 p-4 shadow-sm">
            {faq.categoryName && <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8E7722]">{faq.categoryName}</p>}
            <h3 className="mt-2 font-serif text-lg font-bold text-neutral-900">{faq.question}</h3>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-700">{faq.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
