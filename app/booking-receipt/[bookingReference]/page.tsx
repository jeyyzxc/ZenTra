import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookingStatus, PaymentSummaryStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type ReceiptPageProps = {
  params: Promise<{
    bookingReference: string;
  }>;
};

const progressSteps = [
  'Booking request received',
  'Under review',
  'Approved / confirmed',
  'Contract preparation',
  'Payment review',
  'Event preparation',
  'Completed / successful',
] as const;

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(value);
}

function formatTimeRange(startTime: string | null, endTime: string | null) {
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  return startTime ?? endTime ?? 'To be confirmed';
}

function formatMoney(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return 'To be confirmed';
  }

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function statusLabel(status: string) {
  return status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function completedStepCount(booking: {
  status: BookingStatus;
  contractStatus: string | null;
  paymentSummaryStatus: PaymentSummaryStatus;
}) {
  if (booking.status === BookingStatus.COMPLETED) return 7;
  if (booking.status === BookingStatus.IN_PROGRESS) return 6;
  if (
    booking.paymentSummaryStatus !== PaymentSummaryStatus.UNPAID &&
    booking.paymentSummaryStatus !== PaymentSummaryStatus.REJECTED
  ) return 5;
  if (booking.contractStatus) return 4;
  if (booking.status === BookingStatus.CONFIRMED) return 3;
  if (booking.status === BookingStatus.PENDING || booking.status === BookingStatus.ON_HOLD) return 2;
  return 1;
}

export default async function BookingReceiptPage({ params }: ReceiptPageProps) {
  const { bookingReference } = await params;
  const decodedReference = decodeURIComponent(bookingReference);
  const booking = await prisma.booking.findUnique({
    where: { bookingReference: decodedReference },
    select: {
      bookingReference: true,
      clientName: true,
      eventType: true,
      eventCategoryName: true,
      eventDate: true,
      startTime: true,
      endTime: true,
      guestCount: true,
      packageSelected: true,
      status: true,
      contractStatus: true,
      paymentSummaryStatus: true,
      paymentTotalAmount: true,
      paymentAmountPaid: true,
      paymentRemainingBalance: true,
      createdAt: true,
    },
  });

  if (!booking) {
    notFound();
  }

  const completedSteps = completedStepCount(booking);

  return (
    <main className="min-h-screen bg-[#F8F7F3] px-4 py-8 text-[#111827] dark:bg-[#0C100B] dark:text-[#F4F4F0]">
      <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#141A13]">
          <Image
            src="/zion-logo.png"
            alt="Zion Events Place"
            width={96}
            height={96}
            className="mb-5 h-20 w-20 object-contain"
            priority
          />
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8E7722] dark:text-[#D4AF37]">
            Booking Receipt
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal">
            {booking.bookingReference}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#667085] dark:text-[#A3B19B]">
            Your request has been received by Zion Events Place. This page shows the current progress of your booking request and does not expose internal admin notes.
          </p>

          <div className="mt-6 rounded-lg border border-[#F5E8B8] bg-[#FFF8DF] p-4 text-sm text-[#5F4F13] dark:border-[#D4AF37]/30 dark:bg-[#D4AF37]/10 dark:text-[#E8D579]">
            This receipt confirms submission only. Your event is finalized only after Zion Events Place approves and confirms the booking.
          </div>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-lg bg-[#111827] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1F2937] dark:bg-[#D4AF37] dark:text-black dark:hover:bg-[#E8D579]"
          >
            Back to Zion
          </Link>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#141A13]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#667085] dark:text-[#A3B19B]">
                  Current Status
                </p>
                <h2 className="mt-2 text-2xl font-bold">{statusLabel(booking.status)}</h2>
              </div>
              <span className="rounded-full border border-[#D4AF37]/30 bg-[#F5E8B8] px-3 py-1 text-xs font-bold text-[#8E7722] dark:bg-[#D4AF37]/15 dark:text-[#D4AF37]">
                Submitted {formatDate(booking.createdAt)}
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <SummaryItem label="Client" value={booking.clientName} />
              <SummaryItem label="Event" value={booking.eventCategoryName ?? booking.eventType} />
              <SummaryItem label="Date" value={formatDate(booking.eventDate)} />
              <SummaryItem label="Time" value={formatTimeRange(booking.startTime, booking.endTime)} />
              <SummaryItem label="Guests" value={new Intl.NumberFormat('en-US').format(booking.guestCount)} />
              <SummaryItem label="Package" value={booking.packageSelected ?? 'To be confirmed'} />
            </div>
          </div>

          <div className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#141A13]">
            <h2 className="text-lg font-bold">Payment Summary</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SummaryItem label="Payment Status" value={statusLabel(booking.paymentSummaryStatus)} />
              <SummaryItem label="Total Package Price" value={formatMoney(booking.paymentTotalAmount)} />
              <SummaryItem label="Amount Paid" value={formatMoney(booking.paymentAmountPaid)} />
              <SummaryItem label="Remaining Balance" value={formatMoney(booking.paymentRemainingBalance)} />
            </div>
          </div>

          <div className="rounded-lg border border-[#E5E7EB] bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#141A13]">
            <h2 className="text-lg font-bold">Booking Progress</h2>
            <ol className="mt-5 space-y-4">
              {progressSteps.map((step, index) => {
                const isDone = index < completedSteps;
                const isCurrent = index === completedSteps - 1;

                return (
                  <li key={step} className="flex gap-3">
                    <span
                      className={[
                        'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                        isDone
                          ? 'border-[#2F855A] bg-[#2F855A] text-white'
                          : 'border-[#D0D5DD] text-[#667085] dark:border-white/20 dark:text-[#A3B19B]',
                      ].join(' ')}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className={isCurrent ? 'font-bold text-[#111827] dark:text-[#F4F4F0]' : 'font-semibold text-[#4B5563] dark:text-[#A3B19B]'}>
                        {step}
                      </p>
                      {isCurrent ? (
                        <p className="mt-1 text-sm text-[#667085] dark:text-[#A3B19B]">
                          This is the latest visible progress for your booking request.
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#EAECF0] bg-[#FAFAF8] p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#667085] dark:text-[#A3B19B]">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-[#111827] dark:text-[#F4F4F0]">
        {value}
      </p>
    </div>
  );
}
