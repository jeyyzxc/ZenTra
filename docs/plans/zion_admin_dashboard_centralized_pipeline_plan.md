# Admin Dashboard Centralized Data Pipeline and Implementation Plan  
## Zion Events Place and Management System

---

## 1. Purpose of This Document

This document provides a concrete, well-structured, and implementation-ready plan for improving the **Admin Dashboard** of the Zion Events Place and Management System.

The current dashboard already has a strong visual foundation, including:

- Dashboard page header
- Smart assistant card
- Revenue and booking trends chart
- Schedule calendar
- Today's agenda
- Upcoming events
- Needs Action section
- Admin sidebar navigation
- Top search bar and notification area

However, most of the displayed data is currently static. The goal is to transform the dashboard into a **real, centralized, accurate, and business-focused command center** that automatically pulls live data from the system modules.

The dashboard should become the one-stop view for important business information, urgent actions, upcoming events, booking activity, payment updates, contract status, inquiry status, calendar data, and workflow alerts.

---

## 2. Dashboard Vision

The Admin Dashboard should act as the **central operational hub** of the system.

It should answer these questions immediately:

1. What is happening in the business today?
2. What happened recently?
3. What needs urgent action?
4. What events are upcoming?
5. What bookings are pending, confirmed, or at risk?
6. What payments are due, failed, or completed?
7. What contracts need review, sending, or signing?
8. What inquiries are still unanswered?
9. What automated workflows succeeded or failed?
10. What should the admin focus on next?

The dashboard should not be a static landing page. It should be a real-time or near-real-time business monitoring screen.

---

## 3. Important Design Observation Based on Current Dashboard

Based on the current dashboard screenshots, the design already has a premium and elegant direction.

### Existing UI Strengths

- Clean warm cream background
- Premium gold accent
- Elegant serif headings
- Modern card layout
- Well-spaced sidebar
- Strong admin panel identity
- Smart assistant card already fits the business style
- Right-side productivity column is useful
- Needs Action section is practical and business-relevant

### Current Issues to Fix

| Issue | Required Improvement |
|---|---|
| Static data | Replace with live database-driven data |
| Dashboard cards are disconnected | Connect each widget to actual system modules |
| Smart assistant is static | Generate dynamic summaries from real data |
| Search placeholder changes randomly | Make dashboard search context-aware |
| Needs Action is not connected to system events | Generate from bookings, payments, contracts, inquiries, email logs, and workflow logs |
| Agenda is static | Pull from tasks, calendar, bookings, and admin-created reminders |
| Revenue chart is static | Pull from verified payment data |
| Upcoming events are static | Pull from Booking Management and Calendar |
| Calendar is static | Pull actual event dates, ocular visits, reservations, and schedules |

---

## 4. Dashboard Data Sources

The dashboard should pull data from the existing system modules.

| Dashboard Data | Source Module / Table |
|---|---|
| Revenue data | Payment Management / payments table |
| Booking counts | Booking Management / bookings table |
| Upcoming events | Booking Management and Calendar |
| Event schedule | Calendar and bookings |
| Today's agenda | Tasks, calendar entries, admin reminders, booking deadlines |
| Needs Action | Bookings, payments, contracts, inquiries, email logs, n8n logs |
| Smart assistant summary | Aggregated dashboard API data |
| Failed emails | System Logs / email_logs table |
| Workflow failures | n8n_workflow_logs table |
| Unanswered inquiries | Inquiries module |
| Contract status | Contract Management |
| Admin notifications | notifications table |
| Audit activity | System Logs / audit_logs table |

---

## 5. Core Dashboard Architecture

### 5.1 Recommended Flow

```text
System Modules
(Bookings, Payments, Contracts, Inquiries, Calendar, Logs)
        ↓
Backend Dashboard Aggregation Service
        ↓
Dashboard API Endpoints
        ↓
Frontend Dashboard Widgets
        ↓
Smart Assistant Summary
```

### 5.2 With n8n Orchestration

```text
Booking / Payment / Contract / Inquiry Event
        ↓
Backend Validates Event
        ↓
n8n Workflow Triggered
        ↓
n8n Sends Email / Reminder / Notification
        ↓
n8n Sends Result Back to Backend
        ↓
Backend Updates Supabase Tables
        ↓
Dashboard Reads Updated Data
        ↓
Admin Sees Accurate Status
```

---

## 6. Dashboard Must Be Read-Optimized

The dashboard should mostly be a **read and action overview page**.

