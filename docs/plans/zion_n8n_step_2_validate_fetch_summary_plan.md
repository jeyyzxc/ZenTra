# Codex Implementation Plan: n8n Step 2 — Validate Booking Webhook, Fetch Full Booking Details, and Create Structured Summary
## Zion Events Place and Management System

---

## 1. Purpose

This document provides the complete and concrete plan for the **second step** of the Zion n8n orchestration workflow.

The first step already focuses on:

```text
Client submits booking
        ↓
Backend saves booking
        ↓
Backend securely triggers n8n webhook
```

This second step focuses on what happens **inside n8n after it receives the booking webhook**.

The goal is to make n8n:

1. Receive the minimal booking payload.
2. Validate the webhook request securely.
3. Reject invalid or suspicious requests.
4. Fetch complete booking details from the backend using a protected endpoint.
5. Normalize the booking data.
6. Create a clean, well-structured booking summary.
7. Return a test response confirming that the workflow is working.

Do **not** implement email sending, admin To-Do creation, or admin notification yet. Those will be handled in the next steps.

---

## 2. Main Workflow Goal

The Step 2 workflow should follow this flow:

```text
n8n Webhook receives booking payload
        ↓
Validate request headers and body
        ↓
Reject invalid request if validation fails
        ↓
Fetch full booking details from backend
        ↓
Validate backend response
        ↓
Normalize booking data
        ↓
Create structured booking summary
        ↓
Return test response
```

---

## 3. Required n8n Workflow Name

Use this workflow name:

```text
Zion - New Booking Orchestration
```

This is the same workflow created in Step 1.

---

## 4. Required n8n Nodes for Step 2

Add these nodes after the existing Webhook node:

```text
1. Webhook Trigger
2. Code Node: Validate Incoming Booking Request
3. HTTP Request Node: Fetch Full Booking Details
4. Code Node: Normalize Booking Details
5. Code Node: Create Structured Booking Summary
6. Respond to Webhook Node
```

Recommended node names:

```text
Webhook - Booking Created
Validate Booking Webhook
Fetch Full Booking Details
Normalize Booking Details
Create Booking Summary
Return Step 2 Test Response
```

---

## 5. Webhook Node Configuration

The Webhook node should remain:

```text
HTTP Method: POST
Path: zion-booking-created
```

Testing URL:

```text
http://localhost:5678/webhook-test/zion-booking-created
```

Production URL after activation:

```text
http://localhost:5678/webhook/zion-booking-created
```

Expected inbound payload from backend:

```json
{
  "booking_id": "BOOKING_ID_HERE",
  "booking_reference": "ZION-BKG-2026-0001",
  "event_type": "Wedding Reception",
  "triggered_at": "2026-06-24T13:00:00.000Z"
}
```

Expected inbound headers:

```text
x-zion-source: backend
x-zion-workflow-secret: value_from_backend_env
x-zion-idempotency-key: booking_reference
x-zion-event: booking.created
x-zion-triggered-at: timestamp
```

---

## 6. Required n8n Environment Variables

Configure these values in the n8n environment.

For local Docker testing:

```env
ZION_BACKEND_URL=http://host.docker.internal:3000
N8N_WEBHOOK_SECRET=replace_with_same_value_as_app_env_local
BACKEND_ORCHESTRATION_SECRET=replace_with_same_value_as_app_env_local
ZION_ALLOWED_EVENT=booking.created
```

If the backend runs on Laravel default port:

```env
ZION_BACKEND_URL=http://host.docker.internal:8000
```

If the backend runs directly outside Docker, n8n inside Docker should usually call the host machine using:

```text
http://host.docker.internal:PORT
```

Strict rule:

```text
Do not hardcode secrets inside n8n Code nodes.
Use n8n environment variables or n8n credentials.
```

---

## 7. High-Security Validation Rules

The validation node must check the following:

