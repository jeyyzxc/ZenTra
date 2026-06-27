# Temporary Client-to-Admin Demo Bridge Plan  
## Zion Events Place and Management System

---

## 1. Purpose

This plan defines a temporary implementation for connecting the **Client Panel** to the **Admin Panel** while the real **n8n automation/orchestration** is not yet available.

The goal is to make the system presentation-ready by showing that a client booking can flow into the admin-side modules smoothly.

This is not a permanent production workflow. It must be easy to disable or remove after the presentation.

---

## 2. Main Objective

When a client completes the booking process and clicks:

```text
Book This Package
```

the booking should automatically feed into the admin panel and appear in:

- Admin Dashboard
- Booking Management
- Contract Management
- Payment & History
- Calendar
- Reports & Analytics
- Notifications
- System Logs

The submitted booking must be visible, editable, and manageable by the admin or super admin.

---

## 3. Temporary Feature Name

Use a temporary isolated feature called:

```text
Demo Client-to-Admin Bridge
```

Recommended feature flag:

```env
DEMO_CLIENT_ADMIN_BRIDGE=true
```

Recommended folders:

```text
/src/demo-bridge
/backend/demo-bridge
/scripts/demo
```

Strict rule:

```text
Do not scatter temporary code across the system. Keep all temporary bridge logic isolated and easy to remove.
```

---

## 4. Easy Removal Using One Command

Create commands for enabling, disabling, and cleaning the demo bridge.

Recommended scripts:

```json
{
  "scripts": {
    "demo:on": "node scripts/demo/enable-demo-bridge.js",
    "demo:off": "node scripts/demo/disable-demo-bridge.js",
    "demo:cleanup": "node scripts/demo/cleanup-demo-data.js"
  }
}
```

After the presentation, run:

```bash
npm run demo:off
```

Optional cleanup:

```bash
npm run demo:cleanup
```

The `demo:off` command should:

1. Disable the temporary feature flag.
2. Stop the client booking form from using the temporary bridge.
3. Disable temporary demo bridge routes or handlers.
4. Keep all normal system pages intact.
5. Prepare the system for future n8n integration.

---

## 5. Remove Existing Seed and Static Data

Before enabling the temporary bridge, remove or disable all static and seeded demo data from:

- Booking Management
- Contract Management
- Calendar
- Notifications

Remove:

- Seeded bookings
- Static contract records
- Static calendar events
- Fake notifications
- Fake booking-related dashboard cards
- Fake upcoming events
- Fake booking-related agenda items

Keep:

- Admin accounts
- Team accounts
- Roles and permissions
- Packages and services
- Contract template structure
- System settings
- Required reference data

Strict rule:

```text
The presentation data should come from personally created client booking submissions, not from old seed data.
```

---

## 6. Temporary Booking Flow

### Client-Side Flow

```text
Client clicks Book Now
        ↓
Client selects or reviews package
        ↓
Client completes booking steps
        ↓
Client clicks Book This Package
        ↓
Demo Bridge receives booking data
        ↓
Admin-side records are created
        ↓
Client sees booking success message
```

The client must not be redirected to the admin panel.

Client success message:

```text
Your booking request has been submitted successfully. Please wait for confirmation from Zion Events Place.
```

---

## 7. Temporary Backend Endpoint

Create one temporary endpoint:

```text
POST /api/demo-bridge/client-booking-submit
```

This endpoint should act as the temporary replacement for n8n orchestration.

### Processing Pipeline

```text
Receive booking payload
        ↓
Validate required fields
        ↓
Generate booking reference
        ↓
Create booking record
        ↓
Create payment summary
        ↓
Create draft contract
        ↓
Create calendar event
        ↓
Create admin notification
        ↓
Create audit logs
        ↓
Update dashboard and reports through real data queries
        ↓
Return success response
```

---

## 8. Required Data Created From One Booking

One successful client booking submission should create connected records across the admin system.

### 8.1 Booking Management

Create a real booking record with:

- Booking reference
- Client name
- Client email
- Client contact number
- Event type
- Event title
- Event date
- Start time
- End time
- Total pax
- Package selected
- Theme
- Colors
- Special requests
- Booking status
- Payment status
- Source

Default values:

```text
booking_status = pending
payment_status = unpaid or reservation_pending
source = client_panel_demo_bridge
sync_status = synced
automation_status = demo_mode
```

---

### 8.2 Contract Management

Create a draft contract linked to the booking.

Default values:

```text
contract_status = draft
email_status = not_sent
workflow_status = demo_mode
signature_status = unsigned
source = client_panel_demo_bridge
```

The contract should be visible in Contract Management and editable by the admin.

If contract PDF generation is not ready, show a draft preview using the booking and package data.

---

### 8.3 Payment & History

Create an initial payment summary or payment record.

Default values:

```text
payment_status = unpaid or pending
amount_paid = 0
remaining_balance = total_contract_amount
payment_source = client_panel_demo_bridge
```

Payment Management remains the source of truth for payment records.

---

### 8.4 Calendar

Create a calendar event using the submitted booking details.

Required fields:

- Event title
- Client name
- Event type
- Event date
- Start time
- End time
- Booking reference
- Status

Default status:

```text
pending_booking
```

---

### 8.5 Notifications

Create an unread admin notification.

Example:

```text
New booking request submitted by [Client Name].
```

Notification fields:

- Title
- Message
- Type = booking
- Priority
- Related module = booking
- Related record ID
- Read status = unread
- Source = client_panel_demo_bridge

---

### 8.6 System Logs

Create audit log entries for:

- Client booking submitted
- Booking record created
- Draft contract created
- Payment summary created
- Calendar event created
- Admin notification created

Each log should include:

- Source
- Action
- Module
- Description
- Status
- Timestamp
- IP address if available

---

### 8.7 Dashboard

The dashboard should automatically reflect the new booking through real queries.

Update:

- Total bookings
- Pending bookings
- Upcoming events
- Needs Action
- Calendar
- Smart assistant summary
- Recent activity
- Notification count

No dashboard value should remain hardcoded for booking-related data.

---

### 8.8 Reports & Analytics

Reports should calculate from real records.

Update:

- Booking count
- Pending booking count
- Event type distribution
- Package popularity
- Revenue forecast
- Payment pending summary

No static chart values for booking-related analytics.

---

## 9. Admin Control Requirement

Every booking submitted from the Client Panel must be controllable from the Admin Panel.

Admin must be able to:

- View booking details
- Edit booking details
- Update booking status
- Assign coordinator
- View draft contract
- Edit allowed contract fields
- Download contract if available
- Update payment record
- View calendar event
- Mark notification as read
- View system logs connected to the booking

Strict rule:

```text
If a client submits a booking, the admin must be able to manage it from the admin panel without touching the database manually.
```

---

## 10. Duplicate Prevention

Prevent duplicate bookings during presentation.

Recommended rule:

```text
If the same client email, event date, event time, and package are submitted twice in the same session, do not create duplicate records.
```

Recommended implementation:

- Generate a `demo_bridge_id`.
- Store the same `demo_bridge_id` across booking, contract, payment, calendar event, notification, and logs.
- Use `booking_reference` as the visible identifier.
- Use `demo_bridge_id` internally for tracing and cleanup.

---

## 11. Required Button Behavior

### Client Panel

| Button | Required Behavior |
|---|---|
| Book Now | Opens or starts the booking process |
| Next Step | Moves to the next booking step after validation |
| Back | Returns to the previous step |
| Book This Package | Submits booking to the Demo Bridge |
| Cancel | Cancels the current booking process |
| View Package | Shows package details |

### Admin Dashboard

| Button | Required Behavior |
|---|---|
| Refresh | Reloads dashboard data |
| View Booking | Opens related booking |
| View All | Redirects to correct module |
| Acknowledge | Marks alert or task as acknowledged |

### Booking Management

| Button | Required Behavior |
|---|---|
| View | Opens booking details |
| Edit | Allows admin to edit booking |
| Update Status | Changes booking status with validation |
| Save | Persists changes |
| Cancel Booking | Updates status to cancelled |
| Generate Contract | Creates or opens draft contract |

### Contract Management

| Button | Required Behavior |
|---|---|
| Preview | Shows generated or draft contract |
| Edit | Allows editing of dynamic fields only |
| Download | Downloads contract if available |
| Send | Simulates or triggers send action |
| Resend | Works as fallback if delivery fails |
| View Logs | Opens related System Logs |

### Payment & History

| Button | Required Behavior |
|---|---|
| View Payment | Opens payment details |
| Edit Payment | Allows authorized update |
| Save Payment | Updates payment record |
| Mark as Paid | Updates payment status |
| View Related Booking | Opens booking record |

### Calendar

| Button | Required Behavior |
|---|---|
| View Event | Opens related booking |
| Edit Schedule | Redirects or opens schedule edit |
| Today | Goes to current date |
| Month Navigation | Shows correct month data |

### Notifications

| Button | Required Behavior |
|---|---|
| Mark as Read | Updates notification status |
| View Related Record | Opens the related module record |
| Clear | Clears or archives notification if allowed |

### System Logs

| Button | Required Behavior |
|---|---|
| View Details | Opens log details |
| Refresh | Reloads logs |
| Export | Exports current logs if implemented |

---

## 12. Demo Contract Behavior Without n8n

Since n8n is not available yet, Contract Management should work in demo mode.

Demo flow:

```text
Client submits booking
        ↓
Demo Bridge creates draft contract
        ↓
Admin opens Contract Management
        ↓
Admin previews contract
        ↓
Admin edits allowed dynamic fields if needed
        ↓
Admin downloads contract or simulates send
```

If real email sending is not ready, Send and Resend should use placeholder behavior:

```text
Admin clicks Send or Resend
        ↓
Show loading state
        ↓
Create email log record
        ↓
Set email_status = sent_demo or pending_demo
        ↓
Create audit log
        ↓
Show success toast
```

Strict rule:

```text
Demo send status must be clearly marked internally and must not be treated as real production email delivery.
```

---

## 13. Page-Level Data Rules

