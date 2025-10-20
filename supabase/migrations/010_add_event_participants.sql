-- =====================================================
-- AVALIATEC - ADD EVENT PARTICIPANTS TABLE
-- Migration: Create event_participants table for many-to-many relationship
-- Version: 1.0.0
-- Date: 2025-01-20
-- =====================================================

-- Create event_participants table
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);

-- Enable RLS
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_participants
DROP POLICY IF EXISTS "Users can view event participants" ON event_participants;
CREATE POLICY "Users can view event participants"
  ON event_participants FOR SELECT
  TO authenticated
  USING (
    is_admin(auth.uid())
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_participants.event_id
      AND e.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can add participants to their events" ON event_participants;
CREATE POLICY "Users can add participants to their events"
  ON event_participants FOR INSERT
  TO authenticated
  WITH CHECK (
    has_permission(auth.uid(), 'agenda', 'edit')
    AND EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_participants.event_id
      AND e.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can remove participants from their events" ON event_participants;
CREATE POLICY "Users can remove participants from their events"
  ON event_participants FOR DELETE
  TO authenticated
  USING (
    has_permission(auth.uid(), 'agenda', 'edit')
    AND EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = event_participants.event_id
      AND e.created_by = auth.uid()
    )
  );

-- Migrate existing events to add creator as participant
INSERT INTO event_participants (event_id, user_id)
SELECT id, created_by
FROM events
WHERE created_by IS NOT NULL
ON CONFLICT (event_id, user_id) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE! ✅
-- =====================================================
