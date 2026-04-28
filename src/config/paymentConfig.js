export const BANK_ACCOUNTS = [
  {
    id: 'bca',
    bank: 'BCA',
    logo: '/images/banks/bca.png',
    noRek: import.meta.env.VITE_BCA_NO_REK || '2740238623',
    atasNama: import.meta.env.VITE_BCA_ATAS_NAMA || 'Dwi Retno Dinda Ramdhiani',
    warna: '#005BAC',
  },
  {
    id: 'mandiri',
    bank: 'Mandiri',
    logo: '/images/banks/mandiri.png',
    noRek: import.meta.env.VITE_MANDIRI_NO_REK || '1610017114047',
    atasNama: import.meta.env.VITE_MANDIRI_ATAS_NAMA || 'Dwi Retno Dinda Ramdhiani',
    warna: '#003087',
  },
];

export const QRIS_CONFIG = {
  imagePath: import.meta.env.VITE_QRIS_IMAGE || '/images/qris/qris-naikcetak.png',
  merchantName: 'NaikCetak',
};

export const ADMIN_WA = import.meta.env.VITE_ADMIN_WA || '6282261039601';

export const PRODUCTS = {
  PRO_MONTHLY: {
    id: 'pro-monthly',
    nama: 'NaikCetak Pro',
    deskripsi: 'Paket bulanan - akses semua fitur Pro',
    kodeProduk: 'PROM',
    harga: 149000,
    periode: 'bulan',
    badge: null,
  },
  PRO_YEARLY: {
    id: 'pro-yearly',
    nama: 'NaikCetak Pro',
    deskripsi: 'Paket tahunan - hemat 67%',
    kodeProduk: 'PROY',
    harga: 599000,
    periode: 'tahun',
    badge: 'HEMAT 67%',
  },
};

export const ACTIVE_VOUCHERS = [
  {
    kode: 'NAIKPRO50',
    diskon: 50000,
    tipe: 'nominal',
    berlakuUntuk: ['pro-monthly', 'pro-yearly'],
    aktif: true,
  },
];
