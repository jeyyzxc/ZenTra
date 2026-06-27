'use client';

import React, { FormEvent, useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';

const EVENT_TYPES = [
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
  fullName: '',
  email: '',
  phoneNumber: '',
  preferredContactTime: '',
  eventInterest: '',
  packageInterest: '',
  message: '',
};

const inputClass = 'w-full rounded-full border border-[#D4AF37]/20 bg-white/60 px-5 py-3 text-sm font-sans text-neutral-900 shadow-sm outline-none backdrop-blur-sm transition-all duration-300 placeholder:text-neutral-500 focus:border-[#D4AF37] focus:bg-white focus:ring-2 focus:ring-[#D4AF37]/40 hover:shadow-md';

export default function InquiryForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const setField = (key: keyof typeof EMPTY_FORM, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/client/inquiries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sourcePage: 'contact_us',
        }),
      });
      const payload = await response.json() as {
        error?: string;
        message?: string;
        inquiryReference?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to submit your inquiry. Please check your details and try again.');
      }

      setSuccess(payload.message || 'Your inquiry has been submitted successfully.');
      setForm(EMPTY_FORM);
    } catch (caughtError) {
      setError(caughtError instanceof Error
        ? caughtError.message
        : 'Unable to submit your inquiry. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="relative z-10 flex w-full flex-col gap-4" onSubmit={submit}>
      <input
        required
        maxLength={180}
        type="text"
        autoComplete="name"
        placeholder="Full Name"
        value={form.fullName}
        onChange={(event) => setField('fullName', event.target.value)}
        className={inputClass}
      />
      <input
        required
        maxLength={255}
        type="email"
        autoComplete="email"
        placeholder="Email Address"
        value={form.email}
        onChange={(event) => setField('email', event.target.value)}
        className={inputClass}
      />
      <input
        required
        maxLength={40}
        type="tel"
        autoComplete="tel"
        placeholder="Phone Number"
        value={form.phoneNumber}
        onChange={(event) => setField('phoneNumber', event.target.value)}
        className={inputClass}
      />
      <input
        maxLength={100}
        type="text"
        placeholder="Preferred Contact Time (optional)"
        value={form.preferredContactTime}
        onChange={(event) => setField('preferredContactTime', event.target.value)}
        className={inputClass}
      />
      <select
        value={form.eventInterest}
        onChange={(event) => setField('eventInterest', event.target.value)}
        className={`${inputClass} appearance-none text-neutral-600`}
        aria-label="Event interest"
      >
        <option value="">Event Interest (optional)</option>
        {EVENT_TYPES.map((eventType) => <option key={eventType}>{eventType}</option>)}
      </select>
      <input
        maxLength={255}
        type="text"
        placeholder="Package Interest (optional)"
        value={form.packageInterest}
        onChange={(event) => setField('packageInterest', event.target.value)}
        className={inputClass}
      />
      <textarea
        required
        minLength={10}
        maxLength={3000}
        placeholder="Message"
        value={form.message}
        onChange={(event) => setField('message', event.target.value)}
        className="min-h-[140px] w-full resize-none rounded-2xl border border-[#D4AF37]/20 bg-white/60 px-5 py-4 text-sm font-sans text-neutral-900 shadow-sm outline-none backdrop-blur-sm transition-all duration-300 placeholder:text-neutral-500 focus:border-[#D4AF37] focus:bg-white focus:ring-2 focus:ring-[#D4AF37]/40 hover:shadow-md"
      />

      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="group mt-3 flex w-fit items-center justify-center gap-3 rounded-full bg-neutral-900 px-7 py-3 text-white shadow-[0_10px_20px_rgba(44,51,40,0.2)] transition-all duration-500 hover:-translate-y-1 hover:bg-[#D4AF37] hover:shadow-[0_15px_30px_rgba(212,160,23,0.3)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1" />}
        <span className="text-sm font-serif font-medium tracking-wide">
          {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
        </span>
      </button>
    </form>
  );
}
