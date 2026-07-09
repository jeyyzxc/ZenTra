import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { categorizeBooking } from './booking-categorization.service';
import { buildBookingReceiptEmail } from './receipt-email';

describe('categorizeBooking', () => {
  it('classifies wedding bookings and premium package tiers deterministically', () => {
    const result = categorizeBooking({
      bookingId: 'booking_1',
      bookingReference: 'ZION-BKG-2026-000001',
      eventType: 'Garden Reception',
      packageName: 'Complete Gold Package',
      packageId: 'package_1',
      guestCount: 100,
      eventDate: '2026-12-20',
      startTime: '14:00',
      endTime: '22:00',
      packageSnapshot: {
        packageName: 'Complete Gold Package',
        price: 225000,
        downPaymentAmount: 25000,
      },
    });

    assert.equal(result.eventCategoryKey, 'wedding');
    assert.equal(result.taskTemplateKey, 'wedding_standard');
    assert.equal(result.packageTier, 'premium');
    assert.equal(result.riskLevel, 'low');
    assert.equal(result.requiresManualReview, false);
    assert.equal(result.suggestedAdminRole, 'ADMIN');
    assert.ok(result.reasonCodes.includes('EVENT_WEDDING'));
    assert.ok(result.reasonCodes.includes('PACKAGE_PREMIUM'));
  });

  it('marks schedule conflicts as high risk for Super Admin review', () => {
    const result = categorizeBooking({
      bookingId: 'booking_2',
      bookingReference: 'ZION-BKG-2026-000002',
      eventType: 'Company Party',
      packageName: 'Regular Corporate Package',
      packageId: 'package_2',
      guestCount: 80,
      eventDate: '2026-11-15',
      startTime: '18:00',
      endTime: '23:00',
      packageSnapshot: { packageName: 'Regular Corporate Package', price: 120000 },
      conflicts: [{ bookingReference: 'ZION-BKG-2026-000001' }],
    });

    assert.equal(result.eventCategoryKey, 'corporate_group');
    assert.equal(result.packageTier, 'standard');
    assert.equal(result.riskLevel, 'high');
    assert.equal(result.requiresManualReview, true);
    assert.equal(result.suggestedAdminRole, 'SUPERADMIN');
    assert.ok(result.tags.includes('schedule_conflict'));
  });

  it('uses reservation and unknown package tiers from deterministic text rules', () => {
    const reservationOnly = categorizeBooking({
      bookingId: 'booking_3',
      bookingReference: 'ZION-BKG-2026-000003',
      eventType: 'Birthday',
      packageName: 'Venue Only Reservation',
      packageId: 'package_3',
      eventDate: '2026-10-10',
      startTime: '10:00',
      endTime: '14:00',
      packageSnapshot: { reservationFee: 5000 },
    });
    const unknownPackage = categorizeBooking({
      bookingId: 'booking_4',
      bookingReference: 'ZION-BKG-2026-000004',
      eventType: 'Custom Event',
      packageName: 'Bespoke Celebration',
      eventDate: '2026-10-11',
      startTime: '10:00',
      endTime: '14:00',
      packageSnapshot: { price: 50000 },
    });

    assert.equal(reservationOnly.packageTier, 'reservation_only');
    assert.equal(unknownPackage.packageTier, 'custom_or_unknown');
    assert.ok(reservationOnly.reasonCodes.includes('PACKAGE_RESERVATION_ONLY'));
    assert.ok(unknownPackage.reasonCodes.includes('PACKAGE_CUSTOM_OR_UNKNOWN'));
  });
});

describe('buildBookingReceiptEmail', () => {
  it('builds a client-safe receipt email with the correct remaining balance', () => {
    const remainingBalance = new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(130000);
    const email = buildBookingReceiptEmail({
      booking_id: 'booking_1',
      booking_reference: 'ZION-BKG-2026-000001',
      client_name: 'Client Name',
      client_email: 'CLIENT@EXAMPLE.COM',
      event_type: 'Wedding',
      event_date: '2026-08-27',
      start_time: '07:00',
      end_time: '00:00',
      guest_count: 100,
      package_name: 'Premium Wedding Package',
      package_price: 150000,
      down_payment: 20000,
      remaining_balance: 130000,
      receipt_link: 'http://localhost:3000/booking-receipt/ZION-BKG-2026-000001',
    });

    assert.equal(email.to, 'client@example.com');
    assert.equal(email.subject, 'Booking Request Received \u2013 ZION-BKG-2026-000001');
    assert.match(email.text, new RegExp(`Remaining Balance: ${remainingBalance.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    assert.match(email.html, /View Booking Receipt/);
    assert.doesNotMatch(`${email.html}\n${email.text}`, /\b(undefined|null|n8n|workflow|execution)\b/i);
    assert.match(email.text, /does not yet mean that the booking is fully approved or finalized/i);
  });
});
