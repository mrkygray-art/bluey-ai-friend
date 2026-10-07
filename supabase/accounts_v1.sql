-- Bluey accounts v1: profiles, memories, conversations, messages.
-- Run once in Supabase: Dashboard > Bluey-AI-Friend > SQL Editor > New query > paste > Run.
-- Safe to read before running:
--   * Adds 4 new tables. Does NOT touch the existing beta table "bluey_memories".
--   * Row level security on every table: a signed-in person can only read or change their own rows.
--     Signed-out visitors ("anon") get no access at all.
--   * profiles: one row per account (display name; is_creator can't be changed by users).
--   * memories: what Bluey learned about a person (name, preferences, projects, goals).
--     One active memory per subject, so a new fact replaces the old one. People can delete any memory.
--   * conversations + messages: saved chats.
--   * delete_my_account(): lets a signed-in person delete their account and, through the cascades,
--     every row they own.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  is_creator boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('about_me','preference','project','goal','other')),
  subject text not null check (char_length(subject) between 1 and 80),
  fact text not null check (char_length(fact) between 1 and 500),
  source text not null default 'bluey' check (source in ('bluey','user')),
  status text not null default 'active' check (status in ('active','forgotten')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index memories_user_active on public.memories (user_id, status, updated_at desc);
create unique index memories_one_active_subject on public.memories (user_id, lower(subject)) where status = 'active';

create table public.conversations (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text check (char_length(title) <= 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index conversations_user_recent on public.conversations (user_id, updated_at desc);

create table public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) <= 20000),
  created_at timestamptz not null default now()
);
create index messages_conversation on public.messages (conversation_id, id);
create index messages_user on public.messages (user_id);

alter table public.profiles enable row level security;
alter table public.memories enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "own profile: read" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "own profile: update" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "own memories: read" on public.memories for select to authenticated using (user_id = (select auth.uid()));
create policy "own memories: add" on public.memories for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own memories: change" on public.memories for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own memories: delete" on public.memories for delete to authenticated using (user_id = (select auth.uid()));

create policy "own conversations: read" on public.conversations for select to authenticated using (user_id = (select auth.uid()));
create policy "own conversations: add" on public.conversations for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own conversations: change" on public.conversations for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own conversations: delete" on public.conversations for delete to authenticated using (user_id = (select auth.uid()));

create policy "own messages: read" on public.messages for select to authenticated using (user_id = (select auth.uid()));
create policy "own messages: add" on public.messages for insert to authenticated with check (user_id = (select auth.uid()) and exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = (select auth.uid())));
create policy "own messages: delete" on public.messages for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.profiles, public.memories, public.conversations, public.messages from anon;
revoke update on public.profiles from authenticated;
grant update (display_name, updated_at) on public.profiles to authenticated;

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger memories_touch before update on public.memories for each row execute function public.touch_updated_at();
create trigger conversations_touch before update on public.conversations for each row execute function public.touch_updated_at();

create or replace function public.create_profile_for_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(left(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''), 60), ''))
  on conflict (id) do nothing;
  return new;
end; $$;
revoke execute on function public.create_profile_for_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_profile_for_new_user();

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid();
end; $$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
