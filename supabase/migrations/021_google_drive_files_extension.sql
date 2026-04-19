-- =====================================================
-- AVALIATEC - MIGRATION 021
-- Estender tabela files para integração Google Drive
-- =====================================================

-- Adicionar colunas para metadados de provedor externo
ALTER TABLE files
  ADD COLUMN IF NOT EXISTS external_provider  TEXT,
  ADD COLUMN IF NOT EXISTS external_file_id   TEXT,
  ADD COLUMN IF NOT EXISTS web_view_link       TEXT,
  ADD COLUMN IF NOT EXISTS drive_parent_id     TEXT,
  ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Índice para busca rápida por external_file_id
CREATE INDEX IF NOT EXISTS idx_files_external_file_id
  ON files (external_provider, external_file_id)
  WHERE external_file_id IS NOT NULL;

-- Trigger para manter updated_at atualizado automaticamente
CREATE OR REPLACE FUNCTION set_files_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_files_updated_at ON files;

CREATE TRIGGER trg_files_updated_at
  BEFORE UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION set_files_updated_at();

-- =====================================================
-- MIGRATION 021 CONCLUÍDA ✅
-- =====================================================
