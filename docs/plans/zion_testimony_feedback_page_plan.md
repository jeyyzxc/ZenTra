# Testimony and Feedback Page Plan  
## Zion Events Place and Management System

---

## 1. Purpose

This document provides a concise, concrete, professional, and implementation-ready plan for the **Testimony and Feedback** feature of the Zion Events Place and Management System.

The goal is to allow previous clients, customers, and event bookers to submit testimonies, written feedback, and detailed ratings about their experience with Zion Events Place.

These testimonies should help future clients build trust by seeing real feedback from past customers, similar to the review and rating features commonly seen on e-commerce and service platforms.

---

## 2. Main Objective

The Testimony feature must support two main areas:

1. **Client Panel**
   - Public users can submit testimonies.
   - Users can rate their experience using stars.
   - Users can provide detailed ratings for specific service areas.
   - Approved testimonies appear on the Testimony page.
   - Approved testimonies also appear as rotating sliders/popups on the Home page and About Us page.

2. **Admin Panel**
   - Admin and Super Admin can view submitted testimonies.
   - Admin and Super Admin can filter, review, approve, hide, or delete unnecessary feedback.
   - Admin and Super Admin can track rating performance.
   - The system silently notifies admins when a new testimony is submitted while they are active in the admin panel.

---

## 3. Client Panel: Testimony Page

Create or improve a dedicated Client Panel page:

```text
/testimonies
```

Recommended page title:

```text
Client Testimonies
```

Recommended subtitle:

```text
Read real experiences from clients who celebrated their special events with Zion Events Place.
```

The page should display all approved testimonies with ratings, event details, and client feedback.

---

## 4. Add New Testimony Feature

Any user should be able to submit a new testimony.

Add a button:

```text
Share Your Experience
```

or

```text
Add Testimony
```

When clicked, open a form modal or dedicated form section.

### Required Testimony Form Fields

- Name or nickname
- Event type availed
- Event date
- Overall star rating
- Approach rating
- Food rating
- Service rating
- Venue rating, optional
- Communication rating, optional
- Written testimony/comment
- Consent checkbox to display feedback publicly

### Optional Fields

- Email address, optional and not publicly displayed
- Booking reference, optional
- Uploaded event photo, optional
- Package availed, optional

---

## 5. Star Rating System

Users must rate their experience using stars.

### Required Rating Categories

| Rating Category | Description |
|---|---|
| Overall Rating | General satisfaction with Zion Events Place |
| Approach | Staff attitude, communication, and professionalism |
| Food | Food quality, taste, serving, and presentation |
| Service | Overall service execution and assistance |
| Venue | Venue cleanliness, ambiance, and setup, optional |
| Communication | Response time and coordination, optional |

Rating scale:

```text
1 star = Poor
2 stars = Fair
3 stars = Good
4 stars = Very Good
5 stars = Excellent
```

Strict rule:

```text
Overall rating, approach rating, food rating, and service rating are required.
```

---

## 6. Written Testimony Rules

The user must write their own testimony or comment.

Required rules:

1. Testimony must not be empty.
2. Minimum recommended length: 20 characters.
3. Maximum recommended length: 1,000 characters.
4. Profanity or abusive content should be flagged for review.
5. Testimony should not be publicly displayed until approved, if moderation is enabled.

Recommended validation message:

```text
Please share at least a short comment about your experience.
```

---

## 7. Testimony Status Flow

Recommended testimony status values:

```text
pending_review
approved
hidden
deleted
flagged
```

Default status after submission:

```text
pending_review
```

Recommended flow:

```text
User submits testimony
        ↓
System saves testimony as pending_review
        ↓
Admin receives silent notification while active
        ↓
Admin reviews testimony
        ↓
Admin approves, hides, flags, or deletes
        ↓
Approved testimony appears on Client Panel
```

Optional presentation mode:

```text
If moderation is not ready yet, auto-approve testimony but keep admin delete/hide controls.
```

---

## 8. Testimony Page Display

The Testimony page should show approved testimonies in a clean layout.

Each testimony card should display:

- Client name or nickname
- Event type availed
- Event date
- Overall star rating
- Detailed ratings
- Written testimony
- Submission date
- Optional event photo
- Package availed, if available

Recommended card content example:

```text
Maria S.
Wedding Reception • March 15, 2026

Overall: ★★★★★
Approach: ★★★★★
Food: ★★★★☆
Service: ★★★★★

"The staff were very accommodating, the venue was beautiful, and our guests loved the food."
```

---

## 9. Filters on Client Testimony Page

Add public filters for better browsing.

Recommended filters:

- Event type
- Star rating
- Most recent
- Highest rated
- With photos
- Package availed, optional

---

## 10. Home Page and About Us Page Integration

Approved testimonies should also appear on:

- Home page
- About Us page

### Display Behavior

Use an automatic slider or carousel.

Required behavior:

```text
Approved testimonies should slide one by one automatically.
```

Recommended features:

- Auto-slide every 4 to 6 seconds
- Manual next/previous controls
- Pause on hover
- Show overall rating
- Show client nickname
- Show event type
- Show short testimony excerpt
- Link to full Testimony page

Strict rule:

```text
Only approved testimonies should appear on the Home page and About Us page.
```

---

## 11. Admin Panel: Testimony Management Page

Add a new Admin Panel page:

```text
/admin/testimonies
```

Recommended sidebar label:

```text
Testimonies
```

Recommended page title:

```text
Testimony Management
```

Recommended subtitle:

```text
Review client feedback, manage public testimonies, and track customer satisfaction ratings.
```

---

## 12. Admin Testimony Table

The Admin Panel should show all submitted testimonies.

Recommended columns:

| Column | Description |
|---|---|
| Submitted Date | Date feedback was submitted |
| Client | Name or nickname |
| Event Type | Event availed |
| Event Date | Date the event happened |
| Overall Rating | Overall star rating |
| Approach | Approach rating |
| Food | Food rating |
| Service | Service rating |
| Status | Pending, Approved, Hidden, Flagged, Deleted |
| Visibility | Public or hidden |
| Actions | View, Approve, Hide, Delete |

---

## 13. Admin Filters

Admin and Super Admin should be able to filter testimonies by:

- Submitted date range
- Event date range
- Event type
- Overall rating
- Approach rating
- Food rating
- Service rating
- Status
- Visibility
- With photo
- Search by name, nickname, comment, or event type

Required filters from user request:

```text
Submitted date
Event type
Ratings
```

---

## 14. Admin Actions

Admin and Super Admin can:

- View testimony details
- Approve testimony
- Hide testimony from public pages
- Delete unnecessary feedback
- Flag suspicious or inappropriate feedback
- Restore hidden testimony, if allowed
- View rating breakdown
- View related booking, if booking reference exists

Strict delete rule:

```text
Deleting testimony should preferably be soft delete, not permanent delete.
```

Recommended actions:

| Action | Behavior |
|---|---|
| Approve | Makes testimony visible on client pages |
| Hide | Removes testimony from public display but keeps record |
| Delete | Soft deletes unnecessary feedback |
| Flag | Marks feedback for review |
| View Details | Opens full testimony and rating breakdown |

---

## 15. Rating Progress and Analytics

The Admin Panel should include summary cards and progress indicators.

Recommended summary cards:

| Card | Description |
|---|---|
| Total Testimonies | Total submitted feedback |
| Pending Review | Feedback waiting for approval |
| Approved Testimonies | Publicly visible feedback |
| Average Overall Rating | Average rating across approved testimonies |
| Average Food Rating | Food satisfaction score |
| Average Service Rating | Service satisfaction score |
| Average Approach Rating | Staff approach score |
| Highest Rated Event Type | Event type with highest average rating |

### Rating Progress Visuals

Show progress bars or small charts for:

- Overall rating average
- Approach rating average
- Food rating average
- Service rating average
- Rating distribution: 5-star, 4-star, 3-star, 2-star, 1-star

---

## 16. Silent Admin Notification Behavior

When a new testimony is submitted, create a silent admin notification.

Important rule:

