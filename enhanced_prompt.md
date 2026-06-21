# Admin Panel — Login, Profile & Database Updates

## 1. Login Modal Changes

### Authentication Fields
- Use **email** and **password** only as the login credentials.
- Remove the username field from the login modal entirely.
- The **username** should only be displayed inside the admin panel after a successful login (e.g., in the sidebar, header, or profile section).

### Session Option
- Remove the **"Secure 8-hour admin session"** option.
- Replace it with a **"Remember Me"** checkbox that persists the user's session beyond the default expiration.

---

## 2. Database Changes — `users` Table (Zentra Database)

Add the following columns to the `users` table in the **Zentra** database:

| Column          | Type           | Description                        |
|-----------------|----------------|------------------------------------|
| `full_name`     | `VARCHAR(255)` | The user's full name               |
| `contact_number`| `VARCHAR(20)`  | The user's contact number          |

> [!IMPORTANT]
> Ensure these columns are properly migrated and that existing user records are handled gracefully (e.g., allow `NULL` or set sensible defaults).

---

## 3. My Profile Page — Admin Panel

### 3.1 Contact Details Management
- Both **Super Admin** and **Admin** roles must be able to **view and edit** their own contact details:
  - **Full Name**
  - **Contact Number**
- On save, update the corresponding fields in the `users` table.

### 3.2 Password Management
- Both **Super Admin** and **Admin** roles must be able to **change their password** from the My Profile page.
- Requirements:
  - Input fields: **Current Password**, **New Password**, **Confirm New Password**
  - Validate that the current password is correct before allowing the change.
  - Validate that the new password and confirmation match.
  - Apply any existing password strength rules.

### 3.3 Real-Time Data Display
- The My Profile page must **automatically display real-time data** of the currently logged-in user.
- All profile fields (full name, contact number, email, username, role, etc.) must reflect the **latest database values** upon page load and after any updates — without requiring a manual page refresh.

---

## Summary of Changes

| Area             | Change                                                                 |
|------------------|------------------------------------------------------------------------|
| Login Modal      | Email + Password only; remove username field                           |
| Login Modal      | Replace "Secure 8-hour admin session" with "Remember Me" checkbox      |
| Admin Panel      | Display username inside the panel post-login                           |
| Database         | Add `full_name` and `contact_number` columns to `users` table          |
| My Profile Page  | Allow Admin/Super Admin to edit full name and contact number           |
| My Profile Page  | Allow Admin/Super Admin to change their password                       |
| My Profile Page  | Display real-time user data automatically                              |
