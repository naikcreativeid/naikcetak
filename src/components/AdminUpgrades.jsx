import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Search, RefreshCw, CheckCircle2, XCircle,
  Eye, Phone, Mail, ExternalLink, Loader2, Clock, SortAsc,
} from 'lucide-react';
import { adminGetUpgradeRequests, adminApproveUpgrade, adminRejectUpgrade } from '../lib/supabase';
import { PLANS } from '../lib/plans';
import { formatRp } from '../lib/masterData';

const PAYMENT_INFO_WA = import.meta.env.VITE_ADMIN_WA ?? '6281234567890';

const STATUS_META = {
  pending:  { label: 'Menunggu',  bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-400'  },
  approved: { label: 'Disetujui', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  rejected: { label: 'Ditolak',   bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
  cancelled:{ label: 'Dibatalkan',bg: 'bg-zinc-100',   text: 'text-zinc-500',   dot: 'bg-zinc-400'   },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400)return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

function waApproveLink(req, expiresAt) {
  const expire = expiresAt ? new Date(expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const msg = `Halo ${req.user_name ?? req.user_email}! Akun naikcetak Anda telah diupgrade ke paket ${PLANS[req.requested_plan]?.name ?? req.requested_plan} ✅\nAktif hingga: ${expire}\nSilakan login ulang dan refresh halaman untuk melihat fitur lengkap.\nTerima kasih sudah mempercayai naikcetak! 🙏`;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

function waRejectLink(req, reason) {
  const msg = `Halo ${req.user_name ?? req.user_email}, mohon maaf permintaan upgrade Anda belum bisa diproses.\nAlasan: ${reason || '—'}\nSilakan hubungi kami jika ada pertanyaan.`;
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

// ── Reject Modal ──────────────────────────────────────────────────────────────
function RejectModal({ req, adminEmail, onDone, onCancel }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    setLoading(true);
    try {
      await adminRejectUpgrade(req.id, adminEmail, reason);
      onDone(req.id, reason);
    } catch (err) {
      alert('Gagal: ' + err.message);
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h3 className="font-bold text-zinc-900">Tolak Permintaan Upgrade</h3>
        <p className="text-xs text-zinc-500">
          User: <strong>{req.user_email}</strong> — {PLANS[req.requested_plan]?.name}
        </p>
        <div>
          <label className="label">Alasan penolakan *</label>
          <textarea className="input-field resize-none" rows={3}
            placeholder="Misal: Bukti transfer tidak valid, nominal tidak sesuai..."
            value={reason} onChange={e => setReason(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-ghost flex-1">Batal</button>
          <button onClick={handleReject} disabled={!reason.trim() || loading}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-50">
            {loading && <Loader2 size={13} className="animate-spin" />}
            Tolak
          </button>
        </div>
        {req.id && reason && (
          <a href={waRejectLink(req, reason)} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 hover:underline mt-1">
            <Phone size={11} /> Kirim notif WA ke user
          </a>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────
function RequestRow({ req, adminEmail, onApproved, onRejected }) {
  const [approving, setApproving]   = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [proofOpen, setProofOpen]   = useState(false);
  const [approvedAt, setApprovedAt] = useState(null);

  const plan = PLANS[req.requested_plan];

  const handleApprove = async () => {
    if (!confirm(`Setujui upgrade ${req.user_email} ke ${plan?.name}?`)) return;
    setApproving(true);
    try {
      const result = await adminApproveUpgrade(req.id, adminEmail);
      const expiresAt = result?.expires_at;
      setApprovedAt(expiresAt);
      onApproved(req.id, expiresAt);
      window.open(waApproveLink(req, expiresAt), '_blank');
    } catch (err) {
      alert('Gagal approve: ' + err.message);
    } finally { setApproving(false); }
  };

  return (
    <>
      <motion.tr
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors"
      >
        {/* User info */}
        <td className="px-4 py-3">
          <p className="text-sm font-semibold text-zinc-800 truncate max-w-[160px]">
            {req.user_name || '—'}
          </p>
          <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
            <Mail size={10} /> {req.user_email}
          </p>
        </td>

        {/* Plan */}
        <td className="px-4 py-3">
          <span className="text-sm font-bold" style={{ color: plan?.color ?? '#374151' }}>
            {plan?.name ?? req.requested_plan}
          </span>
          <p className="text-xs text-zinc-400">{req.billing_cycle === 'monthly' ? 'Bulanan' : 'Tahunan'}</p>
        </td>

        {/* Nominal */}
        <td className="px-4 py-3 text-sm font-bold text-zinc-800 whitespace-nowrap">
          {formatRp(req.amount_to_pay)}
        </td>

        {/* Metode */}
        <td className="px-4 py-3 text-xs text-zinc-500 capitalize hidden md:table-cell">
          {(req.payment_method ?? '—').replace('_', ' ')}
        </td>

        {/* Bukti */}
        <td className="px-4 py-3 hidden lg:table-cell">
          {req.payment_proof_url ? (
            <button onClick={() => setProofOpen(true)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold">
              <Eye size={12} /> Lihat
            </button>
          ) : (
            <span className="text-xs text-zinc-300">Belum upload</span>
          )}
        </td>

        {/* Waktu */}
        <td className="px-4 py-3 text-xs text-zinc-400 whitespace-nowrap hidden md:table-cell">
          <Clock size={10} className="inline mr-1" />
          {timeAgo(req.submitted_at)}
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          <StatusBadge status={req.status} />
        </td>

        {/* Aksi */}
        <td className="px-4 py-3">
          {req.status === 'pending' ? (
            <div className="flex items-center gap-1">
              <button onClick={handleApprove} disabled={approving}
                className="flex items-center gap-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                {approving ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                Setujui
              </button>
              <button onClick={() => setShowReject(true)}
                className="flex items-center gap-1 text-xs font-bold bg-red-100 hover:bg-red-200 text-red-700 px-2.5 py-1.5 rounded-lg transition-colors">
                <XCircle size={11} /> Tolak
              </button>
            </div>
          ) : req.status === 'approved' ? (
            <a href={waApproveLink(req, approvedAt ?? req.reviewed_at)} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-emerald-600 hover:underline">
              <Phone size={11} /> Notif WA
            </a>
          ) : (
            <span className="text-xs text-zinc-300">—</span>
          )}
        </td>
      </motion.tr>

      {/* Proof preview modal */}
      <AnimatePresence>
        {proofOpen && req.payment_proof_url && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4"
            onClick={() => setProofOpen(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                <span className="text-sm font-bold text-zinc-800">Bukti Transfer</span>
                <div className="flex gap-2">
                  <a href={req.payment_proof_url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                    <ExternalLink size={11} /> Buka di tab baru
                  </a>
                  <button onClick={() => setProofOpen(false)} className="text-zinc-400 hover:text-zinc-700">✕</button>
                </div>
              </div>
              <img src={req.payment_proof_url} alt="Bukti Transfer"
                className="w-full max-h-[60vh] object-contain bg-zinc-50 p-4" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject modal */}
      <AnimatePresence>
        {showReject && (
          <RejectModal
            req={req}
            adminEmail={adminEmail}
            onDone={(id, reason) => { setShowReject(false); onRejected(id, reason); }}
            onCancel={() => setShowReject(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminUpgrades({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('pending');
  const [search, setSearch]     = useState('');
  const [sort, setSort]         = useState('newest');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminGetUpgradeRequests(user.email);
      setRequests(data);
    } catch (err) {
      alert('Gagal memuat data: ' + err.message);
    } finally { setLoading(false); }
  }, [user.email]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const onApproved = (id) => setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
  const onRejected = (id) => setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));

  const filtered = requests
    .filter(r => filter === 'all' || r.status === filter)
    .filter(r => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (r.user_email ?? '').toLowerCase().includes(q) ||
             (r.user_name  ?? '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === 'newest')  return new Date(b.created_at) - new Date(a.created_at);
      if (sort === 'oldest')  return new Date(a.created_at) - new Date(b.created_at);
      if (sort === 'highest') return (b.amount_to_pay ?? 0) - (a.amount_to_pay ?? 0);
      return 0;
    });

  const counts = {
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
            <ShieldCheck size={18} className="text-zinc-700" /> Admin — Upgrade Requests
          </h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            {counts.pending} menunggu · {counts.approved} disetujui · {counts.rejected} ditolak
          </p>
        </div>
        <button onClick={fetchRequests} disabled={loading}
          className="flex items-center gap-2 btn-ghost text-sm">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Filters + search */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex bg-zinc-100 rounded-lg p-1 gap-1">
          {[['all', 'Semua'], ['pending', 'Menunggu'], ['approved', 'Disetujui'], ['rejected', 'Ditolak']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${
                filter === val ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'
              }`}>
              {label}
              {val === 'pending' && counts.pending > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {counts.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input className="input-field pl-8 text-sm py-1.5" placeholder="Cari nama / email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <select value={sort} onChange={e => setSort(e.target.value)}
          className="input-field text-xs py-1.5 w-auto">
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
          <option value="highest">Nominal Tertinggi</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card p-12 flex items-center justify-center gap-3 text-zinc-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Memuat data...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-zinc-400 text-sm">
          {search ? 'Tidak ada hasil yang cocok.' : 'Tidak ada permintaan upgrade.'}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500">User</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Plan</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Nominal</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 hidden md:table-cell">Metode</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 hidden lg:table-cell">Bukti</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 hidden md:table-cell">Waktu</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map(req => (
                    <RequestRow key={req.id} req={req} adminEmail={user.email}
                      onApproved={onApproved} onRejected={onRejected} />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
