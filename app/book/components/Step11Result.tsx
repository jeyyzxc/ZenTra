import React, { useEffect, useMemo, useState } from 'react';
import { BookFormData } from './BookFlow';

interface Props {
  cancelBooking: () => void;
  data: BookFormData;
  goToStep: (step: number) => void;
}

type PublicPackage = {
  id: string;
  eventCategoryId: string;
  eventCategoryName: string;
  packageName: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  paxIncluded: number;
  excessPaxFee: number;
  reservationFee: number;
  downPaymentAmount: number;
  fullPaymentAmount: number;
  checkInTime: string | null;
  checkOutTime: string | null;
  packageImageUrl: string | null;
  currentVersion: number;
  inclusions: Array<{
    id?: string;
    inclusionName: string;
    description: string | null;
    isFree: boolean;
    isOptional: boolean;
  }>;
};

const themeImages: Record<string, string> = {
  Minimalist: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop',
  Garden: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2070&auto=format&fit=crop',
  Elegant: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=2069&auto=format&fit=crop',
  'Modern Luxury': 'https://images.unsplash.com/photo-1543348750-466b55f32f16?q=80&w=1974&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=2070&auto=format&fit=crop',
};

const generateNarrative = (data: BookFormData, selectedPackage?: PublicPackage | null) => {
  const event = (data.eventType || 'event').toLowerCase();
  const theme = data.theme || 'Modern Luxury';
  const guests = data.guestCount || `${selectedPackage?.paxIncluded ?? 50}`;

  let narrative = `Your ${theme} vision for this ${event} is elegantly refined for ${guests} guests. `;

  const timeStr = (data.time || '').toLowerCase();
  if (timeStr.includes('morning') || timeStr.includes('am')) {
    narrative += 'This blueprint pairs morning radiance with attentive event support, ';
  } else if (timeStr.includes('sunset') || timeStr.includes('afternoon')) {
    narrative += 'This blueprint pairs golden-hour warmth with attentive event support, ';
  } else if (timeStr.includes('evening') || timeStr.includes('night') || timeStr.includes('pm') || timeStr.includes('luminous')) {
    narrative += 'This blueprint pairs evening ambiance with attentive event support, ';
  } else {
    narrative += 'This blueprint pairs timeless ambiance with attentive event support, ';
  }

  narrative += event.includes('wedding')
    ? 'crafting a romantic reception flow. '
    : 'crafting an unforgettable celebration. ';

  if (selectedPackage) {
    narrative += `${selectedPackage.packageName} anchors the plan with ${selectedPackage.inclusions.length} curated inclusion${selectedPackage.inclusions.length === 1 ? '' : 's'}.`;
  } else {
    narrative += 'Choose an available package below to complete the plan.';
  }

  return narrative;
};

function money(value: number, currency = 'PHP') {
  return `${currency} ${value.toLocaleString('en-PH', {
    maximumFractionDigits: 0,
  })}`;
}

type SubmissionState = {
  status: 'idle' | 'submitting' | 'success' | 'error';
  message: string;
  bookingReference: string;
};

