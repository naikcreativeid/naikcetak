-- ============================================================
-- Patch: admin_get_user_history
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Fungsi ini diperlukan karena RLS pada tabel subscription_history
-- hanya mengizinkan user melihat history mereka sendiri.
-- Admin perlu melihat history semua user.

CREATE OR REPLACE FUNCTION admin_get_user_history(p_user_id UUID)
RETURNS TABLE(
  id               UUID,
  user_id          UUID,
  plan             TEXT,
  action           TEXT,
  billing_cycle    TEXT,
  amount_paid      NUMERIC,
  payment_method   TEXT,
  notes            TEXT,
  created_by       UUID,
  created_at       TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF (SELECT email FROM auth.users WHERE id = auth.uid())
     NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    sh.id,
    sh.user_id,
    sh.plan,
    sh.action,
    sh.billing_cycle,
    sh.amount_paid,
    sh.payment_method,
    sh.notes,
    sh.created_by,
    sh.created_at
  FROM subscription_history sh
  WHERE sh.user_id = p_user_id
  ORDER BY sh.created_at DESC
  LIMIT 50;
END;
$$;

-- Selesai!
