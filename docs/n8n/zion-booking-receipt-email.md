# Zion - Booking Receipt Email

Purpose: prepare and send the client-facing booking request receipt email using the backend-rendered Zion template. This keeps the premium HTML, plain-text fallback, fallback values, and payment calculation in one system-owned place.

Use this after `Code - Create Structured Summary` in `docs/n8n/zion-new-booking-orchestration-step-2.md`.

## Required environment variables

```env
ZION_BACKEND_URL="http://localhost:3000"
BACKEND_ORCHESTRATION_SECRET="same value as the app .env.local BACKEND_ORCHESTRATION_SECRET"
BOOKING_ORCHESTRATION_API_KEY="same value as the app .env.local BOOKING_ORCHESTRATION_API_KEY"
```

Optional app environment variables:

```env
ZION_LOGO_URL="https://your-domain.com/zion-logo.png"
ZION_SUPPORT_EMAIL=""
ZION_SUPPORT_PHONE=""
ZION_SOCIAL_LINK=""
```

If `ZION_LOGO_URL` is not configured, the backend uses `/zion-logo.png` from the app public folder.

## Node: Prepare Zion Booking Receipt Email

Use an HTTP Request node.

- Method: `GET`
- URL:

```text
={{ $env.ZION_BACKEND_URL.replace(/\/+$/, '') }}/api/orchestration/bookings/{{ $json.booking.booking_id }}/receipt-email
```

- Headers:
  - `x-n8n-secret`: `={{ $env.BACKEND_ORCHESTRATION_SECRET }}`
  - `x-zion-source`: `n8n`
  - `x-zion-workflow`: `Zion - New Booking Orchestration`
  - `x-zion-booking-reference`: `={{ $json.booking.booking_reference }}`
- Response: JSON

Expected output:

```json
{
  "success": true,
  "booking": {
    "booking_id": "...",
    "booking_reference": "...",
    "client_name": "...",
    "client_email": "...",
    "event_type": "...",
    "event_date": "YYYY-MM-DD",
    "start_time": "...",
    "end_time": "...",
    "guest_count": 100,
    "package_name": "...",
    "package_price": 150000,
    "down_payment": 20000,
    "remaining_balance": 130000,
    "receipt_link": "https://your-domain.com/booking-receipt/ZION-BKG-2026-000002"
  },
  "email": {
    "to": "client@example.com",
    "subject": "Booking Request Received - ZION-BKG-2026-000002",
    "preheader": "Thank you for submitting your booking request. Our team will review your event details and contact you soon.",
    "html": "<!DOCTYPE html>...",
    "text": "Booking Request Received - ZION-BKG-2026-000002...",
    "receipt_link": "https://your-domain.com/booking-receipt/ZION-BKG-2026-000002",
    "recipient_name": "Client Name"
  }
}
```

Important: the backend calculates `remaining_balance` as:

```text
remaining_balance = package_price - down_payment
```

## Node: Send an Email

Use the prepared email fields only.

- To: `={{ $json.email.to }}`
- Subject: `={{ $json.email.subject }}`
- HTML: `={{ $json.email.html }}`
- Text: `={{ $json.email.text }}`

Do not add n8n branding, workflow names, execution IDs, webhook URLs, secrets, or internal logs to the email body.

## Node: Save Zion Email Log

Use an HTTP Request node after the email send succeeds.

- Method: `POST`
- URL:

```text
={{ $env.ZION_BACKEND_URL.replace(/\/+$/, '') }}/api/orchestration/email-logs
```

- Headers:
  - `x-api-key`: `={{ $env.BOOKING_ORCHESTRATION_API_KEY }}`
  - `content-type`: `application/json`
- JSON body:

```json
{
  "recipientEmail": "={{ $('Prepare Zion Booking Receipt Email').first().json.email.to }}",
  "recipientName": "={{ $('Prepare Zion Booking Receipt Email').first().json.email.recipient_name }}",
  "emailType": "BOOKING_UPDATE",
  "relatedModule": "BOOKING",
  "relatedRecordId": "={{ $('Prepare Zion Booking Receipt Email').first().json.booking.booking_id }}",
  "subject": "={{ $('Prepare Zion Booking Receipt Email').first().json.email.subject }}",
  "triggerSource": "N8N_WORKFLOW",
  "workflowName": "Zion - New Booking Orchestration",
  "workflowExecutionId": "={{ $execution.id }}",
  "status": "SENT",
  "emailPreview": "={{ $('Prepare Zion Booking Receipt Email').first().json.email.preheader }}",
  "payloadSummary": {
    "bookingReference": "={{ $('Prepare Zion Booking Receipt Email').first().json.booking.booking_reference }}",
    "receiptLink": "={{ $('Prepare Zion Booking Receipt Email').first().json.email.receipt_link }}"
  }
}
```

## Node: Update Booking Email Status

Use an HTTP Request node after the email log is saved.

- Method: `PATCH`
- URL:

```text
={{ $env.ZION_BACKEND_URL.replace(/\/+$/, '') }}/api/orchestration/bookings/{{ $('Prepare Zion Booking Receipt Email').first().json.booking.booking_id }}/email-status
```

- Headers:
  - `x-api-key`: `={{ $env.BOOKING_ORCHESTRATION_API_KEY }}`
  - `x-zion-source`: `n8n`
  - `x-zion-workflow`: `Zion - New Booking Orchestration`
  - `content-type`: `application/json`
- JSON body:

```json
{
  "emailStatus": "sent",
  "emailType": "booking_receipt",
  "lastEmailSentAt": "={{ new Date().toISOString() }}",
  "workflowExecutionId": "={{ $execution.id }}",
  "emailLogReference": "={{ $('Save Zion Email Log').first().json.data.id }}"
}
```

## Client-facing email rules

- The email confirms the booking request was received only.
- It must not say the booking is approved, finalized, confirmed, or guaranteed.
- It must not show `n8n` branding or any internal automation details.
- The CTA is `View Booking Receipt`.
- If a receipt link is unavailable, the backend hides the button and emphasizes the booking reference.
- Missing display values render as `To be confirmed` or `Not specified`.
- The HTML uses inline CSS and table-friendly structure for Gmail, Yahoo, Outlook, Apple Mail, and mobile mail apps.
