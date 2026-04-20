-- ============================================================
-- Jalankan seluruh file ini di Supabase SQL Editor
-- ============================================================

-- ── 1. Reset password oleh admin (perlu login sebagai admin) ─────────────────
CREATE OR REPLACE FUNCTION admin_reset_user_password(p_user_id UUID, p_new_password TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, public, auth
AS $$
BEGIN
  -- Hanya email admin yang boleh
  IF (SELECT email FROM auth.users WHERE id = auth.uid())
     NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE auth.users
  SET encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf'))
  WHERE id = p_user_id;
END;
$$;

-- ── 2. Reset password tanpa login (untuk halaman Lupa Password) ──────────────
-- CATATAN: Siapapun yang tahu email bisa reset password — cocok untuk app internal.
CREATE OR REPLACE FUNCTION reset_password_by_email(p_email TEXT, p_new_password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = extensions, public, auth
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

  IF v_user_id IS NULL THEN
    RETURN 'not_found';
  END IF;

  UPDATE auth.users
  SET encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf'))
  WHERE id = v_user_id;

  RETURN 'ok';
END;
$$;

GRANT EXECUTE ON FUNCTION reset_password_by_email TO anon;
GRANT EXECUTE ON FUNCTION reset_password_by_email TO authenticated;

-- ── 3. Konfirmasi email user (dipanggil setelah admin buat user baru) ─────────
CREATE OR REPLACE FUNCTION admin_confirm_user_email(p_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF (SELECT email FROM auth.users WHERE id = auth.uid())
     NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE auth.users
  SET email_confirmed_at = NOW(),
      confirmed_at       = NOW()
  WHERE email = p_email
    AND email_confirmed_at IS NULL;
END;
$$;

-- ── 4. Daftar semua user (untuk tab Kelola User di admin panel) ───────────────
CREATE OR REPLACE FUNCTION admin_get_all_users()
RETURNS TABLE(
  id              UUID,
  email           TEXT,
  full_name       TEXT,
  plan            TEXT,
  plan_status     TEXT,
  created_at      TIMESTAMPTZ,
  plan_expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF (SELECT au.email FROM auth.users au WHERE au.id = auth.uid())
     NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    up.id,
    up.email,
    up.full_name,
    up.plan,
    up.plan_status,
    up.created_at,
    up.plan_expires_at
  FROM user_profiles up
  ORDER BY up.created_at DESC;
END;
$$;

-- ── 5. Upgrade user langsung tanpa payment flow ───────────────────────────────
CREATE OR REPLACE FUNCTION admin_direct_upgrade(p_user_id UUID, p_plan TEXT, p_months INT DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_expires_at TIMESTAMPTZ;
BEGIN
  IF (SELECT email FROM auth.users WHERE id = auth.uid())
     NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF p_plan = 'starter' THEN
    v_expires_at := NULL;
  ELSE
    v_expires_at := NOW() + (p_months || ' months')::INTERVAL;
  END IF;

  UPDATE user_profiles
  SET
    plan            = p_plan,
    plan_status     = 'active',
    plan_expires_at = v_expires_at,
    updated_at      = NOW()
  WHERE id = p_user_id;
END;
$$;

-- ── 6. Hapus user (dari user_profiles — auth.users perlu service role) ────────
CREATE OR REPLACE FUNCTION admin_delete_user(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF (SELECT email FROM auth.users WHERE id = auth.uid())
     NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  DELETE FROM user_profiles WHERE id = p_user_id;
  -- Catatan: baris di auth.users tetap ada karena butuh service role untuk hapus sepenuhnya.
  -- User tidak akan bisa login karena profile-nya sudah dihapus.
END;
$$;

-- ── Selesai! ─────────────────────────────────────────────────────────────────
-- Setelah menjalankan SQL ini, matikan email confirmation di Supabase:
-- Authentication → Settings → "Enable email confirmations" → OFF
-- Authentication → Settings → "Secure email change" → OFF
