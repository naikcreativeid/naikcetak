-- ============================================================
-- REFERRAL & COMMISSION SYSTEM — "NaikCetak Elite Partner"
-- Jalankan sekali di Supabase SQL Editor
--
-- Skema:
--   • Setiap user otomatis dapat referral_code (dibuat saat
--     pertama kali ensure_referral_code dipanggil dari frontend).
--   • Partner mulai dengan approval_status = 'pending'. Link tetap
--     bisa di-share, tapi komisi belum berhitung sampai admin approve.
--   • Saat signup, frontend panggil record_referral(referee, code)
--     untuk link referee → referrer (1 referee = 1 referrer permanen).
--   • Saat pembayaran Midtrans settlement, webhook panggil
--     record_commission(upgrade_request_id):
--       - Partner approved → komisi status 'pending' (7 hari mature)
--       - Partner pending → komisi status 'awaiting_partner_approval'
--       - Partner rejected → tidak ada komisi
--   • Saat admin approve partner → semua awaiting commissions dipindah
--     ke 'pending' dengan available_at = NOW() + 7 hari.
--   • Saat admin reject partner → semua awaiting commissions = clawed_back.
--   • Komisi PENDING 7 hari dulu, lalu otomatis jadi AVAILABLE
--     via cron mature_pending_commissions().
--   • Partner request payout dari dashboard. Admin approve & transfer
--     manual, lalu mark PAID dengan payment_proof_url.
--   • Refund/cancel = clawback komisi (status = clawed_back).
-- ============================================================

-- ============================================================
-- BAGIAN 1 — Tabel referral_codes (1:1 dengan user)
-- ============================================================

