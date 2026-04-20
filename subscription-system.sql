-- ============================================================
-- SUBSCRIPTION SYSTEM — Jalankan di Supabase SQL Editor
-- Urutan: 1A → 1B → 1C → 1D → 2A → 2B → 2C → 2D → 2E
-- ============================================================

-- ============================================================
-- BAGIAN 1A — Kolom tambahan di user_profiles
-- ============================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS plan VARCHAR(20) DEFAULT 'starter'
    CHECK (plan IN ('starter', 'pro', 'business')),

  ADD COLUMN IF NOT EXISTS plan_status VARCHAR(30) DEFAULT 'active'
    CHECK (plan_status IN (
      'active', 'pending_payment', 'pending_approval',
      'expired', 'cancelled', 'grace_period'
    )),

  ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(10) DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'yearly')),

  ADD COLUMN IF NOT EXISTS plan_started_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_expires_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan_activated_by      VARCHAR(200),
  ADD COLUMN IF NOT EXISTS plan_activated_at      TIMESTAMPTZ,

  ADD COLUMN IF NOT EXISTS downgraded_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS downgrade_reason       VARCHAR(100)
    CHECK (downgrade_reason IN ('expired','payment_failed','admin_manual','user_cancelled')),
  ADD COLUMN IF NOT EXISTS previous_plan          VARCHAR(20),

  ADD COLUMN IF NOT EXISTS renewal_reminded_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS renewal_count          INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grace_period_ends_at   TIMESTAMPTZ,

  ADD COLUMN IF NOT EXISTS reminded_7days         BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminded_3days         BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminded_1day          BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminded_expired       BOOLEAN DEFAULT false,

  ADD COLUMN IF NOT EXISTS full_name              TEXT,
  ADD COLUMN IF NOT EXISTS phone_number           VARCHAR(20),
  ADD COLUMN IF NOT EXISTS company_name           VARCHAR(200);

-- ============================================================
-- BAGIAN 1B — Tabel subscription_history (audit trail)
-- ============================================================

CREATE TABLE IF NOT EXISTS subscription_history (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email          VARCHAR(255),
  action              VARCHAR(30) NOT NULL CHECK (action IN (
                        'activated','renewed','expired','downgraded',
                        'upgraded','cancelled','grace_start','grace_end'
                      )),
  plan_from           VARCHAR(20),
  plan_to             VARCHAR(20),
  billing_cycle       VARCHAR(10),
  period_start        TIMESTAMPTZ,
  period_end          TIMESTAMPTZ,
  amount_paid         INTEGER DEFAULT 0,
  payment_method      VARCHAR(50),
  payment_proof_url   TEXT,
  upgrade_request_id  UUID,
  triggered_by        VARCHAR(30) CHECK (triggered_by IN ('admin','system','user')),
  triggered_by_email  VARCHAR(255),
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_history_action  ON subscription_history(action);
CREATE INDEX IF NOT EXISTS idx_sub_history_created ON subscription_history(created_at DESC);

ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own history" ON subscription_history;
CREATE POLICY "Users read own history"
  ON subscription_history FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- BAGIAN 1C — auto_downgrade_expired_users (dipanggil cron)
-- ============================================================

CREATE OR REPLACE FUNCTION auto_downgrade_expired_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
BEGIN
  -- 1. Expired → masuk grace period 3 hari
  FOR r IN
    SELECT id, email, plan, plan_expires_at
    FROM user_profiles
    WHERE plan != 'starter'
      AND plan_status = 'active'
      AND plan_expires_at < NOW()
      AND grace_period_ends_at IS NULL
  LOOP
    UPDATE user_profiles SET
      plan_status          = 'grace_period',
      grace_period_ends_at = NOW() + INTERVAL '3 days',
      reminded_expired     = false
    WHERE id = r.id;

    INSERT INTO subscription_history
      (user_id, user_email, action, plan_from, plan_to, period_start, period_end, triggered_by, notes)
    VALUES
      (r.id, r.email, 'grace_start', r.plan, r.plan,
       r.plan_expires_at, NOW() + INTERVAL '3 days',
       'system', 'Plan expired — grace period 3 hari dimulai');
  END LOOP;

  -- 2. Grace period selesai → downgrade ke starter
  FOR r IN
    SELECT id, email, plan
    FROM user_profiles
    WHERE plan != 'starter'
      AND plan_status = 'grace_period'
      AND grace_period_ends_at < NOW()
  LOOP
    UPDATE user_profiles SET
      plan_status          = 'active',
      plan                 = 'starter',
      billing_cycle        = 'monthly',
      downgraded_at        = NOW(),
      downgrade_reason     = 'expired',
      previous_plan        = r.plan,
      plan_expires_at      = NULL,
      grace_period_ends_at = NULL,
      reminded_7days       = false,
      reminded_3days       = false,
      reminded_1day        = false,
      reminded_expired     = false
    WHERE id = r.id;

    INSERT INTO subscription_history
      (user_id, user_email, action, plan_from, plan_to, triggered_by, notes)
    VALUES
      (r.id, r.email, 'downgraded', r.plan, 'starter',
       'system', 'Grace period berakhir — otomatis downgrade ke Starter');
  END LOOP;
END;
$$;

-- ============================================================
-- BAGIAN 1D — Cron jobs (aktifkan pg_cron dulu di Extensions)
-- ============================================================

-- Hapus job lama jika ada
SELECT cron.unschedule('auto-downgrade-expired-users') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'auto-downgrade-expired-users'
);

