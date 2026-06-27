# Inquiry Management Page Plan
## Zion Events Place and Management System

---

## 1. Purpose

This plan defines a clean and practical structure for the **Inquiry Management** page in the Admin Panel.

The page will serve as the centralized area for possible clients who ask questions about Zion Events Place, event packages, availability, pricing, booking process, and other event-related concerns.

The inquiry form shown in the Client Panel and the **Message Us** feature inside the Contact Us page must directly feed into this Admin Panel page.

---

## 2. Main Objective

The Inquiry Management page should allow Admin and Super Admin users to:

1. Receive inquiries from the Contact Us form and Message Us feature.
2. View all possible-client messages in one centralized page.
3. Track which inquiries are new, pending, answered, follow-up, closed, spam, or converted to booking.
4. Filter inquiries by date, status, event type, priority, and assigned admin.
5. View full inquiry details.
6. Add internal notes.
7. Assign inquiries to admins.
8. Convert qualified inquiries into booking records.
9. Show inquiry-related updates on Dashboard and Reports.
10. Record all important inquiry actions in System Logs.

---

## 3. Strict Connection Rule

The inquiry form in the Client Panel must be directly connected to the Admin Panel Inquiries page.

Strict rule:

```text
Any message submitted through the Contact Us inquiry form or Message Us feature must automatically be saved and displayed in the Admin Panel Inquiry Management page.
```

No submitted inquiry should stay only on the frontend.

---

## 4. Client Panel Inquiry Form Reference

Based on the provided image, the inquiry form includes:

- Full Name
- Phone Number
- Time
- Email
- Message
- Submit button

Recommended field interpretation:

| Form Field | System Meaning |
|---|---|
| Full Name | Name of the interested client |
| Phone Number | Client contact number |
| Time | Preferred contact time |
| Email | Client email address |
| Message | Client question, concern, or inquiry |

Recommended improvement:

```text
Rename “Time” to “Preferred Contact Time” if possible.
```

This makes the field clearer and more useful.

---

## 5. Client Submission Flow

```text
Client opens Contact Us page
        ↓
Client fills out inquiry form or Message Us form
        ↓
Client clicks Submit
        ↓
System validates fields
        ↓
Inquiry is saved in the database
        ↓
Inquiry appears in Admin Panel
        ↓
Silent admin notification is created
        ↓
System Logs records the submission
```

Client success message:

```text
Your inquiry has been submitted successfully. Our team will contact you soon.
```

---

## 6. Client Form Validation

Required validation:

1. Full Name is required.
2. Phone Number is required.
3. Email is required and must be valid.
4. Message is required.
5. Preferred Contact Time is optional but recommended.
6. Message should have at least 10 characters.
7. Submit button should be disabled while submitting to prevent duplicate submissions.

Recommended error messages:

```text
Please enter your full name.
Please enter a valid email address.
Please write your message before submitting.
```

---

## 7. Admin Panel Page

Recommended route:

```text
/admin/inquiries
```

Sidebar label:

```text
Inquiries
```

Page title:

```text
Inquiry Management
```

Page subtitle:

```text
Manage client inquiries, package questions, event concerns, and booking-related messages from the Client Panel.
```

---

## 8. Inquiry Summary Cards

Add summary cards at the top of the page.

| Card | Meaning |
|---|---|
| Total Inquiries | All inquiries received |
| New Inquiries | New and unread inquiries |
| Pending Response | Inquiries waiting for admin response |
| Follow-Up Needed | Inquiries that require another contact attempt |
| Answered | Inquiries already handled |
| Converted to Booking | Inquiries that became bookings |
| High Priority | Important or urgent inquiries |

Strict rule:

```text
Summary cards must use real database records, not static values.
```

---

## 9. Inquiry Table

The table should show all inquiry records.

Recommended columns:

| Column | Description |
|---|---|
| Submitted Date | Date and time the inquiry was submitted |
| Client | Full name, email, and phone number |
| Message Preview | Short preview of the inquiry message |
| Preferred Time | Client’s preferred contact time |
| Event Interest | Event type or package interest, if available |
| Status | New, Pending, Answered, Follow-Up, Converted, Closed, Spam |
| Priority | Low, Normal, High |
| Assigned To | Admin handling the inquiry |
| Last Updated | Latest activity timestamp |
| Actions | View, Assign, Mark Answered, Follow-Up, Convert to Booking |

---

## 10. Status Values

Recommended inquiry statuses:

```text
new
pending_response
answered
follow_up
converted_to_booking
closed
spam
```

Default status after submission:

```text
new
```

Status meanings:

| Status | Meaning |
|---|---|
| New | Newly submitted inquiry |
| Pending Response | Waiting for admin response |
| Answered | Inquiry has been answered |
| Follow-Up | Needs another contact attempt |
| Converted to Booking | Inquiry became a booking |
| Closed | No further action needed |
| Spam | Invalid or unnecessary inquiry |

---

## 11. Priority Logic

Recommended priority values:

```text
low
normal
high
```

Default priority:

```text
normal
```

Optional automatic priority rules:

| Condition | Priority |
|---|---|
| Message includes urgent words like today, ASAP, urgent | High |
| Inquiry mentions an event date within 7 days | High |
| General package question | Normal |
| Incomplete or unclear inquiry | Low or Normal |

Strict rule:

```text
Priority should help admins focus, but it should not create noisy alerts unless truly necessary.
```

---

## 12. Filters and Search

Required filters:

- Submitted date range
- Status
- Priority
- Event type or event interest
- Assigned admin
- Preferred contact time

Search should support:

- Full name
- Email
- Phone number
- Message content
- Event interest

---

## 13. Inquiry Details Drawer

When admin clicks an inquiry, open a details drawer.

Drawer sections:

1. Inquiry Summary
2. Client Contact Details
3. Full Message
4. Preferred Contact Time
5. Event or Package Interest
6. Status and Priority
7. Assigned Admin
8. Internal Notes
9. Activity Timeline
10. Related Booking, if converted

Internal notes examples:

```text
Client asked about wedding package pricing.
Follow up tomorrow afternoon.
Interested in February 2026 date.
```

Internal notes must not be visible to clients.

---

## 14. Admin Actions

Admin and Super Admin should be able to:

- View inquiry details
- Assign inquiry to an admin
- Change inquiry status
- Set priority
- Add internal notes
- Mark as answered
- Mark for follow-up
- Convert inquiry to booking
- Mark as spam
- Close inquiry
- Archive inquiry if allowed

Strict rule:

```text
Use archive or spam status instead of permanent delete whenever possible.
```

---

## 15. Convert Inquiry to Booking Feature

Add a button:

```text
Convert to Booking
```

When clicked:

1. Open a booking creation form.
2. Pre-fill client details from inquiry:
   - Full name
   - Phone number
   - Email
   - Message as initial note
3. Admin completes missing booking details:
   - Event type
   - Event date
   - Package
   - Guest count
   - Payment details
4. System creates a booking record.
5. Inquiry status becomes `converted_to_booking`.
6. Inquiry links to the booking record.
7. System creates an audit log.

Strict rule:

```text
Converting an inquiry to a booking must not delete the original inquiry.
```

---

## 16. Reply and Contact Handling

Since full email automation may not be ready yet, include practical actions first.

Recommended buttons:

| Button | Purpose |
|---|---|
| Copy Email | Copies client email |
| Copy Phone | Copies client phone number |
| Mark Answered | Marks inquiry as answered after admin contacts client |
| Add Follow-Up | Creates follow-up status or reminder |
| Convert to Booking | Creates booking from inquiry |

Optional future feature:

```text
Reply by Email through n8n orchestration.
```

If n8n is not ready, create placeholder logic only.

---

## 17. Silent Notification Behavior

When a new inquiry is submitted:

- Create a notification inside the Admin Panel.
- Show it in the notification bell.
- Do not make it a high-alert notification.
- Do not play loud sounds.
- Do not send external notification when admin is offline.
- Keep it as a low or normal priority admin notification.

Notification example:

```text
New inquiry submitted by Maria Santos.
```

Recommended notification type:

```text
inquiry
```

Recommended priority:

```text
normal
```

---

## 18. Dashboard Integration

Dashboard should show:

- New inquiries
- Unanswered inquiries
- Follow-up inquiries
- Recent inquiry activity

Smart assistant example:

```text
You have 3 unanswered inquiries today. Review them before confirming new bookings.
```

---

## 19. Reports and Analytics Integration

Reports should use inquiry data for:

- Total inquiries per month
- Inquiry-to-booking conversion rate
- Most asked event type
- Average response time
- Unanswered inquiry count
- Follow-up count

Useful formulas:

```text
Inquiry conversion rate = converted inquiries / total inquiries
Average response time = answered_at - submitted_at
```

---

## 20. System Logs Integration

Create System Logs for:

- Inquiry submitted
- Inquiry viewed
- Inquiry assigned
- Inquiry status changed
- Inquiry marked answered
- Inquiry marked follow-up
- Inquiry converted to booking
- Inquiry marked spam
- Inquiry closed
- Internal note added

Each log should include:

```text
user
role
action
module = inquiries
description
status
ip_address
timestamp
```

---

## 21. Database Model Plan

### inquiries

```text
id
inquiry_reference
full_name
phone_number
email
preferred_contact_time
message
event_interest
package_interest
source_page
status
priority
assigned_to
related_booking_id
submitted_at
answered_at
closed_at
created_at
updated_at
```

### inquiry_notes

```text
id
inquiry_id
note
created_by
created_at
updated_at
```

### inquiry_activity

```text
id
inquiry_id
action
description
performed_by
created_at
```

---

## 22. API Endpoint Plan

### Client Panel

```text
POST /api/client/inquiries
```

### Admin Panel

```text
GET /api/admin/inquiries
GET /api/admin/inquiries/:id
PATCH /api/admin/inquiries/:id
PATCH /api/admin/inquiries/:id/status
PATCH /api/admin/inquiries/:id/assign
POST /api/admin/inquiries/:id/notes
POST /api/admin/inquiries/:id/convert-to-booking
PATCH /api/admin/inquiries/:id/close
PATCH /api/admin/inquiries/:id/spam
```

