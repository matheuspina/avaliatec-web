-- Add status_key column to kanban_columns and relax tasks status constraint

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'kanban_columns'
      AND column_name = 'status_key'
  ) THEN
    ALTER TABLE kanban_columns
      ADD COLUMN status_key TEXT;
  END IF;
END$$;

-- Populate status_key for existing records
UPDATE kanban_columns
SET status_key = CASE
  WHEN status_key IS NOT NULL THEN status_key
  WHEN lower(name) = 'a fazer' THEN 'todo'
  WHEN lower(name) = 'em progresso' THEN 'in_progress'
  WHEN lower(name) IN ('em revisão', 'em revisao') THEN 'review'
  WHEN lower(name) IN ('concluído', 'concluido') THEN 'done'
  WHEN lower(name) = 'backlog' THEN 'backlog'
  ELSE 'col_' || substr(id::text, 1, 8)
END
WHERE status_key IS NULL;

-- Ensure status_key is present and unique
ALTER TABLE kanban_columns
  ALTER COLUMN status_key SET NOT NULL;

ALTER TABLE kanban_columns
  DROP CONSTRAINT IF EXISTS kanban_columns_status_key_key;

ALTER TABLE kanban_columns
  ADD CONSTRAINT kanban_columns_status_key_key UNIQUE (status_key);

-- Relax task status constraint to allow custom slugs
ALTER TABLE tasks
  DROP CONSTRAINT IF EXISTS tasks_status_check;

ALTER TABLE tasks
  ADD CONSTRAINT tasks_status_check CHECK (status ~ '^[a-z0-9_]+$');