1. `x-zion-source` must equal `backend`.
2. `x-zion-workflow-secret` must match the configured secret.
3. `x-zion-event` must equal `booking.created`.
4. `x-zion-idempotency-key` must exist.
5. `booking_id` must exist.
6. `booking_reference` must exist.
7. `triggered_at` must exist.
8. The payload must not be empty.
9. The request must use POST.
10. The request must not contain unnecessary sensitive fields.

Strict rule:

```text
If any validation fails, the workflow must stop immediately and must not fetch booking details.
```

---

## 8. Code Node: Validate Booking Webhook

Add a Code node named:

```text
Validate Booking Webhook
```

Use this logic as the basis:

```js
const item = $input.first().json;

const headers = item.headers || {};
const body = item.body || {};

const expectedSecret = String($env.N8N_WEBHOOK_SECRET ?? "").trim();
const expectedEvent = String($env.ZION_ALLOWED_EVENT ?? "booking.created").trim();

function getHeader(name) {
  const lower = name.toLowerCase();
  const foundKey = Object.keys(headers).find((key) => key.toLowerCase() === lower);
  return foundKey ? headers[foundKey] : undefined;
}

const source = getHeader("x-zion-source");
const secret = getHeader("x-zion-workflow-secret");
const idempotencyKey = getHeader("x-zion-idempotency-key");
const eventName = getHeader("x-zion-event");
const triggeredAtHeader = getHeader("x-zion-triggered-at");

const errors = [];

if (!expectedSecret) errors.push("Missing n8n environment secret.");
if (source !== "backend") errors.push("Invalid request source.");
if (!secret || secret !== expectedSecret) errors.push("Invalid workflow secret.");
if (!eventName || eventName !== expectedEvent) errors.push("Invalid workflow event.");
if (!idempotencyKey) errors.push("Missing idempotency key.");
if (!body.booking_id) errors.push("Missing booking_id.");
if (!body.booking_reference) errors.push("Missing booking_reference.");
if (!body.triggered_at) errors.push("Missing triggered_at.");
if (!triggeredAtHeader) errors.push("Missing triggered-at header.");

if (errors.length > 0) {
  return [
    {
      json: {
        valid: false,
        status_code: 401,
        message: "Unauthorized or invalid workflow request.",
        errors,
      },
    },
  ];
}

return [
  {
    json: {
      valid: true,
      booking_id: body.booking_id,
      booking_reference: body.booking_reference,
      event_type: body.event_type || null,
      triggered_at: body.triggered_at,
      idempotency_key: idempotencyKey,
      event_name: eventName,
    },
  },
];
```

Important security note:

```text
Do not return the secret value in the output.
Do not log the secret value.
```

---

## 9. Handling Invalid Requests

After the validation node, add an IF node or Code-based check.

Condition:

```text
valid equals true
```

If `valid = false`:

Return response:

```json
{
  "success": false,
  "message": "Unauthorized or invalid workflow request."
}
```

Then stop the workflow.

Strict rule:

```text
Invalid requests must not proceed to the backend detail-fetch step.
```

---

## 10. Backend Protected Endpoint Requirement

The backend must provide a protected endpoint that allows n8n to fetch full booking details.

Required endpoint:

```text
GET /api/orchestration/bookings/:bookingId/details
```

Example full URL from n8n:

```text
{{ $env.ZION_BACKEND_URL }}/api/orchestration/bookings/{{ $json.booking_id }}/details
```

Required request headers from n8n to backend:

```text
x-n8n-secret: value_from_BACKEND_ORCHESTRATION_SECRET
x-zion-source: n8n
x-zion-workflow: Zion - New Booking Orchestration
x-zion-booking-reference: booking_reference
```

Strict backend rule:

```text
The backend must reject requests to this endpoint if x-n8n-secret is missing or invalid.
```

---

## 11. Backend Full Booking Details Response

The backend should return the booking details in this structure:

```json
{
  "success": true,
  "booking": {
    "booking_id": "bkg_123",
    "booking_reference": "ZION-BKG-2026-0001",
    "client_name": "Maria Santos",
    "client_email": "maria@email.com",
    "client_contact": "09123456789",
    "event_type": "Wedding Reception",
    "event_date": "2026-12-20",
    "start_time": "2:00 PM",
    "end_time": "10:00 PM",
    "guest_count": 100,
    "package_name": "Zion Premium Package",
    "package_price": 225000,
    "down_payment": 25000,
    "remaining_balance": 200000,
    "theme": "Elegant White",
    "colors": "White and Gold",
    "special_requests": "Garden ceremony setup",
    "booking_status": "pending_review",
    "receipt_link": "https://your-client-domain.com/booking-receipt/ZION-BKG-2026-0001"
  }
}
```

If the booking is not found:

```json
{
  "success": false,
  "message": "Booking not found."
}
```

---

## 12. HTTP Request Node: Fetch Full Booking Details

Add an HTTP Request node named:

```text
Fetch Full Booking Details
```

Configuration:

```text
Method: GET
URL: {{$env.ZION_BACKEND_URL}}/api/orchestration/bookings/{{$json.booking_id}}/details
```

Headers:

```text
x-n8n-secret: {{$env.BACKEND_ORCHESTRATION_SECRET}}
x-zion-source: n8n
x-zion-workflow: Zion - New Booking Orchestration
x-zion-booking-reference: {{$json.booking_reference}}
```

Response format:

```text
JSON
```

Timeout recommendation:

```text
10000 ms
```

Strict rule:

```text
If the backend response is not successful, stop the workflow and return a safe error response.
```

---

## 13. Backend Security for Detail Endpoint

Codex should implement or verify the protected backend endpoint.

Endpoint:

```text
GET /api/orchestration/bookings/:bookingId/details
```

Security requirements:

1. Require `x-n8n-secret`.
2. Compare it with backend environment variable `BACKEND_ORCHESTRATION_SECRET`.
3. Reject missing or invalid secret with `401 Unauthorized`.
4. Return only fields needed for orchestration.
5. Do not return internal admin notes unless required.
6. Do not return database credentials, tokens, or secrets.
7. Log access safely.
8. Rate-limit or restrict this endpoint if the backend supports it.

Backend environment variable:

```env
BACKEND_ORCHESTRATION_SECRET=replace_with_strong_backend_secret
```

---

## 14. Code Node: Normalize Booking Details

Add a Code node named:

```text
Normalize Booking Details
```

Purpose:

```text
Make the backend response predictable for later workflow nodes.
```

Use this logic:

```js
const response = $input.first().json;

if (!response.success || !response.booking) {
  return [
    {
      json: {
        success: false,
        status_code: 404,
        message: response.message || "Failed to fetch booking details.",
      },
    },
  ];
}

const booking = response.booking;

function peso(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 0,
  }).format(amount);
}

const normalized = {
  booking_id: booking.booking_id,
  booking_reference: booking.booking_reference,
  client: {
    name: booking.client_name || "Not provided",
    email: booking.client_email || "Not provided",
    contact: booking.client_contact || "Not provided",
  },
  event: {
    type: booking.event_type || "Not provided",
    date: booking.event_date || "Not provided",
    start_time: booking.start_time || "Not provided",
    end_time: booking.end_time || "Not provided",
    guest_count: booking.guest_count || 0,
    theme: booking.theme || "Not provided",
    colors: booking.colors || "Not provided",
    special_requests: booking.special_requests || "None",
  },
  package: {
    name: booking.package_name || "Not provided",
    price: Number(booking.package_price || 0),
    price_formatted: peso(booking.package_price),
    down_payment: Number(booking.down_payment || 0),
    down_payment_formatted: peso(booking.down_payment),
    remaining_balance: Number(booking.remaining_balance || 0),
    remaining_balance_formatted: peso(booking.remaining_balance),
  },
  links: {
    receipt_link: booking.receipt_link || null,
  },
  status: {
    booking_status: booking.booking_status || "pending_review",
  },
};

return [
  {
    json: {
      success: true,
      booking: normalized,
    },
  },
];
```