```text
The system should notify admins only while they are active in the Admin Panel.
```

This should not behave like a high-alert notification.

### Silent Notification Behavior

- Show small notification badge
- Add entry to notification dropdown
- Do not play loud sounds
- Do not trigger high priority alert
- Do not send external notification when admin is offline
- Do not send email unless enabled later

Notification example:

```text
New testimony submitted by Maria S. for Wedding Reception.
```

Recommended notification priority:

```text
low
```

Recommended notification type:

```text
testimony
```

---

## 17. Data Visibility Rules

### Public Client Panel

Only show testimonies where:

```text
status = approved
is_public = true
```

### Admin Panel

Show all testimonies except permanently deleted records, if hard delete is ever used.

### Home and About Us Pages

Only show:

```text
approved
public
featured or latest testimonies
```

---

## 18. Database Model Plan

### testimonies

Suggested fields:

```text
id
client_name
nickname
email
event_type
event_date
package_name
booking_reference
overall_rating
approach_rating
food_rating
service_rating
venue_rating
communication_rating
comment
photo_url
status
is_public
is_featured
submitted_at
approved_by
approved_at
hidden_by
hidden_at
deleted_by
deleted_at
created_at
updated_at
```

### testimony_notifications

Optional if using existing notifications table:

```text
id
testimony_id
notification_type
priority
message
is_read
created_for
created_at
```

Recommended status values:

```text
pending_review
approved
hidden
flagged
deleted
```

---

## 19. API Endpoint Plan

### Public Client Endpoints

```text
GET /api/client/testimonies
GET /api/client/testimonies/featured
POST /api/client/testimonies
```

### Admin Endpoints

```text
GET /api/admin/testimonies
GET /api/admin/testimonies/:id
PATCH /api/admin/testimonies/:id/approve
PATCH /api/admin/testimonies/:id/hide
PATCH /api/admin/testimonies/:id/flag
DELETE /api/admin/testimonies/:id
GET /api/admin/testimonies/analytics
```

### Notification Endpoint

```text
GET /api/admin/notifications?type=testimony
PATCH /api/admin/notifications/:id/read
```

---

## 20. File Storage Plan

If testimony photos are allowed, store them in:

```text
Supabase Storage
```

Recommended bucket:

```text
testimony-photos
```

Recommended path:

```text
testimony-photos/{testimony_id}/{filename}
```

Strict rule:

```text
Do not store raw image files directly in the database.
Store the file in storage and save only the file URL/path in the database.
```

---

## 21. Integration With Other Pages

### Home Page

Show featured or latest approved testimonies in an auto-slider.

### About Us Page

Show trust-building client feedback in an auto-slider.

### Testimony Page

Show all approved public testimonies with ratings and filters.

### Admin Dashboard

Show a low-priority update when new testimonies are submitted.

### Notifications

Add silent notification for new testimony submissions.

### Reports & Analytics

Use testimony data for customer satisfaction analytics.

### Booking Management

If booking reference exists, link testimony to the related booking.

### System Logs

Record admin actions such as approve, hide, flag, and delete.

---

## 22. System Logs Integration

Create audit logs for:

- Testimony submitted
- Testimony approved
- Testimony hidden
- Testimony flagged
- Testimony deleted
- Testimony featured
- Testimony unfeatured

Each log should include:

```text
user
role
action
module = testimonies
description
status
ip_address
timestamp
```

---

## 23. UI and UX Requirements

### Client Panel

Design should be:

- Clean
- Trust-building
- Easy to submit feedback
- Mobile-friendly
- Similar to review/comment systems in modern e-commerce platforms
- Clear star rating inputs
- Clear testimonial cards
- Friendly success message after submission

### Admin Panel

Design should follow Zion admin style:

- Premium warm background
- Gold accent
- Rounded cards
- Clear table layout
- Status badges
- Filters
- Rating progress bars
- Details drawer
- Soft notification behavior

---

## 24. Empty, Loading, and Error States

### Client Testimony Page Empty State

```text
No testimonies yet.
Be the first to share your Zion Events Place experience.
```