It should not duplicate the full CRUD features of other modules.

### Correct Behavior

| Action | Where It Should Happen |
|---|---|
| Full booking editing | Booking Management |
| Full payment management | Payment & History |
| Full contract editing | Contract Management |
| Full inquiry handling | Inquiries |
| Full email log review | System Logs |
| Full team CRUD | Team Management |
| Dashboard quick actions | Dashboard only redirects or triggers safe actions |

The dashboard may show buttons like:

- View Booking
- Review Contract
- Resolve Failed Email
- Open Payment Record
- Acknowledge Alert
- View Inquiry
- Add Agenda
- Extend Hold
- Release Date

However, major updates should still redirect to the correct module.

---

## 7. Main Dashboard Sections

The dashboard should include the following major sections:

1. Page Header
2. Business Snapshot Cards
3. Smart Assistant Summary
4. Revenue and Booking Trends Chart
5. Needs Action Panel
6. Schedule Calendar
7. Today's Agenda
8. Upcoming Events
9. Recent Activity
10. Workflow and Email Health Indicator

---

# 8. Page Header

## 8.1 Current UI

The current header shows:

- Date
- Dashboard title
- Subtitle
- Top search bar
- Notification icon
- Admin profile

## 8.2 Required Dynamic Behavior

The date should be generated dynamically based on the current date.

Example:

```text
MONDAY, JUNE 22, 2026
```

Page title:

```text
Dashboard
```

Subtitle:

```text
Track event progress, business activity, bookings, payments, and upcoming schedules.
```

## 8.3 Search Bar

The search placeholder should be dashboard-specific.

Recommended placeholder:

```text
Search bookings, payments, contracts, inquiries...
```

Search should support global dashboard search across:

- Booking reference
- Client name
- Payment reference
- Contract ID
- Inquiry sender
- Event title
- Email log subject
- Admin task title

---

# 9. Business Snapshot Cards

Add summary cards near the top of the dashboard or below the page header.

## 9.1 Required Cards

| Card | Description | Source |
|---|---|---|
| Total Bookings | Total number of bookings in selected period | bookings |
| Confirmed Events | Confirmed upcoming events | bookings |
| Pending Bookings | Bookings waiting for confirmation | bookings |
| Revenue This Month | Verified revenue for current month | payments |
| Pending Payments | Unpaid or partially paid records | payments |
| Contracts Pending | Contracts needing review, sending, or signing | contracts |
| Unanswered Inquiries | Inquiries not yet replied to | inquiries |
| Needs Action | Total urgent alerts | aggregated |

## 9.2 Card Rules

- Cards must use real data from the backend.
- Cards must show loading states.
- Cards must show zero values correctly.
- Cards must not use fake hardcoded numbers.
- Cards should be clickable when useful.
- Clicking a card should redirect to the related module with filters applied.

Example:

```text
Pending Payments → Payment & History page filtered by pending status
Unanswered Inquiries → Inquiries page filtered by unanswered
Contracts Pending → Contract Management filtered by pending
```

---

# 10. Smart Assistant Summary

## 10.1 Purpose

The Smart Assistant should become one of the most valuable dashboard features.

It should summarize:

- What happened earlier
- What happened recently
- What needs attention
- What events are upcoming
- What workflows or emails failed
- What the admin should prioritize

The assistant should feel helpful, professional, and friendly.

## 10.2 Assistant Name

Current assistant name:

```text
Zeni
```

This is good and can be kept.

Recommended label:

```text
Your Smart Assistant
```

## 10.3 Data Sources for Smart Assistant

The assistant should use summarized data from:

- Bookings
- Payments
- Contracts
- Inquiries
- Calendar
- Email Logs
- Audit Logs
- n8n Workflow Logs
- Notifications
- Tasks / Agenda

## 10.4 Assistant Summary Structure

The assistant should generate a daily operational summary using this structure:

```text
Good morning, [Admin Name].

Here is your business summary for today:

1. [Number] bookings need attention.
2. [Number] payments are due or pending.
3. [Number] contracts are awaiting action.
4. [Number] inquiries are unanswered.
5. [Number] events are scheduled today.
6. [Number] workflow or email issues were detected.

Recommended priority:
[Specific action the admin should do first.]
```

## 10.5 Assistant Time-Based Summary

The assistant should support different time windows:

| Time Window | Meaning |
|---|---|
| Today | All important activity for the current day |
| A while ago | Recent activity within the last few minutes or hours |
| Previous activity | Activity from yesterday or previous days |
| Upcoming | Events, payments, contracts, and schedules coming soon |

