# Email Logs — Technical Specification

> **System:** Zion Events Place Admin Panel (ZenTra)  
> **Module:** System Logs → Email Logs Tab  
> **Version:** 1.0  
> **Date:** June 22, 2026  
> **Status:** Draft — Pending Approval  
> **Related:** Audit Logs Specification v1.0 · Audit Logs RBAC Policy v1.0

---

## 1. Overview

### 1.1 Purpose

The Email Logs feature provides administrators with complete visibility into every automated email the system sends — booking confirmations, contract links, payment reminders, inquiry replies, and workflow-triggered messages. It enables tracking of email delivery, diagnosing failures, monitoring retry attempts, and linking every email back to its related business record.

### 1.2 Scope

This specification covers the addition of an **Email Logs** tab inside the existing **System Logs** page (`/admin/audit`). The existing Audit Logs tab and all of its functionality must remain untouched.

### 1.3 Constraints

> [!IMPORTANT]
> - The sidebar label **"System Logs"** must not be renamed.
> - The page route `/admin/audit` must not change.
> - The existing **Audit Logs** tab must not be modified, broken, or removed.
> - Email logs must not duplicate booking, contract, payment, inquiry, or user records — they reference them by ID only.

---

## 2. Tab Architecture

### 2.1 Tab Layout

The System Logs page must display two tabs within the header area, below the page title and above the filter/table section:

| Tab | Label | Description |
|---|---|---|
| **Tab 1** | Audit Logs | Existing audit trail (no changes) |
| **Tab 2** | Email Logs | New email delivery tracking |

### 2.2 Tab Behavior

- The **Audit Logs** tab is the default active tab on page load.
- Each tab maintains its own independent state: filters, pagination, search, sort, and selected detail record.
- The **Refresh** button refreshes only the currently active tab.
- The **Export** dropdown exports only the currently active tab's filtered data.
- The header badge ("Live Audit Trail" / "Email Delivery") updates based on the active tab.
- Tab switching must not trigger a full page reload.
- The active tab is indicated with the ZenTra gold accent color (`#D6B53B`) and a bottom border.

### 2.3 Header Adaptation

| Element | Audit Logs Tab | Email Logs Tab |
|---|---|---|
| Page title | System Logs (unchanged) | System Logs (unchanged) |
| Status badge | "Live Audit Trail" / "Personal Activity" | "Email Delivery" |
| Subtitle (SUPERADMIN) | "Complete system activity trail — all users, all events" | "Track automated emails, workflow triggers, delivery status, and failed email attempts" |
| Subtitle (ADMIN) | "Your personal activity history within the system" | "Your email delivery activity and related notifications" |

---

## 3. Data Model

### 3.1 Prisma Enums

```prisma
enum EmailType {
  EMAIL_VERIFICATION
  BOOKING_CONFIRMATION
  BOOKING_UPDATE
  PAYMENT_REMINDER
  CONTRACT_LINK
  CONTRACT_DELIVERED
  INQUIRY_REPLY
  CANCELLATION_NOTICE
  RESCHEDULE_NOTICE
  ADMIN_NOTIFICATION
  GENERAL
}

enum EmailStatus {
  QUEUED
  PENDING
  SENT
  DELIVERED
  FAILED
  BOUNCED
  RETRIED
}

enum TriggerSource {
  SYSTEM
  AI_ORCHESTRATION
  N8N_WORKFLOW
  MANUAL_RESEND
}

enum RelatedModule {
  BOOKING
  CONTRACT
  PAYMENT
  INQUIRY
  USER
  ADMIN_NOTIFICATION
}
```

### 3.2 EmailLog Model

