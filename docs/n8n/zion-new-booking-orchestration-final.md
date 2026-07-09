# Zion - New Booking Orchestration Final Runbook

Last verified from the current codebase: 2026-07-05

Status: import-ready workflow template. The n8n email credential is intentionally not committed and must be selected after import.

## Artifacts

- `docs/n8n/zion-new-booking-orchestration.workflow.json` - importable n8n workflow template.
- `docs/n8n/zion-new-booking-orchestration-final.md` - this setup and verification runbook.

## Workflow Guarantees

- The public booking form only calls the Next.js backend. n8n is never called by the client.
- The backend sends a minimal booking-created webhook with `booking_id`, `booking_reference`, `event_type`, and deterministic `categorization`.
- n8n validates the backend source, workflow secret, event name, idempotency key, and `categorization.taskTemplateKey`.
- n8n fetches full booking details and the premium receipt email payload only through protected backend endpoints.
- n8n sends the client receipt email before saving the email log, updating booking email status, creating the admin To-Do list, creating the admin notification, and saving the final workflow result.
- Admin To-Do items are created inactive, editable, and marked for activation only after booking approval.
- The admin notification is created after the To-Do list callback succeeds.
- If the client email is missing or invalid, the workflow writes a skipped email log, updates the booking email status, creates an admin issue notification, saves a partial workflow result, and does not create the normal admin To-Do list.
- n8n writes back only through protected backend callback endpoints using `BOOKING_ORCHESTRATION_API_KEY`.

## Backend Environment

Set these in the Next.js app environment:

```env
N8N_WEBHOOK_ENABLED=true
N8N_BOOKING_WEBHOOK_URL=http://localhost:5678/webhook/zion-booking-created
N8N_WEBHOOK_SECRET=replace-with-shared-webhook-secret
N8N_WEBHOOK_TIMEOUT_MS=8000

BACKEND_ORCHESTRATION_SECRET=replace-with-protected-read-secret
BOOKING_ORCHESTRATION_API_KEY=replace-with-protected-write-api-key

NEXTAUTH_URL=http://localhost:3000
ZION_LOGO_URL=
ZION_SUPPORT_EMAIL=
ZION_SUPPORT_PHONE=
ZION_SOCIAL_LINK=
```

Use the production n8n webhook URL for `N8N_BOOKING_WEBHOOK_URL` after the workflow is activated. During n8n manual testing, use the n8n test webhook URL only for temporary local verification.

## n8n Environment

Set these in the n8n runtime environment:

```env
ZION_BACKEND_URL=http://host.docker.internal:3000
N8N_WEBHOOK_SECRET=replace-with-shared-webhook-secret
BACKEND_ORCHESTRATION_SECRET=replace-with-protected-read-secret
BOOKING_ORCHESTRATION_API_KEY=replace-with-protected-write-api-key
ZION_EMAIL_FROM=bookings@example.com
```

If n8n and the Next.js app run on the same host outside Docker, `ZION_BACKEND_URL=http://localhost:3000` is fine. If n8n runs in Docker Desktop and the app runs on the host machine, prefer `http://host.docker.internal:3000`.

## Import Steps

1. In n8n, import `docs/n8n/zion-new-booking-orchestration.workflow.json`.
2. Open `08A. Send Client Booking Receipt Email`.
3. Select the production email credential for the Email Send node.
4. Confirm `fromEmail` resolves from `ZION_EMAIL_FROM`, or replace it with the approved Zion sender address.
5. Keep the workflow inactive until the manual test passes.
6. Run a test booking through the app or trigger n8n's test webhook with an existing `booking_id` and matching `booking_reference`.
7. Activate the workflow.
8. Copy the production webhook URL into the backend `N8N_BOOKING_WEBHOOK_URL`.

## Node Checklist

The imported workflow should contain these nodes in order:

```text
01. Zion Booking Webhook
02. Validate Zion Booking Request
03. Authorized Request?
04A. Reject Unauthorized Request
04B. Fetch Verified Booking Details
05. Create Structured Booking Summary
06. Is Client Email Valid?
07A. Prepare Premium Booking Receipt Email
08A. Send Client Booking Receipt Email
09A. Save Zion Email Log
10A. Update Booking Email Status
11A. Generate Admin To-Do List
12A. Save Admin To-Do List
13A. Prepare Admin Notification Payload
14A. Create Admin Notification
15A. Save Successful Workflow Result
16A. Return Booking Orchestration Success
07B. Save Skipped/Failed Email Log
08B. Update Booking Email Status as Failed or Skipped
09B. Create Admin Email Issue Notification
10B. Save Failed/Partial Workflow Result
11B. Return Booking Orchestration Failed or Partial
```

The webhook response mode must be "Respond to Webhook node". Do not add direct database nodes to this workflow.

## Manual Test Payload

Prefer testing from the real booking form so the booking exists before n8n fetches details. If testing the webhook directly, use an existing booking record:

```json
{
  "booking_id": "existing-booking-id",
  "booking_reference": "ZION-EXISTING-REFERENCE",
  "event_type": "Wedding",
  "triggered_at": "2026-07-05T00:00:00.000Z",
  "categorization": {
    "primaryCategory": "wedding",
    "packageTier": "standard",
    "riskLevel": "medium",
    "taskTemplateKey": "wedding_standard"
  }
}
```

Required headers:

```text
x-zion-source: backend
x-zion-event: booking.created
x-zion-workflow-secret: same value as N8N_WEBHOOK_SECRET
x-zion-idempotency-key: same value as booking_reference
```

## Acceptance Checks

- The backend booking creation succeeds and records an outbound n8n workflow log.
- n8n fetches booking details through `GET /api/orchestration/bookings/:bookingId/details`.
- n8n fetches the receipt payload through `GET /api/orchestration/bookings/:bookingId/receipt-email`.
- The client receives a clean Zion receipt email with no n8n details.
- `POST /api/orchestration/email-logs` stores `emailType`, `relatedModule`, `triggerSource`, workflow metadata, and `SENT` or `SKIPPED` status.
- `PATCH /api/orchestration/bookings/:bookingId/email-status` updates the booking email state.
- `POST /api/orchestration/tasks/bulk-create` creates ten inactive editable admin tasks with the correct `taskTemplateKey`.
- `POST /api/orchestration/notifications/create` creates the admin notification after tasks are saved.
- `POST /api/orchestration/bookings/workflow-result` stores `COMPLETED` for the normal branch or `PARTIAL_FAILED` for the invalid-email branch.
- Approving the booking later activates the pending task list through the app's booking approval flow.

## Security Checks

- Do not store secrets inside the workflow JSON.
- Do not log full secrets, email HTML, or raw client payment data in n8n execution notes.
- Keep n8n execution retention short enough for production privacy requirements.
- Keep n8n credentials scoped to email delivery only.
- All backend writes must use `BOOKING_ORCHESTRATION_API_KEY`; all protected reads must use `BACKEND_ORCHESTRATION_SECRET`.

## Version Notes

The workflow export uses standard n8n Webhook, Code, IF, HTTP Request, Email Send, and Respond to Webhook nodes. If a future n8n version changes node type versions during import, review each node against the checklist above before activating.
