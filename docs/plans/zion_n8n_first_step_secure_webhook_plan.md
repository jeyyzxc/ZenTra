# Codex Implementation Plan: Secure n8n Webhook Trigger for New Booking
## Zion Events Place and Management System

---

## 1. Purpose

This document is a complete, concrete, and high-security implementation plan for the **first step** of the n8n orchestration flow.

The goal is to connect the Zion booking system to n8n so that whenever a client successfully submits a new booking from the Client Panel, the backend securely triggers an n8n webhook.

This first step focuses only on:

```text
Client booking submitted
        ↓
Backend validates and saves booking
        ↓
Backend triggers n8n webhook securely
        ↓
n8n receives minimal booking payload
```

Do **not** implement the full automation yet. Email sending, booking summary generation, admin To-Do list creation, and admin notifications will be implemented in later steps.

---

## 2. Main Objective

After this implementation, the system must behave like this:

1. A client submits a booking from the Client Panel.
2. The frontend sends the booking request only to the backend booking endpoint.
3. The backend validates the booking data.
4. The backend saves the booking in the database.
5. After successful saving, the backend triggers the n8n webhook using a secure POST request.
6. n8n receives a minimal booking payload.
7. The booking still succeeds even if n8n is temporarily unavailable.
8. n8n webhook URL and secret are never exposed to the frontend.

---

## 3. Required Architecture

Use this flow:

```text
Client Panel
        ↓
Backend Booking API
        ↓
Database
        ↓
Secure n8n Webhook Trigger
        ↓
n8n Workflow
```

Correct flow:

```text
Client Panel → Backend API → n8n Webhook
```

Wrong flow:

```text
Client Panel → n8n Webhook
```

Strict rule:

```text
The Client Panel must never call n8n directly.
Only the backend is allowed to trigger the n8n webhook.
```

---

## 4. n8n Webhook Setup

Create a workflow in n8n.

Workflow name:

```text
Zion - New Booking Orchestration
```

Webhook node configuration:

```text
HTTP Method: POST
Path: zion-booking-created
```

Testing URL:

```text
http://localhost:5678/webhook-test/zion-booking-created
```

Production URL after activating workflow:

```text
http://localhost:5678/webhook/zion-booking-created
```

Important rule:

```text
Use the webhook-test URL only while testing with "Listen for test event".
Use the webhook production URL only after activating the n8n workflow.
```

---

## 5. Backend Environment Variables

Add these variables to the backend environment file.

```env
N8N_WEBHOOK_ENABLED=true
N8N_BOOKING_WEBHOOK_URL=http://localhost:5678/webhook-test/zion-booking-created
N8N_WEBHOOK_SECRET=replace_with_strong_random_secret
N8N_WEBHOOK_TIMEOUT_MS=8000
```

For production later:

```env
N8N_BOOKING_WEBHOOK_URL=https://your-n8n-domain.com/webhook/zion-booking-created
```

Security rules:

1. Do not commit `.env` files to GitHub.
2. Do not hardcode webhook secrets in the code.
3. Do not place the webhook URL in frontend environment variables.
4. Do not expose `N8N_WEBHOOK_SECRET` in browser network requests.
5. Use different secrets for local, staging, and production environments.

---

## 6. Backend Trigger Timing

The n8n webhook must be triggered **only after** the booking is successfully saved in the database.

Correct order:

```text
Validate booking request
        ↓
Create booking record
        ↓
Generate or confirm booking reference
        ↓
Commit/save booking
        ↓
Trigger n8n webhook
        ↓
Return success response to client
```

Strict rule:

```text
Never trigger n8n before the booking is saved.
```

Reason:

```text
n8n must only process real booking records that already exist in the database.
```

---

## 7. Minimal Payload Requirement

For the first step, send only minimal booking data to n8n.

Required payload:

```json
{
  "booking_id": "BOOKING_ID_HERE",
  "booking_reference": "BOOKING_REFERENCE_HERE",
  "event_type": "EVENT_TYPE_HERE",
  "triggered_at": "CURRENT_TIMESTAMP_HERE"
}
```

Do not send full personal or sensitive data at this stage.

Do not send:

- Full client address
- Full payment details
- Internal admin notes
- Contract details
- Uploaded files
- Any API keys or secrets
- Full package snapshot unless required later

