import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, X, ChevronDown, Star, Zap, Building2,
  Calculator, Scissors, Printer, FileText, Package,
  Brain, Mail, Database, ArrowRight, Menu, Shield,
  Clock, Layers,
} from 'lucide-react';
import { PLANS } from '../lib/plans';

const APP_URL      = 'https://app.naikcetak.com';
const LOGIN_URL    = `${APP_URL}/#/login`;
const REGISTER_URL = `${APP_URL}/#/login?tab=daftar`;

// ── Data ──────────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: Scissors,   color: '#2563EB', label: 'Paper Cutting Optimizer',      badge: 'Baru',
    desc: 'Visualize sheet layouts in real-time, calculate efficiency, and optimize automatically with brute-force algorithms.' },
  { icon: Printer,    color: '#7C3AED', label: 'Printing Cost Calculator',      badge: 'Baru',
    desc: 'Complete cost calculation: paper + printing costs + finishing + glue + profit in one comprehensive tool.' },
  { icon: Calculator, color: '#059669', label: 'Production Cost Calculator',      badge: null,
    desc: 'Calculate production costs with bulk simulations and recommended margins.' },
  { icon: FileText,   color: '#D97706', label: 'Invoice & Quotation Generator', badge: null,
    desc: 'Professional templates, automatic calculations, send via WhatsApp instantly.' },
  { icon: Package,    color: '#DC2626', label: 'Order Tracking System',      badge: null,
    desc: 'Public links for clients to monitor production status without logging in.' },
  { icon: Brain,      color: '#0891B2', label: 'AI Assistant',        badge: 'Pro',
    desc: 'Analyze client briefs, suggest technical specs, and business audits powered by Groq AI.' },
  { icon: Mail,       color: '#7C3AED', label: 'Email & Proposal Generator',    badge: null,
    desc: 'Generate professional proposal emails with appropriate tone and format.' },
  { icon: Database,   color: '#374151', label: 'Master Data Management',         badge: null,
    desc: 'Integrated database for paper, finishing, and machines. Update once, apply everywhere.' },
];

const PAIN_POINTS = [
  { bad: 'Manual paper cutting calculation takes 30 minutes, often wrong grain direction',
    good: 'Done in 5 seconds with grid visualization + automatic optimization' },
  { bad: 'Wrong cost calculation = selling at a loss, don\'t know which jobs are profitable',
    good: 'Automatic calculation of all cost components, know margin immediately' },
  { bad: 'Invoices still in Word/Excel, sent manually one by one',
    good: 'Generate professional invoices 1 click, send via WhatsApp directly from app' },
];

const SCREENSHOTS = [
  { label: 'Dashboard',       color: '#F0F9FF', accent: '#2563EB' },
  { label: 'Paper Cutting Optimizer',   color: '#F0FDF4', accent: '#059669' },
  { label: 'Printing Cost Calculator',  color: '#FEF9C3', accent: '#D97706' },
  { label: 'Invoice',         color: '#FDF4FF', accent: '#7C3AED' },
];

const TESTIMONIALS = [
  { quote: 'Used to take 20 minutes to calculate paper cutting, now 10 seconds. Efficiency skyrocketed and no more losses from miscalculations.',
    name: 'Budi Santoso', title: 'Owner', company: 'PercetakanMaju', city: 'Bandung', initial: 'B' },
  { quote: 'Naikcetak invoices look much more professional than before. Clients trust more and payments are more on time.',
    name: 'Sari Dewi', title: 'Production Manager', company: 'PrintHouse Solo', city: 'Solo', initial: 'S' },
  { quote: 'Order tracking feature makes clients more relaxed because they can monitor themselves. Complaints reduced by 80%.',
    name: 'Andi Pratama', title: 'Director', company: 'MegaPrint', city: 'Surabaya', initial: 'A' },
];

const PLAN_FEATURES_LIST = [
  { key: 'potongKertasPerMonth',  label: 'Kalkulator Potong Kertas', isFeature: false },
  { key: 'hitungCetakanPerMonth', label: 'Kalkulator Biaya Cetak',   isFeature: false },
  { key: 'kalkulatorHPP',          label: 'Production Cost Calculator',     isFeature: true },
  { key: 'invoice',                label: 'Invoice & Quotation Generator', isFeature: true },
  { key: 'trackingOrder',          label: 'Order Tracking System',      isFeature: true },
  { key: 'exportPDF',              label: 'Export PDF',           isFeature: true },
  { key: 'groqAI',                 label: 'AI Assistant',         isFeature: true },
  { key: 'whatsappIntegration',    label: 'WhatsApp Integration',   isFeature: true },
  { key: 'multiOutlet',            label: 'Multi Outlet',         isFeature: true },
  { key: 'prioritySupport',        label: 'Priority Support',     isFeature: true },
];

