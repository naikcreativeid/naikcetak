-- ============================================================
-- BAGIAN 3 FIX — Admin Panel Errors
-- Jalankan SELURUH file ini di Supabase SQL Editor
-- ============================================================


-- ============================================================
-- FIX 1: admin_get_all_users — "structure of query does not match"
--
-- Penyebab: kolom baru (phone_number, company_name, dll) mungkin
-- belum ada di user_profiles, atau versi lama fungsi masih aktif.
-- Solusi: drop lalu recreate dengan kolom yang aman (COALESCE fallback).
-- ============================================================

-- Pastikan kolom-kolom yang dibutuhkan ada (idempotent)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS full_name           TEXT,
  ADD COLUMN IF NOT EXISTS phone_number        VARCHAR(20),
  ADD COLUMN IF NOT EXISTS company_name        VARCHAR(200),
  ADD COLUMN IF NOT EXISTS billing_cycle       VARCHAR(10) DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS plan_started_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_activated_by   VARCHAR(200),
  ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS renewal_count       INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS previous_plan       VARCHAR(20),
  ADD COLUMN IF NOT EXISTS reminded_7days      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminded_3days      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminded_1day       BOOLEAN DEFAULT false;

-- Drop semua varian (dengan/tanpa argumen) untuk menghindari "function already exists"
DROP FUNCTION IF EXISTS admin_get_all_users();
DROP FUNCTION IF EXISTS admin_get_all_users(text);

