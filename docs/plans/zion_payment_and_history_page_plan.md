# Payment & History Page Plan  
## Zion Events Place and Management System

---

## 1. Purpose

This document provides a concise, concrete, professional, and implementation-ready plan for the **Payment & History** page of the Zion Events Place and Management System.

Since Zion Events Place will still collect payments **in person**, this page will not integrate online payment gateways. Instead, it will act as the system’s official payment monitoring and recording module where admins can manually encode, verify, update, and track client payments connected to active bookings.

The page must remain useful and impactful by helping the business monitor:

- Monthly earnings
- Active client payments
- Pending payments
- Down payments
- Partial payments
- Full payments
- Overdue balances
- Payment deadlines
- Payment proof/receipt records
- Payment history per booking
- Revenue and collection performance

---

## 2. Main Objective

The **Payment & History** page should become the source of truth for payment records.

It should allow admins and super admins to:

1. View active bookings with payment obligations.
2. Track payment status per booking.
3. Monitor down payments, partial payments, full payments, and overdue balances.
4. Manually record in-person payments.
5. Upload proof of receipt or payment evidence.
6. Prevent saving payment changes without proof image.
7. Automatically calculate remaining balances.
8. Track monthly revenue and collection performance.
9. Sync payment summaries back to Booking Management, Dashboard, Calendar, Reports, Notifications, and System Logs.

---

## 3. Important Business Rule

Zion Events Place does not allow direct online payment integration for this system.

Therefore:

```text
The system must not process online payments.
The system must not include payment gateway checkout.
The system must not accept client card, e-wallet, or bank payment directly.
```

Instead, payments are handled manually or in person.

The system will only record and monitor payments after the client presents valid proof such as:

- Physical receipt photo
- Bank transfer screenshot
- Cash payment receipt
- Acknowledgment receipt
- Manual proof uploaded by admin

---

## 4. Page Role in the System

The Payment & History page should be connected to:

| Module | Relationship |
|---|---|
| Booking Management | Reads active bookings and updates payment summary |
| Contract Management | Supplies payment data for contract amount and payment history |
| Dashboard | Sends revenue, pending, overdue, and collection data |
| Calendar | Adds payment due dates and overdue reminders |
| Notifications | Creates payment alerts and reminders |
| Reports & Analytics | Provides revenue and collection metrics |
| System Logs | Records all payment-related actions |
| Client Panel | Receives booking data but does not process payment |

---

## 5. Page Header

Page title:

```text
Payment & History
```

Page subtitle:

```text
Track in-person payments, client balances, due dates, receipts, and payment progress for active bookings.
```

---

## 6. Summary Cards

Add summary cards at the top of the page.

Required cards:

| Card | Description |
|---|---|
| Revenue This Month | Total verified payments collected within the current month |
| Total Collected | Total verified payments across all active records |
| Pending Payments | Payments waiting for client payment or admin verification |
| Overdue Payments | Payments past their deadline |
| Down Payments | Bookings with recorded down payment |
| Partial Payments | Bookings with partial but incomplete payment |
| Fully Paid | Bookings with complete payment |
| For Verification | Payments with uploaded proof but not yet confirmed |

Strict calculation rule:

```text
Revenue must only include verified or approved payments.
Pending, rejected, overdue, and unverified payments must not count as earned revenue.
```

---

## 7. Main Table: Active Booking Payments

The page must show a table of active bookings with payment records.

Recommended columns:

| Column | Description |
|---|---|
| Payment Reference | Unique payment record number |
| Booking Reference | Related booking code |
| Client | Client name, email, and contact number |
| Event | Event type, event title, and event date |
| Package | Selected package and package price |
| Payment Type | Down Payment, Partial Payment, Full Payment |
| Payment Progress | Percentage or milestone progress |
| Amount Paid | Total amount already paid |
| Remaining Balance | Package price minus total paid |
| Due Date | Deadline for next payment |
| Payment Status | Unpaid, For Verification, Down Payment, Partial, Fully Paid, Overdue |
| Proof | Uploaded receipt/proof indicator |
| Last Updated | Latest payment update |
| Actions | View, Edit, Add Payment, Mark Verified, View Proof |

---

## 8. Filters and Search

Add filters for:

- Search by client name, booking reference, payment reference, event title, or email
- Date range
- Event type
- Package
- Payment type
- Payment status
- Due date status
- Verification status
- Assigned coordinator
- Month / year

