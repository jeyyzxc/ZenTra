# System Improvements — Technical Specification

> **System:** Zion Events Place Admin Panel (ZenTra)  
> **Version:** 1.0  
> **Date:** June 22, 2026  
> **Status:** Draft — Pending Approval

---

## Table of Contents

1. [Audit Log Deduplication (Anti-Spam)](#1-audit-log-deduplication-anti-spam)
2. [Profile Page — Background Image and Profile Picture Upload](#2-profile-page--background-image-and-profile-picture-upload)
3. [Contact Details — Default Philippines Dialing Code (+63)](#3-contact-details--default-philippines-dialing-code-63)

---

## 1. Audit Log Deduplication (Anti-Spam)

### 1.1 Problem Statement

The current system generates a new `READ` audit log entry **every time** an API endpoint is called — including automatic background refreshes. The `AuditLogsClient` component polls `GET /api/audit` every **30 seconds**, and every pagination change, filter change, or manual refresh also triggers a new `READ` log. This results in hundreds of duplicate entries such as:

```
14:32:01  [READ]  Viewed audit logs.
14:32:31  [READ]  Viewed audit logs.
14:33:01  [READ]  Viewed audit logs.
14:33:31  [READ]  Viewed audit logs.
...
```

The same problem applies to any page with auto-refresh or repeated data fetching (Dashboard, Bookings, Calendar, etc.). These repetitive `READ` logs add no value — they clutter the audit trail and make it difficult for the Superadmin to find meaningful activity.

### 1.2 Solution Overview

Implement a **server-side deduplication layer** that suppresses duplicate `READ` log entries when the same user views the same page repeatedly within a configurable cooldown window. The system must:

1. Detect duplicate read actions based on a **fingerprint** (combination of user ID, action type, and module).
2. Skip logging if an identical entry already exists within the **cooldown window**.
3. Allow configuration of cooldown duration per action type.
4. Never suppress non-read actions — `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, etc. are always logged immediately.

### 1.3 Deduplication Rules

| Rule | Behavior |
|---|---|
| **READ actions** | Subject to deduplication with a cooldown window |
| **All other actions** (CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.) | Always logged immediately — never suppressed |
| **Error-level events** | Always logged immediately — never suppressed |
| **Failed status events** | Always logged immediately — never suppressed |

### 1.4 Cooldown Windows

| Action Type | Cooldown Duration | Rationale |
|---|---|---|
| `READ` | **60 seconds** (default) | Suppresses auto-refresh spam while still recording the initial page visit |
| All others | **0 seconds** (no deduplication) | Every mutation and auth event must be recorded |

> [!IMPORTANT]
> The maximum allowable cooldown is **20 minutes**. Any value above 20 minutes risks missing legitimate repeated views across separate sessions or after meaningful breaks.

### 1.5 Fingerprint Definition

A deduplication fingerprint is a unique key composed of:

```
fingerprint = userId + action + module
```

| Field | Source | Example |
|---|---|---|
| `userId` | Authenticated user's ID | `clx9abc123def` |
| `action` | `AuditAction` enum value | `READ` |
| `module` | Module name string | `Audit` |

Two log entries are considered **duplicates** if they share the same fingerprint and the time difference between them is less than the cooldown window.

### 1.6 Deduplication Flow

```
createAuditLog() is called
  │
  ├─ Is the action type READ?
  │   ├─ NO → Log immediately (no deduplication)
  │   └─ YES → Check for recent duplicate
  │       │
  │       ├─ Query: SELECT id FROM audit_logs
  │       │   WHERE user_id = ? AND action = ? AND module = ?
  │       │   AND timestamp > (NOW - cooldown)
  │       │   LIMIT 1
  │       │
  │       ├─ Duplicate found → SKIP (do not create log)
  │       └─ No duplicate → CREATE log entry
```

### 1.7 Server-Side Implementation

#### 1.7.1 New Utility — `shouldSkipDuplicateLog`

Add this function to `lib/audit.ts`:

```typescript
const DEDUP_COOLDOWN_MS: Partial<Record<AuditAction, number>> = {
  [AuditAction.READ]: 60 * 1000, // 60 seconds
};

const MAX_COOLDOWN_MS = 20 * 60 * 1000; // 20 minutes

async function shouldSkipDuplicateLog(input: AuditLogInput): Promise<boolean> {
  const cooldown = DEDUP_COOLDOWN_MS[input.action];

  // No cooldown configured for this action → always log
  if (!cooldown || cooldown <= 0) {
    return false;
  }

  // Never skip failed or error events
  if (input.status === AuditStatus.FAILED || input.action === AuditAction.ERROR) {
    return false;
  }

  // System events without a userId cannot be deduplicated
  if (!input.userId) {
    return false;
  }

  const effectiveCooldown = Math.min(cooldown, MAX_COOLDOWN_MS);
  const cutoff = new Date(Date.now() - effectiveCooldown);

  const existing = await prisma.auditLog.findFirst({
    where: {
      userId: input.userId,
      action: input.action,
      module: input.module,
      timestamp: { gte: cutoff },
    },
    select: { id: true },
  });

  return existing !== null;
}
```

#### 1.7.2 Updated `createAuditLog` Function

Modify the existing `createAuditLog` in `lib/audit.ts`:

```typescript
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    // Check deduplication before writing
    if (await shouldSkipDuplicateLog(input)) {
      return; // Silently skip — duplicate within cooldown window
    }

    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        userName: input.userName || 'System',
        userRole: input.userRole || 'SYSTEM',
        action: input.action,
        module: input.module,
        description: input.description,
        status: input.status,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        previousValues: sanitizeOptional(input.previousValues),
        newValues: sanitizeOptional(input.newValues),
        metadata: sanitizeOptional(input.metadata),
      },
    });
  } catch (error) {
    console.error('Audit logging failed:', error);
  }
}
```

### 1.8 Client-Side Optimization

In addition to server-side deduplication, the client should avoid unnecessary audit log creation:

#### 1.8.1 Auto-Refresh Polling

The `AuditLogsClient` component currently auto-refreshes every 30 seconds via `setInterval`. Each poll call hits `GET /api/audit`, which creates a READ log. To avoid this:

- Add a custom header `X-Audit-Skip: poll` to auto-refresh requests.
- The API route should check for this header and **skip creating the READ audit log** when it is present.

```typescript
// AuditLogsClient.tsx — auto-refresh call
const response = await fetch(`/api/audit?${buildQuery().toString()}`, {
  cache: 'no-store',
  headers: { 'X-Audit-Skip': 'poll' },
});
```

```typescript
// app/api/audit/route.ts — check header
const skipAudit = request.headers.get('X-Audit-Skip') === 'poll';