Reason:

```text
n8n can fetch full booking details later from a protected backend endpoint in the next orchestration step.
```

---

## 8. Required Request Headers

The backend must send these headers when calling n8n:

```text
Content-Type: application/json
x-zion-source: backend
x-zion-workflow-secret: value_from_N8N_WEBHOOK_SECRET
x-zion-idempotency-key: booking_reference
x-zion-event: booking.created
x-zion-triggered-at: current_timestamp
```

Purpose of each header:

| Header | Purpose |
|---|---|
| Content-Type | Ensures JSON payload |
| x-zion-source | Confirms the caller is backend |
| x-zion-workflow-secret | Allows n8n to validate request |
| x-zion-idempotency-key | Prevents duplicate processing |
| x-zion-event | Identifies the workflow event |
| x-zion-triggered-at | Helps validate request freshness later |

Strict rule:

```text
The webhook secret must only be read from environment variables.
```

---

## 9. Backend Service Function

Implement the webhook trigger as a reusable backend service/helper function.

Recommended function name:

```text
triggerBookingCreatedWorkflow(booking)
```

Do not scatter webhook logic directly inside multiple controllers.

The function must:

1. Check if `N8N_WEBHOOK_ENABLED=true`.
2. Check if `N8N_BOOKING_WEBHOOK_URL` exists.
3. Check if `N8N_WEBHOOK_SECRET` exists.
4. Prepare a minimal payload.
5. Send a POST request to the n8n webhook.
6. Include required security headers.
7. Use a timeout.
8. Log success safely.
9. Log failure safely.
10. Never throw an error that breaks the client booking submission.

---

## 10. Required Backend Behavior

If n8n succeeds:

```text
Booking remains saved.
Backend logs successful webhook trigger.
Frontend receives booking success response.
```

If n8n fails:

```text
Booking remains saved.
Backend logs webhook failure internally.
Frontend still receives booking success response.
Admin/system can inspect logs later.
```

Strict rule:

```text
n8n failure must not cancel or delete a successfully saved booking.
```

Reason:

```text
Booking submission is the primary business action.
Automation is secondary and can be retried.
```

---

## 11. Safe Client Response

The client should receive a clean success response after booking creation.

Example:

```json
{
  "success": true,
  "message": "Booking submitted successfully.",
  "booking_reference": "ZION-BKG-2026-0001"
}
```

Do not expose technical n8n errors to the client.

Correct behavior:

```text
Client sees booking success.
Internal logs record the n8n issue.
```

---

## 12. Logging Requirements

Add safe internal logs for:

1. Webhook trigger attempted.
2. Webhook trigger successful.
3. Webhook trigger failed.
4. n8n disabled by environment variable.
5. Missing n8n webhook URL.
6. Missing n8n webhook secret.
7. Invalid booking object.
8. Timeout when calling n8n.

Do not log:

1. Webhook secret
2. Full client personal data
3. API keys
4. SMTP credentials
5. Full request headers
6. Payment proof files
7. Private admin notes

Recommended log fields:

```text
event
booking_id
booking_reference
workflow
status
error_message_safe
created_at
```

---

## 13. High-Security Requirements

### 13.1 Frontend Security

```text
The frontend must not know the n8n webhook URL.
The frontend must not know the n8n webhook secret.
The frontend must only call the backend booking endpoint.
```

### 13.2 Backend Security

```text
Only the backend can trigger n8n.
The backend must read secrets from environment variables.
The backend must send a secret header to n8n.
The backend must use POST, not GET.
The backend must send only minimal data.
```

### 13.3 n8n Security

```text
n8n must validate x-zion-workflow-secret before continuing.
n8n must reject missing or invalid secrets.
n8n must not process duplicate idempotency keys later.
n8n must not trust frontend-originated requests.
```

### 13.4 Data Security

```text
Do not send unnecessary sensitive data in the first webhook payload.
Do not log secrets.
Do not expose internal workflow URLs publicly in frontend code.
```

### 13.5 Operational Security

```text
Use HTTPS in production.
Use different secrets per environment.
Rotate secrets if exposed.
Use backend rate limiting on booking endpoint.
Use idempotency key to prevent duplicated automation.
```

