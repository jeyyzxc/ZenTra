# Audit Logs — Role-Based Access Control Policy

> **System:** ZenTra Admin Panel  
> **Version:** 1.0  
> **Date:** June 22, 2026  
> **Status:** Draft — Pending Approval  
> **Related Document:** Audit Logs Module — Technical Specification v1.0

---

## 1. Executive Summary

This document defines the **strict, role-based access control (RBAC) policy** governing what each user role can see and do within the ZenTra Audit Logs module.

The policy follows a **two-tier access model**:

| Role | Access Level | Scope |
|---|---|---|
| **SUPERADMIN** | Full Access | All logs, all users, all modules, all events — unrestricted |
| **ADMIN** | Restricted Access | Own activities only — login/logout, personal actions, self-initiated operations |
| **CLIENT** | No Access | Completely blocked from the Audit Logs page and API |

> [!IMPORTANT]
> These rules are **enforced server-side** at the API and database query level. Client-side UI restrictions exist for UX purposes only and must never be relied upon as the sole enforcement mechanism.

---

## 2. Access Tier Definitions

### 2.1 SUPERADMIN — Full System Audit Access

The Superadmin has **complete, unrestricted visibility** into every event recorded by the audit system. This role serves as the organization's primary accountability authority.

**What the Superadmin can see:**

| Category | Visibility | Details |
|---|---|---|
| All user activities | ✅ Full | Every action performed by every user (Superadmin, Admin, Client, System) |
| Login and logout events | ✅ Full | All authentication events for all users, including failed login attempts |
| CRUD operations | ✅ Full | All create, read, update, and delete operations across all modules |
| System errors | ✅ Full | All error-level events, unhandled exceptions, and system failures |
| Permission and role changes | ✅ Full | All role assignments, permission modifications, and access changes |
| System configuration changes | ✅ Full | All settings modifications, system config updates, and admin panel changes |
| Profile and password changes | ✅ Full | All account updates performed by any user |
| File operations | ✅ Full | All file uploads, deletions, and attachment changes |
| Approval and workflow actions | ✅ Full | All approvals, rejections, and submissions across the system |
| Export activities | ✅ Full | All data export events initiated by any user |
| Change history (diffs) | ✅ Full | Previous values and new values for every update and delete operation |
| Request metadata | ✅ Full | IP addresses, user agents, and request paths for all log entries |

**What the Superadmin can do:**

| Capability | Allowed |
|---|---|
| View all audit log entries | ✅ Yes |
| Search across all logs | ✅ Yes |
| Filter by any user, role, action, module, status, or date range | ✅ Yes |
| View full detail panel for any log entry | ✅ Yes |
| Export all logs (CSV, Excel, PDF) | ✅ Yes |
| Export filtered subsets of logs | ✅ Yes |
| Modify or delete audit log entries | ❌ No — Logs are immutable |

---

### 2.2 ADMIN — Self-Scoped Activity Access

The Admin has **restricted, filtered access** limited exclusively to their own activities. An Admin cannot see what other users have done, cannot see system-level events they did not trigger, and cannot see administrative actions performed by other admins or the superadmin.

**What the Admin can see:**

| Category | Visibility | Details |
|---|---|---|
| Own login and logout events | ✅ Yes | Only `LOGIN`, `LOGOUT`, and `LOGIN_FAILED` events where `userId` matches the Admin's ID |
| Own CRUD operations | ✅ Yes | Only create, update, and delete operations the Admin personally performed |
| Own profile and password changes | ✅ Yes | Only `PROFILE_UPDATE` and `PASSWORD_CHANGE` events for the Admin's own account |
| Own file operations | ✅ Yes | Only file uploads and deletions the Admin initiated |
| Own approval and workflow actions | ✅ Yes | Only approvals, rejections, and submissions the Admin performed |
| Own export activities | ✅ Yes | Only exports the Admin initiated |
| Own change history (diffs) | ✅ Partial | Previous and new values for operations the Admin performed (sensitive fields redacted) |
| Own request metadata | ❌ No | IP addresses and user agents are **hidden** from the Admin's detail view |

**What the Admin cannot see:**

