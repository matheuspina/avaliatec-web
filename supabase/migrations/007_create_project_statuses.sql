-- Criar tabela de status de projetos customizáveis
CREATE TABLE IF NOT EXISTS project_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para ordenação
CREATE INDEX IF NOT EXISTS idx_project_statuses_position ON project_statuses(position);

-- Inserir status padrão
INSERT INTO project_statuses (name, color, description, position, is_active) VALUES
  ('Planejamento', '#3B82F6', 'Projeto em fase de planejamento', 0, true),
  ('Em andamento', '#10B981', 'Projeto em desenvolvimento ativo', 1, true),
  ('Em espera', '#F59E0B', 'Projeto pausado ou aguardando', 2, true),
  ('Concluído', '#6B7280', 'Projeto finalizado com sucesso', 3, true),
  ('Cancelado', '#EF4444', 'Projeto cancelado', 4, true)
ON CONFLICT DO NOTHING;

-- Adicionar referência de status na tabela projects (se ainda não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'projects'
      AND column_name = 'status_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN status_id UUID REFERENCES project_statuses(id) ON DELETE SET NULL;

    -- Migrar status existentes para a nova estrutura
    UPDATE projects p
    SET status_id = (
      SELECT id FROM project_statuses ps
      WHERE ps.name = p.status
      LIMIT 1
    );
  END IF;
END$$;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_project_statuses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_project_statuses_updated_at ON project_statuses;
CREATE TRIGGER trigger_update_project_statuses_updated_at
  BEFORE UPDATE ON project_statuses
  FOR EACH ROW
  EXECUTE FUNCTION update_project_statuses_updated_at();