if (!skipAudit) {
  await createAuditLog({ ... });
}
```

#### 1.8.2 Filter and Pagination Changes

Filter changes and pagination navigation should also include the `X-Audit-Skip: poll` header to prevent audit noise. Only the **initial page load** (first fetch after navigating to the page) should log a `READ` event.

### 1.9 Summary of Changes

| File | Change |
|---|---|
| `lib/audit.ts` | Add `shouldSkipDuplicateLog()`, update `createAuditLog()` |
| `app/api/audit/route.ts` | Check `X-Audit-Skip` header before logging READ |
| `app/api/audit/[id]/route.ts` | Check `X-Audit-Skip` header before logging READ |
| `app/admin/(dashboard)/audit/components/AuditLogsClient.tsx` | Add `X-Audit-Skip: poll` header to auto-refresh and filter/pagination requests |

---

## 2. Profile Page — Background Image and Profile Picture Upload

### 2.1 Background Image — Zion Logo

#### 2.1.1 Current State

The profile card's banner area currently uses a plain CSS gradient:

```tsx
<div className="h-28 bg-gradient-to-br from-[#1a1f18] via-[#35402f] to-[#D6B53B]" />
```

#### 2.1.2 Target State

Replace the gradient with the **Zion Events Place logo** (`/zion-logo.png`) displayed as a centered, semi-transparent background image over a dark base:

```tsx
<div className="relative h-28 bg-[#1a1f18] overflow-hidden">
  {/* Zion logo as background watermark */}
  <div
    className="absolute inset-0 bg-center bg-no-repeat bg-contain opacity-10"
    style={{ backgroundImage: "url('/zion-logo.png')" }}
  />
  {/* Subtle gold gradient overlay */}
  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#D6B53B]/20" />
</div>
```

#### 2.1.3 Design Details

| Property | Value |
|---|---|
| Background color | `#1a1f18` (dark base) |
| Logo placement | Centered, `background-size: contain`, `background-repeat: no-repeat` |
| Logo opacity | `10%` — subtle watermark effect, not overpowering |
| Overlay | Faint gold gradient from bottom-right (`to-[#D6B53B]/20`) |
| Dark mode | Same treatment — logo inverts naturally against the dark base |

---

### 2.2 Profile Picture Upload

#### 2.2.1 Overview

