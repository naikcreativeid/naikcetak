-- ============================================================
-- PATCH: admin_activate_plan now also records referral commission
-- Jalankan SETELAH referral-commission-system.sql
--
-- Tambahan: panggil record_commission(p_upgrade_request_id) di akhir
-- supaya admin manual approve (bank transfer) juga trigger komisi
-- konsisten dengan flow Midtrans webhook.
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
  v_commission_result JSON;
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

    -- Catat komisi referral. Tidak fail kalau no_referrer / sudah recorded.
    BEGIN
      v_commission_result := record_commission(p_upgrade_request_id);
    EXCEPTION WHEN OTHERS THEN
      -- Log via raise notice, jangan rollback aktivasi plan
      RAISE NOTICE 'record_commission failed: %', SQLERRM;
    END;
  END IF;

  RETURN json_build_object(
    'success',           true,
    'plan',              p_plan,
    'start_date',        v_effective_start,
    'expire_date',       v_expire_date,
    'expires_at',        v_expire_date,
    'commission_result', v_commission_result
  );
END;
$$;
