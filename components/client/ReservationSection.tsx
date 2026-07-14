"use client";

import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Loader2, Send } from 'lucide-react';
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

const EVENT_TYPE_OPTIONS = [
  'Wedding',
  'Birthday',
  'Debut',
  'Christening',
  'Gender Reveal',
  'Christmas Party',
  'Corporate Event',
  'Other Event',
];

const PACKAGE_OPTIONS = [
  'Basic Package',
  'Standard Package',
  'Premium Package',
  'Customized Package',
  'Not Sure Yet',
];

const GUEST_COUNT_OPTIONS = [
  '30 - 50',
  '50 - 75',
  '75 - 100',
  '100+',
];

const HOME_INQUIRY_FORM = {
  fullName: '',
  email: '',
  message: '',
  eventType: '',
  packageInterest: '',
  guestCount: '',
};

const ERROR_TOAST_VISIBLE_DURATION_MS = 5000;
const SUCCESS_TOAST_VISIBLE_DURATION_MS = 3000;
const TOAST_EXIT_DURATION_MS = 280;

type FieldErrors = {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  schedule?: string;
  message?: string;
  eventType?: string;
  packageInterest?: string;
  guestCount?: string;
};

function inputSurfaceClass(invalid: boolean) {
  return invalid
    ? 'border-[#D4AF37]/70 bg-[#FFF8DF]/90 ring-4 ring-[#D4AF37]/10'
    : 'border-[#D4AF37]/20 bg-white/60';
}

function phoneDigits(value: string) {
  return value.replace(/\D/g, '');
}

function selectedPhoneCountry(code: string) {
  return COUNTRIES.find(country => country.code === code) || COUNTRIES[0];
}

function requiredPhoneDigits(format: string) {
  return (format.match(/[X0-9]/g) || []).length;
}

function FormNotice({
  tone,
  title,
  children,
}: {
  tone: 'warning' | 'success';
  title: string;
  children: React.ReactNode;
}) {
  const isSuccess = tone === 'success';
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div
      role={isSuccess ? 'status' : 'alert'}
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-[0_10px_30px_rgba(47,62,50,0.06)] backdrop-blur-md ${isSuccess
        ? 'border-emerald-200/80 bg-emerald-50/90 text-emerald-900'
        : 'border-[#D4AF37]/35 bg-[#FFF8DF]/95 text-[#5E4B16]'
        }`}
    >
      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-[#D4AF37]/15 text-[#8E7722]'}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block font-serif text-base font-semibold leading-snug">{title}</span>
        <span className="mt-0.5 block font-sans text-sm font-medium leading-relaxed opacity-85">{children}</span>
      </span>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="mt-1 -mb-1 flex items-center gap-1.5 px-1.5 font-sans text-[11px] font-semibold leading-tight text-[#8E7722] animate-[fadeInUp_160ms_ease-out]">
      <AlertCircle className="h-3 w-3 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

function ValidationToast({
  tone,
  title,
  message,
  leaving = false,
}: {
  tone: 'warning' | 'success';
  title: string;
  message: string;
  leaving?: boolean;
}) {
  const isSuccess = tone === 'success';
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed right-3 top-24 z-[1000] w-[calc(100vw-1.5rem)] max-w-sm sm:right-6">
      <div
        key={`${tone}-${message}`}
        role={isSuccess ? 'status' : 'alert'}
        className={`relative overflow-hidden rounded-2xl border shadow-[0_22px_60px_rgba(47,62,50,0.18)] ring-1 ring-white/70 backdrop-blur-xl motion-reduce:animate-none ${leaving
          ? 'animate-[inquiryToastSlideOutRight_280ms_ease-in_both]'
          : 'animate-[inquiryToastSlideInLeft_420ms_ease-out_both]'
          } ${isSuccess
            ? 'border-emerald-200/80 bg-emerald-50/95 text-emerald-950'
            : 'border-[#D4AF37]/35 bg-[#FFFDF2]/95 text-[#4F4218]'
          }`}
      >
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent ${isSuccess ? 'via-emerald-400/75' : 'via-[#D4AF37]/70'} to-transparent`} />
        <div className="flex items-start gap-3 px-4 py-3">
          <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-[#D4AF37]/15 text-[#8E7722]'}`}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block font-serif text-base font-semibold leading-snug text-[#2F3E32]">{title}</span>
            <span className={`mt-0.5 block font-sans text-sm font-medium leading-snug ${isSuccess ? 'text-emerald-900/85' : 'text-[#5E4B16]/85'}`}>{message}</span>
          </span>
        </div>
      </div>
    </div>,
    document.body
  );
}

