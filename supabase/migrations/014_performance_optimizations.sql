-- Performance Optimization Migration
-- This migration adds additional indexes and optimizations for WhatsApp functionality

-- Additional composite indexes for better query performance

-- Composite index for contact list queries (instance + last_message_at for sorting)
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_instance_last_message 
ON whatsapp_contacts(instance_id, last_message_at DESC NULLS LAST);

-- Composite index for contact search queries (instance + contact_type + name)
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_instance_type_name 
ON whatsapp_contacts(instance_id, contact_type, name);

-- Composite index for contact phone search (instance + phone_number)
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_instance_phone 
ON whatsapp_contacts(instance_id, phone_number);

-- Composite index for message pagination (contact + timestamp for cursor-based pagination)
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact_timestamp 
ON whatsapp_messages(contact_id, timestamp DESC);

-- Composite index for unread message count queries (contact + from_me + read status)
-- Note: We'll add read_at column for proper read status tracking
ALTER TABLE whatsapp_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_unread 
ON whatsapp_messages(contact_id, from_me, read_at) 
WHERE from_me = false AND read_at IS NULL;

-- Index for message status queries (useful for retry mechanisms)
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status_timestamp 
ON whatsapp_messages(status, timestamp DESC) 
WHERE status IN ('pending', 'failed');

-- Partial index for active instances (only connected/connecting instances)
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_active 
ON whatsapp_instances(status, last_seen_at DESC) 
WHERE status IN ('connected', 'connecting');

-- Index for auto-reply log queries (prevent duplicate auto-replies)
CREATE INDEX IF NOT EXISTS idx_whatsapp_auto_reply_log_contact_date 
ON whatsapp_auto_reply_log(contact_id, sent_at::date);

-- Index for quick message shortcut lookups (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_whatsapp_quick_messages_shortcut_lower 
ON whatsapp_quick_messages(LOWER(shortcut));

-- Add GIN index for JSONB availability_schedule searches
CREATE INDEX IF NOT EXISTS idx_whatsapp_instance_settings_schedule 
ON whatsapp_instance_settings USING GIN (availability_schedule);

-- Optimize text search with trigram indexes for better search performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram index for contact name search
CREATE INDEX IF NOT EXISTS idx_whatsapp_contacts_name_trgm 
ON whatsapp_contacts USING GIN (name gin_trgm_ops);

-- Trigram index for message text content search
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_text_trgm 
ON whatsapp_messages USING GIN (text_content gin_trgm_ops);

-- Add materialized view for contact statistics (optional optimization)
-- This can be refreshed periodically to improve dashboard performance
CREATE MATERIALIZED VIEW IF NOT EXISTS whatsapp_contact_stats AS
SELECT 
  c.id as contact_id,
  c.instance_id,
  c.contact_type,
  COUNT(m.id) as total_messages,
  COUNT(CASE WHEN m.from_me = false AND m.read_at IS NULL THEN 1 END) as unread_count,
  MAX(m.timestamp) as last_message_at,
  COUNT(CASE WHEN m.from_me = true THEN 1 END) as sent_messages,
  COUNT(CASE WHEN m.from_me = false THEN 1 END) as received_messages
FROM whatsapp_contacts c
LEFT JOIN whatsapp_messages m ON c.id = m.contact_id
GROUP BY c.id, c.instance_id, c.contact_type;

-- Index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_contact_stats_contact 
ON whatsapp_contact_stats(contact_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_contact_stats_instance_unread 
ON whatsapp_contact_stats(instance_id, unread_count DESC) 
WHERE unread_count > 0;

-- Function to refresh contact stats (can be called periodically)
CREATE OR REPLACE FUNCTION refresh_whatsapp_contact_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY whatsapp_contact_stats;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON INDEX idx_whatsapp_contacts_instance_last_message IS 'Optimizes contact list sorting by last message date';
COMMENT ON INDEX idx_whatsapp_contacts_instance_type_name IS 'Optimizes contact filtering by type and name search';
COMMENT ON INDEX idx_whatsapp_messages_contact_timestamp IS 'Optimizes message pagination with cursor-based approach';
COMMENT ON INDEX idx_whatsapp_messages_unread IS 'Optimizes unread message count queries';
COMMENT ON MATERIALIZED VIEW whatsapp_contact_stats IS 'Pre-computed contact statistics for better performance';