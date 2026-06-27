'use client';

import React, { useState } from 'react';
import { AlertTriangle, CalendarPlus, X } from 'lucide-react';
import type { BookingConflictItem, BookingFormValues } from '../types';

const EMPTY_FORM: BookingFormValues = {
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  clientAddress: '',
  eventTitle: '',
  eventType: 'Wedding',
  eventDate: '',
  startTime: '',
  endTime: '',
  venue: 'Main Hall',
  guestCount: '0',
  packageSelected: '',
  theme: '',
  colors: '',
  specialRequests: '',
  assignedCoordinator: '',
  internalNotes: '',
  conflictOverrideReason: '',
};

function Field({
  label,
  children,
  className = '',
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`space-y-1.5 ${className}`}>
      <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500 dark:text-[#A3B19B]">{label}</span>
      {children}
    </label>
  );
}

const inputClass = 'h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-[#D6B53B] focus:ring-2 focus:ring-[#D6B53B]/20 dark:border-white/10 dark:bg-white/5 dark:text-white';
const textareaClass = 'min-h-24 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#D6B53B] focus:ring-2 focus:ring-[#D6B53B]/20 dark:border-white/10 dark:bg-white/5 dark:text-white';

export default function BookingCreateModal({
  coordinatorOptions,
  eventTypeOptions,
  isOpen,
  isSuperAdmin,
  onClose,
  onCreated,
}: {
  coordinatorOptions: string[];
  eventTypeOptions: string[];
  isOpen: boolean;
  isSuperAdmin: boolean;
  onClose: () => void;
  onCreated: (bookingId: string) => Promise<void>;
}) {
  const [form, setForm] = useState<BookingFormValues>(EMPTY_FORM);
  const [conflicts, setConflicts] = useState<BookingConflictItem[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) {
    return null;
  }

  const setField = (field: keyof BookingFormValues, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const close = () => {
    if (isSubmitting) return;
    setForm(EMPTY_FORM);
    setConflicts([]);
    setError('');
    onClose();
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          guestCount: Number(form.guestCount),
          clientEmail: form.clientEmail || null,
          clientPhone: form.clientPhone || null,
          clientAddress: form.clientAddress || null,
          startTime: form.startTime || null,
          endTime: form.endTime || null,
          packageSelected: form.packageSelected || null,
          specialRequests: form.specialRequests || null,
          assignedCoordinator: form.assignedCoordinator || null,
          internalNotes: form.internalNotes || null,
          conflictOverrideReason: form.conflictOverrideReason || null,
        }),
      });
      const payload = await response.json() as {
        bookingId?: string;
        conflicts?: BookingConflictItem[];
        error?: string;
      };

      if (!response.ok || !payload.bookingId) {
        setConflicts(payload.conflicts ?? []);
        throw new Error(payload.error || 'Unable to create booking.');
      }

      const bookingId = payload.bookingId;
      setForm(EMPTY_FORM);
      setConflicts([]);
      onClose();
      await onCreated(bookingId);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to create booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const combinedEventTypes = Array.from(new Set([
    'Wedding',
    'Debut',
    'Christening',
    'Party',
    'Corporate',
    ...eventTypeOptions,
  ]));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-[#D6B53B]/20 bg-[#F9F8F1] shadow-2xl dark:bg-[#1C1D21]">
        <div className="flex items-center justify-between border-b border-[#D6B53B]/15 bg-white/90 px-6 py-5 dark:bg-[#141A13]/90">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E7722] dark:text-[#D6B53B]">Manual fallback</p>
            <h2 className="mt-1 flex items-center gap-2 font-sahitya text-2xl font-bold uppercase tracking-[0.06em] text-gray-900 dark:text-white">
              <CalendarPlus className="h-5 w-5 text-[#D6B53B]" />
              New Booking
            </h2>
          </div>
          <button type="button" onClick={close} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="overflow-y-auto p-6">
            <div className="grid gap-5 lg:grid-cols-2">
              <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/5 dark:bg-[#141A13]">
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#8E7722] dark:text-[#D6B53B]">Client Details</h3>
                <Field label="Client Name"><input required value={form.clientName} onChange={(event) => setField('clientName', event.target.value)} className={inputClass} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Email"><input type="email" value={form.clientEmail} onChange={(event) => setField('clientEmail', event.target.value)} className={inputClass} /></Field>
                  <Field label="Phone"><input value={form.clientPhone} onChange={(event) => setField('clientPhone', event.target.value)} className={inputClass} /></Field>
                </div>
                <Field label="Address"><textarea value={form.clientAddress} onChange={(event) => setField('clientAddress', event.target.value)} className={textareaClass} /></Field>
              </section>

              <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/5 dark:bg-[#141A13]">
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#8E7722] dark:text-[#D6B53B]">Event Details</h3>
                <Field label="Event Title"><input required value={form.eventTitle} onChange={(event) => setField('eventTitle', event.target.value)} className={inputClass} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Event Type">
                    <select value={form.eventType} onChange={(event) => setField('eventType', event.target.value)} className={inputClass}>
                      {combinedEventTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </Field>
                  <Field label="Guest Count"><input type="number" min="0" required value={form.guestCount} onChange={(event) => setField('guestCount', event.target.value)} className={inputClass} /></Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Venue"><input required value={form.venue} onChange={(event) => setField('venue', event.target.value)} className={inputClass} /></Field>
                  <Field label="Package"><input value={form.packageSelected} onChange={(event) => setField('packageSelected', event.target.value)} className={inputClass} /></Field>
                </div>
                <Field label="Special Requests"><textarea value={form.specialRequests} onChange={(event) => setField('specialRequests', event.target.value)} className={textareaClass} /></Field>
              </section>

              <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/5 dark:bg-[#141A13]">
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#8E7722] dark:text-[#D6B53B]">Schedule</h3>
                <Field label="Event Date"><input type="date" required value={form.eventDate} onChange={(event) => setField('eventDate', event.target.value)} className={inputClass} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Start Time"><input type="time" value={form.startTime} onChange={(event) => setField('startTime', event.target.value)} className={inputClass} /></Field>
                  <Field label="End Time"><input type="time" value={form.endTime} onChange={(event) => setField('endTime', event.target.value)} className={inputClass} /></Field>
                </div>
                <Field label="Assigned Coordinator">
                  <select value={form.assignedCoordinator} onChange={(event) => setField('assignedCoordinator', event.target.value)} className={inputClass}>
                    <option value="">Unassigned</option>
                    {coordinatorOptions.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </Field>
              </section>

              <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/5 dark:bg-[#141A13]">
                <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-[#8E7722] dark:text-[#D6B53B]">Internal</h3>
                <Field label="Internal Notes"><textarea value={form.internalNotes} onChange={(event) => setField('internalNotes', event.target.value)} className="min-h-40 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#D6B53B] dark:border-white/10 dark:bg-white/5 dark:text-white" /></Field>
                <p className="text-xs leading-5 text-gray-400">Payment, contract, source, sync, and automation fields are controlled by their owning modules.</p>
              </section>
            </div>

            {conflicts.length > 0 && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold">Schedule conflict detected</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {conflicts.map((conflict) => (
                        <div key={conflict.id} className="rounded-xl bg-white/70 p-3 text-sm dark:bg-black/20">
                          <div className="font-bold">{conflict.bookingReference} · {conflict.eventTitle}</div>
                          <div className="mt-1 text-xs">{conflict.startTime ?? '—'}-{conflict.endTime ?? '—'} · {conflict.venue}</div>
                        </div>
                      ))}
                    </div>
                    {isSuperAdmin && (
                      <Field label="Super Admin Override Reason" className="mt-4 block">
                        <textarea
                          minLength={10}
                          value={form.conflictOverrideReason}
                          onChange={(event) => setField('conflictOverrideReason', event.target.value)}
                          placeholder="Explain why this conflict may be overridden (minimum 10 characters)."
                          className={textareaClass}
                        />
                      </Field>
                    )}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 bg-white px-6 py-4 dark:border-white/10 dark:bg-[#141A13]">
            <button type="button" onClick={close} disabled={isSubmitting} className="rounded-xl px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="rounded-xl bg-[#1a1f18] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#D6B53B] disabled:opacity-60">
              {isSubmitting ? 'Creating...' : conflicts.length > 0 && isSuperAdmin ? 'Override & Create' : 'Create Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