```prisma
model EmailLog {
  id                   String         @id @default(cuid())
  recipientEmail       String         @map("recipient_email")
  recipientName        String?        @map("recipient_name")
  emailType            EmailType      @map("email_type")
  relatedModule        RelatedModule? @map("related_module")
  relatedRecordId      String?        @map("related_record_id")
  subject              String
  triggerSource        TriggerSource  @map("trigger_source")
  workflowName         String?        @map("workflow_name")
  workflowExecutionId  String?        @map("workflow_execution_id")
  providerMessageId    String?        @map("provider_message_id")
  status               EmailStatus    @default(QUEUED)
  retryCount           Int            @default(0) @map("retry_count")
  lastAttemptAt        DateTime?      @map("last_attempt_at")
  sentAt               DateTime?      @map("sent_at")
  deliveredAt          DateTime?      @map("delivered_at")
  failedAt             DateTime?      @map("failed_at")
  errorMessage         String?        @map("error_message") @db.Text
  failureReason        String?        @map("failure_reason")
  emailPreview         String?        @map("email_preview") @db.Text
  payloadSummary       Json?          @map("payload_summary")
  resentBy             String?        @map("resent_by")
  createdAt            DateTime       @default(now()) @map("created_at")
  updatedAt            DateTime       @updatedAt @map("updated_at")

  @@index([createdAt])
  @@index([recipientEmail])
  @@index([emailType])
  @@index([status])
  @@index([triggerSource])
  @@index([relatedModule, relatedRecordId])
  @@index([createdAt, status])
  @@map("email_logs")
}
```

> [!NOTE]
> Unlike the `AuditLog` model, the `EmailLog` model includes an `updatedAt` field because email statuses change over time (queued → sent → delivered, or queued → failed → retried).

---

## 4. Email Types

### 4.1 Tracked Email Categories

| Email Type | Enum Value | Description | Typical Trigger Source |
|---|---|---|---|
| Email Verification | `EMAIL_VERIFICATION` | Account verification link sent to new users | System |
| Booking Confirmation | `BOOKING_CONFIRMATION` | Confirmation email after a booking is approved | System / n8n Workflow |
| Booking Update | `BOOKING_UPDATE` | Notification of changes to an existing booking | System / n8n Workflow |
| Payment Reminder | `PAYMENT_REMINDER` | Reminder for pending or overdue payments | n8n Workflow / System |
| Contract Link | `CONTRACT_LINK` | Contract signing link sent to client | n8n Workflow |
| Contract Delivered | `CONTRACT_DELIVERED` | Signed contract copy delivered to client | n8n Workflow |
| Inquiry Reply | `INQUIRY_REPLY` | Automated or manual response to a client inquiry | AI Orchestration / System |
| Cancellation Notice | `CANCELLATION_NOTICE` | Notification of a booking cancellation | System |
| Reschedule Notice | `RESCHEDULE_NOTICE` | Notification of a booking reschedule | System |
| Admin Notification | `ADMIN_NOTIFICATION` | Internal alerts sent to admin users | System |
| General | `GENERAL` | Catch-all for uncategorized emails | System |

---

## 5. Email Logs Table

### 5.1 Column Definitions

| # | Column | Field | Description | Sortable |
|---|---|---|---|---|
| 1 | Time / Date | `createdAt` | When the email was triggered | ✅ Yes |
| 2 | Recipient | `recipientEmail` | Email address of the recipient | ✅ Yes |
| 3 | Email Type | `emailType` | Category of the email (displayed as a readable label) | ✅ Yes |
| 4 | Related Record | `relatedModule` + `relatedRecordId` | Linked business record (e.g., "Booking · B-1046") | ❌ No |
| 5 | Subject | `subject` | Email subject line (truncated to ~60 characters in the table) | ✅ Yes |
| 6 | Trigger Source | `triggerSource` | What initiated the email | ✅ Yes |
| 7 | Workflow | `workflowName` | Name of the workflow that triggered the email | ❌ No |
| 8 | Status | `status` | Delivery status badge | ✅ Yes |
| 9 | Retry Count | `retryCount` | Number of retry attempts | ✅ Yes |
| 10 | Last Attempt | `lastAttemptAt` | Timestamp of the most recent send attempt | ✅ Yes |
| 11 | Details | — | Icon button that opens the detail drawer | ❌ N/A |

### 5.2 Status Badge Design

Each status must use a visually distinct badge with a colored dot indicator and tinted background:

| Status | Background | Text Color | Dot Color | Priority |
|---|---|---|---|---|
| `QUEUED` | `bg-gray-100` | `text-gray-600` | `bg-gray-400` | Low |
| `PENDING` | `bg-amber-50` | `text-amber-700` | `bg-amber-400` | Medium |
| `SENT` | `bg-blue-50` | `text-blue-700` | `bg-blue-500` | Low |
| `DELIVERED` | `bg-emerald-50` | `text-emerald-700` | `bg-emerald-500` | Low |
| `FAILED` | `bg-red-50` | `text-red-700` | `bg-red-500` | **High** |
| `BOUNCED` | `bg-orange-50` | `text-orange-700` | `bg-orange-500` | **High** |
| `RETRIED` | `bg-purple-50` | `text-purple-700` | `bg-purple-500` | Medium |