---

## 14. Idempotency Requirement

Include this header:

```text
x-zion-idempotency-key: booking_reference
```

Purpose:

```text
Prevent duplicate n8n processing if the backend retries the same booking webhook.
```

For this first step, the backend only needs to send the idempotency key.

In later steps, n8n or backend workflow logs should check whether the same booking reference has already been processed.

---

## 15. Timeout Requirement

Set a webhook request timeout.

Recommended value:

```text
8000 ms
```

If n8n does not respond within the timeout:

1. Log the timeout.
2. Do not fail the booking submission.
3. Continue returning success to the client.

---

## 16. Retry Recommendation

For this first step, do not create complex retry logic yet unless the backend already has a queue system.

Recommended simple behavior:

```text
Attempt webhook trigger once.
If it fails, log the failure.
Allow manual or future retry from admin/automation logs.
```

Future improvement:

```text
Add queue-based retry for failed n8n triggers.
```

---

## 17. Framework-Agnostic Implementation Guide

Codex must inspect the project and implement this based on the existing backend stack.

Look for:

- Existing booking controller/action
- Existing booking service
- Existing API route for booking submission
- Existing environment variable pattern
- Existing logger utility
- Existing database model for bookings
- Existing response format

Then add the n8n trigger without breaking the current booking flow.

---

## 18. Node / Express Example

Use this only if the backend is Node/Express or similar.

```js
async function triggerBookingCreatedWorkflow(booking) {
  const enabled = process.env.N8N_WEBHOOK_ENABLED === "true";
  const webhookUrl = process.env.N8N_BOOKING_WEBHOOK_URL;
  const webhookSecret = process.env.N8N_WEBHOOK_SECRET;
  const timeoutMs = Number(process.env.N8N_WEBHOOK_TIMEOUT_MS || 8000);

  if (!enabled) return;
  if (!webhookUrl || !webhookSecret) return;
  if (!booking?.id || !booking?.booking_reference) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const triggeredAt = new Date().toISOString();

    await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-zion-source": "backend",
        "x-zion-workflow-secret": webhookSecret,
        "x-zion-idempotency-key": booking.booking_reference,
        "x-zion-event": "booking.created",
        "x-zion-triggered-at": triggeredAt
      },
      body: JSON.stringify({
        booking_id: booking.id,
        booking_reference: booking.booking_reference,
        event_type: booking.event_type,
        triggered_at: triggeredAt
      }),
      signal: controller.signal
    });
  } catch (error) {
    console.warn("[n8n] Booking webhook trigger error.", {
      booking_reference: booking.booking_reference,
      error: error?.message
    });
  } finally {
    clearTimeout(timeout);
  }
}
```

Use after saving booking:

```js
const booking = await createBooking(validatedData);

triggerBookingCreatedWorkflow(booking).catch(() => {
  // Do not block booking response.
});

return res.status(201).json({
  success: true,
  message: "Booking submitted successfully.",
  booking_reference: booking.booking_reference
});
```

---

## 19. Laravel Example

Use this only if the backend is Laravel.

```php
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

function triggerBookingCreatedWorkflow($booking): void
{
    $enabled = env('N8N_WEBHOOK_ENABLED', false);
    $webhookUrl = env('N8N_BOOKING_WEBHOOK_URL');
    $webhookSecret = env('N8N_WEBHOOK_SECRET');
    $timeoutSeconds = ((int) env('N8N_WEBHOOK_TIMEOUT_MS', 8000)) / 1000;

    if (!$enabled || !$webhookUrl || !$webhookSecret) {
        Log::warning('n8n booking webhook skipped due to missing config or disabled state.');
        return;
    }

    if (!$booking || !$booking->id || !$booking->booking_reference) {
        Log::warning('Invalid booking object. n8n webhook skipped.');
        return;
    }

    try {
        $triggeredAt = now()->toISOString();

        $response = Http::timeout($timeoutSeconds)
            ->withHeaders([
                'Content-Type' => 'application/json',
                'x-zion-source' => 'backend',
                'x-zion-workflow-secret' => $webhookSecret,
                'x-zion-idempotency-key' => $booking->booking_reference,
                'x-zion-event' => 'booking.created',
                'x-zion-triggered-at' => $triggeredAt,
            ])
            ->post($webhookUrl, [
                'booking_id' => $booking->id,
                'booking_reference' => $booking->booking_reference,
                'event_type' => $booking->event_type,
                'triggered_at' => $triggeredAt,
            ]);

        if ($response->failed()) {
            Log::warning('n8n booking webhook failed.', [
                'booking_reference' => $booking->booking_reference,
                'status' => $response->status(),
            ]);
        }
    } catch (\Throwable $e) {
        Log::warning('n8n booking webhook trigger error.', [
            'booking_reference' => $booking->booking_reference,
            'error' => $e->getMessage(),
        ]);
    }
}
```