Users must be able to upload a profile picture that replaces the default initial-letter avatar. The profile picture should appear in:

1. **Profile card** — The large avatar circle on the profile page
2. **Sidebar** — If the sidebar displays a user avatar (future consideration)
3. **Topbar** — The user avatar/initial in the top-right dropdown

#### 2.2.2 Database Schema Change

Add a `profileImage` field to the `User` model:

```prisma
model User {
  id            String   @id @default(cuid())
  username      String   @unique
  email         String   @unique
  password      String
  fullName      String?  @map("full_name") @db.VarChar(255)
  contactNumber String?  @map("contact_number") @db.VarChar(20)
  profileImage  String?  @map("profile_image") @db.VarChar(500)   // ← NEW
  role          Role     @default(CLIENT)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("users")
}
```

The `profileImage` field stores the **URL path** to the uploaded file (e.g., `/uploads/avatars/clx9abc123.webp`).

#### 2.2.3 File Storage Strategy

| Aspect | Detail |
|---|---|
| Storage location | `public/uploads/avatars/` directory |
| File naming | `{userId}-{timestamp}.{ext}` (e.g., `clx9abc123-1719050400.webp`) |
| Accepted formats | JPEG (`.jpg`, `.jpeg`), PNG (`.png`), WebP (`.webp`) |
| Maximum file size | **2 MB** |
| Image processing | Resize to max **256 × 256 pixels** on the server (optional, recommended) |
| Old file cleanup | When a new avatar is uploaded, delete the previous file from disk |

> [!NOTE]
> For production deployment, consider migrating to cloud storage (e.g., Supabase Storage, AWS S3, or Cloudinary). The local file strategy is suitable for development and self-hosted deployments.

#### 2.2.4 API Endpoint

```
POST /api/profile/avatar
```

**Request:** `multipart/form-data` with a single `file` field.

**Validation:**
1. File is present and not empty.
2. MIME type is one of: `image/jpeg`, `image/png`, `image/webp`.
3. File size does not exceed 2 MB.
4. User is authenticated (via `requireAdmin()`).

**Success Response:**

```json
{
  "profileImage": "/uploads/avatars/clx9abc123-1719050400.webp"
}
```

**Error Response:**

```json
{
  "error": "File must be a JPEG, PNG, or WebP image under 2 MB."
}
```

**Audit Logging:**
- Action: `PROFILE_UPDATE`
- Module: `Profile`
- Description: `{username} updated their profile picture.`
- Previous values: `{ profileImage: "/uploads/avatars/old-file.jpg" }` or `null`
- New values: `{ profileImage: "/uploads/avatars/new-file.webp" }`

#### 2.2.5 Profile Picture Removal

```
DELETE /api/profile/avatar
```

Removes the profile picture, deletes the file from disk, and sets `profileImage` to `null`. The avatar reverts to the initial-letter fallback.

#### 2.2.6 UI — Avatar Component

Replace the current static initial-letter circle with an interactive avatar component:

**Display State (No Upload in Progress):**

```
┌──────────────────────────┐
│                          │
│     ┌──────────────┐     │
│     │              │     │
│     │   [Photo]    │     │  ← Shows profile image, or initial letter if none
│     │   or  "J"    │     │
│     │              │     │
│     └──────────────┘     │
│        📷 on hover       │  ← Camera icon overlay on hover
│                          │
└──────────────────────────┘
```

**Interaction:**

| State | Behavior |
|---|---|
| **No image, hover** | Camera icon overlay with "Upload Photo" tooltip |
| **Has image, hover** | Camera icon overlay with "Change Photo" tooltip |
| **Click** | Opens file picker dialog (`accept="image/jpeg,image/png,image/webp"`) |
| **File selected** | Shows instant client-side preview (via `URL.createObjectURL`) |
| **Uploading** | Loading spinner overlay on the avatar circle |
| **Success** | Replace preview with the server-confirmed URL, show success toast |
| **Error** | Revert to previous image/initial, show error toast |
| **Right-click / long-press** (if image exists) | Option to "Remove Photo" |

**Avatar Circle Styles:**

```tsx
{profileImage ? (
  <img
    src={profileImage}
    alt={displayName}
    className="-mt-12 h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg
               dark:border-[#141A13]"
  />
) : (
  <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-full border-4
                   border-white bg-[#FDF5CC] text-3xl font-bold text-[#8E7722] shadow-lg
                   dark:border-[#141A13] dark:bg-[#D6B53B]/20 dark:text-[#D6B53B]">
    {initial}
  </div>
)}

{/* Camera overlay on hover */}
<div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40
                opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer">
  <Camera className="h-6 w-6 text-white" />
</div>
```