---

## 15. Code Node: Create Structured Booking Summary

Add a Code node named:

```text
Create Booking Summary
```

Purpose:

```text
Generate a clean, deterministic booking summary based only on verified backend data.
```

Use this logic:

```js
const data = $input.first().json;

if (!data.success || !data.booking) {
  return [
    {
      json: {
        success: false,
        message: data.message || "Booking summary could not be created.",
      },
    },
  ];
}

const b = data.booking;

const summaryText = `
NEW BOOKING RECEIVED

Booking Reference:
${b.booking_reference}

Client Information:
Name: ${b.client.name}
Email: ${b.client.email}
Contact Number: ${b.client.contact}

Event Information:
Event Type: ${b.event.type}
Event Date: ${b.event.date}
Time: ${b.event.start_time} - ${b.event.end_time}
Guest Count: ${b.event.guest_count} pax
Theme: ${b.event.theme}
Colors: ${b.event.colors}

Package Information:
Package: ${b.package.name}
Total Package Price: ${b.package.price_formatted}
Down Payment Required: ${b.package.down_payment_formatted}
Remaining Balance: ${b.package.remaining_balance_formatted}

Special Requests:
${b.event.special_requests}

Current Status:
${b.status.booking_status}

Recommended Admin Priority:
Review booking details, verify schedule availability, prepare contract draft, and confirm payment instructions.
`.trim();

const summaryHtml = `
<h2>New Booking Received</h2>
<p><strong>Booking Reference:</strong> ${b.booking_reference}</p>

<h3>Client Information</h3>
<ul>
  <li><strong>Name:</strong> ${b.client.name}</li>
  <li><strong>Email:</strong> ${b.client.email}</li>
  <li><strong>Contact Number:</strong> ${b.client.contact}</li>
</ul>

<h3>Event Information</h3>
<ul>
  <li><strong>Event Type:</strong> ${b.event.type}</li>
  <li><strong>Event Date:</strong> ${b.event.date}</li>
  <li><strong>Time:</strong> ${b.event.start_time} - ${b.event.end_time}</li>
  <li><strong>Guest Count:</strong> ${b.event.guest_count} pax</li>
  <li><strong>Theme:</strong> ${b.event.theme}</li>
  <li><strong>Colors:</strong> ${b.event.colors}</li>
</ul>

<h3>Package Information</h3>
<ul>
  <li><strong>Package:</strong> ${b.package.name}</li>
  <li><strong>Total Package Price:</strong> ${b.package.price_formatted}</li>
  <li><strong>Down Payment Required:</strong> ${b.package.down_payment_formatted}</li>
  <li><strong>Remaining Balance:</strong> ${b.package.remaining_balance_formatted}</li>
</ul>

<h3>Special Requests</h3>
<p>${b.event.special_requests}</p>

<h3>Recommended Admin Priority</h3>
<p>Review booking details, verify schedule availability, prepare contract draft, and confirm payment instructions.</p>
`.trim();

return [
  {
    json: {
      success: true,
      booking: b,
      summary: {
        text: summaryText,
        html: summaryHtml,
      },
    },
  },
];
```

Strict rule:

```text
Do not use AI for this step.
The summary must be deterministic and based only on verified backend data.
```

---

## 16. Respond to Webhook Node

Add a Respond to Webhook node named:

```text
Return Step 2 Test Response
```

Return this response:

```json
{
  "success": true,
  "message": "Step 2 completed. Booking validated, full details fetched, and summary created.",
  "booking_reference": "{{$json.booking.booking_reference}}",
  "summary": "{{$json.summary.text}}"
}
```

Purpose:

```text
Confirm that n8n received, validated, fetched, and summarized the booking successfully.
```

---

## 17. Expected Successful Output

After testing, n8n should return something like:

