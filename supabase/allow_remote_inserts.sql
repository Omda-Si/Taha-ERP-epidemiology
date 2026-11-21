-- Run once in Supabase → SQL Editor (as project owner).
-- Lets remote clinics insert anonymized rows via the anon/public API key.
-- Patient names are NEVER stored in this table.

alter table if exists public.epidemiology_records
  alter column received_at set default now();

alter table if exists public.epidemiology_records enable row level security;

drop policy if exists "taha_epi_insert" on public.epidemiology_records;
drop policy if exists "taha_epi_select" on public.epidemiology_records;

create policy "taha_epi_insert"
  on public.epidemiology_records
  for insert
  to anon, authenticated
  with check (true);

create policy "taha_epi_select"
  on public.epidemiology_records
  for select
  to anon, authenticated
  using (true);

-- Optional: block updates/deletes from anon (HQ owner can still use service role / Table Editor)
drop policy if exists "taha_epi_no_update" on public.epidemiology_records;
drop policy if exists "taha_epi_no_delete" on public.epidemiology_records;