## 10.6 Assistant Should Not Invent Data

Strict rule:

```text
The assistant must only summarize available system data.
If no data exists, it must say that there is no recorded activity yet.
```

Do not let the assistant create fake client names, fake revenue, fake bookings, or fake warnings.

## 10.7 Recommended Backend Endpoint

```text
GET /api/dashboard/assistant-summary
```

Expected response:

```json
{
  "greeting": "Good morning, Jeyy!",
  "summary": [
    {
      "type": "inquiry",
      "message": "You have 3 unanswered inquiries."
    },
    {
      "type": "payment",
      "message": "There are 2 downpayments expiring soon."
    },
    {
      "type": "event",
      "message": "Sarah's 18th Debut is scheduled today at 2:00 PM."
    }
  ],
  "priority_action": "Review unanswered inquiries first.",
  "generated_at": "2026-06-22T09:47:00"
}
```

## 10.8 AI Enhancement Rule

If AI is used to improve the wording, the backend should first generate a deterministic summary from real data.

Then AI may only rewrite the wording.

Correct flow:

```text
Database Facts
→ Backend Deterministic Summary
→ Optional AI Wording Enhancement
→ Dashboard Assistant Output
```

Wrong flow:

```text
AI directly guesses dashboard data
```

---

# 11. Revenue and Booking Trends Chart

## 11.1 Purpose

This chart should show real business trends.

Current chart:

```text
Revenue & Booking Trends
```

This is good and should be kept.

## 11.2 Data Source

| Metric | Source |
|---|---|
| Revenue | Verified payments |
| Bookings | Booking records |
| Month labels | Current selected date range |
| Event count | Booking status counts |

## 11.3 Recommended Chart Options

The chart should support:

- Monthly revenue
- Monthly confirmed bookings
- Monthly pending bookings
- Monthly completed events
- Payment collection trend

## 11.4 Default Chart

Default view:

```text
Revenue and Confirmed Bookings per Month
```

## 11.5 Filters

Add a small date range filter or dropdown:

- Last 7 days
- This month
- Last 3 months
- Last 6 months
- This year
- Custom range

## 11.6 Backend Endpoint

```text
GET /api/dashboard/trends?range=this_year
```

Expected response:

```json
{
  "range": "this_year",
  "labels": ["Jan", "Feb", "Mar", "Apr"],
  "revenue": [120000, 150000, 90000, 210000],
  "confirmed_bookings": [4, 6, 3, 8],
  "pending_bookings": [2, 1, 4, 2]
}
```

## 11.7 Strict Calculation Rules

- Revenue should only count verified or completed payments.
- Failed, refunded, and cancelled payments should not count as revenue.
- Cancelled bookings should not count as confirmed bookings.
- Declined bookings should not count as confirmed bookings.
- Pending bookings should be counted separately.

---

# 12. Needs Action Panel

## 12.1 Purpose

The Needs Action panel should show urgent business items that require admin attention.

Current examples:

- Booking nearing expiration
- Email delivery failed
- Ocular visit today

These are good and should become dynamic.

## 12.2 Data Sources

Needs Action should be generated from:

- Pending bookings
- Expiring reservations
- Unpaid/downpayment deadlines
- Failed email logs
- Failed n8n workflows
- Schedule conflicts
- Unanswered inquiries
- Contracts pending review
- Contracts not sent
- Contracts not signed
- Ocular visits today
- Upcoming events without assigned coordinator

## 12.3 Priority Levels

Each item should have a priority level.

| Priority | Meaning |
|---|---|
| Critical | Immediate action required |
| High | Needs action today |
| Medium | Should be reviewed soon |
| Low | Informational |

## 12.4 Recommended Needs Action Types

| Action Type | Trigger Condition |
|---|---|
| Booking Nearing Expiration | Reservation hold expires within 24 hours |
| Payment Due Soon | Payment due within 3 days |
| Payment Overdue | Payment due date already passed |
| Failed Email | email_logs.status = failed or bounced |
| Workflow Failed | n8n_workflow_logs.status = failed |
| Schedule Conflict | booking sync_status = conflict_detected |
| Contract Pending Review | contract status = pending_review |
| Contract Not Sent | contract ready but no delivery email sent |
| Inquiry Unanswered | inquiry status = unanswered |
| Ocular Visit Today | calendar event type = ocular_visit and date = today |
| Event Without Coordinator | upcoming event has no assigned coordinator |

