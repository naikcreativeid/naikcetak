import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, X, ChevronDown, Star, Zap, Crown, Building2,
  Calculator, Scissors, Printer, FileText, Package,
  Brain, Mail, Database, ArrowRight, Menu, Shield,
  Clock, Layers,
} from 'lucide-react';
import { PLANS, getEffectivePrice } from '../lib/plans';

const APP_URL      = 'https://app.naikcetak.com';
const LOGIN_URL    = `${APP_URL}/#/login`;
const REGISTER_URL = `${APP_URL}/#/login?tab=daftar`;

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Scissors,   color: '#2563EB', label: 'Potong Kertas',      badge: 'Baru',
    desc: 'Visualisasi grid real-time, hitung efisiensi, optimasi otomatis brute-force.' },
  { icon: Printer,    color: '#7C3AED', label: 'Hitung Cetakan',      badge: 'Baru',
    desc: 'HPP lengkap: kertas + ongkos cetak + finishing + lem + profit dalam 1 kalkulasi.' },
  { icon: Calculator, color: '#059669', label: 'Kalkulator HPP',      badge: null,
    desc: 'Hitung harga pokok produksi dengan simulasi bulk dan rekomendasi margin.' },
  { icon: FileText,   color: '#D97706', label: 'Invoice & Quotation', badge: null,
    desc: 'Template profesional, hitung otomatis, kirim via WhatsApp dalam hitungan detik.' },
  { icon: Package,    color: '#DC2626', label: 'Tracking Order',      badge: null,
    desc: 'Link publik untuk klien pantau status produksi tanpa perlu login.' },
  { icon: Brain,      color: '#0891B2', label: 'AI Assistant',        badge: 'Pro',
    desc: 'Analisis brief klien, saran spesifikasi teknis, dan audit bisnis berbasis Groq AI.' },
  { icon: Mail,       color: '#7C3AED', label: 'Email & Proposal',    badge: null,
    desc: 'Generator email penawaran profesional dengan tone dan format yang tepat.' },
  { icon: Database,   color: '#374151', label: 'Master Data',         badge: null,
    desc: 'Database kertas, finishing, dan mesin terintegrasi. Update sekali, berlaku semua.' },
];

const PAIN_POINTS = [
  { bad: 'Hitung potong kertas manual 30 menit, sering salah arah grain',
    good: 'Selesai 5 detik dengan visualisasi grid + optimasi otomatis' },
  { bad: 'Salah hitung HPP = jual rugi, tidak tahu mana job yang profit',
    good: 'Kalkulasi otomatis semua komponen biaya, langsung tahu margin' },
  { bad: 'Invoice masih di Word/Excel, dikirim manual satu per satu',
    good: 'Generate invoice profesional 1 klik, kirim WA langsung dari app' },
];

const SCREENSHOTS = [
  { label: 'Dashboard',       color: '#F0F9FF', accent: '#2563EB' },
  { label: 'Potong Kertas',   color: '#F0FDF4', accent: '#059669' },
  { label: 'Hitung Cetakan',  color: '#FEF9C3', accent: '#D97706' },
  { label: 'Invoice',         color: '#FDF4FF', accent: '#7C3AED' },
];

const TESTIMONIALS = [
  { quote: 'Dulu hitung potong kertas bisa 20 menit, sekarang 10 detik. Efisiensi naik drastis dan tidak ada lagi kerugian karena salah hitung.',
    name: 'Budi Santoso', title: 'Owner', company: 'PercetakanMaju', city: 'Bandung', initial: 'B' },
  { quote: 'Invoice naikcetak kelihatan jauh lebih profesional dari sebelumnya. Klien jadi lebih percaya dan pembayaran lebih tepat waktu.',
    name: 'Sari Dewi', title: 'Manajer Produksi', company: 'PrintHouse Solo', city: 'Solo', initial: 'S' },
  { quote: 'Fitur tracking order membuat klien lebih tenang karena bisa pantau sendiri. Komplain berkurang 80%.',
    name: 'Andi Pratama', title: 'Direktur', company: 'MegaPrint', city: 'Surabaya', initial: 'A' },
];