> [!TIP]
> `FAILED` and `BOUNCED` badges should use a slightly bolder font weight or a subtle pulsing dot to draw attention in a long list.

### 5.3 Email Type Labels

Display user-friendly labels instead of raw enum values:

| Enum Value | Display Label |
|---|---|
| `EMAIL_VERIFICATION` | Email Verification |
| `BOOKING_CONFIRMATION` | Booking Confirmation |
| `BOOKING_UPDATE` | Booking Update |
| `PAYMENT_REMINDER` | Payment Reminder |
| `CONTRACT_LINK` | Contract Link |
| `CONTRACT_DELIVERED` | Contract Delivered |
| `INQUIRY_REPLY` | Inquiry Reply |
| `CANCELLATION_NOTICE` | Cancellation Notice |
| `RESCHEDULE_NOTICE` | Reschedule Notice |
| `ADMIN_NOTIFICATION` | Admin Notification |
| `GENERAL` | General |

### 5.4 Trigger Source Labels

| Enum Value | Display Label |
|---|---|
| `SYSTEM` | System |
| `AI_ORCHESTRATION` | AI Orchestration |
| `N8N_WORKFLOW` | n8n Workflow |
| `MANUAL_RESEND` | Manual Resend |

---

## 6. Email Logs Filters

### 6.1 Filter Controls

| Filter | Type | Options / Behavior |
|---|---|---|
| Search | Text input | Searches across `recipientEmail`, `subject`, `workflowName`, `relatedRecordId` |
| Start Date | Date picker | Filters `createdAt >= startDate` |
| End Date | Date picker | Filters `createdAt <= endDate` |
| Email Type | Select dropdown | All `EmailType` enum values |
| Status | Select dropdown | All `EmailStatus` enum values |
| Trigger Source | Select dropdown | All `TriggerSource` enum values |
| Workflow Name | Select dropdown | Distinct workflow names from existing data, or a predefined list |
| Related Module | Select dropdown | All `RelatedModule` enum values |

### 6.2 Filter Behavior

- Filters are **independent** from the Audit Logs tab filters.
- Changing any filter resets pagination to page 1.
- A **Clear Filters** button resets all filters to their default (empty) state.
- An active filter count badge is displayed on the filter bar.
- Search input is debounced (300ms) before triggering an API call.

---

## 7. Email Log Detail Drawer

### 7.1 Trigger

When the admin clicks the **Details** icon button on any table row, a slide-out drawer opens from the right side of the screen, following the same pattern as the existing `AuditLogDetail` component.

### 7.2 Detail Sections

#### Section 1 — Email Summary

| Field | Description |
|---|---|
| Email Type | Readable label with colored badge |
| Subject | Full email subject line |
| Status | Status badge |
| Created | `createdAt` timestamp |

#### Section 2 — Recipient Information

| Field | Description |
|---|---|
| Recipient Email | `recipientEmail` |
| Recipient Name | `recipientName` (or "—" if null) |

#### Section 3 — Related Record

| Field | Description |
|---|---|
| Related Module | Readable label (e.g., "Booking", "Contract") |
| Related Record ID | `relatedRecordId` (displayed as a monospace string) |

#### Section 4 — Delivery Information

| Field | Description |
|---|---|
| Trigger Source | Readable label |
| Workflow Name | `workflowName` (or "—" if null) |
| Workflow Execution ID | `workflowExecutionId` (monospace, or "—") |
| Provider Message ID | `providerMessageId` (monospace, or "—") |
| n8n Execution Status | Derived from workflow data, or "—" |

#### Section 5 — Timeline

| Field | Description |
|---|---|
| Queued / Created | `createdAt` |
| Last Attempt | `lastAttemptAt` |
| Sent | `sentAt` (or "—") |
| Delivered | `deliveredAt` (or "—") |
| Failed | `failedAt` (or "—") |
| Retry Count | `retryCount` |
| Updated | `updatedAt` |

#### Section 6 — Failure Details (Conditional)

> [!WARNING]
> This section is **only visible** when `status` is `FAILED` or `BOUNCED`.

| Field | Description |
|---|---|
| Failure Reason | `failureReason` — categorized reason (see §7.3) |
| Error Message | `errorMessage` — raw error output, displayed in a monospace code block |

