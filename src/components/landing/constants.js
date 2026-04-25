import {
  Calculator,
  Scissors,
  FileText,
  PackageCheck,
  Store,
  ReceiptText,
  MessagesSquare,
  BadgeCheck,
  Clock3,
  ShieldCheck,
  ArrowRight,
  BarChart3,
} from 'lucide-react';

export const APP_URL = 'https://app.naikcetak.com';
export const LOGIN_URL = `${APP_URL}/#/login`;
export const REGISTER_URL = `${APP_URL}/#/login?tab=daftar`;
export const WHATSAPP_URL = 'https://wa.me/6282261039601';

export const CITIES = [
  'Jakarta',
  'Bandung',
  'Surabaya',
  'Medan',
  'Makassar',
  'Yogyakarta',
  'Semarang',
  'Bali',
  'Palembang',
];

export const PAIN_POINTS = [
  {
    title: 'Hitung HPP manual = sering minus',
    description:
      'Salah hitungan 5% saja di pesanan 10.000 pcs bisa buat kamu rugi jutaan tanpa sadar.',
  },
  {
    title: 'Tidak tahu berapa potong per lembar',
    description:
      'Salah imposition = bahan terbuang = biaya naik. Pelanggan bayar sama, kamu yang tekor.',
  },
  {
    title: 'Invoice masih pakai Word, tampak tidak profesional',
    description:
      'Klien korporat ragu order karena invoice kamu terlihat seperti bikinan sendiri.',
  },
  {
    title: 'Klien terus WA tanya status pesanan',
    description:
      'Ganggu workflow kamu seharian, padahal mereka cuma mau tahu "sudah sampai mana?"',
  },
  {
    title: 'Tidak punya halaman online',
    description:
      'Klien baru tidak bisa cek layanan dan harga kamu. Kesempatan order lewat begitu saja.',
  },
  {
    title: 'Bikin quotation lama, makan waktu',
    description:
      'Hitung dulu, lalu ketik ulang manual. Klien sudah order ke percetakan lain.',
  },
];

export const FEATURES = [
  {
    label: 'PRODUKSI',
    title: 'Hitung Harga Pokok Produksi Tanpa Salah, Setiap Saat',
    description:
      'Tidak perlu spreadsheet rumit. Input dimensi box, gramatur, jenis kertas, biaya cetak, finishing, dan margin. NaikCetak hitung otomatis dalam detik.',
    bullets: [
      'Hitung per pcs secara real-time',
      'Saran margin keuntungan standar industri',
      'Simpan riwayat kalkulasi di cloud',
    ],
    linkLabel: 'Pelajari fitur ini',
    icon: Calculator,
    accent: 'var(--brand-blue)',
    mockup: 'hpp',
  },
  {
    label: 'EFISIENSI',
    title: 'Tahu Persis Berapa Potongan dari Setiap Lembar',
    description:
      'Visualisasi grid langsung di layar. Bandingkan layout normal vs rotasi 90° untuk dapatkan potongan maksimal dan waste minimal.',
    bullets: [
      'Visualisasi grid layout real-time',
      'Optimasi otomatis: normal vs rotasi 90°',
      'Estimasi biaya bahan per job',
    ],
    linkLabel: 'Pelajari fitur ini',
    icon: Scissors,
    accent: 'var(--accent-green)',
    mockup: 'cutting',
  },
  {
    label: 'PROFESIONALISME',
    title: 'Invoice Profesional dalam 30 Detik',
    description:
      'Pilih template, isi data klien dan item, klik. Invoice siap dikirim. Empat template desain siap cetak A4 dan export PDF langsung dari browser.',
    bullets: [
      '4 template: Minimalis, Modern, Classic, Bold',
      'Pilih warna tema sesuai brand percetakan kamu',
      'Export PDF + kirim via WhatsApp',
    ],
    linkLabel: 'Pelajari fitur ini',
    icon: ReceiptText,
    accent: 'var(--accent-orange)',
    mockup: 'invoice',
  },
  {
    label: 'LAYANAN KLIEN',
    title: 'Klien Bisa Lacak Pesanan Sendiri — Tanpa WA Kamu',
    description:
      'Bagikan link tracking ke klien. Mereka bisa cek status real-time dari order masuk sampai siap kirim tanpa login.',
    bullets: [
      'Halaman tracking publik tanpa login',
      '8 tahap produksi yang bisa dikustomisasi',
      'Riwayat update lengkap dengan timestamp',
    ],
    linkLabel: 'Pelajari fitur ini',
    icon: PackageCheck,
    accent: '#7C3AED',
    mockup: 'tracking',
  },
  {
    label: 'ONLINE PRESENCE',
    title: 'Punya Halaman Online Percetakan Kamu Sendiri',
    description:
      'Tampilkan layanan, harga, dan form request order di satu halaman publik. Klien request langsung, kamu follow up rapi dari dashboard.',
    bullets: [
      'URL unik: app.naikcetak.com/namatokokamu',
      'Tampilkan layanan + mulai harga',
      'Request order masuk rapi ke dashboard',
    ],
    linkLabel: 'Pelajari fitur ini',
    icon: Store,
    accent: '#0EA5E9',
    mockup: 'store',
  },
];