const PLAN_FEATURES_LIST = [
  { key: 'potongKertasPerMonth',   label: 'Potong Kertas' },
  { key: 'hitungCetakanPerMonth',  label: 'Hitung Cetakan' },
  { key: 'kalkulatorHPP',          label: 'Kalkulator HPP',     isFeature: true },
  { key: 'invoice',                label: 'Invoice & Quotation', isFeature: true },
  { key: 'trackingOrder',          label: 'Tracking Order',      isFeature: true },
  { key: 'exportPDF',              label: 'Export PDF',           isFeature: true },
  { key: 'groqAI',                 label: 'AI Assistant',         isFeature: true },
  { key: 'whatsappIntegration',    label: 'Integrasi WhatsApp',   isFeature: true },
  { key: 'multiOutlet',            label: 'Multi Outlet',         isFeature: true },
  { key: 'prioritySupport',        label: 'Priority Support',     isFeature: true },
];

const FAQ_ITEMS = [
  { q: 'Apakah naikcetak benar-benar gratis?',
    a: 'Ya! Paket Starter gratis selamanya — tidak perlu kartu kredit. Anda bisa pakai fitur Potong Kertas (10x/bulan) dan Hitung Cetakan (5x/bulan) tanpa biaya.' },
  { q: 'Bagaimana cara upgrade ke Pro?',
    a: 'Klik "Upgrade" di aplikasi → pilih paket → transfer ke rekening kami → upload bukti transfer. Admin akan verifikasi dan aktifkan akun Anda dalam 1×24 jam hari kerja.' },
  { q: 'Berapa lama aktivasi setelah transfer?',
    a: 'Maksimal 1×24 jam hari kerja. Jika sudah kirim bukti transfer ke WhatsApp admin, biasanya diproses dalam 1-2 jam.' },
  { q: 'Apakah data saya aman?',
    a: 'Data tersimpan di Supabase dengan enkripsi dan Row Level Security. Hanya Anda yang bisa mengakses data akun Anda sendiri.' },
  { q: 'Bisa dipakai di HP?',
    a: 'Ya, naikcetak fully responsive untuk semua device — desktop, tablet, maupun smartphone.' },
  { q: 'Apakah ada trial Pro?',
    a: 'Paket Starter bisa dicoba gratis selamanya. Jika butuh fitur Pro, langsung upgrade kapan saja. Tidak ada trial berbatas waktu yang membingungkan.' },
  { q: 'Bagaimana jika saya tidak puas?',
    a: 'Hubungi kami dalam 7 hari setelah aktivasi. Kami akan mempertimbangkan refund jika ada alasan yang valid.' },
  { q: 'Apa itu Groq AI di naikcetak?',
    a: 'Groq AI adalah AI assistant super cepat yang membantu analisis brief klien, saran spesifikasi teknis, dan audit bisnis. Paket Pro: gunakan API key Groq Anda sendiri (gratis). Paket Business: API key sudah termasuk.' },
];

const CITIES = ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Makassar', 'Yogyakarta', 'Semarang', 'Bali', 'Palembang', 'Pekanbaru'];

