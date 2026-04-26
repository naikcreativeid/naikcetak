-- ============================================================
-- PATCH: Perbaiki "structure of query does not match function result type"
-- pada fungsi-fungsi referral yang RETURNS TABLE.
--
-- Penyebab: kolom dideklarasi TEXT tapi sumbernya VARCHAR(N) di
-- auth.users / user_profiles / commissions / payout_requests.
-- Postgres strict-check tipe TABLE return → harus exact match.
--
-- Solusi: cast eksplisit ke ::TEXT di RETURN QUERY.
-- Aman dijalankan ulang (DROP + CREATE).
--
-- DROP dulu karena return signature berubah (VARCHAR → TEXT).
-- CREATE OR REPLACE saja tidak bisa mengubah tipe OUT param.
-- ============================================================

DROP FUNCTION IF EXISTS get_partner_commissions();
DROP FUNCTION IF EXISTS admin_list_payout_requests(TEXT);
DROP FUNCTION IF EXISTS admin_list_partners(TEXT);
DROP FUNCTION IF EXISTS ensure_referral_code();

-- ── get_partner_commissions ─────────────────────────────────────────
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
    REGEXP_REPLACE(au.email::TEXT, '^(.).*(.@.*)$', '\1***\2')::TEXT AS referee_email,
    c.billing_cycle::TEXT,
    c.is_renewal,
    c.gross_amount,
    c.commission_amount,
    c.status::TEXT,
    c.available_at,
    c.paid_at,
    c.created_at
  FROM commissions c
  JOIN auth.users au ON au.id = c.referee_id
  WHERE c.referrer_id = v_user_id
  ORDER BY c.created_at DESC;
END;
$$;

-- ── admin_list_payout_requests ──────────────────────────────────────
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
    pr.id,
    pr.partner_id,
    au.email::TEXT,
    up.full_name::TEXT,
    pr.requested_amount,
    pr.status::TEXT,
    pr.bank_name::TEXT,
    pr.bank_account_number::TEXT,
    pr.bank_account_name::TEXT,
    pr.partner_notes::TEXT,
    pr.admin_notes::TEXT,
    pr.reviewed_at,
    pr.paid_at,
    pr.payment_proof_url::TEXT,
    pr.created_at
  FROM payout_requests pr
  JOIN auth.users au         ON au.id = pr.partner_id
  LEFT JOIN user_profiles up ON up.id = pr.partner_id
  WHERE p_status IS NULL OR pr.status = p_status
  ORDER BY pr.created_at DESC;
END;
$$;

-- ── admin_list_partners ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_list_partners(p_status TEXT DEFAULT NULL)
RETURNS TABLE(
  user_id           UUID,
  email             TEXT,
  full_name         TEXT,
  phone_number      TEXT,
  code              TEXT,
  approval_status   TEXT,
  approved_at       TIMESTAMPTZ,
  approved_by       TEXT,
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
    au.email::TEXT,
    up.full_name::TEXT,
    up.phone_number::TEXT,
    rc.code::TEXT,
    rc.approval_status::TEXT,
    rc.approved_at,
    rc.approved_by::TEXT,
    rc.rejection_reason::TEXT,
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

-- ── ensure_referral_code (jaga-jaga, samakan tipe ke TEXT) ──────────
CREATE OR REPLACE FUNCTION ensure_referral_code()
RETURNS TABLE(code TEXT, is_active BOOLEAN, approval_status TEXT, created_at TIMESTAMPTZ)
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
  SELECT rc.code::TEXT, rc.is_active, rc.approval_status::TEXT, rc.created_at
  FROM referral_codes rc
  WHERE rc.user_id = v_user_id;
END;
$$;
