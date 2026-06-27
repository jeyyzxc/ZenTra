# Booking Management — Technical Specification

> **System:** Zion Events Place Admin Panel (ZenTra)  
> **Module:** Booking Management  
> **Version:** 1.0  
> **Date:** June 22, 2026  
> **Status:** Draft — Pending Approval

---

## Table of Contents

1. [System Architecture Context](#1-system-architecture-context)
2. [Core Design Principle](#2-core-design-principle)
3. [Data Model](#3-data-model)
4. [Booking Lifecycle and Status Flow](#4-booking-lifecycle-and-status-flow)
5. [Auto-Feed and Auto-Upsert Logic](#5-auto-feed-and-auto-upsert-logic)
6. [Payment Synchronization](#6-payment-synchronization)
7. [Schedule Conflict Detection](#7-schedule-conflict-detection)
8. [Manual Editing Rules](#8-manual-editing-rules)
9. [n8n Orchestration API Endpoints](#9-n8n-orchestration-api-endpoints)
10. [Booking Timeline](#10-booking-timeline)
11. [User Interface](#11-user-interface)
12. [Email Logs Integration](#12-email-logs-integration)
13. [Audit Logs Integration](#13-audit-logs-integration)
14. [Mock Seed Data](#14-mock-seed-data)
15. [File Structure](#15-file-structure)
16. [Implementation Checklist](#16-implementation-checklist)

---

## 1. System Architecture Context

Booking Management operates within a multi-module architecture where each module owns a specific domain. Understanding these boundaries is critical to preventing duplication and ensuring data flows correctly between modules.

### 1.1 Module Responsibilities

| Module | Domain | Role |
|---|---|---|
| **Booking Management** | Event reservations and booking progress | Central operations hub — displays client, event, schedule, status, payment summary, contract summary, and automation status |
| **Payment Management** | Payment transactions, verification, and history | **Source of truth** for all payment records — handles payment CRUD, balances, receipts, and milestones |
| **Contract Management** | Contract generation, approval, and delivery | Manages contract documents, signatures, and delivery workflows |
| **System Logs** | Audit trail and email delivery tracking | Records all booking actions, automation events, and email delivery attempts |
| **n8n Orchestration** | Workflow automation | Automates booking creation, confirmation emails, payment reminders, contract delivery, and status synchronization |

### 1.2 Data Flow Direction

```
                          ┌──────────────────┐
                          │   Online Form    │
                          │  (Client-facing) │
                          └────────┬─────────┘
                                   │
                                   ▼
┌─────────────┐          ┌──────────────────┐          ┌──────────────────┐
│   Payment   │ ──sync──▶│     Booking      │◀──sync── │    Contract      │
│  Management │          │   Management     │          │   Management     │
│  (Source of │          │  (Central Hub)   │          │                  │
│   Truth)    │          └────────┬─────────┘          └──────────────────┘
└─────────────┘                  │
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                   ▼
     ┌──────────────┐   ┌──────────────┐    ┌──────────────┐
     │  Audit Logs  │   │  Email Logs  │    │   Calendar   │
     └──────────────┘   └──────────────┘    └──────────────┘
```

> [!IMPORTANT]
> **Booking Management is NOT a payment CRUD page.** It displays a read-only payment summary that is synchronized from Payment Management. Admins who need to manage payment transactions must navigate to Payment Management.

---

## 2. Core Design Principle

### 2.1 Automation-First, Manual-Second

Booking Management should be **primarily populated through automation**. The recommended flow for a new booking:

```
Client submits booking form
  → Backend receives booking request
  → n8n booking workflow is triggered
  → n8n validates and normalizes booking data
  → Booking record is created or updated (auto-upsert)
  → Schedule conflict check is performed
  → Booking status is assigned
  → Confirmation email is sent (if applicable)
  → Admin notification is sent
  → Email result is saved to Email Logs
  → Booking activity is saved to Audit Logs and Booking Timeline
```

### 2.2 When Manual Creation Is Used

Manual booking creation exists as a **secondary fallback** for:

| Scenario | Description |
|---|---|
| Walk-in clients | Client physically visits Zion Events Place |
| Phone call reservations | Admin takes a booking over the phone |
| Admin-created bookings | Superadmin or admin creates a booking on behalf of a client |
| Data correction | Admin corrects or supplements incomplete automation data |
| Automation failure fallback | n8n workflow failed and the booking must be entered manually |

---

## 3. Data Model

### 3.1 Enums

```prisma
enum BookingStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  DECLINED
  CANCELLED
  RESCHEDULED
  EXPIRED
  ON_HOLD
}

enum BookingSource {
  ONLINE_FORM
  ADMIN_MANUAL
  N8N_WORKFLOW
  PAYMENT_SYNC
  CONTRACT_SYNC
}

enum SyncStatus {
  SYNCED
  PENDING_SYNC
  FAILED_SYNC
  MANUAL_UPDATE
  CONFLICT_DETECTED
}

enum AutomationStatus {
  NOT_STARTED
  TRIGGERED
  PROCESSING
  COMPLETED
  FAILED
}

enum PaymentSummaryStatus {
  UNPAID
  RESERVATION_PAID
  DOWN_PAYMENT_PAID
  PARTIALLY_PAID
  FULLY_PAID
  OVERDUE
  FAILED
  REFUNDED
}
```

### 3.2 Booking Model

```prisma
model Booking {
  id                    String               @id @default(cuid())
  bookingReference      String               @unique @map("booking_reference")

  // ── Client Details ──
  clientName            String               @map("client_name")
  clientEmail           String?              @map("client_email")
  clientPhone           String?              @map("client_phone") @db.VarChar(20)
  clientAddress         String?              @map("client_address") @db.Text

  // ── Event Details ──
  eventTitle            String               @map("event_title")
  eventType             String               @map("event_type")
  eventDate             DateTime             @map("event_date")
  startTime             String?              @map("start_time")
  endTime               String?              @map("end_time")
  venue                 String
  guestCount            Int                  @default(0) @map("guest_count")
  packageSelected       String?              @map("package_selected")
  specialRequests       String?              @map("special_requests") @db.Text

  // ── Booking Status ──
  status                BookingStatus        @default(PENDING)
  statusChangedAt       DateTime?            @map("status_changed_at")
  statusChangedBy       String?              @map("status_changed_by")
  statusChangeReason    String?              @map("status_change_reason") @db.Text

  // ── Assignment ──
  assignedCoordinator   String?              @map("assigned_coordinator")

  // ── Payment Summary (Read-Only from Payment Management) ──
  paymentRecordId       String?              @map("payment_record_id")
  paymentSummaryStatus  PaymentSummaryStatus @default(UNPAID) @map("payment_summary_status")
  paymentTotalAmount    Float?               @map("payment_total_amount")
  paymentAmountPaid     Float?               @map("payment_amount_paid")
  paymentRemainingBalance Float?             @map("payment_remaining_balance")
  paymentDueDate        DateTime?            @map("payment_due_date")
  paymentLastDate       DateTime?            @map("payment_last_date")
  paymentReference      String?              @map("payment_reference")

  // ── Contract Summary (Read-Only from Contract Management) ──
  contractRecordId      String?              @map("contract_record_id")
  contractStatus        String?              @map("contract_status")

  // ── Automation and Sync ──
  bookingSource         BookingSource        @default(ADMIN_MANUAL) @map("booking_source")
  syncStatus            SyncStatus           @default(MANUAL_UPDATE) @map("sync_status")
  automationStatus      AutomationStatus     @default(NOT_STARTED) @map("automation_status")
  lastSyncedAt          DateTime?            @map("last_synced_at")
  n8nWorkflowId         String?              @map("n8n_workflow_id")
  n8nExecutionId        String?              @map("n8n_execution_id")
  lastWorkflowResult    String?              @map("last_workflow_result") @db.Text
  emailLogReferenceId   String?              @map("email_log_reference_id")

  // ── Internal ──
  internalNotes         String?              @map("internal_notes") @db.Text

  // ── Relations ──
  timeline              BookingTimeline[]

  // ── Timestamps ──
  createdAt             DateTime             @default(now()) @map("created_at")
  updatedAt             DateTime             @updatedAt @map("updated_at")

  @@index([bookingReference])
  @@index([clientEmail])
  @@index([eventDate])
  @@index([status])
  @@index([bookingSource])
  @@index([syncStatus])
  @@index([automationStatus])
  @@index([paymentSummaryStatus])
  @@index([eventDate, status])
  @@index([clientEmail, eventDate])
  @@map("bookings")
}
```

### 3.3 Booking Timeline Model

```prisma
model BookingTimeline {
  id          String   @id @default(cuid())
  bookingId   String   @map("booking_id")
  booking     Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  action      String
  source      String
  performedBy String   @map("performed_by")
  description String   @db.Text
  metadata    Json?
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([bookingId])
  @@index([createdAt])
  @@map("booking_timeline")
}
```

> [!NOTE]
> The existing `Event` model in the Prisma schema is used by the Calendar module. The new `Booking` model is purpose-built for Booking Management with automation fields, payment/contract summaries, and timeline support. A synchronization layer should keep the Calendar and Booking data aligned where applicable.

---

## 4. Booking Lifecycle and Status Flow

### 4.1 Status Definitions

| Status | Description | Typical Trigger |
|---|---|---|
| `PENDING` | Booking request received, awaiting admin review | Online form submission, manual creation |
| `CONFIRMED` | Admin approved the booking; date is reserved | Admin approval, auto-approval workflow |
| `IN_PROGRESS` | Event is currently happening | System auto-transition on event date |
| `COMPLETED` | Event has concluded successfully | Admin marks complete, auto-transition |
| `DECLINED` | Admin declined the booking request | Admin action |
| `CANCELLED` | Booking was cancelled (by client or admin) | Admin or client action |
| `RESCHEDULED` | Event date has been moved; awaiting re-confirmation | Admin or client action |
| `EXPIRED` | Booking expired due to unmet conditions (e.g., unpaid reservation fee) | System auto-transition |
| `ON_HOLD` | Booking temporarily paused (schedule conflict, pending info) | Admin action, conflict detection |

### 4.2 Valid Status Transitions

| From | Allowed Transitions |
|---|---|
| `PENDING` | `CONFIRMED`, `DECLINED`, `CANCELLED`, `ON_HOLD`, `EXPIRED` |
| `CONFIRMED` | `IN_PROGRESS`, `RESCHEDULED`, `CANCELLED`, `ON_HOLD` |
| `RESCHEDULED` | `CONFIRMED`, `CANCELLED`, `DECLINED` |
| `IN_PROGRESS` | `COMPLETED`, `CANCELLED` |
| `ON_HOLD` | `PENDING`, `CONFIRMED`, `CANCELLED`, `DECLINED` |
| `COMPLETED` | *(Terminal — no further transitions)* |
| `DECLINED` | *(Terminal — no further transitions)* |
| `CANCELLED` | *(Terminal — no further transitions)* |
| `EXPIRED` | `PENDING` *(only via Superadmin override)* |

### 4.3 Transition Rules

| Rule | Enforcement |
|---|---|
| Status transitions must follow the valid transitions table | Server-side validation before any status update |
| Illogical jumps (e.g., `COMPLETED` → `PENDING`) are blocked | Return `400 Bad Request` with a descriptive error |
| Superadmin override is required for exceptional transitions | Requires `overrideReason` field; creates audit log with warning status |
| Every status change must record `statusChangedAt`, `statusChangedBy`, and `statusChangeReason` | Enforced in the status update function |
| Automation can suggest status changes but important transitions must pass backend validation | n8n sends the requested status; backend validates and applies or rejects |

> [!CAUTION]
> **Superadmin override** for illogical status transitions requires:
> - An `overrideReason` (mandatory, minimum 10 characters)
> - An audit log entry with `WARNING` status
> - A timeline entry recording the override
> - The admin's user ID and timestamp

---

## 5. Auto-Feed and Auto-Upsert Logic

### 5.1 Upsert Behavior

When n8n or the backend receives booking data, the system must follow this decision logic:

```
Receive booking data
  │
  ├─ Does booking_reference exist in the database?
  │   ├─ YES → UPDATE the existing booking
  │   └─ NO  → Check for duplicates using secondary identifiers
  │       │
  │       ├─ Match found (client_email + event_date + event_type)?
  │       │   ├─ YES → UPDATE the existing booking (treat as same booking)
  │       │   └─ NO  → CREATE a new booking
  │
  ├─ Update last_synced_at to current timestamp
  ├─ Update sync_status to SYNCED
  ├─ Record booking_source
  └─ Append timeline entry
```

### 5.2 Duplicate Detection Fields

The system uses a **multi-field duplicate check** to prevent creating redundant booking records:

| Priority | Field Combination | Match Behavior |
|---|---|---|
| **Primary** | `bookingReference` (exact match) | Always update if match found |
| **Secondary** | `clientEmail` + `eventDate` + `eventType` | Update if match found and no `bookingReference` conflict |

### 5.3 Post-Upsert Actions

After every successful upsert:

1. Update `lastSyncedAt` to the current timestamp
2. Set `syncStatus` to `SYNCED`
3. Set or update `bookingSource` based on the data origin
4. Append a `BookingTimeline` entry describing the action
5. Create an `AuditLog` entry
6. If applicable, trigger downstream workflows (confirmation email, admin notification)

---

## 6. Payment Synchronization

### 6.1 Principle

> **Payment Management is the source of truth for payment records.** Booking Management only displays a read-only payment summary.

### 6.2 What Booking Management Displays

The **Payment Summary** section in the booking detail drawer shows:

| Field | Source | Editable in Booking Management? |
|---|---|---|
| Payment Status | `paymentSummaryStatus` | ❌ Read-only badge |
| Total Amount | `paymentTotalAmount` | ❌ Read-only |
| Amount Paid | `paymentAmountPaid` | ❌ Read-only |
| Remaining Balance | `paymentRemainingBalance` | ❌ Read-only |
| Due Date | `paymentDueDate` | ❌ Read-only |
| Latest Payment Date | `paymentLastDate` | ❌ Read-only |
| Payment Reference | `paymentReference` | ❌ Read-only |
| **View Full Payment Record** | Link to Payment Management | N/A — Navigation button |

### 6.3 Sync Flow

```
Payment recorded or updated in Payment Management
  → Payment Management updates payment status
  → n8n workflow or backend event is triggered
  → Related booking is found using booking_reference or booking_id
  → Booking payment summary fields are updated
  → Booking timeline is updated ("Payment summary synced from Payment Management")
  → Audit log is created
  → If needed, email notification is sent
```

### 6.4 Payment Summary Status Badges

| Status | Badge Color | Description |
|---|---|---|
| `UNPAID` | Gray | No payment received |
| `RESERVATION_PAID` | Blue | Reservation fee paid |
| `DOWN_PAYMENT_PAID` | Indigo | 50% downpayment received |
| `PARTIALLY_PAID` | Amber | Some payment received but not complete |
| `FULLY_PAID` | Green | Full amount settled |
| `OVERDUE` | Red | Payment deadline passed |
| `FAILED` | Red (darker) | Payment attempt failed |
| `REFUNDED` | Purple | Payment was refunded |

### 6.5 Superadmin Payment Override

If a Superadmin needs to manually override the payment summary status within Booking Management:

| Requirement | Detail |
|---|---|
| Role | `SUPERADMIN` only |
| Override reason | Mandatory text field (minimum 10 characters) |
| Audit log | Created with `WARNING` status |
| Timeline entry | Records the override with admin name and reason |
| Warning message | UI displays: *"You are overriding the payment summary. Payment Management remains the source of truth. This override will be logged."* |

---

## 7. Schedule Conflict Detection

### 7.1 Conflict Check Trigger

A schedule conflict check must run when:

- A new booking is created (manually or via automation)
- An existing booking's `eventDate`, `startTime`, `endTime`, or `venue` is modified
- An n8n workflow attempts to upsert a booking

### 7.2 Conflict Criteria

Two bookings are considered **conflicting** if all of the following are true:

1. Same `venue`
2. Same `eventDate`
3. Overlapping time windows (`startTime` / `endTime`)
4. Neither booking is in a terminal status (`COMPLETED`, `DECLINED`, `CANCELLED`, `EXPIRED`)

### 7.3 Conflict Response

| Context | Behavior |
|---|---|
| **Manual creation** | Display a warning in the UI: *"Schedule conflict detected with booking [REF]. Please review before proceeding."* Allow the admin to proceed or cancel. |
| **n8n automation** | Do **not** silently overwrite. Set `syncStatus` to `CONFLICT_DETECTED`. Add a timeline entry. Notify the admin. Create an audit log. Optionally send an email asking the client to wait for confirmation. |

### 7.4 Conflict Resolution

The admin must be able to:

1. View the conflicting bookings side by side
2. Choose to keep, reschedule, or cancel one of the conflicting bookings
3. Manually override the conflict if authorized (Superadmin only)
4. After resolution, set `syncStatus` back to `SYNCED` or `MANUAL_UPDATE`

---

## 8. Manual Editing Rules

### 8.1 Editable Fields (Admin and Superadmin)

| Field | Admin | Superadmin | Notes |
|---|---|---|---|
| Client name | ✅ | ✅ | |
| Client email | ✅ | ✅ | |
| Client phone | ✅ | ✅ | |
| Client address | ✅ | ✅ | |
| Event title | ✅ | ✅ | |
| Event type | ✅ | ✅ | |
| Event date | ✅ | ✅ | Triggers conflict check |
| Start time | ✅ | ✅ | Triggers conflict check |
| End time | ✅ | ✅ | Triggers conflict check |
| Guest count | ✅ | ✅ | |
| Venue | ✅ | ✅ | Triggers conflict check |
| Package selected | ✅ | ✅ | |
| Assigned coordinator | ✅ | ✅ | |
| Special requests | ✅ | ✅ | |
| Internal notes | ✅ | ✅ | |
| Booking status | ✅ | ✅ | Must follow valid transitions |

### 8.2 Non-Editable Fields in Booking Management

| Field | Reason |
|---|---|
| Payment transaction records | Managed in Payment Management |
| Payment summary status | Synced from Payment Management (Superadmin override with reason) |
| Contract details | Managed in Contract Management |
| Booking reference | Auto-generated, immutable |
| Automation fields (`n8nWorkflowId`, `n8nExecutionId`, etc.) | Set by system only |
| `syncStatus` | Set by system; admin can trigger a manual re-sync |
| `bookingSource` | Set at creation time; immutable |
| Timeline entries | Append-only; cannot be edited or deleted |

### 8.3 Edit Logging

Every manual edit must:

1. Record `previousValues` and `newValues` in the audit log
2. Append a timeline entry: *"{admin} manually updated {field}"*
3. Set `syncStatus` to `MANUAL_UPDATE` (if the booking was previously synced)

---

## 9. n8n Orchestration API Endpoints

### 9.1 Endpoint Summary

| # | Endpoint | Method | Purpose |
|---|---|---|---|
| 1 | `/api/booking-orchestration/upsert` | `POST` | Create or update a booking record from n8n |
| 2 | `/api/booking-orchestration/status-update` | `POST` | Update booking status from n8n |
| 3 | `/api/booking-orchestration/payment-sync` | `POST` | Sync payment summary from Payment Management |
| 4 | `/api/booking-orchestration/email-result` | `POST` | Save email delivery result to Email Logs |
| 5 | `/api/booking-orchestration/workflow-result` | `POST` | Update automation status and timeline |

All endpoints require an API key or shared secret for n8n authentication (not session-based).

### 9.2 Endpoint Details

#### 9.2.1 Booking Upsert

```
POST /api/booking-orchestration/upsert
```

**Request Body:**

```json
{
  "bookingReference": "B-1049",
  "clientName": "Maria Santos",
  "clientEmail": "maria.santos@email.com",
  "clientPhone": "+639123456789",
  "eventTitle": "Santos Wedding Reception",
  "eventType": "Wedding",
  "eventDate": "2026-08-15",
  "startTime": "14:00",
  "endTime": "22:00",
  "venue": "Main Hall",
  "guestCount": 120,
  "packageSelected": "Premium 150Pax",
  "bookingSource": "ONLINE_FORM",
  "n8nWorkflowId": "booking-creation-flow",
  "n8nExecutionId": "exec-abc123"
}
```

**Behavior:** Upsert based on `bookingReference` or secondary duplicate check. Run conflict detection. Set `syncStatus` to `SYNCED` on success, `CONFLICT_DETECTED` on conflict. Append timeline entry.

#### 9.2.2 Status Update

```
POST /api/booking-orchestration/status-update
```

**Request Body:**

```json
{
  "bookingReference": "B-1049",
  "newStatus": "CONFIRMED",
  "reason": "Payment received and verified",
  "n8nExecutionId": "exec-def456"
}
```

**Behavior:** Validate the status transition. Apply if valid. Reject if illogical. Append timeline entry. Create audit log.

#### 9.2.3 Payment Sync

```
POST /api/booking-orchestration/payment-sync
```

**Request Body:**

```json
{
  "bookingReference": "B-1049",
  "paymentRecordId": "PAY-0782",
  "paymentSummaryStatus": "DOWN_PAYMENT_PAID",
  "totalAmount": 350000,
  "amountPaid": 175000,
  "remainingBalance": 175000,
  "dueDate": "2026-08-08",
  "lastPaymentDate": "2026-07-15",
  "paymentReference": "TXN-20260715-001"
}
```

**Behavior:** Find booking by `bookingReference`. Update payment summary fields. Append timeline entry: *"Payment summary synced from Payment Management"*. Create audit log.

#### 9.2.4 Email Result

```
POST /api/booking-orchestration/email-result
```

**Request Body:**

```json
{
  "bookingReference": "B-1049",
  "emailType": "BOOKING_CONFIRMATION",
  "recipientEmail": "maria.santos@email.com",
  "subject": "Your booking at Zion Events Place is confirmed!",
  "status": "DELIVERED",
  "workflowName": "booking-confirmation-flow",
  "n8nExecutionId": "exec-ghi789"
}
```

**Behavior:** Create an `EmailLog` entry linked to the booking. Update the booking's `emailLogReferenceId`. Append timeline entry.

#### 9.2.5 Workflow Result

```
POST /api/booking-orchestration/workflow-result
```

**Request Body:**

```json
{
  "bookingReference": "B-1049",
  "automationStatus": "COMPLETED",
  "workflowResult": "Booking confirmation flow completed successfully",
  "n8nWorkflowId": "booking-confirmation-flow",
  "n8nExecutionId": "exec-ghi789"
}
```

**Behavior:** Update `automationStatus` and `lastWorkflowResult`. Append timeline entry.

### 9.3 Placeholder Functions

If real backend integration is not yet available, implement clean placeholder functions:

```typescript
// lib/booking-orchestration.ts

/** Upsert booking from n8n workflow or online form */
async function upsertBookingFromWorkflow(data: BookingUpsertInput): Promise<Booking> {
  // TODO: Implement full upsert with duplicate detection and conflict check
}

/** Sync payment summary from Payment Management */
async function syncBookingPaymentSummary(data: PaymentSyncInput): Promise<void> {
  // TODO: Implement payment summary sync
}

/** Update automation status from n8n workflow result */
async function updateBookingAutomationStatus(data: WorkflowResultInput): Promise<void> {
  // TODO: Implement automation status update
}

/** Save email delivery result to Email Logs */
async function saveBookingEmailResult(data: EmailResultInput): Promise<void> {
  // TODO: Implement email log creation linked to booking
}

/** Append an entry to the booking timeline */
async function appendBookingTimelineEntry(data: TimelineEntryInput): Promise<void> {
  // TODO: Implement timeline entry creation
}

/** Trigger n8n booking confirmation workflow */
async function triggerBookingConfirmationWorkflow(bookingId: string): Promise<void> {
  // TODO: Implement n8n webhook trigger for booking confirmation
}

/** Trigger n8n payment reminder workflow */
async function triggerPaymentReminderWorkflow(bookingId: string): Promise<void> {
  // TODO: Implement n8n webhook trigger for payment reminder
}

/** Trigger n8n contract preparation workflow */
async function triggerContractPreparationWorkflow(bookingId: string): Promise<void> {
  // TODO: Implement n8n webhook trigger for contract preparation
}
```

---

## 10. Booking Timeline

### 10.1 Purpose

The booking timeline provides a chronological record of everything that has happened to a booking — both automated and manual actions. It is the booking's own activity feed, separate from the global Audit Logs.

### 10.2 Timeline Entry Structure

| Field | Description |
|---|---|
| `action` | Short action label (e.g., "Booking Created", "Status Changed") |
| `source` | Origin of the action |
| `performedBy` | User name, system identifier, or workflow name |
| `description` | Detailed human-readable description |
| `metadata` | Optional JSON with additional context |
| `createdAt` | Timestamp |

### 10.3 Source Values

| Source | Usage |
|---|---|
| `System` | Internal system operations, auto-transitions |
| `Admin` | Manual admin actions |
| `n8n Workflow` | Workflow-triggered actions |
| `Payment Management` | Payment sync events |
| `Contract Management` | Contract sync events |
| `AI Orchestration` | AI-driven actions |
| `Client` | Client-initiated actions (form submissions) |

### 10.4 Example Timeline Entries

| Timestamp | Action | Source | Performed By | Description |
|---|---|---|---|---|
| Jun 15, 10:30 AM | Booking Created | Client | maria.santos@email.com | Booking submitted via online form |
| Jun 15, 10:31 AM | Workflow Triggered | n8n Workflow | booking-creation-flow | Booking creation workflow started (exec-abc123) |
| Jun 15, 10:31 AM | Booking Synced | n8n Workflow | booking-creation-flow | Booking data validated and saved |
| Jun 15, 10:32 AM | Email Sent | n8n Workflow | booking-confirmation-flow | Confirmation email delivered to maria.santos@email.com |
| Jun 15, 10:32 AM | Admin Notified | System | System | Admin notification sent for new booking B-1049 |
| Jun 18, 02:15 PM | Status Changed | Admin | @jeyy | Status changed from Pending to Confirmed. Reason: Payment verified |
| Jul 15, 09:00 AM | Payment Synced | Payment Management | System | Down payment received — ₱175,000. Balance: ₱175,000 |
| Jul 16, 10:00 AM | Contract Triggered | n8n Workflow | contract-preparation-flow | Contract preparation workflow started |
| Jul 16, 10:05 AM | Contract Delivered | n8n Workflow | contract-delivery-flow | Contract signing link sent to maria.santos@email.com |
| Aug 01, 03:00 PM | Manually Edited | Admin | @jeyy | Guest count updated from 120 to 135 |

---

## 11. User Interface

### 11.1 Table Columns

| # | Column | Field(s) | Sortable | Description |
|---|---|---|---|---|
| 1 | Booking Ref | `bookingReference` | ✅ | Unique booking identifier (e.g., B-1049) |
| 2 | Client | `clientName`, `clientEmail` | ✅ | Client name with email below |
| 3 | Event | `eventTitle`, `eventType` | ✅ | Event title with type badge below |
| 4 | Event Date | `eventDate` | ✅ | Formatted date |
| 5 | Status | `status` | ✅ | Booking status badge |
| 6 | Payment | `paymentSummaryStatus` | ✅ | Payment summary badge (read-only) |
| 7 | Source | `bookingSource` | ✅ | Origin badge |
| 8 | Sync | `syncStatus` | ✅ | Sync status badge |
| 9 | Automation | `automationStatus` | ✅ | Automation progress badge |
| 10 | Coordinator | `assignedCoordinator` | ✅ | Assigned staff |
| 11 | Last Updated | `updatedAt` | ✅ | Last modification timestamp |
| 12 | Actions | — | ❌ | View details, edit, menu |

### 11.2 Source Badges

| Source | Label | Color |
|---|---|---|
| `ONLINE_FORM` | Online Form | Blue |
| `ADMIN_MANUAL` | Manual | Gray |
| `N8N_WORKFLOW` | n8n Workflow | Purple |
| `PAYMENT_SYNC` | Payment Sync | Emerald |
| `CONTRACT_SYNC` | Contract Sync | Indigo |

### 11.3 Sync Status Badges

| Status | Label | Color |
|---|---|---|
| `SYNCED` | Synced | Green |
| `PENDING_SYNC` | Pending Sync | Amber |
| `FAILED_SYNC` | Failed Sync | Red |
| `MANUAL_UPDATE` | Manual Update | Gray |
| `CONFLICT_DETECTED` | Conflict | Red (bold/pulsing) |

### 11.4 Automation Status Badges

| Status | Label | Color |
|---|---|---|
| `NOT_STARTED` | Not Started | Gray |
| `TRIGGERED` | Triggered | Blue |
| `PROCESSING` | Processing | Amber (animated) |
| `COMPLETED` | Completed | Green |
| `FAILED` | Failed | Red |

### 11.5 Filter Bar

| Filter | Type | Options |
|---|---|---|
| Search | Text input | Searches `bookingReference`, `clientName`, `clientEmail`, `eventTitle` |
| Date Range | Date pickers | Filters `eventDate` |
| Status | Select dropdown | All `BookingStatus` values |
| Payment Status | Select dropdown | All `PaymentSummaryStatus` values |
| Source | Select dropdown | All `BookingSource` values |
| Sync Status | Select dropdown | All `SyncStatus` values |
| Automation Status | Select dropdown | All `AutomationStatus` values |
| Coordinator | Select dropdown | List of coordinators |
| Event Type | Select dropdown | Wedding, Debut, Christening, Party, Corporate, etc. |

### 11.6 Booking Detail Drawer

When a booking row is clicked, open a slide-out drawer with these sections:

#### Section 1 — Booking Summary

- Booking reference, status badge, source badge, sync badge, automation badge
- Created date, last updated, last synced

#### Section 2 — Client Details

- Client name, email, phone, address

#### Section 3 — Event Details

- Event title, type, venue, package selected, guest count, special requests

#### Section 4 — Schedule Details

- Event date, start time, end time
- Conflict warnings (if any)

#### Section 5 — Payment Summary (Read-Only)

- Payment status badge, total amount, amount paid, remaining balance, due date, last payment date, payment reference
- **"View Full Payment Record"** button → navigates to Payment Management

#### Section 6 — Contract Summary (Read-Only)

- Contract status, contract ID
- **"View Contract"** button → navigates to Contract Management

#### Section 7 — Automation Details

- Booking source, sync status, last synced timestamp
- n8n workflow name, execution ID, automation status, last workflow result
- Related email log status, related audit log

#### Section 8 — Booking Timeline

- Chronological list of all timeline entries (see §10)
- Each entry shows: timestamp, action icon, source badge, performed by, description

#### Section 9 — Internal Notes

- Editable textarea for admin notes
- Auto-save or save button

### 11.7 Action Buttons

| Button | Location | Visibility |
|---|---|---|
| **+ New Booking** | Page header | Admin, Superadmin |
| **Edit Booking** | Detail drawer header | Admin, Superadmin |
| **Change Status** | Detail drawer | Admin, Superadmin (follows transition rules) |
| **View Full Payment Record** | Payment Summary section | Admin, Superadmin |
| **View Contract** | Contract Summary section | Admin, Superadmin |
| **Trigger Confirmation Workflow** | Automation section | Superadmin (placeholder) |
| **Trigger Payment Reminder** | Automation section | Superadmin (placeholder) |
| **Re-sync Booking** | Automation section | Superadmin |

---

## 12. Email Logs Integration

When n8n sends or attempts to send a booking-related email, the result must be saved to the `EmailLog` model.

### 12.1 Booking-Related Email Types

| Email Type | Trigger |
|---|---|
| `BOOKING_CONFIRMATION` | Booking confirmed |
| `BOOKING_UPDATE` | Booking details modified |
| `PAYMENT_REMINDER` | Payment deadline approaching or overdue |
| `CONTRACT_LINK` | Contract prepared and ready for signing |
| `CANCELLATION_NOTICE` | Booking cancelled |
| `RESCHEDULE_NOTICE` | Booking rescheduled |
| `ADMIN_NOTIFICATION` | New booking, conflict detected, or important event |

### 12.2 Booking Detail Integration

The booking detail drawer should display the latest related email log status in the **Automation Details** section:

- Latest email type and status badge
- Timestamp of last email attempt
- Link to view full email log in System Logs

---

## 13. Audit Logs Integration

### 13.1 Audited Booking Actions

| Event | Action Type | Module |
|---|---|---|
| Booking auto-created from n8n | `CREATE` | `Bookings` |
| Booking auto-updated from n8n | `UPDATE` | `Bookings` |
| Booking manually created | `CREATE` | `Bookings` |
| Booking manually edited | `UPDATE` | `Bookings` |
| Booking status changed | `UPDATE` | `Bookings` |
| Payment summary synced | `UPDATE` | `Bookings` |
| Schedule conflict detected | `ERROR` | `Bookings` |
| Conflict override used | `UPDATE` (WARNING) | `Bookings` |
| Confirmation workflow triggered | `SUBMISSION` | `Bookings` |
| Email sent successfully | `SUBMISSION` | `Bookings` |
| Email delivery failed | `ERROR` | `Bookings` |
| Contract workflow triggered | `SUBMISSION` | `Bookings` |
| Booking declined | `REJECTION` | `Bookings` |
| Booking approved | `APPROVAL` | `Bookings` |

### 13.2 Audit Log Metadata

Each booking-related audit log should include:

```json
{
  "bookingReference": "B-1049",
  "bookingId": "clx9abc123",
  "bookingSource": "N8N_WORKFLOW",
  "n8nExecutionId": "exec-abc123"
}
```

---

## 14. Mock Seed Data

### 14.1 Sample Booking Records

| # | Ref | Client | Event Type | Date | Status | Payment | Source | Sync | Automation |
|---|---|---|---|---|---|---|---|---|---|
| 1 | B-1042 | Jerome & Steph | Wedding | Jun 12, 2026 | `CONFIRMED` | `DOWN_PAYMENT_PAID` | `ONLINE_FORM` | `SYNCED` | `COMPLETED` |
| 2 | B-1043 | Sarah's 18th | Debut | Jun 20, 2026 | `PENDING` | `UNPAID` | `ONLINE_FORM` | `SYNCED` | `COMPLETED` |
| 3 | B-1044 | Mark & Julia | Wedding | Jun 18, 2026 | `PENDING` | `PARTIALLY_PAID` | `N8N_WORKFLOW` | `PENDING_SYNC` | `PROCESSING` |
| 4 | B-1045 | Alice & Bob | Wedding | Jul 05, 2026 | `ON_HOLD` | `UNPAID` | `ONLINE_FORM` | `CONFLICT_DETECTED` | `FAILED` |
| 5 | B-1046 | Company XMAS | Corporate | Dec 15, 2026 | `EXPIRED` | `UNPAID` | `ADMIN_MANUAL` | `MANUAL_UPDATE` | `NOT_STARTED` |
| 6 | B-1047 | Baby Liam | Christening | May 15, 2026 | `COMPLETED` | `FULLY_PAID` | `ONLINE_FORM` | `SYNCED` | `COMPLETED` |
| 7 | B-1048 | Santos Reunion | Party | Aug 10, 2026 | `PENDING` | `RESERVATION_PAID` | `N8N_WORKFLOW` | `SYNCED` | `COMPLETED` |
| 8 | B-1049 | Maria Santos | Wedding | Aug 15, 2026 | `CONFIRMED` | `DOWN_PAYMENT_PAID` | `ONLINE_FORM` | `SYNCED` | `COMPLETED` |
| 9 | B-1050 | Garcia 25th Anniv | Party | Sep 20, 2026 | `RESCHEDULED` | `DOWN_PAYMENT_PAID` | `N8N_WORKFLOW` | `SYNCED` | `COMPLETED` |
| 10 | B-1051 | Chen Corp Gala | Corporate | Oct 05, 2026 | `PENDING` | `UNPAID` | `ADMIN_MANUAL` | `MANUAL_UPDATE` | `NOT_STARTED` |

---

## 15. File Structure

```
zentra/
├── prisma/
│   └── schema.prisma                                          # Add Booking + BookingTimeline models + enums
│
├── lib/
│   ├── booking-orchestration.ts                               # [NEW] Placeholder orchestration functions
│   ├── booking-query.ts                                       # [NEW] Query builder, serialization, scoping
│   └── booking-validation.ts                                  # [NEW] Status transition validation, conflict detection
│
├── app/
│   ├── api/
│   │   ├── bookings/
│   │   │   ├── route.ts                                       # [NEW] GET (list) + POST (manual create)
│   │   │   └── [id]/
│   │   │       ├── route.ts                                   # [NEW] GET (detail) + PATCH (update)
│   │   │       └── status/
│   │   │           └── route.ts                               # [NEW] PATCH (status change with validation)
│   │   │
│   │   └── booking-orchestration/
│   │       ├── upsert/
│   │       │   └── route.ts                                   # [NEW] POST — n8n booking upsert
│   │       ├── status-update/
│   │       │   └── route.ts                                   # [NEW] POST — n8n status update
│   │       ├── payment-sync/
│   │       │   └── route.ts                                   # [NEW] POST — payment summary sync
│   │       ├── email-result/
│   │       │   └── route.ts                                   # [NEW] POST — email delivery result
│   │       └── workflow-result/
│   │           └── route.ts                                   # [NEW] POST — workflow result update
│   │
│   └── admin/
│       └── (dashboard)/
│           └── bookings/
│               ├── page.tsx                                   # [REWRITE] Server component with data fetching
│               ├── types.ts                                   # [NEW] TypeScript types for bookings
│               └── components/
│                   ├── BookingsClient.tsx                      # [NEW] Main client component
│                   ├── BookingTable.tsx                        # [NEW] Data table with badges
│                   ├── BookingFilters.tsx                      # [NEW] Filter bar
│                   ├── BookingPagination.tsx                   # [NEW] Pagination controls
│                   ├── BookingDetail.tsx                       # [NEW] Detail drawer
│                   ├── BookingTimeline.tsx                     # [NEW] Timeline component
│                   ├── BookingStatusBadge.tsx                  # [NEW] Status badge component
│                   ├── BookingCreateModal.tsx                  # [NEW] Manual creation modal
│                   └── BookingEditForm.tsx                     # [NEW] Edit form component
```

---

## 16. Implementation Checklist

### Phase 1 — Data Layer

- [ ] Add `BookingStatus`, `BookingSource`, `SyncStatus`, `AutomationStatus`, `PaymentSummaryStatus` enums to Prisma schema
- [ ] Add `Booking` model to Prisma schema
- [ ] Add `BookingTimeline` model to Prisma schema
- [ ] Generate and run database migration
- [ ] Create seed script with 10 sample booking records and timeline entries
- [ ] Run seed to populate development database

---

### Phase 2 — Server Utilities

- [ ] Create `lib/booking-validation.ts` — status transition validation and conflict detection
- [ ] Create `lib/booking-query.ts` — query builder, serialization, filtering
- [ ] Create `lib/booking-orchestration.ts` — placeholder orchestration functions

---

### Phase 3 — Admin API Endpoints

- [ ] Build `GET /api/bookings` — list with filtering, search, sorting, pagination
- [ ] Build `POST /api/bookings` — manual booking creation
- [ ] Build `GET /api/bookings/[id]` — single booking detail with timeline
- [ ] Build `PATCH /api/bookings/[id]` — update booking fields
- [ ] Build `PATCH /api/bookings/[id]/status` — status change with transition validation
- [ ] Add `requireAdmin()` authorization to all admin endpoints

---

### Phase 4 — Orchestration API Endpoints

- [ ] Build `POST /api/booking-orchestration/upsert` — n8n booking upsert
- [ ] Build `POST /api/booking-orchestration/status-update` — n8n status update
- [ ] Build `POST /api/booking-orchestration/payment-sync` — payment summary sync
- [ ] Build `POST /api/booking-orchestration/email-result` — email result logging
- [ ] Build `POST /api/booking-orchestration/workflow-result` — workflow result update
- [ ] Add API key authentication for n8n endpoints

---

### Phase 5 — User Interface

- [ ] Create `BookingsClient.tsx` — main client component with state management
- [ ] Create `BookingTable.tsx` — data table with all 12 columns and badge components
- [ ] Create `BookingStatusBadge.tsx` — reusable status badge (booking, payment, sync, automation, source)
- [ ] Create `BookingFilters.tsx` — filter bar with 9 filter controls
- [ ] Create `BookingPagination.tsx` — pagination controls
- [ ] Create `BookingDetail.tsx` — slide-out detail drawer with all 9 sections
- [ ] Create `BookingTimeline.tsx` — timeline component
- [ ] Create `BookingCreateModal.tsx` — manual booking creation modal
- [ ] Create `BookingEditForm.tsx` — edit form with field validation
- [ ] Rewrite `page.tsx` — server component with data fetching and authorization
- [ ] Add types to `types.ts`
- [ ] Implement loading, empty, and error states
- [ ] Verify responsive layout across desktop, tablet, and mobile

---

### Phase 6 — Verification

- [ ] Verify auto-upsert prevents duplicate bookings
- [ ] Verify status transitions follow the valid transitions table
- [ ] Verify illogical status jumps are blocked (returns 400)
- [ ] Verify Superadmin override works with mandatory reason
- [ ] Verify schedule conflict detection flags overlapping bookings
- [ ] Verify conflict does not silently overwrite bookings from n8n
- [ ] Verify payment summary is read-only in Booking Management
- [ ] Verify "View Full Payment Record" button navigates to Payment Management
- [ ] Verify timeline entries are created for every action (manual and automated)
- [ ] Verify audit logs are created for all booking events
- [ ] Verify email logs are linked to bookings
- [ ] Verify source, sync, and automation badges display correctly
- [ ] Verify manual editing sets `syncStatus` to `MANUAL_UPDATE`
- [ ] Verify existing sidebar label "Booking Management" is unchanged
- [ ] Verify design consistency with the existing admin panel

---

> [!NOTE]
> This specification is designed to be implemented incrementally. Phase 1–3 establish the data layer and admin-facing API. Phase 4 prepares for n8n integration (placeholder functions are acceptable initially). Phase 5 builds the UI. Phase 6 validates everything end-to-end. All phases must be reviewed against this document before deployment.