const FAQ_ITEMS = [
  { q: 'Is naikcetak really free?',
    a: 'Yes! The Starter package is free forever — no credit card required. You can use Paper Cutting Optimizer (10x/month) and Printing Cost Calculator (5x/month) at no cost.' },
  { q: 'How to upgrade to Pro?',
    a: 'Click "Upgrade" in the app → select package → transfer to our account → upload proof of transfer. Admin will verify and activate your account within 24 hours on business days.' },
  { q: 'How long until activation after transfer?',
    a: 'Maximum 24 hours on business days. If you send proof of transfer to admin WhatsApp, usually processed within 1-2 hours.' },
  { q: 'Is my data secure?',
    a: 'Data is stored in Supabase with encryption and Row Level Security. Only you can access your own account data.' },
  { q: 'Can it be used on mobile?',
    a: 'Yes, naikcetak is fully responsive for all devices — desktop, tablet, or smartphone.' },
  { q: 'Is there a Pro trial?',
    a: 'The Starter package can be tried free forever. If you need Pro features, upgrade anytime. No confusing limited-time trials.' },
  { q: 'What if I\'m not satisfied?',
    a: 'Contact us within 7 days after activation. We will consider a refund if there is a valid reason.' },
  { q: 'What is Groq AI in naikcetak?',
    a: 'Groq AI is a super-fast AI assistant that helps analyze client briefs, suggest technical specs, and business audits. Pro package: use your own Groq API key for free.' },
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
          Kalkulator Potong Kertas, Kalkulator Biaya Cetak, HPP otomatis, invoice, quotation,
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
                    {[['#DBEAFE','Potong Kertas','↗ 24 job'],['#D1FAE5','Biaya Cetak','Rp 2.4jt'],['#FEF9C3','Invoice Aktif','7 pending']].map(([bg, label, val]) => (
                      <div key={label} className="rounded-lg p-3" style={{ background: bg }}>
                        <p className="text-[8px] text-zinc-500 font-semibold">{label}</p>
                        <p className="text-[11px] font-black text-zinc-800 mt-1">{val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-[9px] font-bold text-zinc-600 mb-2">Riwayat Produksi</p>
                    {[['Kalk. Potong','Box Kue 10×15','34 pcs/lbr','#DBEAFE'],['Kalk. Biaya Cetak','Brosur A5','Rp 1.250/pcs','#D1FAE5']].map(([type, name, val, bg]) => (
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

  const planOrder = ['starter', 'pro'];
  const planIcons = { starter: null, pro: Zap };

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
            {[['monthly','Bulanan'],['yearly','Tahunan — Hemat 47%']].map(([val, label]) => (
              <button key={val} onClick={() => setCycle(val)}
                className={`text-sm font-semibold px-5 py-2 rounded-lg transition-all ${
                  cycle === val ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {planOrder.map((planId) => {
            const plan  = PLANS[planId];
            const displayPrice = planId === 'pro' && cycle === 'yearly'
              ? plan.prices.yearlyPerMonth
              : plan.prices.monthly;
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
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-black text-zinc-900">
                      {displayPrice === 0 ? 'Gratis' : 'Rp\u00A0' + displayPrice.toLocaleString('id-ID')}
                    </span>
                    {displayPrice > 0 && (
                      <span className="text-zinc-400 text-sm mb-0.5">/bln</span>
                    )}
                  </div>
                  {isPro && cycle === 'yearly' && (
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Rp {plan.prices.yearly.toLocaleString('id-ID')}/tahun · hemat 47%
                    </p>
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
            { title: 'Produk', links: [
              { label: 'Fitur', href: '#features' },
              { label: 'Harga', href: '#pricing' },
            ]},
            { title: 'Support', links: [
              { label: 'WhatsApp Admin', href: 'https://wa.me/6282261039601' },
              { label: 'Email Support',  href: 'mailto:admin@naikcetak.com' },
            ]},
            { title: 'Legal', links: [
              { label: 'Syarat & Ketentuan', href: '#' },
              { label: 'Kebijakan Privasi',  href: '#' },
            ]},
          ].map(({ title, links }) => (
            <div key={title}>
              <p className="text-xs font-bold text-white uppercase tracking-widest mb-3">{title}</p>
              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="text-xs hover:text-white transition-colors">{label}</a>
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
