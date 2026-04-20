import { Lock } from 'lucide-react';
import { usePlanContext } from '../contexts/PlanContext';

/**
 * Wrapper untuk fitur berbayar.
 * Props:
 *   feature        — kunci fitur (dari PLANS.features), cek akses plan
 *   usageFeature   — 'potong_kertas' | 'hitung_cetakan', cek limit bulanan
 *   children       — konten yang dilindungi
 *   fallback       — tampilan alternatif (opsional)
 *   showBlur       — tampilkan blur + CTA (default true)
 */
export default function FeatureGate({
  feature,
  usageFeature,
  children,
  fallback,
  showBlur = true,
}) {
  const { can, withinLimit, openUpgrade, isAdmin } = usePlanContext();

  const hasAccess    = feature      ? can(feature)              : true;
  const hasUsageLeft = usageFeature ? withinLimit(usageFeature) : true;
  const blocked      = !isAdmin && (!hasAccess || !hasUsageLeft);

  if (!blocked) return <>{children}</>;

  if (fallback) return <>{fallback}</>;
  if (!showBlur) return null;

  const isLimitReached = hasAccess && !hasUsageLeft;

  return (
    <div className="relative">
      {/* Blur overlay */}
      <div
        className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl z-10 flex flex-col items-center justify-center gap-3 border border-dashed border-zinc-300 cursor-pointer"
        onClick={openUpgrade}
      >
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
          <Lock size={16} className="text-blue-600" />
        </div>
        <div className="text-center px-4">
          <p className="text-sm font-semibold text-zinc-800">
            {isLimitReached ? 'Limit bulanan tercapai' : 'Fitur Pro'}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {isLimitReached
              ? 'Upgrade ke Pro untuk penggunaan tidak terbatas'
              : 'Upgrade untuk mengakses fitur ini'}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); openUpgrade(); }}
          className="px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Lihat Paket Upgrade →
        </button>
      </div>

      {/* Konten asli — di-blur di belakang */}
      <div className="opacity-25 pointer-events-none select-none">
        {children}
      </div>
    </div>
  );
}