#### 2.2.7 Propagation

When the profile image is updated, the new image must propagate to:

| Location | Method |
|---|---|
| Profile page avatar | Immediate — local state update |
| Topbar avatar dropdown | Via `router.refresh()` after successful upload (revalidates server component data) |
| Sidebar avatar (if applicable) | Via `router.refresh()` |

#### 2.2.8 Type Updates

Update `types.ts` to include the new field:

```typescript
export type AdminProfile = {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  contactNumber: string | null;
  profileImage: string | null;   // ← NEW
  role: ProfileRole;
  createdAt: string;
  updatedAt: string;
};
```

#### 2.2.9 File Structure

```
zentra/
├── prisma/
│   └── schema.prisma                         # Add profileImage field to User model
├── public/
│   └── uploads/
│       └── avatars/                           # [NEW] Avatar upload directory
├── app/
│   ├── api/
│   │   └── profile/
│   │       └── avatar/
│   │           └── route.ts                   # [NEW] POST (upload) + DELETE (remove)
│   └── admin/
│       └── (dashboard)/
│           └── profile/
│               ├── ProfileClient.tsx          # [MODIFY] Add avatar upload UI
│               ├── actions.ts                 # [MODIFY] Include profileImage in selects
│               └── types.ts                   # [MODIFY] Add profileImage field
```

---

## 3. Contact Details — Default Philippines Dialing Code (+63)

### 3.1 Current State

The contact number input is a plain `<input type="tel">` with a placeholder of `+63 912 345 6789` but **no enforced default prefix**. Users must manually type the dialing code.

### 3.2 Target State

The contact number input must display **+63** as a fixed, non-editable prefix attached to the left side of the input field. The user only types the local number (e.g., `912 345 6789`). The complete value stored in the database is the full international format (e.g., `+639123456789`).

### 3.3 UI Design — Split Input Pattern

```
┌──────┬─────────────────────────────────┐
│ +63  │  912 345 6789                   │
└──────┴─────────────────────────────────┘
  Fixed     Editable input
  prefix    (local number only)
```

**Implementation:**

```tsx
<div className="flex">
  {/* Fixed prefix */}
  <div className="flex items-center rounded-l-xl border border-r-0 border-gray-200
                  bg-gray-100 px-3.5 text-sm font-semibold text-gray-500
                  dark:border-white/10 dark:bg-white/5 dark:text-[#A3B19B]">
    +63
  </div>
  {/* Number input */}
  <input
    id="contactNumber"
    type="tel"
    value={localNumber}
    onChange={(e) => handleContactChange(e.target.value)}
    maxLength={13}
    autoComplete="tel-national"
    placeholder="912 345 6789"
    className="w-full rounded-r-xl border border-gray-200 bg-gray-50 px-4 py-2.5
               text-sm text-gray-900 outline-none transition
               focus:border-[#D6B53B] focus:ring-2 focus:ring-[#D6B53B]/20
               dark:border-white/10 dark:bg-white/5 dark:text-white"
  />
</div>
```

### 3.4 State Management

The component must manage a split between the **display value** (local number only) and the **stored value** (full international number):

```typescript
// Parse existing contact number from the database
function parseContactNumber(full: string | null): string {
  if (!full) return '';
  // Strip the +63 prefix if present
  if (full.startsWith('+63')) return full.slice(3).trim();
  // Strip leading 0 for local format (09xx → 9xx)
  if (full.startsWith('0')) return full.slice(1).trim();
  return full.trim();
}

// Compose full international number for storage
function composeContactNumber(local: string): string {
  const digits = local.replace(/[^0-9]/g, '');
  if (!digits) return '';
  return `+63${digits}`;
}
```

**State initialization:**

```typescript
const [localNumber, setLocalNumber] = useState(
  parseContactNumber(initialProfile.contactNumber)
);
```

**On form submit:**

```typescript
const fullContactNumber = composeContactNumber(localNumber);
await updateOwnProfile({
  fullName,
  contactNumber: fullContactNumber, // Stored as "+639123456789"
});
```

### 3.5 Validation Rules

