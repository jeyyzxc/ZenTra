# Codex Implementation Plan: n8n Step 3 Fix — Update Booking Email Status Endpoint
## Zion Events Place and Management System

---

## 1. Purpose

This document provides a concise, concrete, professional, complete, and secure implementation plan for the missing backend endpoint required by the n8n workflow.

The current n8n workflow already performs these actions:

```text
Booking Webhook Triggered
        ↓
Booking Request Validated
        ↓
Full Booking Details Fetched
        ↓
Booking Summary Created
        ↓
Client Email Validated
        ↓
Booking Receipt Email Prepared
        ↓
Booking Receipt Email Sent
        ↓
Email Log Saved
```

The current issue happens at this step:

```text
Update Zion Booking Email Status
```

The error shows:

```text
404 Not Found
```

This means the backend route for updating the booking email status is missing or not correctly implemented.

---

## 2. Main Objective

Create a protected backend API route that allows n8n to update the booking record after the booking receipt email has been sent and the email log has been saved.

The endpoint must update the booking with:

- Email status
- Email type
- Last email sent date
- n8n workflow execution ID
- Related email log reference, optional

---

## 3. Required Backend Endpoint

Create this endpoint:

```text
PATCH /api/orchestration/bookings/:bookingId/email-status
```

For Next.js App Router, the file should be:

```text
app/api/orchestration/bookings/[bookingId]/email-status/route.ts
```

or if the project uses a `src` directory:

```text
src/app/api/orchestration/bookings/[bookingId]/email-status/route.ts
```

---

## 4. n8n HTTP Request Node Configuration

Node name:

```text
Update Zion Booking Email Status
```

Method:

```text
PATCH
```

URL:

```text
http://host.docker.internal:3000/api/orchestration/bookings/{{ $('Prepare Zion Booking Receipt Email').first().json.booking.booking_id }}/email-status
```

Reason for using `host.docker.internal`:

```text
n8n is running inside Docker, while the Next.js backend is running on the host machine.
```

---

## 5. Required n8n Headers

The backend code currently expects the orchestration API key using:

```text
x-api-key
```

Therefore, the n8n HTTP Request node must send:

```text
Content-Type: application/json
x-api-key: {{$env.BOOKING_ORCHESTRATION_API_KEY}}
x-zion-source: n8n
x-zion-workflow: Zion - New Booking Orchestration
```

Production reminder:

```text
The local API key must be changed before deployment.
```

The key must come from the backend environment variable:

```env
BOOKING_ORCHESTRATION_API_KEY=replace_with_same_value_as_app_env_local
```

---

## 6. Required n8n JSON Body

Use camelCase fields because the backend expects camelCase request body fields.

```json
{
  "emailStatus": "sent",
  "emailType": "booking_receipt",
  "lastEmailSentAt": "{{ $now.toISO() }}",
  "workflowExecutionId": "{{ $execution.id }}",
  "emailLogReference": "{{ $('Save Zion Email Log').first().json.data.id }}"
}
```

If `emailLogReference` creates an error because the backend does not support it yet, use this simpler body first:

```json
{
  "emailStatus": "sent",
  "emailType": "booking_receipt",
  "lastEmailSentAt": "{{ $now.toISO() }}",
  "workflowExecutionId": "{{ $execution.id }}"
}
```

---

## 7. Backend Security Requirements

The endpoint must be protected.

Strict rules:

1. The endpoint must accept only `PATCH`.
2. The endpoint must require the `x-api-key` header.
3. The `x-api-key` value must match `process.env.BOOKING_ORCHESTRATION_API_KEY`.
4. If the API key is missing, return `401`.
5. If the API key is invalid, return `401`.
6. Do not expose the correct API key in errors or logs.
7. Do not allow public frontend users to access this route.
8. Do not accept updates without a valid booking ID.
9. Do not return HTML error pages.
10. Return JSON responses only.

---

## 8. Backend Request Validation

The endpoint must validate the request body.

Required fields:

```text
emailStatus
emailType
workflowExecutionId
```

Optional fields:

```text
lastEmailSentAt
emailLogReference
```

Allowed email statuses:

```text
pending
sent
failed
skipped
```

Allowed email types:

```text
booking_receipt
booking_update
contract_notice
payment_reminder
```

If `emailStatus` is missing:

```json
{
  "success": false,
  "error": "emailStatus is required."
}
```

If `emailStatus` is invalid:

```json
{
  "success": false,
  "error": "Invalid emailStatus value."
}
```

---

