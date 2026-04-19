-- ═══════════════════════════════════════════════════════════════
-- naikcetak — Subscription System Schema
-- Jalankan sekali di Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── 1. user_profiles ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id                        UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email                     TEXT,
  full_name                 TEXT,
  company_name              TEXT,
  phone_number              TEXT,
  city                      TEXT,

  -- Plan
  plan                      VARCHAR(20)  DEFAULT 'starter' CHECK (plan IN ('starter','pro','business')),
  plan_status               VARCHAR(20)  DEFAULT 'active'  CHECK (plan_status IN ('active','pending_payment','expired','cancelled')),
  plan_activated_at         TIMESTAMPTZ,
  plan_expires_at           TIMESTAMPTZ,
  plan_activated_by         VARCHAR(100),
  billing_cycle             VARCHAR(10)  DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly')),

  -- Pembayaran
  payment_proof_url         TEXT,
  payment_amount            INTEGER,
  payment_method            VARCHAR(50),
  payment_notes             TEXT,
  upgrade_requested_at      TIMESTAMPTZ,
  upgrade_requested_plan    VARCHAR(20),

  -- Usage tracking (reset tiap bulan)
  usage_potong_kertas_count INTEGER      DEFAULT 0,
  usage_hitung_cetakan_count INTEGER     DEFAULT 0,
  usage_reset_at            TIMESTAMPTZ  DEFAULT NOW(),

  -- Admin
  referral_code             VARCHAR(20),
  notes_from_admin          TEXT,
  created_at                TIMESTAMPTZ  DEFAULT NOW(),
  updated_at                TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile"        ON user_profiles;
DROP POLICY IF EXISTS "Users can update own basic info"   ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile"      ON user_profiles;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User hanya boleh update field non-plan
CREATE POLICY "Users can update own basic info"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND plan          = (SELECT plan          FROM user_profiles WHERE id = auth.uid())
    AND plan_status   = (SELECT plan_status   FROM user_profiles WHERE id = auth.uid())
    AND plan_expires_at IS NOT DISTINCT FROM (SELECT plan_expires_at FROM user_profiles WHERE id = auth.uid())
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_user_profiles_plan ON user_profiles (plan);

