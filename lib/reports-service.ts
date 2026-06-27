import {
  BookingStatus,
  InquiryStatus,
  PaymentSummaryStatus,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';

function monthStart(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth() + offset, 1);
}

export async function getReportsData() {
  const now = new Date();
  const starts = Array.from({ length: 6 }, (_, index) => monthStart(now, index - 5));
  const rangeStart = starts[0];
  const rangeEnd = monthStart(now, 1);

  const [bookings, payments, verifiedPayments, inquiries] = await Promise.all([
    prisma.booking.findMany({
      where: { createdAt: { gte: rangeStart, lt: rangeEnd } },
      select: {
        id: true,
        eventType: true,
        eventCategoryName: true,
        packageSelected: true,
        status: true,
        createdAt: true,
        paymentTotalAmount: true,
        paymentRemainingBalance: true,
      },
    }),
    prisma.paymentRecord.findMany({
      where: {
        createdAt: { gte: rangeStart, lt: rangeEnd },
        status: {
          notIn: [
            PaymentSummaryStatus.REFUNDED,
            PaymentSummaryStatus.CANCELLED,
            PaymentSummaryStatus.FAILED,
          ],
        },
      },
      select: {
        status: true,
        amountPaid: true,
        remainingBalance: true,
        paymentDate: true,
        createdAt: true,
      },
    }),
    prisma.paymentHistory.findMany({
      where: {
        action: { in: ['payment_verified', 'payment_override'] },
        paymentAmount: { gt: 0 },
        createdAt: { gte: rangeStart, lt: rangeEnd },
      },
      select: {
        paymentAmount: true,
        createdAt: true,
      },
    }),
    prisma.inquiry.findMany({
      where: { submittedAt: { gte: rangeStart, lt: rangeEnd } },
      select: {
        submittedAt: true,
        answeredAt: true,
        status: true,
        eventInterest: true,
      },
    }),
  ]);

  const monthly = starts.map((start, index) => {
    const end = index === starts.length - 1 ? rangeEnd : starts[index + 1];
    const monthBookings = bookings.filter((booking) => booking.createdAt >= start && booking.createdAt < end);
    const monthPayments = verifiedPayments.filter((payment) => (
      payment.createdAt >= start && payment.createdAt < end
    ));
    const monthInquiries = inquiries.filter((inquiry) => (
      inquiry.submittedAt >= start && inquiry.submittedAt < end
    ));

    return {
      label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(start),
      bookings: monthBookings.length,
      pending: monthBookings.filter((booking) => booking.status === BookingStatus.PENDING).length,
      confirmed: monthBookings.filter((booking) => (
        booking.status === BookingStatus.CONFIRMED ||
        booking.status === BookingStatus.IN_PROGRESS ||
        booking.status === BookingStatus.COMPLETED
      )).length,
      revenue: monthPayments.reduce((sum, payment) => sum + (payment.paymentAmount ?? 0), 0),
      inquiries: monthInquiries.length,
      convertedInquiries: monthInquiries.filter((inquiry) => (
        inquiry.status === InquiryStatus.CONVERTED_TO_BOOKING
      )).length,
    };
  });

  const countBy = (values: Array<string | null>) => Array.from(
    values.reduce((map, value) => {
      const key = value?.trim() || 'Not specified';
      map.set(key, (map.get(key) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const inactiveStatuses = new Set<BookingStatus>([
    BookingStatus.CANCELLED,
    BookingStatus.DECLINED,
    BookingStatus.EXPIRED,
  ]);
  const activeBookings = bookings.filter((booking) => !inactiveStatuses.has(booking.status));
  const pendingPayments = payments.filter((payment) => (
    payment.status === PaymentSummaryStatus.UNPAID ||
    payment.status === PaymentSummaryStatus.FOR_VERIFICATION ||
    payment.status === PaymentSummaryStatus.RESERVATION_PAID ||
    payment.status === PaymentSummaryStatus.DOWN_PAYMENT_PAID ||
    payment.status === PaymentSummaryStatus.PARTIALLY_PAID ||
    payment.status === PaymentSummaryStatus.OVERDUE ||
    payment.status === PaymentSummaryStatus.REJECTED ||
    payment.remainingBalance > 0
  ));
  const convertedInquiries = inquiries.filter((inquiry) => (
    inquiry.status === InquiryStatus.CONVERTED_TO_BOOKING
  )).length;
  const answeredInquiries = inquiries.filter((inquiry) => inquiry.answeredAt);
  const averageInquiryResponseHours = answeredInquiries.length
    ? answeredInquiries.reduce((sum, inquiry) => (
        sum + ((inquiry.answeredAt!.getTime() - inquiry.submittedAt.getTime()) / 3_600_000)
      ), 0) / answeredInquiries.length
    : 0;

  return {
    monthly,
    eventTypes: countBy(bookings.map((booking) => booking.eventCategoryName ?? booking.eventType)),
    packages: countBy(bookings.map((booking) => booking.packageSelected)),
    inquiryEventInterests: countBy(inquiries.map((inquiry) => inquiry.eventInterest)),
    summary: {
      bookingCount: bookings.length,
      pendingBookingCount: bookings.filter((booking) => booking.status === BookingStatus.PENDING).length,
      revenueCollected: verifiedPayments.reduce((sum, payment) => sum + (payment.paymentAmount ?? 0), 0),
      revenueForecast: activeBookings.reduce((sum, booking) => sum + (booking.paymentTotalAmount ?? 0), 0),
      pendingPaymentCount: pendingPayments.length,
      pendingPaymentBalance: pendingPayments.reduce((sum, payment) => sum + payment.remainingBalance, 0),
      inquiryCount: inquiries.length,
      inquiryConversionRate: inquiries.length ? (convertedInquiries / inquiries.length) * 100 : 0,
      averageInquiryResponseHours,
      unansweredInquiryCount: inquiries.filter((inquiry) => (
        inquiry.status === InquiryStatus.NEW ||
        inquiry.status === InquiryStatus.PENDING_RESPONSE
      )).length,
      followUpInquiryCount: inquiries.filter((inquiry) => (
        inquiry.status === InquiryStatus.FOLLOW_UP
      )).length,
    },
  };
}
