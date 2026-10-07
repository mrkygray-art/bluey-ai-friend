-- Optional tidy-up for two older functions flagged by Supabase's security advisor (2026-10-07).
-- Run once in Supabase: SQL Editor > New query > paste > Run. Safe: changes permissions only.
-- rls_auto_enable() is an event trigger (it can't really be called through the API), but this
-- removes the warning. set_bluey_memory_updated_at() belongs to the old beta table.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
alter function public.set_bluey_memory_updated_at() set search_path = '';