| Category | Visibility | Reason |
|---|---|---|
| Other users' activities | ❌ Blocked | Admins must not audit other admins or the superadmin |
| System errors and failures | ❌ Blocked | System-level diagnostics are reserved for Superadmin oversight |
| Permission and role changes | ❌ Blocked | Security-sensitive operations are Superadmin-only |
| Role assignments | ❌ Blocked | Administrative hierarchy changes are Superadmin-only |
| System configuration changes | ❌ Blocked | Global settings modifications are Superadmin-only |
| Other users' login/logout events | ❌ Blocked | Authentication monitoring of others is Superadmin-only |
| Other users' change diffs | ❌ Blocked | Data modification history of others is Superadmin-only |
| IP addresses and user agents | ❌ Blocked | Network-level metadata is Superadmin-only |

**What the Admin can do:**

| Capability | Allowed |
|---|---|
| View own audit log entries | ✅ Yes |
| Search within own logs | ✅ Yes |
| Filter own logs by action, module, status, or date range | ✅ Yes |
| View detail panel for own log entries | ✅ Partial — No IP/user-agent data |
| Export own logs (CSV, Excel, PDF) | ✅ Yes — Own data only |
| Filter by user or role | ❌ No — Dropdown hidden; query locked to own ID |
| View other users' logs | ❌ No |
| Modify or delete audit log entries | ❌ No — Logs are immutable |

---

### 2.3 CLIENT — No Access

| Capability | Allowed |
|---|---|
| Access the Audit Logs page | ❌ No — Redirect to `/admin` |
| Call any `/api/audit/*` endpoint | ❌ No — Returns `403 Forbidden` |

---

## 3. Server-Side Enforcement

### 3.1 Authorization Flow

Every audit log request must pass through the following authorization chain:

```
Request → Authenticate Session → Identify Role → Apply Scope Filter → Return Data
```

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────┐     ┌──────────────┐
│   Request    │────▶│  getCurrentAdmin  │────▶│   Role Check      │────▶│  Query Scope │
│   Received   │     │  (session + DB)   │     │  SUPER / ADMIN?   │     │  Applied     │
└─────────────┘     └──────────────────┘     └───────────────────┘     └──────────────┘
                           │                        │                         │
                      null = 403               CLIENT = 403           SUPERADMIN = {}
                                                                      ADMIN = { userId: self }
```

### 3.2 Query Scope Injection

The API layer must inject a **mandatory Prisma `WHERE` clause** based on the authenticated user's role. This filter is applied at the database query level and **cannot be overridden** by client-side parameters.

**SUPERADMIN — No scope restriction:**

```typescript
// No additional WHERE clause — full access
const where: Prisma.AuditLogWhereInput = {
  ...userFilters,  // Date range, action, module, status, search, etc.
};
```

**ADMIN — Locked to own user ID + allowed action types:**

```typescript
const ADMIN_ALLOWED_ACTIONS: AuditAction[] = [
  'CREATE',
  'READ',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'LOGIN_FAILED',
  'PASSWORD_CHANGE',
  'PROFILE_UPDATE',
  'FILE_UPLOAD',
  'FILE_DELETE',
  'APPROVAL',
  'REJECTION',
  'SUBMISSION',
  'EXPORT',
];