-- Cron: auto downgrade setiap hari 00:01 WIB = 17:01 UTC
SELECT cron.schedule(
  'auto-downgrade-expired-users',
  '1 17 * * *',
  $$SELECT auto_downgrade_expired_users()$$
);

-- ============================================================
-- BAGIAN 2A — Tandai user yang perlu direminder (dipanggil cron)
-- Karena ini React app (bukan Next.js), cron langsung panggil SQL
-- Admin melihat hasilnya di panel dan kirim WA manual/via link
-- ============================================================

CREATE OR REPLACE FUNCTION mark_users_for_reminder()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reset flag agar bisa diremind lagi di periode berikutnya
  -- (hanya reset jika sudah lebih dari 1 hari sejak terakhir diremind)
  UPDATE user_profiles
  SET reminded_7days = false
  WHERE plan != 'starter'
    AND plan_status = 'active'
    AND plan_expires_at BETWEEN NOW() AND NOW() + INTERVAL '8 days'
    AND reminded_7days = true
    AND (renewal_reminded_at IS NULL OR renewal_reminded_at < NOW() - INTERVAL '1 day');

  UPDATE user_profiles
  SET reminded_3days = false
  WHERE plan != 'starter'
    AND plan_status = 'active'
    AND plan_expires_at BETWEEN NOW() AND NOW() + INTERVAL '4 days'
    AND reminded_3days = true
    AND (renewal_reminded_at IS NULL OR renewal_reminded_at < NOW() - INTERVAL '1 day');

  UPDATE user_profiles
  SET reminded_1day = false
  WHERE plan != 'starter'
    AND plan_status = 'active'
    AND plan_expires_at BETWEEN NOW() AND NOW() + INTERVAL '2 days'
    AND reminded_1day = true
    AND (renewal_reminded_at IS NULL OR renewal_reminded_at < NOW() - INTERVAL '1 day');
END;
$$;

SELECT cron.schedule(
  'mark-renewal-reminders',
  '0 1 * * *',
  $$SELECT mark_users_for_reminder()$$
);

-- ── Ambil daftar user yang perlu direminder (untuk admin panel) ──────────────
CREATE OR REPLACE FUNCTION admin_get_reminder_list()
RETURNS TABLE(
  user_id             UUID,
  user_email          TEXT,
  full_name           TEXT,
  company_name        TEXT,
  phone_number        TEXT,
  plan                TEXT,
  billing_cycle       TEXT,
  plan_expires_at     TIMESTAMPTZ,
  grace_period_ends_at TIMESTAMPTZ,
  reminder_type       TEXT,
  days_until_expiry   INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT email FROM auth.users WHERE id = auth.uid())
     NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  -- 7-hari reminder
  SELECT up.id, up.email, up.full_name, up.company_name, up.phone_number,
         up.plan, up.billing_cycle, up.plan_expires_at, up.grace_period_ends_at,
         '7_days'::TEXT,
         EXTRACT(DAY FROM (up.plan_expires_at - NOW()))::INTEGER
  FROM user_profiles up
  WHERE up.plan != 'starter'
    AND up.plan_status = 'active'
    AND up.plan_expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
    AND up.reminded_7days = false

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
    AND up.reminded_3days = false

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
    AND up.reminded_1day = false

  UNION ALL

  -- Grace period reminder
  SELECT up.id, up.email, up.full_name, up.company_name, up.phone_number,
         up.plan, up.billing_cycle, up.plan_expires_at, up.grace_period_ends_at,
         'grace_period'::TEXT,
         NULL
  FROM user_profiles up
  WHERE up.plan_status = 'grace_period'
    AND up.reminded_expired = false

  ORDER BY days_until_expiry ASC NULLS LAST;
