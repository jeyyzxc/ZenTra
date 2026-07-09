'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Bot,
  CalendarClock,
  CreditCard,
  Download,
  FileSignature,
  Mail,
  MapPin,
  Pencil,
  RefreshCw,
  Save,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import type { BookingDetailItem } from '../types';
import BookingEditForm from './BookingEditForm';
import BookingStatusBadge from './BookingStatusBadge';
import BookingTimeline from './BookingTimeline';

function Section({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#141A13]">
      <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8E7722] dark:text-[#D6B53B]">{title}</h3>
      {children}
    </section>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-gray-800 dark:text-gray-100">{value || '—'}</div>
    </div>
  );
}

function formatDate(value: string | null, includeTime = false) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-PH', includeTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(new Date(value));
}

function formatMoney(value: number | null) {
  if (value === null) return '—';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatEnum(value: string) {
  return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()).replace(/\bN8n\b/g, 'n8n').replace(/\bAi\b/g, 'AI');
}

export default function BookingDetail({
  booking,
  coordinatorOptions,
  eventTypeOptions,
  isLoading,
  isOpen,
  isSuperAdmin,
  onClose,
  onReload,
  paymentOptions,
  statusOptions,
}: {
  booking: BookingDetailItem | null;
  coordinatorOptions: string[];
  eventTypeOptions: string[];
  isLoading: boolean;
  isOpen: boolean;
  isSuperAdmin: boolean;
  onClose: () => void;
  onReload: () => Promise<void>;
  paymentOptions: string[];
  statusOptions: string[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [newStatus, setNewStatus] = useState<string>(booking?.status ?? 'PENDING');
  const [statusReason, setStatusReason] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<string>(booking?.paymentSummaryStatus ?? 'UNPAID');
  const [paymentReason, setPaymentReason] = useState('');
  const [notes, setNotes] = useState(booking?.internalNotes ?? '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) {
    return null;
  }

  const mutate = async (url: string, method: 'PATCH' | 'POST', body: unknown, successMessage: string) => {
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json() as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || 'The booking update failed.');
      }

      setSuccess(successMessage);
      await onReload();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'The booking update failed.');
    } finally {
      setIsSaving(false);
    }
  };

  const triggerAutomation = async (action: string) => {
    if (!booking) return;
    await mutate(
      `/api/bookings/${booking.id}/automation`,
      'POST',
      { action },
      'Automation request recorded.',
    );
  };

  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-black/45 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="flex h-full w-full max-w-4xl flex-col bg-[#F9F8F1] shadow-2xl dark:bg-[#1C1D21]">
        <div className="flex items-start justify-between border-b border-[#D6B53B]/15 bg-white/90 px-5 py-4 backdrop-blur dark:bg-[#141A13]/90 sm:px-7">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8E7722] dark:text-[#D6B53B]">Booking Detail</p>
            <h2 className="mt-1 truncate font-sahitya text-2xl font-bold uppercase tracking-[0.05em] text-gray-900 dark:text-white">
              {booking?.bookingReference ?? 'Loading booking'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {booking && !isEditing && (
              <>
                <a
                  href={`/api/bookings/${booking.id}/summary?timeZone=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#D6B53B]/30 bg-white px-4 py-2 text-xs font-bold text-[#8E7722] hover:bg-[#FDF5CC] dark:bg-white/5 dark:text-[#D6B53B]"
                >
                  <Download className="h-4 w-4" />
                  Summary PDF
                </a>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#D6B53B]/30 bg-white px-4 py-2 text-xs font-bold text-[#8E7722] hover:bg-[#FDF5CC] dark:bg-white/5 dark:text-[#D6B53B]"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Booking
                </button>
              </>
            )}
            <button type="button" onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10" aria-label="Close booking detail">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading || !booking ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-white dark:bg-white/5" />)}
            </div>
          ) : isEditing ? (
            <Section title="Edit Booking">
              <BookingEditForm
                booking={booking}
                coordinatorOptions={coordinatorOptions}
                eventTypeOptions={eventTypeOptions}
                isSuperAdmin={isSuperAdmin}
                onCancel={() => setIsEditing(false)}
                onSaved={async () => {
                  setIsEditing(false);
                  setSuccess('Booking details saved.');
                  await onReload();
                }}
              />
            </Section>
          ) : (
            <div className="space-y-5">
              {(error || success) && (
                <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
                  error
                    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
                }`}>
                  {error || success}
                </div>
              )}

              <Section title="1 — Booking Summary">
                <div className="flex flex-wrap gap-2">
                  <BookingStatusBadge kind="booking" value={booking.status} />
                  <BookingStatusBadge kind="source" value={booking.bookingSource} />
                  <BookingStatusBadge kind="sync" value={booking.syncStatus} />
                  <BookingStatusBadge kind="automation" value={booking.automationStatus} />
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <DetailItem label="Created" value={formatDate(booking.createdAt, true)} />
                  <DetailItem label="Last Updated" value={formatDate(booking.updatedAt, true)} />
                  <DetailItem label="Last Synced" value={formatDate(booking.lastSyncedAt, true)} />
                </div>
              </Section>

              <div className="grid gap-5 lg:grid-cols-2">
                <Section title="2 — Client Details">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DetailItem label="Name" value={<span className="inline-flex items-center gap-2"><UserRound className="h-4 w-4 text-[#D6B53B]" />{booking.clientName}</span>} />
                    <DetailItem label="Email" value={booking.clientEmail} />
                    <DetailItem label="Phone" value={booking.clientPhone} />
                    <DetailItem label="Address" value={booking.clientAddress} />
                  </div>
                </Section>

                <Section title="3 — Event Details">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <DetailItem label="Event Title" value={booking.eventTitle} />
                    <DetailItem label="Event Type" value={booking.eventType} />
                    <DetailItem label="Venue" value={<span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-[#D6B53B]" />{booking.venue}</span>} />
                    <DetailItem label="Guests" value={<span className="inline-flex items-center gap-2"><Users className="h-4 w-4 text-[#D6B53B]" />{booking.guestCount}</span>} />
                    <DetailItem label="Package" value={booking.packageSelected} />
                    <DetailItem label="Theme" value={booking.theme} />
                    <DetailItem label="Colors" value={booking.colors} />
                    <DetailItem label="Coordinator" value={booking.assignedCoordinator} />
                  </div>
                  <div className="mt-4">
                    <DetailItem label="Special Requests" value={booking.specialRequests} />
                  </div>
                </Section>
              </div>

              <Section title="4 — Schedule Details">
                <div className="grid gap-4 sm:grid-cols-3">
                  <DetailItem label="Event Date" value={<span className="inline-flex items-center gap-2"><CalendarClock className="h-4 w-4 text-[#D6B53B]" />{formatDate(booking.eventDate)}</span>} />
                  <DetailItem label="Start Time" value={booking.startTime} />
                  <DetailItem label="End Time" value={booking.endTime} />
                </div>
                {booking.conflicts.length > 0 && (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
                    <div className="flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4" /> Conflict warning</div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {booking.conflicts.map((conflict) => (
                        <div
                          key={conflict.id}
                          className="rounded-xl bg-white/75 p-3 text-left dark:bg-black/20"
                        >
                          <div className="font-bold">{conflict.bookingReference} · {conflict.eventTitle}</div>
                          <div className="mt-1 text-xs">{formatDate(conflict.eventDate)} · {conflict.startTime}-{conflict.endTime}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Section>

              <Section title="5 — Payment Summary (Read-Only)">
                <div className="mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#D6B53B]" />
                  <BookingStatusBadge kind="payment" value={booking.paymentSummaryStatus} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailItem label="Total Amount" value={formatMoney(booking.paymentTotalAmount)} />
                  <DetailItem label="Amount Paid" value={formatMoney(booking.paymentAmountPaid)} />
                  <DetailItem label="Balance" value={formatMoney(booking.paymentRemainingBalance)} />
                  <DetailItem label="Due Date" value={formatDate(booking.paymentDueDate)} />
                  <DetailItem label="Latest Payment" value={formatDate(booking.paymentLastDate)} />
                  <DetailItem label="Payment Reference" value={booking.paymentReference} />
                  <DetailItem label="Payment Record ID" value={booking.paymentRecordId} />
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href={`/admin/payments?bookingReference=${encodeURIComponent(booking.bookingReference)}`} className="inline-flex items-center gap-2 rounded-xl bg-[#1a1f18] px-4 py-2 text-xs font-bold text-white hover:bg-[#D6B53B]">
                    <CreditCard className="h-4 w-4" /> View Full Payment Record
                  </Link>
                </div>
                {isSuperAdmin && (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                    <p className="text-xs font-semibold leading-5 text-amber-800 dark:text-amber-200">
                      You are overriding the payment summary. Payment Management remains the source of truth. This override will be logged.
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
                      <select value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value)} className="h-10 rounded-xl border border-amber-200 bg-white px-3 text-sm dark:bg-black/20">
                        {paymentOptions.map((option) => <option key={option} value={option}>{formatEnum(option)}</option>)}
                      </select>
                      <input value={paymentReason} onChange={(event) => setPaymentReason(event.target.value)} placeholder="Override reason (minimum 10 characters)" className="h-10 rounded-xl border border-amber-200 bg-white px-3 text-sm dark:bg-black/20" />
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => void mutate(`/api/bookings/${booking.id}/payment-override`, 'PATCH', {
                          paymentSummaryStatus: paymentStatus,
                          reason: paymentReason,
                        }, 'Payment summary override saved.')}
                        className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                      >
                        Override
                      </button>
                    </div>
                  </div>
                )}
              </Section>

              <Section title="6 — Contract Summary (Read-Only)">
                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailItem label="Contract Status" value={booking.contractStatus} />
                  <DetailItem label="Contract ID" value={booking.contractRecordId} />
                </div>
                <Link href={`/admin/contracts?bookingReference=${encodeURIComponent(booking.bookingReference)}`} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#D6B53B]/30 px-4 py-2 text-xs font-bold text-[#8E7722] hover:bg-[#FDF5CC] dark:text-[#D6B53B]">
                  <FileSignature className="h-4 w-4" /> View Contract
                </Link>
              </Section>

              <Section title="7 — Automation Details">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailItem label="Source" value={<BookingStatusBadge kind="source" value={booking.bookingSource} />} />
                  <DetailItem label="Sync Status" value={<BookingStatusBadge kind="sync" value={booking.syncStatus} />} />
                  <DetailItem label="Automation" value={<BookingStatusBadge kind="automation" value={booking.automationStatus} />} />
                  <DetailItem label="Last Synced" value={formatDate(booking.lastSyncedAt, true)} />
                  <DetailItem label="n8n Workflow" value={booking.n8nWorkflowId} />
                  <DetailItem label="Execution ID" value={booking.n8nExecutionId} />
                  <DetailItem label="Workflow Result" value={booking.lastWorkflowResult} />
                  <DetailItem label="Latest Email" value={booking.latestEmail
                    ? `${formatEnum(booking.latestEmail.emailType)} · ${formatEnum(booking.latestEmail.status)}`
                    : 'No related email'} />
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  {booking.latestEmail && (
                    <Link
                      href={`/admin/audit?tab=email&search=${encodeURIComponent(booking.latestEmail.relatedRecordId ?? booking.bookingReference)}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-xs font-bold text-blue-700 dark:border-blue-500/20 dark:text-blue-300"
                    >
                      <Mail className="h-4 w-4" /> View Email Log
                    </Link>
                  )}
                  <Link href={`/admin/audit?search=${encodeURIComponent(booking.bookingReference)}`} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 dark:border-white/10 dark:text-gray-300">
                    View Related Audit Log
                  </Link>
                </div>
                {isSuperAdmin && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {[
                      ['confirmation', 'Trigger Confirmation'],
                      ['payment-reminder', 'Trigger Payment Reminder'],
                      ['contract', 'Trigger Contract'],
                      ['resync', 'Re-sync Booking'],
                    ].map(([action, label]) => (
                      <button
                        key={action}
                        type="button"
                        disabled={isSaving}
                        onClick={() => void triggerAutomation(action)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#1a1f18] px-4 py-2 text-xs font-bold text-white hover:bg-[#D6B53B] disabled:opacity-60"
                      >
                        {action === 'resync' ? <RefreshCw className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </Section>

              <Section title="Change Status">
                <div className="grid gap-3 md:grid-cols-[1fr_2fr_2fr_auto]">
                  <select value={newStatus} onChange={(event) => setNewStatus(event.target.value)} className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5">
                    {statusOptions.map((option) => <option key={option} value={option}>{formatEnum(option)}</option>)}
                  </select>
                  <input value={statusReason} onChange={(event) => setStatusReason(event.target.value)} placeholder="Status change reason" className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5" />
                  {isSuperAdmin && (
                    <input value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} placeholder="Override reason for exceptional transition" className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5" />
                  )}
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => void mutate(`/api/bookings/${booking.id}/status`, 'PATCH', {
                      newStatus,
                      reason: statusReason,
                      overrideReason: overrideReason || null,
                    }, 'Booking status updated.')}
                    className="rounded-xl bg-[#D6B53B] px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                  >
                    Change Status
                  </button>
                </div>
              </Section>

              <Section title="8 — Booking Timeline">
                <BookingTimeline entries={booking.timeline} />
              </Section>

              <Section title="9 — Internal Notes">
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="min-h-32 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 outline-none focus:border-[#D6B53B] focus:ring-2 focus:ring-[#D6B53B]/20 dark:border-white/10 dark:bg-white/5 dark:text-white"
                  placeholder="Add internal notes for the operations team..."
                />
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void mutate(`/api/bookings/${booking.id}`, 'PATCH', { internalNotes: notes }, 'Internal notes saved.')}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#1a1f18] px-4 py-2 text-xs font-bold text-white hover:bg-[#D6B53B] disabled:opacity-60"
                >
                  <Save className="h-4 w-4" /> Save Notes
                </button>
              </Section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
