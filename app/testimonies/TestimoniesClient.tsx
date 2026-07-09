'use client';

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MessageSquareQuote,
  SlidersHorizontal,
  Star,
  X,
} from 'lucide-react';
import type { PublicTestimoniesResponse, PublicTestimony } from './types';

const FALLBACK_EVENT_TYPES = [
  'Wedding Reception',
  'Debut',
  'Birthday',
  'Christening',
  'Gender Reveal',
  'Christmas Party',
  'Anniversary',
  'Reunion',
  'Corporate Event',
  'Custom Event',
];

const EMPTY_FORM = {
  clientName: '',
  email: '',
  eventType: '',
  eventDate: '',
  packageName: '',
  bookingReference: '',
  overallRating: 0,
  approachRating: 0,
  foodRating: 0,
  serviceRating: 0,
  venueRating: 0,
  communicationRating: 0,
  comment: '',
  consent: false,
};

function Stars({ value, size = 'h-4 w-4' }: { value: number; size?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${star <= value ? 'fill-[#D6B53B] text-[#D6B53B]' : 'text-neutral-300'}`}
          strokeWidth={1.8}
        />
      ))}
    </span>
  );
}

function StarInput({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  const ratingLabel = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][display];

  return (
    <fieldset className="rounded-2xl border border-[#D6B53B]/20 bg-[#F9F8F1]/80 p-4">
      <legend className="px-1 text-sm font-bold text-[#1a1f18]">
        {label}{required && <span className="text-red-500"> *</span>}
      </legend>
      <div className="mt-1 flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            className="rounded-md p-1 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#D6B53B]"
            aria-label={`${star} star${star > 1 ? 's' : ''} for ${label}`}
          >
            <Star
              className={`h-7 w-7 ${star <= display ? 'fill-[#D6B53B] text-[#D6B53B]' : 'text-neutral-300'}`}
            />
          </button>
        ))}
        <span className="ml-2 min-w-20 text-xs font-semibold text-neutral-500">
          {ratingLabel || 'Select'}
        </span>
      </div>
    </fieldset>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function RatingDetail({ label, value }: { label: string; value: number | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">{label}</span>
      <Stars value={value} size="h-3.5 w-3.5" />
    </div>
  );
}

function TestimonyCard({ testimony }: { testimony: PublicTestimony }) {
  return (
    <article className="group overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 shadow-[0_18px_60px_rgba(58,75,60,0.08)] backdrop-blur-md transition duration-500 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(142,119,34,0.16)]">
      {testimony.photoUrl && (
        <div className="h-56 overflow-hidden">
          <img
            src={testimony.photoUrl}
            alt={`${testimony.clientName}'s ${testimony.eventType} at Zion Events Place`}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-6 md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-sahitya text-2xl font-bold text-[#1a1f18]">{testimony.clientName}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
              <span>{testimony.eventType}</span>
              <span className="h-1 w-1 rounded-full bg-[#D6B53B]" />
              <span>{formatDate(testimony.eventDate)}</span>
            </p>
          </div>
          <div className="rounded-full border border-[#D6B53B]/25 bg-[#FDF5CC]/75 px-3 py-1.5">
            <Stars value={testimony.overallRating} />
          </div>
        </div>

        {testimony.packageName && (
          <p className="mt-4 inline-flex rounded-full bg-[#3A4B3C]/8 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#3A4B3C]">
            {testimony.packageName}
          </p>
        )}

        <MessageSquareQuote className="mt-6 h-8 w-8 text-[#D6B53B]/60" />
        <p className="mt-3 whitespace-pre-wrap font-serif text-[17px] leading-7 text-neutral-700">
          “{testimony.comment}”
        </p>

        <div className="mt-6 grid grid-cols-1 gap-2 rounded-2xl border border-[#D6B53B]/15 bg-[#F9F8F1]/70 p-4 sm:grid-cols-2">
          <RatingDetail label="Approach" value={testimony.approachRating} />
          <RatingDetail label="Food" value={testimony.foodRating} />
          <RatingDetail label="Service" value={testimony.serviceRating} />
          <RatingDetail label="Venue" value={testimony.venueRating} />
          <RatingDetail label="Communication" value={testimony.communicationRating} />
        </div>
        <p className="mt-4 text-xs text-neutral-400">Shared {formatDate(testimony.submittedAt)}</p>
      </div>
    </article>
  );
}

