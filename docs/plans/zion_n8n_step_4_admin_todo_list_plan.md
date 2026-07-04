# Codex Implementation Plan: n8n Step 4 — Generate and Save Admin To-Do List
## Zion Events Place and Management System

---

## 1. Purpose

This document provides a complete, concrete, professional, and secure implementation plan for **Step 4** of the Zion n8n orchestration workflow.

The current n8n workflow already performs these steps:

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
        ↓
Booking Email Status Updated
```

This Step 4 focuses on:

```text
Generate Admin To-Do List
        ↓
Save Admin To-Do List to Backend
        ↓
Prepare workflow for Admin Notification
```

The Admin To-Do List will help Zion Events Place admins manage the specific event from the beginning of the booking process until the event is completed.

---

## 2. Main Objective

After this step, the system must be able to:

1. Generate a structured Admin To-Do List based on the booking details.
2. Include universal booking tasks for every event.
3. Add event-specific tasks depending on the event type.
4. Assign task priorities, categories, status, and due dates.
5. Save the generated tasks to the backend.
6. Link the tasks to the correct booking record.
7. Protect the backend endpoint using the orchestration API key.
8. Return a clean response after tasks are created.
9. Prepare the workflow for the next step: Admin Notification.

---

## 3. Correct n8n Placement

Insert Step 4 after:

```text
Update Zion Booking Email Status
```

and before the final response node.

Correct flow:

```text
Update Zion Booking Email Status
        ↓
Generate Zion Admin To-Do List
        ↓
Save Zion Admin To-Do List
        ↓
Return Zion Booking Orchestration Success
```

Full Step 4 position inside the workflow:

```text
Zion Booking Webhook
        ↓
Validate Zion Booking Request
        ↓
Authorized Request?
        ↓
Fetch Booking Details
        ↓
Normalize Zion Booking Details
        ↓
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
Generate Zion Admin To-Do List
        ↓
Save Zion Admin To-Do List
        ↓
Return Zion Booking Orchestration Success
```

---

## 4. Required n8n Nodes

Add these nodes:

```text
1. Code Node: Generate Zion Admin To-Do List
2. HTTP Request Node: Save Zion Admin To-Do List
3. Respond to Webhook Node: Return Zion Booking Orchestration Success
```

Recommended node names:

```text
Generate Zion Admin To-Do List
Save Zion Admin To-Do List
Return Zion Booking Orchestration Success
```

---

## 5. Source Data Requirement

The To-Do List must use the booking data from:

```text
Prepare Zion Booking Receipt Email
```

Use this expression to access the booking data:

```js
$('Prepare Zion Booking Receipt Email').first().json.booking
```

Strict rule:

```text
Do not generate tasks from unverified frontend payload.
Use the normalized booking details that were already fetched from the protected backend endpoint.
```

---

## 6. Code Node: Generate Zion Admin To-Do List

Add a Code node named:

```text
Generate Zion Admin To-Do List
```

Purpose:

```text
Generate a structured list of admin tasks based on the verified booking information.
```

Paste this code inside the n8n Code node:

```js
const source = $('Prepare Zion Booking Receipt Email').first().json;
const booking = source.booking;

