-- Bluey media v1: pictures (and later videos) a signed-in person makes with Bluey.
-- Run once in the Supabase SQL editor (project Bluey-AI-Friend). Undo: media_v1_down.sql.
--
-- Who can do what:
-- - People can only READ their own creations (row level security). They can't insert, change,
--   or delete rows themselves, so nobody can reset their own daily limit.
-- - Every write goes through the server (api/media/*), which checks the person's sign-in token
--   and uses the secret key. reserve_creation() is callable only with that key.
-- - Files live in the private `creations` storage bucket under <user id>/. There are no storage
--   policies for signed-in people: the server uploads, deletes, and hands out short-lived links.

create table if not exists public.creations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('image', 'video')),
  parent_id uuid references public.creations(id) on delete set null,   -- a new version points to the one it changed
  prompt text not null default '' check (char_length(prompt) <= 1000),            -- the person's own words
  expanded_prompt text not null default '' check (char_length(expanded_prompt) <= 4000), -- the prompt Bluey wrote
  why text not null default '' check (char_length(why) <= 500),                   -- why that prompt works (shown to the person)
  provider text not null default '',
  model text not null default '',
  status text not null default 'pending' check (status in ('pending', 'running', 'done', 'failed', 'deleted')),
  storage_path text,
  thumb_path text,
  job_id text,                 -- video jobs (later)
  progress int check (progress between 0 and 100),
  error text check (char_length(error) <= 300),
  cost_estimate numeric(10, 4), -- US dollars, from the provider's usage numbers
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists creations_user_created on public.creations (user_id, created_at desc);
create index if not exists creations_parent on public.creations (parent_id);

alter table public.creations enable row level security;

revoke all on public.creations from anon, authenticated;
grant select on public.creations to authenticated;

drop policy if exists "creations: read own" on public.creations;
create policy "creations: read own" on public.creations
  for select to authenticated using (user_id = (select auth.uid()));

-- Start a creation if the person is under their daily limit (the last 24 hours, by type).
-- Failed tries don't count; deleted creations still do (so deleting doesn't reset the limit).
-- Returns the new id, or null when the limit is reached. A per-person lock stops two requests
-- at once from both slipping under the limit.
create or replace function public.reserve_creation(
  p_user uuid, p_type text, p_limit int, p_parent uuid,
  p_prompt text, p_expanded text, p_why text, p_provider text, p_model text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_used int;
  v_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('creations:' || p_user::text || ':' || p_type, 0));
  select count(*) into v_used from public.creations
    where user_id = p_user and type = p_type and status <> 'failed'
      and created_at > now() - interval '24 hours';
  if v_used >= p_limit then
    return null;
  end if;
  insert into public.creations (user_id, type, parent_id, prompt, expanded_prompt, why, provider, model, status)
    values (p_user, p_type, p_parent, left(p_prompt, 1000), left(p_expanded, 4000), left(p_why, 500), p_provider, p_model, 'pending')
    returning id into v_id;
  return v_id;
end $$;

revoke execute on function public.reserve_creation(uuid, text, int, uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.reserve_creation(uuid, text, int, uuid, text, text, text, text, text) to service_role;

-- Private bucket for the files. 50 MB per file; images and mp4 only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('creations', 'creations', false, 52428800, array['image/jpeg', 'image/png', 'image/webp', 'video/mp4'])
on conflict (id) do nothing;
