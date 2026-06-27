# Contract Management Page Plan  
## Zion Events Place and Management System

---

## 1. Purpose of This Document

This document provides a concrete, professional, complete, and implementation-ready plan for the **Contract Management** page of the Zion Events Place and Management System.

The Contract Management page should become the centralized place where admins and super admins can:

- View booking events that require contracts
- Generate contracts automatically from booking, package, and payment data
- Preview the generated contract inside the admin panel
- Edit allowed contract fields before sending
- Download contract PDFs
- Send contracts to clients through n8n orchestration
- Resend contracts manually when automated sending fails
- Track contract status, email delivery status, workflow status, and signing status
- Review contract history and previous versions

The page must no longer rely on static data. All contracts, booking events, payment summaries, email statuses, and workflow statuses must come from real system data.

---

## 2. Current Page Review Requirement Before Overhaul

Before implementing or overhauling the Contract Management page, the current page structure must be reviewed carefully.

The developer must inspect the existing:

- Contract Management route
- Page component structure
- Current layout wrapper
- Sidebar active state
- Header and search behavior
- Existing table/card structure
- Static sample data
- Existing modals, drawers, and buttons
- Existing API calls
- Existing mock contract data
- Existing styling and reusable components
- Existing relationship with Booking Management, Payment Management, and System Logs

### Strict Rule

```text
Do not delete or rewrite the Contract Management page blindly.
First identify reusable components, existing styles, and existing logic.
Only replace static data with real backend-driven data after reviewing the current structure.
```

The implementation must preserve the existing Zion admin visual identity:

- Warm cream background
- Gold accent color
- Elegant headings
- Rounded cards
- Soft shadows
- Clean tables
- Premium dashboard style
- Consistent sidebar and topbar layout
- Responsive behavior

---

## 3. Reference Contract PDF

The uploaded **CONTRACT ZION.pdf** must be used as the main contract template reference.

The PDF contains a 4-page contract structure:

| Page | Main Content | Treatment |
|---|---|---|
| Page 1 | Zion header, contact details, event confirmation number, payment status, event details, and package inclusions | Keep layout. Replace booking and package fields dynamically. |
| Page 2 | Acknowledgment receipt, client name, event date, item description, contract amount, payment history, remaining balance, total paid, and owner acknowledgment | Keep layout. Replace client, item, amount, and payment details dynamically. Keep owner signature/name static. |
| Page 3 | Terms and conditions for event packages, rooms, and venue rules | Keep static. Do not change unless Super Admin updates the approved template version. |
| Page 4 | Cancellation policy, advertisement clause, OTD coordinator description, client responsibility, and signature section | Keep static. Do not change unless Super Admin updates the approved template version. |

---

## 4. Main Contract Template Rule

The system must generate contracts by copying the approved structure, layout, and content of the reference PDF.

### 4.1 Static Parts That Must Remain Unchanged

The following parts must remain fixed and must not be automatically rewritten:

- Zion Events Place branding and contract layout
- Contract page structure
- Terms and Conditions
- Venue Rules
- Cancellation Policy
- Advertisement clause
- Description of OTD Coordinators, if included
- Client Responsibility section
- Footer layout and branding line
- Owner name and signature section
- Owner name: **Timothy Paul C. Soriano**
- Signature display/name: **Timothy Soriano**

### 4.2 Dynamic Parts That Must Be Automatically Replaced

The following parts must be generated automatically from system data:

#### Page 1 Dynamic Fields

- Event Confirmation Number
- Payment Status
- Date of Event
- Client Name / Couple Name / Celebrant Name
- Total Pax
- Check-in time
- Check-out time
- Colors
- Theme
- Package name
- Package inclusions

#### Page 2 Dynamic Fields

- Name of Client
- Event Date
- Item Description
- Package description
- Amount
- Total Contract Amount
- Payment History
- Down Payment
- Second Payment, if applicable
- Final Payment, if applicable
- Remaining Balance
- Total Paid
- Payment acknowledgment amount
- Payment acknowledgment date
- Payment method

#### Optional Dynamic Fields

- Contract number
- Booking reference
- Contract generated date
- Contract version
- Client signature status
- Sent date
- Signed date
- Assigned coordinator

---

## 5. Contract Template System

The system should use a template-based contract generation approach.

### 5.1 Recommended Approach

