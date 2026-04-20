import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Zap, TrendingUp, Clock, AlertTriangle, RefreshCw,
  CheckCircle2, X, ChevronDown, Search, MessageCircle, Phone,
  History, ArrowDownRight, Loader2, Calendar, CreditCard,
  MoreHorizontal, ShieldAlert,
} from 'lucide-react';
import {
  adminGetAllUsers, adminActivatePlan, adminDowngradeUser,
  adminGetUserHistory, getSubscriptionStats,
} from '../lib/supabase';
import { PLANS } from '../lib/plans';

// ── Helpers ────────────────────────────────────────────────────────────────────

function daysUntil(date) {
  if (!date) return null;
  return Math.ceil((new Date(date) - Date.now()) / 86_400_000);
}

function fmt(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

const WA_NUMBER = import.meta.env.VITE_ADMIN_WA ?? '6282261039601';

function waReminder7(user) {
  const msg = `Halo ${user.full_name ?? user.email}! 👋\nLangganan naikcetak Anda (Paket ${PLANS[user.plan]?.name ?? user.plan}) akan berakhir dalam *7 hari* (${fmt(user.plan_expires_at)}).\nSilakan perpanjang agar tidak terputus!\n\nInfo perpanjangan: wa.me/${WA_NUMBER}\n\nTerima kasih 🙏 — naikcetak.com`;
  return `https://wa.me/${user.phone ?? ''}?text=${encodeURIComponent(msg)}`;
}

function waReminder3(user) {
  const msg = `⚠️ Halo ${user.full_name ?? user.email}!\nLangganan naikcetak Anda *berakhir dalam 3 hari* (${fmt(user.plan_expires_at)}).\nJangan sampai fitur Anda terblokir — perpanjang sekarang!\n\nHubungi: wa.me/${WA_NUMBER}`;
  return `https://wa.me/${user.phone ?? ''}?text=${encodeURIComponent(msg)}`;
}

function waGrace(user) {
  const msg = `🔴 Halo ${user.full_name ?? user.email},\nLangganan naikcetak Anda sudah berakhir dan saat ini berada di *masa tenggang*.\nAkun akan diturunkan ke Starter pada ${fmt(user.grace_period_ends_at)} jika tidak diperpanjang.\n\nPerpanjang sekarang: wa.me/${WA_NUMBER}`;
  return `https://wa.me/${user.phone ?? ''}?text=${encodeURIComponent(msg)}`;
}

// ── Stat Card ──────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color = 'blue', sub }) {
  const colors = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   icon: 'text-blue-500'   },
    emerald:{ bg: 'bg-emerald-50',text: 'text-emerald-700',icon: 'text-emerald-500' },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-700',  icon: 'text-amber-500'  },
    red:    { bg: 'bg-red-50',    text: 'text-red-700',    icon: 'text-red-500'    },
    zinc:   { bg: 'bg-zinc-50',   text: 'text-zinc-700',   icon: 'text-zinc-400'   },
  };
  const c = colors[color] ?? colors.blue;
  return (
    <div className={`rounded-xl p-4 border border-transparent ${c.bg}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{label}</span>
        <Icon size={14} className={c.icon} />
      </div>
      <p className={`text-2xl font-bold ${c.text}`}>{value ?? '—'}</p>
      {sub && <p className="text-[11px] text-zinc-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Activate Modal ─────────────────────────────────────────────────────────────

function ActivateModal({ user, onClose, onSuccess }) {
  const [plan, setPlan] = useState(user?.plan === 'starter' ? 'pro' : (user?.plan ?? 'pro'));
  const [billing, setBilling] = useState('monthly');
  const [months, setMonths] = useState(1);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('transfer');
  const [notes, setNotes] = useState('');
  const [isRenewal, setIsRenewal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await adminActivatePlan(user.id, plan, billing, {
        amountPaid: parseFloat(amount) || 0,
        paymentMethod: method,
        isRenewal,
        notes,
      });
      onSuccess?.();
      onClose();
    } catch (e) {
      setError(e.message ?? 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <h3 className="text-sm font-bold text-zinc-900">Aktivasi Langganan</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700"><X size={16} /></button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-xs text-zinc-500 mb-1 font-medium">User</p>
            <p className="text-sm font-semibold text-zinc-800">{user?.full_name ?? user?.email}</p>
            <p className="text-xs text-zinc-400">{user?.email}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-600 block mb-1">Paket</label>
              <select value={plan} onChange={e => setPlan(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="pro">Pro</option>
                <option value="business">Business</option>
                <option value="starter">Starter (downgrade)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 block mb-1">Siklus</label>
              <select value={billing} onChange={e => setBilling(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="monthly">Bulanan</option>
                <option value="yearly">Tahunan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-600 block mb-1">Jumlah Bayar (Rp)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="149000"
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 block mb-1">Metode Bayar</label>
              <select value={method} onChange={e => setMethod(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="transfer">Transfer Bank</option>
                <option value="qris">QRIS</option>
                <option value="cash">Cash</option>
                <option value="free">Gratis/Promo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-600 block mb-1">Catatan (opsional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              placeholder="Bukti transfer, promo code, dsb."
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isRenewal} onChange={e => setIsRenewal(e.target.checked)}
              className="rounded" />
            <span className="text-xs text-zinc-600">Ini perpanjangan (extend dari tanggal berakhir saat ini)</span>
          </label>

          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-zinc-100">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-600 hover:bg-zinc-50">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 size={13} className="animate-spin" />}
            Aktivasi
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── History Drawer ─────────────────────────────────────────────────────────────

function HistoryDrawer({ user, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    adminGetUserHistory(user.id)
      .then(rows => setHistory(rows ?? []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [user]);

  const ACTION_LABELS = {
    upgrade: 'Upgrade', renewal: 'Perpanjang', downgrade: 'Downgrade',
    admin_direct: 'Admin Langsung', expired: 'Berakhir', grace_started: 'Masa Tenggang',
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="w-80 bg-white h-full shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Riwayat Langganan</h3>
            <p className="text-xs text-zinc-400">{user?.full_name ?? user?.email}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-zinc-300" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-12">Belum ada riwayat.</p>
          ) : (
            <div className="space-y-3">
              {history.map((h, i) => {
                const pc = PLANS[h.plan] ?? PLANS.starter;
                return (
                  <div key={h.id ?? i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: pc.color }} />
                      {i < history.length - 1 && <div className="w-px flex-1 bg-zinc-100 mt-1" />}
                    </div>
                    <div className="pb-3 min-w-0">
                      <p className="text-xs font-semibold text-zinc-800">
                        {ACTION_LABELS[h.action] ?? h.action} — {pc.name}
                      </p>
                      <p className="text-[11px] text-zinc-400">{fmt(h.created_at)}</p>
                      {h.amount_paid > 0 && (
                        <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                          Rp{h.amount_paid.toLocaleString('id-ID')} · {h.payment_method}
                        </p>
                      )}
                      {h.notes && <p className="text-[11px] text-zinc-400 mt-0.5 italic">{h.notes}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Downgrade Confirm ──────────────────────────────────────────────────────────

function DowngradeModal({ user, onClose, onSuccess }) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await adminDowngradeUser(user.id, notes);
      onSuccess?.();
      onClose();
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-red-700">Turunkan ke Starter</h3>
          <button onClick={onClose}><X size={16} className="text-zinc-400" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-zinc-600">
            User <strong>{user?.full_name ?? user?.email}</strong> akan diturunkan ke paket Starter sekarang.
          </p>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            placeholder="Alasan downgrade (opsional)"
            className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
        </div>
        <div className="flex gap-3 px-5 py-4 border-t border-zinc-100">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-600 hover:bg-zinc-50">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 size={13} className="animate-spin" />} Turunkan
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── WA Reminder Modal ──────────────────────────────────────────────────────────

function WAReminderModal({ user, onClose }) {
  const [copied, setCopied] = useState(null);
  const templates = [
    { label: '7 Hari Sebelum Berakhir', fn: waReminder7 },
    { label: '3 Hari Sebelum Berakhir', fn: waReminder3 },
    { label: 'Masa Tenggang Aktif',     fn: waGrace },
  ];

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <h3 className="text-sm font-bold text-zinc-900">
            Kirim Reminder WA — {user?.full_name ?? user?.email}
          </h3>
          <button onClick={onClose}><X size={16} className="text-zinc-400" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {templates.map(({ label, fn }) => {
            const link = fn(user);
            const msgStart = decodeURIComponent(link.split('text=')[1] ?? '').slice(0, 80);
            return (
              <div key={label} className="border border-zinc-200 rounded-xl p-3">
                <p className="text-xs font-semibold text-zinc-700 mb-1">{label}</p>
                <p className="text-[11px] text-zinc-400 mb-2 line-clamp-2">{msgStart}…</p>
                <div className="flex gap-2">
                  <a href={link} target="_blank" rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600">
                    <MessageCircle size={11} /> Kirim WA
                  </a>
                  <button onClick={() => copyText(decodeURIComponent(link.split('text=')[1] ?? ''))}
                    className="flex-1 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50">
                    {copied ? '✓ Disalin' : 'Salin Pesan'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-5 pb-4">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-zinc-200 text-sm font-semibold text-zinc-600 hover:bg-zinc-50">
            Tutup
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Plan Badge ─────────────────────────────────────────────────────────────────

function PlanBadge({ plan }) {
  const cfg = PLANS[plan] ?? PLANS.starter;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: cfg.color + '18', color: cfg.color }}>
      {cfg.badge}
    </span>
  );
}

function StatusBadge({ status }) {
  const m = {
    active:       { label: 'Aktif',         bg: 'bg-emerald-100', text: 'text-emerald-700' },
    grace_period: { label: 'Masa Tenggang', bg: 'bg-amber-100',   text: 'text-amber-700'  },
    expired:      { label: 'Berakhir',      bg: 'bg-red-100',     text: 'text-red-700'    },
    pending:      { label: 'Menunggu',      bg: 'bg-blue-100',    text: 'text-blue-700'   },
    cancelled:    { label: 'Dibatalkan',    bg: 'bg-zinc-100',    text: 'text-zinc-500'   },
  }[status] ?? { label: status, bg: 'bg-zinc-100', text: 'text-zinc-500' };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${m.bg} ${m.text}`}>
      {m.label}
    </span>
  );
}