// ── Components ────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${scrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center">
            <Printer size={14} className="text-white" />
          </div>
          <span className="font-bold text-zinc-900 text-lg tracking-tight">naikcetak</span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {[['#features','Fitur'],['#pricing','Harga'],['#faq','FAQ']].map(([href, label]) => (
            <a key={href} href={href} className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">{label}</a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a href={LOGIN_URL} className="text-sm font-semibold text-zinc-700 hover:text-zinc-900 px-4 py-2 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-all">
            Masuk
          </a>
          <a href={REGISTER_URL} data-event="hero_cta_nav"
            className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
            Coba Gratis
          </a>
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setMenuOpen(v => !v)} className="md:hidden p-2 text-zinc-700">
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="md:hidden bg-white border-t border-zinc-100 px-4 py-4 space-y-3">
            {[['#features','Fitur'],['#pricing','Harga'],['#faq','FAQ']].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}
                className="block text-sm font-medium text-zinc-700 py-2">{label}</a>
            ))}
            <a href={REGISTER_URL}
              className="block text-center text-sm font-bold text-white bg-blue-600 py-3 rounded-xl mt-2">
              Coba Gratis Sekarang
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="pt-28 pb-20 bg-gradient-to-b from-blue-50/40 to-white px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Tag */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
          <span>✦</span> Software Percetakan #1 Indonesia
        </motion.div>

        {/* Headline */}
        <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-900 leading-tight mb-5">
          Hitung Biaya Cetak{' '}
          <span className="text-blue-600">10x Lebih Cepat</span>{' '}
          & Akurat
        </motion.h1>

        {/* Sub */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="text-lg text-zinc-500 max-w-2xl mx-auto mb-8 leading-relaxed">
          Kalkulator potong kertas, hitung cetakan, HPP otomatis, invoice, quotation,
          dan AI assistant — semua dalam satu platform untuk percetakan Indonesia.
        </motion.p>

        {/* CTA buttons */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <a href={REGISTER_URL} data-event="hero_cta_primary"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl text-base transition-all hover:shadow-lg hover:shadow-blue-200">
            Coba Gratis Sekarang <ArrowRight size={16} />
          </a>
          <a href="#features" data-event="hero_cta_demo"
            className="inline-flex items-center justify-center gap-2 border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-semibold px-8 py-4 rounded-xl text-base transition-all hover:bg-zinc-50">
            Lihat Fitur
          </a>
        </motion.div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-zinc-500">
          <span className="flex items-center gap-1.5"><Star size={13} className="text-amber-400 fill-amber-400" /> 4.9/5 dari 200+ percetakan</span>
          <span className="flex items-center gap-1.5"><Check size={13} className="text-emerald-500" /> Tanpa kartu kredit</span>
          <span className="flex items-center gap-1.5"><Clock size={13} className="text-blue-500" /> Setup 2 menit</span>
        </div>

        {/* App mockup */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mt-14 relative max-w-3xl mx-auto">
          <div className="bg-zinc-900 rounded-2xl p-1.5 shadow-2xl shadow-zinc-300">
            <div className="bg-zinc-800 rounded-xl flex items-center gap-1.5 px-3 py-2 mb-1">
              {['bg-red-400','bg-amber-400','bg-emerald-400'].map(c => <div key={c} className={`w-2.5 h-2.5 rounded-full ${c}`} />)}
              <div className="ml-2 flex-1 bg-zinc-700 rounded-md h-5 text-[10px] text-zinc-400 flex items-center px-2">
                app.naikcetak.com
              </div>
            </div>
            {/* Dashboard mockup */}
            <div className="bg-[#F7F7F5] rounded-xl overflow-hidden" style={{ height: 320 }}>
              <div className="flex h-full">
                {/* Sidebar */}
                <div className="w-36 bg-white border-r border-zinc-200 p-3 space-y-1 shrink-0">
                  <div className="h-7 bg-zinc-900 rounded-lg mb-3" />
                  {['Dashboard','Kalkulator HPP','Invoice','Tracking'].map((item, i) => (
                    <div key={item} className={`h-7 rounded-lg flex items-center px-2 text-[9px] font-semibold ${i === 0 ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                      {item}
                    </div>
                  ))}
                </div>
                {/* Content */}
                <div className="flex-1 p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[['#DBEAFE','Potong Kertas','↗ 24 job'],['#D1FAE5','HPP Hari Ini','Rp 2.4jt'],['#FEF9C3','Invoice Aktif','7 pending']].map(([bg, label, val]) => (
                      <div key={label} className="rounded-lg p-3" style={{ background: bg }}>
                        <p className="text-[8px] text-zinc-500 font-semibold">{label}</p>
                        <p className="text-[11px] font-black text-zinc-800 mt-1">{val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-[9px] font-bold text-zinc-600 mb-2">Riwayat Produksi</p>
                    {[['Potong Kertas','Box Kue 10×15','34 pcs/lbr','#DBEAFE'],['Hitung Cetakan','Brosur A5','Rp 1.250/pcs','#D1FAE5']].map(([type, name, val, bg]) => (
                      <div key={name} className="flex items-center gap-2 py-1.5 border-b border-zinc-50 last:border-0">
                        <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: bg }}>
                          <Scissors size={9} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[8px] font-semibold text-zinc-700 truncate">{name}</p>
                        </div>
                        <p className="text-[8px] font-bold text-zinc-500">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function SocialProofBar() {
  return (
    <section className="py-8 border-y border-zinc-100 bg-zinc-50">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-5">
          Dipercaya oleh percetakan di seluruh Indonesia
        </p>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
          {CITIES.map(city => (
            <span key={city} className="text-sm font-semibold text-zinc-500">{city}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function PainSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 mb-3">
            Capek Hitung Manual yang Sering Salah?
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto">
            Percetakan modern butuh alat yang tepat. naikcetak hadir untuk menyelesaikan masalah harian Anda.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PAIN_POINTS.map(({ bad, good }, i) => (
            <div key={i} className="rounded-2xl overflow-hidden border border-zinc-200">
              <div className="bg-red-50 p-4">
                <div className="flex items-start gap-2 text-sm text-red-700">
                  <X size={15} className="shrink-0 mt-0.5 text-red-500" />
                  <span>{bad}</span>
                </div>
              </div>
              <div className="bg-emerald-50 p-4 border-t border-zinc-200">
                <div className="flex items-start gap-2 text-sm text-emerald-800">
                  <Check size={15} className="shrink-0 mt-0.5 text-emerald-600" />
                  <span className="font-semibold">{good}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-zinc-50 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 mb-3">
            Semua yang Dibutuhkan Percetakan Modern
          </h2>
          <p className="text-zinc-500 max-w-xl mx-auto">
            Dari hitung kertas sampai kirim invoice — semua tersedia dalam satu platform terintegrasi.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, color, label, badge, desc }) => (
            <div key={label} className="bg-white rounded-2xl p-5 border border-zinc-200 hover:border-zinc-300 hover:shadow-sm transition-all">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: color + '18' }}>
                <Icon size={16} style={{ color }} />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-zinc-900">{label}</h3>
                {badge && (
                  <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{badge}</span>
                )}
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScreenshotSection() {
  const [active, setActive] = useState(0);
  const current = SCREENSHOTS[active];

  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 mb-3">
            Lihat naikcetak Beraksi
          </h2>
          <p className="text-zinc-500">Antarmuka bersih yang dirancang untuk kecepatan kerja</p>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {SCREENSHOTS.map(({ label }, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
                active === i ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Mockup frame */}
        <div className="bg-zinc-900 rounded-2xl p-1.5 shadow-2xl shadow-zinc-200">
          <div className="bg-zinc-800 rounded-xl flex items-center gap-1.5 px-3 py-2">
            {['bg-red-400','bg-amber-400','bg-emerald-400'].map(c => <div key={c} className={`w-2.5 h-2.5 rounded-full ${c}`} />)}
            <div className="ml-2 flex-1 bg-zinc-700 rounded-md h-5 text-[10px] text-zinc-400 flex items-center px-2">
              app.naikcetak.com
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={active} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="rounded-xl flex items-center justify-center"
              style={{ background: current.color, height: 300 }}>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: current.accent + '20' }}>
                  <Printer size={28} style={{ color: current.accent }} />
                </div>
                <p className="text-base font-bold" style={{ color: current.accent }}>{current.label}</p>
                <p className="text-sm text-zinc-500 mt-1">Fitur dalam pengembangan aktif</p>
                <a href={REGISTER_URL} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg text-white transition-colors"
                  style={{ background: current.accent }}>
                  Coba Sekarang <ArrowRight size={13} />
                </a>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const [cycle, setCycle] = useState('monthly');

  const planOrder = ['starter', 'pro', 'business'];
  const planIcons = { starter: null, pro: Zap, business: Crown };

  return (
    <section id="pricing" className="py-20 bg-zinc-50 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 mb-3">
            Harga Transparan, Tidak Ada Biaya Tersembunyi
          </h2>
          <p className="text-zinc-500 mb-6">Mulai gratis, upgrade kapan saja. Tidak ada komitmen jangka panjang.</p>

          {/* Billing toggle */}
          <div className="inline-flex bg-zinc-200 rounded-xl p-1 gap-1">
            {[['monthly','Bulanan'],['yearly','Tahunan — Hemat 34%']].map(([val, label]) => (
              <button key={val} onClick={() => setCycle(val)}
                className={`text-sm font-semibold px-5 py-2 rounded-lg transition-all ${
                  cycle === val ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {planOrder.map((planId) => {
            const plan  = PLANS[planId];
            const price = getEffectivePrice(planId, cycle);
            const normalPrice = plan.prices[cycle];
            const isEB  = plan.earlyBird.active && price !== normalPrice;
            const isPro = planId === 'pro';
            const Icon  = planIcons[planId];

            return (
              <div key={planId}
                className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col ${
                  isPro ? 'border-blue-500 shadow-lg shadow-blue-100' : 'border-zinc-200'
                }`}>
                {isPro && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      PALING POPULER
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-1">
                    {Icon && <Icon size={16} style={{ color: plan.color }} />}
                    <span className="font-bold text-zinc-900">{plan.name}</span>
                  </div>
                  <p className="text-xs text-zinc-500">{plan.tagline}</p>
                </div>

                <div className="mb-6">
                  {isEB && (
                    <p className="text-sm text-zinc-400 line-through">
                      Rp {normalPrice.toLocaleString('id-ID')}
                    </p>
                  )}
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-black text-zinc-900">
                      {price === 0 ? 'Gratis' : 'Rp\u00A0' + price.toLocaleString('id-ID')}
                    </span>
                    {price > 0 && (
                      <span className="text-zinc-400 text-sm mb-0.5">/{cycle === 'monthly' ? 'bln' : 'thn'}</span>
                    )}
                  </div>
                  {isEB && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      🔥 Early Bird
                    </span>
                  )}
                </div>

                <div className="space-y-2.5 flex-1 mb-6">
                  {PLAN_FEATURES_LIST.map(({ key, label, isFeature }) => {
                    const limitVal = !isFeature ? plan.limits[key] : null;
                    const featureVal = isFeature ? plan.features[key] : null;
                    const has = isFeature ? featureVal === true : limitVal !== 0;

                    return (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        {has
                          ? <Check size={13} className="text-emerald-500 shrink-0" />
                          : <X size={13} className="text-zinc-300 shrink-0" />}
                        <span className={has ? 'text-zinc-700' : 'text-zinc-400'}>
                          {label}
                          {!isFeature && limitVal !== null && limitVal !== undefined && (
                            <span className="text-zinc-400 text-xs ml-1">
                              {limitVal === null ? '' : `(${limitVal}x/bln)`}
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <a href={REGISTER_URL} data-event={`pricing_cta_${planId}`}
                  className={`w-full text-center py-3 rounded-xl font-bold text-sm transition-all ${
                    isPro
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                  }`}>
                  {planId === 'starter' ? 'Mulai Gratis' : `Pilih ${plan.name}`}
                </a>
              </div>
            );
          })}
        </div>

        {/* FAQ mini */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {[
            ['💳', 'Cara upgrade?', 'Transfer manual → upload bukti → aktif dalam 1×24 jam'],
            ['↩', 'Ada refund?', 'Hubungi kami dalam 7 hari jika ada masalah'],
            ['⚡', 'Lama aktivasi?', 'Maksimal 1×24 jam hari kerja setelah transfer'],
          ].map(([emoji, q, a]) => (
            <div key={q} className="bg-white rounded-xl p-4 border border-zinc-200">
              <p className="text-xl mb-1">{emoji}</p>
              <p className="text-sm font-bold text-zinc-800 mb-1">{q}</p>
              <p className="text-xs text-zinc-500">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 mb-3">
            Kata Mereka yang Sudah Pakai naikcetak
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ quote, name, title, company, city, initial }) => (
            <div key={name} className="bg-white rounded-2xl p-6 border border-zinc-200 flex flex-col">
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={13} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-zinc-700 leading-relaxed flex-1 mb-4">"{quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {initial}
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-800">{name}</p>
                  <p className="text-xs text-zinc-400">{title} · {company} · {city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [open, setOpen] = useState(null);

  return (
    <section id="faq" className="py-20 bg-zinc-50 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-zinc-900 mb-3">Pertanyaan Umum</h2>
        </div>
        <div className="space-y-3">
          {FAQ_ITEMS.map(({ q, a }, i) => (
            <div key={i} className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left">
                <span className="text-sm font-semibold text-zinc-800 pr-4">{q}</span>
                <ChevronDown size={16} className={`text-zinc-400 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm text-zinc-500 leading-relaxed">{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 bg-blue-600 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
          Mulai Hemat Waktu Hitung Cetak Hari Ini
        </h2>
        <p className="text-blue-200 mb-8 text-lg">
          Daftar gratis, tidak perlu kartu kredit. Setup dalam 2 menit.
        </p>
        <a href={REGISTER_URL} data-event="cta_final"
          className="inline-flex items-center gap-2 bg-white hover:bg-blue-50 text-blue-600 font-bold px-8 py-4 rounded-xl text-base transition-all hover:shadow-lg">
          Daftar Gratis Sekarang <ArrowRight size={16} />
        </a>
        <p className="mt-5 text-xs text-blue-300">
          Sudah 200+ percetakan bergabung · Starter gratis selamanya
        </p>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="bg-zinc-900 text-zinc-400 px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center">
                <Printer size={14} className="text-zinc-900" />
              </div>
              <span className="font-bold text-white text-base">naikcetak</span>
            </div>
            <p className="text-xs leading-relaxed">
              Platform manajemen percetakan modern untuk Indonesia.
            </p>
          </div>
          {[
            { title: 'Produk', links: ['Fitur','Harga','Changelog'] },
            { title: 'Support', links: ['FAQ','WhatsApp Admin','Email Support'] },
            { title: 'Legal', links: ['Syarat & Ketentuan','Kebijakan Privasi'] },
          ].map(({ title, links }) => (
            <div key={title}>
              <p className="text-xs font-bold text-white uppercase tracking-widest mb-3">{title}</p>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-xs hover:text-white transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-zinc-800 pt-6 flex flex-col sm:flex-row justify-between gap-2 text-xs">
          <span>© 2025 naikcetak · Made with ❤ in Indonesia</span>
          <span>
            <a href={APP_URL} className="text-blue-400 hover:text-blue-300 transition-colors font-semibold">
              Masuk ke Aplikasi →
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  // Update document title for landing page
  useEffect(() => {
    document.title = 'naikcetak — Software Percetakan #1 Indonesia';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Hitung biaya cetak 10x lebih cepat. Kalkulator potong kertas, HPP, invoice, quotation, tracking order, dan AI assistant untuk percetakan Indonesia.');
  }, []);

  return (
    <div className="bg-white font-sans overflow-x-hidden">
      <Navbar />
      <main>
        <HeroSection />
        <SocialProofBar />
        <PainSection />
        <FeaturesSection />
        <ScreenshotSection />
        <PricingSection />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <FooterSection />
    </div>
  );
}
