-- ============================================================
-- Manual payment follow-up schema patch
-- Jalankan di Supabase SQL Editor setelah subscription schema aktif
-- ============================================================

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS last_upgrade_followup_email_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS upgrade_followup_email_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_user_profiles_upgrade_followup
  ON public.user_profiles (plan, last_upgrade_followup_email_at);
