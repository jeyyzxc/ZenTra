# ZENTRA Command Center deployment

> The canonical Vercel + Supabase + Render deployment procedure is
> [`deployment/vercel-supabase-render.md`](deployment/vercel-supabase-render.md). This
> page records Command Center-specific migration and release gates.

The Command Center is served at `/admin/command-center`. The old `/admin/support` and
`/admin/task-templates` pages redirect into the corresponding workspace.

## Required database preparation

1. Back up PostgreSQL and existing Supabase Storage metadata.
2. Confirm the PostgreSQL role can install/use `pgvector`. The migration intentionally
   fails if `CREATE EXTENSION vector` is unavailable; there is no incompatible fallback.
3. Apply `prisma/migrations/20260714120000_add_zentra_command_center/migration.sql`.
4. Run `npm run db:generate`, then deploy the application and n8n worker together.

The migration creates immutable publication records, the transactional job queue,
knowledge index generations, redacted assistant analytics, booking-scoped access grants,
stable task item keys, and task-migration audit records. It conservatively locks existing
template-generated booking tasks because their pre-migration content cannot be proven
compatible. It also backfills complete FAQ snapshots, seeds the real Gallery, Facilities,
and Rules content as published version 1, and creates draft-only Privacy and Terms records.

## Protected application configuration

Set all variables shown in `.env.example`. In particular:

- Keep `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CLIENT_ACCESS_HASH_SECRET`, and
  `BACKEND_ORCHESTRATION_SECRET` server-only. Never prefix them with `NEXT_PUBLIC_`.
- The Gemini model variables are allowlisted behind the provider adapter. Changing the
  embedding model or dimension requires building a complete new index generation before
  atomic cutover.
- `CLIENT_ACCESS_DEV_CODE` is development-only and must be absent in production.
- A production document scanner is mandatory. Without `DOCUMENT_MALWARE_SCANNER_URL`,
  PDF and DOCX ingestion is rejected in production.

## Supabase Storage

Create the buckets defined by `supabase/storage-buckets.sql`. The Command Center uses:

- `command-center-drafts`: private
- `assistant-source-documents`: private
- `public-content-media`: public, immutable published assets

Draft previews use short-lived signed URLs. Publishing copies approved media into the
public bucket. Do not grant clients write access; the application performs validated
server-side uploads with the service-role key.

## n8n worker

Import `docs/n8n/zentra-command-center-worker.workflow.json` and configure these n8n
environment values:

- `ZION_BACKEND_URL`: the deployed application origin
- `BACKEND_ORCHESTRATION_SECRET`: the same protected backend secret used by the app

The workflow name/header must remain `ZENTRA - Command Center Worker`. Run it every minute.
It receives only job IDs and safe metadata; PostgreSQL, Gemini, document bodies, and
Supabase service-role credentials stay in the application.

Configure `N8N_CLIENT_ACCESS_WEBHOOK_URL` for one-time booking verification delivery.
The delivery workflow must not return whether a booking exists to the public caller.

## Release gates

- Obtain legal approval before the first Privacy or Terms publication.
- Keep Contract Management clauses and generation behavior unchanged.
- Do not enable supplier retrieval until a supplier source and authorization policy exist.
- Verify Super Admin mutations, ordinary Admin read/test access, guest/client ownership
  boundaries, scheduled publication, index cutover, worker retries, and deterministic
  provider-outage fallbacks before production traffic is enabled.
