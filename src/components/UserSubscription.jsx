import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard, Calendar, Clock, CheckCircle2, BarChart2,
  RefreshCw, Zap, ArrowRight, History, ChevronRight,
} from 'lucide-react';
import { usePlanContext } from '../contexts/PlanContext';
import { PLANS } from '../lib/plans';
import { getUserSubscriptionHistory } from '../lib/supabase';

function daysUntil(date) {
  if (!date) return null;
  return Math.ceil((new Date(date) - Date.now()) / 86_400_000);
}

function fmt(date, opts = {}) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', ...opts });
}

function UsageBar({ label, used, limit }) {
  const pct = limit === null ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const color = pct >= 90 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-400' : 'bg-blue-500';
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-zinc-600">{label}</span>
        <span className="font-semibold text-zinc-800">
          {used} / {limit === null ? '∞' : limit}
        </span>
      </div>
      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: limit === null ? '0%' : `${pct}%` }}
        />
      </div>
    </div>
  );
}

const ACTION_LABELS = {
  upgrade: 'Upgrade',
  renewal: 'Perpanjang',
  downgrade: 'Downgrade',
  admin_direct: 'Admin — Langsung',
  expired: 'Berakhir Otomatis',
  grace_started: 'Masa Tenggang',
};

export default function UserSubscription({ user, onUpgradeClick }) {
  const { planData, plan } = usePlanContext();
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const planCfg = PLANS[plan] ?? PLANS.starter;

  useEffect(() => {
    if (!user) return;
    setLoadingHistory(true);
    getUserSubscriptionHistory(user.id)
      .then(rows => setHistory(rows ?? []))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false));
  }, [user]);

  const {
    planStatus, planExpiresAt, gracePeriodEndsAt,
    planStartedAt, billingCycle, renewalCount,
    usagePotongKertas, usageHitungCetakan,
  } = planData;

  const daysLeft = daysUntil(planExpiresAt);
  const graceDaysLeft = daysUntil(gracePeriodEndsAt);

  const statusMeta = {
    active:       { label: 'Aktif',          bg: 'bg-emerald-100', text: 'text-emerald-700' },
    grace_period: { label: 'Masa Tenggang',  bg: 'bg-amber-100',   text: 'text-amber-700'  },
    expired:      { label: 'Berakhir',       bg: 'bg-red-100',     text: 'text-red-700'    },
    cancelled:    { label: 'Dibatalkan',     bg: 'bg-zinc-100',    text: 'text-zinc-500'   },
  };
  const sm = statusMeta[planStatus] ?? statusMeta.active;

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Plan Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border p-5"
        style={{ borderColor: planCfg.color + '40', background: planCfg.color + '08' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} style={{ color: planCfg.color }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: planCfg.color }}>
                Paket {planCfg.name}
              </span>
            </div>
            <p className="text-zinc-500 text-sm">{planCfg.tagline}</p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${sm.bg} ${sm.text}`}>
            {sm.label}
          </span>
        </div>

        {plan !== 'starter' && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <InfoTile icon={Calendar} label="Mulai" value={fmt(planStartedAt)} />
            <InfoTile
              icon={Clock}
              label={planStatus === 'grace_period' ? 'Tenggang berakhir' : 'Berakhir'}
              value={planStatus === 'grace_period' ? fmt(gracePeriodEndsAt) : fmt(planExpiresAt)}
              highlight={
                planStatus === 'grace_period'
                  ? 'text-amber-600'
                  : (daysLeft !== null && daysLeft <= 7 ? 'text-red-600' : '')
              }
            />
            <InfoTile icon={RefreshCw} label="Siklus" value={billingCycle === 'yearly' ? 'Tahunan' : 'Bulanan'} />
            <InfoTile icon={History} label="Diperpanjang" value={`${renewalCount}×`} />
          </div>
        )}

        {plan !== 'starter' && daysLeft !== null && planStatus === 'active' && daysLeft <= 30 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-zinc-500">Sisa masa aktif</span>
              <span className={`font-semibold ${daysLeft <= 7 ? 'text-red-600' : 'text-zinc-700'}`}>
                {daysLeft} hari
              </span>
            </div>
            <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${daysLeft <= 7 ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.min(100, (daysLeft / 30) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {planStatus === 'grace_period' && graceDaysLeft !== null && (
          <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            Masa tenggang: <span className="font-bold">{graceDaysLeft} hari lagi</span> sebelum akun diturunkan ke Starter.
          </div>
        )}

        {(plan === 'starter' || planStatus !== 'active') && (
          <button
            onClick={onUpgradeClick}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
            style={{ background: '#2563EB' }}
          >
            {plan === 'starter' ? 'Upgrade ke Pro' : 'Perpanjang Langganan'}
            <ArrowRight size={14} />
          </button>
        )}
      </motion.div>

      {/* Usage Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-zinc-200 p-5"
      >
        <h3 className="text-sm font-bold text-zinc-800 mb-4 flex items-center gap-2">
          <BarChart2 size={14} className="text-blue-500" /> Penggunaan Bulan Ini
        </h3>
        <div className="space-y-4">
          <UsageBar
            label="Potong Kertas"
            used={usagePotongKertas}
            limit={PLANS[plan]?.limits.potongKertasPerMonth ?? null}
          />
          <UsageBar
            label="Hitung Cetakan"
            used={usageHitungCetakan}
            limit={PLANS[plan]?.limits.hitungCetakanPerMonth ?? null}
          />
        </div>
        {plan !== 'starter' && (
          <p className="text-[11px] text-zinc-400 mt-3">Reset penggunaan setiap bulan secara otomatis.</p>
        )}
      </motion.div>

      {/* Subscription History */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-zinc-200 p-5"
      >
        <h3 className="text-sm font-bold text-zinc-800 mb-4 flex items-center gap-2">
          <History size={14} className="text-blue-500" /> Riwayat Langganan
        </h3>
        {loadingHistory ? (
          <div className="text-xs text-zinc-400 py-4 text-center">Memuat...</div>
        ) : history.length === 0 ? (
          <div className="text-xs text-zinc-400 py-4 text-center">Belum ada riwayat.</div>
        ) : (
          <div className="space-y-3">
            {history.slice(0, 5).map((h, i) => {
              const planCfgH = PLANS[h.plan_to] ?? PLANS.starter;
              return (
                <div key={h.id ?? i} className="flex items-start gap-3">
                  <div
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: planCfgH.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-800">
                      {ACTION_LABELS[h.action] ?? h.action} — {planCfgH.name}
                    </p>
                    <p className="text-[11px] text-zinc-400">{fmt(h.created_at)}</p>
                  </div>
                  {h.amount_paid > 0 && (
                    <span className="text-[11px] font-semibold text-emerald-600 shrink-0">
                      Rp{h.amount_paid.toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Features checklist */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-zinc-200 p-5"
      >
        <h3 className="text-sm font-bold text-zinc-800 mb-4 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-blue-500" /> Fitur Paket {planCfg.name}
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {Object.entries(planCfg.features).map(([key, val]) => {
            const labels = {
              kalkulatorHPP: 'Kalkulator HPP', invoice: 'Invoice', quotation: 'Quotation',
              trackingOrder: 'Tracking Order', exportPDF: 'Export PDF', groqAI: 'AI Assistant',
              whatsappIntegration: 'WA Integration', multiOutlet: 'Multi Outlet',
              customBranding: 'Custom Branding', apiAccess: 'API Access',
              prioritySupport: 'Priority Support', onboardingCall: 'Onboarding Call',
              potongKertas: 'Potong Kertas', hitungCetakan: 'Hitung Cetakan',
              earlyAccess: 'Early Access (Tahunan)',
            };
            if (!labels[key]) return null;
            return (
              <div key={key} className={`flex items-center gap-2 text-xs ${val ? 'text-zinc-700' : 'text-zinc-300'}`}>
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${
                  val ? 'bg-blue-100 text-blue-600' : 'bg-zinc-100'
                }`}>
                  {val && <ChevronRight size={8} />}
                </div>
                {labels[key]}
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value, highlight = '' }) {
  return (
    <div className="bg-white/70 rounded-xl px-3 py-2.5 border border-white">
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon size={11} className="text-zinc-400" />
        <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-sm font-semibold ${highlight || 'text-zinc-800'}`}>{value}</p>
    </div>
  );
}
