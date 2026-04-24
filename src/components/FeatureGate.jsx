import { Lock } from 'lucide-react';
import { usePlanContext } from '../contexts/PlanContext';

const FEATURE_DESCRIPTIONS = {
  kalkulatorHPP: {
    emoji: '🧮',
    headline: 'Kalkulator HPP Profesional',
    benefits: ['Hitung biaya cetak otomatis', 'Harga jual presisi, margin aman', 'Tidak perlu hitung manual lagi'],
    impact: 'Hemat 2+ jam perhitungan per hari',
  },
  invoice: {
    emoji: '🧾',
    headline: 'Invoice & Quotation Digital',
    benefits: ['Buat invoice profesional dalam 1 menit', 'Export PDF siap kirim ke klien', 'Branding percetakan Anda'],
    impact: 'Kesan profesional, klien lebih percaya',
  },
  quotation: {
    emoji: '📋',
    headline: 'Quotation Profesional',
    benefits: ['Penawaran harga rapi & terstruktur', 'PDF siap kirim ke klien', 'Konversi lebih banyak order'],
    impact: 'Tingkatkan closing rate penawaran Anda',
  },
  trackingOrder: {
    emoji: '📦',
    headline: 'Tracking Order Publik',
    benefits: ['Klien pantau status order sendiri', 'Kurangi pertanyaan "order saya gimana?"', 'Link tracking unik per order'],
    impact: 'Hemat waktu CS, klien lebih puas',
  },
  publicStore: {
    emoji: 'ðŸª',
    headline: 'Toko Online Percetakan',
    benefits: ['Halaman publik dengan URL unik toko Anda', 'Klien request order langsung tanpa chat dulu', 'Order masuk rapi ke dashboard'],
    impact: 'Buka kanal order baru 24/7 untuk percetakan Anda',
  },
  laporanKeuangan: {
    emoji: '📊',
    headline: 'Laporan Keuangan Otomatis',
    benefits: ['Omzet, HPP, laba kotor dalam 1 halaman', 'Grafik tren bulanan otomatis', 'Status invoice lunas/pending/overdue'],
    impact: 'Tahu kondisi bisnis tanpa buka Excel',
  },
  exportPDF: {
    emoji: '📄',
    headline: 'Export PDF',
    benefits: ['Cetak & kirim dokumen instan', 'Format rapi & profesional', 'Simpan arsip digital mudah'],
    impact: 'Dokumen siap kirim kapan saja',
  },
  groqAI: {
    emoji: '🤖',
    headline: 'AI Assistant',
    benefits: ['Analisis brief klien otomatis', 'Draft email & penawaran cepat', 'Rekomendasi harga cerdas'],
    impact: 'Respons klien 3x lebih cepat',
  },
  whatsappIntegration: {
    emoji: '💬',
    headline: 'WhatsApp Integration',
    benefits: ['Kirim invoice langsung ke WA klien', 'Notifikasi status order otomatis', 'Satu klik dari dashboard'],
    impact: 'Komunikasi klien lebih lancar',
  },
};

/**
 * Wrapper untuk fitur berbayar.
 * Props:
 *   feature        — kunci fitur (dari PLANS.features), cek akses plan
 *   featureKey     — alias untuk feature (backward compat)
 *   usageFeature   — 'potong_kertas' | 'hitung_cetakan', cek limit bulanan
 *   children       — konten yang dilindungi
 *   fallback       — tampilan alternatif (opsional)
 *   showBlur       — tampilkan blur + CTA (default true)
 */
export default function FeatureGate({
  feature,
  featureKey,
  usageFeature,
  children,
  fallback,
  showBlur = true,
}) {
  const { can, withinLimit, openUpgrade, isAdmin } = usePlanContext();

  const resolvedFeature = feature ?? featureKey;
  const hasAccess    = resolvedFeature ? can(resolvedFeature)    : true;
  const hasUsageLeft = usageFeature    ? withinLimit(usageFeature) : true;
  const blocked      = !isAdmin && (!hasAccess || !hasUsageLeft);

  if (!blocked) return <>{children}</>;

  if (fallback) return <>{fallback}</>;
  if (!showBlur) return null;

  const isLimitReached = hasAccess && !hasUsageLeft;
  const desc = FEATURE_DESCRIPTIONS[resolvedFeature];

  return (
    <div className="relative">
      <div
        className="absolute inset-0 bg-white/85 backdrop-blur-sm rounded-xl z-10 flex flex-col items-center justify-center gap-3 border border-dashed border-blue-200 cursor-pointer px-5"
        onClick={openUpgrade}
      >
        {desc ? (
          <>
            <div className="text-3xl">{desc.emoji}</div>
            <div className="text-center">
              <p className="text-sm font-bold text-zinc-900">{desc.headline}</p>
              <ul className="mt-2 space-y-1">
                {desc.benefits.map((b) => (
                  <li key={b} className="text-xs text-zinc-600 flex items-center gap-1.5 justify-center">
                    <span className="text-emerald-500 font-bold">✓</span> {b}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] font-semibold text-blue-600 bg-blue-50 rounded-full px-3 py-1 inline-block">
                {desc.impact}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Lock size={16} className="text-blue-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-800">
                {isLimitReached ? 'Limit bulanan tercapai' : 'Fitur Pro'}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {isLimitReached
                  ? 'Upgrade ke Pro untuk penggunaan tidak terbatas'
                  : 'Upgrade untuk mengakses fitur ini'}
              </p>
            </div>
          </>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); openUpgrade(); }}
          className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          ⚡ Upgrade ke Pro →
        </button>
      </div>

      <div className="opacity-20 pointer-events-none select-none">
        {children}
      </div>
    </div>
  );
}