Create an approved contract template with placeholders.

Example placeholders:

```text
{{event_confirmation_no}}
{{payment_status}}
{{event_date}}
{{client_names}}
{{total_pax}}
{{check_in}}
{{check_out}}
{{colors}}
{{theme}}
{{package_name}}
{{package_inclusions}}
{{client_name}}
{{item_description}}
{{total_contract_amount}}
{{payment_history_rows}}
{{remaining_balance}}
{{total_paid}}
{{payment_acknowledgment_amount}}
{{payment_acknowledgment_date}}
{{payment_method}}
```

The system should replace only placeholders with real data.

### 5.2 Locked Template Sections

The following sections should not have editable placeholders by default:

```text
terms_and_conditions
venue_rules
cancellation_policy
advertisement_clause
otd_coordinator_description
client_responsibility
owner_signature_block
```

Only Super Admin should be allowed to update these through contract template versioning.

---

## 6. Contract Management Page Objective

The Contract Management page should show both:

1. **Booking Events**
   - Booking records that need contracts or already have related contracts.

2. **Generated Contracts**
   - Contract drafts, generated contracts, sent contracts, failed contracts, signed contracts, and archived versions.

This page should work as a booking-driven contract workflow page, not just a static file list.

Recommended page subtitle:

```text
Generate, preview, edit, send, download, and track client contracts based on approved booking events.
```

---

## 7. Page Structure

The Contract Management page should include:

1. Page Header
2. Summary Cards
3. Filters and Search
4. Tab Navigation
5. Booking Events Queue
6. Contracts List
7. Contract Preview Panel or Drawer
8. Contract Edit Drawer
9. Contract Generation Action
10. Send and Resend Actions
11. Contract Timeline
12. n8n Workflow Status
13. Email Delivery Status
14. Template Management for Super Admin

---

## 8. Recommended Tabs

Use tabs to keep the page clean and organized.

Recommended tabs:

```text
Booking Events
Contracts
Failed Delivery
Signed Contracts
Templates
```

### 8.1 Booking Events Tab

Shows booking records that can generate contracts.

Include:

- Bookings without contracts
- Bookings with draft contracts
- Confirmed bookings
- Bookings with reservation or down payment paid
- Bookings waiting for contract preparation
- Bookings with contract generation errors

### 8.2 Contracts Tab

Shows all generated contract records.

Include:

- Draft contracts
- Generated contracts
- Ready-to-send contracts
- Sent contracts
- Viewed contracts
- Signed contracts
- Superseded contracts
- Cancelled contracts

### 8.3 Failed Delivery Tab

Shows contracts where delivery failed.

This tab should make fallback actions easy:

- View failed email log
- View workflow log
- Resend contract
- Download PDF manually
- Mark issue as resolved

### 8.4 Signed Contracts Tab

Shows completed or signed contracts.

### 8.5 Templates Tab

Shows approved contract templates.

Important:

```text
Template editing must be restricted to Super Admin only.
```

---

## 9. Summary Cards

Add summary cards at the top of the page.

Recommended cards:

| Card | Description |
|---|---|
| Total Contracts | Total number of contract records |
| Draft Contracts | Contracts created but not finalized |
| Ready to Send | Generated contracts ready for delivery |
| Sent Contracts | Contracts already sent to clients |
| Signed Contracts | Contracts signed by clients |
| Failed Delivery | Contracts that failed to send |
| Bookings Without Contract | Eligible bookings with no contract yet |
| Pending Client Signature | Sent contracts waiting for client signature |

Each card must be connected to real backend data.

Clicking a card should filter the table or switch to the relevant tab.

---

## 10. Search and Filters

Add a filter card with these filters:

- Search by client name, booking reference, contract number, email, event type, or package name
- Event date range
- Contract status
- Booking status
- Payment status
- Event type
- Package
- Assigned coordinator
- Generated by
- Sent status
- Signature status
- Workflow status

Recommended contract status values:

```text
not_generated
draft
generated
ready_to_send
sent
delivery_failed
viewed
signed
superseded
cancelled
archived
```

Recommended workflow status values:

```text
not_started
triggered
processing
completed
failed
retrying
manual_fallback
```

Recommended email status values:

```text
not_sent
queued
sent
delivered
failed
bounced
retried
pending
```

---

## 11. Booking Events Queue

