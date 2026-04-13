-- Próximo código de projeto no formato AV-AAAA-NNN (sequência por ano, fuso America/Sao_Paulo).
-- SECURITY DEFINER: precisa ver todos os códigos existentes para evitar colisão (RLS restringiria linhas).

CREATE OR REPLACE FUNCTION public.next_project_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  y text := to_char(timezone('America/Sao_Paulo', now()), 'YYYY');
  prefix text := 'AV-' || y || '-';
  max_n bigint;
  next_n bigint;
BEGIN
  SELECT COALESCE(
    MAX((regexp_match(code, '^AV-' || y || '-([0-9]+)$'))[1]::bigint),
    0
  )
  INTO max_n
  FROM projects
  WHERE code ~ ('^AV-' || y || '-[0-9]+$');

  next_n := max_n + 1;
  RETURN prefix || lpad(next_n::text, GREATEST(3, length(next_n::text)), '0');
END;
$$;

COMMENT ON FUNCTION public.next_project_code() IS 'Retorna o próximo código único AV-ANO-SEQ com base nos projetos existentes.';

REVOKE ALL ON FUNCTION public.next_project_code() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_project_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.next_project_code() TO service_role;
