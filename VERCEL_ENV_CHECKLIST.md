# Vercel Env Checklist

Gunakan checklist ini untuk memastikan flow transaksi Midtrans berjalan end-to-end di Vercel.

## Env wajib untuk transaksi

Salin env berikut ke dashboard Vercel pada project ini.

### Sandbox / Testing

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxxx
VITE_MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxxx
MIDTRANS_IS_PRODUCTION=false
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Production

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_MIDTRANS_CLIENT_KEY=Mid-client-xxxxxxxx
VITE_MIDTRANS_IS_PRODUCTION=true
MIDTRANS_SERVER_KEY=Mid-server-xxxxxxxx
MIDTRANS_IS_PRODUCTION=true
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Cara isi di Vercel

1. Buka project di Vercel.
2. Masuk ke `Settings` -> `Environment Variables`.
3. Tambahkan semua env di atas ke environment yang dipakai:
   - `Development`
   - `Preview`
   - `Production`
4. Klik redeploy setelah semua env tersimpan.

## Catatan penting

- `VITE_` env akan ikut dipakai frontend build.
- `MIDTRANS_SERVER_KEY` dan `SUPABASE_SERVICE_ROLE_KEY` hanya untuk API serverless, jangan pernah ditaruh di kode frontend.
- `VITE_MIDTRANS_IS_PRODUCTION` dan `MIDTRANS_IS_PRODUCTION` harus selalu sama.
- Jangan campur key sandbox `SB-Mid-...` dengan mode production.
- Tanpa `SUPABASE_SERVICE_ROLE_KEY`, checkout bisa terbuka tetapi webhook tidak bisa aktivasi paket otomatis dengan aman.

## URL yang perlu dicek di Midtrans Dashboard

- `Payment Notification URL`: `https://your-domain.com/api/midtrans-webhook`
- `Finish Redirect URL`: `https://your-domain.com/`
- `Unfinished Redirect URL`: `https://your-domain.com/`
- `Error Redirect URL`: `https://your-domain.com/`

## Endpoint verifikasi setelah deploy

Setelah deploy, buka:

```text
https://your-domain.com/api/health-transaction
```

Respons sehat idealnya menunjukkan:

- `ok: true`
- `capabilities.checkoutReady: true`
- `capabilities.webhookReady: true`
- `environment.midtransModeAligned: true`

Kalau masih ada masalah, field `missing` dan `warnings` akan menunjukkan env mana yang belum siap.
