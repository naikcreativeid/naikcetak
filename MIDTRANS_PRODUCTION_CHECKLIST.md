# Midtrans Sandbox to Production Checklist

Gunakan checklist ini setelah akun Midtrans production selesai diverifikasi. Jika status verifikasi masih 1-3 hari, aman untuk lanjut pakai sandbox dan menyiapkan item di bawah lebih dulu.

## 1. Sebelum go-live

- Pastikan flow sandbox sudah lulus end-to-end: create token, popup Snap tampil, webhook masuk, status `upgrade_requests` ter-update, dan plan user aktif otomatis.
- Pastikan file SQL Midtrans sudah dijalankan di Supabase:
  - `supabase-subscription.sql`
  - `midtrans-schema.sql`
  - `admin-midtrans-status-patch.sql`
- Pastikan endpoint production publik sudah final dan pakai HTTPS.
- Pastikan domain production tidak redirect aneh untuk endpoint webhook.

## 2. Ambil credential production

- Login ke Midtrans Dashboard production.
- Ambil `Server Key` dan `Client Key` production.
- Cek payment channel mana yang benar-benar sudah aktif di akun production.

Referensi resmi:
- https://docs.midtrans.com/docs/switching-to-production-mode
- https://docs.midtrans.com/reference/going-live-to-production

## 3. Update environment variable

Ganti value sandbox ke production pada environment production:

```env
VITE_MIDTRANS_CLIENT_KEY=Mid-client-xxxx
VITE_MIDTRANS_IS_PRODUCTION=true
MIDTRANS_SERVER_KEY=Mid-server-xxxx
MIDTRANS_IS_PRODUCTION=true
```

Checklist:
- Jangan campur `SB-Mid-...` dengan mode production.
- `VITE_MIDTRANS_IS_PRODUCTION` dan `MIDTRANS_IS_PRODUCTION` harus sama-sama `true`.
- Simpan key production hanya di environment production, bukan hardcoded di repo.

## 4. Update konfigurasi Midtrans dashboard

Di Midtrans Dashboard production, set URL berikut ke domain production final Anda:

- Payment Notification URL: `https://your-domain.com/api/midtrans-webhook`
- Finish Redirect URL: `https://your-domain.com/`
- Unfinished Redirect URL: `https://your-domain.com/`
- Error Redirect URL: `https://your-domain.com/`

Catatan:
- Gunakan HTTPS.
- Jangan pakai localhost, IP address, port tidak umum, atau URL yang butuh auth.
- Endpoint webhook harus bisa menerima POST publik tanpa redirect.

Referensi resmi:
- https://docs.midtrans.com/docs/https-notification-webhooks
- https://docs.midtrans.com/docs/midtrans-notification-features

## 5. Verifikasi backend webhook

Pastikan backend Anda sudah:

- Verifikasi signature Midtrans.
- Update `upgrade_requests.transaction_status`.
- Simpan `webhook_payload` dan `webhook_received_at`.
- Tandai `paid_at` saat status sukses.
- Proses webhook secara idempotent berdasarkan `order_id`.
- Mengembalikan HTTP `200` jika notifikasi berhasil diproses.

Referensi resmi:
- https://docs.midtrans.com/docs/https-notification-webhooks
- https://docs.midtrans.com/docs/handle-after-payment

## 6. Deploy production

- Update env di Vercel/hosting production.
- Redeploy frontend + API.
- Buka admin panel dan pastikan request Midtrans sekarang tampil status transaksinya.
- Cek console/server log untuk memastikan tidak ada env yang masih sandbox.

## 7. Smoke test production

Setelah akun approved dan deployment selesai:

- Buat 1 transaksi real nominal kecil yang memang Anda siapkan untuk testing internal.
- Pastikan popup Snap memakai endpoint production.
- Pastikan request muncul di admin panel dengan badge `Midtrans`.
- Pastikan status berubah `pending -> settlement/capture -> approved`.
- Pastikan user otomatis naik plan tanpa approve manual.
- Pastikan notifikasi webhook tercatat di dashboard Midtrans dan di database Anda.

## 8. Fallback operasional

Kalau webhook production gagal:

- Cek URL notification di dashboard Midtrans.
- Cek log API `/api/midtrans-webhook`.
- Cek apakah server masih menerima TLS v1.2.
- Cek apakah domain production memblokir request publik Midtrans.
- Siapkan prosedur sementara: admin monitor transaksi di dashboard Midtrans lalu cek `upgrade_requests` sebelum bantu user manual.

## 9. Yang bisa dikerjakan sambil menunggu verifikasi 1-3 hari

- Rapikan tampilan status transaksi di admin panel.
- Pastikan sandbox webhook stabil.
- Siapkan environment variable production di dashboard hosting, tapi belum diaktifkan.
- Simpan URL production final untuk notification/redirect.
- Siapkan 1 skenario smoke test internal saat akun production sudah aktif.
