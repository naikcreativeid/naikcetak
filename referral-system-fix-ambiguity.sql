-- ============================================================
-- PATCH: Perbaiki "column reference X is ambiguous"
-- pada fungsi admin yang RETURNS TABLE.
--
-- Penyebab: nama OUT parameter di RETURNS TABLE (id, email, status)
-- bentrok dengan kolom di body subquery seperti:
--   SELECT email FROM auth.users WHERE id = auth.uid()
-- Postgres plpgsql menganggap "email" / "id" ambigu antara OUT param
-- vs kolom tabel.
--
-- Solusi:
--   1. Pakai local variable untuk admin email check (clean)
--   2. Qualifikasi semua referensi kolom dengan alias tabel
--   3. Cast eksplisit ::TEXT untuk semua source VARCHAR
--
-- Aman dijalankan ulang.
-- ============================================================

DROP FUNCTION IF EXISTS admin_list_partners(TEXT);
DROP FUNCTION IF EXISTS admin_list_payout_requests(TEXT);
DROP FUNCTION IF EXISTS admin_partner_stats();
DROP FUNCTION IF EXISTS admin_approve_partner(UUID);
DROP FUNCTION IF EXISTS admin_reject_partner(UUID, TEXT);
DROP FUNCTION IF EXISTS admin_approve_payout(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS admin_reject_payout(UUID, TEXT);

-- ── admin_list_partners ─────────────────────────────────────────────
CREATE FUNCTION admin_list_partners(p_status TEXT DEFAULT NULL)
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
DECLARE
  v_admin_email TEXT;
BEGIN
  SELECT au.email INTO v_admin_email FROM auth.users au WHERE au.id = auth.uid();
  IF v_admin_email NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
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
    (SELECT COUNT(*) FROM referrals r WHERE r.referrer_id = rc.user_id),
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

-- ── admin_list_payout_requests ──────────────────────────────────────
CREATE FUNCTION admin_list_payout_requests(p_status TEXT DEFAULT NULL)
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
DECLARE
  v_admin_email TEXT;
BEGIN
  SELECT au.email INTO v_admin_email FROM auth.users au WHERE au.id = auth.uid();
  IF v_admin_email NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
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

-- ── admin_partner_stats (qualifikasi sambil lewat) ──────────────────
CREATE FUNCTION admin_partner_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_email TEXT;
BEGIN
  SELECT au.email INTO v_admin_email FROM auth.users au WHERE au.id = auth.uid();
  IF v_admin_email NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN (
    SELECT json_build_object(
      'total_partners',         (SELECT COUNT(*) FROM referral_codes),
      'active_partners',        (SELECT COUNT(DISTINCT c.referrer_id) FROM commissions c WHERE c.status <> 'clawed_back'),
      'total_referees',         (SELECT COUNT(*) FROM referrals),
      'total_commission_paid',  COALESCE((SELECT SUM(c.commission_amount) FROM commissions c WHERE c.status = 'paid'), 0),
      'total_outstanding',      COALESCE((SELECT SUM(c.commission_amount) FROM commissions c WHERE c.status IN ('pending','available')), 0),
      'pending_payouts',        (SELECT COUNT(*) FROM payout_requests pr WHERE pr.status = 'pending'),
      'pending_payout_amount',  COALESCE((SELECT SUM(pr.requested_amount) FROM payout_requests pr WHERE pr.status = 'pending'), 0)
    )
  );
END;
$$;

-- ── admin_approve_partner ───────────────────────────────────────────
CREATE FUNCTION admin_approve_partner(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_email TEXT;
  v_promoted    INTEGER;
BEGIN
  SELECT au.email INTO v_admin_email FROM auth.users au WHERE au.id = auth.uid();
  IF v_admin_email NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE referral_codes
  SET approval_status  = 'approved',
      approved_at      = NOW(),
      approved_by      = v_admin_email,
      rejection_reason = NULL,
      is_active        = true
  WHERE referral_codes.user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partner not found (user_id: %)', p_user_id;
  END IF;

  UPDATE commissions
  SET status       = 'pending',
      available_at = NOW() + INTERVAL '7 days'
  WHERE commissions.referrer_id = p_user_id
    AND commissions.status = 'awaiting_partner_approval';

  GET DIAGNOSTICS v_promoted = ROW_COUNT;

  RETURN json_build_object('success', true, 'promoted_commissions', v_promoted);
END;
$$;

-- ── admin_reject_partner ────────────────────────────────────────────
CREATE FUNCTION admin_reject_partner(p_user_id UUID, p_reason TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_email TEXT;
  v_clawed_back INTEGER;
BEGIN
  SELECT au.email INTO v_admin_email FROM auth.users au WHERE au.id = auth.uid();
  IF v_admin_email NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE referral_codes
  SET approval_status  = 'rejected',
      approved_at      = NULL,
      approved_by      = v_admin_email,
      rejection_reason = p_reason,
      is_active        = false
  WHERE referral_codes.user_id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partner not found (user_id: %)', p_user_id;
  END IF;

  UPDATE commissions
  SET status          = 'clawed_back',
      clawback_reason = 'Partner rejected by admin: ' || p_reason
  WHERE commissions.referrer_id = p_user_id
    AND commissions.status = 'awaiting_partner_approval';

  GET DIAGNOSTICS v_clawed_back = ROW_COUNT;

  RETURN json_build_object('success', true, 'clawed_back_commissions', v_clawed_back);
END;
$$;

-- ── admin_approve_payout ────────────────────────────────────────────
CREATE FUNCTION admin_approve_payout(
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
  SELECT au.email INTO v_admin_email FROM auth.users au WHERE au.id = auth.uid();
  IF v_admin_email NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_payout FROM payout_requests pr WHERE pr.id = p_payout_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payout request not found'; END IF;
  IF v_payout.status = 'paid' THEN RAISE EXCEPTION 'Already paid'; END IF;

  v_remaining := v_payout.requested_amount;

  FOR v_commission IN
    SELECT c.id, c.commission_amount
    FROM commissions c
    WHERE c.referrer_id = v_payout.partner_id
      AND c.status = 'available'
    ORDER BY c.created_at ASC
  LOOP
    EXIT WHEN v_remaining <= 0;

    IF v_commission.commission_amount <= v_remaining THEN
      UPDATE commissions
      SET status = 'paid', paid_at = NOW(), payout_request_id = p_payout_id
      WHERE commissions.id = v_commission.id;
      v_remaining := v_remaining - v_commission.commission_amount;
    END IF;
  END LOOP;

  UPDATE payout_requests
  SET status            = 'paid',
      payment_proof_url = p_payment_proof_url,
      admin_notes       = COALESCE(p_admin_notes, payout_requests.admin_notes),
      reviewed_by       = v_admin_email,
      reviewed_at       = COALESCE(payout_requests.reviewed_at, NOW()),
      paid_at           = NOW()
  WHERE payout_requests.id = p_payout_id;

  RETURN json_build_object('success', true);
END;
$$;

-- ── admin_reject_payout ─────────────────────────────────────────────
CREATE FUNCTION admin_reject_payout(p_payout_id UUID, p_admin_notes TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_email TEXT;
BEGIN
  SELECT au.email INTO v_admin_email FROM auth.users au WHERE au.id = auth.uid();
  IF v_admin_email NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE payout_requests
  SET status      = 'rejected',
      admin_notes = p_admin_notes,
      reviewed_by = v_admin_email,
      reviewed_at = NOW()
  WHERE payout_requests.id = p_payout_id AND payout_requests.status = 'pending';

  RETURN json_build_object('success', true);
END;
$$;
