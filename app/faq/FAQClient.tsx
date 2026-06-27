'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bot, ChevronDown, MessageCircle, Search } from 'lucide-react';

type PublicFaq = {
  id: string;
  question: string;
  answer: string;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  tags: string[];
  relatedModule: string;
  priority: number;
  createdAt: string;
  updatedAt: string;
};

type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  entryCount: number;
};

async function readJson<T>(response: Response, fallback: string): Promise<T> {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload.error === 'string' ? payload.error : fallback);
  return payload as T;
}

export default function FAQClient() {
  const [faqs, setFaqs] = useState<PublicFaq[]>([]);
  const [popular, setPopular] = useState<PublicFaq[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: '50' });
    if (search.trim()) params.set('search', search.trim());
    if (category) params.set('category', category);
    return params.toString();
  }, [category, search]);

  useEffect(() => {
    let active = true;
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setError('');
      try {
        const payload = await readJson<{ faqs: PublicFaq[] }>(
          await fetch(`/api/client/faqs?${query}`, { cache: 'no-store' }),
          'Unable to load support answers.',
        );
        if (!active) return;
        setFaqs(payload.faqs);
        setOpenId((current) => current && payload.faqs.some((faq) => faq.id === current)
          ? current
          : payload.faqs[0]?.id ?? null);
      } catch (caughtError) {
        if (active) setError(caughtError instanceof Error ? caughtError.message : 'Unable to load support answers.');
      } finally {
        if (active) setIsLoading(false);
      }
    }, 180);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    let active = true;
    async function loadOptions() {
      try {
        const [categoryPayload, popularPayload] = await Promise.all([
          readJson<{ categories: PublicCategory[] }>(
            await fetch('/api/client/faqs/categories', { cache: 'no-store' }),
            'Unable to load FAQ categories.',
          ),
          readJson<{ faqs: PublicFaq[] }>(
            await fetch('/api/client/faqs/popular?limit=5', { cache: 'no-store' }),
            'Unable to load popular FAQs.',
          ),
        ]);
        if (!active) return;
        setCategories(categoryPayload.categories);
        setPopular(popularPayload.faqs);
      } catch {
        if (active) {
          setCategories([]);
          setPopular([]);
        }
      }
    }
    void loadOptions();
    return () => {
      active = false;
    };
  }, []);

  const openAssistant = () => {
    document.getElementById('zeni-fab')?.click();
  };

  const related = openId
    ? faqs.filter((faq) => faq.id !== openId && faq.categorySlug === faqs.find((item) => item.id === openId)?.categorySlug).slice(0, 3)
    : [];

  return (
    <div className="w-full relative z-10 bg-[#FBF4C4] pb-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 pt-16 lg:grid-cols-[1fr_320px]">
        <section className="flex flex-col items-center">
          <h2 className="mb-10 text-center font-sahitya text-4xl italic text-[#3A4B3C] md:text-5xl">
            Frequently Asked Questions
          </h2>

          <div className="mb-5 flex w-full flex-col gap-3 rounded-[1.5rem] border border-[#D4AF37]/20 bg-white/60 p-3 shadow-sm backdrop-blur-sm md:flex-row">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-[#3A4B3C]/60" />
              <input
                type="text"
                placeholder="Looking for something?"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-full border border-transparent bg-[#EAE6D1] py-3 pl-12 pr-5 font-serif text-base text-[#3A4B3C] outline-none placeholder:text-[#3A4B3C]/60 focus:border-[#D4AF37]"
              />
            </label>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-full border border-transparent bg-[#EAE6D1] px-5 py-3 font-serif text-base text-[#3A4B3C] outline-none focus:border-[#D4AF37] md:w-64">
              <option value="">All categories</option>
              {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
            </select>
          </div>

          {error && <div className="mb-5 w-full rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">{error}</div>}

          <div className="flex w-full flex-col gap-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-[1.5rem] bg-[#DDD181]/60" />
              ))
            ) : faqs.length === 0 ? (
              <div className="rounded-[1.5rem] border border-[#D4AF37]/20 bg-white/70 px-8 py-12 text-center shadow-sm">
                <p className="font-serif text-xl text-[#3A4B3C]">No approved answer matched your search.</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Link href="/contact" className="inline-flex items-center gap-2 rounded-full border border-[#3A4B3C] px-5 py-2.5 text-sm font-bold uppercase tracking-[0.16em] text-[#3A4B3C] hover:bg-[#DDD181]">
                    <MessageCircle className="h-4 w-4" />
                    Contact Us
                  </Link>
                  <button type="button" onClick={openAssistant} className="inline-flex items-center gap-2 rounded-full bg-[#3A4B3C] px-5 py-2.5 text-sm font-bold uppercase tracking-[0.16em] text-white hover:bg-[#D4AF37] hover:text-[#1A1A1A]">
                    <Bot className="h-4 w-4" />
                    Ask Smart Assistant
                  </button>
                </div>
              </div>
            ) : faqs.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <article key={faq.id} className="overflow-hidden rounded-[1.5rem] bg-[#DDD181] shadow-sm transition-colors hover:bg-[#D2CB96]">
                  <button type="button" onClick={() => setOpenId(isOpen ? null : faq.id)} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
                    <span>
                      <span className="block font-serif text-xl text-black md:text-2xl">{faq.question}</span>
                      {faq.categoryName && <span className="mt-1 block text-xs font-bold uppercase tracking-[0.14em] text-black/55">{faq.categoryName}</span>}
                    </span>
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-black transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                      <ChevronDown className="h-6 w-6 text-black" />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-black/10 bg-white/50 px-6 py-5">
                      <p className="whitespace-pre-wrap font-serif text-lg leading-8 text-[#1A1A1A]">{faq.answer}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {related.length > 0 && (
            <div className="mt-8 w-full rounded-[1.5rem] border border-[#D4AF37]/20 bg-white/65 p-5 shadow-sm">
              <h3 className="font-sahitya text-2xl font-bold text-[#3A4B3C]">Related Questions</h3>
              <div className="mt-4 flex flex-col gap-2">
                {related.map((faq) => (
                  <button key={faq.id} type="button" onClick={() => setOpenId(faq.id)} className="rounded-xl bg-[#FBF4C4] px-4 py-3 text-left text-sm font-semibold text-[#3A4B3C] hover:bg-[#DDD181]">
                    {faq.question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-[1.5rem] border border-[#D4AF37]/20 bg-white/70 p-5 shadow-sm">
            <h3 className="font-sahitya text-2xl font-bold text-[#3A4B3C]">Popular Questions</h3>
            <div className="mt-4 flex flex-col gap-2">
              {popular.length ? popular.map((faq) => (
                <button key={faq.id} type="button" onClick={() => { setSearch(''); setCategory(''); setOpenId(faq.id); }} className="rounded-xl bg-[#FBF4C4] px-4 py-3 text-left text-sm font-semibold text-[#3A4B3C] hover:bg-[#DDD181]">
                  {faq.question}
                </button>
              )) : <p className="text-sm text-[#3A4B3C]/70">Popular answers will appear after FAQs are published.</p>}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-[#D4AF37]/20 bg-white/70 p-5 shadow-sm">
            <h3 className="font-sahitya text-2xl font-bold text-[#3A4B3C]">Need More Help?</h3>
            <div className="mt-4 flex flex-col gap-3">
              <button type="button" onClick={openAssistant} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3A4B3C] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white hover:bg-[#D4AF37] hover:text-[#1A1A1A]">
                <Bot className="h-4 w-4" />
                Ask Smart Assistant
              </button>
              <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#3A4B3C] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-[#3A4B3C] hover:bg-[#DDD181]">
                <MessageCircle className="h-4 w-4" />
                Contact Us
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