### Admin Empty State

```text
No testimonies submitted yet.
Client feedback will appear here once users submit their experience.
```

### Loading State

Use skeleton cards or loading spinner.

### Error State

```text
Unable to load testimonies.
Please try again later.
```

---

## 25. Validation Rules

1. Name or nickname is required.
2. Event type is required.
3. Event date is required.
4. Overall rating is required.
5. Approach rating is required.
6. Food rating is required.
7. Service rating is required.
8. Written testimony/comment is required.
9. Consent checkbox is required before public display.
10. Ratings must be between 1 and 5 only.
11. Testimony must not be publicly visible until approved if moderation is enabled.

---

## 26. Role-Based Access

### Super Admin

Can:

- View all testimonies
- Approve testimonies
- Hide testimonies
- Delete testimonies
- Flag testimonies
- Feature testimonies
- View rating analytics

### Admin

Can:

- View testimonies
- Approve testimonies, if allowed
- Hide inappropriate testimonies, if allowed
- View rating analytics
- Cannot permanently delete unless permission is granted

### Public User

Can:

- Submit testimony
- View approved testimonies
- Filter public testimonies

---

## 27. Testing Plan

Test the following:

1. User can submit testimony.
2. User can rate overall experience.
3. User can rate approach, food, and service.
4. User can select event type.
5. User can enter event date.
6. User can write testimony.
7. Testimony saves as pending review.
8. Admin receives silent in-panel notification.
9. Admin can filter by submitted date.
10. Admin can filter by event type.
11. Admin can filter by rating.
12. Admin can approve testimony.
13. Approved testimony appears on Testimony page.
14. Approved testimony appears on Home page slider.
15. Approved testimony appears on About Us page slider.
16. Admin can hide testimony.
17. Hidden testimony disappears from public pages.
18. Admin can delete unnecessary feedback.
19. Rating analytics update correctly.
20. System Logs record testimony actions.

---

## 28. Implementation Phases

### Phase 1: Client Testimony Form

- Build public testimony page.
- Add testimony submission form.
- Add star rating inputs.
- Add validation.
- Save testimony as pending review.

### Phase 2: Public Testimony Display

- Display approved testimonies.
- Add filters.
- Add rating display.
- Add empty/loading/error states.

### Phase 3: Home and About Us Slider

- Add testimony carousel to Home page.
- Add testimony carousel to About Us page.
- Use only approved public testimonies.
- Auto-slide one by one.

### Phase 4: Admin Testimony Management

- Add Admin Panel Testimony page.
- Add testimony table.
- Add filters.
- Add approve, hide, delete, and flag actions.
- Add rating progress and analytics.

### Phase 5: Notifications and Logs

- Add silent in-panel notification.
- Add System Logs integration.
- Add admin action tracking.

### Phase 6: Testing and Polish

- Test submission flow.
- Test admin moderation.
- Test public display.
- Test rating calculations.
- Polish UI and responsiveness.

---

## 29. Final Acceptance Criteria

The Testimony feature is complete if:

1. Any user can submit testimony from the Client Panel.
2. Users can rate overall experience using stars.
3. Users can rate specific categories such as approach, food, and service.
4. Users can enter event type, name/nickname, event date, and written testimony.
5. Approved testimonies appear on the Testimony page.
6. Approved testimonies auto-slide on the Home page.
7. Approved testimonies auto-slide on the About Us page.
8. Admin and Super Admin can view all submitted testimonies.
9. Admin and Super Admin can filter by submitted date, event type, and rating.
10. Admin and Super Admin can delete or hide unnecessary feedback.
11. Admin can track rating progress and customer satisfaction.
12. Silent notification appears only while admin is active in the Admin Panel.
13. Testimony actions are recorded in System Logs.
14. The feature works like a simple review/comment system for Zion Events Place.

---

## 30. Final Rule

The Testimony feature must help Zion Events Place build trust through real client experiences.

It should work as a professional feedback and rating system where past clients can share their experience, future clients can read trusted reviews, and admins can manage feedback quality without making the system noisy or intrusive.