### Dashboard

Must read from:

- bookings
- payments
- contracts
- calendar_events
- notifications
- audit_logs

### Booking Management

Must show actual database records only.

### Contract Management

Must show actual contracts created from submitted bookings.

### Payment & History

Must show payment records connected to submitted bookings.

### Calendar

Must show actual booking-related calendar events.

### Notifications

Must show actual generated notifications.

### Reports & Analytics

Must calculate from actual records.

### System Logs

Must show actual system actions created during demo use.

---

## 14. Testing Pipeline Before Presentation

### Test 1: Clean Data

1. Run cleanup script.
2. Confirm Booking Management has no seeded booking data.
3. Confirm Contract Management has no seeded contract data.
4. Confirm Calendar has no fake booking events.
5. Confirm Notifications has no fake booking notifications.

### Test 2: Submit Booking From Client Panel

1. Open Client Panel.
2. Click Book Now.
3. Complete booking steps.
4. Click Book This Package.
5. Confirm success message appears.
6. Note the generated booking reference.

### Test 3: Verify Admin Dashboard

1. Open Admin Dashboard.
2. Confirm pending booking count increased.
3. Confirm upcoming events updated.
4. Confirm Needs Action detects the new booking.
5. Confirm notification bell shows a new alert.

### Test 4: Verify Booking Management

1. Open Booking Management.
2. Confirm submitted booking appears.
3. Open booking details.
4. Edit one field.
5. Save changes.
6. Refresh page.
7. Confirm changes persisted.

### Test 5: Verify Contract Management

1. Open Contract Management.
2. Confirm draft contract exists.
3. Preview contract.
4. Edit allowed dynamic fields.
5. Save.
6. Download or simulate send.
7. Confirm email/log status updates.

### Test 6: Verify Payment & History

1. Open Payment & History.
2. Confirm payment summary exists.
3. Update payment status if allowed.
4. Confirm related booking payment summary updates.

### Test 7: Verify Calendar

1. Open Calendar.
2. Confirm event date appears.
3. Click the event.
4. Confirm it opens or links to the related booking.

### Test 8: Verify Notifications and Logs

1. Open Notifications.
2. Confirm new booking notification exists.
3. Mark notification as read.
4. Open System Logs.
5. Confirm demo bridge actions are recorded.

---

## 15. Implementation Phases

### Phase 1: Cleanup

- Remove seed data from Booking Management.
- Remove seed data from Contract Management.
- Remove seed data from Calendar.
- Remove seed data from Notifications.
- Keep admin, roles, packages, services, templates, and settings.

### Phase 2: Create Demo Bridge

- Add feature flag.
- Add demo bridge endpoint.
- Add demo bridge service.
- Add disable and cleanup scripts.
- Keep temporary logic isolated.

### Phase 3: Connect Client Panel

- Connect Book Now to booking steps.
- Connect Book This Package to demo bridge endpoint.
- Validate required booking fields.
- Prevent duplicate submissions.
- Show success message.

### Phase 4: Feed Admin Modules

- Create booking record.
- Create draft contract record.
- Create payment summary.
- Create calendar event.
- Create notification.
- Create audit logs.
- Update dashboard and reports through real data.

### Phase 5: Make Admin Pages Real

- Replace static data with API/database data.
- Ensure buttons work based on their function.
- Add loading states.
- Add empty states.
- Add error states.
- Ensure records persist after refresh.

### Phase 6: Presentation Testing

- Submit test booking.
- Confirm it appears in all required admin pages.
- Edit booking from admin side.
- Preview or download contract.
- Simulate send or resend.
- Confirm dashboard and reports update correctly.

### Phase 7: Disable After Presentation

- Run `npm run demo:off`.
- Optional: run `npm run demo:cleanup`.
- Confirm temporary bridge is disabled.
- Prepare system for real n8n orchestration.

---

## 16. Final Acceptance Criteria

The temporary implementation is successful if:

1. The client can complete the booking process.
2. Clicking **Book This Package** creates real admin-side records.
3. The booking appears in Booking Management.
4. The booking affects the Dashboard.
5. A draft contract appears in Contract Management.
6. A payment summary appears in Payment & History.
7. A calendar event appears in Calendar.
8. A notification appears in Notifications.
9. Related actions appear in System Logs.
10. Reports & Analytics calculate from real submitted data.
11. Admin can view and edit the submitted booking.
12. Buttons work according to their intended functions.
13. Old seed data no longer appears.
14. The demo bridge can be disabled using one command.
15. The system can later connect to real n8n orchestration without major rewriting.

---

## 17. Final Rule

This temporary bridge exists only for the presentation.

It should simulate the early behavior of the future n8n orchestration by feeding client bookings into the admin panel, but it must remain isolated, removable, and clearly marked as temporary.

Temporary demo architecture:

```text
Client Panel
        ↓
Backend Demo Bridge
        ↓
Admin Panel Modules
```

Future production architecture:

```text
Client Panel
        ↓
Backend API
        ↓
n8n Orchestration
        ↓
Backend Callback
        ↓
Admin Panel Modules
```
