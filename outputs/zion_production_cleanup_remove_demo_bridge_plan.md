# Codex Implementation Plan: Production Cleanup — Remove Demo Bridge, Demo Data, and Demo Code
## Zion Events Place and Management System

---

## 1. Purpose

This document provides a concise, concrete, professional, complete, and clean plan for converting the Zion Events Place and Management System from a demo/presentation-ready system into a real-data, production-ready system.

The goal is to remove all demo-related code, commands, scripts, routes, UI elements, seed data, mock data, sample data, and temporary demo bridge features.

After this cleanup, the system must use only real production data, real client submissions, real admin actions, and real n8n orchestration results.

---

## 2. Main Objective

Implement a full production cleanup that will:

1. Completely remove the Demo Client-to-Admin Bridge.
2. Remove all demo-only code, routes, commands, scripts, seeders, and UI labels.
3. Remove all static/mock/demo data from the frontend and backend.
4. Clean the database completely except user/auth/RBAC-related records.
5. Preserve all user accounts.
6. Keep all database tables, schema, migrations, and relations intact.
7. Ensure all pages show real data only.
8. Ensure empty states appear when there are no records.
9. Ensure the system is ready for real production booking operations.
10. Ensure no demo records reappear after restart, rebuild, deploy, or reseed.

---

## 3. Strict Non-Negotiable Rule

Do not delete users.

Preserve these tables and records if they exist:

```text
users
accounts
sessions
roles
permissions
user_roles
verification_tokens
authentication-related records
RBAC-related records
```

Clean all other business/transactional records unless the table is a required system configuration table.

---

## 4. Completely Remove Demo Client-to-Admin Bridge

Remove all code related to the Demo Client-to-Admin Bridge.

Search and remove all related keywords:

```text
demo bridge
demo client admin bridge
demo booking bridge
demo client booking
demo trigger
demo mode
demo fallback
demo session
demo upsert
demo payload
temporary bridge
client-admin bridge
demoBridge
demoSession
demoBooking
demoClient
DEMO
ZION-DEMO
```

Remove all demo bridge routes, services, helpers, utilities, and frontend calls.

Correct production flow must be:

```text
Client Panel Booking Form
        ↓
Real Backend Booking API
        ↓
Database
        ↓
n8n Production Webhook
        ↓
Admin Panel Updates
```

Remove this flow completely:

```text
Client Panel
        ↓
Demo Client-to-Admin Bridge
        ↓
Fake Admin Records
```

---

## 5. Remove Demo API Routes

Delete or disable all demo-only API routes such as:

```text
/api/demo-bridge
/api/demo-bridge/client-booking-submit
/api/demo/bookings
/api/demo/reset
/api/demo/seed
/api/demo/cleanup
/api/mock
/api/sample
/api/test-data
```

If any real client feature still calls a demo route, replace it with the correct production route.

---

## 6. Remove Demo UI Elements

Remove all visible demo-only UI elements from the Admin Panel and Client Panel.

Remove labels/buttons/text such as:

```text
Demo Mode
Demo Bridge
Demo Booking
Demo Client
Temporary Demo
Sample Data
Mock Data
Presentation Mode
Seed Demo Data
Reset Demo
Run Demo
Generate Demo Booking
Demo Cleanup
Disable Demo Bridge
```

No demo controls should remain visible anywhere in the system.

---

## 7. Remove Demo Commands and Scripts

Inspect and clean `package.json`.

Remove scripts such as:

```json
{
  "demo:on": "...",
  "demo:off": "...",
  "demo:seed": "...",
  "demo:reset": "...",
  "demo:cleanup": "...",
  "seed:demo": "...",
  "bridge:demo": "..."
}
```

Remove demo-related folders/files such as:

```text
scripts/demo
scripts/seed-demo
scripts/demo-bridge
lib/demo
lib/demo-bridge
utils/demo
data/demo
data/mock
data/sample
prisma/seed-demo.ts
prisma/demo-seed.ts
```

If a production seed file is still needed, it must only create required system defaults and must not create fake bookings, payments, contracts, tasks, inquiries, logs, or notifications.

---

## 8. Clean Database Data Except Users

Clean all business/transactional data.

Do not drop tables.

Do not modify schema unnecessarily.