function CountrySelect({
  value,
  disabled = false,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  onChange: (val: string) => void;
}) {
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
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="flex h-full w-full items-center gap-2 bg-transparent pl-4 pr-6 py-3 font-sans text-sm font-medium text-neutral-900 focus:outline-none cursor-pointer border-r border-[#D4AF37]/20 hover:bg-white/40 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        <img src={`https://flagcdn.com/w20/${selectedCountry.iso}.png`} alt={selectedCountry.iso} className="w-5 rounded-[2px] shadow-sm" />
        <span>{selectedCountry.code}</span>
      </button>
      <div className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </div>

      {open && !disabled && (
        <div className="absolute top-full left-0 mt-2 w-64 max-h-64 overflow-y-auto rounded-2xl border border-white/60 bg-white/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(47,62,50,0.15)] z-50 py-2 events-scrollbar">
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

function DropdownSelect({
  value,
  options,
  placeholder,
  ariaLabel,
  disabled = false,
  describedBy,
  invalid = false,
  onChange,
  onBlur,
}: {
  value: string;
  options: string[];
  placeholder: string;
  ariaLabel: string;
  disabled?: boolean;
  describedBy?: string;
  invalid?: boolean;
  onChange: (val: string) => void;
  onBlur?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = value || placeholder;
  const hasDisplayValue = Boolean(value);

  return (
    <div className="relative group/input" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open && !disabled}
        aria-describedby={invalid ? describedBy : undefined}
        data-invalid={invalid ? true : undefined}
        onClick={() => setOpen(!open)}
        onBlur={(event) => {
          const nextTarget = event.relatedTarget;

          if (nextTarget instanceof Node && ref.current?.contains(nextTarget)) {
            return;
          }

          onBlur?.();
        }}
        className={`flex w-full items-center justify-between rounded-2xl border ${invalid ? inputSurfaceClass(true) : open && !disabled ? 'border-[#D4AF37] bg-white ring-4 ring-[#D4AF37]/10' : inputSurfaceClass(false)} px-5 py-3 font-sans text-sm shadow-sm backdrop-blur-md transition-all duration-300 hover:border-[#FDEB9E]/50 hover:bg-[#FFF2DB]/50 hover:shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className={`block min-w-0 truncate pr-7 text-left ${hasDisplayValue ? 'text-neutral-900 font-medium' : 'text-neutral-500/70'}`}>
          {displayValue}
        </span>
      </button>

      <div className={`pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 transition-all duration-300 ${open && !disabled ? 'text-[#D4AF37] rotate-180' : 'text-neutral-500 group-hover/input:text-[#D4AF37]'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </div>

      {open && !disabled && (
        <div className="absolute top-full left-0 mt-2 w-full max-h-64 overflow-y-auto rounded-2xl border border-white/60 bg-white/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(47,62,50,0.15)] z-50 py-2 events-scrollbar">
          {options.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => { onChange(option); setOpen(false); }}
              className={`flex w-full items-center px-5 py-3 text-left text-sm transition-colors ${value === option ? 'bg-[#FFF2DB] text-[#8E7722] font-semibold' : 'text-neutral-700 hover:bg-neutral-100/50'}`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type TimeSelectProps = {
  value: string;
  selectedDate?: string;
  disabled?: boolean;
  describedBy?: string;
  invalid?: boolean;
  onChange: (val: string) => void;
  onBlur?: () => void;
};

function TimeSelect({
  value,
  selectedDate = '',
  disabled = false,
  describedBy,
  invalid = false,
  onChange,
  onBlur,
}: TimeSelectProps) {
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
  const displayValue = selectedDate
    ? selected
      ? `${selectedDate} - ${selected.label}`
      : selectedDate
    : selected?.label || 'Preferred Date / Time';
  const hasDisplayValue = Boolean(selectedDate || selected);

  return (
    <div className="relative group/input" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        aria-label="Preferred date and time"
        aria-haspopup="listbox"
        aria-expanded={open && !disabled}
        aria-describedby={invalid ? describedBy : undefined}
        data-invalid={invalid ? true : undefined}
        onClick={() => setOpen(!open)}
        onBlur={(event) => {
          const nextTarget = event.relatedTarget;

          if (nextTarget instanceof Node && ref.current?.contains(nextTarget)) {
            return;
          }

          onBlur?.();
        }}
        className={`flex w-full items-center justify-between rounded-2xl border ${invalid ? inputSurfaceClass(true) : open && !disabled ? 'border-[#D4AF37] bg-white ring-4 ring-[#D4AF37]/10' : inputSurfaceClass(false)} px-5 py-3 font-sans text-sm shadow-sm backdrop-blur-md transition-all duration-300 hover:border-[#FDEB9E]/50 hover:bg-[#FFF2DB]/50 hover:shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className={`block min-w-0 truncate pr-7 text-left ${hasDisplayValue ? 'text-neutral-900 font-medium' : 'text-neutral-500/70'}`}>
          {displayValue}
        </span>
      </button>

      <div className={`pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 transition-all duration-300 ${open && !disabled ? 'text-[#D4AF37] rotate-180' : 'text-neutral-500 group-hover/input:text-[#D4AF37]'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </div>

      {open && !disabled && (
        <div className="absolute top-full left-0 mt-2 w-full max-h-64 overflow-y-auto rounded-2xl border border-white/60 bg-white/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(47,62,50,0.15)] z-50 py-2 events-scrollbar">
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isToastLeaving, setIsToastLeaving] = useState(false);
  const [toastTick, setToastTick] = useState(0);
  const toastDismissTimeoutRef = useRef<number | null>(null);
  const [inquiriesEnabled, setInquiriesEnabled] = useState(true);
  const [disabledMessage, setDisabledMessage] = useState('Client inquiries are temporarily unavailable.');
  const [placeholderText, setPlaceholderText] = useState('');

  useEffect(() => {
    const text = 'Tell us more about your event or inquiry...';
    let index = 0;
    let isDeleting = false;
    let timeoutId: NodeJS.Timeout;
    let blinkCount = 0;

    const animate = () => {
      const currentText = text.substring(0, index);

      if (!isDeleting && index === text.length) {
        if (blinkCount < 6) {
          setPlaceholderText(currentText + (blinkCount % 2 === 0 ? '|' : ''));
          blinkCount++;
          timeoutId = setTimeout(animate, 500);
        } else {
          isDeleting = true;
          blinkCount = 0;
          animate();
        }
      } else if (isDeleting && index === 0) {
        if (blinkCount < 2) {
          setPlaceholderText(blinkCount % 2 === 0 ? '|' : '');
          blinkCount++;
          timeoutId = setTimeout(animate, 400);
        } else {
          isDeleting = false;
          blinkCount = 0;
          animate();
        }
      } else {
        setPlaceholderText(currentText + '|');
        index += isDeleting ? -1 : 1;
        timeoutId = setTimeout(animate, isDeleting ? 30 : 80);
      }
    };

    timeoutId = setTimeout(animate, 500);
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const response = await fetch('/api/client/settings', { cache: 'no-store' });
        const payload = await response.json() as {
          settings?: {
            client?: {
              maintenanceMode?: boolean;
              inquirySubmissionsEnabled?: boolean;
              disabledMessage?: string;
            };
          };
        };
        const clientSettings = payload.settings?.client;

        if (!active || !clientSettings) {
          return;
        }

        const enabled = clientSettings.maintenanceMode ? false : clientSettings.inquirySubmissionsEnabled !== false;
        setInquiriesEnabled(enabled);
        if (!enabled) {
          setDisabledMessage(clientSettings.disabledMessage || 'Client inquiries are temporarily unavailable.');
        }
      } catch {
        if (active) {
          setInquiriesEnabled(true);
        }
      }
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!error && !success) {
      return;
    }

    const visibleDuration = error ? ERROR_TOAST_VISIBLE_DURATION_MS : SUCCESS_TOAST_VISIBLE_DURATION_MS;
    const shouldClearFieldErrorsOnHide = Boolean(error);

    toastDismissTimeoutRef.current = window.setTimeout(() => {
      setIsToastLeaving(true);

      toastDismissTimeoutRef.current = window.setTimeout(() => {
        setError('');
        setSuccess('');
        if (shouldClearFieldErrorsOnHide) {
          setFieldErrors({});
        }
        setIsToastLeaving(false);
        toastDismissTimeoutRef.current = null;
      }, TOAST_EXIT_DURATION_MS);
    }, visibleDuration);

    return () => {
      if (toastDismissTimeoutRef.current) {
        window.clearTimeout(toastDismissTimeoutRef.current);
        toastDismissTimeoutRef.current = null;
      }
    };
  }, [error, success, toastTick]);

  useEffect(() => {
    return () => {
      if (toastDismissTimeoutRef.current) {
        window.clearTimeout(toastDismissTimeoutRef.current);
        toastDismissTimeoutRef.current = null;
      }
    };
  }, []);

  const resetToastMotion = () => {
    if (toastDismissTimeoutRef.current) {
      window.clearTimeout(toastDismissTimeoutRef.current);
      toastDismissTimeoutRef.current = null;
    }

    setIsToastLeaving(false);
  };

  const clearNotice = () => {
    const shouldClearFieldErrors = Boolean(error);

    resetToastMotion();
    setError('');
    setSuccess('');

    if (shouldClearFieldErrors) {
      setFieldErrors({});
    }
  };

  const showErrorToast = (message: string) => {
    setSuccess('');
    setError(message);
    setToastTick((current) => current + 1);
  };

  const showSuccessToast = (message: string) => {
    setError('');
    setSuccess(message);
    setToastTick((current) => current + 1);
  };

  const clearFieldError = (key: keyof FieldErrors) => {
    setFieldErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const setField = (key: keyof typeof HOME_INQUIRY_FORM, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    clearFieldError(key);
    clearNotice();
  };

  const setPhoneCountry = (value: string) => {
    setPhoneCode(value);
    clearFieldError('phoneNumber');
    clearNotice();
  };

  const setPreferredSchedule = (value: string) => {
    setPreferredTime(value);
    clearFieldError('schedule');
    clearNotice();
  };

  const selectDate = (date: string) => {
    setSelectedDate(date);
    clearFieldError('schedule');
    clearNotice();
  };

  const getFieldError = (key: keyof FieldErrors) => {
    if (key === 'fullName' && !form.fullName.trim()) {
      return 'Please enter your full name.';
    }

    if (key === 'phoneNumber') {
      const country = selectedPhoneCountry(phoneCode);
      const currentDigits = phoneDigits(phoneNumber);
      const requiredDigits = requiredPhoneDigits(country.format);

      if (!currentDigits) {
        return 'Please enter your phone number.';
      }

      if (currentDigits.length < requiredDigits) {
        return `Please complete your phone number using the ${country.format} format.`;
      }
    }

    if (key === 'email') {
      if (!form.email.trim()) {
        return 'Please enter your email address.';
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        return 'Please enter a valid email address.';
      }
    }

    if (key === 'eventType' && !form.eventType.trim()) {
      return 'Please select an event type.';
    }

    if (key === 'packageInterest' && !form.packageInterest.trim()) {
      return 'Please select your package interest.';
    }

    if (key === 'guestCount' && !form.guestCount.trim()) {
      return 'Please select your guest count.';
    }

    if (key === 'schedule') {
      if (!selectedDate && !preferredTime) {
        return 'Please choose an available calendar date and preferred time.';
      }

      if (!selectedDate) {
        return 'Please choose an available date in the calendar.';
      }

      if (!preferredTime) {
        return 'Please select a preferred time or duration.';
      }
    }

    if (key === 'message') {
      if (!form.message.trim()) {
        return 'Please write your inquiry message.';
      }

      if (form.message.trim().length < 10) {
        return 'Please write a message with at least 10 characters.';
      }
    }

    return '';
  };

  const validateField = (key: keyof FieldErrors) => {
    if (!inquiriesEnabled) {
      return;
    }

    const fieldError = getFieldError(key);

    setFieldErrors((current) => {
      if (!fieldError && !current[key]) {
        return current;
      }

      const next = { ...current };

      if (fieldError) {
        next[key] = fieldError;
      } else {
        delete next[key];
      }

      return next;
    });

    if (fieldError) {
      setSuccess('');
    }
  };

  const validateInquiry = () => {
    const nextFieldErrors: FieldErrors = {};
    const fields: Array<keyof FieldErrors> = [
      'fullName',
      'phoneNumber',
      'email',
      'eventType',
      'packageInterest',
      'guestCount',
      'schedule',
      'message',
    ];

    fields.forEach((field) => {
      const fieldError = getFieldError(field);

      if (fieldError) {
        nextFieldErrors[field] = fieldError;
      }
    });

    return {
      fieldErrors: nextFieldErrors,
      notice: Object.keys(nextFieldErrors).length > 0
        ? 'Please review the highlighted fields below before submitting.'
        : '',
    };
  };

  const submitInquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetToastMotion();
    setError('');
    setSuccess('');
    setFieldErrors({});

    if (!inquiriesEnabled) {
      showErrorToast(disabledMessage);
      return;
    }

    const validation = validateInquiry();
    if (validation.notice) {
      setFieldErrors(validation.fieldErrors);
      showErrorToast(validation.notice);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/client/inquiries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          message: form.message.trim(),
          phoneNumber: `${phoneCode} ${phoneNumber}`.trim(),
          preferredContactTime: preferredTime,
          requestedEventDate: selectedDate,
          eventInterest: form.eventType,
          eventType: form.eventType,
          packageInterest: form.packageInterest,
          guestCount: form.guestCount,
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

      showSuccessToast(payload.message || 'Your inquiry has been submitted successfully.');
      setForm(HOME_INQUIRY_FORM);
      setFieldErrors({});
      setPhoneNumber('');
      setPreferredTime('');
      setSelectedDate('');
    } catch (caughtError) {
      showErrorToast(caughtError instanceof Error
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

    const country = selectedPhoneCountry(phoneCode);
    let formatted = val;

    const match = val.match(country.regex);
    if (match) {
      formatted = match.slice(1).filter(Boolean).join(' ');
    }

    setPhoneNumber(formatted);
    clearFieldError('phoneNumber');
    clearNotice();
  };

  const getPhonePlaceholder = () => {
    const country = selectedPhoneCountry(phoneCode);
    return country.format;
  };

  return (
    <section className="w-full border-y border-neutral-900/10 bg-transparent px-4 py-12 md:px-12">
      {error && <ValidationToast tone="warning" title="Almost there" message={error} leaving={isToastLeaving} />}
      {!error && success && <ValidationToast tone="success" title="Inquiry sent" message={success} leaving={isToastLeaving} />}

      <div className="mx-auto flex max-w-7xl flex-col lg:flex-row gap-8 lg:gap-12 items-end">
        <div className="w-full lg:w-1/2 xl:w-7/12">
          <EventCalendar
            layout="vertical"
            selectedDate={selectedDate}
            onSelectDate={selectDate}
          />
        </div>

        <div className="w-full lg:w-1/2 xl:w-5/12 flex flex-col justify-end">
          <section className="w-full bg-white/60 backdrop-blur-sm rounded-[2rem] p-6 md:p-8 shadow-[0_20px_40px_rgba(212,160,23,0.1)] border border-[#D4AF37]/20 relative overflow-hidden group/form">
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-full blur-3xl transition-transform duration-1000 group-hover/form:scale-150"></div>

            <div className="relative z-10">
              <div className="mb-8 flex flex-col gap-2">
                <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#2F3E32]">For Inquiries</h3>
                <p className="text-sm text-[#3A4B3C]/60">We would love to hear from you. Leave us a message below.</p>
              </div>

              <form className="flex flex-col gap-4" onSubmit={submitInquiry} noValidate>
                {!inquiriesEnabled && (
                  <FormNotice tone="warning" title="Inquiries paused">
                    {disabledMessage}
                  </FormNotice>
                )}
                <div className="relative group/input z-10">
                  <input
                    required
                    disabled={!inquiriesEnabled}
                    aria-invalid={fieldErrors.fullName ? true : undefined}
                    aria-describedby={fieldErrors.fullName ? 'home-inquiry-full-name-error' : undefined}
                    maxLength={180}
                    type="text"
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={form.fullName}
                    onChange={(event) => setField('fullName', event.target.value)}
                    onBlur={() => validateField('fullName')}
                    className={`peer w-full rounded-2xl border ${inputSurfaceClass(Boolean(fieldErrors.fullName))} px-5 py-3 font-sans text-sm text-neutral-900 shadow-sm backdrop-blur-md transition-all duration-300 placeholder:text-neutral-500/70 hover:border-[#FDEB9E]/50 hover:bg-[#FFF2DB]/50 hover:shadow-sm focus:border-[#D4AF37] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/10`}
                  />
                  <FieldError id="home-inquiry-full-name-error" message={fieldErrors.fullName} />
                </div>

                <div className="relative z-50">
                  <div className={`group/input flex rounded-2xl border ${inputSurfaceClass(Boolean(fieldErrors.phoneNumber))} shadow-sm backdrop-blur-md transition-all duration-300 hover:border-[#FDEB9E]/50 hover:bg-[#FFF2DB]/50 hover:shadow-sm focus-within:border-[#D4AF37] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#D4AF37]/10 overflow-visible`}>
                    <CountrySelect value={phoneCode} disabled={!inquiriesEnabled} onChange={setPhoneCountry} />
                    <input
                      required
                      disabled={!inquiriesEnabled}
                      aria-invalid={fieldErrors.phoneNumber ? true : undefined}
                      aria-describedby={fieldErrors.phoneNumber ? 'home-inquiry-phone-error' : undefined}
                      maxLength={40}
                      type="tel"
                      autoComplete="tel"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      onBlur={() => validateField('phoneNumber')}
                      placeholder={getPhonePlaceholder()}
                      className="w-full bg-transparent px-4 py-3 font-sans text-sm text-neutral-900 focus:outline-none placeholder:text-neutral-500/70"
                    />
                  </div>
                  <FieldError id="home-inquiry-phone-error" message={fieldErrors.phoneNumber} />
                </div>

                <div className="relative z-40 grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="relative group/input w-full md:col-span-3">
                    <input
                      required
                      disabled={!inquiriesEnabled}
                      aria-invalid={fieldErrors.email ? true : undefined}
                      aria-describedby={fieldErrors.email ? 'home-inquiry-email-error' : undefined}
                      maxLength={255}
                      type="email"
                      autoComplete="email"
                      placeholder="Email Address"
                      value={form.email}
                      onChange={(event) => setField('email', event.target.value)}
                      onBlur={() => validateField('email')}
                      className={`peer w-full rounded-2xl border ${inputSurfaceClass(Boolean(fieldErrors.email))} px-5 py-3 font-sans text-sm text-neutral-900 shadow-sm backdrop-blur-md transition-all duration-300 placeholder:text-neutral-500/70 hover:border-[#FDEB9E]/50 hover:bg-[#FFF2DB]/50 hover:shadow-sm focus:border-[#D4AF37] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/10`}
                    />
                    <FieldError id="home-inquiry-email-error" message={fieldErrors.email} />
                  </div>
                  <div className="w-full relative md:col-span-2">
                    <DropdownSelect
                      value={form.guestCount}
                      options={GUEST_COUNT_OPTIONS}
                      placeholder="Select guest count"
                      ariaLabel="Guest Count"
                      disabled={!inquiriesEnabled}
                      invalid={Boolean(fieldErrors.guestCount)}
                      describedBy="home-inquiry-guest-count-error"
                      onChange={(val) => setField('guestCount', val)}
                      onBlur={() => validateField('guestCount')}
                    />
                    <FieldError id="home-inquiry-guest-count-error" message={fieldErrors.guestCount} />
                  </div>
                </div>

                <div className="relative z-30 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="w-full relative">
                    <DropdownSelect
                      value={form.eventType}
                      options={EVENT_TYPE_OPTIONS}
                      placeholder="Select event type"
                      ariaLabel="Event Type"
                      disabled={!inquiriesEnabled}
                      invalid={Boolean(fieldErrors.eventType)}
                      describedBy="home-inquiry-event-type-error"
                      onChange={(val) => setField('eventType', val)}
                      onBlur={() => validateField('eventType')}
                    />
                    <FieldError id="home-inquiry-event-type-error" message={fieldErrors.eventType} />
                  </div>
                  <div className="w-full relative">
                    <DropdownSelect
                      value={form.packageInterest}
                      options={PACKAGE_OPTIONS}
                      placeholder="Select package interest"
                      ariaLabel="Package Interest"
                      disabled={!inquiriesEnabled}
                      invalid={Boolean(fieldErrors.packageInterest)}
                      describedBy="home-inquiry-package-interest-error"
                      onChange={(val) => setField('packageInterest', val)}
                      onBlur={() => validateField('packageInterest')}
                    />
                    <FieldError id="home-inquiry-package-interest-error" message={fieldErrors.packageInterest} />
                  </div>
                </div>

                <div className="relative z-20">
                  <TimeSelect
                    value={preferredTime}
                    selectedDate={selectedDate}
                    disabled={!inquiriesEnabled}
                    invalid={Boolean(fieldErrors.schedule)}
                    describedBy="home-inquiry-schedule-error"
                    onChange={setPreferredSchedule}
                    onBlur={() => validateField('schedule')}
                  />
                  <FieldError id="home-inquiry-schedule-error" message={fieldErrors.schedule} />
                </div>

                <div className="relative group/input z-0">
                  <div className="relative">
                    <textarea
                      required
                      disabled={!inquiriesEnabled}
                      aria-invalid={fieldErrors.message ? true : undefined}
                      aria-describedby={fieldErrors.message ? 'home-inquiry-message-error' : undefined}
                      minLength={10}
                      maxLength={3000}
                      placeholder={placeholderText || "Tell us more about your event or inquiry..."}
                      value={form.message}
                      onChange={(event) => setField('message', event.target.value)}
                      onBlur={() => validateField('message')}
                      rows={4}
                      className={`peer w-full resize-none rounded-2xl border ${inputSurfaceClass(Boolean(fieldErrors.message))} px-5 py-3 font-sans text-sm text-neutral-900 shadow-sm backdrop-blur-md transition-all duration-300 placeholder:text-neutral-500/70 hover:border-[#FDEB9E]/50 hover:bg-[#FFF2DB]/50 hover:shadow-sm focus:border-[#D4AF37] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/10`}
                    ></textarea>
                    <div className="pointer-events-none absolute bottom-3 right-2 text-neutral-400/60 transition-colors group-hover/input:text-[#D4AF37]/70 peer-focus:text-[#D4AF37]">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M9 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                  <FieldError id="home-inquiry-message-error" message={fieldErrors.message} />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !inquiriesEnabled}
                  className="group/submit relative mt-2 w-full sm:w-auto self-start overflow-hidden rounded-full bg-[#D4AF37] px-10 py-3.5 font-sans text-sm font-semibold uppercase tracking-[0.15em] text-white shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:opacity-70 z-0"
                >
                  <span className="absolute left-0 top-0 h-full w-0 bg-[#b38f29] transition-all duration-500 ease-out group-hover/submit:w-full"></span>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {!isSubmitting && <Send className="h-4 w-4" />}
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
