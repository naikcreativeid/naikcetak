-- Midtrans status patch for Admin Panel
-- Jalankan setelah supabase-subscription.sql dan midtrans-schema.sql

ALTER TABLE public.upgrade_requests
  ADD COLUMN IF NOT EXISTS order_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS snap_token TEXT,
  ADD COLUMN IF NOT EXISTS transaction_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_type TEXT,
  ADD COLUMN IF NOT EXISTS fraud_status TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IDR',
  ADD COLUMN IF NOT EXISTS midtrans_response JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS webhook_payload JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS webhook_received_at TIMESTAMPTZ;

DROP FUNCTION IF EXISTS public.admin_get_upgrade_requests(TEXT);
CREATE OR REPLACE FUNCTION public.admin_get_upgrade_requests(p_admin_email TEXT)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  user_email VARCHAR(255),
  user_name VARCHAR(200),
  requested_plan VARCHAR(20),
  billing_cycle VARCHAR(10),
  amount_to_pay INTEGER,
  payment_proof_url TEXT,
  payment_method VARCHAR(50),
  payment_notes TEXT,
  status VARCHAR(20),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by VARCHAR(100),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ,
  order_id TEXT,
  payment_gateway TEXT,
  snap_token TEXT,
  transaction_status TEXT,
  transaction_id TEXT,
  payment_type TEXT,
  fraud_status TEXT,
  currency TEXT,
  midtrans_response JSONB,
  webhook_payload JSONB,
  paid_at TIMESTAMPTZ,
  webhook_received_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF p_admin_email NOT IN ('naikcetakexclusive@gmail.com', 'naikphotoexclusive@gmail.com', 'admin@naikcetak.com') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    ur.id,
    ur.user_id,
    ur.user_email,
    ur.user_name,
    ur.requested_plan,
    ur.billing_cycle,
    ur.amount_to_pay,
    ur.payment_proof_url,
    ur.payment_method,
    ur.payment_notes,
    ur.status,
    ur.submitted_at,
    ur.reviewed_at,
    ur.reviewed_by,
    ur.rejection_reason,
    ur.created_at,
    ur.order_id,
    COALESCE(ur.payment_gateway, 'manual') AS payment_gateway,
    ur.snap_token,
    COALESCE(ur.transaction_status, CASE
      WHEN ur.status = 'approved' THEN 'approved'
      WHEN ur.status = 'rejected' THEN 'rejected'
      WHEN ur.status = 'cancelled' THEN 'cancelled'
      ELSE 'pending'
    END) AS transaction_status,
    ur.transaction_id,
    ur.payment_type,
    ur.fraud_status,
    COALESCE(ur.currency, 'IDR') AS currency,
    COALESCE(ur.midtrans_response, '{}'::jsonb) AS midtrans_response,
    COALESCE(ur.webhook_payload, '{}'::jsonb) AS webhook_payload,
    ur.paid_at,
    ur.webhook_received_at
  FROM public.upgrade_requests ur
  ORDER BY ur.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_upgrade_requests(TEXT) TO authenticated;
