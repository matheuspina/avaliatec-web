-- =====================================================
-- Sincroniza public.users com auth.users
-- - Trigger: cada novo registro em auth.users ganha linha em public.users
-- - Backfill: usuários auth existentes sem public.users (ex.: OAuth Microsoft)
-- =====================================================

CREATE OR REPLACE FUNCTION public.sync_public_user_from_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid;
  v_email text;
  v_full_name text;
  v_avatar text;
BEGIN
  IF EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  SELECT id
  INTO v_group_id
  FROM public.user_groups
  WHERE is_default = true
  ORDER BY name
  LIMIT 1;

  IF v_group_id IS NULL THEN
    SELECT id INTO v_group_id FROM public.user_groups WHERE name = 'Atendimento' LIMIT 1;
  END IF;

  v_email := NULLIF(trim(COALESCE(NEW.email, '')), '');
  IF v_email IS NULL THEN
    v_email := 'user_' || NEW.id::text || '@avaliatec.local';
  END IF;

  SELECT p.full_name, p.avatar_url
  INTO v_full_name, v_avatar
  FROM public.profiles p
  WHERE p.id = NEW.id;

  v_full_name := COALESCE(
    NULLIF(trim(v_full_name), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'name', '')), ''),
    NULLIF(trim(
      COALESCE(NEW.raw_user_meta_data->>'given_name', '') || ' ' ||
      COALESCE(NEW.raw_user_meta_data->>'family_name', '')
    ), ''),
    split_part(v_email, '@', 1)
  );

  v_avatar := COALESCE(
    NULLIF(trim(v_avatar), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'picture', '')), '')
  );

  INSERT INTO public.users (auth_user_id, email, full_name, avatar_url, group_id, status)
  VALUES (NEW.id, v_email, v_full_name, v_avatar, v_group_id, 'active');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_sync_public_users ON auth.users;
CREATE TRIGGER on_auth_user_created_sync_public_users
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_public_user_from_auth_user();

-- Retroativo: auth existente sem linha em public.users
INSERT INTO public.users (auth_user_id, email, full_name, avatar_url, group_id, status, created_at)
SELECT
  au.id,
  COALESCE(NULLIF(trim(au.email), ''), 'user_' || au.id::text || '@avaliatec.local'),
  COALESCE(
    NULLIF(trim(p.full_name), ''),
    NULLIF(trim(COALESCE(au.raw_user_meta_data->>'full_name', '')), ''),
    NULLIF(trim(COALESCE(au.raw_user_meta_data->>'name', '')), ''),
    NULLIF(trim(
      COALESCE(au.raw_user_meta_data->>'given_name', '') || ' ' ||
      COALESCE(au.raw_user_meta_data->>'family_name', '')
    ), ''),
    split_part(COALESCE(NULLIF(trim(au.email), ''), 'user@local'), '@', 1)
  ),
  COALESCE(
    NULLIF(trim(p.avatar_url), ''),
    NULLIF(trim(COALESCE(au.raw_user_meta_data->>'avatar_url', '')), ''),
    NULLIF(trim(COALESCE(au.raw_user_meta_data->>'picture', '')), '')
  ),
  CASE
    WHEN p.id IS NOT NULL THEN
      (SELECT id FROM public.user_groups WHERE name = 'Administrador' LIMIT 1)
    ELSE
      COALESCE(
        (SELECT id FROM public.user_groups WHERE is_default = true LIMIT 1),
        (SELECT id FROM public.user_groups WHERE name = 'Atendimento' LIMIT 1)
      )
  END,
  'active',
  COALESCE(p.created_at, au.created_at, NOW())
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.auth_user_id = au.id
);
