# Audit Logs Module — Technical Specification

> **System:** ZenTra Admin Panel  
> **Version:** 1.0  
> **Date:** June 21, 2026  
> **Status:** Draft — Pending Approval

---

## 1. Overview

### 1.1 Purpose

The Audit Logs module provides a centralized, immutable record of all significant user activities and system events within the ZenTra platform. It serves as the foundation for **accountability**, **traceability**, **monitoring**, **compliance**, and **security** across the entire application.

### 1.2 Scope

This specification covers the full lifecycle of audit logging — from event capture and storage through to querying, visualization, and export. It applies to all modules within the ZenTra admin panel and public-facing operations that affect system state.

### 1.3 Target Audience

- Superadmins and Admins who review system activity
- Developers implementing and maintaining the module
- Stakeholders responsible for compliance and security oversight

---

## 2. Audit Log Data Model

### 2.1 Log Entry Schema

Each audit log entry must capture the following fields:

| Field | Type | Description |
|---|---|---|
| `id` | `String` (CUID) | Unique, immutable log identifier |
| `timestamp` | `DateTime` | Exact date and time of the event (UTC, auto-generated) |
| `userId` | `String` (nullable) | ID of the user who performed the action (null for system events) |
| `userName` | `String` | Display name of the acting user, or `"System"` for automated events |
| `userRole` | `Enum` | Role at the time of action: `SUPERADMIN`, `ADMIN`, `CLIENT`, or `SYSTEM` |
| `action` | `Enum` | Categorized action type (see §3) |
| `module` | `String` | Module or page where the action occurred (e.g., `Bookings`, `Settings`) |
| `description` | `String` (Text) | Human-readable description of the activity |
| `status` | `Enum` | Outcome: `SUCCESS`, `FAILED`, `WARNING`, `INFO` |
| `ipAddress` | `String` (nullable) | Client IP address at the time of the action |
| `userAgent` | `String` (nullable) | Browser or device user-agent string |
| `previousValues` | `JSON` (nullable) | Snapshot of data before modification (for update/delete operations) |
| `newValues` | `JSON` (nullable) | Snapshot of data after modification (for create/update operations) |
| `metadata` | `JSON` (nullable) | Additional contextual data (request path, error details, affected record IDs) |

### 2.2 Prisma Schema Definition

```prisma
enum AuditAction {
  CREATE
  READ
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  LOGIN_FAILED
  PASSWORD_CHANGE
  PROFILE_UPDATE
  SETTINGS_CHANGE
  APPROVAL
  REJECTION
  SUBMISSION
  FILE_UPLOAD
  FILE_DELETE
  PERMISSION_CHANGE
  ROLE_ASSIGNMENT
  SYSTEM_CONFIG
  EXPORT
  ERROR
}

enum AuditStatus {
  SUCCESS
  FAILED
  WARNING
  INFO
}

model AuditLog {
  id             String      @id @default(cuid())
  timestamp      DateTime    @default(now())
  userId         String?     @map("user_id")
  userName       String      @map("user_name")
  userRole       String      @map("user_role")
  action         AuditAction
  module         String
  description    String      @db.Text
  status         AuditStatus
  ipAddress      String?     @map("ip_address")
  userAgent      String?     @map("user_agent") @db.Text
  previousValues Json?       @map("previous_values")
  newValues      Json?       @map("new_values")
  metadata       Json?

  @@index([timestamp])
  @@index([userId])
  @@index([action])
  @@index([module])
  @@index([status])
  @@index([timestamp, action])
  @@index([timestamp, userId])
  @@map("audit_logs")
}
```

> [!IMPORTANT]
> The `audit_logs` table must **not** have `updatedAt` or any mutable timestamp. Logs are append-only and must never be modified after creation.

---

## 3. Action Tracking

### 3.1 Tracked Action Types

The system must automatically log the following categories of events:

| Category | Actions | Auto-Logged |
|---|---|---|
| **CRUD Operations** | `CREATE`, `READ` (configurable), `UPDATE`, `DELETE` | ✅ Yes |
| **Authentication** | `LOGIN`, `LOGOUT`, `LOGIN_FAILED` | ✅ Yes |
| **Account Management** | `PASSWORD_CHANGE`, `PROFILE_UPDATE` | ✅ Yes |
| **Administrative** | `SETTINGS_CHANGE`, `PERMISSION_CHANGE`, `ROLE_ASSIGNMENT`, `SYSTEM_CONFIG` | ✅ Yes |
| **Workflow** | `APPROVAL`, `REJECTION`, `SUBMISSION` | ✅ Yes |
| **File Operations** | `FILE_UPLOAD`, `FILE_DELETE` | ✅ Yes |
| **Data Export** | `EXPORT` | ✅ Yes |
| **System Errors** | `ERROR` | ✅ Yes |