The Booking Events tab should show event bookings that can generate contracts.

Recommended columns:

| Column | Description |
|---|---|
| Booking Reference | Unique booking code |
| Client | Client name, email, and contact number |
| Event | Event type, event title, and package |
| Event Date | Date and time of event |
| Payment Summary | Reservation, down payment, partial payment, or full payment status |
| Contract Status | Not Generated, Draft, Generated, Sent, Signed |
| Workflow Status | n8n generation or delivery status |
| Assigned Coordinator | Assigned admin or coordinator |
| Last Updated | Latest booking or contract update |
| Actions | Generate, Preview, Edit, Send, Download, View Details |

---

## 12. Booking Eligibility for Contract Generation

A booking can generate a contract only if it passes eligibility rules.

### Required Conditions

A booking is eligible if:

- Booking exists in Booking Management
- Booking status is not Cancelled or Declined
- Client name is available
- Client email is available
- Event date is available
- Event package is selected
- Total contract amount is available
- Payment record exists or payment summary is available
- Event confirmation number or booking reference exists

### Recommended Eligible Statuses

```text
pending
confirmed
rescheduled
```

### Recommended Payment Conditions

Contract generation may be allowed when:

```text
reservation_paid
down_payment_paid
partially_paid
fully_paid
```

Optional:

```text
unpaid bookings may generate draft contracts only, but not send automatically.
```

### Strict Rule

```text
A contract must not be automatically sent to the client if required booking or payment information is incomplete.
```

---

## 13. Contracts List

The Contracts tab should show generated contracts.

Recommended columns:

| Column | Description |
|---|---|
| Contract Number | Unique contract number |
| Booking Reference | Connected booking |
| Client | Client name and email |
| Event | Event type and event date |
| Package | Package used in the contract |
| Contract Amount | Total contract amount |
| Contract Status | Draft, Sent, Signed, etc. |
| Email Status | Sent, Delivered, Failed, etc. |
| Workflow Status | n8n status |
| Version | Contract version number |
| Last Updated | Latest update |
| Actions | Preview, Edit, Download, Send, Resend, View Logs |

---

## 14. Contract Status Flow

Recommended contract status flow:

```text
not_generated → draft → generated → ready_to_send → sent → viewed → signed
```

Alternative flows:

```text
ready_to_send → delivery_failed → resend_pending → sent
draft → cancelled
generated → superseded
sent → superseded
```

### Status Meanings

| Status | Meaning |
|---|---|
| Not Generated | No contract has been created yet |
| Draft | Contract data is prepared but not finalized |
| Generated | PDF/HTML contract has been created |
| Ready to Send | Contract passed validation and can be sent |
| Sent | Contract email was sent |
| Delivery Failed | Sending failed |
| Viewed | Client opened the contract link, if tracking exists |
| Signed | Client signed the contract |
| Superseded | Contract was replaced by a newer version |
| Cancelled | Contract was cancelled |
| Archived | Contract is no longer active but kept for history |

---

## 15. Contract Generation Pipeline

The system should use a controlled contract generation pipeline.

### 15.1 Recommended Flow

```text
Admin opens Contract Management
        ↓
System loads eligible booking events
        ↓
Admin clicks Generate Contract
        ↓
Backend validates booking, package, and payment data
        ↓
Backend prepares contract placeholder data
        ↓
n8n contract generation workflow is triggered
        ↓
Contract template is filled with dynamic data
        ↓
PDF contract is generated
        ↓
PDF is stored in Supabase Storage
        ↓
Contract record is saved or updated
        ↓
Contract appears in Contract Management
        ↓
Audit log and timeline entry are created
```

### 15.2 Important Backend Rule

Even when n8n is used, the backend should remain the gatekeeper.

Recommended pattern:

```text
Frontend → Backend → n8n → Backend Callback → Supabase
```

Avoid this pattern for sensitive updates:

```text
Frontend → n8n → Direct Database Update
```

The backend should validate all data before creating or updating contract records.

---

## 16. n8n Orchestration Plan for Contracts

n8n should help automate the contract workflow.

### 16.1 Contract Generation Workflow

Trigger:

```text
Booking becomes eligible for contract generation
or
Admin clicks Generate Contract
```

Workflow:

```text
Webhook Trigger
→ Validate received booking/contract payload
→ Request contract data from backend if needed
→ Generate or request PDF generation
→ Store PDF file path or URL
→ Send workflow result back to backend
→ Backend updates contract record
→ Backend creates audit log and workflow log
```

### 16.2 Contract Delivery Workflow

Trigger:

```text
Contract is marked Ready to Send
or
Admin clicks Send Contract
```

Workflow:

```text
Webhook Trigger
→ Get client email and contract link
→ Send contract email to client
→ Send admin notification if needed
→ Send email result to backend
→ Backend updates Email Logs
→ Backend updates Contract status
→ Backend updates Booking Timeline
```

### 16.3 Contract Resend Workflow

Trigger:

```text
Admin clicks Resend Contract
```

Workflow:

```text
Webhook Trigger
→ Validate contract and client email
→ Send contract email again
→ Increment resend attempt count
→ Send resend result to backend
→ Backend updates Email Logs
→ Backend updates Contract status
→ Backend creates audit log
```

### 16.4 Contract Signing Status Workflow

Trigger:

```text
Client signs contract
or
Contract signing status changes
```

Workflow:

```text
Webhook Trigger or Callback
→ Validate signing event
→ Update contract status to Signed
→ Save signed timestamp
→ Notify admin
→ Update Booking Timeline
→ Create audit log
```

---

## 17. Contract Preview

The Contract Management page must allow admins to preview the generated contract.

### 17.1 Preview Requirements

The preview should show:

- Full contract layout
- Page 1 event details and package inclusions
- Page 2 acknowledgment receipt and payment history
- Page 3 terms and conditions
- Page 4 cancellation policy and signature section

The preview should support:

- PDF preview
- Page navigation
- Zoom in/out if possible
- Download button
- Edit allowed fields button
- Send or resend button depending on status

### 17.2 Preview Rule

```text
The preview must show the actual generated contract, not generic placeholder content.
```

If the contract has not been generated yet, show:

```text
No contract generated yet.
Generate a contract from the selected booking to preview it here.
```

---

## 18. Editable Contract Fields

Admins may edit only selected dynamic fields.

### 18.1 Editable Fields

Allowed editable fields:

- Client name
- Client email
- Event date
- Event time
- Check-in
- Check-out
- Total pax
- Colors
- Theme
- Package name
- Package inclusions
- Item description
- Total contract amount
- Payment schedule
- Payment remarks
- Internal notes

### 18.2 Restricted Fields

Admins must not directly edit:

- Terms and Conditions
- Venue Rules
- Cancellation Policy
- Advertisement clause
- Client Responsibility section
- Owner name
- Owner signature
- Main contract layout
- Approved footer and branding

Only Super Admin may update restricted sections through template versioning.

### 18.3 Versioning Rule

Whenever a sent contract is edited, the system must create a new version.

Example:

```text
ZION-CON-2026-0001-v1
ZION-CON-2026-0001-v2
```

A previous sent version must not be overwritten.

---

## 19. Download Contract Feature

Each generated contract should have a Download button.

### Download Rules

- Download should only be available after PDF generation.
- File should be downloaded as PDF.
- Filename should be clean and traceable.

Recommended filename:

```text
ZION-CONTRACT-{booking_reference}-{client_name}-{version}.pdf
```

Example:

```text
ZION-CONTRACT-ZION-BKG-0001-Alice-and-Bob-v1.pdf
```

---

## 20. Send Contract Feature

Admins should be able to send contracts to clients.

### Required Conditions Before Sending

Before sending, validate:

- Contract exists
- Contract is generated
- Contract has valid PDF URL or file path
- Client email exists
- Booking is not cancelled
- Contract status is not already signed
- Required payment condition is met
- n8n webhook URL is configured

If validation passes:

```text
Backend triggers n8n Contract Delivery Workflow.
```

If validation fails:

```text
Show a clear error message and do not send.
```

---

## 21. Resend Contract Fallback Feature

The Contract Management page must include a Resend button as fallback when automation or email delivery fails.

### 21.1 When Resend Button Should Show

Show Resend button only if:

```text
email_status = failed
email_status = bounced
email_status = pending
contract_status = delivery_failed
workflow_status = failed
```

Optional:

```text
Show Resend for sent contracts if Super Admin wants to send a copy again.
```

### 21.2 Who Can Resend

Recommended permissions:

| Role | Permission |
|---|---|
| Super Admin | Can resend any contract |
| Admin | Can resend assigned contracts or failed deliveries only |

### 21.3 Resend Behavior

When Resend is clicked:

```text
Admin clicks Resend Contract
        ↓
Backend validates permission
        ↓
Backend validates contract record
        ↓
Backend triggers n8n resend workflow
        ↓
n8n attempts to send contract email
        ↓
n8n returns result to backend
        ↓
Backend updates Email Logs
        ↓
Backend updates Contract status
        ↓
Backend increments resend_attempt_count
        ↓
Backend creates Audit Log
        ↓
Dashboard / Contract page updates status
```

### 21.4 Placeholder Resend Logic

If real n8n integration is not ready yet, create safe placeholder logic:

- Show loading state
- Simulate resend request
- Increment resend attempt count
- Update status to `resent_pending` or `sent`
- Create mock email log entry
- Create audit log entry
- Show success toast

Add TODO comments for real n8n webhook connection.

---

## 22. Contract Details Drawer

When admin clicks a contract or booking event, open a details drawer.

### Sections Inside Drawer

1. Contract Summary
2. Booking Summary
3. Client Details
4. Event Details
5. Package Details
6. Payment Summary
7. Contract Preview
8. Email Delivery Details
9. n8n Workflow Details
10. Contract Timeline
11. Internal Notes

### Contract Summary Should Include

- Contract number
- Contract version
- Contract status
- Template version
- Generated date
- Sent date
- Viewed date
- Signed date
- Last updated date

### Booking Summary Should Include

- Booking reference
- Booking status
- Event type
- Event date
- Assigned coordinator

### Email Delivery Details Should Include

- Recipient email
- Email subject
- Email status
- Provider message ID
- Retry count
- Last attempt timestamp
- Error message if failed
- Related email log link

### n8n Workflow Details Should Include

- Workflow name
- Workflow execution ID
- Workflow status
- Last workflow result
- Error message if failed
- Related workflow log link

---

## 23. Contract Timeline

Each contract should have a timeline.

Timeline entries should include:

- Contract generated
- Contract edited
- Contract version created
- Contract sent
- Contract delivery failed
- Contract resent
- Contract viewed
- Contract signed
- Contract superseded
- Contract cancelled
- n8n workflow triggered
- n8n workflow failed
- Admin downloaded contract

Each timeline item should include:

- Date and time
- Action
- Performed by
- Source
- Description

Recommended sources:

```text
admin
super_admin
system
n8n_workflow
client
email_provider
```

---

## 24. Database Model Plan

Use existing tables if already available. If missing, prepare or update these tables.

---

### 24.1 contracts

Suggested fields:

```text
id
contract_number
booking_id
booking_reference
client_name
client_email
event_type
event_date
package_id
package_name
template_id
template_version
contract_status
email_status
workflow_status
signature_status
contract_amount
total_paid
remaining_balance
pdf_url
html_preview
resend_attempt_count
last_sent_at
last_resend_at
signed_at
viewed_at
generated_by
sent_by
created_at
updated_at
```

---

### 24.2 contract_versions

Suggested fields:

```text
id
contract_id
version_number
template_version
snapshot_data
pdf_url
html_preview
change_summary
created_by
created_at
```

Purpose:

- Preserve previous sent versions
- Prevent accidental overwriting
- Track edits and changes

---

### 24.3 contract_templates

Suggested fields:

```text
id
template_name
template_type
template_version
event_type
html_template
static_terms_content
is_active
locked_sections
created_by
updated_by
created_at
updated_at
```

Purpose:

- Store approved contract templates
- Support different event types
- Allow future template versioning

---

### 24.4 contract_timeline

Suggested fields:

```text
id
contract_id
action
description
source
performed_by
created_at
```

---

### 24.5 contract_send_attempts

Suggested fields:

```text
id
contract_id
email_log_id
workflow_log_id
recipient_email
status
attempt_number
error_message
sent_at
created_at
```

---

## 25. Relationship With Other Modules

### 25.1 Booking Management

Booking Management is the main source of event information.

Contract Management should read:

- Booking reference
- Client details
- Event details
- Event date
- Event type
- Guest count
- Package selected
- Assigned coordinator
- Booking status

### 25.2 Payment Management

Payment Management is the source of truth for payment data.

