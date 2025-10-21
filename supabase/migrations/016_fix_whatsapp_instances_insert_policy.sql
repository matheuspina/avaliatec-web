-- Fix INSERT policy for whatsapp_instances
-- 
-- Problem: The policy was checking created_by = get_current_user_id()
-- but created_by references profiles(id) which is auth.uid(), not users.id
--
-- Solution: Change the policy to use auth.uid() directly

DROP POLICY IF EXISTS "Users can create WhatsApp instances with atendimento permission" ON whatsapp_instances;

CREATE POLICY "Users can create WhatsApp instances with atendimento permission"
  ON whatsapp_instances FOR INSERT
  WITH CHECK (
    user_has_permission('atendimento', 'create') AND
    created_by = auth.uid()
  );

-- Add comment
COMMENT ON POLICY "Users can create WhatsApp instances with atendimento permission" ON whatsapp_instances IS
'Allows users with atendimento create permission to create WhatsApp instances. The created_by field must match the authenticated user ID (auth.uid()).';