const where: Prisma.AuditLogWhereInput = {
  userId: currentAdmin.id,                  // ← LOCKED — Cannot be overridden
  action: { in: ADMIN_ALLOWED_ACTIONS },    // ← LOCKED — Excludes system-level actions
  ...userFilters,                           // Date range, action (within allowed), module, status, search
};
```

> [!CAUTION]
> The `userId` filter for Admin users must be **injected server-side** and must **override** any `userId` parameter sent from the client. An Admin must never be able to query another user's logs by manipulating request parameters.

### 3.3 Blocked Action Types for Admin

The following action types are **permanently excluded** from Admin queries, regardless of any filter the Admin applies:

| Blocked Action | Reason |
|---|---|
| `SETTINGS_CHANGE` | System configuration is Superadmin-only visibility |
| `PERMISSION_CHANGE` | Security-sensitive access control changes |
| `ROLE_ASSIGNMENT` | Administrative hierarchy modifications |
| `SYSTEM_CONFIG` | Global system-level configuration changes |
| `ERROR` | System diagnostics and error monitoring |

### 3.4 Single Log Detail Enforcement

When an Admin requests a specific log entry via `GET /api/audit/[id]`:

1. Fetch the log entry by `id`
2. Verify `log.userId === currentAdmin.id`
3. Verify `log.action` is in the `ADMIN_ALLOWED_ACTIONS` list
4. If either check fails → return `403 Forbidden`
5. If both checks pass → return the log entry **with IP and user-agent fields stripped**

**Response sanitization for Admin:**

```typescript
if (currentAdmin.role === 'ADMIN') {
  delete logEntry.ipAddress;
  delete logEntry.userAgent;
}
```

### 3.5 Export Scope Enforcement

Export requests (`GET /api/audit/export`) must apply the **same scope restrictions** as list queries:

| Role | Export Scope |
|---|---|
| SUPERADMIN | All logs matching active filters |
| ADMIN | Only own logs matching active filters (blocked actions excluded) |

The export filename must reflect the scope:
- SUPERADMIN: `zentra-audit-logs-YYYY-MM-DD.{ext}`
- ADMIN: `zentra-my-activity-log-YYYY-MM-DD.{ext}`

---

## 4. User Interface Conditional Rendering

### 4.1 Page Header

| Element | SUPERADMIN | ADMIN |
|---|---|---|
| Page title | "Audit Logs" | "My Activity Log" |
| Subtitle | "Complete system activity trail — all users, all events" | "Your personal activity history within the system" |
| Record count label | "Total Records" | "Your Records" |

### 4.2 Filter Bar

| Filter Control | SUPERADMIN | ADMIN |
|---|---|---|
| Search input | ✅ Visible — Searches all logs | ✅ Visible — Searches own logs only |
| Date range picker | ✅ Visible | ✅ Visible |
| User dropdown | ✅ Visible — Lists all system users | ❌ Hidden — Locked to own ID |
| Role dropdown | ✅ Visible — All roles | ❌ Hidden — Not applicable |
| Action type dropdown | ✅ Visible — All 20 action types | ✅ Visible — Only 15 allowed types shown |
| Module dropdown | ✅ Visible — All modules | ✅ Visible — All modules |
| Status dropdown | ✅ Visible — All statuses | ✅ Visible — All statuses |
| Clear Filters button | ✅ Visible | ✅ Visible |

### 4.3 Data Table Columns

| Column | SUPERADMIN | ADMIN |
|---|---|---|
| Timestamp | ✅ Shown | ✅ Shown |
| User | ✅ Shown — Displays all user names | ❌ Hidden — Always the same user |
| Role | ✅ Shown | ❌ Hidden — Always the same role |
| Action | ✅ Shown | ✅ Shown |
| Module | ✅ Shown | ✅ Shown |
| Description | ✅ Shown | ✅ Shown |
| Status | ✅ Shown | ✅ Shown |
| IP Address | ✅ Shown | ❌ Hidden |

### 4.4 Detail Panel Fields

| Field | SUPERADMIN | ADMIN |
|---|---|---|
| Log ID | ✅ Shown | ✅ Shown |
| Timestamp | ✅ Shown | ✅ Shown |
| User Name | ✅ Shown | ✅ Shown |
| User ID | ✅ Shown | ❌ Hidden |
| User Role | ✅ Shown | ❌ Hidden |
| Action Type | ✅ Shown | ✅ Shown |
| Module | ✅ Shown | ✅ Shown |
| Description | ✅ Shown | ✅ Shown |
| Status | ✅ Shown | ✅ Shown |
| IP Address | ✅ Shown | ❌ Hidden |
| User Agent / Device | ✅ Shown | ❌ Hidden |
| Previous Values (diff) | ✅ Shown | ✅ Shown (own data only) |
| New Values (diff) | ✅ Shown | ✅ Shown (own data only) |
| Additional Metadata | ✅ Shown | ✅ Partial (request path only, no internal details) |

### 4.5 Export Controls

| Capability | SUPERADMIN | ADMIN |
|---|---|---|
| Export button visible | ✅ Yes | ✅ Yes |
| CSV export | ✅ All logs | ✅ Own logs only |
| Excel export | ✅ All logs | ✅ Own logs only |
| PDF export | ✅ All logs | ✅ Own logs only |
| Exported columns include IP/user-agent | ✅ Yes | ❌ No |
| Exported columns include User/Role | ✅ Yes | ❌ No |

---

## 5. Complete Access Policy Matrix

The table below is the **definitive reference** for every action type and its visibility per role.

| # | Action Type | SUPERADMIN | ADMIN (Own Only) | CLIENT |
|---|---|---|---|---|
| 1 | `LOGIN` | ✅ All users | ✅ Own only | ❌ |
| 2 | `LOGOUT` | ✅ All users | ✅ Own only | ❌ |
| 3 | `LOGIN_FAILED` | ✅ All users | ✅ Own only | ❌ |
| 4 | `CREATE` | ✅ All users | ✅ Own only | ❌ |
| 5 | `READ` | ✅ All users | ✅ Own only | ❌ |
| 6 | `UPDATE` | ✅ All users | ✅ Own only | ❌ |
| 7 | `DELETE` | ✅ All users | ✅ Own only | ❌ |
| 8 | `PASSWORD_CHANGE` | ✅ All users | ✅ Own only | ❌ |
| 9 | `PROFILE_UPDATE` | ✅ All users | ✅ Own only | ❌ |
| 10 | `APPROVAL` | ✅ All users | ✅ Own only | ❌ |
| 11 | `REJECTION` | ✅ All users | ✅ Own only | ❌ |
| 12 | `SUBMISSION` | ✅ All users | ✅ Own only | ❌ |
| 13 | `FILE_UPLOAD` | ✅ All users | ✅ Own only | ❌ |
| 14 | `FILE_DELETE` | ✅ All users | ✅ Own only | ❌ |
| 15 | `EXPORT` | ✅ All users | ✅ Own only | ❌ |
| 16 | `SETTINGS_CHANGE` | ✅ All users | ❌ Blocked | ❌ |
| 17 | `PERMISSION_CHANGE` | ✅ All users | ❌ Blocked | ❌ |
| 18 | `ROLE_ASSIGNMENT` | ✅ All users | ❌ Blocked | ❌ |
| 19 | `SYSTEM_CONFIG` | ✅ All users | ❌ Blocked | ❌ |
| 20 | `ERROR` | ✅ All events | ❌ Blocked | ❌ |

---

## 6. Implementation Reference

### 6.1 Authorization Utility Usage

The implementation must leverage ZenTra's existing authorization utilities defined in `lib/authorization.ts`:

| Utility | Purpose in Audit Logs |
|---|---|
| `getCurrentAdmin()` | Identifies the current user and their role; used by the page layout to determine rendering |
| `requireAdmin()` | Guards API routes — rejects unauthenticated or CLIENT-role requests |
| `requireSuperAdmin()` | Not used directly — role-based scoping is applied after `requireAdmin()` |

### 6.2 API Route Authorization Pattern

```typescript
// app/api/audit/route.ts