Contract Management should read:

- Payment status
- Total contract amount
- Amount paid
- Remaining balance
- Down payment status
- Payment schedule
- Payment method
- Payment reference

Contract Management should not become a full payment CRUD page.

### 25.3 Services and Packages

Services and Packages should provide:

- Package name
- Package inclusions
- Item description
- Pax limits
- Excess pax fee
- Package price
- Event-specific package variations

### 25.4 System Logs

System Logs should record:

- Contract generated
- Contract edited
- Contract sent
- Contract delivery failed
- Contract resent
- Contract downloaded
- Contract signed
- Template updated
- n8n workflow triggered
- n8n workflow failed

### 25.5 Email Logs

Email Logs should record:

- Contract email queued
- Contract email sent
- Contract email delivered
- Contract email failed
- Contract email bounced
- Contract email retried
- Contract resend result

### 25.6 Dashboard

Dashboard should display:

- Contracts pending review
- Contracts ready to send
- Contract delivery failures
- Contracts waiting for signature
- Upcoming events without contracts

---

## 26. API Endpoint Plan

### 26.1 Contract Page Endpoints

```text
GET /api/contracts/summary
GET /api/contracts
GET /api/contracts/:id
GET /api/contracts/booking-events
GET /api/contracts/failed-delivery
GET /api/contracts/signed
```

### 26.2 Contract Generation Endpoints

```text
POST /api/contracts/generate
POST /api/contracts/:id/regenerate
POST /api/contracts/:id/finalize
```

### 26.3 Contract Edit Endpoints

```text
PATCH /api/contracts/:id
POST /api/contracts/:id/create-version
```

### 26.4 Contract File Endpoints

```text
GET /api/contracts/:id/preview
GET /api/contracts/:id/download
```

### 26.5 Contract Sending Endpoints

```text
POST /api/contracts/:id/send
POST /api/contracts/:id/resend
```

### 26.6 Contract Template Endpoints

```text
GET /api/contract-templates
GET /api/contract-templates/:id
POST /api/contract-templates
PATCH /api/contract-templates/:id
POST /api/contract-templates/:id/activate
```

Template write endpoints must be Super Admin only.

### 26.7 n8n Callback Endpoints

```text
POST /api/orchestration/contracts/generation-result
POST /api/orchestration/contracts/delivery-result
POST /api/orchestration/contracts/resend-result
POST /api/orchestration/contracts/signing-status
POST /api/orchestration/email-logs
POST /api/orchestration/workflow-logs
```

---

## 27. File Storage Plan

Generated contracts should be stored as files.

Recommended storage:

```text
Supabase Storage
```

Recommended bucket:

```text
contracts
```

Recommended file path:

```text
contracts/{booking_reference}/{contract_number}/v{version_number}.pdf
```

Example:

```text
contracts/ZION-BKG-0001/ZION-CON-2026-0001/v1.pdf
```

### Strict File Rule

```text
Do not store raw PDF files directly in the database.
Store the PDF in Supabase Storage and save only the file URL/path in the database.
```

---

## 28. Contract PDF Generation Rules

The generated contract must follow these rules:

1. Preserve the original 4-page contract layout.
2. Preserve static terms and conditions.
3. Preserve owner name and signature.
4. Replace only approved dynamic placeholders.
5. Use booking data from Booking Management.
6. Use package data from Services and Packages.
7. Use payment data from Payment Management.
8. Use approved contract template version.
9. Create a version snapshot at generation time.
10. Store generated PDF path in the database.
11. Show actual generated PDF in the preview.
12. Never send incomplete contracts automatically.

---

## 29. Layout Preservation Rules

The contract should visually match the reference PDF.

Preserve:

- Page size
- Header position
- Logo placement
- Contact details placement
- Gray table design
- Section spacing
- Event details table
- Package inclusions section
- Acknowledgment receipt layout
- Payment history table
- Terms and conditions pages
- Signature blocks
- Footer layout

Use a PDF generation method that supports accurate layout rendering.

Recommended generation options:

- HTML/CSS to PDF
- Server-side PDF generation
- Template-based PDF rendering
- PDF library with page layout control

---

## 30. Strict Validation Rules

Before generating or sending a contract, validate:

- Booking ID exists
- Booking is not cancelled
- Booking is not declined
- Client name exists
- Client email exists
- Event date exists
- Package exists
- Package inclusions exist
- Contract amount exists
- Payment summary exists
- Template exists
- Template is active
- Required placeholders have values
- PDF generation succeeds
- Contract file is stored successfully

If validation fails:

```text
Do not generate or send the contract.
Show a clear error message.
Create a workflow or audit log if needed.
```

---

## 31. Role-Based Access

### Super Admin

Can:

- View all contracts
- Generate contracts
- Edit dynamic contract fields
- Update contract templates
- Create new template versions
- Send contracts
- Resend contracts
- Download contracts
- Archive contracts
- Cancel contracts
- View full logs

### Admin

Can:

- View assigned contracts
- Generate contracts for assigned bookings
- Edit allowed dynamic fields
- Send contracts
- Resend failed contracts
- Download contracts
- View limited logs

### Restricted

Admins should not be able to:

- Edit Terms and Conditions
- Edit owner signature
- Change approved template layout
- Delete signed contracts
- Permanently delete contract history

---

## 32. Audit Logs

Create audit logs for:

- Contract generated
- Contract regenerated
- Contract edited
- Contract version created
- Contract finalized
- Contract sent
- Contract delivery failed
- Contract resent
- Contract downloaded
- Contract viewed
- Contract signed
- Contract archived
- Template updated
- Template activated
- n8n workflow triggered
- n8n workflow failed

Each audit log should include:

```text
user
role
action
module = contract
description
status
ip_address
timestamp
```

---

## 33. Email Logs Integration

When a contract email is sent or attempted, save an email log.

Email log fields:

```text
recipient_email
recipient_name
email_type = contract_link or contract_delivery
related_module = contract
related_record_id
subject
trigger_source
workflow_name
workflow_execution_id
provider_message_id
status
retry_count
last_attempt_at
sent_at
delivered_at
failed_at
error_message
email_preview
payload_summary
```

---

## 34. Workflow Logs Integration

Each n8n workflow execution should be logged.

Workflow log fields:

```text
workflow_name
workflow_execution_id
related_module = contract
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

## 35. Empty, Loading, and Error States

### Empty Booking Events State

```text
No booking events ready for contract generation.
Eligible bookings will appear here once they are confirmed or have valid payment information.
```

### Empty Contracts State

```text
No contracts generated yet.
Generate a contract from an eligible booking event to get started.
```

### Failed Delivery Empty State

```text
No failed contract deliveries.
Failed contract emails and workflow errors will appear here when action is needed.
```

### Loading State

Use skeleton rows or loading cards while data loads.

### Error State

```text
Unable to load contract data.
Please check your connection or try refreshing the page.
```

---

## 36. UI and UX Requirements

The Contract Management page must follow the existing admin dashboard design.

### Design Requirements

- Premium and professional
- Warm cream background
- Gold accent color
- Rounded cards
- Soft shadows
- Clean table layout
- Clear status badges
- Responsive design
- Mobile-friendly table scrolling
- Contract preview should be readable
- Failed delivery should be easy to identify
- Important actions should be visible but not crowded

### Recommended Status Badge Colors

| Status | Visual Style |
|---|---|
| Draft | Gray |
| Generated | Blue |
| Ready to Send | Gold |
| Sent | Green |
| Delivered | Green |
| Delivery Failed | Red |
| Bounced | Orange/Red |
| Signed | Dark Green |
| Superseded | Gray |
| Cancelled | Red |
| Manual Fallback | Amber |

---

## 37. Dashboard Integration

The dashboard should receive contract-related alerts.

Dashboard should show:

- Contracts pending review
- Contracts ready to send
- Contracts with failed delivery
- Contracts waiting for client signature
- Upcoming events without contracts

Needs Action examples:

```text
Contract delivery failed for Alice & Bob Wedding.
Contract is ready to send for Sarah's 18th Debut.
Wedding booking has no generated contract yet.
```

---

## 38. Testing Plan

Test the following:

### Contract Generation

- Generate contract from eligible booking
- Generate contract with reservation paid
- Generate contract with down payment paid
- Generate contract with full payment
- Prevent generation with incomplete booking data
- Prevent sending with missing client email

### Contract Template

- Verify Page 1 dynamic fields are replaced correctly
- Verify Page 2 payment details are replaced correctly
- Verify Page 3 terms remain unchanged
- Verify Page 4 terms and owner signature remain unchanged
- Verify layout matches the reference PDF

### Contract Editing

- Edit allowed dynamic fields
- Prevent editing locked terms
- Create new version after editing sent contract
- Preserve old contract version

### Send and Resend

- Send contract successfully
- Simulate failed send
- Resend failed contract
- Increment resend count
- Save email log
- Save workflow log
- Save audit log

### Download

- Download generated PDF
- Verify file name
- Verify correct contract version downloads

### Permissions

- Admin cannot edit template terms
- Super Admin can update template version
- Admin can resend failed contract
- Unauthorized user cannot access contract page

---

## 39. Implementation Phases

### Phase 1: Current Page Audit

Tasks:

- Review existing Contract Management page structure.
- Identify static data.
- Identify reusable components.
- Identify existing buttons, filters, modals, and tables.
- Confirm current route and layout.
- Plan minimal-safe refactor.

### Phase 2: Data Model and API Preparation

Tasks:

- Prepare contracts table.
- Prepare contract_versions table.
- Prepare contract_templates table.
- Prepare contract_timeline table.
- Prepare contract_send_attempts table.
- Add contract API endpoints.
- Add n8n callback endpoints.

### Phase 3: Booking Events Queue

Tasks:

- Load eligible bookings from Booking Management.
- Show payment summary from Payment Management.
- Show package details from Services and Packages.
- Add Generate Contract action.
- Add validation before generation.

### Phase 4: Contract Template and PDF Generation

Tasks:

- Create approved contract template based on the uploaded PDF.
- Add placeholders for dynamic fields.
- Lock static terms and owner signature.
- Generate HTML preview.
- Generate PDF.
- Store PDF in Supabase Storage.
- Save contract record.

### Phase 5: Contract Management UI

Tasks:

- Add summary cards.
- Add filters.
- Add tabs.
- Add contracts table.
- Add preview drawer.
- Add edit drawer.
- Add status badges.
- Add empty/loading/error states.

### Phase 6: n8n Orchestration

Tasks:

- Prepare contract generation workflow.
- Prepare contract delivery workflow.
- Prepare contract resend workflow.
- Prepare callback endpoints.
- Save email logs and workflow logs.
- Update contract statuses.

### Phase 7: Audit and Dashboard Integration

Tasks:

- Add audit logs for all important actions.
- Connect failed deliveries to System Logs.
- Connect contract alerts to Dashboard Needs Action.
- Connect contract status summary to dashboard.

### Phase 8: Final Testing and Polish

Tasks:

- Test end-to-end generation.
- Test sending and resending.
- Test PDF layout.
- Test permissions.
- Test responsiveness.
- Polish UI spacing and statuses.

---

## 40. Final Checklist

| Requirement | Status |
|---|---|
| Current Contract Management structure reviewed | Pending |
| Static data identified and removed | Pending |
| Booking Events tab implemented | Pending |
| Contracts tab implemented | Pending |
| Failed Delivery tab implemented | Pending |
| Contract template based on uploaded PDF created | Pending |
| Static terms locked | Pending |
| Owner name and signature preserved | Pending |
| Dynamic placeholders implemented | Pending |
| Contract generation validation implemented | Pending |
| PDF preview implemented | Pending |
| PDF download implemented | Pending |
| Contract edit drawer implemented | Pending |
| Contract versioning implemented | Pending |
| Send contract through n8n prepared | Pending |
| Resend fallback prepared | Pending |
| Email Logs integration implemented | Pending |
| Workflow Logs integration implemented | Pending |
| Audit Logs integration implemented | Pending |
| Dashboard alerts integration prepared | Pending |
| Role-based access implemented | Pending |
| Empty/loading/error states implemented | Pending |
| Final UI polish completed | Pending |

---

## 41. Final Rule

The Contract Management page must become a real, booking-driven contract operations page.

It must not display static contracts.

Every generated contract must be based on:

```text
Booking Management data
Payment Management data
Services and Packages data
Approved Contract Template
n8n workflow results
Email delivery logs
Audit logs
```

The contract layout and static legal/terms sections must remain aligned with the uploaded reference contract PDF.

Only approved dynamic fields should be replaced automatically.

The system must support manual admin fallback through preview, edit, download, send, and resend features without breaking the integrity of the original contract template.