Use after saving booking:

```php
$booking = Booking::create($validated);

triggerBookingCreatedWorkflow($booking);

return response()->json([
    'success' => true,
    'message' => 'Booking submitted successfully.',
    'booking_reference' => $booking->booking_reference,
], 201);
```

---

## 20. n8n First Test Procedure

Follow these exact testing steps:

1. Open n8n.
2. Create a new workflow.
3. Add a Webhook node.
4. Set HTTP Method to `POST`.
5. Set Path to `zion-booking-created`.
6. Click `Listen for test event`.
7. Copy the test URL.
8. Put the test URL in the backend `.env` as `N8N_BOOKING_WEBHOOK_URL`.
9. Restart the backend server after updating `.env`.
10. Submit a new booking from the Client Panel.
11. Confirm n8n receives the payload.

Expected received body:

```json
{
  "booking_id": 1,
  "booking_reference": "ZION-BKG-2026-0001",
  "event_type": "Wedding Reception",
  "triggered_at": "2026-06-24T13:00:00.000Z"
}
```

Expected received headers should include:

```text
x-zion-source
x-zion-workflow-secret
x-zion-idempotency-key
x-zion-event
x-zion-triggered-at
```

---

## 21. n8n Security Validation Node for Later

After confirming n8n receives the payload, add a Code or IF node in n8n to validate:

1. `x-zion-source` equals `backend`
2. `x-zion-workflow-secret` matches expected secret
3. `x-zion-idempotency-key` exists
4. `booking_id` exists
5. `booking_reference` exists

This validation will be implemented in the next orchestration step.

Do not proceed to email, To-Do list, or admin notification until the webhook trigger is tested and secure.

---

## 22. Frontend Requirements

The frontend should only call the backend booking API.

Frontend must not contain:

```text
N8N_BOOKING_WEBHOOK_URL
N8N_WEBHOOK_SECRET
/webhook/zion-booking-created
/webhook-test/zion-booking-created
```

Testing requirement:

```text
Open browser DevTools → Network tab.
Submit booking.
Confirm that the browser request goes only to the backend booking endpoint.
Confirm that there is no direct request from browser to n8n.
```

---

## 23. Backend Acceptance Criteria

This step is complete when:

1. A client can submit a booking successfully from the Client Panel.
2. The backend saves the booking to the database.
3. The backend triggers n8n only after the booking is saved.
4. The backend sends a POST request to the n8n webhook.
5. The request includes the required security headers.
6. The request payload contains only minimal booking data.
7. The n8n webhook URL is stored only in backend environment variables.
8. The n8n webhook secret is stored only in backend environment variables.
9. The frontend does not call n8n directly.
10. The frontend does not expose the n8n URL or secret.
11. The booking still succeeds if n8n is unavailable.
12. The backend logs success and failure safely.
13. n8n receives the booking payload during testing.

---

## 24. What Not to Implement Yet

Do not implement these yet:

- Email receipt sending
- Booking summary generation
- AI-generated summary
- Admin To-Do list creation
- Admin notification
- Workflow logs callback
- Payment automation
- Contract generation
- Full booking detail fetch
- n8n database writes

Those will be implemented in later orchestration steps.

---

## 25. Final Instruction for Codex

Implement only the first orchestration connection step.

The final result must be a secure backend-to-n8n webhook trigger that runs after successful booking creation.

The implementation must preserve the existing booking flow and must not expose n8n credentials or webhook URLs to the frontend.

Use the existing project structure and coding style. Add the webhook trigger cleanly as a service/helper, connect it to the booking creation process, and include safe logging and environment-based configuration.