## 12.5 Needs Action Buttons

Each item should show relevant action buttons.

Examples:

| Item | Button |
|---|---|
| Booking nearing expiration | Extend Hold / Release Date |
| Email delivery failed | Resolve Fallback / View Email Log |
| Ocular visit today | Acknowledge / View Event |
| Payment overdue | View Payment / Send Reminder |
| Contract pending | Review Contract |
| Workflow failed | View Workflow Log |
| Inquiry unanswered | Reply Now |

## 12.6 Backend Endpoint

```text
GET /api/dashboard/needs-action
```

Expected response:

```json
[
  {
    "id": "act_001",
    "type": "payment_due",
    "priority": "high",
    "title": "Payment Due Soon",
    "description": "Alice & Bob Wedding has a downpayment due in 2 days.",
    "related_module": "payments",
    "related_record_id": "pay_001",
    "primary_action": "View Payment",
    "secondary_action": "Send Reminder",
    "created_at": "2026-06-22T09:47:00"
  }
]
```

---

# 13. Schedule Calendar

## 13.1 Purpose

The calendar should show the admin what is scheduled on each date.

## 13.2 Data Sources

Calendar should pull from:

- Bookings
- Ocular visits
- Contract deadlines
- Payment due dates
- Admin-created tasks
- Event schedules

## 13.3 Calendar Event Types

| Event Type | Source |
|---|---|
| Event booking | bookings |
| Ocular visit | calendar or bookings |
| Payment due date | payments |
| Contract signing deadline | contracts |
| Admin task | tasks |
| Follow-up reminder | inquiries / tasks |

## 13.4 Visual Indicators

Dates should show indicators when there are events.

Recommended markers:

- Gold dot for events
- Red dot for urgent due dates
- Blue dot for tasks
- Green dot for confirmed bookings
- Orange dot for payment deadlines

## 13.5 Click Behavior

When an admin clicks a date:

Show a small list of items for that date:

- Booked events
- Ocular visits
- Payment deadlines
- Contract deadlines
- Tasks
- Follow-ups

Each item should have a link to the related module.

## 13.6 Backend Endpoint

```text
GET /api/dashboard/calendar?month=2026-06
```

Expected response:

```json
{
  "month": "2026-06",
  "items": [
    {
      "date": "2026-06-22",
      "type": "event",
      "title": "Sarah's 18th Debut",
      "time": "2:00 PM",
      "related_module": "bookings",
      "related_record_id": "bkg_001",
      "status": "confirmed"
    }
  ]
}
```

---

# 14. Today's Agenda

## 14.1 Purpose

Today's Agenda should help admins know what must be done today.

Current examples:

- Finalize catering menu with Chef
- Review floral arrangement mockup
- Approve new lighting vendor contract

These should become real tasks.

## 14.2 Data Sources

Today's Agenda should pull from:

- Admin-created tasks
- Booking deadlines
- Payment reminders
- Contract tasks
- Calendar events
- Follow-up reminders
- n8n-generated tasks

## 14.3 Agenda Table / List Fields

Each agenda item should have:

- Task title
- Time
- Related module
- Related record
- Priority
- Completion status
- Assigned admin
- Created source

## 14.4 Agenda Item Sources

| Source | Example |
|---|---|
| Manual admin task | Finalize catering menu |
| Booking system | Confirm event setup |
| Payment management | Follow up unpaid downpayment |
| Contract management | Review vendor contract |
| n8n workflow | Auto-created follow-up task |
| Inquiry module | Reply to pending inquiry |

## 14.5 Add Agenda Button

The existing `Add` button should open a modal.

Form fields:

- Task title
- Description
- Date
- Time
- Priority
- Assigned admin
- Related module
- Related record
- Reminder option

## 14.6 Complete Task Behavior

Agenda items should have a checkbox.

When checked:

- Mark task as completed
- Save completed timestamp
- Save completed_by admin
- Add audit log entry
- Update dashboard count

## 14.7 Backend Endpoints

```text
GET /api/dashboard/agenda?date=today
POST /api/dashboard/agenda
PATCH /api/dashboard/agenda/:id/complete
PATCH /api/dashboard/agenda/:id
DELETE /api/dashboard/agenda/:id
```

---

# 15. Upcoming Events

## 15.1 Purpose

Upcoming Events should show confirmed or pending upcoming event bookings.

## 15.2 Data Source

Main source:

```text
bookings table
```

