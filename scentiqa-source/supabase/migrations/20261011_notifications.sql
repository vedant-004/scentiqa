-- Scentarchy notification system: broadcast notifications + per-user read tracking.
-- Run in the Supabase SQL editor.

-- ============ Notifications ============
CREATE TABLE IF NOT EXISTS notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text NOT NULL,
  message    text NOT NULL,
  type       text NOT NULL DEFAULT 'announcement'
             CHECK (type IN ('announcement','new_perfume','giveaway','award','battle','article','system')),
  link_url   text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_reads (
  notification_id uuid NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL,
  read_at         timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON notification_reads(user_id);

-- ============ RLS ============
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;

-- Any signed-in member can read notifications.
DROP POLICY IF EXISTS "notifications_read_authenticated" ON notifications;
CREATE POLICY "notifications_read_authenticated"
  ON notifications FOR SELECT
  TO authenticated
  USING (true);

-- A member can only insert/read their own read records.
DROP POLICY IF EXISTS "notification_reads_own_insert" ON notification_reads;
CREATE POLICY "notification_reads_own_insert"
  ON notification_reads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notification_reads_own_select" ON notification_reads;
CREATE POLICY "notification_reads_own_select"
  ON notification_reads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
