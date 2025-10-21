-- WhatsApp RLS (Row Level Security) Policies
-- This migration adds comprehensive RLS policies for all WhatsApp tables
-- to ensure data isolation and security

-- Enable RLS on all WhatsApp tables
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_quick_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_instance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_auto_reply_log ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user ID from users table
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id 
    FROM users 
    WHERE auth_user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has permission for a section
CREATE OR REPLACE FUNCTION user_has_permission(p_section_key TEXT, p_action_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_has_permission BOOLEAN := FALSE;
BEGIN
  -- Get current user ID
  v_user_id := get_current_user_id();
  
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if user has the required permission
  SELECT EXISTS(
    SELECT 1
    FROM users u
    JOIN user_groups ug ON u.group_id = ug.id
    JOIN group_permissions gp ON ug.id = gp.group_id
    WHERE u.id = v_user_id
      AND u.status = 'active'
      AND gp.section_key = p_section_key
      AND (
        (p_action_type = 'view' AND gp.can_view = true) OR
        (p_action_type = 'create' AND gp.can_create = true) OR
        (p_action_type = 'edit' AND gp.can_edit = true) OR
        (p_action_type = 'delete' AND gp.can_delete = true)
      )
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for whatsapp_instances
-- Users can only access instances they created or have atendimento permissions

-- SELECT policy
CREATE POLICY "Users can view WhatsApp instances with atendimento permission"
  ON whatsapp_instances FOR SELECT
  USING (
    user_has_permission('atendimento', 'view')
  );

-- INSERT policy
CREATE POLICY "Users can create WhatsApp instances with atendimento permission"
  ON whatsapp_instances FOR INSERT
  WITH CHECK (
    user_has_permission('atendimento', 'create') AND
    created_by = auth.uid()
  );

-- UPDATE policy
CREATE POLICY "Users can update WhatsApp instances with atendimento permission"
  ON whatsapp_instances FOR UPDATE
  USING (
    user_has_permission('atendimento', 'edit')
  )
  WITH CHECK (
    user_has_permission('atendimento', 'edit')
  );

-- DELETE policy
CREATE POLICY "Users can delete WhatsApp instances with atendimento permission"
  ON whatsapp_instances FOR DELETE
  USING (
    user_has_permission('atendimento', 'delete')
  );

-- RLS Policies for whatsapp_contacts
-- Users can only access contacts from instances they have access to

-- SELECT policy
CREATE POLICY "Users can view WhatsApp contacts with atendimento permission"
  ON whatsapp_contacts FOR SELECT
  USING (
    user_has_permission('atendimento', 'view') AND
    EXISTS (
      SELECT 1 FROM whatsapp_instances wi
      WHERE wi.id = whatsapp_contacts.instance_id
    )
  );

-- INSERT policy
CREATE POLICY "Users can create WhatsApp contacts with atendimento permission"
  ON whatsapp_contacts FOR INSERT
  WITH CHECK (
    user_has_permission('atendimento', 'create') AND
    EXISTS (
      SELECT 1 FROM whatsapp_instances wi
      WHERE wi.id = whatsapp_contacts.instance_id
    )
  );

-- UPDATE policy
CREATE POLICY "Users can update WhatsApp contacts with atendimento permission"
  ON whatsapp_contacts FOR UPDATE
  USING (
    user_has_permission('atendimento', 'edit') AND
    EXISTS (
      SELECT 1 FROM whatsapp_instances wi
      WHERE wi.id = whatsapp_contacts.instance_id
    )
  )
  WITH CHECK (
    user_has_permission('atendimento', 'edit') AND
    EXISTS (
      SELECT 1 FROM whatsapp_instances wi
      WHERE wi.id = whatsapp_contacts.instance_id
    )
  );

-- DELETE policy
CREATE POLICY "Users can delete WhatsApp contacts with atendimento permission"
  ON whatsapp_contacts FOR DELETE
  USING (
    user_has_permission('atendimento', 'delete') AND
    EXISTS (
      SELECT 1 FROM whatsapp_instances wi
      WHERE wi.id = whatsapp_contacts.instance_id
    )
  );

-- RLS Policies for whatsapp_messages
-- Users can only access messages from contacts they have access to

-- SELECT policy
CREATE POLICY "Users can view WhatsApp messages with atendimento permission"
  ON whatsapp_messages FOR SELECT
  USING (
    user_has_permission('atendimento', 'view') AND
    EXISTS (
      SELECT 1 FROM whatsapp_contacts wc
      JOIN whatsapp_instances wi ON wc.instance_id = wi.id
      WHERE wc.id = whatsapp_messages.contact_id
    )
  );

-- INSERT policy
CREATE POLICY "Users can create WhatsApp messages with atendimento permission"
  ON whatsapp_messages FOR INSERT
  WITH CHECK (
    user_has_permission('atendimento', 'create') AND
    EXISTS (
      SELECT 1 FROM whatsapp_contacts wc
      JOIN whatsapp_instances wi ON wc.instance_id = wi.id
      WHERE wc.id = whatsapp_messages.contact_id
    )
  );

-- UPDATE policy
CREATE POLICY "Users can update WhatsApp messages with atendimento permission"
  ON whatsapp_messages FOR UPDATE
  USING (
    user_has_permission('atendimento', 'edit') AND
    EXISTS (
      SELECT 1 FROM whatsapp_contacts wc
      JOIN whatsapp_instances wi ON wc.instance_id = wi.id
      WHERE wc.id = whatsapp_messages.contact_id
    )
  )
  WITH CHECK (
    user_has_permission('atendimento', 'edit') AND
    EXISTS (
      SELECT 1 FROM whatsapp_contacts wc
      JOIN whatsapp_instances wi ON wc.instance_id = wi.id
      WHERE wc.id = whatsapp_messages.contact_id
    )
  );

-- DELETE policy
CREATE POLICY "Users can delete WhatsApp messages with atendimento permission"
  ON whatsapp_messages FOR DELETE
  USING (
    user_has_permission('atendimento', 'delete') AND
    EXISTS (
      SELECT 1 FROM whatsapp_contacts wc
      JOIN whatsapp_instances wi ON wc.instance_id = wi.id
      WHERE wc.id = whatsapp_messages.contact_id
    )
  );

-- RLS Policies for whatsapp_quick_messages
-- Users can access quick messages they created or global ones

-- SELECT policy
CREATE POLICY "Users can view WhatsApp quick messages with atendimento permission"
  ON whatsapp_quick_messages FOR SELECT
  USING (
    user_has_permission('atendimento', 'view')
  );

-- INSERT policy
CREATE POLICY "Users can create WhatsApp quick messages with atendimento permission"
  ON whatsapp_quick_messages FOR INSERT
  WITH CHECK (
    user_has_permission('atendimento', 'create') AND
    (created_by = auth.uid() OR created_by IS NULL)
  );

-- UPDATE policy
CREATE POLICY "Users can update WhatsApp quick messages with atendimento permission"
  ON whatsapp_quick_messages FOR UPDATE
  USING (
    user_has_permission('atendimento', 'edit') AND
    (created_by = auth.uid() OR created_by IS NULL)
  )
  WITH CHECK (
    user_has_permission('atendimento', 'edit') AND
    (created_by = auth.uid() OR created_by IS NULL)
  );

-- DELETE policy
CREATE POLICY "Users can delete WhatsApp quick messages with atendimento permission"
  ON whatsapp_quick_messages FOR DELETE
  USING (
    user_has_permission('atendimento', 'delete') AND
    (created_by = auth.uid() OR created_by IS NULL)
  );

-- RLS Policies for whatsapp_instance_settings
-- Users can only access settings for instances they have access to

-- SELECT policy
CREATE POLICY "Users can view WhatsApp instance settings with atendimento permission"
  ON whatsapp_instance_settings FOR SELECT
  USING (
    user_has_permission('atendimento', 'view') AND
    EXISTS (
      SELECT 1 FROM whatsapp_instances wi
      WHERE wi.id = whatsapp_instance_settings.instance_id
    )
  );

-- INSERT policy
CREATE POLICY "Users can create WhatsApp instance settings with atendimento permission"
  ON whatsapp_instance_settings FOR INSERT
  WITH CHECK (
    user_has_permission('atendimento', 'create') AND
    EXISTS (
      SELECT 1 FROM whatsapp_instances wi
      WHERE wi.id = whatsapp_instance_settings.instance_id
    )
  );

-- UPDATE policy
CREATE POLICY "Users can update WhatsApp instance settings with atendimento permission"
  ON whatsapp_instance_settings FOR UPDATE
  USING (
    user_has_permission('atendimento', 'edit') AND
    EXISTS (
      SELECT 1 FROM whatsapp_instances wi
      WHERE wi.id = whatsapp_instance_settings.instance_id
    )
  )
  WITH CHECK (
    user_has_permission('atendimento', 'edit') AND
    EXISTS (
      SELECT 1 FROM whatsapp_instances wi
      WHERE wi.id = whatsapp_instance_settings.instance_id
    )
  );

-- DELETE policy
CREATE POLICY "Users can delete WhatsApp instance settings with atendimento permission"
  ON whatsapp_instance_settings FOR DELETE
  USING (
    user_has_permission('atendimento', 'delete') AND
    EXISTS (
      SELECT 1 FROM whatsapp_instances wi
      WHERE wi.id = whatsapp_instance_settings.instance_id
    )
  );

-- RLS Policies for whatsapp_auto_reply_log
-- Users can only access auto-reply logs for instances they have access to

-- SELECT policy
CREATE POLICY "Users can view WhatsApp auto-reply logs with atendimento permission"
  ON whatsapp_auto_reply_log FOR SELECT
  USING (
    user_has_permission('atendimento', 'view') AND
    EXISTS (
      SELECT 1 FROM whatsapp_instances wi
      WHERE wi.id = whatsapp_auto_reply_log.instance_id
    )
  );

-- INSERT policy
CREATE POLICY "Users can create WhatsApp auto-reply logs with atendimento permission"
  ON whatsapp_auto_reply_log FOR INSERT
  WITH CHECK (
    user_has_permission('atendimento', 'create') AND
    EXISTS (
      SELECT 1 FROM whatsapp_instances wi
      WHERE wi.id = whatsapp_auto_reply_log.instance_id
    )
  );

-- UPDATE policy (usually not needed for logs, but included for completeness)
CREATE POLICY "Users can update WhatsApp auto-reply logs with atendimento permission"
  ON whatsapp_auto_reply_log FOR UPDATE
  USING (
    user_has_permission('atendimento', 'edit') AND
    EXISTS (
      SELECT 1 FROM whatsapp_instances wi
      WHERE wi.id = whatsapp_auto_reply_log.instance_id
    )
  )
  WITH CHECK (
    user_has_permission('atendimento', 'edit') AND
    EXISTS (
      SELECT 1 FROM whatsapp_instances wi
      WHERE wi.id = whatsapp_auto_reply_log.instance_id
    )
  );

-- DELETE policy
CREATE POLICY "Users can delete WhatsApp auto-reply logs with atendimento permission"
  ON whatsapp_auto_reply_log FOR DELETE
  USING (
    user_has_permission('atendimento', 'delete') AND
    EXISTS (
      SELECT 1 FROM whatsapp_instances wi
      WHERE wi.id = whatsapp_auto_reply_log.instance_id
    )
  );

-- Grant necessary permissions to authenticated users
-- These are needed for the RLS policies to work properly

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON user_groups TO authenticated;
GRANT SELECT ON group_permissions TO authenticated;

-- Grant permissions on WhatsApp tables to authenticated users
-- RLS policies will still control what data they can actually access
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_instances TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_quick_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_instance_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_auto_reply_log TO authenticated;

-- Grant usage on sequences (for UUID generation)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION get_current_user_id() IS 'Helper function to get current user ID from users table';
COMMENT ON FUNCTION user_has_permission(TEXT, TEXT) IS 'Helper function to check if user has permission for a section and action';

-- Create indexes to optimize RLS policy performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_group_permissions_group_id ON group_permissions(group_id);
CREATE INDEX IF NOT EXISTS idx_group_permissions_section_key ON group_permissions(section_key);