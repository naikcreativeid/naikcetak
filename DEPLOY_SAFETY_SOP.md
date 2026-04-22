# SOP Aman Update Fitur Naikcetak

Dokumen ini dibuat supaya update fitur baru tidak merusak dashboard user yang sudah aktif, terutama user Pro dan flow pembayaran.

## Ringkasannya

Jangan kerja langsung di `main` untuk fitur baru.

Pakai alur ini:

1. Buat branch fitur baru.
2. Kerjakan perubahan di branch itu.
3. Jalankan build lokal.
4. Jika ada perubahan database, jalankan SQL patch yang aman.
5. Test akun user lama dan user Pro.
6. Baru push branch.
7. Cek preview deploy.
8. Jika aman, baru merge ke `main`.

## Kenapa ini aman

Push ke GitHub tidak otomatis merusak user.

Yang berbahaya adalah jika perubahan yang di-push:

- langsung terdeploy ke production,
- mengubah struktur database lama,
- menghapus field lama yang masih dipakai,
- atau frontend baru aktif sebelum database production siap.

Jadi prinsipnya: tambah dulu, jangan hapus dulu.

## Aturan emas

- Gunakan `ADD COLUMN IF NOT EXISTS` untuk kolom baru.
- Gunakan `CREATE OR REPLACE FUNCTION` untuk RPC.
- Jangan hapus kolom lama yang masih dipakai UI.
- Jangan rename kolom lama tanpa masa transisi.
- Jangan deploy frontend baru yang butuh schema baru sebelum SQL production dijalankan.
- Jangan simpan key production di source code.

## Workflow paling aman yang harus Anda ikuti

### A. Mulai fitur baru

Jalankan ini di terminal:

```powershell
git checkout -b feature/nama-fitur
```

Contoh:

```powershell
git checkout -b feature/midtrans-status-user
```

### B. Setelah coding selesai

Jalankan:

```powershell
npm run build
```

Kalau build gagal, jangan push dulu.

### C. Jika ada perubahan database

Jalankan SQL patch di Supabase SQL Editor dulu.

Untuk fitur Midtrans/status ini, urutannya:

1. `supabase-subscription.sql`
2. `midtrans-schema.sql`
3. `admin-midtrans-status-patch.sql`

Catatan:

- Jalankan di project Supabase yang benar.
- Jangan ubah isi patch sembarangan kalau belum paham efeknya.

### D. Test minimal sebelum push

Wajib cek 3 kondisi ini:

1. User biasa / starter masih bisa login dan buka dashboard.
2. User Pro lama masih bisa buka fitur Pro.
3. User yang sedang pending payment masih melihat status transaksi dengan benar.

Untuk fitur Midtrans, cek juga:

1. Admin panel bisa lihat status transaksi.
2. User bisa lihat status transaksi di halaman subscription.
3. Jika webhook sukses, plan user ikut update.

### E. Baru push ke GitHub

```powershell
git add .
git commit -m "Nama perubahan Anda"
git push -u origin feature/nama-fitur
```

### F. Jangan merge ke `main` kalau belum lolos cek ini

- Build lokal sukses
- SQL patch sudah dijalankan jika dibutuhkan
- Tidak ada error console penting
- User lama masih aman
- User Pro lama masih aman
- Payment flow tidak rusak

## Checklist cepat sebelum merge ke main

Salin checklist ini setiap kali mau release:

- [ ] Saya tidak kerja langsung di `main`
- [ ] `npm run build` sukses
- [ ] SQL patch sudah dijalankan jika ada schema baru
- [ ] Login user starter aman
- [ ] Login user Pro aman
- [ ] Halaman subscription aman
- [ ] Admin panel aman
- [ ] Midtrans/webhook aman
- [ ] Tidak ada kolom/fungsi lama yang dihapus mendadak

## Contoh yang aman

- Tambah kolom baru: aman
- Tambah function baru: aman
- Tambah tampilan baru di UI: umumnya aman
- Tambah fallback `COALESCE(...)`: aman

## Contoh yang berisiko

- Hapus kolom lama
- Rename kolom lama
- Ubah tipe kolom lama
- Ganti nama RPC yang sedang dipakai frontend
- Ganti env production tanpa test
- Push langsung ke `main` lalu auto-deploy

## Solusi paling aman untuk Anda mulai hari ini

Mulai sekarang, jangan coding fitur langsung di `main`.

Setiap mau bikin fitur:

```powershell
git checkout -b feature/nama-fitur
```

Kalau fitur sudah aman dan lolos test, baru merge ke `main`.

## Jika Anda bingung harus pilih yang mana

Pilih ini:

1. Kerja di branch fitur.
2. Build lokal.
3. Jalankan SQL patch jika perlu.
4. Test.
5. Push branch.
6. Minta saya review sebelum merge ke `main`.

Itu jalur paling aman.
