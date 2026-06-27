# Services and Packages System-Wide Implementation Plan
## Zion Events Place and Management System

---

## 1. Purpose

This plan defines how the **Services, Packages & Content** page should work as a real, database-driven module. It must allow the **Super Admin** to manage event categories and the packages under each event. Every change must affect the whole system, especially the **Client Panel**.

The current screenshot already has the correct visual direction: large event cards for Debut, Gender Reveal, Wedding Reception, Christening, Birthday, and Christmas Party. The goal is to make those cards real, editable, and connected to packages and bookings.

---

## 2. Main Objective

The module must allow the Super Admin to:

1. Add, edit, hide, and archive event categories.
2. Open an event category card and manage packages inside it.
3. Add, edit, update, hide, archive, or remove packages when allowed.
4. Manage package images, descriptions, prices, pax, inclusions, and payment rules.
5. Control which event categories and packages appear on the Client Panel.
6. Ensure package data flows correctly to Booking Management, Contract Management, Payment & History, Calendar, Dashboard, Reports & Analytics, Notifications, and System Logs.

---

## 3. Important Button Change

Replace the current main page button:

```text
+ Add New Package
```

with:

```text
+ Add Event Category
```

Reason:

```text
The main Services and Packages page shows event category placeholders first.
Packages should only be added after opening a specific event category.
```

Correct button behavior:

| Location | Button Label | Purpose |
|---|---|---|
| Main Services & Packages page | Add Event Category | Creates a new event category card |
| Inside a specific event category | Add New Package | Creates a package under that event |

---

## 4. Correct Module Structure

```text
Services & Packages
        ↓
Event Category Placeholder
        ↓
Packages assigned to that event
        ↓
Package details, inclusions, pricing, payment rules, and visibility
        ↓
Client Panel, Booking Management, Contract Management, Payment & History, Dashboard, Reports, Notifications, and System Logs
```

Example:

```text
Services & Packages
        ↓
Wedding Reception
        ↓
Wedding Packages
        ↓
Zion Premium Package
Classic Wedding Package
Garden Wedding Package
Reception Only Package
```

---

## 5. Main Page: Event Category Grid

The main page should show database-driven event category cards.

Each card should display:

- Cover image
- Event category name
- Short description, optional
- Number of active packages
- Status
- Client panel visibility
- Edit button
- Clickable card behavior

Example event categories:

- Wedding Reception
- Debut
- Birthday
- Christening
- Gender Reveal
- Christmas Party
- Anniversary
- Reunion
- Corporate Event
- Custom Event

When Super Admin clicks a card:

```text
Open the package management page for that event category.
```

Example route:

```text
/admin/services/wedding-reception
```

---

## 6. Add Event Category Feature

The **Add Event Category** button should open a modal or drawer.

Required fields:

- Event category name
- Slug
- Description
- Cover image
- Display order
- Status
- Client panel visibility

Status values:

```text
active
hidden
archived
```

Client panel visibility values:

```text
visible
hidden
```

Strict rule:

```text
Only event categories with status = active and client_visible = true should appear on the Client Panel.
```

---

## 7. Edit Event Category Feature

Each event category card should have an edit button.

Editable fields:

- Event category name
- Description
- Cover image
- Display order
- Status
- Client panel visibility

Strict conditions:

1. If an event category has active bookings, it must not be permanently deleted.
2. If an event category is no longer offered, use hide or archive instead.
3. Hiding an event category removes it from the Client Panel but keeps it visible to Super Admin.
4. Archiving an event category prevents new bookings but preserves history.
5. Every change must create a System Log entry.

---

## 8. Inside Each Event Category

When Super Admin opens an event category, show all packages connected to that event.

Example:

```text
Services & Packages / Wedding Reception
```

Page title:

```text
Wedding Reception Packages
```

Page subtitle:

```text
Create and manage package offers, inclusions, pricing, availability, and client-facing content for Wedding Reception events.
```

Sections:

1. Event category header
2. Package summary cards
3. Search and filters
4. Package cards or table
5. Add New Package button
6. Edit package drawer
7. Package preview
8. Package status and visibility controls

---

## 9. Package List Under Each Event

Each event category must have its own package list.

Example Wedding Reception packages:

- Zion Premium Package
- Classic Wedding Package
- Garden Wedding Package
- Reception Only Package

Each package card/table row should display:

- Package image
- Package name
- Package price
- Pax included
- Excess pax fee
- Reservation fee
- Down payment amount
- Status
- Client panel visibility
- Number of inclusions
- Last updated date
- Edit button
- Preview button
- Hide/Archive button

---

## 10. Add New Package Feature

Inside each event category, show:

```text
+ Add New Package
```

Required fields:

- Package name
- Package description
- Package price
- Currency
- Pax included
- Excess pax fee
- Reservation fee
- Down payment amount
- Full payment amount
- Check-in time
- Check-out time
- Package image
- Package inclusions
- Optional add-ons
- Contract item description
- Contract inclusion description
- Availability status
- Client panel visibility
- Internal notes

Status values:

```text
active
inactive
hidden
archived
```

Strict rule:

```text
A package must not appear on the Client Panel unless status = active and client_visible = true.
```

---

## 11. Edit Package Feature

Each package must have an edit button.

Editable fields:

- Package name
- Description
- Price
- Pax included
- Excess pax fee
- Reservation fee
- Down payment amount
- Full payment amount
- Check-in time
- Check-out time
- Image
- Inclusions
- Add-ons
- Contract item description
- Contract inclusion description
- Availability status
- Client panel visibility
- Internal notes

Strict rule:

```text
If a package is already used in an active booking, important edits must not silently change existing bookings or contracts.
```

Important fields that require versioning:

- Price
- Inclusions
- Pax included
- Excess pax fee
- Reservation fee
- Down payment amount
- Contract item description
- Contract inclusion description

---

## 12. Package Inclusions Management

Each package must support multiple editable inclusions.

Examples:

- Venue use
- Catering
- Tables and chairs
- Sound system
- Host
- Photo and video coverage
- OTD coordinators
- Grazing table
- Photobooth
- Styling
- Swimming pool access
- Registration setup
- Projector
- Bridal room
- Guest parking

Super Admin can:

- Add inclusion
- Edit inclusion
- Remove inclusion
- Reorder inclusions
- Mark inclusion as free
- Mark inclusion as optional add-on

---

## 13. Package Versioning

Package versioning is required to protect old bookings and contracts.

When Super Admin changes price, inclusions, pax, payment rules, or contract descriptions:

```text
Create a new package version.
Keep the old version for previous bookings and contracts.
Use the latest active version for new bookings.
```

Strict rule:

```text
Existing bookings and contracts must use the package snapshot that existed at the time of booking.
```

---

## 14. Client Panel Integration

This module must strongly affect the Client Panel.

Client Panel flow:

```text
Client opens services/packages page
        ↓
Client sees only active and visible event categories
        ↓
Client clicks an event category
        ↓
Client sees only active and visible packages under that event
        ↓
Client selects a package
        ↓
Client clicks Book Now
        ↓
Booking form receives selected package data
        ↓
Client submits booking
        ↓
Admin Panel receives booking with package snapshot
```

The Client Panel must display:

- Event category image
- Event category name
- Package image
- Package name
- Package price
- Pax included
- Excess pax fee
- Package description
- Package inclusions
- Reservation fee or down payment requirement
- Book Now button

Strict Client Panel rules:

1. Hidden event categories must not appear.
2. Archived event categories must not appear.
3. Hidden packages must not appear.
4. Archived packages must not appear.
5. Inactive packages must not be bookable.
6. Package price and inclusions must match the latest active package version.
7. Book Now must pass the correct package ID and package version to Booking Management.
8. Client booking must store a package snapshot.

---

## 15. Booking Management Integration

When a client books a package, Booking Management must receive:

- Event category ID
- Event category name
- Package ID
- Package version
- Package name
- Package price
- Package inclusions snapshot
- Pax included
- Excess pax fee
- Reservation fee
- Down payment amount
- Full payment amount
- Check-in time
- Check-out time
- Contract item description snapshot
- Contract inclusion description snapshot

Strict rule:

```text
Booking records must store a package snapshot so future package edits do not alter old bookings.
```

---

## 16. Contract Management Integration

Contract Management must use the package snapshot from the booking for:

- Package name
- Item description
- Package inclusions
- Total contract amount
- Pax included
- Excess pax fee
- Payment breakdown
- Contract inclusion description

Strict rule:

```text
Contracts must use the booking package snapshot, not the latest edited package version.
```

---

## 17. Payment & History Integration

Payment & History must use package snapshot data for:

- Package price
- Reservation fee
- Down payment amount
- Full payment amount
- Remaining balance calculation
- Payment milestones
- Excess pax fee, if applicable
- Payment deadline rules