### 3.2 Module Mapping

Each action must be associated with the ZenTra module where it originated:

| Module Key | Description |
|---|---|
| `Authentication` | Login, logout, and session events |
| `Dashboard` | Dashboard access and overview actions |
| `Bookings` | Event/booking management |
| `Calendar` | Calendar views and interactions |
| `Services` | Service and package management |
| `Payments` | Payment processing and verification |
| `Contracts` | Contract generation and management |
| `Team` | Team member management |
| `Reports` | Report generation and export |
| `Settings` | System and user settings |
| `Profile` | User profile management |
| `Support` | Support ticket and inquiry handling |
| `Audit` | Audit log access and export |
| `System` | Internal system operations and errors |

### 3.3 Contextual Data Capture

For **update** and **delete** operations, the system must capture:

- **`previousValues`** — A JSON snapshot of the record's state before modification
- **`newValues`** — A JSON snapshot of the record's state after modification (null for deletions)

> [!CAUTION]
> **Sensitive Data Exclusion:** Passwords, authentication tokens, API keys, and any confidential credentials must **never** appear in `previousValues`, `newValues`, or `metadata`. All such fields must be sanitized or omitted before logging.

---

## 4. Server-Side Logging Service

### 4.1 Core Utility — `lib/audit.ts`

A centralized logging utility must be implemented to provide a consistent API for recording audit events across the application:

```typescript
// lib/audit.ts

interface AuditLogInput {
  userId?: string | null;
  userName: string;
  userRole: string;
  action: AuditAction;
  module: string;
  description: string;
  status: AuditStatus;
  ipAddress?: string | null;
  userAgent?: string | null;
  previousValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

async function createAuditLog(input: AuditLogInput): Promise<void>;
```

### 4.2 Request Context Helper

A helper function must extract IP address and user-agent from incoming requests:

```typescript
function getRequestContext(request: Request): {
  ipAddress: string | null;
  userAgent: string | null;
};
```

### 4.3 Data Sanitization

A sanitization layer must strip sensitive fields before persisting:

```typescript
const SENSITIVE_FIELDS = [
  'password', 'passwordHash', 'token', 'secret',
  'apiKey', 'accessToken', 'refreshToken', 'creditCard',
];

function sanitize(data: Record<string, unknown>): Record<string, unknown>;
```

### 4.4 Integration Points

Audit logging must be integrated at the following touchpoints:

1. **API Route Handlers** — All `/api/*` routes that mutate data
2. **NextAuth Callbacks** — Login success, login failure, and logout events
3. **Server Actions** — Any server-side function that performs CRUD operations
4. **Error Boundaries** — Unhandled errors and critical system failures

---

## 5. API Endpoints

### 5.1 Query Audit Logs

```
GET /api/audit
```

**Query Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `page` | `number` | Page number (default: `1`) |
| `limit` | `number` | Records per page (default: `20`, max: `100`) |
| `search` | `string` | Keyword search across `userName`, `description`, `module` |
| `startDate` | `ISO 8601` | Filter: events on or after this timestamp |
| `endDate` | `ISO 8601` | Filter: events on or before this timestamp |
| `userId` | `string` | Filter: specific user |
| `userRole` | `string` | Filter: specific role |
| `action` | `AuditAction` | Filter: specific action type |
| `module` | `string` | Filter: specific module |
| `status` | `AuditStatus` | Filter: specific status |
| `sortBy` | `string` | Sort field (default: `timestamp`) |
| `sortOrder` | `asc \| desc` | Sort direction (default: `desc`) |

**Response:**

```json
{
  "logs": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalRecords": 1458,
    "totalPages": 73
  }
}
```

**Authorization:** `SUPERADMIN` and `ADMIN` roles only.

### 5.2 Get Single Log Entry

```
GET /api/audit/[id]
```

Returns the full audit log record including `previousValues`, `newValues`, and `metadata`.

**Authorization:** `SUPERADMIN` and `ADMIN` roles only.