#### Section 7 — Email Preview (Conditional)

If `emailPreview` is not null, display the email body preview in a bordered, scrollable container. Limit height to prevent the drawer from becoming excessively tall.

#### Section 8 — Payload Summary (Conditional, SUPERADMIN Only)

If `payloadSummary` is not null, display the JSON payload in a collapsible, formatted code block. This section is **hidden from ADMIN users** to protect sensitive payload data.

#### Section 9 — Resend Action

If the email status is `FAILED`, `BOUNCED`, or `PENDING`, display a **"Resend Email"** button at the bottom of the drawer. See §8 for resend behavior.

### 7.3 Failure Reason Categories

| Reason Key | Display Label |
|---|---|
| `INVALID_EMAIL` | Invalid email address |
| `SMTP_ERROR` | SMTP / API error |
| `WORKFLOW_FAILED` | n8n workflow failed |
| `PROVIDER_REJECTED` | Email provider rejected the message |
| `MISSING_DATA` | Missing booking, contract, payment, or inquiry data |
| `RATE_LIMIT` | Rate limit exceeded |
| `AUTH_ERROR` | Authentication error |
| `UNKNOWN` | Unknown error |

---

## 8. Resend Email Behavior

### 8.1 Eligibility

The **Resend Email** button is only visible when the email status is one of:

- `FAILED`
- `BOUNCED`
- `PENDING`

### 8.2 Resend Flow

```
User clicks "Resend Email"
  → Show loading spinner on button
  → Call POST /api/email-logs/[id]/resend
  → On success:
      - Increment retryCount
      - Update lastAttemptAt to current time
      - Update status to RETRIED (or SENT if send succeeds)
      - Update resentBy to the current admin's username
      - Show success toast: "Email resend initiated successfully"
      - Refresh the email logs table (current page)
  → On failure:
      - Show error toast: "Failed to resend email. Please try again."
      - Do not modify the log entry
```

### 8.3 Placeholder Implementation

If real backend email integration is not yet available, implement a placeholder resend handler:

```typescript
// app/api/email-logs/[id]/resend/route.ts

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  const emailLog = await prisma.emailLog.findUnique({ where: { id: params.id } });

  if (!emailLog) {
    return Response.json({ error: 'Email log not found.' }, { status: 404 });
  }

  if (!['FAILED', 'BOUNCED', 'PENDING'].includes(emailLog.status)) {
    return Response.json({ error: 'This email cannot be resent.' }, { status: 400 });
  }

  // TODO: Replace with actual email provider integration
  // Example: await emailService.resend(emailLog);

  await prisma.emailLog.update({
    where: { id: params.id },
    data: {
      status: 'RETRIED',
      retryCount: { increment: 1 },
      lastAttemptAt: new Date(),
      resentBy: admin.username,
    },
  });

  // TODO: Log this resend action to the audit trail
  // await createAuditLog({ ... });

  return Response.json({ success: true });
}
```

> [!NOTE]
> The resend must **not** duplicate any related business record (booking, contract, payment, inquiry). It only re-triggers the email delivery for the existing log entry.

---

## 9. API Endpoints

### 9.1 List Email Logs

```
GET /api/email-logs
```

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `page` | `number` | Page number (default: `1`) |
| `limit` | `number` | Records per page (default: `20`, max: `100`) |
| `search` | `string` | Keyword search across `recipientEmail`, `subject`, `workflowName`, `relatedRecordId` |
| `startDate` | `ISO 8601` | Filter: records on or after this timestamp |
| `endDate` | `ISO 8601` | Filter: records on or before this timestamp |
| `emailType` | `EmailType` | Filter: specific email type |
| `status` | `EmailStatus` | Filter: specific delivery status |
| `triggerSource` | `TriggerSource` | Filter: specific trigger source |
| `workflowName` | `string` | Filter: specific workflow name |
| `relatedModule` | `RelatedModule` | Filter: specific related module |
| `sortBy` | `string` | Sort field (default: `createdAt`) |
| `sortOrder` | `asc \| desc` | Sort direction (default: `desc`) |

**Response:**

```json
{
  "logs": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalRecords": 342,
    "totalPages": 18
  }
}
```

**Authorization:** `SUPERADMIN` and `ADMIN` roles only (via `requireAdmin()`).

### 9.2 Get Single Email Log

```
GET /api/email-logs/[id]
```

