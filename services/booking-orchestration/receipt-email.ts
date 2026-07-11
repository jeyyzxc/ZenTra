export type BookingReceiptEmailBooking = {
  booking_id: string;
  booking_reference: string;
  client_name: string;
  client_email: string | null;
  event_type: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  guest_count: number;
  package_name: string | null;
  package_price: number;
  down_payment: number;
  remaining_balance: number;
  receipt_link: string;
};

export type BookingReceiptEmailOptions = {
  logoUrl?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  socialLink?: string | null;
};

export type BookingReceiptEmailPayload = {
  to: string;
  subject: string;
  preheader: string;
  html: string;
  text: string;
  receipt_link: string;
  recipient_name: string;
};

const PREHEADER =
  'Thank you for submitting your booking request. Our team will review your event details and contact you soon.';
const FALLBACK_REQUIRED = 'To be confirmed';
const FALLBACK_OPTIONAL = 'Not specified';

function cleanText(value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function displayText(value: unknown, fallback = FALLBACK_REQUIRED) {
  return cleanText(value) || fallback;
}

function escapeHtml(value: unknown) {
  return displayText(value, '').replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

function escapeAttribute(value: unknown) {
  return escapeHtml(value);
}

function normalizeEmail(value: string | null) {
  return cleanText(value).toLowerCase();
}

function formatMoney(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return FALLBACK_REQUIRED;
  }

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  const normalized = cleanText(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);

  if (!match) {
    return normalized || FALLBACK_REQUIRED;
  }

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));

  if (Number.isNaN(date.getTime())) {
    return FALLBACK_REQUIRED;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatSingleTime(value: string | null) {
  const normalized = cleanText(value);

  if (!normalized) {
    return '';
  }

  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(normalized);

  if (!match) {
    return normalized;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return normalized;
  }

  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
}

function formatTimeRange(startTime: string | null, endTime: string | null) {
  const start = formatSingleTime(startTime);
  const end = formatSingleTime(endTime);

  if (start && end) {
    return `${start} \u2013 ${end}`;
  }

  return start || end || FALLBACK_REQUIRED;
}

function formatGuestCount(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return FALLBACK_REQUIRED;
  }

  return new Intl.NumberFormat('en-US').format(value);
}

function contactLines(options: BookingReceiptEmailOptions) {
  return [
    cleanText(options.supportEmail) ? `Email: ${cleanText(options.supportEmail)}` : null,
    cleanText(options.supportPhone) ? `Phone: ${cleanText(options.supportPhone)}` : null,
    cleanText(options.socialLink) ? `Facebook/Page: ${cleanText(options.socialLink)}` : null,
  ].filter((line): line is string => Boolean(line));
}

function contactHtml(options: BookingReceiptEmailOptions) {
  const lines = contactLines(options);

  if (lines.length === 0) {
    return '';
  }

  return `
                <p style="margin:12px 0 0 0; font-size:14px; line-height:22px; color:#4B5563;">
                  ${lines.map((line) => escapeHtml(line)).join('<br />')}
                </p>`;
}

function logoHtml(options: BookingReceiptEmailOptions) {
  const logoUrl = cleanText(options.logoUrl);

  if (!logoUrl) {
    return '';
  }

  return `<img src="${escapeAttribute(logoUrl)}" alt="Zion Events Place" width="120" style="display:block; width:120px; max-width:120px; height:auto; margin:0 0 12px 0; border:0; outline:none; text-decoration:none;" />`;
}

function ctaHtml(receiptLink: string, bookingReference: string) {
  if (!receiptLink) {
    return `
            <tr>
              <td align="center" style="padding:4px 32px 30px 32px;">
                <div style="font-size:14px; line-height:22px; color:#4B5563;">Please keep your booking reference for tracking: <strong style="color:#111827;">${escapeHtml(bookingReference)}</strong></div>
              </td>
            </tr>`;
  }

  return `
            <tr>
              <td align="center" style="padding:4px 32px 30px 32px;">
                <a href="${escapeAttribute(receiptLink)}" style="display:inline-block; background:#C9A227; color:#111827; text-decoration:none; font-size:15px; line-height:20px; font-weight:700; padding:14px 22px; border-radius:10px;">
                  View Booking Receipt
                </a>
              </td>
            </tr>`;
}