```json
{
  "success": true,
  "message": "Step 2 completed. Booking validated, full details fetched, and summary created.",
  "booking_reference": "ZION-BKG-2026-0001",
  "summary": "NEW BOOKING RECEIVED..."
}
```

---

## 18. Error Handling for Step 2

If validation fails:

```json
{
  "success": false,
  "message": "Unauthorized or invalid workflow request."
}
```

If backend booking details cannot be fetched:

```json
{
  "success": false,
  "message": "Failed to fetch booking details."
}
```

If booking is not found:

```json
{
  "success": false,
  "message": "Booking not found."
}
```

Strict rule:

```text
Do not expose secrets or internal server details in error responses.
```

---

## 19. Logging Requirements

### n8n should not log:

- Workflow secrets
- Backend orchestration secret
- SMTP credentials
- API keys
- Full request headers
- Payment proof files

### n8n can safely log:

- Booking reference
- Workflow name
- Step name
- Success or failure status
- Safe error message
- Timestamp

---

## 20. System Security Checklist

Before marking Step 2 as complete, verify:

1. Webhook secret validation works.
2. Invalid secret stops the workflow.
3. Missing booking ID stops the workflow.
4. Missing booking reference stops the workflow.
5. n8n fetches booking details only through backend protected endpoint.
6. Backend endpoint requires `x-n8n-secret`.
7. Backend does not return unnecessary sensitive data.
8. n8n summary uses verified backend response.
9. n8n does not invent booking data.
10. Frontend still does not call n8n directly.
11. No secrets appear in browser DevTools.
12. No secrets are logged.

---

## 21. Testing Procedure

### Test A: Valid Request

1. Open n8n workflow.
2. Click `Listen for test event`.
3. Submit a booking from the Client Panel.
4. Confirm n8n receives webhook payload.
5. Confirm validation passes.
6. Confirm n8n calls backend detail endpoint.
7. Confirm full booking details are fetched.
8. Confirm structured summary is created.
9. Confirm test response is returned.

### Test B: Invalid Secret

1. Temporarily change backend `N8N_WEBHOOK_SECRET`.
2. Submit a booking.
3. Confirm n8n rejects the request.
4. Confirm n8n does not fetch booking details.

### Test C: Missing Booking ID

1. Manually test webhook with missing `booking_id`.
2. Confirm n8n rejects the request.

### Test D: Invalid Backend Secret

1. Temporarily change n8n `BACKEND_ORCHESTRATION_SECRET`.
2. Run test.
3. Confirm backend rejects the full booking detail request.

---

## 22. Backend Acceptance Criteria

Backend side is complete if:

1. Protected endpoint exists:
   ```text
   GET /api/orchestration/bookings/:bookingId/details
   ```
2. Endpoint requires `x-n8n-secret`.
3. Endpoint rejects invalid secret.
4. Endpoint returns full booking details needed for orchestration.
5. Endpoint does not return unnecessary sensitive data.
6. Endpoint logs access safely.

---

## 23. n8n Acceptance Criteria

n8n side is complete if:

1. Webhook receives the minimal booking payload.
2. Request validation works.
3. Invalid requests are rejected.
4. Valid requests continue to detail-fetch step.
5. n8n fetches full booking details from backend.
6. n8n normalizes booking details.
7. n8n creates a structured booking summary.
8. n8n returns a successful Step 2 test response.
9. No email, To-Do list, or admin notification is implemented yet.

---

## 24. What Not to Implement Yet

Do not implement these yet:

- Client receipt email
- Admin email
- Admin in-system notification
- Admin To-Do list creation
- Workflow logs callback
- Error handler workflow
- Payment automation
- Contract generation

Those will be handled in the next orchestration steps.

---

## 25. Final Instruction for Codex

Implement Step 2 only.

The final result must securely validate the incoming n8n webhook request, fetch full booking details from a protected backend endpoint, normalize the booking data, and create a structured booking summary.

Do not proceed to email sending or admin task creation yet.

The implementation must prioritize high security, deterministic output, safe logging, and backend-controlled access.
