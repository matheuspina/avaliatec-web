-- =====================================================
-- AVALIATEC - FIX EVENTS SCHEMA
-- Corrige o schema da tabela events para o formato correto
-- =====================================================

-- Verifica e corrige o schema da tabela events
DO $$
BEGIN
  -- Se start_time existir, precisamos migrar os dados
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'start_time'
  ) THEN
    -- Se event_date não existir, criar
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'events' AND column_name = 'event_date'
    ) THEN
      -- Adicionar event_date
      ALTER TABLE events ADD COLUMN event_date DATE;

      -- Migrar dados de start_time para event_date
      UPDATE events SET event_date = start_time::date WHERE start_time IS NOT NULL;

      -- Tornar event_date NOT NULL
      ALTER TABLE events ALTER COLUMN event_date SET NOT NULL;
    END IF;

    -- Se event_time não existir, criar
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'events' AND column_name = 'event_time'
    ) THEN
      -- Adicionar event_time
      ALTER TABLE events ADD COLUMN event_time TIME;

      -- Migrar dados de start_time para event_time
      UPDATE events SET event_time = start_time::time WHERE start_time IS NOT NULL;

      -- Tornar event_time NOT NULL
      ALTER TABLE events ALTER COLUMN event_time SET NOT NULL;
    END IF;

    -- Remover start_time
    ALTER TABLE events DROP COLUMN start_time;

    -- Remover end_time se existir
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'events' AND column_name = 'end_time'
    ) THEN
      ALTER TABLE events DROP COLUMN end_time;
    END IF;

    RAISE NOTICE 'Schema da tabela events corrigido com sucesso!';
  ELSE
    -- Verificar se event_date e event_time existem
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'events' AND column_name = 'event_date'
    ) THEN
      ALTER TABLE events ADD COLUMN event_date DATE NOT NULL DEFAULT CURRENT_DATE;
      RAISE NOTICE 'Coluna event_date adicionada!';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'events' AND column_name = 'event_time'
    ) THEN
      ALTER TABLE events ADD COLUMN event_time TIME NOT NULL DEFAULT '10:00:00';
      RAISE NOTICE 'Coluna event_time adicionada!';
    END IF;

    RAISE NOTICE 'Schema da tabela events já está correto!';
  END IF;
END $$;

-- Garantir que os índices estão corretos
DROP INDEX IF EXISTS idx_events_start_time;
DROP INDEX IF EXISTS idx_events_end_time;

-- Recriar índice para event_date se necessário
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);

-- =====================================================
-- SCHEMA EVENTS CORRIGIDO! ✅
-- =====================================================
