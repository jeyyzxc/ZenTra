'use client';

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type {
  BookingConflictItem,
  BookingDetailItem,
  BookingFormValues,
} from '../types';

const inputClass = 'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-[#D6B53B] focus:ring-2 focus:ring-[#D6B53B]/20 dark:border-white/10 dark:bg-white/5 dark:text-white';
const textareaClass = 'min-h-24 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#D6B53B] focus:ring-2 focus:ring-[#D6B53B]/20 dark:border-white/10 dark:bg-white/5 dark:text-white';

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`space-y-1.5 ${className}`}>
      <span className="block text-[10px] font-bold uppercase tracking-[0.13em] text-gray-500 dark:text-[#A3B19B]">{label}</span>
      {children}
    </label>
  );
}

export default function BookingEditForm({
  booking,
  coordinatorOptions,
  eventTypeOptions,
  isSuperAdmin,
  onCancel,
  onSaved,
}: {
  booking: BookingDetailItem;
  coordinatorOptions: string[];
  eventTypeOptions: string[];
  isSuperAdmin: boolean;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState<BookingFormValues>({
    clientName: booking.clientName,
    clientEmail: booking.clientEmail ?? '',
    clientPhone: booking.clientPhone ?? '',
    clientAddress: booking.clientAddress ?? '',
    eventTitle: booking.eventTitle,
    eventType: booking.eventType,
    eventDate: booking.eventDate.slice(0, 10),
    startTime: booking.startTime ?? '',
    endTime: booking.endTime ?? '',
    venue: booking.venue,
    guestCount: String(booking.guestCount),
    packageSelected: booking.packageSelected ?? '',
    theme: booking.theme ?? '',
    colors: booking.colors ?? '',
    specialRequests: booking.specialRequests ?? '',
    assignedCoordinator: booking.assignedCoordinator ?? '',
    internalNotes: booking.internalNotes ?? '',
    conflictOverrideReason: '',
  });
  const [conflicts, setConflicts] = useState<BookingConflictItem[]>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = (field: keyof BookingFormValues, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
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
          theme: form.theme || null,
          colors: form.colors || null,
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

      if (!response.ok) {
        setConflicts(payload.conflicts ?? []);
        throw new Error(payload.error || 'Unable to update booking.');
      }

      await onSaved();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to update booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const eventTypes = Array.from(new Set([booking.eventType, ...eventTypeOptions]));

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client Name"><input required value={form.clientName} onChange={(event) => setField('clientName', event.target.value)} className={inputClass} /></Field>
        <Field label="Client Email"><input type="email" value={form.clientEmail} onChange={(event) => setField('clientEmail', event.target.value)} className={inputClass} /></Field>
        <Field label="Client Phone"><input value={form.clientPhone} onChange={(event) => setField('clientPhone', event.target.value)} className={inputClass} /></Field>
        <Field label="Client Address"><input value={form.clientAddress} onChange={(event) => setField('clientAddress', event.target.value)} className={inputClass} /></Field>
        <Field label="Event Title"><input required value={form.eventTitle} onChange={(event) => setField('eventTitle', event.target.value)} className={inputClass} /></Field>
        <Field label="Event Type">
          <select value={form.eventType} onChange={(event) => setField('eventType', event.target.value)} className={inputClass}>
            {eventTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </Field>
        <Field label="Event Date"><input type="date" required value={form.eventDate} onChange={(event) => setField('eventDate', event.target.value)} className={inputClass} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start"><input type="time" value={form.startTime} onChange={(event) => setField('startTime', event.target.value)} className={inputClass} /></Field>
          <Field label="End"><input type="time" value={form.endTime} onChange={(event) => setField('endTime', event.target.value)} className={inputClass} /></Field>
        </div>
        <Field label="Venue"><input required value={form.venue} onChange={(event) => setField('venue', event.target.value)} className={inputClass} /></Field>
        <Field label="Guest Count"><input type="number" min="0" value={form.guestCount} onChange={(event) => setField('guestCount', event.target.value)} className={inputClass} /></Field>
        <Field label="Package"><input value={form.packageSelected} onChange={(event) => setField('packageSelected', event.target.value)} className={inputClass} /></Field>
        <Field label="Theme"><input value={form.theme} onChange={(event) => setField('theme', event.target.value)} className={inputClass} /></Field>
        <Field label="Colors"><input value={form.colors} onChange={(event) => setField('colors', event.target.value)} className={inputClass} /></Field>
        <Field label="Coordinator">
          <select value={form.assignedCoordinator} onChange={(event) => setField('assignedCoordinator', event.target.value)} className={inputClass}>
            <option value="">Unassigned</option>
            {coordinatorOptions.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </Field>
        <Field label="Special Requests" className="sm:col-span-2"><textarea value={form.specialRequests} onChange={(event) => setField('specialRequests', event.target.value)} className={textareaClass} /></Field>
        <Field label="Internal Notes" className="sm:col-span-2"><textarea value={form.internalNotes} onChange={(event) => setField('internalNotes', event.target.value)} className={textareaClass} /></Field>
      </div>

      {conflicts.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
          <div className="flex gap-2 font-bold"><AlertTriangle className="h-4 w-4" /> Schedule conflict detected</div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {conflicts.map((conflict) => (
              <div key={conflict.id} className="rounded-lg bg-white/70 p-2 dark:bg-black/20">
                {conflict.bookingReference} · {conflict.startTime}-{conflict.endTime}
              </div>
            ))}
          </div>
          {isSuperAdmin && (
            <Field label="Super Admin Override Reason" className="mt-3 block">
              <textarea
                minLength={10}
                value={form.conflictOverrideReason}
                onChange={(event) => setField('conflictOverrideReason', event.target.value)}
                className={textareaClass}
              />
            </Field>
          )}
        </div>
      )}

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} disabled={isSubmitting} className="rounded-xl px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5">Cancel</button>
        <button type="submit" disabled={isSubmitting} className="rounded-xl bg-[#1a1f18] px-5 py-2 text-sm font-bold text-white hover:bg-[#D6B53B] disabled:opacity-60">
          {isSubmitting ? 'Saving...' : conflicts.length > 0 && isSuperAdmin ? 'Override & Save' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
