# Zion - New Booking Orchestration: Step 2

Purpose: validate the minimal booking-created webhook, fetch full booking details from the protected backend endpoint, normalize the booking object, create a deterministic structured summary, and respond for test execution.

Do not add email delivery, admin notifications, To-Do tasks, payment processing, contract generation, workflow callbacks, or error workflows in this step.

## Required n8n environment variables

```env
ZION_WEBHOOK_SECRET="same value as the app N8N_WEBHOOK_SECRET"
ZION_BACKEND_URL="http://localhost:3000"
ZION_BACKEND_ORCHESTRATION_SECRET="same value as the app BACKEND_ORCHESTRATION_SECRET"
```

If n8n is running in Docker Desktop and the Next app runs on the host machine, use `http://host.docker.internal:3000` for `ZION_BACKEND_URL`.

## Node 1: Webhook

- Name: `Webhook - Booking Created`
- Method: `POST`
- Path: `zion-booking-created`
- Response mode: `Using Respond to Webhook node`

## Node 2: Code - Validate Booking Webhook

```js
const item = $input.first().json;
const headers = item.headers ?? {};
const body = item.body ?? {};
const expectedSecret = String($env.ZION_WEBHOOK_SECRET ?? '').trim();

const header = (name) => String(
  headers[name] ??
  headers[name.toLowerCase()] ??
  headers[name.toUpperCase()] ??
  ''
).trim();

const text = (value) => typeof value === 'string' && value.trim() ? value.trim() : '';
const errors = [];
const allowedBodyKeys = new Set([
  'booking_id',
  'booking_reference',
  'event_type',
  'triggered_at',
]);
const unexpectedBodyKeys = Object.keys(body).filter((key) => !allowedBodyKeys.has(key));

if (item.httpMethod && String(item.httpMethod).toUpperCase() !== 'POST') {
  errors.push('Invalid request method.');
}

if (header('x-zion-source') !== 'backend') {
  errors.push('Invalid x-zion-source header.');
}

if (!expectedSecret || header('x-zion-workflow-secret') !== expectedSecret) {
  errors.push('Invalid workflow secret.');
}

if (header('x-zion-event') !== 'booking.created') {
  errors.push('Invalid x-zion-event header.');
}

if (!text(body.booking_id)) {
  errors.push('Missing booking_id.');
}

if (!text(body.booking_reference)) {
  errors.push('Missing booking_reference.');
}

if (!text(body.event_type)) {
  errors.push('Missing event_type.');
}

if (!text(body.triggered_at) || Number.isNaN(Date.parse(body.triggered_at))) {
  errors.push('Invalid triggered_at.');
}

if (header('x-zion-triggered-at') !== text(body.triggered_at)) {
  errors.push('x-zion-triggered-at does not match triggered_at.');
}

if (header('x-zion-idempotency-key') !== text(body.booking_reference)) {
  errors.push('x-zion-idempotency-key does not match booking_reference.');
}

if (unexpectedBodyKeys.length > 0) {
  errors.push(`Unexpected body fields: ${unexpectedBodyKeys.join(', ')}.`);
}

return [{
  json: {
    valid: errors.length === 0,
    errors,
    booking_id: text(body.booking_id),
    booking_reference: text(body.booking_reference),
    event_type: text(body.event_type),
    triggered_at: text(body.triggered_at),
  },
}];
```

## Node 3: IF - Is Request Valid

- Condition: `{{ $json.valid }} is true`

False branch goes to Node 4. True branch goes to Node 5.

## Node 4: Respond to Webhook - Invalid Request

- Status code: `401`
- Response body:

```json
{
  "success": false,
  "step": "validate_webhook",
  "message": "Invalid booking webhook request.",
  "errors": "={{ $json.errors }}"
}
```

## Node 5: HTTP Request - Fetch Booking Details

- Method: `GET`
- URL: `={{ $env.ZION_BACKEND_URL.replace(/\/+$/, '') }}/api/orchestration/bookings/{{ $json.booking_id }}/details`
- Headers:
  - `x-n8n-secret`: `={{ $env.ZION_BACKEND_ORCHESTRATION_SECRET }}`
  - `x-zion-source`: `n8n`
  - `x-zion-workflow`: `Zion - New Booking Orchestration`
  - `x-zion-booking-reference`: `={{ $json.booking_reference }}`