-- ── 2. upgrade_requests ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS upgrade_requests (
  id                UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID         REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email        VARCHAR(255),
  user_name         VARCHAR(200),
  requested_plan    VARCHAR(20)  NOT NULL,
  billing_cycle     VARCHAR(10)  DEFAULT 'monthly',
  amount_to_pay     INTEGER      NOT NULL,
  payment_proof_url TEXT,
  payment_method    VARCHAR(50),
  payment_notes     TEXT,
  status            VARCHAR(20)  DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  submitted_at      TIMESTAMPTZ  DEFAULT NOW(),
  reviewed_at       TIMESTAMPTZ,
  reviewed_by       VARCHAR(100),
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE upgrade_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own upgrade requests" ON upgrade_requests;
CREATE POLICY "Users manage own upgrade requests"
  ON upgrade_requests FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_upgrade_requests_user ON upgrade_requests (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_status ON upgrade_requests (status);

-- ── 3. usage_logs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usage_logs (
  id        UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id   UUID         REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature   VARCHAR(50)  NOT NULL,
  used_at   TIMESTAMPTZ  DEFAULT NOW(),
  metadata  JSONB
);

ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own usage" ON usage_logs;
DROP POLICY IF EXISTS "Users can insert own usage" ON usage_logs;
CREATE POLICY "Users can read own usage"  ON usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage" ON usage_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user ON usage_logs (user_id, used_at DESC);

-- ── 4. Storage bucket untuk bukti pembayaran ─────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('payment-proofs', 'payment-proofs', false)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users upload own proof"   ON storage.objects;
DROP POLICY IF EXISTS "Users read own proof"     ON storage.objects;
DROP POLICY IF EXISTS "Admin reads all proofs"   ON storage.objects;

CREATE POLICY "Users upload own proof"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own proof"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ── 5. RPC: auto-create profile saat signup ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 6. RPC: increment_usage (bypass RLS untuk counter) ───────────────────────
CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id UUID, p_feature TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  reset_needed BOOLEAN;
BEGIN
  -- Cek apakah perlu reset bulan baru
  SELECT (
    EXTRACT(MONTH FROM NOW()) != EXTRACT(MONTH FROM usage_reset_at) OR
    EXTRACT(YEAR  FROM NOW()) != EXTRACT(YEAR  FROM usage_reset_at)
  ) INTO reset_needed
  FROM user_profiles WHERE id = p_user_id;

  IF reset_needed THEN
    UPDATE user_profiles SET
      usage_potong_kertas_count  = 0,
      usage_hitung_cetakan_count = 0,
      usage_reset_at             = NOW()
    WHERE id = p_user_id;
  END IF;

  IF p_feature = 'potong_kertas' THEN
    UPDATE user_profiles
      SET usage_potong_kertas_count = usage_potong_kertas_count + 1
    WHERE id = p_user_id;
  ELSIF p_feature = 'hitung_cetakan' THEN
    UPDATE user_profiles
      SET usage_hitung_cetakan_count = usage_hitung_cetakan_count + 1
    WHERE id = p_user_id;
  END IF;
END;
$$;

-- ── 7. RPC: admin_approve_upgrade (SECURITY DEFINER — bypass RLS) ────────────
CREATE OR REPLACE FUNCTION public.admin_approve_upgrade(
  p_request_id  UUID,
  p_admin_email TEXT
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  req          RECORD;
  expire_at    TIMESTAMPTZ;
BEGIN
  -- Verifikasi admin email (tambah email lain jika perlu)
  IF p_admin_email NOT IN ('naikcetakexclusive@gmail.com') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT * INTO req FROM upgrade_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  -- Hitung tanggal expire
  IF req.billing_cycle = 'yearly' THEN
    expire_at := NOW() + INTERVAL '1 year';
  ELSE
    expire_at := NOW() + INTERVAL '1 month';
  END IF;

  -- Upgrade plan user
  UPDATE user_profiles SET
    plan               = req.requested_plan,
    plan_status        = 'active',
    plan_activated_at  = NOW(),
    plan_expires_at    = expire_at,
    plan_activated_by  = p_admin_email,
    billing_cycle      = req.billing_cycle,
    payment_amount     = req.amount_to_pay,
    updated_at         = NOW()
  WHERE id = req.user_id;

  -- Update status request
  UPDATE upgrade_requests SET
    status       = 'approved',
    reviewed_at  = NOW(),
    reviewed_by  = p_admin_email
  WHERE id = p_request_id;

  RETURN jsonb_build_object('success', true, 'expires_at', expire_at);
END;
$$;

-- ── 8. RPC: admin_reject_upgrade ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_reject_upgrade(
  p_request_id     UUID,
  p_admin_email    TEXT,
  p_reason         TEXT DEFAULT ''
) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  req RECORD;
BEGIN
  IF p_admin_email NOT IN ('naikcetakexclusive@gmail.com') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT * INTO req FROM upgrade_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;

  UPDATE upgrade_requests SET
    status           = 'rejected',
    reviewed_at      = NOW(),
    reviewed_by      = p_admin_email,
    rejection_reason = p_reason
  WHERE id = p_request_id;

  UPDATE user_profiles SET
    plan_status            = 'active',
    upgrade_requested_plan = NULL,
    updated_at             = NOW()
  WHERE id = req.user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ── 9. RPC: admin_get_upgrade_requests ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_get_upgrade_requests(p_admin_email TEXT)
RETURNS SETOF upgrade_requests LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_admin_email NOT IN ('naikcetakexclusive@gmail.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY SELECT * FROM upgrade_requests ORDER BY created_at DESC;
END;
$$;

-- ── 10. Backfill profiles untuk user yang sudah ada ──────────────────────────
INSERT INTO public.user_profiles (id, email)
SELECT id, email FROM auth.users
ON CONFLICT (id) DO NOTHING;