## 9. Database Update Requirements

Update the related booking record.

Recommended fields to update in the `bookings` table:

```text
email_status
email_type
last_email_sent_at
n8n_workflow_execution_id
email_log_reference_id
updated_at
```

If the current database uses different field names, map the request body to the existing fields.

Example mapping:

| Request Body Field | Database Field |
|---|---|
| emailStatus | email_status |
| emailType | email_type |
| lastEmailSentAt | last_email_sent_at |
| workflowExecutionId | n8n_workflow_execution_id |
| emailLogReference | email_log_reference_id |

If these fields do not exist yet, add them through the existing database migration or schema system.

---

## 10. Suggested Next.js Route Implementation

Use this as the intended logic, but adapt to the project’s existing database client, Prisma schema, and response utilities.

```ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_EMAIL_STATUSES = ["pending", "sent", "failed", "skipped"];
const ALLOWED_EMAIL_TYPES = [
  "booking_receipt",
  "booking_update",
  "contract_notice",
  "payment_reminder",
];

function unauthorized(message = "Unauthorized orchestration request.") {
  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status: 401 }
  );
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ bookingId: string }> }
) {
  try {
    const configuredKey = process.env.BOOKING_ORCHESTRATION_API_KEY;

    if (!configuredKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking orchestration API key is not configured.",
        },
        { status: 503 }
      );
    }

    const suppliedKey =
      request.headers.get("x-api-key") ??
      request.headers.get("authorization")?.replace(/^Bearer\\s+/i, "");

    if (!suppliedKey) {
      return unauthorized("Missing orchestration API key.");
    }

    if (suppliedKey !== configuredKey) {
      return unauthorized("Invalid orchestration API key.");
    }

    const { bookingId } = await context.params;

    if (!bookingId) {
      return NextResponse.json(
        {
          success: false,
          error: "bookingId is required.",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const {
      emailStatus,
      emailType,
      lastEmailSentAt,
      workflowExecutionId,
      emailLogReference,
    } = body;

    if (!emailStatus) {
      return NextResponse.json(
        {
          success: false,
          error: "emailStatus is required.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_EMAIL_STATUSES.includes(emailStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid emailStatus value.",
        },
        { status: 400 }
      );
    }

    if (emailType && !ALLOWED_EMAIL_TYPES.includes(emailType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid emailType value.",
        },
        { status: 400 }
      );
    }

    const existingBooking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      select: {
        id: true,
        bookingReference: true,
      },
    });

    if (!existingBooking) {
      return NextResponse.json(
        {
          success: false,
          error: "Booking not found.",
        },
        { status: 404 }
      );
    }

    const updatedBooking = await prisma.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        emailStatus,
        emailType: emailType ?? "booking_receipt",
        lastEmailSentAt: lastEmailSentAt ? new Date(lastEmailSentAt) : null,
        n8nWorkflowExecutionId: workflowExecutionId ?? null,
        emailLogReferenceId: emailLogReference ?? null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        bookingReference: true,
        emailStatus: true,
        emailType: true,
        lastEmailSentAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Booking email status updated successfully.",
        data: updatedBooking,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to update booking email status.", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update booking email status.",
      },
      { status: 500 }
    );
  }
}
```

Important:

```text
Codex must adapt field names to the actual Prisma model.
Do not blindly use field names that do not exist in the current schema.
```

---

## 11. Prisma Schema Guidance

If the booking model does not yet have email status fields, add them.

Example:

```prisma
model Booking {
  id                     String    @id @default(cuid())
  bookingReference       String    @unique

  emailStatus            String?   @default("pending")
  emailType              String?
  lastEmailSentAt        DateTime?
  n8nWorkflowExecutionId String?
  emailLogReferenceId    String?

  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt
}
```

If the current schema uses snake_case mapping or different model names, follow the existing project conventions.

---

## 12. System Logs Requirement

After successfully updating the booking email status, create a system log if the system already has a logging utility.

Recommended log action:

```text
booking_email_status_updated
```

Recommended log payload:

```json
{
  "module": "booking_email",
  "action": "booking_email_status_updated",
  "bookingId": "BOOKING_ID",
  "emailStatus": "sent",
  "emailType": "booking_receipt",
  "source": "n8n_workflow"
}
```

Do not log:

- API keys
- Full request headers
- SMTP passwords
- Client-sensitive details that are not necessary

---

## 13. Error Response Requirements

The route must return JSON errors only.

### Missing API Key

```json
{
  "success": false,
  "error": "Missing orchestration API key."
}
```