## 15.3 Default Rules

Show events within the next 30 days.

Include:

- Event title
- Event date
- Event type
- Client name
- Status badge
- Assigned coordinator
- Payment status

## 15.4 Status Rules

Display statuses:

- Confirmed
- Pending
- Rescheduled
- In Progress

Do not show:

- Cancelled events
- Declined bookings
- Completed events unless date is today

## 15.5 View All Button

The `View All` button should redirect to Booking Management filtered by upcoming events.

## 15.6 Backend Endpoint

```text
GET /api/dashboard/upcoming-events?limit=5
```

---

# 16. Recent Activity

## 16.1 Purpose

Add a Recent Activity section if space allows.

It should show important system actions from audit logs.

Examples:

- Admin updated booking status
- Payment was verified
- Contract was sent
- Inquiry was replied to
- n8n workflow completed
- Email failed
- Booking was created

## 16.2 Data Source

Main source:

```text
audit_logs table
```

Secondary sources:

```text
email_logs
n8n_workflow_logs
booking_activity_timeline
```

## 16.3 Backend Endpoint

```text
GET /api/dashboard/recent-activity?limit=10
```

---

# 17. Workflow and Email Health Indicator

## 17.1 Purpose

Since the system will use n8n orchestration, the dashboard should show workflow health.

This section can be small but useful.

## 17.2 Metrics

Show:

- Successful workflows today
- Failed workflows today
- Failed emails today
- Pending email retries
- Last workflow run time

## 17.3 Data Sources

- n8n_workflow_logs
- email_logs

## 17.4 Backend Endpoint

```text
GET /api/dashboard/workflow-health
```

Expected response:

```json
{
  "successful_workflows_today": 12,
  "failed_workflows_today": 1,
  "failed_emails_today": 2,
  "pending_retries": 1,
  "last_workflow_run_at": "2026-06-22T09:30:00"
}
```

---

# 18. Dashboard Data Pipeline

## 18.1 Core Pipeline

```text
User Actions / System Events
        ↓
Specific Module Updates
(Bookings, Payments, Contracts, Inquiries, Calendar)
        ↓
Backend Writes to Supabase
        ↓
Audit Logs / Email Logs / Workflow Logs Updated
        ↓
Dashboard Aggregation Service Reads Latest Data
        ↓
Dashboard API Sends Clean Data to Frontend
        ↓
Dashboard Widgets Render Real Values
```

## 18.2 n8n-Enhanced Pipeline

```text
System Event
        ↓
Backend Trigger
        ↓
n8n Workflow
        ↓
Email / Reminder / Notification / Automation
        ↓
n8n Callback to Backend
        ↓
Backend Validates Result
        ↓
Supabase Tables Updated
        ↓
Dashboard Data Updated
```

---

# 19. Dashboard Aggregation Service

Create a backend service responsible for preparing dashboard data.

Recommended service name:

```text
DashboardService
```

## 19.1 Responsibilities

The DashboardService should:

- Count bookings by status
- Count payments by status
- Calculate revenue
- Get upcoming events
- Get today's agenda
- Get needs action items
- Get calendar items
- Get recent activity
- Get workflow health
- Generate smart assistant facts
- Return dashboard-ready JSON

## 19.2 Recommended Main Endpoint

```text
GET /api/dashboard/overview
```

This endpoint can return the complete dashboard payload.

Expected structure:

```json
{
  "generated_at": "2026-06-22T09:47:00",
  "snapshot": {},
  "assistant_summary": {},
  "trends": {},
  "needs_action": [],
  "calendar": {},
  "agenda": [],
  "upcoming_events": [],
  "recent_activity": [],
  "workflow_health": {}
}
```

## 19.3 Separate Endpoints

For better performance, also prepare separate endpoints:

```text
GET /api/dashboard/snapshot
GET /api/dashboard/assistant-summary
GET /api/dashboard/trends
GET /api/dashboard/needs-action
GET /api/dashboard/calendar
GET /api/dashboard/agenda
GET /api/dashboard/upcoming-events
GET /api/dashboard/recent-activity
GET /api/dashboard/workflow-health
```

---

# 20. Recommended Database Additions

If not yet available, prepare these tables.

## 20.1 dashboard_tasks

Used for Today's Agenda.

Suggested fields:

```text
id
title
description
task_date
task_time
priority
status
assigned_to
related_module
related_record_id
source
created_by
completed_by
completed_at
created_at
updated_at
```

Recommended status values:

```text
pending
completed
cancelled
overdue
```

Recommended source values:

```text
manual
system
n8n_workflow
booking
payment
contract
inquiry
calendar
```

---

## 20.2 notifications

Used for notification bell and dashboard notices.

Suggested fields:

```text
id
title
message
type
priority
related_module
related_record_id
is_read
created_for
created_by
created_at
updated_at
```

Recommended type values:

```text
booking
payment
contract
inquiry
email
workflow
system
calendar
task
```

---

## 20.3 n8n_workflow_logs

Used for workflow health and automation tracking.

Suggested fields:

```text
id
workflow_name
workflow_execution_id
related_module
related_record_id
trigger_source
request_payload
response_payload
status
error_message
started_at
completed_at
created_at
updated_at
```

---

## 20.4 Dashboard Views

For cleaner backend queries, create database views if appropriate:

```text
view_dashboard_snapshot
view_dashboard_needs_action
view_dashboard_upcoming_events
view_dashboard_revenue_trends
view_dashboard_workflow_health
```

These views are optional but recommended when the dashboard becomes data-heavy.

---

# 21. Smart Assistant Data Logic

## 21.1 Assistant Should Be Fact-Based

The Smart Assistant should be generated from real dashboard facts.

Example backend-generated facts:

```json
{
  "unanswered_inquiries": 3,
  "downpayments_expiring": 2,
  "events_today": 1,
  "failed_emails": 1,
  "payment_overdue": 0
}
```

Then the assistant converts them into readable messages.

Example output:

```text
You have 3 unanswered inquiries. Mark and Julia need contract validation.
There are 2 downpayments expiring soon.
Sarah's 18th Debut is scheduled today at 2:00 PM.
A contract email failed and needs fallback review.
```

## 21.2 AI Assistant Rule

If AI is integrated later, it should only improve the wording of the summary.

The AI must not directly query the database or invent values.

Correct:

```text
Backend gathers facts → AI rewrites summary → Dashboard displays summary
```

Wrong:

```text
AI guesses what happened in the system
```

## 21.3 Fallback Without AI

If AI service is unavailable, use a rule-based summary generator.

Example:

```text
Good morning, Jeyy. You have 3 items that need attention today: 2 pending payments and 1 failed email delivery.
```

---

# 22. Real-Time and Refresh Strategy

## 22.1 Initial Approach

Use standard API fetching with manual refresh.

Recommended refresh behavior:

- Dashboard loads data on page load.
- Dashboard shows `Last updated at`.
- Admin can click Refresh.
- Dashboard reloads all dashboard widgets.

## 22.2 Near Real-Time Approach

Use polling for important widgets.

Recommended polling interval:

| Widget | Refresh Interval |
|---|---|
| Needs Action | 30 seconds |
| Notifications | 30 seconds |
| Workflow Health | 60 seconds |
| Smart Assistant | 60 to 120 seconds |
| Revenue Chart | Manual or 5 minutes |
| Calendar | Manual or 5 minutes |

## 22.3 Future Realtime Option

If using Supabase Realtime later:

- Subscribe to bookings changes
- Subscribe to payments changes
- Subscribe to email_logs changes
- Subscribe to notifications changes
- Subscribe to dashboard_tasks changes

---

# 23. Strict Data Accuracy Rules

The dashboard must follow these rules:

1. No static business numbers in production.
2. No fake client names in production.
3. No fake revenue values in production.
4. No fake upcoming events in production.
5. No hardcoded agenda items in production.
6. All dashboard data must come from the backend.
7. Dashboard widgets must show empty states when there is no data.
8. Dashboard widgets must show loading states while fetching.
9. Dashboard widgets must show error states when fetching fails.
10. Every generated smart assistant message must be based on real data.
11. Revenue must only count verified payments.
12. Cancelled and declined bookings must not appear as active upcoming events.
13. Failed emails must appear in Needs Action.
14. Failed workflows must appear in Needs Action or Workflow Health.
15. Payment deadlines must come from Payment Management.
16. Booking schedules must come from Booking Management or Calendar.
17. Contract reminders must come from Contract Management.
18. Inquiry alerts must come from the Inquiries module.

---

# 24. Permissions and Role-Based Access

## 24.1 Super Admin

Can view all dashboard data.

Allowed actions:

- View all business summaries
- Add agenda
- Complete agenda
- Acknowledge alerts
- View all module records
- Trigger safe workflow actions
- Resolve failed email fallback
- Override urgent issues if allowed