| Rule | Condition | Error Message |
|---|---|---|
| Digits only (after prefix) | Input must contain only digits, spaces, and hyphens | "Contact number contains unsupported characters." |
| Minimum length | At least 10 digits (including area code) | "Please enter a valid Philippine phone number." |
| Maximum length | No more than 12 digits | "Contact number is too long." |
| Valid mobile prefix | Starts with `9` (for mobile) or valid landline area code | *(Optional — warn, don't block)* |

### 3.6 Auto-Formatting (Optional Enhancement)

For improved readability, the input can auto-format the local number as the user types:

| Raw Input | Formatted Display | Stored Value |
|---|---|---|
| `9123456789` | `912 345 6789` | `+639123456789` |
| `28123456` | `2 8123 456` | `+6328123456` |

### 3.7 Display in Profile Card

The contact number shown in the profile card sidebar should display the full international format with formatting:

```
+63 912 345 6789
```

If no contact number is set, display "Not provided" (same as current behavior).

### 3.8 Server-Side Normalization

The `normalizeProfileInput` function in `actions.ts` must ensure the stored contact number always uses the `+63` prefix:

```typescript
function normalizeProfileInput(data: UpdateProfileInput) {
  const fullName = data.fullName.trim();
  let contactNumber = data.contactNumber.trim();

  // Ensure +63 prefix
  if (contactNumber) {
    const digits = contactNumber.replace(/[^0-9+]/g, '');
    if (digits && !digits.startsWith('+63')) {
      // Prepend +63 if the client didn't include it
      const localDigits = digits.startsWith('0') ? digits.slice(1) : digits;
      contactNumber = `+63${localDigits}`;
    } else {
      contactNumber = digits;
    }
  }

  // ... existing validation ...

  return {
    fullName,
    contactNumber: contactNumber || null,
  };
}
```

### 3.9 Summary of Changes

| File | Change |
|---|---|
| `app/admin/(dashboard)/profile/ProfileClient.tsx` | Replace plain input with split +63 prefix input, add `parseContactNumber` / `composeContactNumber` helpers |
| `app/admin/(dashboard)/profile/actions.ts` | Update `normalizeProfileInput` to enforce +63 prefix on server side |

---

## 4. Implementation Checklist

### Phase 1 — Audit Log Deduplication

- [ ] Add `shouldSkipDuplicateLog()` function to `lib/audit.ts`
- [ ] Update `createAuditLog()` to call deduplication check before writing
- [ ] Add `X-Audit-Skip: poll` header to auto-refresh requests in `AuditLogsClient.tsx`
- [ ] Update `GET /api/audit` to skip READ logging when `X-Audit-Skip` header is present
- [ ] Update `GET /api/audit/[id]` to skip READ logging when `X-Audit-Skip` header is present
- [ ] Verify: Auto-refresh every 30 seconds no longer generates new READ logs
- [ ] Verify: Initial page visit still generates exactly one READ log
- [ ] Verify: CREATE, UPDATE, DELETE, LOGIN, LOGOUT actions are never suppressed
- [ ] Verify: Failed and error events are never suppressed

---

### Phase 2 — Profile Page Enhancements

- [ ] Replace profile card gradient banner with Zion logo background image
- [ ] Add `profileImage` field to `User` model in Prisma schema
- [ ] Run database migration
- [ ] Create `public/uploads/avatars/` directory
- [ ] Build `POST /api/profile/avatar` endpoint with file validation and storage
- [ ] Build `DELETE /api/profile/avatar` endpoint
- [ ] Update `ProfileClient.tsx` with interactive avatar upload component
- [ ] Update `types.ts` to include `profileImage` field
- [ ] Update `actions.ts` to include `profileImage` in `PROFILE_SELECT`
- [ ] Add audit logging for avatar upload and removal
- [ ] Verify: Upload accepts only JPEG, PNG, and WebP under 2 MB
- [ ] Verify: Old avatar file is deleted when a new one is uploaded
- [ ] Verify: Avatar propagates to topbar after upload
- [ ] Verify: Removing avatar reverts to initial-letter fallback

---

### Phase 3 — Contact Number Default Dialing Code

- [ ] Replace plain contact number input with split prefix input (`+63` + local number)
- [ ] Add `parseContactNumber()` and `composeContactNumber()` helper functions
- [ ] Update `normalizeProfileInput()` in `actions.ts` to enforce `+63` prefix
- [ ] Update profile card display to show formatted international number
- [ ] Verify: Existing contact numbers with `+63` prefix display correctly (no double prefix)
- [ ] Verify: Existing contact numbers without prefix are normalized on next save
- [ ] Verify: Empty contact number saves as `null` (not `"+63"`)
- [ ] Verify: Profile card shows "Not provided" when no contact number is set

---

> [!NOTE]
> These three improvements are independent of each other and can be implemented in any order or in parallel. Each phase has its own verification steps to ensure correctness before moving to the next.
