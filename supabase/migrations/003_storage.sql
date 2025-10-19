-- =====================================================
-- AVALIATEC - STORAGE CONFIGURATION
-- Configuração do Storage Bucket e Policies
-- =====================================================

-- =====================================================
-- 1. CRIAR BUCKET (via SQL)
-- =====================================================

-- Inserir bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. STORAGE POLICIES
-- =====================================================

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "Usuários podem visualizar arquivos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem fazer upload" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar seus uploads" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar seus uploads" ON storage.objects;

-- Policy: Usuários autenticados podem ver arquivos
CREATE POLICY "Usuários podem visualizar arquivos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'project-files');

-- Policy: Usuários autenticados podem fazer upload
CREATE POLICY "Usuários podem fazer upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'project-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Usuários podem atualizar seus próprios arquivos
CREATE POLICY "Usuários podem atualizar seus uploads"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'project-files'
    AND owner = auth.uid()
  );

-- Policy: Usuários podem deletar seus próprios uploads OU admins podem deletar qualquer arquivo
CREATE POLICY "Usuários podem deletar seus uploads"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'project-files'
    AND (
      owner = auth.uid()
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    )
  );

-- =====================================================
-- STORAGE CONFIGURADO! ✅
-- =====================================================

-- ESTRUTURA DE PASTAS RECOMENDADA:
-- project-files/
--   {user_id}/
--     projects/
--       {project_id}/
--         documents/
--         images/
--         reports/
--     temp/

-- Exemplo de path:
-- project-files/550e8400-e29b-41d4-a716-446655440000/projects/123/documents/laudo.pdf