export default function TestimoniesClient({
  allowSubmissions = true,
  disabledMessage = 'Testimony submissions are temporarily unavailable.',
}: {
  allowSubmissions?: boolean;
  disabledMessage?: string;
}) {
  const [testimonies, setTestimonies] = useState<PublicTestimony[]>([]);
  const [filterOptions, setFilterOptions] = useState<PublicTestimoniesResponse['filterOptions']>({
    eventTypes: FALLBACK_EVENT_TYPES,
    packages: [],
  });
  const [filters, setFilters] = useState({
    eventType: '',
    rating: '',
    sort: 'recent',
    withPhotos: false,
    package: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [photo, setPhoto] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.eventType) params.set('eventType', filters.eventType);
    if (filters.rating) params.set('rating', filters.rating);
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.withPhotos) params.set('withPhotos', 'true');
    if (filters.package) params.set('package', filters.package);
    return params.toString();
  }, [filters]);

  const loadTestimonies = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/client/testimonies?${query}`, { cache: 'no-store' });
      const payload = await response.json() as PublicTestimoniesResponse;
      if (!response.ok) throw new Error(payload.error || 'Unable to load testimonies.');
      setTestimonies(payload.testimonies);
      setFilterOptions({
        eventTypes: payload.filterOptions.eventTypes.length
          ? payload.filterOptions.eventTypes
          : FALLBACK_EVENT_TYPES,
        packages: payload.filterOptions.packages,
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to load testimonies.');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadTestimonies(), 150);
    return () => window.clearTimeout(timeout);
  }, [loadTestimonies]);

  const updateRating = (
    key: 'overallRating' | 'approachRating' | 'foodRating' | 'serviceRating' | 'venueRating' | 'communicationRating',
    value: number,
  ) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');

    if (!allowSubmissions) {
      setSubmitError(disabledMessage);
      return;
    }

    if (!form.overallRating || !form.approachRating || !form.foodRating || !form.serviceRating) {
      setSubmitError('Overall, approach, food, and service ratings are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.set(key, String(value)));
      if (photo) body.set('photo', photo);
      const response = await fetch('/api/client/testimonies', { method: 'POST', body });
      const payload = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to submit testimony.');

      setSuccessMessage(payload.message || 'Thank you for sharing your experience.');
      setForm(EMPTY_FORM);
      setPhoto(null);
      setIsFormOpen(false);
    } catch (caughtError) {
      setSubmitError(caughtError instanceof Error ? caughtError.message : 'Unable to submit testimony.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="relative z-10 mx-auto w-full max-w-7xl px-4 py-12 md:px-12 md:py-20">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#8E7722]">Real celebrations. Real stories.</p>
            <h2 className="mt-3 font-sahitya text-4xl text-[#1a1f18] md:text-5xl">Experiences worth sharing</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              if (allowSubmissions) {
                setIsFormOpen(true);
              } else {
                setSuccessMessage('');
                setSubmitError(disabledMessage);
              }
            }}
            disabled={!allowSubmissions}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1a1f18] px-7 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-[#D6B53B] hover:text-[#1a1f18]"
          >
            <MessageSquareQuote className="h-5 w-5" />
            Share Your Experience
          </button>
        </div>

        {!allowSubmissions && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">
            {disabledMessage}
          </div>
        )}

        <div className="mb-8 rounded-[1.75rem] border border-white/80 bg-white/65 p-4 shadow-sm backdrop-blur-md md:p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-[#3A4B3C]">
            <SlidersHorizontal className="h-4 w-4 text-[#D6B53B]" />
            Browse testimonies
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="relative">
              <span className="sr-only">Event type</span>
              <select
                value={filters.eventType}
                onChange={(event) => setFilters((current) => ({ ...current, eventType: event.target.value }))}
                className="w-full appearance-none rounded-xl border border-[#D6B53B]/20 bg-white px-4 py-3 pr-9 text-sm outline-none focus:border-[#D6B53B]"
              >
                <option value="">All event types</option>
                {filterOptions.eventTypes.map((eventType) => <option key={eventType}>{eventType}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-neutral-400" />
            </label>
            <select
              value={filters.rating}
              onChange={(event) => setFilters((current) => ({ ...current, rating: event.target.value }))}
              className="rounded-xl border border-[#D6B53B]/20 bg-white px-4 py-3 text-sm outline-none focus:border-[#D6B53B]"
            >
              <option value="">All ratings</option>
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star{rating === 1 ? '' : 's'}</option>)}
            </select>
            <select
              value={filters.sort}
              onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}
              className="rounded-xl border border-[#D6B53B]/20 bg-white px-4 py-3 text-sm outline-none focus:border-[#D6B53B]"
            >
              <option value="recent">Most recent</option>
              <option value="highest">Highest rated</option>
            </select>
            <select
              value={filters.package}
              onChange={(event) => setFilters((current) => ({ ...current, package: event.target.value }))}
              className="rounded-xl border border-[#D6B53B]/20 bg-white px-4 py-3 text-sm outline-none focus:border-[#D6B53B]"
            >
              <option value="">All packages</option>
              {filterOptions.packages.map((packageName) => <option key={packageName}>{packageName}</option>)}
            </select>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-[#D6B53B]/20 bg-white px-4 py-3 text-sm font-semibold text-neutral-600">
              With photos
              <input
                type="checkbox"
                checked={filters.withPhotos}
                onChange={(event) => setFilters((current) => ({ ...current, withPhotos: event.target.checked }))}
                className="h-4 w-4 accent-[#8E7722]"
              />
            </label>
          </div>
        </div>

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center">
            <p className="font-bold text-red-700">Unable to load testimonies.</p>
            <p className="mt-1 text-sm text-red-600">Please try again later.</p>
            <button type="button" onClick={() => void loadTestimonies()} className="mt-5 rounded-full bg-red-700 px-5 py-2 text-sm font-bold text-white">
              Try again
            </button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-96 animate-pulse rounded-[2rem] border border-white/70 bg-white/50" />
            ))}
          </div>
        ) : testimonies.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-[#D6B53B]/40 bg-white/50 px-6 py-20 text-center">
            <MessageSquareQuote className="mx-auto h-12 w-12 text-[#D6B53B]" />
            <h3 className="mt-5 font-sahitya text-3xl text-[#1a1f18]">No testimonies yet.</h3>
            <p className="mt-2 text-neutral-600">Be the first to share your Zion Events Place experience.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
            {testimonies.map((testimony) => <TestimonyCard key={testimony.id} testimony={testimony} />)}
          </div>
        )}
      </section>

      {isFormOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/55 px-3 py-6 backdrop-blur-sm">
          <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#D6B53B]/15 bg-white/95 px-6 py-5 backdrop-blur-md md:px-8">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8E7722]">Client testimony</p>
                <h2 className="mt-1 font-sahitya text-3xl text-[#1a1f18]">Share your Zion experience</h2>
                <p className="mt-1 text-sm text-neutral-500">Your feedback is reviewed before it appears publicly.</p>
              </div>
              <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-full bg-neutral-100 p-2 text-neutral-600 hover:bg-neutral-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-6 p-6 md:p-8">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="text-sm font-bold text-[#1a1f18]">
                  Name or nickname <span className="text-red-500">*</span>
                  <input required maxLength={160} value={form.clientName} onChange={(event) => setForm((current) => ({ ...current, clientName: event.target.value }))} className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 font-sans font-normal outline-none focus:border-[#D6B53B]" />
                </label>
                <label className="text-sm font-bold text-[#1a1f18]">
                  Email <span className="font-normal text-neutral-400">(not displayed)</span>
                  <input type="email" maxLength={255} value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 font-sans font-normal outline-none focus:border-[#D6B53B]" />
                </label>
                <label className="text-sm font-bold text-[#1a1f18]">
                  Event type <span className="text-red-500">*</span>
                  <select required value={form.eventType} onChange={(event) => setForm((current) => ({ ...current, eventType: event.target.value }))} className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 font-sans font-normal outline-none focus:border-[#D6B53B]">
                    <option value="">Select event type</option>
                    {filterOptions.eventTypes.map((eventType) => <option key={eventType}>{eventType}</option>)}
                  </select>
                </label>
                <label className="text-sm font-bold text-[#1a1f18]">
                  Event date <span className="text-red-500">*</span>
                  <input required type="date" max={new Date().toISOString().slice(0, 10)} value={form.eventDate} onChange={(event) => setForm((current) => ({ ...current, eventDate: event.target.value }))} className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 font-sans font-normal outline-none focus:border-[#D6B53B]" />
                </label>
                <label className="text-sm font-bold text-[#1a1f18]">
                  Package availed <span className="font-normal text-neutral-400">(optional)</span>
                  <input maxLength={255} value={form.packageName} onChange={(event) => setForm((current) => ({ ...current, packageName: event.target.value }))} className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 font-sans font-normal outline-none focus:border-[#D6B53B]" />
                </label>
                <label className="text-sm font-bold text-[#1a1f18]">
                  Booking reference <span className="font-normal text-neutral-400">(optional)</span>
                  <input maxLength={120} value={form.bookingReference} onChange={(event) => setForm((current) => ({ ...current, bookingReference: event.target.value }))} className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 font-sans font-normal outline-none focus:border-[#D6B53B]" />
                </label>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-[#3A4B3C]">Rate your experience</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <StarInput label="Overall rating" value={form.overallRating} onChange={(value) => updateRating('overallRating', value)} required />
                  <StarInput label="Approach" value={form.approachRating} onChange={(value) => updateRating('approachRating', value)} required />
                  <StarInput label="Food" value={form.foodRating} onChange={(value) => updateRating('foodRating', value)} required />
                  <StarInput label="Service" value={form.serviceRating} onChange={(value) => updateRating('serviceRating', value)} required />
                  <StarInput label="Venue" value={form.venueRating} onChange={(value) => updateRating('venueRating', value)} />
                  <StarInput label="Communication" value={form.communicationRating} onChange={(value) => updateRating('communicationRating', value)} />
                </div>
              </div>

              <label className="block text-sm font-bold text-[#1a1f18]">
                Written testimony <span className="text-red-500">*</span>
                <textarea
                  required
                  minLength={20}
                  maxLength={1000}
                  rows={6}
                  value={form.comment}
                  onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}
                  placeholder="Tell future clients what made your celebration special..."
                  className="mt-2 w-full resize-none rounded-xl border border-neutral-200 px-4 py-3 font-sans font-normal leading-6 outline-none focus:border-[#D6B53B]"
                />
                <span className="mt-1 block text-right text-xs font-normal text-neutral-400">{form.comment.length}/1,000</span>
              </label>

              <label className="flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-[#D6B53B]/40 bg-[#FDF5CC]/25 p-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#8E7722] shadow-sm">
                  <Camera className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-[#1a1f18]">Optional event photo</span>
                  <span className="mt-1 block text-xs text-neutral-500">{photo ? photo.name : 'JPG, PNG, or WebP up to 5 MB'}</span>
                </span>
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} className="sr-only" />
              </label>

              <label className="flex items-start gap-3 rounded-xl bg-neutral-50 p-4 text-sm leading-6 text-neutral-600">
                <input required type="checkbox" checked={form.consent} onChange={(event) => setForm((current) => ({ ...current, consent: event.target.checked }))} className="mt-1 h-4 w-4 flex-shrink-0 accent-[#8E7722]" />
                I consent to Zion Events Place displaying this feedback publicly after moderation. My email will remain private.
              </label>

              {submitError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{submitError}</div>}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-full border border-neutral-200 px-6 py-3 text-sm font-bold text-neutral-600 hover:bg-neutral-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1a1f18] px-7 py-3 text-sm font-bold text-white hover:bg-[#D6B53B] hover:text-[#1a1f18] disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Testimony
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="fixed inset-x-4 bottom-6 z-[170] mx-auto flex max-w-xl items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-2xl">
          <CheckCircle2 className="mt-0.5 h-6 w-6 flex-shrink-0 text-emerald-600" />
          <div className="flex-1">
            <p className="font-bold text-emerald-800">Experience shared</p>
            <p className="mt-1 text-sm text-neutral-600">{successMessage}</p>
          </div>
          <button type="button" onClick={() => setSuccessMessage('')}><X className="h-5 w-5 text-neutral-400" /></button>
        </div>
      )}
    </>
  );
}
