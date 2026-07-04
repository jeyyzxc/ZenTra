"use client";

import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import EventCalendar from '@/components/booking/EventCalendar';

const COUNTRIES = [
  { code: '+63', iso: 'ph', label: 'Philippines', format: '9XX XXX XXXX', regex: /^(\d{0,3})(\d{0,3})(\d{0,4})$/ },
  { code: '+1', iso: 'us', label: 'United States', format: 'XXX XXX XXXX', regex: /^(\d{0,3})(\d{0,3})(\d{0,4})$/ },
  { code: '+44', iso: 'gb', label: 'United Kingdom', format: 'XXXX XXXXXX', regex: /^(\d{0,4})(\d{0,6})$/ },
  { code: '+61', iso: 'au', label: 'Australia', format: '4XX XXX XXX', regex: /^(\d{0,3})(\d{0,3})(\d{0,3})$/ },
  { code: '+65', iso: 'sg', label: 'Singapore', format: 'XXXX XXXX', regex: /^(\d{0,4})(\d{0,4})$/ },
  { code: '+81', iso: 'jp', label: 'Japan', format: 'XX XXXX XXXX', regex: /^(\d{0,2})(\d{0,4})(\d{0,4})$/ },
  { code: '+82', iso: 'kr', label: 'South Korea', format: 'XX XXXX XXXX', regex: /^(\d{0,2})(\d{0,4})(\d{0,4})$/ },
  { code: '+86', iso: 'cn', label: 'China', format: '1XX XXXX XXXX', regex: /^(\d{0,3})(\d{0,4})(\d{0,4})$/ },
  { code: '+971', iso: 'ae', label: 'UAE', format: '5X XXX XXXX', regex: /^(\d{0,2})(\d{0,3})(\d{0,4})$/ },
  { code: '+49', iso: 'de', label: 'Germany', format: '15X XXXXXXX', regex: /^(\d{0,3})(\d{0,7})$/ },
  { code: '+33', iso: 'fr', label: 'France', format: 'X XX XX XX XX', regex: /^(\d{0,1})(\d{0,2})(\d{0,2})(\d{0,2})(\d{0,2})$/ },
  { code: '+39', iso: 'it', label: 'Italy', format: '3XX XXXXXXX', regex: /^(\d{0,3})(\d{0,7})$/ },
  { code: '+34', iso: 'es', label: 'Spain', format: '6XX XXX XXX', regex: /^(\d{0,3})(\d{0,3})(\d{0,3})$/ },
  { code: '+55', iso: 'br', label: 'Brazil', format: 'XX 9XXXX XXXX', regex: /^(\d{0,2})(\d{0,5})(\d{0,4})$/ },
  { code: '+91', iso: 'in', label: 'India', format: '9XXXX XXXXX', regex: /^(\d{0,5})(\d{0,5})$/ },
];

const TIMES = [
  { value: 'Half Day (Morning)', label: 'Half Day (Morning, 7:00 AM - 12:00 PM)' },
  { value: 'Half Day (Afternoon)', label: 'Half Day (Afternoon, 1:00 PM - 6:00 PM)' },
  { value: 'Whole Day', label: 'Whole Day (8:00 AM - 10:00 PM)' },
  { value: 'Evening Event', label: 'Evening Event (5:00 PM - 12:00 AM)' },
  { value: 'Other', label: 'Other (Please specify in message)' },
];

const HOME_INQUIRY_FORM = {
  fullName: '',
  email: '',
  message: '',
};