if (!booking) {
  return [
    {
      json: {
        success: false,
        message: "Missing booking data for admin To-Do generation."
      }
    }
  ];
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function task(title, description, priority, dueInDays, category) {
  return {
    title,
    description,
    priority,
    status: "pending",
    category,
    dueDate: addDays(dueInDays),
    assignedToRole: "admin"
  };
}

const eventType = String(booking.event?.type || "").toLowerCase();

const tasks = [
  task(
    "Review submitted booking details",
    `Review the full booking details for ${booking.booking_reference}. Check client information, event type, date, time, guest count, package, and special requests.`,
    "high",
    1,
    "booking_review"
  ),
  task(
    "Check calendar availability and schedule conflict",
    `Verify if ${booking.event.date} from ${booking.event.start_time} to ${booking.event.end_time} is available and has no conflict with existing events.`,
    "high",
    1,
    "calendar"
  ),
  task(
    "Verify selected package and guest count",
    `Confirm that ${booking.package.name} is suitable for ${booking.event.guest_count} pax and check if excess pax fees apply.`,
    "normal",
    1,
    "package"
  ),
  task(
    "Review client special requests",
    `Review special requests: ${booking.event.special_requests || "None"}. Confirm if they are possible and if additional charges are needed.`,
    "normal",
    2,
    "client_request"
  ),
  task(
    "Prepare draft contract",
    `Prepare the contract draft using booking reference ${booking.booking_reference}, selected package, event date, and payment breakdown.`,
    "high",
    2,
    "contract"
  ),
  task(
    "Confirm payment instructions",
    `Confirm payment terms with the client. Down payment required: ${booking.package.down_payment_formatted}. Remaining balance: ${booking.package.remaining_balance_formatted}.`,
    "high",
    2,
    "payment"
  ),
  task(
    "Contact client for booking confirmation",
    `Contact ${booking.client.name} through ${booking.client.email} or ${booking.client.contact} to confirm the booking request and next steps.`,
    "high",
    1,
    "client_follow_up"
  ),
  task(
    "Assign event handler or coordinator",
    "Assign an admin, coordinator, or team member who will monitor this booking from preparation until event completion.",
    "normal",
    3,
    "team_assignment"
  ),
  task(
    "Create event preparation checklist",
    "Create a detailed preparation checklist for setup, suppliers, food, venue, staff, and client requirements.",
    "normal",
    3,
    "event_preparation"
  ),
  task(
    "Monitor payment deadline",
    "Track payment status and make sure the client is reminded before the payment deadline.",
    "normal",
    7,
    "payment_monitoring"
  )
];

if (eventType.includes("wedding")) {
  tasks.push(
    task(
      "Confirm wedding setup requirements",
      "Confirm ceremony or reception setup, aisle arrangement, seating layout, and styling requirements.",
      "normal",
      3,
      "wedding"
    ),
    task(
      "Review wedding theme and color motif",
      `Review theme: ${booking.event.theme}. Review colors: ${booking.event.colors}.`,
      "normal",
      3,
      "wedding"
    ),
    task(
      "Prepare wedding coordination checklist",
      "Prepare checklist for entourage, program flow, suppliers, photo/video, host, and OTD coordination.",
      "normal",
      4,
      "wedding"
    )
  );
}

if (eventType.includes("birthday") || eventType.includes("debut")) {
  tasks.push(
    task(
      "Confirm celebrant and program details",
      "Confirm celebrant name, age, program flow, theme, stage/backdrop needs, and host requirements.",
      "normal",
      3,
      "birthday_debut"
    ),
    task(
      "Review party setup requirements",
      "Check table layout, sound system, styling, food setup, and guest seating arrangement.",
      "normal",
      4,
      "birthday_debut"
    )
  );
}

if (eventType.includes("christening")) {
  tasks.push(
    task(
      "Confirm christening reception details",
      "Confirm child name, family seating, reception flow, food setup, and guest count.",
      "normal",
      3,
      "christening"
    )
  );
}

if (
  eventType.includes("christmas") ||
  eventType.includes("corporate") ||
  eventType.includes("reunion")
) {
  tasks.push(
    task(
      "Confirm group event program flow",
      "Confirm group or company name, program schedule, audio/video needs, food setup, and table layout.",
      "normal",
      3,
      "group_event"
    )
  );
}

const todoPayload = {
  relatedModule: "booking",
  relatedRecordId: booking.booking_id,
  bookingReference: booking.booking_reference,
  source: "n8n_workflow",
  workflowName: "Zion - New Booking Orchestration",
  workflowExecutionId: $execution.id,
  eventType: booking.event.type,
  clientName: booking.client.name,
  tasks
};

return [
  {
    json: {
      success: true,
      booking,
      taskCount: tasks.length,
      tasks,
      todoPayload
    }
  }
];
```

Expected output:

```json
{
  "success": true,
  "taskCount": 13,
  "tasks": []
}
```

---

## 7. Admin To-Do Task Structure

Each task should contain:

```text
title
description
priority
status
category
dueDate
assignedToRole
```

Allowed priority values:

```text
low
normal
high
urgent
```

Default task status:

```text
pending
```

Recommended task categories:

```text
booking_review
calendar
package
client_request
contract
payment
client_follow_up
team_assignment
event_preparation
payment_monitoring
wedding
birthday_debut
christening
group_event
```

---

## 8. Required Backend Endpoint

Create or verify this backend endpoint:

```text
POST /api/orchestration/tasks/bulk-create
```

For Next.js App Router, suggested file path:

```text
app/api/orchestration/tasks/bulk-create/route.ts
```

or:

```text
src/app/api/orchestration/tasks/bulk-create/route.ts
```

---

## 9. n8n HTTP Request Node: Save Zion Admin To-Do List

Add an HTTP Request node named:

```text
Save Zion Admin To-Do List
```

Method:

```text
POST
```

URL:

```text
http://host.docker.internal:3000/api/orchestration/tasks/bulk-create
```

Headers:

```text
Content-Type: application/json
x-api-key: {{$env.BOOKING_ORCHESTRATION_API_KEY}}
x-zion-source: n8n
x-zion-workflow: Zion - New Booking Orchestration
```

Body settings:

```text
Send Body: ON
Body Content Type: JSON
Specify Body: Using JSON
```

JSON body:

```js
{{ JSON.stringify($json.todoPayload) }}
```

If the backend expects direct JSON and not stringified JSON, use this body instead:

```json
{
  "relatedModule": "{{ $json.todoPayload.relatedModule }}",
  "relatedRecordId": "{{ $json.todoPayload.relatedRecordId }}",
  "bookingReference": "{{ $json.todoPayload.bookingReference }}",
  "source": "{{ $json.todoPayload.source }}",
  "workflowName": "{{ $json.todoPayload.workflowName }}",
  "workflowExecutionId": "{{ $json.todoPayload.workflowExecutionId }}",
  "eventType": "{{ $json.todoPayload.eventType }}",
  "clientName": "{{ $json.todoPayload.clientName }}",
  "tasks": "{{ $json.todoPayload.tasks }}"
}
```

Preferred method:

```text
Use the expression body: {{ JSON.stringify($json.todoPayload) }}
```

---

## 10. Backend Security Requirements

The `bulk-create` endpoint must be protected.

Strict rules:

1. Accept only `POST`.
2. Require the `x-api-key` header.
3. Compare `x-api-key` with `process.env.BOOKING_ORCHESTRATION_API_KEY`.
4. Return `401` if the API key is missing.
5. Return `401` if the API key is invalid.
6. Do not expose the correct API key in logs or responses.
7. Do not allow public frontend users to create tasks through this endpoint.
8. Validate that the request contains a booking reference.
9. Validate that the request contains a related booking record ID.
10. Validate that `tasks` is an array.
11. Return JSON only.
12. Do not return HTML error pages.

---

## 11. Backend Request Body Validation

Required fields:

```text
relatedModule
relatedRecordId
bookingReference
source
workflowName
workflowExecutionId
tasks
```

Optional fields:

```text
eventType
clientName
```

Each task must have:

```text
title
description
priority
status
category
dueDate
assignedToRole
```

If `tasks` is missing:

```json
{
  "success": false,
  "error": "tasks is required."
}
```

If `tasks` is not an array:

```json
{
  "success": false,
  "error": "tasks must be an array."
}
```

If booking is not found:

```json
{
  "success": false,
  "error": "Booking not found."
}
```

---

## 12. Database Model Plan

If the system does not yet have an admin tasks table, create one.

Suggested model:

```prisma
model AdminTask {
  id                  String    @id @default(cuid())
  relatedModule       String
  relatedRecordId     String
  bookingReference    String?
  title               String
  description         String?
  priority            String    @default("normal")
  status              String    @default("pending")
  category            String?
  dueDate             DateTime?
  assignedToRole      String?
  assignedToUserId    String?
  source              String?
  workflowName        String?
  workflowExecutionId String?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
}
```

If the system already has an existing tasks table, use the current table and field conventions instead of creating a duplicate table.

---

## 13. Duplicate Task Prevention

The endpoint should prevent duplicate task creation for the same workflow execution.

Recommended duplicate prevention rule:

```text
relatedRecordId + workflowExecutionId + title must be unique or checked before insert.
```

If the same workflow execution already created tasks for the booking, return:

```json
{
  "success": true,
  "message": "Admin To-Do List already exists for this workflow execution.",
  "data": {
    "createdCount": 0,
    "skippedDuplicate": true
  }
}
```

Reason:

```text
This prevents duplicate tasks if n8n is executed multiple times for the same booking.
```

---

## 14. Suggested Backend Response

Success response:

```json
{
  "success": true,
  "message": "Admin To-Do List created successfully.",
  "data": {
    "bookingReference": "ZION-DEMO-0003",
    "createdCount": 13,
    "taskIds": ["task_1", "task_2"]
  }
}
```

Validation error:

```json
{
  "success": false,
  "error": "tasks must be an array."
}
```

Unauthorized error:

```json
{
  "success": false,
  "error": "Missing orchestration API key."
}
```

---

## 15. System Logs Requirement

After successful task creation, create a System Log if the system already supports logs.

Recommended log action:

```text
admin_todo_list_created
```

Recommended log payload:

```json
{
  "module": "admin_tasks",
  "action": "admin_todo_list_created",
  "bookingReference": "ZION-DEMO-0003",
  "taskCount": 13,
  "source": "n8n_workflow"
}
```

Do not log:

- API keys
- Full request headers
- SMTP credentials
- Secrets
- Sensitive private client data that is not needed

---

## 16. Dashboard and Admin Panel Integration

The saved To-Do List should become visible in the Admin Panel.

Recommended locations:

```text
Booking Details page
Dashboard Needs Action section
Admin To-Do / Task Management component
Calendar event preparation view
```

For each booking, admins should see:

```text
Pending tasks
Completed tasks
High priority tasks
Due today
Overdue tasks
Assigned admin or role
```

Strict rule:

```text
The generated To-Do List must be linked to the booking record.
```

---

## 17. Final Response Node Update

After `Save Zion Admin To-Do List`, update the final Respond to Webhook node.

Node name:

```text
Return Zion Booking Orchestration Success
```

Response code:

```text
200
```

Response body:

```json
{
  "success": true,
  "message": "Zion booking orchestration completed successfully. Receipt email was sent, email log was saved, booking email status was updated, and admin To-Do list was created.",
  "bookingReference": "{{ $('Prepare Zion Booking Receipt Email').first().json.booking.booking_reference }}",
  "emailStatus": "sent",
  "taskCount": "{{ $('Generate Zion Admin To-Do List').first().json.taskCount }}"
}
```

---

## 18. Testing Procedure

### Test A: Generate To-Do List Node

1. Open `Generate Zion Admin To-Do List`.
2. Click `Execute step`.
3. Confirm `success = true`.
4. Confirm `taskCount` is greater than 0.
5. Confirm tasks have title, description, priority, status, category, dueDate, and assignedToRole.

### Test B: Save To-Do List Endpoint

1. Open `Save Zion Admin To-Do List`.
2. Confirm URL is correct.
3. Confirm `x-api-key` header exists.
4. Confirm body sends `todoPayload`.
5. Click `Execute step`.
6. Expected result: tasks created successfully.

### Test C: Missing API Key

1. Temporarily remove `x-api-key`.
2. Execute the node.
3. Expected result: `401 Missing orchestration API key.`

### Test D: Duplicate Run

1. Execute the same workflow twice for the same booking.
2. Confirm duplicate tasks are prevented or handled safely.

### Test E: Admin Panel Check

1. Open the related booking in Admin Panel.
2. Confirm the generated tasks are visible.
3. Confirm tasks are linked to the correct booking.

---

## 19. High-Security Checklist

Before marking Step 4 complete, verify:

1. The backend endpoint requires `x-api-key`.
2. The API key is stored only in `.env`.
3. The API key is not exposed to the frontend.
4. The API key is not logged.
5. Tasks are created only by n8n or backend automation.
6. Public users cannot create admin tasks.
7. The endpoint validates `tasks`.
8. The endpoint validates the booking record.
9. Duplicate tasks are prevented.
10. System Logs do not expose sensitive data.
11. The final response does not include private client-sensitive data.
12. All responses are JSON.

---

## 20. Common Errors and Fixes

### 404 Not Found

Meaning:

```text
POST /api/orchestration/tasks/bulk-create does not exist.
```

Fix:

```text
Create the backend route.
```

### Missing Orchestration API Key

Meaning:

```text
x-api-key is missing or incorrect.
```

Fix:

```text
Add x-api-key header using BOOKING_ORCHESTRATION_API_KEY value.
```

### tasks is required

Meaning:

```text
The request body does not contain tasks in the expected format.
```

Fix:

```text
Check the JSON body format in n8n.
```

### Booking not found

Meaning:

```text
relatedRecordId is incorrect or booking does not exist.
```

Fix:

```text
Verify booking.booking_id from Prepare Zion Booking Receipt Email node.
```

---

## 21. Deployment Reminder

The current local key:

Use the current `BOOKING_ORCHESTRATION_API_KEY` value from the app `.env.local` file. Do not paste old placeholder keys into the n8n workflow.

is only for local testing.

Before production:

1. Generate a long random production key.
2. Update `BOOKING_ORCHESTRATION_API_KEY` in production backend environment variables.
3. Update the n8n production workflow header.
4. Do not commit keys to GitHub.
5. Rotate keys if exposed.

---

## 22. Final Acceptance Criteria

Step 4 is complete if:

1. n8n generates admin tasks from verified booking data.
2. Tasks include universal booking tasks.
3. Tasks include event-specific tasks.
4. Tasks have priority, status, category, due date, and assigned role.
5. n8n saves tasks to the backend.
6. Tasks are linked to the correct booking.
7. Duplicate tasks are prevented.
8. The backend route is protected with `x-api-key`.
9. Tasks appear in the Admin Panel or are available through backend data.
10. The workflow proceeds to the final success response.

---

## 23. Final Instruction for Codex

Implement Step 4 only.

Create or verify the protected backend endpoint:

```text
POST /api/orchestration/tasks/bulk-create
```

Ensure it accepts the generated n8n To-Do List payload, validates all required fields, creates admin tasks linked to the booking, prevents duplicates, logs the action safely, and returns a clean JSON response.

Do not modify unrelated modules.

Do not break the existing booking, email sending, email logging, or booking email status update flow.