### Dashboard and Reports

```text
GET /api/admin/inquiries/summary
GET /api/admin/inquiries/analytics
```

---

## 23. Client Form to Inquiry Mapping

| Form Input | Database Field |
|---|---|
| Full Name | full_name |
| Phone Number | phone_number |
| Time | preferred_contact_time |
| Email | email |
| Message | message |
| Submit Date | submitted_at |
| Source | source_page = contact_us |

Strict rule:

```text
No submitted inquiry should be lost after pressing Submit.
```

---

## 24. UI and UX Requirements

### Client Panel

The inquiry form should be:

- Simple
- Clear
- Mobile-friendly
- Easy to submit
- Connected to the backend
- Validated before submission

Recommended button label:

```text
Submit Inquiry
```

### Admin Panel

The Inquiry Management page should follow the Zion admin style:

- Warm cream background
- Gold accent
- Rounded cards
- Soft shadows
- Clean table
- Status badges
- Details drawer
- Search and filters
- Clear empty/loading/error states

---

## 25. Empty, Loading, and Error States

### Admin Empty State

```text
No inquiries yet.
Client messages from the Contact Us page will appear here once submitted.
```

### Client Success State

```text
Your inquiry has been submitted successfully.
```

### Client Error State

```text
Unable to submit your inquiry. Please check your details and try again.
```

### Admin Error State

```text
Unable to load inquiries. Please refresh the page or try again later.
```

---

## 26. Role-Based Access

### Super Admin

Can:

- View all inquiries
- Assign inquiries
- Change status
- Add notes
- Convert inquiry to booking
- Mark spam
- Close or archive inquiry
- View inquiry analytics

### Admin

Can:

- View inquiries
- Handle assigned inquiries
- Add notes
- Mark answered
- Mark follow-up
- Convert inquiry to booking if allowed

### Public User

Can:

- Submit inquiry through Contact Us page
- Receive success or error message

---

## 27. Testing Plan

Test the following:

1. User can submit inquiry from Contact Us page.
2. Form validates required fields.
3. Submitted inquiry appears in Admin Panel.
4. New inquiry creates silent admin notification.
5. Admin can view inquiry details.
6. Admin can filter by submitted date.
7. Admin can filter by status.
8. Admin can filter by priority.
9. Admin can search by name, email, phone, or message.
10. Admin can add internal notes.
11. Admin can mark inquiry as answered.
12. Admin can mark inquiry as follow-up.
13. Admin can convert inquiry to booking.
14. Converted inquiry links to Booking Management.
15. Dashboard shows unanswered inquiry count.
16. Reports calculate inquiry conversion rate.
17. System Logs record inquiry actions.

---

## 28. Implementation Phases

### Phase 1: Connect Client Inquiry Form

- Connect Contact Us form to backend endpoint.
- Validate form fields.
- Save inquiry to database.
- Show success/error message.

### Phase 2: Build Admin Inquiry Page

- Add Inquiry Management page.
- Add summary cards.
- Add inquiry table.
- Add filters and search.
- Add details drawer.

### Phase 3: Add Inquiry Actions

- Add assign feature.
- Add status update feature.
- Add internal notes.
- Add follow-up status.
- Add convert-to-booking feature.

### Phase 4: Add Notifications and Logs

- Add silent admin notification.
- Add System Logs entries.
- Add inquiry activity timeline.

### Phase 5: Integrate Dashboard and Reports

- Show new/unanswered inquiries on Dashboard.
- Add inquiry metrics to Reports & Analytics.
- Track conversion rate.

### Phase 6: Testing and Polish

- Test client submission.
- Test admin workflow.
- Test filters.
- Test role access.
- Polish UI and responsiveness.

---

## 29. Final Acceptance Criteria

The Inquiry Management page is complete if:

1. The Contact Us form and Message Us feature are directly connected to the Inquiries page.
2. Any submitted inquiry appears in the Admin Panel.
3. Admin and Super Admin can view and manage inquiries.
4. Admin can filter inquiries by date, status, event type, priority, and assigned admin.
5. Admin can add notes and track progress.
6. Admin can mark inquiries as answered, follow-up, closed, spam, or converted to booking.
7. Inquiries can be converted into Booking Management records.
8. Dashboard reflects unanswered and new inquiry counts.
9. Reports can calculate inquiry trends and conversion rate.
10. System Logs record all important inquiry actions.
11. New inquiry notifications are silent and not high-alert.
12. The module is useful, practical, and aligned with Zion Events Place operations.

---

## 30. Final Rule

The Inquiry Management page must become the centralized page for possible clients’ questions and concerns.

It should help Zion Events Place clearly manage:

```text
Who asked?
What did they ask?
When should they be contacted?
Has the inquiry been answered?
Does the client need follow-up?
Can the inquiry become a booking?
```

This makes the inquiry process organized, trackable, and useful for business operations.
