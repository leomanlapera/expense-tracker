-- Phase 6 P1: receipt photos.
-- Private bucket `receipts` with per-user folder isolation. Uploaded objects
-- live at `receipts/{user_id}/{uuid}.{ext}` (client enforces path shape;
-- policy enforces first-folder = auth.uid()).

begin;

-- The bucket exists idempotently — safe to re-run.
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

drop policy if exists "receipts: owner can read"   on storage.objects;
drop policy if exists "receipts: owner can insert" on storage.objects;
drop policy if exists "receipts: owner can update" on storage.objects;
drop policy if exists "receipts: owner can delete" on storage.objects;

create policy "receipts: owner can read"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "receipts: owner can insert"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "receipts: owner can update"
  on storage.objects for update
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "receipts: owner can delete"
  on storage.objects for delete
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

commit;
