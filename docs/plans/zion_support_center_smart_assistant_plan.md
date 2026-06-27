# Support Center and Smart Assistant Knowledge Base Plan
## Zion Events Place and Management System

---

## 1. Purpose

This document provides a concise, concrete, professional, and implementation-ready plan for the **Support Center** page in the Admin Panel.

The Support Center will serve as the centralized knowledge base for:

- Client Panel FAQ page
- Smart Assistant responses
- Common client questions
- Package and booking guidance
- Payment, contract, schedule, and venue rules
- Admin-managed help content

This page will be the official source of truth for what the Smart Assistant can answer.

---

## 2. Main Objective

The Support Center page should allow Super Admin and Admin users to manage the answers that will appear in the Client Panel FAQ page and be used by the Smart Assistant.

The module should support:

1. Creating FAQ entries.
2. Editing FAQ entries.
3. Updating Smart Assistant knowledge.
4. Controlling which answers appear on the Client Panel FAQ page.
5. Controlling which answers the Smart Assistant can use.
6. Organizing help content by category.
7. Testing the Smart Assistant response before publishing.
8. Tracking unanswered questions.
9. Updating outdated information.
10. Recording changes in System Logs.

---

## 3. Current Page Review Requirement

Before overhauling the Support Center page, review the current existing page structure.

Review:

- Existing Support Center route
- Existing UI layout
- Existing static FAQ data
- Existing cards, tables, modals, and buttons
- Existing search and filter components
- Existing sidebar active state
- Existing admin page styling
- Existing Smart Assistant references, if any
- Existing FAQ page connection, if any

Strict rule:

```text
Do not delete or rewrite the current Support Center blindly.
First identify reusable UI components, existing styles, and existing logic.
Then replace static content with real database-driven content.
```

---

## 4. Core System Rule

The Support Center must be the source of truth for the Smart Assistant.

Strict rule:

```text
The Smart Assistant must only answer using approved knowledge entries created or approved by the Super Admin.
```

The Smart Assistant may rephrase the answer naturally, but it must not invent information that is not found in the approved knowledge base.

Correct behavior:

```text
Super Admin adds answer
        ↓
Answer is approved and published
        ↓
FAQ page displays the answer, if client-visible
        ↓
Smart Assistant can use the answer, if assistant-enabled
```

Wrong behavior:

```text
Smart Assistant guesses answers about prices, payments, contracts, rules, or availability without approved knowledge.
```

---

## 5. Connection to Client Panel FAQ Page

The Support Center must be directly connected to the Client Panel FAQ page.

Strict rule:

```text
Any FAQ marked as client-visible and published in the Support Center must automatically appear on the Client Panel FAQ page.
```

Client FAQ page should only display entries where:

```text
status = published
client_visible = true
```

If a FAQ entry is hidden or archived in the Admin Panel, it must no longer appear on the Client Panel FAQ page.

---

## 6. Connection to Smart Assistant

The Smart Assistant should use Support Center entries as its knowledge source.

The Smart Assistant should only use entries where:

```text
status = published
assistant_enabled = true
```

If an answer is edited by Super Admin, the Smart Assistant should use the updated answer.

If an answer is hidden, archived, or disabled from assistant use, the Smart Assistant must stop using it.

---

## 7. Recommended Page Structure

Admin route:

```text
/admin/support
```

Sidebar label:

```text
Support Center
```

Page title:

```text
Support Center
```

Page subtitle:

```text
Manage FAQ content, Smart Assistant knowledge, client help answers, and support guidance.
```

Recommended tabs:

```text
FAQ Knowledge Base
Smart Assistant Training
Unanswered Questions
Categories
Analytics
```

---

## 8. FAQ Knowledge Base Tab

This tab manages all FAQ and help entries.

Each entry should include:

- Question
- Approved answer
- Category
- Tags
- Related module
- Client visibility
- Smart Assistant visibility
- Status
- Last updated date
- Updated by
- Actions

Recommended statuses:

```text
draft
published
hidden
archived
needs_review
```

Recommended actions:

- View
- Edit
- Publish
- Hide
- Archive
- Enable for Smart Assistant
- Disable for Smart Assistant
- Preview on Client FAQ
- Test with Smart Assistant

---

## 9. Add FAQ / Knowledge Entry Feature

Add a button:

```text
+ Add FAQ Entry
```

Form fields:

- Question
- Answer
- Category
- Tags
- Related module
- Client visible toggle
- Assistant enabled toggle
- Status
- Priority
- Internal notes

Recommended related modules:

```text
booking
packages
payments
contracts
calendar
venue
inquiries
testimonies
general
```

