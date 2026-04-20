-- ============================================================
-- Security Fix — Jalankan di Supabase SQL Editor
-- Fixes: Function Search Path Mutable (6 warnings)
-- ============================================================

-- Fix 1: update_updated_at_column
ALTER FUNCTION public.update_updated_at_column()
  SET search_path = public;

-- Fix 2: auto_downgrade_expired_users
ALTER FUNCTION public.auto_downgrade_expired_users()
  SET search_path = public;

-- Fix 3: mark_users_for_reminder
ALTER FUNCTION public.mark_users_for_reminder()
  SET search_path = public;

-- Fix 4: admin_mark_reminder_sent
-- (coba tanpa argumen dulu; jika error, gunakan versi dengan argumen di bawah)
ALTER FUNCTION public.admin_mark_reminder_sent(uuid, text)
  SET search_path = public;

-- Fix 5: admin_activate_plan
ALTER FUNCTION public.admin_activate_plan(uuid, text, text, uuid, integer, text, text, boolean)
  SET search_path = public;

-- Fix 6: admin_downgrade_user
ALTER FUNCTION public.admin_downgrade_user(uuid, text)
  SET search_path = public;


-- ============================================================
-- Fix 7: Public Bucket Allows Listing — order-photos
-- Tambahkan policy agar hanya pemilik file yang bisa list
-- ============================================================

-- Hapus broad SELECT policy jika ada
DROP POLICY IF EXISTS "Public read order-photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;

-- Hanya pemilik (user_id match) yang bisa SELECT/LIST
CREATE POLICY "Owner can read own order photos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'order-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Pemilik bisa upload ke folder miliknya
CREATE POLICY "Owner can upload order photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'order-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Pemilik bisa hapus file miliknya
CREATE POLICY "Owner can delete order photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'order-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );


-- ============================================================
-- Fix 8: Leaked Password Protection
-- Ini fitur Supabase Pro — aktifkan via Dashboard:
-- Authentication → Sign In / Providers → Supabase Auth → Email
-- Toggle "Prevent use of leaked passwords" → ON
-- (Gratis di semua plan mulai 2024, bukan hanya Pro)
-- ============================================================

-- Tidak ada SQL untuk fix ini — harus via Dashboard UI.
-- Lihat screenshot: Authentication → Sign In / Providers → Email
-- Toggle: "Prevent use of leaked passwords" → aktifkan


-- ============================================================
-- Verifikasi: cek apakah search_path sudah ter-set
-- ============================================================
-- SELECT proname, proconfig
-- FROM pg_proc p
-- JOIN pg_namespace n ON p.pronamespace = n.oid
-- WHERE n.nspname = 'public'
--   AND proname IN (
--     'update_updated_at_column', 'auto_downgrade_expired_users',
--     'mark_users_for_reminder', 'admin_mark_reminder_sent',
--     'admin_activate_plan', 'admin_downgrade_user'
--   );
-- Hasilnya harus ada "search_path=public" di kolom proconfig.
