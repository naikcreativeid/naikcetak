# Push Safe Checklist

Checklist singkat sebelum Anda push perubahan ke GitHub.

## Wajib

- [ ] Saya bukan sedang kerja di branch `main`
- [ ] Saya sudah jalankan `npm run build`
- [ ] Build sukses tanpa error
- [ ] Saya sudah test login user lama
- [ ] Saya sudah test user Pro
- [ ] Saya sudah test fitur yang baru saya ubah

## Jika ada perubahan database

- [ ] SQL patch sudah disiapkan
- [ ] SQL patch aman (`IF NOT EXISTS`, `CREATE OR REPLACE`, `COALESCE`)
- [ ] SQL patch sudah dijalankan di Supabase yang benar
- [ ] Frontend tidak bergantung ke kolom yang belum dibuat

## Jika ada perubahan Midtrans

- [ ] Endpoint webhook masih sama / masih valid
- [ ] Status transaksi masih tampil di admin
- [ ] Status transaksi masih tampil di user
- [ ] User tetap bisa retry jika pembayaran gagal

## Command yang dipakai

```powershell
git checkout -b feature/nama-fitur
npm run build
git add .
git commit -m "Nama perubahan"
git push -u origin feature/nama-fitur
```

## Setelah push

Jangan langsung merge ke `main` kalau belum yakin.

Lakukan:

1. Cek preview deploy
2. Test fitur utama
3. Baru merge ke `main`