CREATE FUNCTION admin_get_all_users()
RETURNS TABLE(
  id                   UUID,
  email                TEXT,
  full_name            TEXT,
  company_name         TEXT,
  phone_number         TEXT,
  plan                 TEXT,
  plan_status          TEXT,
  billing_cycle        TEXT,
  created_at           TIMESTAMPTZ,
  plan_started_at      TIMESTAMPTZ,
  plan_expires_at      TIMESTAMPTZ,
  plan_activated_by    TEXT,
  grace_period_ends_at TIMESTAMPTZ,
  renewal_count        INTEGER,
  previous_plan        TEXT,
  reminded_7days       BOOLEAN,
  reminded_3days       BOOLEAN,
  reminded_1day        BOOLEAN
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
    COALESCE(up.email, '')::TEXT,
    COALESCE(up.full_name, '')::TEXT,
    COALESCE(up.company_name, '')::TEXT,
    COALESCE(up.phone_number, '')::TEXT,
    COALESCE(up.plan, 'starter')::TEXT,
    COALESCE(up.plan_status, 'active')::TEXT,
    COALESCE(up.billing_cycle, 'monthly')::TEXT,
    up.created_at,
    up.plan_started_at,
    up.plan_expires_at,
    COALESCE(up.plan_activated_by, '')::TEXT,
    up.grace_period_ends_at,
    COALESCE(up.renewal_count, 0),
    COALESCE(up.previous_plan, '')::TEXT,
    COALESCE(up.reminded_7days, false),
    COALESCE(up.reminded_3days, false),
    COALESCE(up.reminded_1day, false)
  FROM user_profiles up
  ORDER BY up.created_at DESC;
END;
$$;

-- Test:
-- SELECT * FROM admin_get_all_users();


-- ============================================================
-- FIX 2: admin_get_reminder_list — ORDER BY dalam UNION
--
-- Penyebab: ORDER BY di akhir RETURN QUERY dengan UNION ALL
-- ditafsirkan PostgreSQL sebagai milik subquery terakhir,
-- bukan milik seluruh UNION. Solusi: bungkus dalam CTE.
-- ============================================================

DROP FUNCTION IF EXISTS admin_get_reminder_list();

CREATE FUNCTION admin_get_reminder_list()
RETURNS TABLE(
  user_id              UUID,
  user_email           TEXT,
  full_name            TEXT,
  company_name         TEXT,
  phone_number         TEXT,
  plan                 TEXT,
  billing_cycle        TEXT,
  plan_expires_at      TIMESTAMPTZ,
  grace_period_ends_at TIMESTAMPTZ,
  reminder_type        TEXT,
  days_until_expiry    INTEGER
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

  -- CTE menghindari ambiguitas ORDER BY dalam UNION ALL
  RETURN QUERY
  WITH candidates AS (
    -- 7-hari reminder
    SELECT up.id, up.email, up.full_name, up.company_name, up.phone_number,
           up.plan, up.billing_cycle, up.plan_expires_at, up.grace_period_ends_at,
           '7_days'::TEXT AS reminder_type,
           EXTRACT(DAY FROM (up.plan_expires_at - NOW()))::INTEGER AS days_until_expiry
    FROM user_profiles up
    WHERE up.plan != 'starter'
      AND up.plan_status = 'active'
      AND up.plan_expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
      AND COALESCE(up.reminded_7days, false) = false

    UNION ALL

    -- 3-hari reminder
    SELECT up.id, up.email, up.full_name, up.company_name, up.phone_number,
           up.plan, up.billing_cycle, up.plan_expires_at, up.grace_period_ends_at,
           '3_days'::TEXT,
           EXTRACT(DAY FROM (up.plan_expires_at - NOW()))::INTEGER
    FROM user_profiles up
    WHERE up.plan != 'starter'
      AND up.plan_status = 'active'
      AND up.plan_expires_at BETWEEN NOW() AND NOW() + INTERVAL '3 days'
      AND COALESCE(up.reminded_3days, false) = false

    UNION ALL

    -- 1-hari reminder
    SELECT up.id, up.email, up.full_name, up.company_name, up.phone_number,
           up.plan, up.billing_cycle, up.plan_expires_at, up.grace_period_ends_at,
           '1_day'::TEXT,
           EXTRACT(DAY FROM (up.plan_expires_at - NOW()))::INTEGER
    FROM user_profiles up
    WHERE up.plan != 'starter'
      AND up.plan_status = 'active'
      AND up.plan_expires_at BETWEEN NOW() AND NOW() + INTERVAL '1 day'
      AND COALESCE(up.reminded_1day, false) = false

    UNION ALL

    -- Grace period reminder
    SELECT up.id, up.email, up.full_name, up.company_name, up.phone_number,
           up.plan, up.billing_cycle, up.plan_expires_at, up.grace_period_ends_at,
           'grace_period'::TEXT,
           NULL::INTEGER
    FROM user_profiles up
    WHERE up.plan_status = 'grace_period'
      AND COALESCE(up.reminded_expired, false) = false
  )
  -- ORDER BY di luar UNION — tidak ada ambiguitas
  SELECT * FROM candidates
  ORDER BY days_until_expiry ASC NULLS LAST;
END;
$$;

-- Test:
-- SELECT * FROM admin_get_reminder_list();


-- ============================================================
-- FIX 3: get_subscription_stats — pastikan ada dan mengembalikan
-- semua field yang dibutuhkan AdminSubscriptionDashboard
-- ============================================================

CREATE OR REPLACE FUNCTION get_subscription_stats()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_users',      COUNT(*),
    'starter_users',    COUNT(*) FILTER (WHERE plan = 'starter'),
    'pro_users',        COUNT(*) FILTER (WHERE plan = 'pro'      AND plan_status = 'active'),
    'business_users',   COUNT(*) FILTER (WHERE plan = 'business' AND plan_status = 'active'),
    'grace_period',     COUNT(*) FILTER (WHERE plan_status = 'grace_period'),
    'pending_approval', COUNT(*) FILTER (WHERE plan_status IN ('pending_payment','pending_approval')),
    'expiring_7days',   COUNT(*) FILTER (
                          WHERE plan != 'starter'
                          AND   plan_status = 'active'
                          AND   plan_expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
                        ),
    'mrr_estimate',     COALESCE(SUM(CASE
                          WHEN plan = 'pro'      AND plan_status = 'active' AND billing_cycle = 'monthly' THEN 149000
                          WHEN plan = 'pro'      AND plan_status = 'active' AND billing_cycle = 'yearly'  THEN 99000
                          WHEN plan = 'business' AND plan_status = 'active' AND billing_cycle = 'monthly' THEN 349000
                          WHEN plan = 'business' AND plan_status = 'active' AND billing_cycle = 'yearly'  THEN 249000
                          ELSE 0
                        END), 0)
  )
  FROM user_profiles;
$$;

GRANT EXECUTE ON FUNCTION get_subscription_stats TO authenticated;

-- Test:
-- SELECT get_subscription_stats();


-- ============================================================
-- Selesai! Verifikasi semua fungsi:
-- ============================================================
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_schema = 'public'
--   AND routine_name IN (
--     'admin_get_all_users', 'admin_get_reminder_list', 'get_subscription_stats'
--   );