Returns the full email log record including `emailPreview`, `payloadSummary`, and `errorMessage`.

**Response Sanitization:**
- For `ADMIN` users: `payloadSummary` is stripped from the response.
- For `SUPERADMIN` users: full record returned.

**Authorization:** `SUPERADMIN` and `ADMIN` roles only.

### 9.3 Resend Email

```
POST /api/email-logs/[id]/resend
```

See §8 for detailed behavior.

**Authorization:** `SUPERADMIN` and `ADMIN` roles only.

### 9.4 Export Email Logs

```
GET /api/email-logs/export?format=csv|excel|pdf
```

Accepts the same filter and search parameters as the list endpoint. Exports only email log data — never mixed with audit log data.

**File Name Format:** `zentra-email-logs-YYYY-MM-DD.{ext}`

**Authorization:** `SUPERADMIN` and `ADMIN` roles only.

---

## 10. Role-Based Access Control

### 10.1 Access Matrix

| Capability | SUPERADMIN | ADMIN | CLIENT |
|---|---|---|---|
| View Email Logs tab | ✅ Yes | ✅ Yes | ❌ No |
| See all email logs | ✅ Yes — All recipients, all types | ✅ Yes — All visible (email logs are not user-scoped) | ❌ No |
| View email preview | ✅ Yes | ✅ Yes | ❌ No |
| View payload summary | ✅ Yes | ❌ Hidden | ❌ No |
| View error messages | ✅ Yes | ✅ Yes | ❌ No |
| Resend failed emails | ✅ Yes | ✅ Yes | ❌ No |
| Export email logs | ✅ Yes | ✅ Yes | ❌ No |
| Delete email logs | ❌ No — Immutable | ❌ No | ❌ No |

> [!NOTE]
> Unlike audit logs (where admins see only their own activity), email logs are **not user-scoped** because they track system-generated emails to external recipients. Both Superadmins and Admins can view all email logs. The only difference is that `payloadSummary` is hidden from Admin users.

### 10.2 Export Column Differences

| Column | SUPERADMIN Export | ADMIN Export |
|---|---|---|
| All standard columns | ✅ Included | ✅ Included |
| Payload Summary | ✅ Included | ❌ Excluded |
| Error Message | ✅ Included | ✅ Included |

---

## 11. Empty State

When no email logs exist or no logs match the current filters, display a clean empty state:

**Icon:** A mail icon with a subtle "empty" indicator (e.g., `lucide-react` `MailX` or `Inbox`)

**Title:** No email logs yet

**Description:** Automated email activity will appear here once the system sends booking confirmations, contract links, payment reminders, inquiry replies, or workflow-triggered messages.

---

## 12. Mock Seed Data

The following seed data must be created for UI development and testing. Each record should use realistic values aligned with Zion Events Place operations.

### 12.1 Sample Records

| # | Email Type | Recipient | Subject | Status | Trigger Source | Workflow | Related |
|---|---|---|---|---|---|---|---|
| 1 | `BOOKING_CONFIRMATION` | maria.santos@email.com | Your booking at Zion Events Place is confirmed! | `DELIVERED` | `N8N_WORKFLOW` | booking-confirmation-flow | Booking · B-1046 |
| 2 | `CONTRACT_LINK` | mark.reyes@email.com | Sign your event contract — Reyes–Garcia Wedding | `DELIVERED` | `N8N_WORKFLOW` | contract-delivery-flow | Contract · C-0782 |
| 3 | `PAYMENT_REMINDER` | invalid-email@@broken | Payment reminder for Booking B-1039 | `FAILED` | `N8N_WORKFLOW` | payment-reminder-flow | Payment · P-0415 |
| 4 | `INQUIRY_REPLY` | anna.lim@email.com | Re: Corporate event inquiry — Zion Events Place | `SENT` | `AI_ORCHESTRATION` | inquiry-auto-reply-flow | Inquiry · I-0293 |
| 5 | `EMAIL_VERIFICATION` | newuser@email.com | Verify your email address — Zion Events Place | `QUEUED` | `SYSTEM` | email-verification-flow | User · U-0158 |
| 6 | `BOOKING_UPDATE` | carlos.mendoza@email.com | Your booking details have been updated | `RETRIED` | `SYSTEM` | — | Booking · B-1041 |
| 7 | `ADMIN_NOTIFICATION` | admin@zionevent.com | New booking received — December 15 Corporate Gala | `DELIVERED` | `SYSTEM` | — | Booking · B-1052 |
| 8 | `CONTRACT_DELIVERED` | julia.bautista@email.com | Your signed contract is ready — Download now | `PENDING` | `N8N_WORKFLOW` | contract-delivery-flow | Contract · C-0790 |
| 9 | `CANCELLATION_NOTICE` | pedro.garcia@email.com | Booking cancellation notice — Zion Events Place | `BOUNCED` | `SYSTEM` | — | Booking · B-1033 |
| 10 | `RESCHEDULE_NOTICE` | sofia.cruz@email.com | Your event has been rescheduled — New date confirmed | `SENT` | `N8N_WORKFLOW` | booking-confirmation-flow | Booking · B-1044 |