export async function GET(request: Request) {
  // Step 1: Authenticate and authorize
  const currentAdmin = await requireAdmin();

  // Step 2: Build base query filters from request parameters
  const filters = parseQueryFilters(request.url);

  // Step 3: Apply role-based scope
  const scopedWhere = applyAuditScope(currentAdmin, filters);

  // Step 4: Execute query with enforced scope
  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where: scopedWhere,
      orderBy: { timestamp: 'desc' },
      skip: filters.skip,
      take: filters.limit,
    }),
    prisma.auditLog.count({ where: scopedWhere }),
  ]);

  // Step 5: Sanitize response based on role
  const sanitizedLogs = sanitizeForRole(logs, currentAdmin.role);

  return Response.json({
    logs: sanitizedLogs,
    pagination: { ... },
  });
}
```

### 6.3 Scope Application Function

```typescript
function applyAuditScope(
  admin: CurrentAdmin,
  filters: ParsedFilters
): Prisma.AuditLogWhereInput {

  if (admin.role === 'SUPERADMIN') {
    // Superadmin: No scope restriction — apply only user-selected filters
    return buildWhereClause(filters);
  }

  // Admin: Lock scope to own userId and allowed actions
  return {
    ...buildWhereClause(filters),
    userId: admin.id,                           // ← ENFORCED — Cannot be overridden
    action: {
      in: ADMIN_ALLOWED_ACTIONS,                // ← ENFORCED — System actions excluded
      ...(filters.action && {
        equals: ADMIN_ALLOWED_ACTIONS.includes(filters.action)
          ? filters.action
          : undefined,
      }),
    },
  };
}
```

### 6.4 Response Sanitization Function

```typescript
function sanitizeForRole(
  logs: AuditLog[],
  role: 'SUPERADMIN' | 'ADMIN'
): Partial<AuditLog>[] {

  if (role === 'SUPERADMIN') {
    return logs; // Full data — no sanitization
  }

  // Admin: Strip network metadata and reduce metadata detail
  return logs.map((log) => ({
    ...log,
    ipAddress: undefined,
    userAgent: undefined,
    metadata: log.metadata
      ? { requestPath: (log.metadata as Record<string, unknown>).requestPath }
      : null,
  }));
}
```

### 6.5 Page Component Role Detection

```typescript
// app/admin/(dashboard)/audit/page.tsx

