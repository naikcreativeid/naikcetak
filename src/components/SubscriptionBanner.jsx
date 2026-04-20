import { useMemo } from 'react';
import { AlertTriangle, Clock, XCircle, ArrowRight } from 'lucide-react';
import { usePlanContext } from '../contexts/PlanContext';

function daysUntil(date) {
  if (!date) return null;
  return Math.ceil((new Date(date) - Date.now()) / 86_400_000);
}

export default function SubscriptionBanner({ onManageClick }) {
  const { planData, plan, isAdmin } = usePlanContext();
  if (!planData) return null;

  const { planStatus, planExpiresAt, gracePeriodEndsAt } = planData;

  const info = useMemo(() => {
    if (isAdmin || plan === 'starter') return null;

    // Inside grace period
    if (planStatus === 'grace_period' && gracePeriodEndsAt) {
      const d = daysUntil(gracePeriodEndsAt);
      return {
        level: 'critical',
        icon: XCircle,
        title: 'Masa tenggang aktif',
        body: d > 0
          ? `Langganan Anda sudah berakhir. Anda punya ${d} hari sebelum akun diturunkan ke Starter.`
          : 'Masa tenggang Anda habis hari ini. Perpanjang sekarang!',
        cta: 'Perpanjang Sekarang',
      };
    }

    // Expired but not yet grace
    if (planStatus === 'expired') {
      return {
        level: 'critical',
        icon: XCircle,
        title: 'Langganan telah berakhir',
        body: 'Akses fitur Pro/Business Anda sudah tidak aktif. Perpanjang untuk melanjutkan.',
        cta: 'Perpanjang Sekarang',
      };
    }

    // Expiring soon (within 7 days)
    if (planStatus === 'active' && planExpiresAt) {
      const d = daysUntil(planExpiresAt);
      if (d !== null && d <= 7 && d >= 0) {
        return {
          level: 'warning',
          icon: Clock,
          title: `Langganan berakhir ${d === 0 ? 'hari ini' : `dalam ${d} hari`}`,
          body: `Perpanjang sebelum ${new Date(planExpiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} agar tidak terputus.`,
          cta: 'Perpanjang',
        };
      }
    }

    return null;
  }, [plan, planStatus, planExpiresAt, gracePeriodEndsAt, isAdmin]);

  if (!info) return null;

  const { icon: Icon, title, body, cta, level } = info;
  const isCritical = level === 'critical';

  return (
    <div className={`mb-5 flex items-start gap-3 rounded-xl px-4 py-3 border ${
      isCritical
        ? 'bg-red-50 border-red-200 text-red-900'
        : 'bg-amber-50 border-amber-200 text-amber-900'
    }`}>
      <Icon size={16} className={`mt-0.5 shrink-0 ${isCritical ? 'text-red-500' : 'text-amber-500'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs mt-0.5 opacity-80">{body}</p>
      </div>
      {onManageClick && (
        <button
          onClick={onManageClick}
          className={`shrink-0 flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
            isCritical
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-amber-500 text-white hover:bg-amber-600'
          }`}
        >
          {cta} <ArrowRight size={11} />
        </button>
      )}
    </div>
  );
}