### 12.2 Sample Failure Details (Record #3)

```json
{
  "failureReason": "INVALID_EMAIL",
  "errorMessage": "553 5.1.3 Invalid address format: invalid-email@@broken",
  "retryCount": 2,
  "lastAttemptAt": "2026-06-20T14:32:01.000Z",
  "failedAt": "2026-06-20T14:32:01.000Z"
}
```

### 12.3 Sample Failure Details (Record #9)

```json
{
  "failureReason": "PROVIDER_REJECTED",
  "errorMessage": "550 5.1.1 The email account that you tried to reach does not exist",
  "retryCount": 1,
  "lastAttemptAt": "2026-06-19T09:15:44.000Z",
  "failedAt": "2026-06-19T09:15:44.000Z"
}
```

---

## 13. UI / UX Requirements

### 13.1 Design Tokens

The Email Logs tab must use the same design language as the existing Audit Logs tab and the broader admin panel:

| Token | Value | Usage |
|---|---|---|
| Background | `#FDF5CC` / `dark:#141A13` | Section background |
| Card background | `white` / `dark:#1C1D21` | Table and filter card |
| Accent | `#D6B53B` / `#BEA542` | Active tab indicator, buttons, badges |
| Border | `border-[#D6B53B]/20` | Section and card borders |
| Text primary | `#1a1f18` / `dark:#F4F4F0` | Headings and body text |
| Text secondary | `text-gray-500` / `dark:#A3B19B` | Subtitles and metadata |
| Font | `font-sans` (system) + `font-sahitya` (headings) | Consistent with existing pages |
| Border radius | `rounded-2xl` | Cards and containers |

### 13.2 Responsive Behavior

- **Desktop (≥1280px):** Full table with all columns visible.
- **Tablet (768px–1279px):** Horizontal scroll enabled; `Workflow` and `Last Attempt` columns hidden.
- **Mobile (<768px):** Compact card layout or horizontal scroll; only `Recipient`, `Type`, `Status`, and `Details` visible.

### 13.3 Loading State

Display skeleton rows matching the table column layout — same pattern as `AuditLogTable`.

### 13.4 Error State

Display an error alert banner above the table — same pattern as the existing audit logs error state:

```tsx
<div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
  {errorMessage}
</div>
```

---

## 14. File Structure

```
zentra/
├── prisma/
│   └── schema.prisma                                # Add EmailLog model + enums
│
├── lib/
│   ├── audit.ts                                      # Existing — no changes
│   ├── audit-query.ts                                # Existing — no changes
│   ├── audit-export.ts                               # Existing — no changes
│   ├── email-log-query.ts                            # [NEW] Query builder, scope, serialization
│   └── email-log-export.ts                           # [NEW] Export generation (CSV/Excel/PDF)
│
├── app/
│   ├── api/
│   │   ├── audit/                                    # Existing — no changes
│   │   └── email-logs/
│   │       ├── route.ts                              # [NEW] GET — list & search email logs
│   │       ├── [id]/
│   │       │   └── route.ts                          # [NEW] GET — single email log detail
│   │       ├── [id]/resend/
│   │       │   └── route.ts                          # [NEW] POST — resend email
│   │       └── export/
│   │           └── route.ts                          # [NEW] GET — export (CSV/Excel/PDF)
│   │
│   └── admin/
│       └── (dashboard)/
│           └── audit/
│               ├── page.tsx                          # [MODIFY] Add tab state, render both tabs
│               ├── types.ts                          # [MODIFY] Add email log types
│               └── components/
│                   ├── AuditLogsClient.tsx            # [MODIFY] Wrap in tab container
│                   ├── AuditLogTable.tsx              # Existing — no changes
│                   ├── AuditLogFilters.tsx            # Existing — no changes
│                   ├── AuditLogDetail.tsx             # Existing — no changes
│                   ├── AuditLogPagination.tsx         # Existing — no changes
│                   ├── AuditLogExport.tsx             # Existing — no changes
│                   ├── SystemLogsTabs.tsx             # [NEW] Tab switcher component
│                   ├── EmailLogsClient.tsx            # [NEW] Main email logs client component
│                   ├── EmailLogTable.tsx              # [NEW] Email logs data table
│                   ├── EmailLogFilters.tsx            # [NEW] Email logs filter bar
│                   ├── EmailLogDetail.tsx             # [NEW] Email log detail drawer
│                   ├── EmailLogPagination.tsx         # [NEW] Pagination (or reuse audit pagination)
│                   └── EmailLogStatusBadge.tsx        # [NEW] Status badge component
```