## 24.2 Admin

Can view dashboard data relevant to their role.

Allowed actions:

- View assigned bookings
- View assigned tasks
- Complete assigned agenda
- Acknowledge assigned alerts
- Open related records
- Trigger allowed workflow actions

## 24.3 Security Rule

The dashboard should not expose sensitive details to unauthorized users.

Examples:

- Payment details should be summarized unless the user has payment access.
- Audit log details should be limited based on role.
- Workflow payloads should not be shown directly on the dashboard.
- Email logs should show status only, not full sensitive content.

---

# 25. UI and UX Requirements

The dashboard must preserve the existing Zion visual identity.

## 25.1 Design Style

- Premium
- Elegant
- Clean
- Warm cream background
- Gold accent color
- Rounded cards
- Soft shadows
- Consistent typography
- Clear hierarchy
- Responsive layout
- Professional admin dashboard feel

## 25.2 Layout Recommendation

Keep the current structure:

```text
Left Sidebar
Main Dashboard Content
Right Productivity Column
```

Main content should contain:

- Page header
- Snapshot cards
- Smart assistant
- Revenue chart
- Needs Action
- Recent Activity

Right column should contain:

- Calendar
- Today's Agenda
- Upcoming Events
- Workflow Health

## 25.3 Empty States

Each widget should have a clean empty state.

Examples:

### Needs Action Empty State

```text
No urgent actions right now.
Everything looks clear for today.
```

### Upcoming Events Empty State

```text
No upcoming events found.
Confirmed bookings will appear here once scheduled.
```

### Agenda Empty State

```text
No agenda for today.
Add a task or wait for system-generated reminders.
```

### Assistant Empty State

```text
No major activity has been recorded yet today.
```

---

# 26. Dashboard Actions

The dashboard should support quick actions without becoming a full CRUD module.

## 26.1 Safe Quick Actions

Allowed:

- Acknowledge alert
- Mark agenda task as complete
- Add agenda task
- Open related record
- Trigger payment reminder
- Retry failed email through safe backend endpoint
- View details
- Refresh dashboard

## 26.2 Actions That Should Redirect

These should redirect to the proper module:

| Action | Redirect To |
|---|---|
| Edit booking | Booking Management |
| Manage payment | Payment & History |
| Edit contract | Contract Management |
| Reply to inquiry | Inquiries |
| View full email log | System Logs |
| View workflow log | System Logs |
| Manage calendar event | Calendar |

---

# 27. Backend API Plan

## 27.1 Main Dashboard Routes

```text
GET /api/dashboard/overview
GET /api/dashboard/snapshot
GET /api/dashboard/assistant-summary
GET /api/dashboard/trends
GET /api/dashboard/needs-action
GET /api/dashboard/calendar
GET /api/dashboard/agenda
GET /api/dashboard/upcoming-events
GET /api/dashboard/recent-activity
GET /api/dashboard/workflow-health
```

## 27.2 Dashboard Action Routes

```text
POST /api/dashboard/agenda
PATCH /api/dashboard/agenda/:id
PATCH /api/dashboard/agenda/:id/complete
DELETE /api/dashboard/agenda/:id

PATCH /api/dashboard/alerts/:id/acknowledge
POST /api/dashboard/actions/send-payment-reminder
POST /api/dashboard/actions/retry-failed-email
POST /api/dashboard/actions/trigger-workflow
```

## 27.3 API Response Standard

All dashboard endpoints should return consistent response format.

Example:

```json
{
  "success": true,
  "data": {},
  "generated_at": "2026-06-22T09:47:00",
  "message": "Dashboard data loaded successfully."
}
```

Error example:

```json
{
  "success": false,
  "error": "Unable to load dashboard data.",
  "details": "Database connection failed."
}
```

---

# 28. n8n Dashboard Integration

## 28.1 What n8n Should Feed Into Dashboard

n8n should not directly control the dashboard UI.

Instead, n8n should update backend records that the dashboard reads.

n8n should feed:

- Email delivery results
- Workflow status
- Payment reminder results
- Booking confirmation results
- Contract delivery results
- Failed automation notices
- System-generated agenda tasks
- Notifications

## 28.2 Recommended n8n Callback Endpoints

```text
POST /api/orchestration/email-logs
POST /api/orchestration/workflow-logs
POST /api/orchestration/bookings/workflow-result
POST /api/orchestration/payments/reminder-result
POST /api/orchestration/contracts/delivery-result
POST /api/orchestration/tasks/create
POST /api/orchestration/notifications/create
```