function CountrySelect({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedCountry = COUNTRIES.find(c => c.code === value) || COUNTRIES[0];

  return (
    <div className="relative flex items-center bg-white/30 h-full w-[115px] shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-full w-full items-center gap-2 bg-transparent pl-4 pr-6 py-4 font-sans text-sm font-medium text-neutral-900 focus:outline-none cursor-pointer border-r border-white/60 hover:bg-white/40 transition-colors"
      >
        <img src={`https://flagcdn.com/w20/${selectedCountry.iso}.png`} alt={selectedCountry.iso} className="w-5 rounded-[2px] shadow-sm" />
        <span>{selectedCountry.code}</span>
      </button>
      <div className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 max-h-64 overflow-y-auto rounded-2xl border border-white/60 bg-white/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(47,62,50,0.15)] z-50 py-2 custom-scrollbar">
          {COUNTRIES.map(country => (
            <button
              key={country.iso}
              type="button"
              onClick={() => { onChange(country.code); setOpen(false); }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${value === country.code ? 'bg-[#FFF2DB] text-[#8E7722]' : 'hover:bg-neutral-100/50'}`}
            >
              <img src={`https://flagcdn.com/w20/${country.iso}.png`} alt={country.iso} className="w-5 rounded-[2px] shadow-sm" />
              <span className="font-semibold w-10">{country.code}</span>
              <span className="text-neutral-600 truncate">{country.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TimeSelect({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = TIMES.find(t => t.value === value);

  return (
    <div className="relative group/input" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between rounded-2xl border ${open ? 'border-[#D6B53B] bg-white ring-4 ring-[#D6B53B]/10' : 'border-white/60 bg-white/50'} px-5 py-4 font-sans text-sm shadow-[0_4px_12px_rgba(47,62,50,0.03)] backdrop-blur-md transition-all duration-300 hover:border-[#FDEB9E]/50 hover:bg-[#FFF2DB]/50 hover:shadow-sm cursor-pointer`}
      >
        <span className={selected ? 'text-neutral-900 font-medium' : 'text-neutral-500/70'}>
          {selected ? selected.label : 'Preferred Time / Duration'}
        </span>
      </button>

      <div className={`pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 transition-all duration-300 ${open ? 'text-[#D6B53B] rotate-180' : 'text-neutral-500 group-hover/input:text-[#D6B53B]'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </div>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-full rounded-2xl border border-white/60 bg-white/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(47,62,50,0.15)] z-50 py-2 overflow-hidden">
          {TIMES.map(time => (
            <button
              key={time.value}
              type="button"
              onClick={() => { onChange(time.value); setOpen(false); }}
              className={`flex w-full items-center px-5 py-3 text-left text-sm transition-colors ${value === time.value ? 'bg-[#FFF2DB] text-[#8E7722] font-semibold' : 'text-neutral-700 hover:bg-neutral-100/50'}`}
            >
              {time.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReservationSection() {
  const [phoneCode, setPhoneCode] = useState('+63');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [form, setForm] = useState(HOME_INQUIRY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const setField = (key: keyof typeof HOME_INQUIRY_FORM, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const selectDate = (date: string) => {
    setSelectedDate(date);
    if (date) {
      setError('');
    }
  };

  const submitInquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedDate) {
      setError('Please choose an available date in the calendar before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/client/inquiries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          phoneNumber: `${phoneCode} ${phoneNumber}`.trim(),
          preferredContactTime: preferredTime,
          requestedEventDate: selectedDate,
          sourcePage: 'home',
        }),
      });
      const payload = await response.json() as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to submit your inquiry. Please check your details and try again.');
      }

      setSuccess(payload.message || 'Your inquiry has been submitted successfully.');
      setForm(HOME_INQUIRY_FORM);
      setPhoneNumber('');
      setPreferredTime('');
      setSelectedDate('');
    } catch (caughtError) {
      setError(caughtError instanceof Error
        ? caughtError.message
        : 'Unable to submit your inquiry. Please check your details and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');

    // Auto-remove leading 0 which is common for local dialing but omitted with country codes
    if (val.startsWith('0')) {
      val = val.substring(1);
    }

    const country = COUNTRIES.find(c => c.code === phoneCode) || COUNTRIES[0];
    let formatted = val;

    const match = val.match(country.regex);
    if (match) {
      formatted = match.slice(1).filter(Boolean).join(' ');
    }

    setPhoneNumber(formatted);
  };

  const getPhonePlaceholder = () => {
    const country = COUNTRIES.find(c => c.code === phoneCode);
    return country ? country.format : 'Phone Number';
  };

  return (
    <section className="w-full border-y border-neutral-900/10 bg-transparent px-4 py-12 md:px-12">
      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row gap-8 lg:gap-12 items-end">
        <div className="w-full lg:w-1/2 xl:w-7/12">
          <EventCalendar
            layout="vertical"
            selectedDate={selectedDate}
            onSelectDate={selectDate}
          />
        </div>

        <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-end">
          <section className="group relative w-full rounded-[2rem] border border-[#D6B53B]/30 bg-gradient-to-b from-[#FFFDF2]/90 to-white/70 p-6 sm:px-8 sm:pt-8 sm:pb-[22px] shadow-[0_24px_60px_rgba(47,62,50,0.08)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_32px_80px_rgba(47,62,50,0.12)]">
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top_right,rgba(214,181,59,0.15),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.4),transparent_50%)]" />
            <div className="absolute inset-x-0 top-0 h-1.5 rounded-t-[2rem] bg-gradient-to-r from-transparent via-[#D6B53B]/40 to-transparent opacity-60" />

            <div className="relative z-10">
              <div className="mb-8 flex flex-col gap-2">
                <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#2F3E32]">For Inquiries</h3>
                <p className="text-sm text-[#3A4B3C]/60">We would love to hear from you. Leave us a message below.</p>
              </div>

              <form className="flex flex-col gap-5" onSubmit={submitInquiry}>
                <div className="relative group/input z-10">
                  <input
                    required
                    maxLength={180}
                    type="text"
                    autoComplete="name"
                    placeholder="Full Name"
                    value={form.fullName}
                    onChange={(event) => setField('fullName', event.target.value)}
                    className="peer w-full rounded-2xl border border-white/60 bg-white/50 px-5 py-4 font-sans text-sm text-neutral-900 shadow-[0_4px_12px_rgba(47,62,50,0.03)] backdrop-blur-md transition-all duration-300 placeholder:text-neutral-500/70 hover:border-[#FDEB9E]/50 hover:bg-[#FFF2DB]/50 hover:shadow-sm focus:border-[#D6B53B] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#D6B53B]/10"
                  />
                </div>

                <div className="relative group/input flex rounded-2xl border border-white/60 bg-white/50 shadow-[0_4px_12px_rgba(47,62,50,0.03)] backdrop-blur-md transition-all duration-300 hover:border-[#FDEB9E]/50 hover:bg-[#FFF2DB]/50 hover:shadow-sm focus-within:border-[#D6B53B] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#D6B53B]/10 overflow-visible z-50">
                  <CountrySelect value={phoneCode} onChange={setPhoneCode} />
                  <input
                    required
                    maxLength={40}
                    type="tel"
                    autoComplete="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder={getPhonePlaceholder()}
                    className="w-full bg-transparent px-4 py-4 font-sans text-sm text-neutral-900 focus:outline-none placeholder:text-neutral-500/70"
                  />
                </div>

                <div className="relative group/input z-40">
                  <input
                    required
                    maxLength={255}
                    type="email"
                    autoComplete="email"
                    placeholder="Email Address"
                    value={form.email}
                    onChange={(event) => setField('email', event.target.value)}
                    className="peer w-full rounded-2xl border border-white/60 bg-white/50 px-5 py-4 font-sans text-sm text-neutral-900 shadow-[0_4px_12px_rgba(47,62,50,0.03)] backdrop-blur-md transition-all duration-300 placeholder:text-neutral-500/70 hover:border-[#FDEB9E]/50 hover:bg-[#FFF2DB]/50 hover:shadow-sm focus:border-[#D6B53B] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#D6B53B]/10"
                  />
                </div>

                <div className="relative z-30">
                  <TimeSelect value={preferredTime} onChange={setPreferredTime} />
                </div>

                <div className="relative group/input z-20">
                  <textarea
                    required
                    minLength={10}
                    maxLength={3000}
                    placeholder="Message"
                    value={form.message}
                    onChange={(event) => setField('message', event.target.value)}
                    rows={4}
                    className="peer w-full resize-none rounded-3xl border border-white/60 bg-white/50 px-5 py-4 font-sans text-sm text-neutral-900 shadow-[0_4px_12px_rgba(47,62,50,0.03)] backdrop-blur-md transition-all duration-300 placeholder:text-neutral-500/70 hover:border-[#FDEB9E]/50 hover:bg-[#FFF2DB]/50 hover:shadow-sm focus:border-[#D6B53B] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#D6B53B]/10"
                  ></textarea>
                  <div className="pointer-events-none absolute bottom-4 right-4 text-neutral-400/60 transition-colors group-hover/input:text-[#D6B53B]/70 peer-focus:text-[#D6B53B]">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <path d="M9 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>

                {error && (
                  <div role="alert" className="rounded-2xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                  </div>
                )}

                {success && (
                  <div role="status" className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm font-semibold text-emerald-800">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group/submit relative mt-2 w-full sm:w-auto self-start overflow-hidden rounded-full bg-[#D6B53B] px-10 py-3.5 font-sans text-sm font-semibold uppercase tracking-[0.15em] text-white shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-[#D6B53B]/20 disabled:cursor-not-allowed disabled:opacity-70 z-10"
                >
                  <span className="absolute left-0 top-0 h-full w-0 bg-[#b38f29] transition-all duration-500 ease-out group-hover/submit:w-full"></span>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
                  </span>
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