export function buildBookingReceiptEmail(
  booking: BookingReceiptEmailBooking,
  options: BookingReceiptEmailOptions = {},
): BookingReceiptEmailPayload {
  const recipientName = displayText(booking.client_name);
  const recipientEmail = normalizeEmail(booking.client_email);
  const bookingReference = displayText(booking.booking_reference);
  const eventType = displayText(booking.event_type);
  const eventDate = formatDate(booking.event_date);
  const eventTime = formatTimeRange(booking.start_time, booking.end_time);
  const packageName = displayText(booking.package_name, FALLBACK_OPTIONAL);
  const guestCount = formatGuestCount(booking.guest_count);
  const totalPackagePrice = formatMoney(booking.package_price);
  const downPaymentRequired = formatMoney(booking.down_payment);
  const remainingBalance = formatMoney(booking.remaining_balance);
  const receiptLink = cleanText(booking.receipt_link);
  const subject = `Booking Request Received \u2013 ${bookingReference}`;
  const supportLines = contactLines(options);
  const supportText = supportLines.length > 0 ? `\n${supportLines.join('\n')}` : '';

  const text = `Booking Request Received - ${bookingReference}

Hi ${recipientName},

Thank you for submitting your booking request to Zion Events Place. We have received your event details and our team will review your request.

Booking Summary:
Booking Reference: ${bookingReference}
Event Type: ${eventType}
Event Date: ${eventDate}
Event Time: ${eventTime}
Package: ${packageName}
Guest Count: ${guestCount}

Payment Summary:
Total Package Price: ${totalPackagePrice}
Down Payment Required: ${downPaymentRequired}
Remaining Balance: ${remainingBalance}

Important: This email confirms that your booking request was received. It does not yet mean that the booking is fully approved or finalized.

What happens next?
1. Our team reviews your submitted booking details.
2. We check event schedule and package availability.
3. We contact you for confirmation and next requirements.

${receiptLink ? `View Booking Receipt:\n${receiptLink}` : `Please keep your booking reference for tracking: ${bookingReference}`}

If you have questions or need to update your booking request, please contact Zion Events Place and provide your booking reference.${supportText}

Thank you,
Zion Events Place`;

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Booking Request Received</title>
  </head>
  <body style="margin:0; padding:0; background:#F8F7F3; font-family:Arial, Helvetica, sans-serif; color:#111827;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; line-height:1px; font-size:1px;">
      ${escapeHtml(PREHEADER)}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F8F7F3; padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; background:#FFFFFF; border:1px solid #E5E7EB; border-radius:18px; overflow:hidden;">
            <tr>
              <td style="background:#111827; padding:28px 32px; text-align:left;">
                ${logoHtml(options)}
                <div style="font-size:20px; line-height:28px; font-weight:700; color:#FFFFFF;">Zion Events Place</div>
                <div style="font-size:13px; line-height:20px; color:#D1D5DB;">Event Place &amp; Management</div>
              </td>
            </tr>
            <tr>
              <td style="height:4px; background:#C9A227; font-size:4px; line-height:4px;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:34px 32px 18px 32px;">
                <h1 style="margin:0 0 14px 0; font-size:26px; line-height:34px; color:#111827; font-weight:700;">
                  Your booking request has been received.
                </h1>
                <p style="margin:0; font-size:15px; line-height:24px; color:#4B5563;">
                  Hi ${escapeHtml(recipientName)},
                </p>
                <p style="margin:12px 0 0 0; font-size:15px; line-height:24px; color:#4B5563;">
                  Thank you for submitting your booking request to <strong>Zion Events Place</strong>. We have received your event details and our team will carefully review your request. Please wait for our confirmation before considering the booking finalized.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 32px 24px 32px;">
                <div style="background:#F5E8B8; border:1px solid #E7D58A; border-radius:14px; padding:18px 20px;">
                  <div style="font-size:12px; line-height:18px; color:#6B5B16; text-transform:uppercase; letter-spacing:0.08em; font-weight:700;">
                    Booking Reference
                  </div>
                  <div style="font-size:22px; line-height:30px; color:#111827; font-weight:700; margin-top:4px;">
                    ${escapeHtml(bookingReference)}
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px 32px;">
                <h2 style="margin:0 0 14px 0; font-size:18px; line-height:26px; color:#111827;">Booking Summary</h2>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB; border-radius:14px; overflow:hidden;">
                  <tr>
                    <td style="padding:12px 16px; background:#FAFAF8; color:#6B7280; font-size:14px;">Booking Reference</td>
                    <td style="padding:12px 16px; background:#FAFAF8; color:#111827; font-size:14px; font-weight:600; text-align:right;">${escapeHtml(bookingReference)}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px; color:#6B7280; font-size:14px; border-top:1px solid #E5E7EB;">Event Type</td>
                    <td style="padding:12px 16px; color:#111827; font-size:14px; font-weight:600; text-align:right; border-top:1px solid #E5E7EB;">${escapeHtml(eventType)}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px; background:#FAFAF8; color:#6B7280; font-size:14px; border-top:1px solid #E5E7EB;">Event Date</td>
                    <td style="padding:12px 16px; background:#FAFAF8; color:#111827; font-size:14px; font-weight:600; text-align:right; border-top:1px solid #E5E7EB;">${escapeHtml(eventDate)}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px; color:#6B7280; font-size:14px; border-top:1px solid #E5E7EB;">Event Time</td>
                    <td style="padding:12px 16px; color:#111827; font-size:14px; font-weight:600; text-align:right; border-top:1px solid #E5E7EB;">${escapeHtml(eventTime)}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px; background:#FAFAF8; color:#6B7280; font-size:14px; border-top:1px solid #E5E7EB;">Package</td>
                    <td style="padding:12px 16px; background:#FAFAF8; color:#111827; font-size:14px; font-weight:600; text-align:right; border-top:1px solid #E5E7EB;">${escapeHtml(packageName)}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px; color:#6B7280; font-size:14px; border-top:1px solid #E5E7EB;">Guest Count</td>
                    <td style="padding:12px 16px; color:#111827; font-size:14px; font-weight:600; text-align:right; border-top:1px solid #E5E7EB;">${escapeHtml(guestCount)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px 32px;">
                <h2 style="margin:0 0 14px 0; font-size:18px; line-height:26px; color:#111827;">Payment Summary</h2>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB; border-radius:14px; overflow:hidden;">
                  <tr>
                    <td style="padding:12px 16px; background:#FAFAF8; color:#6B7280; font-size:14px;">Total Package Price</td>
                    <td style="padding:12px 16px; background:#FAFAF8; color:#111827; font-size:14px; font-weight:700; text-align:right;">${escapeHtml(totalPackagePrice)}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px; color:#6B7280; font-size:14px; border-top:1px solid #E5E7EB;">Down Payment Required</td>
                    <td style="padding:12px 16px; color:#111827; font-size:14px; font-weight:700; text-align:right; border-top:1px solid #E5E7EB;">${escapeHtml(downPaymentRequired)}</td>
                  </tr>
                  <tr>
                    <td style="padding:12px 16px; background:#FAFAF8; color:#6B7280; font-size:14px; border-top:1px solid #E5E7EB;">Remaining Balance</td>
                    <td style="padding:12px 16px; background:#FAFAF8; color:#111827; font-size:14px; font-weight:700; text-align:right; border-top:1px solid #E5E7EB;">${escapeHtml(remainingBalance)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 24px 32px;">
                <div style="border:1px solid #E7D58A; background:#FFF8DF; border-radius:14px; padding:18px 20px;">
                  <div style="font-size:15px; line-height:22px; color:#111827; font-weight:700; margin-bottom:6px;">Important Reminder</div>
                  <div style="font-size:14px; line-height:22px; color:#4B5563;">
                    This email confirms that your booking request was successfully received. It does not yet mean that your booking is fully approved or finalized. Our team will review your details, check availability, and contact you for confirmation.
                  </div>
                </div>
              </td>
            </tr>
            ${ctaHtml(receiptLink, bookingReference)}
            <tr>
              <td style="padding:0 32px 28px 32px;">
                <h2 style="margin:0 0 12px 0; font-size:18px; line-height:26px; color:#111827;">What happens next?</h2>
                <ol style="margin:0; padding-left:20px; color:#4B5563; font-size:14px; line-height:24px;">
                  <li>Our team reviews your submitted booking details.</li>
                  <li>We check event schedule and package availability.</li>
                  <li>We contact you for confirmation and next requirements.</li>
                </ol>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 34px 32px;">
                <p style="margin:0; font-size:14px; line-height:23px; color:#4B5563;">
                  If you have questions or need to update your booking request, please contact Zion Events Place and provide your booking reference.
                </p>${contactHtml(options)}
                <p style="margin:18px 0 0 0; font-size:14px; line-height:22px; color:#4B5563;">
                  Thank you,<br />
                  <strong>Zion Events Place</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#F3F4F6; padding:22px 32px; text-align:center;">
                <div style="font-size:13px; line-height:20px; color:#4B5563; font-weight:700;">Zion Events Place</div>
                <div style="font-size:12px; line-height:19px; color:#6B7280; margin-top:4px;">
                  This is an automated message from Zion Events Place. Please keep your booking reference for future communication.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    to: recipientEmail,
    subject,
    preheader: PREHEADER,
    html,
    text,
    receipt_link: receiptLink,
    recipient_name: recipientName,
  };
}