export const DEMO_TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    title: 'Ringkasan operasional dalam satu layar',
    subtitle:
      'Lihat job aktif, invoice pending, order yang butuh follow up, dan shortcut ke kalkulator tanpa pindah-pindah tab.',
  },
  {
    id: 'cutting',
    label: 'Kalkulator Potong Kertas',
    title: 'Cari layout paling hemat tanpa trial and error',
    subtitle:
      'Input ukuran plano dan produk, lalu langsung bandingkan normal vs rotasi 90° beserta estimasi biaya bahan.',
  },
  {
    id: 'biaya',
    label: 'Kalkulator Biaya Cetak',
    title: 'Hitung biaya produksi lengkap sampai finishing',
    subtitle:
      'Semua komponen biaya tersusun rapi: kertas, mesin, finishing, lem, packing, ongkir, sampai margin.',
  },
  {
    id: 'invoice',
    label: 'Invoice Generator',
    title: 'Edit di kiri, preview profesional di kanan',
    subtitle:
      'Isi item, pajak, diskon, lalu export PDF atau kirim ke klien dengan tampilan yang rapi dan meyakinkan.',
  },
];

export const STATS = [
  { value: '6.971+', label: 'Pengguna Aktif' },
  { value: 'Rp 0', label: 'Biaya Setup' },
  { value: '2 menit', label: 'Setup Pertama' },
  { value: '47%', label: 'Hemat Langganan Tahunan' },
];

export const TESTIMONIALS = [
  {
    quote:
      'Dulu hitung HPP bisa 30 menit per job. Sekarang 2 menit sudah dapat harga jual yang benar. Saya sudah 3x selamat dari jual rugi.',
    name: 'Budi Santoso',
    company: 'CV Inti Cetak, Bandung',
  },
  {
    quote:
      'Klien korporat saya terkesan dengan invoice yang saya kirim. Padahal saya bikin dalam 1 menit. Langsung closing project Rp 45jt.',
    name: 'Sari Dewi',
    company: 'Print Express, Surabaya',
  },
  {
    quote:
      'Tracking order itu game changer. WA saya yang tanya status pesanan berkurang 80%. Tim saya bisa fokus kerja.',
    name: 'Hendra Wijaya',
    company: 'Percetakan Maju, Jakarta',
  },
];

export const FAQS = [
  {
    question: 'Cara upgrade?',
    answer:
      'Masuk ke Status Langganan di sidebar, pilih Pro, bayar selesai. Akses Pro langsung mengikuti status langganan aktif kamu.',
  },
  {
    question: 'Ada refund?',
    answer:
      'Iya, 7 hari pertama full refund jika tidak puas. Tim kami bantu review dulu agar setup kamu optimal sebelum refund diproses.',
  },
  {
    question: 'Lama aktif?',
    answer:
      'Akun aktif selama langganan aktif. Data kamu tetap tersimpan aman dan bisa diakses kembali saat berlangganan lagi.',
  },
  {
    question: 'Bisa dipakai berapa perangkat?',
    answer:
      'Pro support multi user dan multi perangkat, jadi owner dan tim bisa kerja dari device masing-masing.',
  },
];

export const HERO_PROOFS = [
  { icon: BadgeCheck, text: 'Dipakai 6.971+ percetakan' },
  { icon: ShieldCheck, text: 'Tanpa kartu kredit' },
  { icon: Clock3, text: 'Setup 2 menit' },
];

export const FOOTER_LINKS = [
  {
    title: 'Produk',
    items: [
      { label: 'Fitur', href: '#fitur' },
      { label: 'Harga', href: '#harga' },
      { label: 'Changelog', href: APP_URL },
      { label: 'Roadmap', href: APP_URL },
    ],
  },
  {
    title: 'Perusahaan',
    items: [
      { label: 'Tentang', href: APP_URL },
      { label: 'Blog', href: APP_URL },
      { label: 'Karir', href: APP_URL },
      { label: 'Kontak', href: 'mailto:admin@naikcetak.com' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Syarat & Ketentuan', href: '/terms' },
      { label: 'Kebijakan Privasi',  href: '/privacy' },
      { label: 'Kebijakan Refund',    href: '/refund' },
      { label: 'Hubungi Kami',        href: '/contact' },
    ],
  },
];

export const NAV_LINKS = [
  { label: 'Fitur', href: '#fitur' },
  { label: 'Harga', href: '#harga' },
  { label: 'FAQ', href: '#faq' },
];

export const FINAL_CTA_ACTIONS = [
  { label: 'Coba Gratis Sekarang', href: REGISTER_URL, primary: true, icon: ArrowRight },
  { label: 'Hubungi Kami via WhatsApp', href: WHATSAPP_URL, primary: false, icon: MessagesSquare },
];

export const HERO_METRICS = [
  { icon: BarChart3, label: 'HPP Rata-rata', value: 'Rp 1.250/pcs' },
  { icon: FileText, label: 'Invoice Aktif', value: '7 Pending' },
  { icon: PackageCheck, label: 'Order Tracking', value: 'Finishing 72%' },
];