Status:

```text
401
```

### Invalid API Key

```json
{
  "success": false,
  "error": "Invalid orchestration API key."
}
```

Status:

```text
401
```

### Missing Booking

```json
{
  "success": false,
  "error": "Booking not found."
}
```

Status:

```text
404
```

### Missing Email Status

```json
{
  "success": false,
  "error": "emailStatus is required."
}
```

Status:

```text
400
```

### Success

```json
{
  "success": true,
  "message": "Booking email status updated successfully.",
  "data": {
    "id": "BOOKING_ID",
    "bookingReference": "ZION-DEMO-0003",
    "emailStatus": "sent",
    "emailType": "booking_receipt",
    "lastEmailSentAt": "2026-06-24T08:30:00.000Z"
  }
}
```

Status:

```text
200
```

---

## 14. Testing Procedure

### Test A: Direct n8n Test

1. Open n8n.
2. Open the `Update Zion Booking Email Status` node.
3. Confirm method is `PATCH`.
4. Confirm URL is correct.
5. Confirm `x-api-key` header is present.
6. Confirm JSON body uses camelCase.
7. Click `Execute step`.
8. Expected result: success response.

### Test B: Missing API Key

1. Temporarily remove `x-api-key` from n8n.
2. Execute node.
3. Expected result: `401 Missing orchestration API key.`

### Test C: Invalid API Key

1. Use a wrong `x-api-key`.
2. Execute node.
3. Expected result: `401 Invalid orchestration API key.`

### Test D: Invalid Booking ID

1. Change booking ID to an invalid value.
2. Execute node.
3. Expected result: `404 Booking not found.`

### Test E: Missing Email Status

1. Remove `emailStatus` from the body.
2. Execute node.
3. Expected result: `400 emailStatus is required.`

---

## 15. n8n Final Node After This Endpoint Works

After this endpoint succeeds, add a final `Respond to Webhook` node.

Node name:

```text
Return Zion Email Success Response
```

Response code:

```text
200
```

Response body:

```json
{
  "success": true,
  "message": "Zion booking receipt email sent, email log saved, and booking email status updated successfully.",
  "bookingReference": "{{ $('Prepare Zion Booking Receipt Email').first().json.booking.booking_reference }}",
  "emailStatus": "sent"
}
```

---

## 16. Full Step 3 Flow After Fix

The complete Step 3 workflow should be:

```text
Create Zion Booking Summary
        ↓
Validate Client Email
        ↓
Is Client Email Valid?
        ↓
Prepare Zion Booking Receipt Email
        ↓
Send an Email
        ↓
Save Zion Email Log
        ↓
Update Zion Booking Email Status
        ↓
Return Zion Email Success Response
```

---

## 17. High-Security Checklist

Before marking this fix as complete, verify:

1. `x-api-key` is required.
2. API key is stored only in `.env`.
3. API key is not exposed in frontend.
4. API key is not logged.
5. Route returns JSON only.
6. Route accepts only PATCH.
7. Invalid requests are rejected.
8. Booking ID is validated.
9. Email status value is validated.
10. n8n sends camelCase request fields.
11. Booking email status is updated correctly.
12. Email log reference is linked if available.
13. No secrets appear in n8n output or backend logs.

---

## 18. Deployment Reminder

The current key:

Use the current `BOOKING_ORCHESTRATION_API_KEY` value from the app `.env.local` file. Do not paste old placeholder keys into the n8n workflow.

is only for local testing.

Before production deployment:

1. Generate a long random secret.
2. Replace `BOOKING_ORCHESTRATION_API_KEY` in production environment variables.
3. Update n8n production credentials or headers.
4. Do not commit the production key to GitHub.
5. Rotate the key if it is accidentally shared or exposed.

---

## 19. Final Acceptance Criteria

This fix is complete if:

1. `PATCH /api/orchestration/bookings/:bookingId/email-status` exists.
2. n8n can successfully call the endpoint.
3. The endpoint requires `x-api-key`.
4. The endpoint updates the booking email status.
5. The endpoint returns JSON success.
6. The endpoint does not return a Next.js HTML 404 page.
7. The n8n Step 3 flow can continue to the final response node.
8. No secrets are exposed in frontend code, browser network calls, or logs.

---

## 20. Final Instruction for Codex

Implement only the missing backend route for updating booking email status.

Do not modify unrelated booking features.

Do not break the existing booking submission, email sending, or email log creation flow.

Follow the current project structure, current Prisma schema, current API response style, and current security helper conventions.
