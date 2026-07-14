-- Run once in the Supabase SQL editor, or apply with the Supabase management API.
-- Server uploads use SUPABASE_SECRET_KEY and bypass Storage RLS. No client write
-- policies are created. Public buckets expose reads only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'payment-proofs', 'payment-proofs', false, 4194304,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  ),
  (
    'testimony-photos', 'testimony-photos', true, 4194304,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'profile-media', 'profile-media', true, 2097152,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'command-center-drafts', 'command-center-drafts', false, 15728640,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'assistant-source-documents', 'assistant-source-documents', false, 26214400,
    array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  ),
  (
    'public-content-media', 'public-content-media', true, 15728640,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