### 5.3 Export Audit Logs

```
GET /api/audit/export?format=csv|excel|pdf
```

Accepts the same filter and search parameters as the query endpoint. Exports must respect all active filters.

**Supported Formats:**

| Format | Content-Type | Library |
|---|---|---|
| CSV | `text/csv` | Native implementation |
| Excel | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | `exceljs` or equivalent |
| PDF | `application/pdf` | `pdfkit`, `jspdf`, or equivalent |

**Authorization:** `SUPERADMIN` and `ADMIN` roles only.

---

## 6. User Interface

### 6.1 Page Location

```
/admin/(dashboard)/audit
```

The existing placeholder page at this route must be replaced with the full-featured audit logs interface.

### 6.2 Layout and Components

The audit logs page must include the following sections:

#### Header Section
- Page title: **"Audit Logs"**
- Subtitle with contextual description
- Real-time update indicator
- **Refresh** button
- **Export** dropdown (CSV, Excel, PDF)

#### Filter Bar
- **Search** — Full-text keyword search input with debounced queries
- **Date Range** — Start and end date pickers
- **User** — Dropdown of system users
- **Role** — Dropdown: `All`, `Superadmin`, `Admin`, `Client`, `System`
- **Action Type** — Dropdown of all `AuditAction` values
- **Module** — Dropdown of all module names
- **Status** — Dropdown: `All`, `Success`, `Failed`, `Warning`, `Info`
- **Clear Filters** button

#### Data Table
- Sortable columns: `Timestamp`, `User`, `Role`, `Action`, `Module`, `Description`, `Status`, `IP Address`
- Color-coded status badges:
  - `SUCCESS` → Green
  - `FAILED` → Red
  - `WARNING` → Amber
  - `INFO` → Blue
- Color-coded action type pills
- Clickable rows to open the detail view
- Responsive layout — horizontal scroll on smaller screens

#### Pagination
- Server-side pagination controls
- Page size selector: `10`, `20`, `50`, `100`
- Current page indicator with total record count
- First, Previous, Next, Last navigation

#### Detail Panel
When a log entry is selected, a slide-out panel or modal must display:

- **Activity Summary** — Action, module, status, timestamp
- **User Information** — Name, role, user ID
- **Description** — Full event description
- **Change Comparison** (if applicable) — Side-by-side or inline diff of `previousValues` → `newValues`
- **Request Metadata** — IP address, user agent, request path
- **Additional Metadata** — Any extra contextual data from the `metadata` field

### 6.3 Design Requirements

- Must follow ZenTra's existing design language (warm palette with `#FDF5CC` backgrounds, `#BEA542` accents, serif typography)
- Professional and enterprise-grade appearance
- Fully responsive: desktop, tablet, and mobile
- Smooth transitions and micro-animations for panel open/close, filter application, and row hover states
- Loading skeletons during data fetch
- Empty state illustration when no logs match filters

---

## 7. Security Requirements

### 7.1 Access Control

| Requirement | Implementation |
|---|---|
| Only `SUPERADMIN` and `ADMIN` can access audit logs | Enforced via `getCurrentAdmin()` in the page layout and `requireAdmin()` in API routes |
| Regular users (`CLIENT` role) must have no access | API routes return `403 Forbidden`; page redirects to `/admin` |
| All API endpoints must validate session and role | Server-side checks on every request |

### 7.2 Data Integrity

| Requirement | Implementation |
|---|---|
| Logs are append-only (immutable) | No `UPDATE` or `DELETE` Prisma operations exposed for `AuditLog`; no `updatedAt` field |
| No API endpoint for modifying or deleting logs | Only `GET` endpoints exposed |
| Database-level protection | Consider PostgreSQL row-level security or restricted database roles for production |

### 7.3 Data Sanitization

| Requirement | Implementation |
|---|---|
| Passwords never logged | Strip `password`, `passwordHash` from all logged payloads |
| Tokens never logged | Strip `token`, `accessToken`, `refreshToken`, `secret`, `apiKey` |
| Sensitive PII minimized | Log only necessary identifiers; avoid storing full credit card numbers, SSNs, etc. |

---

## 8. Performance Requirements

### 8.1 Database Optimization

- **Composite indexes** on `(timestamp, action)` and `(timestamp, userId)` for common query patterns
- **Single-field indexes** on `timestamp`, `userId`, `action`, `module`, `status`
- **Server-side pagination** — never load full dataset into memory
- **Cursor-based pagination** as an optional enhancement for very large datasets