// ── Days Progress ──────────────────────────────────────────────────────────────

function DaysBar({ user }) {
  const d = daysUntil(user.plan_expires_at);
  if (d === null || user.plan === 'starter') return <span className="text-xs text-zinc-300">—</span>;
  const max = user.billing_cycle === 'yearly' ? 365 : 30;
  const pct = Math.max(0, Math.min(100, (d / max) * 100));
  const color = d <= 3 ? 'bg-red-500' : d <= 7 ? 'bg-amber-400' : 'bg-blue-500';
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[11px] font-semibold tabular-nums ${d <= 7 ? 'text-red-600' : 'text-zinc-500'}`}>
        {d}h
      </span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

const TABS = [
  { id: 'all',     label: 'Semua' },
  { id: 'pro',     label: 'Pro' },
  { id: 'business',label: 'Business' },
  { id: 'expiring',label: 'Mau Berakhir' },
  { id: 'grace',   label: 'Masa Tenggang' },
  { id: 'starter', label: 'Starter' },
];

export default function AdminSubscriptionDashboard() {
  const [users, setUsers]           = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [tab, setTab]               = useState('all');
  const [activateUser, setActivate] = useState(null);
  const [historyUser, setHistory]   = useState(null);
  const [downgradeUser, setDowngrade] = useState(null);
  const [waUser, setWaUser]         = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, s] = await Promise.all([adminGetAllUsers(), getSubscriptionStats()]);
      setUsers(u ?? []);
      setStats(s);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      (u.email ?? '').toLowerCase().includes(q) ||
      (u.full_name ?? '').toLowerCase().includes(q);

    const d = daysUntil(u.plan_expires_at);

    const matchTab =
      tab === 'all'      ? true :
      tab === 'pro'      ? u.plan === 'pro' :
      tab === 'business' ? u.plan === 'business' :
      tab === 'expiring' ? (u.plan !== 'starter' && d !== null && d >= 0 && d <= 7 && u.plan_status === 'active') :
      tab === 'grace'    ? u.plan_status === 'grace_period' :
      tab === 'starter'  ? u.plan === 'starter' :
      true;

    return matchSearch && matchTab;
  });

  const tabCount = (id) => {
    if (id === 'all') return users.length;
    if (id === 'pro') return users.filter(u => u.plan === 'pro').length;
    if (id === 'business') return users.filter(u => u.plan === 'business').length;
    if (id === 'expiring') {
      return users.filter(u => {
        const d = daysUntil(u.plan_expires_at);
        return u.plan !== 'starter' && d !== null && d >= 0 && d <= 7 && u.plan_status === 'active';
      }).length;
    }
    if (id === 'grace') return users.filter(u => u.plan_status === 'grace_period').length;
    if (id === 'starter') return users.filter(u => u.plan === 'starter').length;
    return 0;
  };

  return (
    <div className="space-y-5">

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon={Users}       label="Total User"    value={stats.total_users}     color="zinc" />
          <StatCard icon={Zap}         label="Pro"           value={stats.pro_users}        color="blue" />
          <StatCard icon={TrendingUp}  label="Business"      value={stats.business_users}   color="amber" />
          <StatCard icon={Clock}       label="Expire 7 Hari" value={stats.expiring_7days}    color="amber"
            sub={stats.expiring_7days > 0 ? 'Perlu reminder' : ''} />
          <StatCard icon={AlertTriangle} label="Masa Tenggang" value={stats.grace_period}  color="red" />
          <StatCard icon={CreditCard}  label="Est. MRR"
            value={stats.mrr_estimate ? `Rp${Math.round(stats.mrr_estimate / 1000)}K` : 'Rp0'}
            color="emerald" />
        </div>
      )}

      {/* Header + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-base font-bold text-zinc-900">Kelola Langganan</h2>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari user..."
              className="pl-8 pr-4 py-2 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
            />
          </div>
          <button onClick={load} className="p-2 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap">
        {TABS.map(t => {
          const cnt = tabCount(t.id);
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                tab === t.id ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
              }`}>
              {t.label}
              {cnt > 0 && (
                <span className={`text-[10px] rounded-full px-1.5 py-0 ${
                  tab === t.id ? 'bg-white/20 text-white' : 'bg-zinc-200 text-zinc-600'
                }`}>{cnt}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-zinc-300" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-zinc-400 text-sm">Tidak ada user ditemukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">User</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Paket</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Berakhir</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Sisa</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-zinc-800 text-xs">{u.full_name || '—'}</p>
                      <p className="text-[11px] text-zinc-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3"><PlanBadge plan={u.plan} /></td>
                    <td className="px-4 py-3"><StatusBadge status={u.plan_status} /></td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{fmt(u.plan_expires_at)}</td>
                    <td className="px-4 py-3"><DaysBar user={u} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setActivate(u)}
                          title="Aktivasi / Upgrade"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                          <CheckCircle2 size={13} />
                        </button>
                        <button onClick={() => setHistory(u)}
                          title="Lihat Riwayat"
                          className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 transition-colors">
                          <History size={13} />
                        </button>
                        <button onClick={() => setWaUser(u)}
                          title="Kirim Reminder WA"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors">
                          <MessageCircle size={13} />
                        </button>
                        {u.plan !== 'starter' && (
                          <button onClick={() => setDowngrade(u)}
                            title="Turunkan ke Starter"
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                            <ArrowDownRight size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activateUser && (
          <ActivateModal user={activateUser} onClose={() => setActivate(null)} onSuccess={load} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {historyUser && (
          <HistoryDrawer user={historyUser} onClose={() => setHistory(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {downgradeUser && (
          <DowngradeModal user={downgradeUser} onClose={() => setDowngrade(null)} onSuccess={load} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {waUser && (
          <WAReminderModal user={waUser} onClose={() => setWaUser(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
