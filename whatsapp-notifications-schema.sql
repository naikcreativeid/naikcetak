-- ============================================================
-- WhatsApp Notifications (Fonnte) — schema additions
-- Jalankan di Supabase Dashboard → SQL Editor.
-- Aman dijalankan ulang (idempotent).
-- ============================================================

-- Pastikan kolom phone_number ada di user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Tracking reminder unpaid-checkout di upgrade_requests
ALTER TABLE upgrade_requests
  ADD COLUMN IF NOT EXISTS last_unpaid_reminder_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS unpaid_reminder_count   INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_upgrade_requests_unpaid_reminder
  ON upgrade_requests (status, payment_proof_url, last_unpaid_reminder_at)
  WHERE status = 'pending';

-- ============================================================
-- RPC: get_unpaid_checkout_reminders
-- Mengembalikan upgrade_requests yang:
--   - status = 'pending'
--   - payment_proof_url NULL/kosong (belum upload bukti)
--   - submitted >= 30 menit lalu (kasih waktu user transfer dulu)
--   - belum pernah di-remind, ATAU last reminder > p_cooldown_hours jam yg lalu
--   - max 3x reminder per request
-- ============================================================
CREATE OR REPLACE FUNCTION get_unpaid_checkout_reminders(
  p_limit            INTEGER DEFAULT 25,
  p_min_age_minutes  INTEGER DEFAULT 30,
  p_max_age_hours    INTEGER DEFAULT 72,
  p_cooldown_hours   INTEGER DEFAULT 12,
  p_max_reminders    INTEGER DEFAULT 3
)
RETURNS TABLE (
  request_id     UUID,
  user_id        UUID,
  user_email     TEXT,
  user_name      TEXT,
  phone_number   TEXT,
  requested_plan TEXT,
  billing_cycle  TEXT,
  amount_to_pay  INTEGER,
  payment_method TEXT,
  order_id       TEXT,
  submitted_at   TIMESTAMPTZ,
  reminder_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ur.id::UUID,
    ur.user_id::UUID,
    COALESCE(ur.user_email, up.email)::TEXT,
    COALESCE(ur.user_name, up.full_name, up.company_name, '')::TEXT,
    COALESCE(up.phone_number, '')::TEXT,
    ur.requested_plan::TEXT,
    ur.billing_cycle::TEXT,
    ur.amount_to_pay::INTEGER,
    COALESCE(ur.payment_method, '')::TEXT,
    COALESCE(ur.order_id, '')::TEXT,
    ur.submitted_at::TIMESTAMPTZ,
    COALESCE(ur.unpaid_reminder_count, 0)::INTEGER
  FROM upgrade_requests ur
  LEFT JOIN user_profiles up ON up.id = ur.user_id
  WHERE ur.status = 'pending'
    AND (ur.payment_proof_url IS NULL OR length(trim(ur.payment_proof_url)) = 0)
    AND ur.submitted_at >= NOW() - make_interval(hours => p_max_age_hours)
    AND ur.submitted_at <= NOW() - make_interval(mins  => p_min_age_minutes)
    AND COALESCE(ur.unpaid_reminder_count, 0) < p_max_reminders
    AND (
      ur.last_unpaid_reminder_at IS NULL
      OR ur.last_unpaid_reminder_at <= NOW() - make_interval(hours => p_cooldown_hours)
    )
    AND COALESCE(up.phone_number, '') <> ''
  ORDER BY ur.submitted_at ASC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_unpaid_checkout_reminders(INTEGER, INTEGER, INTEGER, INTEGER, INTEGER)
  TO service_role;

-- ============================================================
-- RPC: mark_unpaid_checkout_reminded
-- Tandai sebuah upgrade_request bahwa reminder WA sudah dikirim.
-- ============================================================
CREATE OR REPLACE FUNCTION mark_unpaid_checkout_reminded(p_request_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE upgrade_requests
     SET last_unpaid_reminder_at = NOW(),
         unpaid_reminder_count   = COALESCE(unpaid_reminder_count, 0) + 1
   WHERE id = p_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_unpaid_checkout_reminded(UUID) TO service_role;
