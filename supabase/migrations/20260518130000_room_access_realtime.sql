-- Enable Realtime for room invites (postgres_changes on room_access).
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_access;