Clean records from tables such as:

```text
bookings
payments
payment_history
contracts
contract_files
email_logs
workflow_logs
audit_logs
system_logs
notifications
admin_tasks
calendar_events
inquiries
testimonials
services
packages
event_categories
support_faq_entries
support_center_entries
client_messages
booking_timelines
booking_activities
attachments
uploaded_files
demo_bridge_records
```

Preserve only:

```text
users
auth tables
roles
permissions
RBAC tables
```

Codex must inspect the actual Prisma schema/database structure and adapt the cleanup order based on foreign key constraints.

---

## 9. Database Cleanup Safety Requirements

Before deleting data:

1. Create a database backup.
2. Confirm the target environment.
3. Confirm users will not be deleted.
4. Clean child/dependent tables before parent tables.
5. Use a transaction where possible.
6. Print deleted record counts.
7. Require an explicit confirmation flag.
8. Never run cleanup automatically on app startup.
9. Never run cleanup automatically during deployment.

---

## 10. Required Safe Cleanup Script

Create a controlled script:

```text
scripts/clean-production-data.ts
```

Add a safe command:

```json
{
  "db:clean-production-data": "tsx scripts/clean-production-data.ts"
}
```

The script must require:

```text
--confirm
```

If missing, stop and print:

```text
Cleanup aborted. Add --confirm to intentionally clean non-user production data.
```

Recommended command:

```bash
npm run db:clean-production-data -- --confirm
```

---

## 11. Cleanup Order

Suggested cleanup order:

```text
email_logs
workflow_logs
system_logs
audit_logs
notifications
admin_tasks
payment_history
payments
contract_files
contracts
booking_activities
booking_timelines
calendar_events
attachments
uploaded_files
inquiries
testimonials
support_faq_entries
support_center_entries
packages
services
event_categories
bookings
```

Codex must adapt this order based on actual foreign key dependencies.

---

## 12. Remove Demo Booking References

Remove all demo reference generation and demo references such as:

```text
ZION-DEMO-0001
ZION-DEMO-0002
ZION-DEMO-0003
ZION-DEMO-0004
```

Production booking references must use a real format, such as:

```text
ZION-BKG-YYYY-000001
```

or:

```text
ZION-YYYYMMDD-000001
```

Rules:

1. Generated by backend only.
2. Unique.
3. No `DEMO` text.
4. Safe for concurrent submissions.
5. Does not reset unexpectedly in production.

---

## 13. Remove Mock Data From Admin Pages

Admin pages must fetch real backend/database data only.

Clean mock/static/demo data from:

```text
Dashboard
Booking Management
Contract Management
Payment & History
Calendar
Services and Packages
Support Center
Reports & Analytics
System Logs
Inquiries
Team
Notifications
Admin To-Do List / Tasks
```

If there is no data, show production-safe empty states.

Example:

```text
No bookings yet.
New client bookings will appear here once submitted.
```

---

## 14. Remove Mock Data From Client Panel

Client-facing pages must not use demo/static arrays.

Clean:

```text
Home
Packages
Services
Booking form
Contact / Inquiry form
Testimonials
FAQ
Booking receipt page
```

Client pages must show only:

1. Real services/packages from the database.
2. Real approved testimonials.
3. Real FAQ/support content from the admin-managed support center.
4. Real booking receipt data from actual booking records.

---

## 15. Environment Variable Cleanup

Remove demo-only environment variables:

```env
DEMO_MODE=true
ENABLE_DEMO_BRIDGE=true
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_ENABLE_DEMO=true
DEMO_BRIDGE_SECRET=
DEMO_SEED_ENABLED=
```

Keep production variables:

```env
DATABASE_URL=
NEXTAUTH_SECRET=
BOOKING_ORCHESTRATION_API_KEY=
N8N_BOOKING_WEBHOOK_URL=
N8N_WEBHOOK_SECRET=
EMAIL/SMTP_PROVIDER_CREDENTIALS=
```

Strict rule:

```text
No sensitive automation secret should use NEXT_PUBLIC_.
```

---

## 16. n8n Production Webhook Requirement

Use the production webhook URL, not the test URL.

Remove:

```text
/webhook-test/zion-booking-created
```

Use:

```text
/webhook/zion-booking-created
```

