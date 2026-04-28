-- Pastikan bucket bukti transfer ada dan admin bisa membaca semua object
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "Users upload own proof" ON storage.objects;
DROP POLICY IF EXISTS "Users read own proof" ON storage.objects;
DROP POLICY IF EXISTS "Admin reads all proofs" ON storage.objects;

CREATE POLICY "Users upload own proof"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users read own proof"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admin reads all proofs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-proofs'
    AND EXISTS (
      SELECT 1
      FROM public.user_profiles up
      WHERE up.id = auth.uid()
        AND up.email IN ('naikcetakexclusive@gmail.com', 'admin@naikcetak.com')
    )
  );

-- Normalisasi data lama: ubah public URL Supabase menjadi object path
UPDATE public.upgrade_requests
SET payment_proof_url = regexp_replace(
  payment_proof_url,
  '^https?://[^/]+/storage/v1/object/(public|sign)/payment-proofs/',
  ''
)
WHERE payment_proof_url ~ '^https?://[^/]+/storage/v1/object/(public|sign)/payment-proofs/';

UPDATE public.user_profiles
SET payment_proof_url = regexp_replace(
  payment_proof_url,
  '^https?://[^/]+/storage/v1/object/(public|sign)/payment-proofs/',
  ''
)
WHERE payment_proof_url ~ '^https?://[^/]+/storage/v1/object/(public|sign)/payment-proofs/';