Required filter values:

### Payment Type

```text
Down Payment
Partial Payment
Full Payment
Reservation Fee
Additional Payment
```

### Payment Status

```text
Unpaid
For Verification
Down Payment Paid
Partially Paid
Fully Paid
Overdue
Rejected
Refunded
Cancelled
```

### Due Date Status

```text
Due Today
Due This Week
Due This Month
Overdue
No Due Date
```

---

## 9. Payment Milestone and Progress Logic

Each booking should have a payment progress or milestone tracker.

Example milestone:

```text
Package Price: ₱225,000
Down Payment: ₱25,000
Amount Paid: ₱25,000
Remaining Balance: ₱200,000
Progress: 11%
Status: Down Payment Paid
```

Recommended progress formula:

```text
payment_progress = (total_paid / total_package_price) * 100
```

Strict rules:

1. If `amount_paid = 0`, status is `Unpaid`.
2. If `amount_paid > 0` but less than total amount, status can be `Down Payment Paid` or `Partially Paid`.
3. If `amount_paid >= total_package_price`, status is `Fully Paid`.
4. If due date has passed and balance remains, status is `Overdue`.
5. If proof was uploaded but not approved, status is `For Verification`.

---

## 10. Payment Deadline Logic

Payments must not be unlimited.

Each payment record must have a deadline.

Recommended default rules:

| Payment Stage | Deadline Rule |
|---|---|
| Reservation / Down Payment | Due within configured hold period or selected due date |
| Second Payment / Partial Payment | Due based on admin-selected date |
| Final Payment | Due before the event date |
| Full Payment | Due based on admin-selected deadline |

Recommended default:

```text
Down payment or balance deadline should default to 30 days from booking creation unless admin sets a custom due date.
```

Overdue condition:

```text
If current date is greater than due_date and remaining_balance > 0, mark payment as overdue.
```

---

## 11. Manual Payment Input Feature

Admins and super admins must be able to manually input payments because payments happen in person.

### Add Payment Modal / Drawer

Fields:

- Booking reference
- Client name
- Event title
- Package price
- Payment type
- Payment amount
- Payment method
- Payment date
- Due date
- Payment status
- Receipt/proof image
- Notes

Payment methods:

```text
Cash
Bank Transfer
GCash
BDO
BPI
Maya
Other
```

Payment type:

```text
Down Payment
Partial Payment
Full Payment
Reservation Fee
Additional Payment
```

---

## 12. Strict Proof Image Requirement

This is a required condition.

When admin or super admin adds or edits payment information, the system must require proof image before saving.

Strict rule:

```text
If payment amount, payment status, payment method, or payment type is changed, the system must require a receipt/proof image.
```

If no proof image is uploaded:

```text
Do not allow Save.
Show validation error:
"Payment proof is required before saving payment changes."
```

Accepted proof formats:

```text
JPG
JPEG
PNG
WEBP
PDF
```

Recommended max file size:

```text
5 MB
```

The proof image holder should show:

- Upload area
- Preview
- File name
- Replace proof button
- Remove proof button, only before saving
- View full proof button after saving

---

## 13. Down Payment Calculation Logic

When admin selects `Down Payment`, the system must automatically calculate the remaining balance.

Formula:

```text
remaining_balance = total_package_price - down_payment_amount
```

Example:

```text
Package Price: ₱225,000
Down Payment: ₱25,000
Remaining Balance: ₱200,000
```

Strict rules:

1. Down payment must not be greater than the package price.
2. Remaining balance must never be negative.
3. If down payment equals package price, status should become `Fully Paid`.
4. If down payment is less than package price, status should become `Down Payment Paid` or `Partially Paid`.
5. All calculations must update immediately in the UI before saving.

---

## 14. Edit Existing Payment Feature

Admins and super admins can edit existing payment records.

Editable fields:

- Payment amount
- Payment type
- Payment method
- Payment date
- Due date
- Payment status
- Proof image
- Notes

Strict edit rules:

```text
Any edit affecting amount, status, method, or payment type requires proof image.
```

The system must create payment history entries for every change.

Do not overwrite old payment history silently.

---

## 15. Payment Status Update Rules

Allowed status values:

```text
Unpaid
For Verification
Down Payment Paid
Partially Paid
Fully Paid
Overdue
Rejected
Refunded
Cancelled
```

Recommended transition logic:

```text
Unpaid → For Verification
For Verification → Down Payment Paid
For Verification → Partially Paid
For Verification → Fully Paid
For Verification → Rejected
Down Payment Paid → Partially Paid
Partially Paid → Fully Paid
Any unpaid or partial status → Overdue if deadline passed
```

Manual override by Super Admin should require:

- Reason
- Proof image
- Audit log entry

---

## 16. Payment Details Drawer

When admin clicks a payment row, open a details drawer.

Sections:

1. Payment Summary
2. Booking Details
3. Client Details
4. Package Details
5. Payment Progress
6. Payment Milestones
7. Proof / Receipt Viewer
8. Payment History
9. Related Contract
10. Internal Notes
11. Audit Trail

### Payment Summary

Show:

- Payment reference
- Current status
- Total package price
- Total paid
- Remaining balance
- Due date
- Overdue days, if applicable

### Proof Viewer

Show:

- Uploaded proof image or PDF
- Upload date
- Uploaded by
- Verification status
- Notes

---

## 17. Payment History Timeline

Each payment record should have history.

Timeline entries:

- Payment record created
- Proof uploaded
- Payment marked for verification
- Payment verified
- Payment status changed
- Payment edited
- Payment marked overdue
- Payment rejected
- Payment completed

Each timeline item should include:

- Date and time
- Action
- Performed by
- Old value
- New value
- Notes

---

## 18. Database Model Plan

Use existing tables if already available. If missing, prepare the following.

### 18.1 payments

Suggested fields:

```text
id
payment_reference
booking_id
booking_reference
client_name
client_email
event_title
event_type
event_date
package_id
package_name
total_package_price
payment_type
payment_status
amount_paid
total_paid
remaining_balance
payment_method
payment_date
due_date
proof_url
proof_file_name
proof_file_type
proof_uploaded_by
proof_uploaded_at
verification_status
verified_by
verified_at
notes
source
created_by
updated_by
created_at
updated_at
```

### 18.2 payment_history

Suggested fields:

```text
id
payment_id
booking_id
action
old_status
new_status
old_amount
new_amount
old_balance
new_balance
proof_url
performed_by
notes
created_at
```

### 18.3 payment_milestones

Suggested fields:

```text
id
payment_id
booking_id
milestone_name
amount_required
amount_paid
due_date
status
created_at
updated_at
```

Recommended milestone status:

```text
pending
for_verification
paid
overdue
rejected
```

---

## 19. API Endpoint Plan

### Payment Data

```text
GET /api/payments/summary
GET /api/payments
GET /api/payments/:id
GET /api/payments/booking/:bookingId
```

### Payment Actions

```text
POST /api/payments
PATCH /api/payments/:id
POST /api/payments/:id/add-payment
PATCH /api/payments/:id/status
POST /api/payments/:id/upload-proof
PATCH /api/payments/:id/verify
PATCH /api/payments/:id/reject
```

### Payment Reports

```text
GET /api/payments/revenue/monthly
GET /api/payments/overdue
GET /api/payments/pending
GET /api/payments/history
```

---

## 20. File Storage Plan

Payment proof files should be stored in:

```text
Supabase Storage
```

Recommended bucket:

```text
payment-proofs
```

Recommended file path:

```text
payment-proofs/{booking_reference}/{payment_reference}/{filename}
```

Strict rule:

```text
Do not store raw proof images directly in the database.
Store the file in storage and save only the file URL/path in the database.
```

---

## 21. Integration With Other Pages

### Booking Management

When payment status changes:

- Update booking payment summary
- Update booking timeline
- Show payment progress in booking details

### Contract Management

Use payment data for:

- Total contract amount
- Payment history
- Remaining balance
- Total paid
- Acknowledgment receipt details

### Dashboard

Show:

- Revenue this month
- Pending payments
- Overdue payments
- Payment due soon
- For verification payments

### Calendar

Show:

- Payment due dates
- Overdue payment reminders
- Final payment deadlines

### Reports & Analytics

Use payment data for:

- Monthly revenue
- Collection trend
- Pending balance
- Overdue rate
- Package revenue performance

### Notifications

Create notifications for:

- Payment due soon
- Payment overdue
- Payment for verification
- Payment verified
- Payment rejected

### System Logs

Create audit logs for:

- Payment created
- Payment edited
- Proof uploaded
- Payment verified
- Payment rejected
- Payment marked overdue
- Manual override used

---

## 22. UI and UX Requirements

Follow the current Zion admin design:

- Warm cream background
- Gold accent
- Premium card layout
- Rounded corners
- Soft shadows
- Clean typography
- Clear status badges
- Responsive table
- Horizontal scroll for large tables
- Clear empty states
- Clear loading states
- Clear error states

Recommended badge styles:

| Status | Style |
|---|---|
| Unpaid | Red |
| For Verification | Amber |
| Down Payment Paid | Blue |
| Partially Paid | Purple |
| Fully Paid | Green |
| Overdue | Red / Critical |
| Rejected | Gray / Red |
| Refunded | Gray |
| Cancelled | Gray |

---

## 23. Empty, Loading, and Error States

### Empty State

```text
No active payments yet.
Payment records will appear here once a client booking is created.
```

### Loading State

Use skeleton cards and skeleton table rows.

### Error State

```text
Unable to load payment records.
Please check your connection or try again.
```

---

## 24. Role-Based Access

### Super Admin

Can:

- View all payment records
- Add payment records
- Edit payment records
- Verify payments
- Reject payments
- Override payment status
- View all proof images
- Export payment records

### Admin

Can:

- View payment records
- Add payment proof
- Update assigned booking payments
- Mark payment for verification
- Edit limited fields
- View related booking and contract

### Restricted

Admins should not be able to:

- Delete payment history
- Remove verified proof without Super Admin approval
- Override fully paid status without reason
- Count unverified payments as revenue

---

## 25. Testing Plan

Test the following:

1. Booking creates payment summary.
2. Admin adds down payment with proof image.
3. System subtracts down payment from package price.
4. System calculates remaining balance correctly.
5. System blocks save when proof image is missing.
6. Admin updates payment status to For Verification.
7. Super Admin verifies payment.
8. Verified payment appears in monthly revenue.
9. Overdue payment is detected after due date.
10. Dashboard shows pending and overdue payments.
11. Contract Management receives updated payment history.
12. Calendar shows payment due dates.
13. Reports & Analytics updates revenue and payment metrics.
14. System Logs records all payment actions.
15. Payment proof can be viewed after saving.

---

## 26. Implementation Phases

### Phase 1: Review Existing Page

- Review current Payment & History page structure.
- Identify static payment data.
- Preserve reusable layout and styling.
- Remove fake payment rows.

### Phase 2: Data Model and API

- Prepare payments table.
- Prepare payment_history table.
- Prepare payment_milestones table.
- Add payment API endpoints.
- Add proof upload support.

### Phase 3: Payment Table and Filters

- Build active payments table.
- Add filters.
- Add status badges.
- Add payment progress column.
- Add due date and overdue indicators.

### Phase 4: Manual Payment Input

- Add payment modal/drawer.
- Add payment proof upload.
- Add strict proof validation.
- Add automatic balance calculation.
- Add payment history tracking.

### Phase 5: Page Integrations

- Sync payment summary to Booking Management.
- Sync payment data to Contract Management.
- Sync due dates to Calendar.
- Sync alerts to Notifications.
- Sync revenue data to Dashboard and Reports.

### Phase 6: Testing and Polish

- Test all calculations.
- Test proof upload requirement.
- Test status changes.
- Test overdue detection.
- Test responsive UI.
- Polish spacing, badges, and empty states.

---

## 27. Final Acceptance Criteria

The Payment & History page is complete if:

1. It shows active bookings with payment obligations.
2. It displays monthly revenue based only on verified payments.
3. It shows pending, overdue, down payment, partial, and fully paid records.
4. Admin can manually add payment records.
5. Admin can edit existing payment records.
6. Down payment automatically subtracts from package price.
7. Remaining balance is calculated correctly.
8. Payment progress/milestones are visible.
9. Payment deadlines are enforced.
10. Overdue records are detected.
11. Proof image is required before saving payment changes.
12. Records sync to Booking Management, Contract Management, Dashboard, Calendar, Reports, Notifications, and System Logs.
13. No online payment gateway is included.
14. The page improves business monitoring even with in-person payments only.

---

## 28. Final Rule

The Payment & History page must not act as an online payment processor.

It must act as a powerful internal payment monitoring, verification, and history module for in-person payments.

Its main value is to help Zion Events Place clearly track:

```text
Who has paid?
How much was paid?
How much is still unpaid?
When is the deadline?
Which payments are overdue?
Which payments are verified?
How much did Zion earn this month?
```

This makes the page useful, practical, and aligned with the real workflow of the business.
