# Codex Prompt Plan: Database Cleanup Except Users + System File Architecture Overhaul
## Zion Events Place and Management System

---

## 1. Main Objective

You are a senior full-stack developer assigned to perform a production cleanup and system architecture overhaul for the Zion Events Place and Management System.

The goal is to make the system clean, real-data-driven, production-ready, and well-structured by doing two major tasks:

1. **Database cleanup**
   - Delete all current database records except the `users` table data.
   - After cleanup, PostgreSQL must be clean except for existing user accounts.
   - Do not drop tables.
   - Do not delete the database schema.
   - Do not delete migrations.

2. **System file cleanup and architecture overhaul**
   - Remove all unnecessary, obsolete, duplicate, demo, mock, temporary, unused, and dead files.
   - Remove all files related to demo mode, demo bridge, sample data, mock data, and temporary presentation-only logic.
   - Move all `.md` files into one organized documentation folder.
   - Keep the project architecture concrete, clean, organized, and production-ready.

---

## 2. Critical Safety Rules

Follow these rules strictly:

1. Do not delete user accounts.
2. Do not drop database tables.
3. Do not delete Prisma migrations.
4. Do not delete `_prisma_migrations`.
5. Do not delete `.env` files.
6. Do not delete production configuration files.
7. Do not delete source files that are actively imported or required by the app.
8. Do not remove authentication, authorization, RBAC, or middleware files unless confirmed unused.
9. Do not remove n8n orchestration-related production files.
10. Do not remove real booking, email log, notification, task, payment, contract, inquiry, or support center logic.
11. Do not remove files only because the name looks unfamiliar. Verify usage first.
12. Do not run destructive database cleanup automatically on app startup or deployment.

---

## 3. Database Cleanup Requirement

Clean all current database records except the `users` table.

The expected result after cleanup:

```text
users table = preserved
all other business/transactional tables = empty
database schema = preserved
tables = preserved
migrations = preserved
```

If the project uses Prisma, also preserve:

```text
_prisma_migrations
```

If the project uses auth tables that are required for login, inspect carefully before deleting. However, the primary user request is to preserve only users. If deleting auth-related tables will break login, report it and preserve the minimum required auth/RBAC tables.

---

## 4. Tables That Should Be Cleaned

Inspect the actual database schema and clean all non-user tables, including but not limited to:

```text
bookings
payments
payment_history
contracts
contract_files
email_logs
workflow_logs
audit_logs
system_logs
notifications
admin_tasks
calendar_events
inquiries
testimonials
services
packages
event_categories
support_faq_entries
support_center_entries
client_messages
booking_timelines
booking_activities
attachments
uploaded_files
demo_bridge_records
sessions
accounts
verification_tokens
```

Important:

```text
Do not blindly use this list only.
Inspect the real Prisma schema and PostgreSQL tables first.
```

If a table does not exist, skip it safely.

---

## 5. Database Cleanup Strategy

Create a controlled cleanup script instead of manually deleting records through the UI.

Recommended file:

```text
scripts/clean-database-except-users.ts
```

Recommended command:

```json
{
  "db:clean-except-users": "tsx scripts/clean-database-except-users.ts"
}
```

The script must require confirmation:

```bash
npm run db:clean-except-users -- --confirm
```

If `--confirm` is missing, stop immediately and print:

```text
Cleanup aborted. Add --confirm to intentionally delete all non-user database records.
```

---

## 6. Required Cleanup Script Behavior

The cleanup script must:

1. Connect to the database using the existing Prisma/database client.
2. Inspect all models or known tables.
3. Delete records from all non-user tables.
4. Preserve `users`.
5. Preserve `_prisma_migrations`.
6. Use a transaction where possible.
7. Delete child/dependent records before parent records.
8. Print a summary of deleted records per table.
9. Reset ID sequences only for cleaned tables if appropriate.
10. Never run unless `--confirm` is provided.
11. Never run automatically on build, start, seed, migrate, deploy, or dev commands.

---

## 7. Suggested Prisma Cleanup Logic

Codex must adapt the code to the actual Prisma client model names.

Recommended approach:

```ts
import { prisma } from "../src/lib/prisma";

const args = process.argv.slice(2);
const confirmed = args.includes("--confirm");

if (!confirmed) {
  console.log("Cleanup aborted. Add --confirm to intentionally delete all non-user database records.");
  process.exit(1);
}

async function main() {
  console.log("Starting database cleanup except users...");

  await prisma.$transaction(async (tx) => {
    // Delete child/dependent tables first.
    // Adapt these model names to the actual Prisma schema.

    await tx.emailLog?.deleteMany?.({});
    await tx.workflowLog?.deleteMany?.({});
    await tx.systemLog?.deleteMany?.({});
    await tx.auditLog?.deleteMany?.({});
    await tx.notification?.deleteMany?.({});
    await tx.adminTask?.deleteMany?.({});
    await tx.paymentHistory?.deleteMany?.({});
    await tx.payment?.deleteMany?.({});
    await tx.contractFile?.deleteMany?.({});
    await tx.contract?.deleteMany?.({});
    await tx.bookingActivity?.deleteMany?.({});
    await tx.bookingTimeline?.deleteMany?.({});
    await tx.calendarEvent?.deleteMany?.({});
    await tx.attachment?.deleteMany?.({});
    await tx.uploadedFile?.deleteMany?.({});
    await tx.inquiry?.deleteMany?.({});
    await tx.testimonial?.deleteMany?.({});
    await tx.supportFaqEntry?.deleteMany?.({});
    await tx.supportCenterEntry?.deleteMany?.({});
    await tx.package?.deleteMany?.({});
    await tx.service?.deleteMany?.({});
    await tx.eventCategory?.deleteMany?.({});
    await tx.booking?.deleteMany?.({});

    // Do not delete users.
  });

  console.log("Database cleanup completed. Users were preserved.");
}

main()
  .catch((error) => {
    console.error("Database cleanup failed.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Important:

```text
The optional chaining above may not work depending on Prisma model names.
Codex must inspect the actual Prisma schema and use the correct model names.
```

---

## 8. Alternative PostgreSQL Raw SQL Strategy

If Prisma model mapping is difficult, create a safe raw PostgreSQL cleanup script that truncates all tables except:

```text
users
_prisma_migrations
```

Use with extreme caution.

Suggested SQL concept:

```sql
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT IN ('users', '_prisma_migrations')
    )
    LOOP
        EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
    END LOOP;
END $$;
```

Important:

```text
Only use this after confirming exact table names.
Only run this after backup.
Do not run this automatically.
```

---

## 9. Backup Requirement Before Cleanup

Before deleting any data:

1. Create a PostgreSQL backup.
2. Confirm backup file exists.
3. Confirm environment is correct.
4. Confirm database connection points to the intended database.
5. Confirm user table is excluded from cleanup.
6. Confirm cleanup command requires `--confirm`.

Recommended backup command example:

```bash
pg_dump "$DATABASE_URL" > backup-before-cleanup.sql
```

If using Supabase or hosted PostgreSQL, use the platform backup/export option before running cleanup.

---

## 10. Verification After Database Cleanup

After cleanup, verify through PostgreSQL:

```sql
SELECT COUNT(*) FROM users;
```

The result must show existing users.

Then check all other tables:

```sql
SELECT COUNT(*) FROM bookings;
SELECT COUNT(*) FROM payments;
SELECT COUNT(*) FROM contracts;
SELECT COUNT(*) FROM email_logs;
SELECT COUNT(*) FROM notifications;
SELECT COUNT(*) FROM admin_tasks;
```

Expected result:

```text
users = preserved
all other cleaned tables = 0 records
```

Also verify login still works.

---

## 11. System File Cleanup Objective

Remove all unnecessary files and restructure the project into a clean architecture.

Delete files only if they are:

1. Demo-only
2. Mock-only
3. Sample-only
4. Temporary
5. Duplicate
6. Dead code
7. Unused
8. Presentation-only
9. Old implementation replaced by production version
10. Not imported or referenced anywhere

Do not delete files that are active production logic.

---

## 12. Files and Folders to Inspect for Removal

Search and inspect these patterns:

```text
demo
mock
sample
temporary
bridge
presentation
fake
seed-demo
demo-seed
test-data
placeholder
unused
old
backup
copy
```

Possible folders to clean:

```text
scripts/demo
scripts/seed-demo
scripts/demo-bridge
lib/demo
lib/demo-bridge
utils/demo
data/demo
data/mock
data/sample
app/api/demo
app/api/demo-bridge
src/app/api/demo
src/app/api/demo-bridge
```

Only delete after verifying that they are not used by real production features.

---

## 13. Remove Demo Client-Admin Bridge Completely

Remove all Demo Client-to-Admin Bridge files, routes, and references.

Search keywords:

```text
demoBridge
demo_bridge
demo client admin bridge
Demo Client-to-Admin Bridge
temporaryBridge
demo booking submit
ZION-DEMO
demo mode
```

Remove:

```text
demo routes
demo helpers
demo scripts
demo data generators
demo reset scripts
demo UI buttons
demo labels
demo environment variables
demo documentation references inside active app code
```

---

## 14. Move All Markdown Files Into One Folder

Move all `.md` files inside the system into one folder.

Recommended folder:

```text
docs/
```

Optional subfolders:

```text
docs/plans/
docs/setup/
docs/n8n/
docs/archive/
```

If there are many files, use this structure:

```text
docs/
  README.md
  plans/
  n8n/
  architecture/
  archived-prompts/