END;
$$;

-- Mark reminder sebagai sudah dikirim
CREATE OR REPLACE FUNCTION admin_mark_reminder_sent(p_user_id UUID, p_reminder_type TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT email FROM auth.users WHERE id = auth.uid())
     NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE user_profiles
  SET
    reminded_7days      = CASE WHEN p_reminder_type = '7_days'      THEN true ELSE reminded_7days END,
    reminded_3days      = CASE WHEN p_reminder_type = '3_days'      THEN true ELSE reminded_3days END,
    reminded_1day       = CASE WHEN p_reminder_type = '1_day'       THEN true ELSE reminded_1day  END,
    reminded_expired    = CASE WHEN p_reminder_type = 'grace_period' THEN true ELSE reminded_expired END,
    renewal_reminded_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- ============================================================
-- BAGIAN 2B — admin_activate_plan (ganti Next.js API route)
-- Dipanggil dari adminApproveUpgrade di supabase.js
-- ============================================================

CREATE OR REPLACE FUNCTION admin_activate_plan(
  p_user_id           UUID,
  p_plan              TEXT,
  p_billing_cycle     TEXT,
  p_upgrade_request_id UUID DEFAULT NULL,
  p_amount_paid       INTEGER DEFAULT 0,
  p_payment_method    TEXT DEFAULT NULL,
  p_notes             TEXT DEFAULT NULL,
  p_is_renewal        BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_email       TEXT;
  v_current           user_profiles%ROWTYPE;
  v_effective_start   TIMESTAMPTZ;
  v_expire_date       TIMESTAMPTZ;
BEGIN
  SELECT email INTO v_admin_email FROM auth.users WHERE id = auth.uid();

  IF v_admin_email NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_current FROM user_profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'User not found'; END IF;

  -- Jika renewal dan plan belum expired, sambung dari tanggal expire
  v_effective_start := NOW();
  IF p_is_renewal AND v_current.plan_expires_at IS NOT NULL AND v_current.plan_expires_at > NOW() THEN
    v_effective_start := v_current.plan_expires_at;
  END IF;

  -- Hitung tanggal expire
  IF p_billing_cycle = 'yearly' THEN
    v_expire_date := v_effective_start + INTERVAL '1 year';
  ELSE
    v_expire_date := v_effective_start + INTERVAL '1 month';
  END IF;

  -- Update profil user
  UPDATE user_profiles SET
    plan                 = p_plan,
    plan_status          = 'active',
    billing_cycle        = p_billing_cycle,
    plan_started_at      = v_effective_start,
    plan_expires_at      = v_expire_date,
    plan_activated_by    = v_admin_email,
    plan_activated_at    = NOW(),
    grace_period_ends_at = NULL,
    downgraded_at        = NULL,
    downgrade_reason     = NULL,
    previous_plan        = NULL,
    reminded_7days       = false,
    reminded_3days       = false,
    reminded_1day        = false,
    reminded_expired     = false,
    renewal_count        = COALESCE(renewal_count, 0) + CASE WHEN p_is_renewal THEN 1 ELSE 0 END
  WHERE id = p_user_id;

  -- Catat di subscription_history
  INSERT INTO subscription_history
    (user_id, user_email, action, plan_from, plan_to, billing_cycle,
     period_start, period_end, amount_paid, payment_method,
     upgrade_request_id, triggered_by, triggered_by_email, notes)
  VALUES
    (p_user_id, v_current.email,
     CASE WHEN p_is_renewal THEN 'renewed' ELSE 'activated' END,
     v_current.plan, p_plan, p_billing_cycle,
     v_effective_start, v_expire_date,
     p_amount_paid, p_payment_method,
     p_upgrade_request_id, 'admin', v_admin_email,
     COALESCE(p_notes, 'Plan ' || p_plan || ' diaktifkan oleh admin'));

  -- Update upgrade_request jika ada
  IF p_upgrade_request_id IS NOT NULL THEN
    UPDATE upgrade_requests SET
      status      = 'approved',
      reviewed_at = NOW(),
      reviewed_by = v_admin_email
    WHERE id = p_upgrade_request_id;
  END IF;

  RETURN json_build_object(
    'success',     true,
    'plan',        p_plan,
    'start_date',  v_effective_start,
    'expire_date', v_expire_date,
    'expires_at',  v_expire_date
  );
END;
$$;

-- ============================================================
-- BAGIAN 2C — admin_downgrade_user
-- ============================================================

CREATE OR REPLACE FUNCTION admin_downgrade_user(p_user_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_email TEXT;
  v_current     user_profiles%ROWTYPE;
BEGIN
  SELECT email INTO v_admin_email FROM auth.users WHERE id = auth.uid();

  IF v_admin_email NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_current FROM user_profiles WHERE id = p_user_id;

  UPDATE user_profiles SET
    plan                 = 'starter',
    plan_status          = 'active',
    plan_expires_at      = NULL,
    grace_period_ends_at = NULL,
    downgraded_at        = NOW(),
    downgrade_reason     = 'admin_manual',
    previous_plan        = v_current.plan
  WHERE id = p_user_id;

  INSERT INTO subscription_history
    (user_id, user_email, action, plan_from, plan_to, triggered_by, triggered_by_email, notes)
  VALUES
    (p_user_id, v_current.email, 'downgraded', v_current.plan, 'starter',
     'admin', v_admin_email,
     COALESCE(p_notes, 'Downgrade manual oleh admin'));
END;
$$;

-- ============================================================
-- BAGIAN 2D — admin_get_all_users (update dengan field lengkap)
-- ============================================================

CREATE OR REPLACE FUNCTION admin_get_all_users()
RETURNS TABLE(
  id                  UUID,
  email               TEXT,
  full_name           TEXT,
  company_name        TEXT,
  phone_number        TEXT,
  plan                TEXT,
  plan_status         TEXT,
  billing_cycle       TEXT,
  created_at          TIMESTAMPTZ,
  plan_started_at     TIMESTAMPTZ,
  plan_expires_at     TIMESTAMPTZ,
  plan_activated_by   TEXT,
  grace_period_ends_at TIMESTAMPTZ,
  renewal_count       INTEGER,
  previous_plan       TEXT,
  reminded_7days      BOOLEAN,
  reminded_3days      BOOLEAN,
  reminded_1day       BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT au.email FROM auth.users au WHERE au.id = auth.uid())
     NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    up.id, up.email, up.full_name, up.company_name, up.phone_number,
    up.plan, up.plan_status, up.billing_cycle,
    up.created_at, up.plan_started_at, up.plan_expires_at,
    up.plan_activated_by, up.grace_period_ends_at,
    up.renewal_count, up.previous_plan,
    up.reminded_7days, up.reminded_3days, up.reminded_1day
  FROM user_profiles up
  ORDER BY up.created_at DESC;
END;
$$;

-- ============================================================
-- BAGIAN 2E — get_subscription_stats
-- ============================================================

CREATE OR REPLACE FUNCTION get_subscription_stats()
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
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
                          WHEN plan = 'pro'       AND plan_status = 'active' AND billing_cycle = 'monthly' THEN 149000
                          WHEN plan = 'pro'       AND plan_status = 'active' AND billing_cycle = 'yearly'  THEN 99000
                          WHEN plan = 'business'  AND plan_status = 'active' AND billing_cycle = 'monthly' THEN 349000
                          WHEN plan = 'business'  AND plan_status = 'active' AND billing_cycle = 'yearly'  THEN 249000
                          ELSE 0
                        END), 0)
  )
  FROM user_profiles;
$$;

-- ============================================================
-- Verifikasi cron jobs terdaftar
-- ============================================================
-- SELECT * FROM cron.job;