- Parse response as JSON.

Expected backend response:

```json
{
  "success": true,
  "booking": {
    "booking_id": "...",
    "booking_reference": "...",
    "client_name": "...",
    "client_email": "...",
    "client_contact": "...",
    "event_type": "...",
    "event_date": "YYYY-MM-DD",
    "start_time": "...",
    "end_time": "...",
    "guest_count": 100,
    "package_name": "...",
    "package_price": 225000,
    "down_payment": 25000,
    "remaining_balance": 200000,
    "theme": "...",
    "colors": "...",
    "special_requests": "...",
    "booking_status": "pending_review",
    "receipt_link": "https://your-client-domain.com/booking-receipt/REF"
  }
}
```

## Node 6: Code - Validate Backend Response

```js
const response = $input.first().json;
const payload = response.body && typeof response.body === 'object'
  ? response.body
  : response;
const booking = payload.booking;
const requiredFields = [
  'booking_id',
  'booking_reference',
  'client_name',
  'client_email',
  'client_contact',
  'event_type',
  'event_date',
  'start_time',
  'end_time',
  'guest_count',
  'package_name',
  'package_price',
  'down_payment',
  'remaining_balance',
  'theme',
  'colors',
  'special_requests',
  'booking_status',
  'receipt_link',
];

if (payload.success !== true || !booking || typeof booking !== 'object') {
  throw new Error(payload.message || 'Backend booking details response was not successful.');
}

const missing = requiredFields.filter((field) => !(field in booking));

if (missing.length > 0) {
  throw new Error(`Backend booking details response is missing: ${missing.join(', ')}.`);
}

return [{ json: { booking } }];
```

## Node 7: Code - Normalize Booking Details

```js
const booking = $input.first().json.booking;

const text = (value, fallback = '') => {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value === null || value === undefined) return fallback;
  return String(value).trim() || fallback;
};

const nullableText = (value) => {
  const normalized = text(value);
  return normalized || null;
};

const money = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const integer = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
};

return [{
  json: {
    booking: {
      booking_id: text(booking.booking_id),
      booking_reference: text(booking.booking_reference),
      client_name: text(booking.client_name),
      client_email: nullableText(booking.client_email),
      client_contact: nullableText(booking.client_contact),
      event_type: text(booking.event_type),
      event_date: text(booking.event_date),
      start_time: nullableText(booking.start_time),
      end_time: nullableText(booking.end_time),
      guest_count: integer(booking.guest_count),
      package_name: nullableText(booking.package_name),
      package_price: money(booking.package_price),
      down_payment: money(booking.down_payment),
      remaining_balance: money(booking.remaining_balance),
      theme: nullableText(booking.theme),
      colors: nullableText(booking.colors),
      special_requests: nullableText(booking.special_requests),
      booking_status: text(booking.booking_status, 'pending_review'),
      receipt_link: text(booking.receipt_link),
    },
  },
}];
```

## Node 8: Code - Create Structured Summary

```js
const booking = $input.first().json.booking;
const money = (value) => new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 0,
}).format(Number(value) || 0);
const maybe = (value) => value || 'Not provided';

const summary = [
  `Booking ${booking.booking_reference}: ${booking.client_name} requested a ${booking.event_type} event.`,
  `Schedule: ${booking.event_date}, ${maybe(booking.start_time)} to ${maybe(booking.end_time)}.`,
  `Guests: ${booking.guest_count}. Package: ${maybe(booking.package_name)} at ${money(booking.package_price)}.`,
  `Payment: down payment ${money(booking.down_payment)}, remaining balance ${money(booking.remaining_balance)}.`,
  `Design: theme ${maybe(booking.theme)}, colors ${maybe(booking.colors)}.`,
  `Special requests: ${maybe(booking.special_requests)}.`,
  `Status: ${booking.booking_status}. Receipt: ${booking.receipt_link}.`,
].join(' ');

return [{
  json: {
    success: true,
    step: 'validate_fetch_summary',
    workflow: 'Zion - New Booking Orchestration',
    booking,
    summary,
    generated_at: new Date().toISOString(),
  },
}];
```

## Node 9: Respond to Webhook - Test Response

- Status code: `200`
- Response body: `={{ $json }}`
