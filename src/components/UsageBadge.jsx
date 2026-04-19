import { usePlanContext } from '../contexts/PlanContext';
import { PLANS } from '../lib/plans';

/**
 * Tampilkan sisa limit penggunaan (hanya untuk Starter plan).
 * feature: 'potong_kertas' | 'hitung_cetakan'
 */
export default function UsageBadge({ feature }) {
  const { plan, remainingUsage } = usePlanContext();

  if (plan !== 'starter') return null;

  const limit = feature === 'potong_kertas'
    ? PLANS.starter.limits.potongKertasPerMonth
    : PLANS.starter.limits.hitungCetakanPerMonth;

  if (limit === null) return null;

  const remaining = remainingUsage(feature);
  const isEmpty = remaining === 0;
  const isLow   = !isEmpty && remaining <= 2;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
      isEmpty ? 'bg-red-50 text-red-600 border border-red-200' :
      isLow   ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                'bg-emerald-50 text-emerald-600 border border-emerald-200'
    }`}>
      <span className="text-[8px]">{isEmpty ? '⚠' : '◉'}</span>
      {isEmpty ? 'Limit habis' : `Sisa ${remaining}/${limit} bulan ini`}
    </span>
  );
}
