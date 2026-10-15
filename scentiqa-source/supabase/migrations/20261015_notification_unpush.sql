-- Scentarchy: allow admin to unpush (retract) a notification without deleting it.
-- Run in the Supabase SQL editor, then the Unpush/Re-push buttons in
-- /admin/notifications will work. Until this runs, the app treats every
-- notification as pushed.

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS is_pushed boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_notifications_pushed
  ON notifications(is_pushed, created_at DESC);