Strict rule:

```text
An entry must not be used by the Smart Assistant unless it is published and assistant_enabled = true.
```

---

## 10. FAQ Categories

Support Center should organize entries by category.

Recommended categories:

- Booking Process
- Event Packages
- Payment and Down Payment
- Contract and Signing
- Venue Rules
- Schedule and Availability
- Ocular Visit
- Cancellation and Reschedule
- Client Requirements
- Food and Catering
- Rooms and Amenities
- Contact and Inquiry

Super Admin can:

- Add category
- Edit category
- Hide category
- Reorder categories
- Archive category

Strict rule:

```text
Archived categories should not appear on the Client FAQ page.
```

---

## 11. Smart Assistant Training Tab

This tab should not train an AI model directly. Instead, it should manage the approved knowledge used by the assistant.

Recommended title:

```text
Smart Assistant Knowledge
```

Purpose:

```text
Control what the Smart Assistant is allowed to answer.
```

Features:

1. View all assistant-enabled entries.
2. Search approved answers.
3. Test a sample client question.
4. Show which FAQ entry was used as the answer source.
5. Show confidence or match score.
6. Show fallback response if no matching entry exists.
7. Allow Super Admin to edit the source entry.
8. Allow Super Admin to add a new answer for unanswered questions.

---

## 12. Smart Assistant Answer Logic

Recommended assistant flow:

```text
Client asks question
        ↓
System searches published assistant-enabled knowledge entries
        ↓
If a strong match is found, assistant answers using that entry
        ↓
If no strong match is found, assistant uses fallback response
        ↓
Unanswered question is saved for admin review
```

Strict fallback rule:

```text
If the Smart Assistant cannot find an approved answer, it must not guess.
```

Fallback response example:

```text
I’m not fully sure about that yet. Please contact Zion Events Place directly or send an inquiry so the team can assist you properly.
```

Optional improvement:

```text
Create an inquiry automatically if the user wants admin assistance.
```

---

## 13. Smart Assistant Response Rules

The assistant may:

- Rephrase approved answers
- Summarize long answers
- Suggest related FAQ topics
- Ask clarifying questions
- Direct the client to inquiry form or booking page

The assistant must not:

- Invent prices
- Invent availability
- Invent package inclusions
- Invent payment rules
- Invent cancellation rules
- Invent contract terms
- Give legal guarantees
- Promise confirmed bookings without admin approval
- Answer from hidden or archived FAQ entries

---

## 14. Unanswered Questions Tab

This tab should collect questions that the Smart Assistant could not confidently answer.

Fields:

- Question asked
- Date asked
- Source page
- Suggested category
- Match confidence
- Status
- Admin action

Recommended statuses:

```text
new
reviewed
answered
converted_to_faq
ignored
```

Actions:

- Create FAQ from question
- Link to existing FAQ
- Mark reviewed
- Ignore
- Archive

Purpose:

```text
This helps Super Admin improve the Smart Assistant over time.
```

---

## 15. Client FAQ Page Behavior

Client route example:

```text
/faq
```

The FAQ page should display published client-visible entries.

Client FAQ features:

- Search
- Category filter
- FAQ accordion
- Popular questions
- Related questions
- Contact Us button if question is not answered
- Ask Smart Assistant button, if available

Strict rule:

```text
The Client FAQ page must not use hardcoded FAQ data.
It must load published entries from the Support Center.
```

---

## 16. Home Page and Contact Page Integration

The Home page and Contact Us page may show selected FAQ entries.

Recommended behavior:

- Show popular FAQs
- Show package-related FAQs
- Show payment-related FAQs
- Link to full FAQ page
- Link to inquiry form if the client needs more help

Only show entries where:

```text
status = published
client_visible = true
```

---

## 17. Admin Table and Filters

The Support Center table should include filters for:

- Search question or answer
- Category
- Status
- Client visibility
- Assistant visibility
- Related module
- Updated by
- Last updated date

Recommended columns:

| Column | Description |
|---|---|
| Question | FAQ question |
| Category | FAQ category |
| Related Module | Booking, Payment, Contract, etc. |
| Client Visible | Visible or hidden on Client FAQ |
| Assistant Enabled | Used or not used by Smart Assistant |
| Status | Draft, Published, Hidden, Archived |
| Updated By | Last admin who edited |
| Last Updated | Last update timestamp |
| Actions | View, Edit, Publish, Hide, Archive, Test |

---

## 18. Version History

Every major edit should create a version history record.

Track:

- Old question
- Old answer
- New question
- New answer
- Changed by
- Change summary
- Date changed

Strict rule:

```text
Do not silently overwrite important FAQ or assistant knowledge without version history.
```

---

## 19. Approval and Publishing Rules

Recommended workflow:

```text
Draft → Published → Hidden / Archived
```

Rules:

1. Draft entries are visible only in Admin Panel.
2. Published + client_visible entries appear on Client FAQ.
3. Published + assistant_enabled entries can be used by Smart Assistant.
4. Hidden entries do not appear publicly but remain editable.
5. Archived entries are preserved for history but inactive.
6. Super Admin can publish, hide, or archive entries.
7. Admin can suggest edits if permissions are limited.

---

## 20. Analytics Tab

Support Center should show useful analytics.

Recommended metrics:

- Total FAQ entries
- Published FAQs
- Draft FAQs
- Assistant-enabled entries
- Most viewed FAQs
- Most searched keywords
- Unanswered questions count
- Categories with missing answers
- Most used assistant answers
- Frequently asked topics

Purpose:

```text
Help Zion Events Place understand what clients commonly ask.
```

---

## 21. Notifications

When a new unanswered Smart Assistant question is recorded:

- Create a low-priority admin notification.
- Do not create noisy alerts.
- Do not send external notifications.
- Show only inside Admin Panel.

Notification example:

```text
A new unanswered client question needs review.
```

Priority:

```text
low
```

---

## 22. System Logs Integration

Create System Logs for:

- FAQ entry created
- FAQ entry edited
- FAQ entry published
- FAQ entry hidden
- FAQ entry archived
- FAQ category created
- FAQ category edited
- Smart Assistant entry enabled
- Smart Assistant entry disabled
- Unanswered question converted to FAQ
- FAQ shown on Client Panel
- Assistant answer tested

Each log should include:

```text
user
role
action
module = support_center
description
status
ip_address
timestamp
```

---

## 23. Database Model Plan

### support_faq_entries

```text
id
question
answer
category_id
tags
related_module
status
client_visible
assistant_enabled
priority
view_count
last_used_by_assistant_at
created_by
updated_by
created_at
updated_at
```

### support_categories

```text
id
name
slug
description
display_order
status
client_visible
created_by
updated_by
created_at
updated_at
```

### support_faq_versions

```text
id
faq_entry_id
old_question
old_answer
new_question
new_answer
change_summary
changed_by
created_at
```

### assistant_unanswered_questions

```text
id
question
source_page
suggested_category
match_confidence
status
converted_faq_id
created_at
updated_at
```

### assistant_test_logs

```text
id
test_question
matched_faq_id
response_preview
match_confidence
tested_by
created_at
```

---

## 24. API Endpoint Plan

### Admin Support Center

```text
GET /api/admin/support/faqs
GET /api/admin/support/faqs/:id
POST /api/admin/support/faqs
PATCH /api/admin/support/faqs/:id
PATCH /api/admin/support/faqs/:id/publish
PATCH /api/admin/support/faqs/:id/hide
PATCH /api/admin/support/faqs/:id/archive
PATCH /api/admin/support/faqs/:id/assistant-toggle
PATCH /api/admin/support/faqs/:id/client-visibility
```

### Categories

```text
GET /api/admin/support/categories
POST /api/admin/support/categories
PATCH /api/admin/support/categories/:id
PATCH /api/admin/support/categories/:id/archive
```

### Smart Assistant

```text
POST /api/admin/support/assistant/test
GET /api/admin/support/assistant/unanswered
POST /api/admin/support/assistant/unanswered/:id/convert-to-faq
PATCH /api/admin/support/assistant/unanswered/:id/ignore
```

### Client FAQ

```text
GET /api/client/faqs
GET /api/client/faqs/popular
GET /api/client/faqs/categories
```

### Client Smart Assistant

```text
POST /api/client/assistant/ask
```

---

## 25. Role-Based Access

### Super Admin

Can:

- Create FAQ entries
- Edit FAQ entries
- Publish FAQ entries
- Hide and archive FAQ entries
- Manage categories
- Enable or disable assistant usage
- Enable or disable client visibility
- Convert unanswered questions into FAQs
- View analytics
- View version history

### Admin

Can:

- View FAQ entries
- Suggest edits, if implemented
- Test Smart Assistant responses
- View unanswered questions
- Convert unanswered questions to draft, if allowed

### Public Client

Can:

- View published client-visible FAQs
- Search FAQs
- Ask the Smart Assistant
- Submit inquiry if answer is not available

---

## 26. UI and UX Requirements

The Support Center page should follow Zion admin styling:

- Warm cream background
- Gold accent
- Rounded cards
- Soft shadows
- Clean table layout
- Clear status badges
- Search and filters
- Details drawer
- Edit modal or drawer
- Smart Assistant test panel
- Version history drawer
- Empty, loading, and error states

Recommended badges:

| State | Style |
|---|---|
| Published | Green |
| Draft | Gray |
| Hidden | Amber |
| Archived | Dark Gray |
| Client Visible | Blue |
| Assistant Enabled | Purple |
| Needs Review | Red/Amber |

---

## 27. Empty, Loading, and Error States

### Empty FAQ State

```text
No FAQ entries yet.
Create your first support answer to help clients and train the Smart Assistant.
```

### Empty Unanswered Questions State

```text
No unanswered questions yet.
The Smart Assistant is currently finding approved answers successfully.
```

### Error State

```text
Unable to load support content.
Please refresh the page or try again.
```

---

## 28. Strict Conditions

1. Support Center is the source of truth for FAQ and Smart Assistant answers.
2. Smart Assistant must only use published and assistant-enabled entries.
3. Client FAQ page must only show published and client-visible entries.
4. Hidden or archived entries must not appear on Client Panel.
5. Smart Assistant must not invent prices, rules, package inclusions, or policies.
6. If there is no approved answer, Smart Assistant must use fallback response.
7. Every important change must create System Logs.
8. Important edits must create version history.
9. Super Admin controls publishing and visibility.
10. Client Panel FAQ must not use hardcoded data.
11. Smart Assistant testing must show the source FAQ used.
12. Unanswered client questions must be saved for admin review.

---

## 29. Testing Plan

Test the following:

1. Super Admin can create FAQ entry.
2. Draft FAQ does not appear on Client FAQ page.
3. Published and client-visible FAQ appears on Client FAQ page.
4. Hidden FAQ disappears from Client FAQ page.
5. Assistant-enabled FAQ can be used by Smart Assistant.
6. Disabled FAQ is not used by Smart Assistant.
7. Smart Assistant answers using approved FAQ content.
8. Smart Assistant does not answer unsupported questions with invented details.
9. Unsupported questions are saved in Unanswered Questions.
10. Super Admin can convert unanswered question to FAQ.
11. Edited FAQ creates version history.
12. FAQ category filtering works.
13. Client FAQ search works.
14. System Logs record FAQ and assistant changes.
15. Home or Contact page FAQ previews show only published entries.

---

## 30. Implementation Phases

### Phase 1: Review Current Page

- Review existing Support Center page.
- Identify static FAQ/help content.
- Preserve reusable UI components.
- Replace static data with backend-driven data.

### Phase 2: FAQ Knowledge Base

- Create FAQ entries table.
- Create categories table.
- Add CRUD actions.
- Add visibility and publishing controls.
- Add search and filters.

### Phase 3: Client FAQ Integration

- Add public FAQ endpoints.
- Connect Client FAQ page to Support Center entries.
- Remove hardcoded client FAQ data.
- Add search and category filters.

### Phase 4: Smart Assistant Knowledge

- Add assistant-enabled control.
- Add assistant answer lookup.
- Add fallback behavior.
- Add assistant test panel.
- Add unanswered questions tracking.

### Phase 5: Logs, Versions, and Analytics

- Add version history.
- Add System Logs integration.
- Add analytics tab.
- Add low-priority notifications for unanswered questions.

### Phase 6: Testing and Polish

- Test admin CRUD.
- Test Client FAQ updates.
- Test Smart Assistant answers.
- Test fallback behavior.
- Polish UI and responsiveness.

---

## 31. Final Acceptance Criteria

The Support Center page is complete if:

1. Super Admin can create, edit, publish, hide, and archive FAQ entries.
2. Client FAQ page uses Support Center data.
3. Smart Assistant uses only approved Support Center data.
4. Smart Assistant does not invent unsupported answers.
5. Admin can test Smart Assistant responses.
6. Admin can see which FAQ source was used.
7. Unanswered questions are saved for review.
8. Super Admin can convert unanswered questions into FAQ entries.
9. FAQ categories and filters work.
10. Home, Contact, or FAQ previews show only published client-visible entries.
11. All important actions are recorded in System Logs.
12. The page remains clean, useful, and aligned with Zion Events Place operations.

---

## 32. Final Rule

The Support Center must become the centralized knowledge control page of the whole system.

It controls:

```text
What appears on the Client FAQ page
What the Smart Assistant is allowed to answer
What information clients receive about packages, bookings, payments, contracts, and venue rules
```

The Smart Assistant must behave as a guided assistant powered by approved Zion support content, not as a free-answering chatbot that invents information.