```

Rules:

1. Do not delete Markdown files unless they are confirmed duplicates or irrelevant.
2. Move project documentation into `docs/`.
3. Update links if README or documentation references changed paths.
4. Keep important implementation plans organized.
5. Do not move Markdown files inside `node_modules`.
6. Do not move Markdown files inside generated build folders.
7. Do not move package/license Markdown files from dependencies.

---

## 15. Markdown Files to Move

Move files such as:

```text
*.md
```

from the project root or scattered folders into:

```text
docs/
```

Examples:

```text
n8n-step-1.md → docs/n8n/n8n-step-1.md
deployment-plan.md → docs/plans/deployment-plan.md
support-center-plan.md → docs/plans/support-center-plan.md
```

Keep the root `README.md` only if it is the official project entry documentation.

If there are multiple temporary prompt files, move them to:

```text
docs/archived-prompts/
```

---

## 16. Clean Project Architecture Target

After cleanup, the system should look clean and production-ready.

Recommended structure:

```text
app/
  api/
  admin/
  client/
components/
  admin/
  client/
  shared/
lib/
  auth/
  db/
  n8n/
  security/
  validations/
services/
  booking/
  payment/
  contract/
  notification/
  email/
  task/
prisma/
  schema.prisma
  migrations/
scripts/
  clean-database-except-users.ts
docs/
  README.md
  plans/
  n8n/
  architecture/
public/
styles/
```

Codex must adapt this structure to the existing framework and project conventions.

---

## 17. Remove Unused Imports and Dead Code

After deleting files:

1. Run TypeScript check.
2. Run lint.
3. Run build.
4. Fix broken imports.
5. Remove unused imports.
6. Remove unused exports.
7. Remove unused components.
8. Remove unused helper functions.
9. Remove unused environment variables.
10. Remove old comments related to demo mode.

Recommended commands:

```bash
npm run lint
npm run typecheck
npm run build
```

If `typecheck` does not exist, add or use the project’s existing TypeScript validation command.

---

## 18. Environment Cleanup

Remove demo-only environment variables:

```env
DEMO_MODE=
ENABLE_DEMO_BRIDGE=
NEXT_PUBLIC_DEMO_MODE=
NEXT_PUBLIC_ENABLE_DEMO=
DEMO_BRIDGE_SECRET=
DEMO_SEED_ENABLED=
```

Keep production variables:

```env
DATABASE_URL=
NEXTAUTH_SECRET=
BOOKING_ORCHESTRATION_API_KEY=
N8N_BOOKING_WEBHOOK_URL=
N8N_WEBHOOK_SECRET=
SMTP credentials
EMAIL provider credentials
```

No secret should be exposed through `NEXT_PUBLIC_`.

---

## 19. Package Scripts Cleanup

Clean `package.json`.

Remove demo-related scripts:

```text
demo:on
demo:off
demo:seed
demo:reset
demo:cleanup
seed:demo
bridge:demo
mock:seed
sample:seed
```

Keep production scripts:

```text
dev
build
start
lint
typecheck
db:migrate
db:generate
db:seed-production-defaults, if needed
db:clean-except-users
```

---

## 20. Testing After Cleanup

After database and file cleanup, run these tests:

### Test A: Database

1. Check PostgreSQL users table.
2. Confirm users remain.
3. Confirm all other target tables are empty.
4. Confirm no demo records remain.
5. Confirm no `ZION-DEMO` references remain in database.

### Test B: Authentication

1. Login as Super Admin.
2. Login as Admin.
3. Confirm RBAC still works.
4. Confirm protected routes remain protected.

### Test C: Admin Panel

1. Open Dashboard.
2. Confirm no fake data appears.
3. Open Booking Management.
4. Confirm no old bookings appear.
5. Open Email Logs, Notifications, Tasks, Contracts, Payments, Inquiries.
6. Confirm empty states appear correctly.

### Test D: Client Panel

1. Open client pages.
2. Confirm no demo labels appear.
3. Submit real booking.
4. Confirm booking saves to database.
5. Confirm n8n workflow runs.
6. Confirm email/log/task/notification flow works.

### Test E: Build

1. Run lint.
2. Run typecheck.
3. Run build.
4. Fix all errors.

---

## 21. Acceptance Criteria

This task is complete only if:

1. PostgreSQL is clean except users and required migration metadata.
2. User accounts remain login-capable.
3. No demo bridge code remains.
4. No demo API routes remain.
5. No mock/static/demo records remain.
6. No demo UI labels remain.
7. All `.md` files are organized in `docs/` or approved documentation folders.
8. Unused files are removed.
9. Imports are fixed.
10. Project builds successfully.
11. n8n production booking workflow still works.
12. Error handler workflow still works.
13. System architecture is cleaner, well-structured, and production-ready.

---

## 22. Final Instruction for Codex

Perform a careful production cleanup and architecture overhaul.

Delete all database records except users and required migration metadata.

Remove all unnecessary, unused, obsolete, demo, mock, temporary, duplicate, and dead files.

Remove the Demo Client-to-Admin Bridge completely.

Move all Markdown files into a dedicated `docs/` folder with organized subfolders.

Do not delete user accounts.

Do not drop tables.

Do not damage migrations.

Do not expose secrets.

Run validation checks after cleanup and ensure the system remains fully functional with real production data and n8n orchestration.