Example:

```text
Package Price: ₱225,000
Down Payment: ₱25,000
Remaining Balance: ₱200,000
```

---

## 18. Dashboard Integration

Dashboard should use Services and Packages data for:

- Most booked event category
- Most booked package
- Package revenue summary
- Upcoming events by package
- Bookings by event type
- Package performance alerts

---

## 19. Reports & Analytics Integration

Reports & Analytics should use this module for:

- Most selected package
- Package revenue performance
- Event category revenue
- Package popularity
- Active vs hidden packages
- Bookings per event category
- Package conversion from Client Panel views to bookings

Reports must not use static package data.

---

## 20. Calendar Integration

Calendar should receive package-related details from bookings.

Calendar event should show:

- Event category
- Package name
- Client name
- Event date
- Booking status
- Payment status

---

## 21. Notifications Integration

Create notifications when:

- New package is added
- Package is updated
- Package is hidden from Client Panel
- Package is archived
- Package used in active booking is edited
- Client books a package
- Package has no active offer but category is visible

---

## 22. System Logs Integration

Every important change must create audit logs.

Required logs:

- Event category created
- Event category updated
- Event category hidden
- Event category archived
- Package created
- Package updated
- Package hidden
- Package archived
- Package version created
- Package inclusion added
- Package inclusion edited
- Package inclusion removed
- Package visibility changed
- Client panel visibility changed

Each audit log should include:

- User
- Role
- Action
- Module = services_packages
- Description
- Status
- IP address
- Timestamp

---

## 23. Database Model Plan

### event_categories

```text
id
name
slug
description
cover_image_url
display_order
status
client_visible
created_by
updated_by
created_at
updated_at
```

### packages

```text
id
event_category_id
package_name
slug
description
price
currency
pax_included
excess_pax_fee
reservation_fee
down_payment_amount
full_payment_amount
check_in_time
check_out_time
package_image_url
contract_item_description
contract_inclusion_description
status
client_visible
current_version
created_by
updated_by
created_at
updated_at
```

### package_inclusions

```text
id
package_id
inclusion_name
description
is_free
is_optional
display_order
created_at
updated_at
```

### package_versions

```text
id
package_id
version_number
snapshot_data
change_summary
created_by
created_at
```

### booking_package_snapshots

```text
id
booking_id
event_category_id
package_id
package_version
snapshot_data
created_at
```

Purpose:

```text
Protect old bookings and contracts from future package edits.
```

---

## 24. API Endpoint Plan

### Admin Event Categories

```text
GET /api/admin/event-categories
GET /api/admin/event-categories/:id
POST /api/admin/event-categories
PATCH /api/admin/event-categories/:id
PATCH /api/admin/event-categories/:id/archive
PATCH /api/admin/event-categories/:id/visibility
```

### Admin Packages

```text
GET /api/admin/event-categories/:id/packages
GET /api/admin/packages/:id
POST /api/admin/event-categories/:id/packages
PATCH /api/admin/packages/:id
PATCH /api/admin/packages/:id/archive
PATCH /api/admin/packages/:id/visibility
```

### Package Inclusions

```text
POST /api/admin/packages/:id/inclusions
PATCH /api/admin/package-inclusions/:id
DELETE /api/admin/package-inclusions/:id
PATCH /api/admin/packages/:id/inclusions/reorder
```

### Client Panel Public Endpoints

```text
GET /api/client/event-categories
GET /api/client/event-categories/:slug/packages
GET /api/client/packages/:slug
```

Client endpoints must only return:

```text
status = active
client_visible = true
```

---

## 25. Role-Based Access

### Super Admin

Can:

- Add event categories
- Edit event categories
- Hide event categories
- Archive event categories
- Add packages
- Edit packages
- Hide packages
- Archive packages
- Manage package inclusions
- Upload package images
- Manage Client Panel visibility
- Create package versions

### Admin

Can:

- View event categories
- View packages
- Use package data in bookings
- Cannot create, edit, hide, archive, or remove packages unless permission is granted

Strict rule:

```text
Only Super Admin can manage Services and Packages by default.
```

---

## 26. UI and UX Requirements

Preserve the current design shown in the screenshot.

Required style:

- Premium admin layout
- Warm cream background
- Gold accent color
- Large event image cards
- Dark gradient overlay
- Event name on image
- Rounded cards
- Soft shadows
- Elegant typography
- Clean spacing
- Responsive grid
- Clear edit buttons
- Clear visibility badges
- Image upload preview
- Confirmation modal before archive/delete

---

## 27. Strict Conditions

1. Static event cards must become database-driven.
2. The main button must be renamed to **Add Event Category**.
3. Super Admin can add, edit, hide, and archive event categories.
4. Each event category must open its own package management page.
5. Super Admin can create, update, hide, archive, and remove packages when allowed.
6. Every package must be assigned to a specific event category.
7. Every package should have editable pricing, inclusions, image, pax, payment rules, and visibility.
8. Client Panel must update based on event category and package changes.
9. Hidden categories and packages must not appear on the Client Panel.
10. Archived categories and packages must not appear on the Client Panel.
11. Existing bookings must keep their original package snapshot.
12. Contracts must use booking package snapshots.
13. Payment & History must use booking package snapshots.
14. Reports must calculate from real package and booking data.
15. Active bookings should prevent permanent deletion.
16. Use hide/archive instead of hard delete when records are already used.
17. All changes must create System Logs.

---

## 28. Testing Plan

Test the following:

1. Super Admin can add an event category.
2. The main button displays **Add Event Category**, not Add New Package.
3. Super Admin can edit event category image and name.
4. Hidden event categories disappear from the Client Panel.
5. Active and visible event categories appear on the Client Panel.
6. Clicking Wedding Reception opens Wedding package list.
7. Super Admin can add a package under Wedding Reception.
8. Super Admin can edit a package.
9. Super Admin can add, edit, remove, and reorder inclusions.
10. Hidden packages do not appear on the Client Panel.
11. Active and visible packages appear on the Client Panel.
12. Client can select package and click Book Now.
13. Booking stores package snapshot correctly.
14. Contract uses booking package snapshot correctly.
15. Payment & History calculates from package snapshot correctly.
16. Package price changes do not affect old bookings.
17. Reports update based on package usage.
18. Dashboard shows package-related insights.
19. System Logs record event category and package changes.

---

## 29. Implementation Phases

### Phase 1: Review Current Page

- Review existing Services and Packages page.
- Identify static cards.
- Preserve current design.
- Replace static arrays with API data.

### Phase 2: Event Category CRUD

- Add event_categories table.
- Add event category API endpoints.
- Replace Add New Package button with Add Event Category.
- Add create/edit/archive/visibility controls.

### Phase 3: Package CRUD Per Event

- Add packages table.
- Add inclusions table.
- Add package versioning.
- Add package management page per event category.

### Phase 4: Client Panel Integration

- Add public client endpoints.
- Update Client Panel to fetch active categories and packages.
- Ensure hidden or archived records do not appear.
- Connect Book Now to selected package data.

### Phase 5: System-Wide Integration

- Connect selected package to Booking Management.
- Store booking package snapshot.
- Connect package snapshot to Contract Management.
- Connect package snapshot to Payment & History.
- Connect package data to Dashboard and Reports.
- Add Calendar, Notifications, and System Logs integration.

### Phase 6: Testing and Polish

- Test admin CRUD.
- Test client visibility.
- Test booking snapshot.
- Test package versioning.
- Test UI responsiveness.
- Polish spacing, cards, and modals.

---

## 30. Final Acceptance Criteria

This module is complete if:

1. Event category cards are real and database-driven.
2. The main button is changed to **Add Event Category**.
3. Super Admin can add, edit, hide, and archive event categories.
4. Each event category opens its own package management page.
5. Super Admin can add, edit, update, hide, and archive packages under each event.
6. Each package has editable price, inclusions, image, visibility, pax, and payment-related fields.
7. Client Panel displays only active and visible categories and packages.
8. Client Panel updates automatically after package/category changes.
9. Booking Management receives selected package data.
10. Booking records store package snapshots.
11. Contract Management uses package snapshots.
12. Payment & History uses package snapshots.
13. Dashboard and Reports reflect real package usage.
14. Existing bookings are protected from future package edits.
15. All important changes are recorded in System Logs.
16. The UI remains consistent with the current premium Zion admin design.

---

## 31. Final Rule

The Services and Packages page must become the central content and package management area of the system.

It controls:

```text
What clients see
What clients can book
What package data enters Booking Management
What appears in contracts
What payment rules apply
What reports and analytics calculate
```

The whole system must depend on this module for event category and package data, especially the Client Panel.