export default function Step11Result({
  cancelBooking,
  data,
  goToStep,
}: Props) {
  const heroImage = themeImages[data.theme] || themeImages.default;
  const [packages, setPackages] = useState<PublicPackage[]>([]);
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [expandedPackage, setExpandedPackage] = useState<string | null>(null);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [packageError, setPackageError] = useState('');
  const [client, setClient] = useState({
    fullName: '',
    email: '',
    facebook: '',
    phone: '',
  });
  const [submission, setSubmission] = useState<SubmissionState>({
    status: 'idle',
    message: '',
    bookingReference: '',
  });

  useEffect(() => {
    let cancelled = false;

    async function loadPackages() {
      if (!data.eventCategorySlug) {
        setLoadingPackages(false);
        setPackages([]);
        return;
      }

      setLoadingPackages(true);
      setPackageError('');

      try {
        const response = await fetch(`/api/client/packages?categorySlug=${encodeURIComponent(data.eventCategorySlug)}`, {
          cache: 'no-store',
        });
        const payload = await response.json() as {
          data?: { packages: PublicPackage[] };
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || 'Unable to load packages.');
        }

        const nextPackages = payload.data?.packages ?? [];
        if (!cancelled) {
          setPackages(nextPackages);
          setSelectedPackageId((current) => (
            current && nextPackages.some((item) => item.id === current)
              ? current
              : nextPackages[0]?.id ?? ''
          ));
        }
      } catch (loadError) {
        if (!cancelled) {
          setPackageError(loadError instanceof Error ? loadError.message : 'Unable to load packages.');
        }
      } finally {
        if (!cancelled) setLoadingPackages(false);
      }
    }

    void loadPackages();

    return () => {
      cancelled = true;
    };
  }, [data.eventCategorySlug]);

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.id === selectedPackageId) ?? null,
    [packages, selectedPackageId],
  );
  const dynamicNarrative = generateNarrative(data, selectedPackage);

  const submitBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedPackage) {
      setSubmission({
        status: 'error',
        message: 'Please select an active package before booking.',
        bookingReference: '',
      });
      return;
    }

    setSubmission({ status: 'submitting', message: '', bookingReference: '' });

    try {
      const response = await fetch('/api/client/bookings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          clientName: client.fullName,
          clientEmail: client.email,
          clientPhone: client.phone,
          facebook: client.facebook,
          eventType: data.eventType,
          eventCategoryId: data.eventCategoryId,
          eventCategorySlug: data.eventCategorySlug,
          eventDate: data.date,
          preferredTime: data.time,
          guestCount: data.guestCount,
          packageId: selectedPackage.id,
          packageVersion: selectedPackage.currentVersion,
          packageSelected: selectedPackage.packageName,
          theme: data.theme,
          budget: data.budget,
          addOns: data.addOns,
          specialRequests: data.notes,
        }),
      });
      const payload = await response.json() as {
        error?: string;
        message?: string;
        bookingId?: string;
        bookingReference?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || 'Unable to submit your booking request.');
      }

      setSubmission({
        status: 'success',
        message: payload.message || 'Your booking request has been submitted successfully. Please wait for confirmation from Zion Events Place.',
        bookingReference: payload.bookingReference || '',
      });
    } catch (submitError) {
      setSubmission({
        status: 'error',
        message: submitError instanceof Error ? submitError.message : 'Unable to submit your booking request.',
        bookingReference: '',
      });
    }
  };

  return (
    <div className="flex w-full flex-col items-center bg-[#FDFCEE] pb-24 pt-10 sm:pt-16">
      <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 md:px-8">
        <h1 className="mb-7 text-center font-serif text-3xl tracking-tight text-[#1a1f18] animate-[fadeInUp_0.6s_ease-out] sm:mb-10 sm:text-5xl md:text-6xl">
          The Signature Narrative
        </h1>

        <div className="group relative mb-8 h-[50svh] min-h-[22rem] max-h-[34rem] w-full overflow-hidden rounded-2xl shadow-2xl animate-[fadeInUp_0.8s_ease-out] sm:mb-12 sm:min-h-[31.25rem] sm:rounded-3xl">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms] group-hover:scale-[1.03]"
            style={{ backgroundImage: `url("${selectedPackage?.packageImageUrl || heroImage}")` }}
          />
          <button
            onClick={() => goToStep(9)}
            className="absolute bottom-4 right-4 flex min-h-11 items-center gap-2 rounded-full border border-white/40 bg-white/80 px-4 py-2 font-serif text-base text-[#1a1f18] shadow-lg backdrop-blur-md transition-all hover:bg-white sm:bottom-6 sm:right-6 sm:px-6 sm:py-3 sm:text-xl"
          >
            Refine Plan
          </button>
        </div>

        <div className="mx-auto mb-12 max-w-4xl px-2 text-center animate-[fadeInUp_1s_ease-out] sm:mb-20 sm:px-4">
          <p className="font-serif text-lg italic leading-relaxed text-[#1a1f18] sm:text-2xl md:text-[28px]">
            {dynamicNarrative}
          </p>
        </div>

        <div className="mb-12 animate-[fadeInUp_1.2s_ease-out] sm:mb-20">
          <h2 className="mb-6 font-serif text-3xl italic text-[#1a1f18] sm:mb-10 sm:text-4xl">
            Available Packages
          </h2>

          {loadingPackages ? (
            <div className="flex min-h-[260px] items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#D4A017]/30 border-t-[#D4A017]" />
            </div>
          ) : packageError ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-5 text-center text-red-700">
              {packageError}
            </div>
          ) : packages.length === 0 ? (
            <div className="rounded-3xl border border-[#D2CB96]/40 bg-white/70 px-6 py-5 text-center text-[#3A4B3C]">
              No active packages are available for {data.eventType || 'this event'} right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 px-0 sm:gap-8 sm:px-2 md:grid-cols-3">
              {packages.map((pkg, index) => (
                <article
                  data-touch-surface
                  key={pkg.id}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl sm:rounded-3xl md:hover:-translate-y-2 ${
                    selectedPackageId === pkg.id ? 'ring-2 ring-[#D4A017] ring-offset-2 sm:ring-4 sm:ring-offset-4' : ''
                  }`}
                  style={{ animationDelay: `${1.2 + (index * 0.1)}s` }}
                >
                  {index === 0 && (
                    <div className="absolute top-0 left-0 bg-[#FFD700] text-[#1a1f18] text-xs font-bold px-3 py-1.5 rounded-br-xl z-10 shadow-sm uppercase tracking-wider">
                      Best Match
                    </div>
                  )}

                  <div className="relative h-44 w-full overflow-hidden sm:h-48">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: `url("${pkg.packageImageUrl || heroImage}")` }}
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                  </div>

                  <div className="border-b border-black/10 bg-[#B19D31] px-3 py-4 text-center font-serif text-2xl leading-tight tracking-wide text-white transition-colors duration-300 group-hover:brightness-110 sm:py-5 sm:text-[28px]">
                    {pkg.packageName}
                  </div>

                  <div className="bg-[#C7B342] px-4 py-3 text-center text-white transition-colors duration-300 group-hover:brightness-110 sm:px-5 sm:py-4">
                    <p className="font-serif text-2xl tracking-wide sm:text-[26px]">{money(pkg.price, pkg.currency)}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-white/85">
                      {pkg.paxIncluded} pax included
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 bg-white p-3 sm:p-4">
                    <button
                      aria-pressed={selectedPackageId === pkg.id}
                      type="button"
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className="min-h-11 rounded-full bg-[#1a1f18] px-3 py-2 text-sm font-bold leading-tight text-white hover:bg-[#D4A017] hover:text-[#1a1f18]"
                    >
                      {selectedPackageId === pkg.id ? 'Selected' : 'Select Package'}
                    </button>
                    <button
                      aria-expanded={expandedPackage === pkg.id}
                      type="button"
                      onClick={() => setExpandedPackage(expandedPackage === pkg.id ? null : pkg.id)}
                      className="min-h-11 rounded-full border border-[#1a1f18]/20 px-3 py-2 text-sm font-bold leading-tight hover:bg-[#F5F1DA]"
                    >
                      View Package
                    </button>
                  </div>
                  {expandedPackage === pkg.id && (
                    <div className="bg-[#FDFCEE] px-5 pb-5 text-sm leading-6 text-[#3A4B3C]">
                      <p>{pkg.description || 'This package includes curated Zion event essentials.'}</p>
                      <ul className="mt-3 space-y-1">
                        {pkg.inclusions.map((inclusion) => (
                          <li key={inclusion.id ?? inclusion.inclusionName}>
                            {inclusion.inclusionName}{inclusion.isOptional ? ' (optional add-on)' : ''}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-3 font-bold">
                        Reservation fee: {money(pkg.reservationFee, pkg.currency)}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 rounded-3xl bg-[#DFD79D] px-5 py-6 shadow-lg animate-[fadeInUp_1.4s_ease-out] sm:rounded-[2rem] sm:px-8 sm:gap-10 md:flex-row md:gap-16 md:px-12 md:py-8">
          <div className="flex-1 flex flex-col justify-center space-y-4">
            {[
              ['Event', data.eventType || 'To be confirmed'],
              ['Package', selectedPackage?.packageName || 'Select a package'],
              ['Guests', data.guestCount || '50-75'],
              ['Theme', data.theme || 'Modern Luxury'],
              ['Date', data.date || 'To be confirmed'],
              ['Time', data.time || 'To be confirmed'],
              ['Package Price', selectedPackage ? money(selectedPackage.price, selectedPackage.currency) : 'TBD'],
              ['Reservation Fee', selectedPackage ? money(selectedPackage.reservationFee, selectedPackage.currency) : 'TBD'],
            ].map(([label, value]) => (
              <div key={label} className="group/row grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] items-start gap-3 border-b-[2px] border-[#1a1f18]/30 pb-1.5 transition-all duration-300 hover:border-[#1a1f18]">
                <span className="font-serif text-base text-[#1a1f18]/70 transition-colors group-hover/row:text-[#1a1f18] sm:text-xl">{label}:</span>
                <span className="min-w-0 break-words text-right font-serif text-lg leading-snug text-[#1a1f18] sm:text-2xl">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <form className="space-y-3 flex flex-col" onSubmit={submitBooking}>
              <input required value={client.fullName} onChange={(event) => setClient((current) => ({ ...current, fullName: event.target.value }))} type="text" autoComplete="name" className="min-h-11 w-full rounded-full bg-white/60 px-4 py-2.5 font-serif text-base text-[#1a1f18] shadow-sm backdrop-blur-sm transition-all placeholder:text-[#1a1f18]/50 hover:bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-white sm:px-6 sm:text-lg" placeholder="Full Name" />
              <input required value={client.email} onChange={(event) => setClient((current) => ({ ...current, email: event.target.value }))} type="email" autoComplete="email" inputMode="email" className="min-h-11 w-full rounded-full bg-white/60 px-4 py-2.5 font-serif text-base text-[#1a1f18] shadow-sm backdrop-blur-sm transition-all placeholder:text-[#1a1f18]/50 hover:bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-white sm:px-6 sm:text-lg" placeholder="Email Address" />
              <input value={client.facebook} onChange={(event) => setClient((current) => ({ ...current, facebook: event.target.value }))} type="text" className="min-h-11 w-full rounded-full bg-white/60 px-4 py-2.5 font-serif text-base text-[#1a1f18] shadow-sm backdrop-blur-sm transition-all placeholder:text-[#1a1f18]/50 hover:bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-white sm:px-6 sm:text-lg" placeholder="Facebook (optional)" />
              <input required value={client.phone} onChange={(event) => setClient((current) => ({ ...current, phone: event.target.value }))} type="tel" autoComplete="tel" inputMode="tel" className="min-h-11 w-full rounded-full bg-white/60 px-4 py-2.5 font-serif text-base text-[#1a1f18] shadow-sm backdrop-blur-sm transition-all placeholder:text-[#1a1f18]/50 hover:bg-white/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-white sm:px-6 sm:text-lg" placeholder="Phone Number" />

              <div className="flex flex-col items-center mt-4 gap-2 pt-1">
                <button disabled={!selectedPackage || submission.status === 'submitting' || submission.status === 'success'} className="min-h-11 w-full rounded-full border border-black/10 bg-[#BEB167] px-6 py-2.5 font-serif text-lg text-[#1a1f18] shadow-[0_4px_10px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-1 hover:bg-[#A89C5A] hover:shadow-[0_6px_15px_rgba(0,0,0,0.15)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:w-fit sm:px-8 sm:text-xl">
                  {submission.status === 'submitting' ? 'Submitting...' : 'Book This Package'}
                </button>
                <button type="button" onClick={cancelBooking} className="px-6 py-1.5 bg-[#EFE9CC]/80 hover:bg-white text-[#1a1f18] font-serif text-[15px] rounded-full transition-all border border-black/5 shadow-sm hover:-translate-y-0.5 active:scale-95">
                  Cancel
                </button>
              </div>
              {submission.message && (
                <div className={`rounded-2xl border px-5 py-4 text-center text-sm leading-6 ${
                  submission.status === 'success'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-red-300 bg-red-50 text-red-700'
                }`}>
                  <p>{submission.message}</p>
                  {submission.bookingReference && (
                    <p className="mt-1 font-bold">Booking reference: {submission.bookingReference}</p>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