Local production webhook:

```env
N8N_BOOKING_WEBHOOK_URL=http://localhost:5678/webhook/zion-booking-created
```

Deployed production webhook:

```env
N8N_BOOKING_WEBHOOK_URL=https://your-n8n-domain.com/webhook/zion-booking-created
```

Strict rule:

```text
Frontend must never call n8n directly.
Only the backend may trigger n8n.
```

---

## 17. Security Requirements

The cleanup must improve production security.

Strict rules:

1. Remove all demo routes.
2. Remove all demo tokens.
3. Remove all hardcoded API keys.
4. Remove all hardcoded test clients.
5. Remove all hardcoded bookings.
6. Remove all fake payment records.
7. Remove all fake contracts.
8. Remove all fake email addresses.
9. Remove all debug-only UI controls.
10. Ensure admin pages require authentication.
11. Ensure super-admin features enforce RBAC.
12. Ensure orchestration endpoints require `x-api-key`.
13. Ensure n8n webhook validates secret headers.
14. Ensure no sensitive values are exposed to the browser.

---

## 18. Production Empty States

Use empty states instead of fake data.

### Bookings

```text
No bookings yet.
New client bookings will appear here once submitted.
```

### Payments

```text
No payment records yet.
Payment records will appear once admins add or verify client payments.
```

### Contracts

```text
No contracts yet.
Contracts will be generated from confirmed bookings.
```

### Notifications

```text
No notifications yet.
Important booking and workflow updates will appear here.
```

### Admin To-Do List

```text
No tasks yet.
Admin tasks will be created automatically when new bookings are processed.
```

---

## 19. Testing After Cleanup

### Test A: Login

1. Login as Super Admin.
2. Login as Admin.
3. Confirm users were not deleted.
4. Confirm RBAC still works.

### Test B: Empty Admin Pages

1. Open Dashboard.
2. Open Booking Management.
3. Open Payment & History.
4. Open Contract Management.
5. Open Calendar.
6. Open Reports.
7. Confirm no fake/demo data appears.
8. Confirm empty states appear correctly.

### Test C: Real Booking Flow

1. Submit a new booking from Client Panel.
2. Confirm real booking appears in Admin Booking Management.
3. Confirm n8n production webhook runs.
4. Confirm client receives receipt email.
5. Confirm email log is created.
6. Confirm booking email status is updated.
7. Confirm admin tasks are generated.
8. Confirm admin notification is created.

### Test D: Invalid Email Flow

1. Submit booking with invalid email format.
2. Confirm email is skipped.
3. Confirm skipped email log is saved.
4. Confirm booking still continues.
5. Confirm admin tasks and notification are created.

### Test E: Error Handler

1. Temporarily break one backend endpoint.
2. Submit booking.
3. Confirm main workflow fails.
4. Confirm n8n error handler runs.
5. Confirm workflow error log and admin error notification are created.
6. Restore the correct endpoint.

---

## 20. Acceptance Criteria

This cleanup is complete only if:

1. Demo Client-to-Admin Bridge is fully removed.
2. Demo routes are removed.
3. Demo scripts and commands are removed.
4. Demo UI controls are removed.
5. Demo seed data is removed.
6. Database is cleaned except users/auth/RBAC records.
7. No `ZION-DEMO` booking references remain.
8. No fake bookings, payments, contracts, inquiries, notifications, logs, or tasks remain.
9. Admin pages use real backend/database data.
10. Client pages use real backend/database data.
11. Empty states appear when no data exists.
12. Real booking submission works.
13. n8n production webhook works.
14. Error handler workflow works.
15. No frontend code exposes automation secrets.
16. No demo bridge code remains in the repository.
17. System is ready for real production data.

---

## 21. Final Instruction for Codex

Remove all demo-related code, routes, commands, seed data, bridge logic, UI labels, and mock/static records from the Zion Events Place and Management System.

Completely remove the Demo Client-to-Admin Bridge.

Clean the database completely except for users and required authentication/RBAC records.

Do not delete user accounts.

Do not drop tables.

Do not damage the Prisma schema or migrations.

After cleanup, all pages must use real database data and show clean empty states when no records exist.

The final system must be production-ready, real-data-driven, secure, and fully prepared for actual client bookings and n8n orchestration.
