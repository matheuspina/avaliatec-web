-- =====================================================
-- Migration: Add color field to projects
-- Description: Adds color field with auto-generation for project tags
-- =====================================================

-- 1. Adicionar coluna color na tabela projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS color TEXT;

-- 2. Criar função para gerar cor única baseada em UUID
CREATE OR REPLACE FUNCTION generate_project_color(project_id UUID)
RETURNS TEXT AS $$
DECLARE
  hash_val BIGINT;
  hue INT;
  r INT;
  g INT;
  b INT;
BEGIN
  -- Converter primeiros 8 caracteres do UUID (sem hífens) para número
  hash_val := ('x' || substring(replace(project_id::text, '-', ''), 1, 8))::bit(32)::bigint;

  -- Gerar HUE entre 0-360 graus
  hue := (hash_val % 360);

  -- Converter HSL para RGB (S=70%, L=55% para cores vibrantes mas legíveis)
  -- Simplified HSL to RGB conversion for specific S and L values
  IF hue < 60 THEN
    r := 222; g := 80 + (hue * 142 / 60); b := 80;
  ELSIF hue < 120 THEN
    r := 222 - ((hue - 60) * 142 / 60); g := 222; b := 80;
  ELSIF hue < 180 THEN
    r := 80; g := 222; b := 80 + ((hue - 120) * 142 / 60);
  ELSIF hue < 240 THEN
    r := 80; g := 222 - ((hue - 180) * 142 / 60); b := 222;
  ELSIF hue < 300 THEN
    r := 80 + ((hue - 240) * 142 / 60); g := 80; b := 222;
  ELSE
    r := 222; g := 80; b := 222 - ((hue - 300) * 142 / 60);
  END IF;

  -- Retornar cor em formato HEX
  RETURN '#' ||
         LPAD(TO_HEX(r), 2, '0') ||
         LPAD(TO_HEX(g), 2, '0') ||
         LPAD(TO_HEX(b), 2, '0');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Criar trigger para gerar cor automaticamente ao criar projeto
CREATE OR REPLACE FUNCTION set_project_color()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.color IS NULL THEN
    NEW.color := generate_project_color(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_project_color ON projects;
CREATE TRIGGER trigger_set_project_color
  BEFORE INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION set_project_color();

-- 4. Popular cor para projetos existentes
UPDATE projects
SET color = generate_project_color(id)
WHERE color IS NULL;

-- 5. Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_projects_color ON projects(color);

-- 6. Comentários para documentação
COMMENT ON COLUMN projects.color IS 'Cor hex para tag visual do projeto (ex: #FF5733)';
COMMENT ON FUNCTION generate_project_color IS 'Gera cor única baseada no UUID do projeto';
COMMENT ON FUNCTION set_project_color IS 'Trigger function para popular cor automaticamente';
