-- Midtrans Snap integration schema patch
-- Jalankan sekali di Supabase SQL Editor

ALTER TABLE upgrade_requests
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_upgrade_requests_order_id
  ON upgrade_requests (order_id)
  WHERE order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_upgrade_requests_transaction_status
  ON upgrade_requests (transaction_status);