### 8.2 API Optimization

- Maximum page size capped at `100` records
- Debounced search queries (300ms minimum on the client)
- Efficient `COUNT` queries for pagination metadata
- Consider read replicas for audit queries if write volume is high

### 8.3 Client Optimization

- Skeleton loading states — no blank screens
- Optimistic UI updates for filter changes
- Memoized components to prevent unnecessary re-renders
- Virtualized table rows for large visible datasets (optional)

---

## 9. Export Features

### 9.1 Supported Formats

| Format | Extension | Use Case |
|---|---|---|
| **CSV** | `.csv` | Data analysis, spreadsheet import |
| **Excel** | `.xlsx` | Formatted reports with column headers and styling |
| **PDF** | `.pdf` | Printable compliance and audit reports |

### 9.2 Export Behavior

- Exports must respect all currently active filters and search criteria
- File name format: `zentra-audit-logs-YYYY-MM-DD.{ext}`
- Include a header row with column labels
- Timestamps formatted in the user's local timezone
- Large exports (>10,000 records) should be handled with streaming or background processing
- Export actions are themselves logged in the audit trail

---

## 10. Implementation Checklist

### Phase 1 — Foundation
- [ ] Add `AuditAction`, `AuditStatus` enums and `AuditLog` model to Prisma schema
- [ ] Generate and run database migration
- [ ] Implement `lib/audit.ts` — core logging service with sanitization
- [ ] Implement request context helper for IP and user-agent extraction

### Phase 2 — Event Integration
- [ ] Integrate audit logging into NextAuth callbacks (login, logout, login failure)
- [ ] Integrate audit logging into existing API routes (bookings, events, payments, settings, team, etc.)
- [ ] Integrate audit logging into profile and password change flows
- [ ] Add error-level logging for unhandled exceptions

### Phase 3 — API Layer
- [ ] Build `GET /api/audit` with filtering, search, sorting, and pagination
- [ ] Build `GET /api/audit/[id]` for single log detail retrieval
- [ ] Build `GET /api/audit/export` with CSV, Excel, and PDF generation
- [ ] Add authorization middleware to all audit API routes

### Phase 4 — User Interface
- [ ] Build the audit logs page with data table, filters, search, and pagination
- [ ] Build the log detail panel with change comparison view
- [ ] Implement export dropdown with format selection
- [ ] Add loading states, empty states, and error handling
- [ ] Ensure responsive design across all breakpoints

### Phase 5 — Testing and Verification
- [ ] Verify all action types are being logged correctly
- [ ] Verify sensitive data is never present in log entries
- [ ] Verify access control — `CLIENT` users cannot access audit endpoints or pages
- [ ] Verify pagination, filtering, and search accuracy
- [ ] Verify export output matches active filters
- [ ] Perform load testing with large datasets (10,000+ records)

---

## 11. Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Authentication | NextAuth v4 (Credentials provider, JWT strategy) |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Export — CSV | Native string generation |
| Export — Excel | `exceljs` (or equivalent) |
| Export — PDF | `jspdf` + `jspdf-autotable` (or equivalent) |

---

## 12. File Structure

```
zentra/
├── prisma/
│   └── schema.prisma                          # Updated with AuditLog model
├── lib/
│   └── audit.ts                               # Core audit logging service
├── app/
│   ├── api/
│   │   └── audit/
│   │       ├── route.ts                        # GET — list & search logs
│   │       ├── [id]/
│   │       │   └── route.ts                    # GET — single log detail
│   │       └── export/
│   │           └── route.ts                    # GET — export (CSV/Excel/PDF)
│   └── admin/
│       └── (dashboard)/
│           └── audit/
│               ├── page.tsx                    # Main audit logs page
│               └── components/
│                   ├── AuditLogTable.tsx        # Data table component
│                   ├── AuditLogFilters.tsx      # Filter bar component
│                   ├── AuditLogDetail.tsx       # Detail slide-out panel
│                   ├── AuditLogPagination.tsx   # Pagination controls
│                   └── AuditLogExport.tsx       # Export dropdown
```

---

> [!NOTE]
> This specification is a living document. It should be updated as implementation progresses and new requirements are identified. All changes to this specification must be reviewed and approved before implementation begins.