---

## 15. Implementation Checklist

### Phase 1 — Data Layer

- [ ] Add `EmailType`, `EmailStatus`, `TriggerSource`, `RelatedModule` enums to Prisma schema
- [ ] Add `EmailLog` model to Prisma schema
- [ ] Generate and run database migration
- [ ] Create seed script with 10 realistic sample records
- [ ] Run seed to populate development database

---

### Phase 2 — Server Utilities

- [ ] Create `lib/email-log-query.ts` — query builder, serialization, role-based sanitization
- [ ] Create `lib/email-log-export.ts` — CSV, Excel, PDF export generation

---

### Phase 3 — API Endpoints

- [ ] Build `GET /api/email-logs` — list with filtering, search, sorting, pagination
- [ ] Build `GET /api/email-logs/[id]` — single record detail with role sanitization
- [ ] Build `POST /api/email-logs/[id]/resend` — resend handler (placeholder)
- [ ] Build `GET /api/email-logs/export` — export with format selection
- [ ] Add `requireAdmin()` authorization to all endpoints

---

### Phase 4 — User Interface

- [ ] Create `SystemLogsTabs.tsx` — tab switcher component
- [ ] Create `EmailLogsClient.tsx` — main client component with state management
- [ ] Create `EmailLogTable.tsx` — data table with all 11 columns
- [ ] Create `EmailLogStatusBadge.tsx` — status badge component
- [ ] Create `EmailLogFilters.tsx` — filter bar with all 8 filter controls
- [ ] Create `EmailLogDetail.tsx` — slide-out detail drawer with all 9 sections
- [ ] Create or reuse `EmailLogPagination.tsx` — pagination controls
- [ ] Modify `page.tsx` — add tab state, conditionally render audit or email tab
- [ ] Modify `AuditLogsClient.tsx` — accept tab-level refresh and export callbacks
- [ ] Add email log types to `types.ts`

---

### Phase 5 — Polish

- [ ] Implement loading skeleton states for email log table
- [ ] Implement empty state with icon and descriptive text
- [ ] Implement error state with alert banner
- [ ] Implement toast notifications for resend success/failure
- [ ] Verify responsive layout across desktop, tablet, and mobile
- [ ] Verify tab-scoped refresh (only active tab refreshes)
- [ ] Verify tab-scoped export (only active tab exports)
- [ ] Verify design consistency with existing audit logs tab

---

### Phase 6 — Verification

- [ ] Verify all 8 filter controls work independently from audit log filters
- [ ] Verify search debounce (300ms) functions correctly
- [ ] Verify pagination resets to page 1 on filter change
- [ ] Verify detail drawer opens with complete information
- [ ] Verify failure section only shows for `FAILED` and `BOUNCED` entries
- [ ] Verify resend button only shows for `FAILED`, `BOUNCED`, and `PENDING` entries
- [ ] Verify resend updates `retryCount`, `lastAttemptAt`, `status`, and `resentBy`
- [ ] Verify `payloadSummary` is hidden from Admin users in both detail view and exports
- [ ] Verify existing audit logs functionality is completely unaffected
- [ ] Verify sidebar label "System Logs" is unchanged
- [ ] Verify export file is named `zentra-email-logs-YYYY-MM-DD.{ext}`

---

> [!NOTE]
> This specification is a companion to the Audit Logs Technical Specification and RBAC Policy documents. All three documents together define the complete System Logs module. Changes to this specification must be reviewed and approved before implementation begins.
