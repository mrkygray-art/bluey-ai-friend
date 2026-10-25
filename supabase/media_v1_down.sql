-- Undo media_v1.sql. Empty the `creations` bucket first (Storage > creations > select all > Delete),
-- because Supabase doesn't allow deleting storage files from SQL.
drop function if exists public.reserve_creation(uuid, text, int, uuid, text, text, text, text, text);
drop table if exists public.creations;
delete from storage.buckets where id = 'creations';