## 28.3 Example n8n to Dashboard Flow

```text
Payment Reminder Workflow Failed
        ↓
n8n calls backend /api/orchestration/workflow-logs
        ↓
Backend saves failed workflow log
        ↓
Backend creates Needs Action item
        ↓
Dashboard Needs Action panel updates
        ↓
Smart Assistant includes the issue in its summary
```

---

# 29. Testing Plan

## 29.1 Dashboard Data Testing

Test the following:

- Dashboard loads with empty database
- Dashboard loads with seed data
- Dashboard loads with real bookings
- Dashboard loads with real payments
- Dashboard reflects failed emails
- Dashboard reflects failed workflows
- Dashboard reflects today's events
- Dashboard reflects upcoming events
- Dashboard reflects completed agenda items

## 29.2 Smart Assistant Testing

Test:

- No data state
- Normal business day
- Multiple urgent actions
- Failed email included
- Failed workflow included
- Upcoming event included
- Payment due included
- Unanswered inquiry included
- AI unavailable fallback

## 29.3 Action Testing

Test:

- Add agenda
- Complete agenda
- Acknowledge Needs Action item
- View related booking
- View related payment
- View related contract
- Retry failed email
- Send payment reminder
- Refresh dashboard

## 29.4 Security Testing

Test:

- Admin can only access allowed data
- Unauthorized user cannot access dashboard API
- Sensitive workflow payloads are hidden
- Dashboard cannot directly edit protected records
- n8n callbacks require secret validation

---

# 30. Implementation Phases

## Phase 1: Remove Static Dashboard Data

Tasks:

- Identify all hardcoded dashboard data.
- Replace static arrays with API calls.
- Add loading states.
- Add empty states.
- Add error states.
- Add refresh handling.

## Phase 2: Create Dashboard Backend Service

Tasks:

- Create DashboardService.
- Create dashboard API routes.
- Connect to Supabase database.
- Aggregate bookings, payments, contracts, inquiries, tasks, and logs.
- Return dashboard-ready data.

## Phase 3: Implement Core Widgets

Tasks:

- Business snapshot cards.
- Revenue and booking trends chart.
- Needs Action panel.
- Upcoming Events.
- Calendar.
- Today's Agenda.

## Phase 4: Implement Smart Assistant

Tasks:

- Create deterministic assistant facts.
- Generate readable summary.
- Add AI wording enhancement later if needed.
- Add fallback rule-based summary.
- Add assistant loading and empty states.

## Phase 5: Add n8n Readiness

Tasks:

- Add workflow logs table.
- Add orchestration callback endpoints.
- Add dashboard workflow health widget.
- Add Needs Action generation from failed workflows and emails.
- Add notification creation from n8n callbacks.

## Phase 6: Final UI Polish

Tasks:

- Improve spacing and alignment.
- Keep existing premium design.
- Make dashboard responsive.
- Make charts readable.
- Add consistent badges.
- Add Last Updated timestamp.
- Add refresh button if needed.

---

# 31. Final Dashboard Checklist

| Requirement | Status |
|---|---|
| Static dashboard data removed | Pending |
| Dashboard API routes created | Pending |
| DashboardService created | Pending |
| Snapshot cards connected to real data | Pending |
| Smart Assistant connected to real facts | Pending |
| Revenue chart connected to payments | Pending |
| Booking trends connected to bookings | Pending |
| Needs Action connected to real alerts | Pending |
| Calendar connected to bookings/tasks | Pending |
| Today's Agenda connected to tasks | Pending |
| Upcoming Events connected to bookings | Pending |
| Workflow Health connected to n8n logs | Pending |
| Email failures shown in Needs Action | Pending |
| Failed workflows shown in Needs Action | Pending |
| Empty states implemented | Pending |
| Loading states implemented | Pending |
| Error states implemented | Pending |
| Role-based access applied | Pending |
| Dashboard actions redirect correctly | Pending |
| n8n callback data reflected in dashboard | Pending |

---

# 32. Final Rule

The Admin Dashboard must become the centralized, real, and accurate business command center of the system.

It should not be a static page.

Every number, chart, event, task, notice, and assistant message should come from real system data or properly logged workflow data.

The dashboard should help the admin immediately understand:

```text
What happened?
What is happening now?
What needs action?
What is coming next?
What should be prioritized?
```

This makes the dashboard meaningful, useful, and aligned with the operational needs of Zion Events Place and Management.