export default async function AuditLogsPage() {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    redirect('/admin');
  }

  const isSuperAdmin = currentAdmin.role === 'SUPERADMIN';

  return (
    <AuditLogsClient
      currentUserId={currentAdmin.id}
      currentUserRole={currentAdmin.role}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
```

---

## 7. Edge Cases and Special Rules

### 7.1 Admin Viewing System-Generated Logs

If a system process (e.g., automated workflow, scheduled task) generates a log entry that is **associated with an Admin's `userId`** (because the Admin triggered the workflow), the Admin **can** see that log entry — provided the action type is in the allowed list.

**Example:** An Admin triggers a booking creation which causes an automated email. The `CREATE` log for the booking (with the Admin's `userId`) is visible to the Admin. The system's email dispatch log (with `userId: null` or `action: SYSTEM_CONFIG`) is **not** visible to the Admin.

### 7.2 Admin's Own Failed Login Attempts

An Admin **can** see their own `LOGIN_FAILED` events. This helps them understand their own authentication history. However, they **cannot** see failed login attempts by other users.

### 7.3 Multiple Admin Accounts

Each Admin sees **only their own** logs. If Admin A and Admin B both update the same booking, Admin A sees only their update log, and Admin B sees only their update log. Only the Superadmin sees both.

### 7.4 Role Changes

If an Admin is promoted to Superadmin, they immediately gain full access to all logs (including historical logs from before their promotion). If a Superadmin is demoted to Admin, they immediately lose access to other users' logs and system events. Access is determined by **current role**, not historical role.

### 7.5 Audit Log of Audit Access

When an Admin or Superadmin views or exports audit logs, that action is itself logged. Admins **can** see their own `EXPORT` audit entries but **cannot** see other users' export events.

---

## 8. Verification Checklist

### 8.1 SUPERADMIN Verification

- [ ] Superadmin can see logs from all users (Superadmin, Admin, Client, System)
- [ ] Superadmin can see all 20 action types without restriction
- [ ] Superadmin can filter by any user in the user dropdown
- [ ] Superadmin can filter by any role in the role dropdown
- [ ] Superadmin can see IP addresses and user agents in the table and detail panel
- [ ] Superadmin can see previous/new values (change diffs) for all update and delete events
- [ ] Superadmin can export all logs with all columns (including IP, user agent, user, role)
- [ ] Superadmin cannot modify or delete any audit log entry

### 8.2 ADMIN Verification

- [ ] Admin can see only logs where `userId` matches their own ID
- [ ] Admin cannot see logs belonging to other users by manipulating URL parameters
- [ ] Admin cannot see `SETTINGS_CHANGE`, `PERMISSION_CHANGE`, `ROLE_ASSIGNMENT`, `SYSTEM_CONFIG`, or `ERROR` action types
- [ ] Admin cannot see the User or Role filter dropdowns
- [ ] Admin cannot see the User, Role, or IP Address columns in the table
- [ ] Admin cannot see IP address or user agent in the detail panel
- [ ] Admin can see their own login, logout, and failed login events
- [ ] Admin can see their own CRUD, profile, password, file, and workflow actions
- [ ] Admin can export only their own logs with restricted columns (no IP, user agent, user, role)
- [ ] Admin cannot modify or delete any audit log entry
- [ ] Admin sees page title "My Activity Log" instead of "Audit Logs"

### 8.3 CLIENT Verification

- [ ] Client is redirected away from `/admin/audit`
- [ ] Client receives `403 Forbidden` on all `/api/audit/*` endpoints
- [ ] Client cannot access any audit data through any means

### 8.4 Security Verification

- [ ] Sending a `userId` parameter different from the Admin's own ID is ignored server-side
- [ ] Sending a blocked action type as a filter parameter returns no results (not an error)
- [ ] API responses for Admin role never contain `ipAddress` or `userAgent` fields
- [ ] All scope enforcement is server-side — disabling JavaScript does not bypass restrictions
- [ ] Logs remain immutable — no `PUT`, `PATCH`, or `DELETE` endpoints exist

---

> [!NOTE]
> This RBAC policy must be reviewed and approved by the Superadmin before implementation. Any changes to visibility rules or access tiers require an update to this document and re-approval.