CREATE TABLE IF NOT EXISTS referral_codes (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code              VARCHAR(12) NOT NULL UNIQUE,
  is_active         BOOLEAN DEFAULT true,
  approval_status   VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (approval_status IN ('pending','approved','rejected')),
  approved_at       TIMESTAMPTZ,
  approved_by       VARCHAR(255),
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code   ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_status ON referral_codes(approval_status);

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own referral code" ON referral_codes;
CREATE POLICY "Users read own referral code"
  ON referral_codes FOR SELECT
  USING (auth.uid() = user_id);

-- Tidak ada INSERT/UPDATE/DELETE policy untuk user — hanya via SECURITY DEFINER function

-- ============================================================
-- BAGIAN 2 — Tabel referrals (link referee → referrer)
-- ============================================================

CREATE TABLE IF NOT EXISTS referrals (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referee_id      UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  referrer_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code   VARCHAR(12) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  CHECK (referee_id <> referrer_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own referral link" ON referrals;
CREATE POLICY "Users read own referral link"
  ON referrals FOR SELECT
  USING (auth.uid() = referee_id OR auth.uid() = referrer_id);

-- ============================================================
-- BAGIAN 3 — Tabel commissions (catatan komisi per pembayaran)
-- ============================================================

CREATE TABLE IF NOT EXISTS commissions (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upgrade_request_id  UUID NOT NULL UNIQUE,
  billing_cycle       VARCHAR(10) NOT NULL CHECK (billing_cycle IN ('monthly','yearly')),
  is_renewal          BOOLEAN NOT NULL,
  gross_amount        INTEGER NOT NULL,
  commission_amount   INTEGER NOT NULL,
  status              VARCHAR(30) NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('awaiting_partner_approval','pending','available','paid','clawed_back')),
  available_at        TIMESTAMPTZ NOT NULL,
  paid_at             TIMESTAMPTZ,
  payout_request_id   UUID,
  clawback_reason     TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissions_referrer ON commissions(referrer_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_referee  ON commissions(referee_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status   ON commissions(status, available_at);

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own commissions" ON commissions;
CREATE POLICY "Users read own commissions"
  ON commissions FOR SELECT
  USING (auth.uid() = referrer_id);

-- ============================================================
-- BAGIAN 4 — Tabel payout_requests
-- ============================================================

CREATE TABLE IF NOT EXISTS payout_requests (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partner_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_amount      INTEGER NOT NULL CHECK (requested_amount >= 100000),
  status                VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','rejected','paid')),
  bank_name             VARCHAR(100) NOT NULL,
  bank_account_number   VARCHAR(50)  NOT NULL,
  bank_account_name     VARCHAR(200) NOT NULL,
  partner_notes         TEXT,
  admin_notes           TEXT,
  reviewed_by           VARCHAR(255),
  reviewed_at           TIMESTAMPTZ,
  payment_proof_url     TEXT,
  paid_at               TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_requests_partner ON payout_requests(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status  ON payout_requests(status, created_at DESC);

ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Partners read own payouts" ON payout_requests;
CREATE POLICY "Partners read own payouts"
  ON payout_requests FOR SELECT
  USING (auth.uid() = partner_id);

-- ============================================================
-- BAGIAN 5 — Helper: random code generator
-- Format: NC + 6 alphanumeric (mis. NCAB12CD)
-- ============================================================

CREATE OR REPLACE FUNCTION generate_unique_referral_code()
RETURNS VARCHAR(12)
LANGUAGE plpgsql
AS $$
DECLARE
  v_code     VARCHAR(12);
  v_exists   BOOLEAN;
  v_attempts INTEGER := 0;
BEGIN
  LOOP
    v_attempts := v_attempts + 1;
    -- 6 char alphanumeric, exclude visually similar (0/O, 1/I/L)
    v_code := 'NC' || UPPER(SUBSTRING(
      REGEXP_REPLACE(encode(gen_random_bytes(8), 'base64'), '[^A-HJ-NP-Z2-9]', '', 'g'),
      1, 6
    ));

    IF LENGTH(v_code) = 8 THEN
      SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_exists;
      IF NOT v_exists THEN
        RETURN v_code;
      END IF;
    END IF;

    IF v_attempts > 20 THEN
      RAISE EXCEPTION 'Failed to generate unique referral code after 20 attempts';
    END IF;
  END LOOP;
END;
$$;

-- ============================================================
-- BAGIAN 6 — ensure_referral_code: get-or-create code untuk user
-- Dipanggil frontend saat user buka dashboard partner
-- ============================================================

CREATE OR REPLACE FUNCTION ensure_referral_code()
RETURNS TABLE(code VARCHAR(12), is_active BOOLEAN, approval_status VARCHAR(20), created_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_code    VARCHAR(12);
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT rc.code INTO v_code FROM referral_codes rc WHERE rc.user_id = v_user_id;

  IF v_code IS NULL THEN
    v_code := generate_unique_referral_code();
    INSERT INTO referral_codes (user_id, code) VALUES (v_user_id, v_code);
  END IF;

  RETURN QUERY
  SELECT rc.code, rc.is_active, rc.approval_status, rc.created_at
  FROM referral_codes rc
  WHERE rc.user_id = v_user_id;
END;
$$;

-- ============================================================
-- BAGIAN 7 — record_referral: link referee ke referrer saat signup
-- Dipanggil frontend setelah signup berhasil, dengan kode dari URL/localStorage
--
-- Anti-abuse:
--   • referee != referrer (CHECK constraint)
--   • email referee != email referrer
--   • phone referee != phone referrer (jika keduanya punya phone)
--   • referee belum punya referrer (UNIQUE constraint)
-- ============================================================

CREATE OR REPLACE FUNCTION record_referral(p_code VARCHAR(12))
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referee_id     UUID;
  v_referee_email  TEXT;
  v_referee_phone  TEXT;
  v_referrer_id    UUID;
  v_referrer_email TEXT;
  v_referrer_phone TEXT;
  v_existing       UUID;
BEGIN
  v_referee_id := auth.uid();
  IF v_referee_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Sudah punya referrer? Tolak diam-diam (idempotent)
  SELECT id INTO v_existing FROM referrals WHERE referee_id = v_referee_id;
  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('success', false, 'reason', 'already_referred');
  END IF;

  -- Cari referrer dari kode (rejected = tidak bisa dipakai untuk link baru)
  SELECT user_id INTO v_referrer_id
  FROM referral_codes
  WHERE code = UPPER(p_code)
    AND is_active = true
    AND approval_status <> 'rejected';

  IF v_referrer_id IS NULL THEN
    RETURN json_build_object('success', false, 'reason', 'invalid_code');
  END IF;

  -- Self-referral check
  IF v_referrer_id = v_referee_id THEN
    RETURN json_build_object('success', false, 'reason', 'self_referral');
  END IF;

  -- Email & phone duplicate check
  SELECT email INTO v_referee_email  FROM auth.users WHERE id = v_referee_id;
  SELECT email INTO v_referrer_email FROM auth.users WHERE id = v_referrer_id;

  IF LOWER(COALESCE(v_referee_email,'')) = LOWER(COALESCE(v_referrer_email,'')) THEN
    RETURN json_build_object('success', false, 'reason', 'duplicate_email');
  END IF;

  SELECT phone_number INTO v_referee_phone  FROM user_profiles WHERE id = v_referee_id;
  SELECT phone_number INTO v_referrer_phone FROM user_profiles WHERE id = v_referrer_id;

  IF v_referee_phone IS NOT NULL
     AND v_referrer_phone IS NOT NULL
     AND v_referee_phone = v_referrer_phone THEN
    RETURN json_build_object('success', false, 'reason', 'duplicate_phone');
  END IF;

  INSERT INTO referrals (referee_id, referrer_id, referral_code)
  VALUES (v_referee_id, v_referrer_id, UPPER(p_code));

  RETURN json_build_object('success', true);
END;
$$;

-- ============================================================
-- BAGIAN 8 — record_commission: catat komisi saat pembayaran sukses
-- Dipanggil dari midtrans-webhook (Step 2) atau admin_activate_plan
--
-- Idempotent: cek apakah komisi untuk upgrade_request_id ini sudah ada.
-- Rate keputusan first vs renewal = berdasarkan jumlah commissions
--   referee yang sudah pernah tercatat (0 = first, ≥1 = renewal).
-- ============================================================

CREATE OR REPLACE FUNCTION record_commission(p_upgrade_request_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request          upgrade_requests%ROWTYPE;
  v_referrer_id      UUID;
  v_partner_status   VARCHAR(20);
  v_existing         UUID;
  v_prior_count      INTEGER;
  v_is_renewal       BOOLEAN;
  v_commission_amt   INTEGER;
  v_init_status      VARCHAR(30);
  v_available_at     TIMESTAMPTZ;
BEGIN
  -- Cek upgrade request
  SELECT * INTO v_request FROM upgrade_requests WHERE id = p_upgrade_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Upgrade request not found';
  END IF;

  -- Idempotent: kalau sudah pernah dicatat, return existing
  SELECT id INTO v_existing FROM commissions
  WHERE upgrade_request_id = p_upgrade_request_id;

  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('success', true, 'reason', 'already_recorded', 'commission_id', v_existing);
  END IF;

  -- Cek apakah user punya referrer
  SELECT referrer_id INTO v_referrer_id
  FROM referrals
  WHERE referee_id = v_request.user_id;

  IF v_referrer_id IS NULL THEN
    RETURN json_build_object('success', false, 'reason', 'no_referrer');
  END IF;

  -- Cek status approval partner
  SELECT approval_status INTO v_partner_status
  FROM referral_codes
  WHERE user_id = v_referrer_id;

  IF v_partner_status = 'rejected' THEN
    RETURN json_build_object('success', false, 'reason', 'partner_rejected');
  END IF;

  -- Hitung komisi sebelumnya untuk referee ini → tentukan first vs renewal
  -- Termasuk yang awaiting/clawed_back diabaikan? Hanya yang valid.
  SELECT COUNT(*) INTO v_prior_count
  FROM commissions
  WHERE referee_id = v_request.user_id
    AND status NOT IN ('clawed_back');

  v_is_renewal := v_prior_count > 0;

  -- Rate: NaikCetak Elite Partner
  --   Monthly first   : Rp 50.000
  --   Monthly renewal : Rp 37.250
  --   Yearly first    : Rp 325.000
  --   Yearly renewal  : Rp 237.000
  IF v_request.billing_cycle = 'monthly' THEN
    v_commission_amt := CASE WHEN v_is_renewal THEN 37250 ELSE 50000 END;
  ELSIF v_request.billing_cycle = 'yearly' THEN
    v_commission_amt := CASE WHEN v_is_renewal THEN 237000 ELSE 325000 END;
  ELSE
    RAISE EXCEPTION 'Unsupported billing cycle: %', v_request.billing_cycle;
  END IF;

  -- Status awal tergantung approval partner
  IF v_partner_status = 'approved' THEN
    v_init_status  := 'pending';
    v_available_at := NOW() + INTERVAL '7 days';
  ELSE
    -- Partner pending → tahan dulu, available_at akan di-set saat admin approve
    v_init_status  := 'awaiting_partner_approval';
    v_available_at := NOW() + INTERVAL '100 years'; -- placeholder, akan di-overwrite
  END IF;

  INSERT INTO commissions (
    referrer_id, referee_id, upgrade_request_id,
    billing_cycle, is_renewal,
    gross_amount, commission_amount,
    status, available_at
  ) VALUES (
    v_referrer_id, v_request.user_id, p_upgrade_request_id,
    v_request.billing_cycle, v_is_renewal,
    v_request.amount_to_pay, v_commission_amt,
    v_init_status, v_available_at
  );

  RETURN json_build_object(
    'success', true,
    'commission_amount', v_commission_amt,
    'is_renewal', v_is_renewal,
    'status', v_init_status,
    'partner_status', v_partner_status
  );
END;
$$;

-- ============================================================
-- BAGIAN 9 — clawback_commission: tandai komisi sebagai dibatalkan
-- Dipanggil saat refund/cancel/dispute pembayaran
-- ============================================================

CREATE OR REPLACE FUNCTION clawback_commission(p_upgrade_request_id UUID, p_reason TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_commission commissions%ROWTYPE;
BEGIN
  SELECT * INTO v_commission FROM commissions WHERE upgrade_request_id = p_upgrade_request_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'reason', 'no_commission');
  END IF;

  -- Hanya bisa clawback kalau belum dibayar ke partner
  IF v_commission.status = 'paid' THEN
    RETURN json_build_object('success', false, 'reason', 'already_paid_to_partner');
  END IF;

  UPDATE commissions
  SET status = 'clawed_back', clawback_reason = p_reason
  WHERE id = v_commission.id;

  RETURN json_build_object('success', true);
END;
$$;

-- ============================================================
-- BAGIAN 10 — mature_pending_commissions: pending → available
-- Dipanggil cron tiap 6 jam
-- ============================================================

CREATE OR REPLACE FUNCTION mature_pending_commissions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE commissions
  SET status = 'available'
  WHERE status = 'pending' AND available_at <= NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Cron: tiap 6 jam
SELECT cron.unschedule('mature-pending-commissions') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'mature-pending-commissions'
);
SELECT cron.schedule(
  'mature-pending-commissions',
  '0 */6 * * *',
  $$SELECT mature_pending_commissions()$$
);

-- ============================================================
-- BAGIAN 11 — get_partner_summary: ringkasan dashboard partner
-- ============================================================

CREATE OR REPLACE FUNCTION get_partner_summary()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN (
    SELECT json_build_object(
      'partner_status',      (SELECT approval_status FROM referral_codes WHERE user_id = v_user_id),
      'total_referrals',     (SELECT COUNT(*) FROM referrals WHERE referrer_id = v_user_id),
      'paying_referrals',    (SELECT COUNT(DISTINCT referee_id) FROM commissions
                                WHERE referrer_id = v_user_id AND status <> 'clawed_back'),
      'awaiting_amount',     COALESCE((SELECT SUM(commission_amount) FROM commissions
                                WHERE referrer_id = v_user_id AND status = 'awaiting_partner_approval'), 0),
      'pending_amount',      COALESCE((SELECT SUM(commission_amount) FROM commissions
                                WHERE referrer_id = v_user_id AND status = 'pending'), 0),
      'available_amount',    COALESCE((SELECT SUM(commission_amount) FROM commissions
                                WHERE referrer_id = v_user_id AND status = 'available'), 0),
      'paid_amount',         COALESCE((SELECT SUM(commission_amount) FROM commissions
                                WHERE referrer_id = v_user_id AND status = 'paid'), 0),
      'lifetime_amount',     COALESCE((SELECT SUM(commission_amount) FROM commissions
                                WHERE referrer_id = v_user_id AND status <> 'clawed_back'), 0),
      'pending_payout',      COALESCE((SELECT SUM(requested_amount) FROM payout_requests
                                WHERE partner_id = v_user_id AND status IN ('pending','approved')), 0)
    )
  );
END;
$$;

-- ============================================================
-- BAGIAN 12 — get_partner_commissions: list commission history
-- ============================================================

CREATE OR REPLACE FUNCTION get_partner_commissions()
RETURNS TABLE(
  id                UUID,
  referee_email     TEXT,
  billing_cycle     TEXT,
  is_renewal        BOOLEAN,
  gross_amount      INTEGER,
  commission_amount INTEGER,
  status            TEXT,
  available_at      TIMESTAMPTZ,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  RETURN QUERY
  SELECT
    c.id,
    -- Mask email untuk privasi: f***l@gmail.com
    REGEXP_REPLACE(au.email, '^(.).*(.@.*)$', '\1***\2') AS referee_email,
    c.billing_cycle,
    c.is_renewal,
    c.gross_amount,
    c.commission_amount,
    c.status,
    c.available_at,
    c.paid_at,
    c.created_at
  FROM commissions c
  JOIN auth.users au ON au.id = c.referee_id
  WHERE c.referrer_id = v_user_id
  ORDER BY c.created_at DESC;
END;
$$;

-- ============================================================
-- BAGIAN 13 — request_payout: partner ajukan pencairan
-- ============================================================

CREATE OR REPLACE FUNCTION request_payout(
  p_amount              INTEGER,
  p_bank_name           TEXT,
  p_bank_account_number TEXT,
  p_bank_account_name   TEXT,
  p_notes               TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id          UUID;
  v_available        INTEGER;
  v_pending_payout   INTEGER;
  v_payout_id        UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  IF p_amount < 100000 THEN
    RAISE EXCEPTION 'Minimum payout adalah Rp 100.000';
  END IF;

  -- Saldo available
  SELECT COALESCE(SUM(commission_amount), 0) INTO v_available
  FROM commissions
  WHERE referrer_id = v_user_id AND status = 'available';

  -- Saldo yang sedang dalam proses payout (pending/approved)
  SELECT COALESCE(SUM(requested_amount), 0) INTO v_pending_payout
  FROM payout_requests
  WHERE partner_id = v_user_id AND status IN ('pending','approved');

  IF p_amount > (v_available - v_pending_payout) THEN
    RAISE EXCEPTION 'Jumlah melebihi saldo tersedia (Rp %)', (v_available - v_pending_payout);
  END IF;

  INSERT INTO payout_requests (
    partner_id, requested_amount,
    bank_name, bank_account_number, bank_account_name,
    partner_notes
  ) VALUES (
    v_user_id, p_amount,
    p_bank_name, p_bank_account_number, p_bank_account_name,
    p_notes
  ) RETURNING id INTO v_payout_id;

  RETURN json_build_object('success', true, 'payout_id', v_payout_id);
END;
$$;

-- ============================================================
-- BAGIAN 14 — admin_list_payout_requests: untuk admin panel
-- ============================================================

CREATE OR REPLACE FUNCTION admin_list_payout_requests(p_status TEXT DEFAULT NULL)
RETURNS TABLE(
  id                  UUID,
  partner_id          UUID,
  partner_email       TEXT,
  partner_name        TEXT,
  requested_amount    INTEGER,
  status              TEXT,
  bank_name           TEXT,
  bank_account_number TEXT,
  bank_account_name   TEXT,
  partner_notes       TEXT,
  admin_notes         TEXT,
  reviewed_at         TIMESTAMPTZ,
  paid_at             TIMESTAMPTZ,
  payment_proof_url   TEXT,
  created_at          TIMESTAMPTZ
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
  SELECT
    pr.id, pr.partner_id, au.email, up.full_name,
    pr.requested_amount, pr.status,
    pr.bank_name, pr.bank_account_number, pr.bank_account_name,
    pr.partner_notes, pr.admin_notes,
    pr.reviewed_at, pr.paid_at, pr.payment_proof_url,
    pr.created_at
  FROM payout_requests pr
  JOIN auth.users au       ON au.id = pr.partner_id
  LEFT JOIN user_profiles up ON up.id = pr.partner_id
  WHERE p_status IS NULL OR pr.status = p_status
  ORDER BY pr.created_at DESC;
END;
$$;

-- ============================================================
-- BAGIAN 15 — admin_approve_payout: tandai sudah ditransfer
-- Mengubah status payout_requests menjadi 'paid' dan mark
-- semua commissions yang termasuk dalam payout ini sebagai paid.
-- ============================================================

CREATE OR REPLACE FUNCTION admin_approve_payout(
  p_payout_id          UUID,
  p_payment_proof_url  TEXT,
  p_admin_notes        TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_email   TEXT;
  v_payout        payout_requests%ROWTYPE;
  v_remaining     INTEGER;
  v_commission    RECORD;
BEGIN
  SELECT email INTO v_admin_email FROM auth.users WHERE id = auth.uid();
  IF v_admin_email NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_payout FROM payout_requests WHERE id = p_payout_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payout request not found'; END IF;
  IF v_payout.status = 'paid' THEN RAISE EXCEPTION 'Already paid'; END IF;

  -- Allocate dari commissions oldest-first sampai amount terpenuhi
  v_remaining := v_payout.requested_amount;

  FOR v_commission IN
    SELECT id, commission_amount
    FROM commissions
    WHERE referrer_id = v_payout.partner_id
      AND status = 'available'
    ORDER BY created_at ASC
  LOOP
    EXIT WHEN v_remaining <= 0;

    IF v_commission.commission_amount <= v_remaining THEN
      UPDATE commissions
      SET status = 'paid', paid_at = NOW(), payout_request_id = p_payout_id
      WHERE id = v_commission.id;
      v_remaining := v_remaining - v_commission.commission_amount;
    END IF;
  END LOOP;

  UPDATE payout_requests
  SET status            = 'paid',
      payment_proof_url = p_payment_proof_url,
      admin_notes       = COALESCE(p_admin_notes, admin_notes),
      reviewed_by       = v_admin_email,
      reviewed_at       = COALESCE(reviewed_at, NOW()),
      paid_at           = NOW()
  WHERE id = p_payout_id;

  RETURN json_build_object('success', true);
END;
$$;

-- ============================================================
-- BAGIAN 16 — admin_reject_payout
-- ============================================================

CREATE OR REPLACE FUNCTION admin_reject_payout(p_payout_id UUID, p_admin_notes TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_email TEXT;
BEGIN
  SELECT email INTO v_admin_email FROM auth.users WHERE id = auth.uid();
  IF v_admin_email NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE payout_requests
  SET status      = 'rejected',
      admin_notes = p_admin_notes,
      reviewed_by = v_admin_email,
      reviewed_at = NOW()
  WHERE id = p_payout_id AND status = 'pending';

  RETURN json_build_object('success', true);
END;
$$;

-- ============================================================
-- BAGIAN 17 — admin_partner_stats: ringkasan untuk admin panel
-- ============================================================

CREATE OR REPLACE FUNCTION admin_partner_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (SELECT email FROM auth.users WHERE id = auth.uid())
     NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN (
    SELECT json_build_object(
      'total_partners',         (SELECT COUNT(*) FROM referral_codes),
      'active_partners',        (SELECT COUNT(DISTINCT referrer_id) FROM commissions WHERE status <> 'clawed_back'),
      'total_referees',         (SELECT COUNT(*) FROM referrals),
      'total_commission_paid',  COALESCE((SELECT SUM(commission_amount) FROM commissions WHERE status = 'paid'), 0),
      'total_outstanding',      COALESCE((SELECT SUM(commission_amount) FROM commissions WHERE status IN ('pending','available')), 0),
      'pending_payouts',        (SELECT COUNT(*) FROM payout_requests WHERE status = 'pending'),
      'pending_payout_amount',  COALESCE((SELECT SUM(requested_amount) FROM payout_requests WHERE status = 'pending'), 0)
    )
  );
END;
$$;

-- ============================================================
-- BAGIAN 18 — admin_list_partners: daftar partner untuk review
-- ============================================================

CREATE OR REPLACE FUNCTION admin_list_partners(p_status TEXT DEFAULT NULL)
RETURNS TABLE(
  user_id           UUID,
  email             TEXT,
  full_name         TEXT,
  phone_number      TEXT,
  code              VARCHAR(12),
  approval_status   VARCHAR(20),
  approved_at       TIMESTAMPTZ,
  approved_by       VARCHAR(255),
  rejection_reason  TEXT,
  total_referrals   BIGINT,
  paying_referrals  BIGINT,
  awaiting_amount   BIGINT,
  lifetime_amount   BIGINT,
  created_at        TIMESTAMPTZ
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
  SELECT
    rc.user_id,
    au.email,
    up.full_name,
    up.phone_number,
    rc.code,
    rc.approval_status,
    rc.approved_at,
    rc.approved_by,
    rc.rejection_reason,
    (SELECT COUNT(*) FROM referrals WHERE referrer_id = rc.user_id),
    (SELECT COUNT(DISTINCT c.referee_id) FROM commissions c
       WHERE c.referrer_id = rc.user_id AND c.status <> 'clawed_back'),
    COALESCE((SELECT SUM(c.commission_amount) FROM commissions c
       WHERE c.referrer_id = rc.user_id AND c.status = 'awaiting_partner_approval'), 0),
    COALESCE((SELECT SUM(c.commission_amount) FROM commissions c
       WHERE c.referrer_id = rc.user_id AND c.status <> 'clawed_back'), 0),
    rc.created_at
  FROM referral_codes rc
  JOIN auth.users au         ON au.id = rc.user_id
  LEFT JOIN user_profiles up ON up.id = rc.user_id
  WHERE p_status IS NULL OR rc.approval_status = p_status
  ORDER BY
    CASE rc.approval_status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END,
    rc.created_at DESC;
END;
$$;

-- ============================================================
-- BAGIAN 19 — admin_approve_partner: aktifkan partner
-- Semua awaiting commissions dipindah ke 'pending' dengan
-- available_at = NOW() + 7 hari (timer mature mulai dari approval)
-- ============================================================

CREATE OR REPLACE FUNCTION admin_approve_partner(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_email   TEXT;
  v_promoted      INTEGER;
BEGIN
  SELECT email INTO v_admin_email FROM auth.users WHERE id = auth.uid();
  IF v_admin_email NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE referral_codes
  SET approval_status  = 'approved',
      approved_at      = NOW(),
      approved_by      = v_admin_email,
      rejection_reason = NULL,
      is_active        = true
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partner not found (user_id: %)', p_user_id;
  END IF;

  -- Promote semua awaiting commissions → pending dengan timer 7 hari dari sekarang
  UPDATE commissions
  SET status       = 'pending',
      available_at = NOW() + INTERVAL '7 days'
  WHERE referrer_id = p_user_id
    AND status = 'awaiting_partner_approval';

  GET DIAGNOSTICS v_promoted = ROW_COUNT;

  RETURN json_build_object('success', true, 'promoted_commissions', v_promoted);
END;
$$;

-- ============================================================
-- BAGIAN 20 — admin_reject_partner: tolak partner
-- Semua awaiting commissions di-clawback, kode di-deaktivasi
-- ============================================================

CREATE OR REPLACE FUNCTION admin_reject_partner(p_user_id UUID, p_reason TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_email   TEXT;
  v_clawed_back   INTEGER;
BEGIN
  SELECT email INTO v_admin_email FROM auth.users WHERE id = auth.uid();
  IF v_admin_email NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE referral_codes
  SET approval_status  = 'rejected',
      approved_at      = NULL,
      approved_by      = v_admin_email,
      rejection_reason = p_reason,
      is_active        = false
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partner not found (user_id: %)', p_user_id;
  END IF;

  -- Clawback semua awaiting commissions
  UPDATE commissions
  SET status          = 'clawed_back',
      clawback_reason = 'Partner rejected by admin: ' || p_reason
  WHERE referrer_id = p_user_id
    AND status = 'awaiting_partner_approval';

  GET DIAGNOSTICS v_clawed_back = ROW_COUNT;

  RETURN json_build_object('success', true, 'clawed_back_commissions', v_clawed_back);
END;
$$;

-- ============================================================
-- Verifikasi
-- ============================================================
-- SELECT * FROM cron.job WHERE jobname LIKE '%commission%';
-- SELECT generate_unique_referral_code();
-- SELECT * FROM admin_list_partners('pending');
