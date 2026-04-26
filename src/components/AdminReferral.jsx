import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, RefreshCw, CheckCircle2, XCircle, Loader2, Clock,
  Phone, Wallet, Send, Search, Copy, Check, AlertCircle,
} from 'lucide-react';
import {
  adminListPartners, adminApprovePartner, adminRejectPartner,
  adminListPayoutRequests, adminApprovePayout, adminRejectPayout,
  adminPartnerStats,
} from '../lib/supabase';
import { formatRp } from '../lib/masterData';

const PARTNER_STATUS_META = {
  pending:  { label: 'Menunggu',  bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-400'  },
  approved: { label: 'Approved',  bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  rejected: { label: 'Rejected',  bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500'    },
};

const PAYOUT_STATUS_META = {
  pending:  { label: 'Menunggu',     bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-400'  },
  approved: { label: 'Disetujui',    bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500'   },
  paid:     { label: 'Sudah Bayar',  bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  rejected: { label: 'Ditolak',      bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500'    },
};

function StatusBadge({ status, meta }) {
  const m = meta[status] ?? Object.values(meta)[0];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function normalizePhone(p) {
  const digits = (p ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0'))  return `62${digits.slice(1)}`;
  return digits;
}

// ── Reject Partner Modal ─────────────────────────────────────────────────────
function RejectPartnerModal({ partner, onDone, onCancel }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await adminRejectPartner(partner.user_id, reason.trim());
      onDone();
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
        <h3 className="font-bold text-zinc-900">Tolak Partner</h3>
        <p className="text-xs text-zinc-500">
          Partner: <strong>{partner.email}</strong> · Kode: <code className="font-mono">{partner.code}</code>
        </p>
        <div>
          <label className="label">Alasan penolakan *</label>
          <textarea className="input-field resize-none" rows={3}
            placeholder="Misal: Indikasi self-referral, akun palsu..."
            value={reason} onChange={e => setReason(e.target.value)} />
          <p className="text-[11px] text-zinc-400 mt-1.5">
            Semua komisi yang menunggu aktivasi akan di-clawback.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-ghost flex-1">Batal</button>
          <button onClick={submit} disabled={!reason.trim() || loading}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-50">
            {loading && <Loader2 size={13} className="animate-spin" />} Tolak Partner
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Partner Row ──────────────────────────────────────────────────────────────
function PartnerRow({ partner, onApproved, onRejected }) {
  const [approving, setApproving] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleApprove = async () => {
    if (!confirm(`Setujui ${partner.email} sebagai partner?`)) return;
    setApproving(true);
    try {
      const result = await adminApprovePartner(partner.user_id);
      onApproved(partner.user_id, result?.promoted_commissions ?? 0);
    } catch (err) {
      alert('Gagal: ' + err.message);
    } finally { setApproving(false); }
  };

  const copy = () => {
    navigator.clipboard.writeText(partner.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const phone = normalizePhone(partner.phone_number);

  return (
    <>
      <tr className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
        <td className="px-4 py-3">
          <p className="text-sm font-semibold text-zinc-800">{partner.full_name || '—'}</p>
          <p className="text-xs text-zinc-400">{partner.email}</p>
          {phone && (
            <a href={`https://wa.me/${phone}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:underline mt-0.5">
              <Phone size={9} /> {partner.phone_number}
            </a>
          )}
        </td>
        <td className="px-4 py-3">
          <button onClick={copy}
            className="inline-flex items-center gap-1.5 font-mono text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-2 py-1 rounded-md transition-colors">
            {copied ? <Check size={11} /> : <Copy size={11} />} {partner.code}
          </button>
        </td>
        <td className="px-4 py-3 text-xs hidden md:table-cell">
          <p className="text-zinc-700">{partner.total_referrals} referrals</p>
          <p className="text-zinc-400">{partner.paying_referrals} membayar</p>
        </td>
        <td className="px-4 py-3 text-xs hidden lg:table-cell">
          {partner.awaiting_amount > 0 && (
            <p className="text-amber-700 font-semibold">{formatRp(partner.awaiting_amount)} <span className="text-zinc-400 font-normal">menunggu</span></p>
          )}
          <p className="text-zinc-700 font-semibold">{formatRp(partner.lifetime_amount)} <span className="text-zinc-400 font-normal">lifetime</span></p>
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          <StatusBadge status={partner.approval_status} meta={PARTNER_STATUS_META} />
          {partner.rejection_reason && (
            <p className="text-[10px] text-red-500 mt-1">{partner.rejection_reason}</p>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-zinc-400 hidden lg:table-cell whitespace-nowrap">
          {formatDate(partner.created_at)}
        </td>
        <td className="px-4 py-3">
          {partner.approval_status === 'pending' ? (
            <div className="flex items-center gap-1">
              <button onClick={handleApprove} disabled={approving}
                className="flex items-center gap-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                {approving ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />} Setujui
              </button>
              <button onClick={() => setShowReject(true)}
                className="flex items-center gap-1 text-xs font-bold bg-red-100 hover:bg-red-200 text-red-700 px-2.5 py-1.5 rounded-lg transition-colors">
                <XCircle size={11} /> Tolak
              </button>
            </div>
          ) : partner.approval_status === 'approved' ? (
            <button onClick={() => setShowReject(true)}
              className="flex items-center gap-1 text-xs font-semibold bg-zinc-100 hover:bg-red-100 hover:text-red-700 text-zinc-600 px-2.5 py-1.5 rounded-lg transition-colors">
              <XCircle size={11} /> Tolak / Cabut
            </button>
          ) : (
            <span className="text-xs text-zinc-300">—</span>
          )}
        </td>
      </tr>

      <AnimatePresence>
        {showReject && (
          <RejectPartnerModal partner={partner}
            onDone={() => { setShowReject(false); onRejected(partner.user_id); }}
            onCancel={() => setShowReject(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Tab: Partners ────────────────────────────────────────────────────────────
export function PartnersTab() {
  const [partners, setPartners] = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('pending');
  const [search, setSearch]     = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, st] = await Promise.all([
        adminListPartners(),
        adminPartnerStats(),
      ]);
      setPartners(list);
      setStats(st);
    } catch (err) {
      alert('Gagal: ' + err.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onApproved = (userId) => setPartners(prev => prev.map(p =>
    p.user_id === userId ? { ...p, approval_status: 'approved', approved_at: new Date().toISOString() } : p
  ));
  const onRejected = (userId) => setPartners(prev => prev.map(p =>
    p.user_id === userId ? { ...p, approval_status: 'rejected' } : p
  ));

  const filtered = partners
    .filter(p => filter === 'all' || p.approval_status === filter)
    .filter(p => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (p.email ?? '').toLowerCase().includes(q)
          || (p.full_name ?? '').toLowerCase().includes(q)
          || (p.code ?? '').toLowerCase().includes(q);
    });

  const counts = {
    pending:  partners.filter(p => p.approval_status === 'pending').length,
    approved: partners.filter(p => p.approval_status === 'approved').length,
    rejected: partners.filter(p => p.approval_status === 'rejected').length,
  };

  return (
    <div className="space-y-4">
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: 'Total Partners',      value: stats.total_partners,                       Icon: Users,        color: 'bg-zinc-100 text-zinc-700' },
            { label: 'Aktif',               value: stats.active_partners,                      Icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700' },
            { label: 'Total Referees',      value: stats.total_referees,                       Icon: Users,        color: 'bg-blue-100 text-blue-700' },
            { label: 'Komisi Dibayar',      value: formatRp(stats.total_commission_paid),      Icon: Wallet,       color: 'bg-emerald-100 text-emerald-700' },
            { label: 'Outstanding',         value: formatRp(stats.total_outstanding),          Icon: Clock,        color: 'bg-amber-100 text-amber-700' },
            { label: 'Pending Payout',      value: stats.pending_payouts,                      Icon: Send,         color: 'bg-orange-100 text-orange-700' },
            { label: 'Nominal Pending',     value: formatRp(stats.pending_payout_amount),      Icon: AlertCircle,  color: 'bg-red-100 text-red-700' },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className="card p-3 flex flex-col gap-1">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
                <Icon size={13} />
              </div>
              <p className="text-sm font-bold text-zinc-900 leading-tight break-words">{value ?? 0}</p>
              <p className="text-[10px] text-zinc-500 leading-tight">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-zinc-500">
          {counts.pending} pending · {counts.approved} approved · {counts.rejected} rejected
        </p>
        <button onClick={fetchData} disabled={loading} className="btn-ghost flex items-center gap-1.5 text-sm">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex bg-zinc-100 rounded-lg p-1 gap-1">
          {[['all','Semua'], ['pending','Pending'], ['approved','Approved'], ['rejected','Rejected']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${filter === val ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}>
              {label}
              {val === 'pending' && counts.pending > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{counts.pending}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input className="input-field pl-8 text-sm py-1.5" placeholder="Cari nama / email / kode..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="card p-12 flex items-center justify-center gap-3 text-zinc-400">
          <Loader2 size={18} className="animate-spin" /><span className="text-sm">Memuat...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-zinc-400 text-sm">
          {search ? 'Tidak ada hasil yang cocok.' : 'Belum ada partner di status ini.'}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Partner</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Kode</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 hidden md:table-cell">Referrals</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 hidden lg:table-cell">Komisi</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 hidden md:table-cell">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 hidden lg:table-cell">Daftar</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <PartnerRow key={p.user_id} partner={p}
                    onApproved={onApproved} onRejected={onRejected} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Approve Payout Modal ─────────────────────────────────────────────────────
function ApprovePayoutModal({ payout, onDone, onCancel }) {
  const [proofUrl, setProofUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!proofUrl.trim()) { setError('URL bukti transfer wajib diisi'); return; }
    setLoading(true); setError('');
    try {
      await adminApprovePayout(payout.id, proofUrl.trim(), notes.trim() || null);
      onDone();
    } catch (err) {
      setError(err.message || 'Gagal');
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h3 className="font-bold text-zinc-900 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" /> Konfirmasi Pembayaran Payout
        </h3>

        <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-3 space-y-1 text-xs">
          <p>Partner: <strong>{payout.partner_email}</strong></p>
          <p>Jumlah: <strong>{formatRp(payout.requested_amount)}</strong></p>
          <p>Bank: <strong>{payout.bank_name}</strong> — <span className="font-mono">{payout.bank_account_number}</span></p>
          <p>Atas Nama: <strong>{payout.bank_account_name}</strong></p>
        </div>

        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
          Lakukan transfer manual dulu, lalu isi URL bukti di bawah. Sistem akan menandai semua komisi terkait sebagai <strong>paid</strong>.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">URL Bukti Transfer *</label>
            <input type="url" value={proofUrl} onChange={e => setProofUrl(e.target.value)}
              placeholder="https://drive.google.com/... atau link gambar" className="input-field" required />
          </div>

          <div>
            <label className="label">Catatan Admin (opsional)</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Catatan internal..." className="input-field resize-none" />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
              <AlertCircle size={13} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onCancel} className="btn-ghost flex-1">Batal</button>
            <button type="submit" disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-50">
              {loading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              Tandai Sudah Dibayar
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ── Reject Payout Modal ──────────────────────────────────────────────────────
function RejectPayoutModal({ payout, onDone, onCancel }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      await adminRejectPayout(payout.id, reason.trim());
      onDone();
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
        <h3 className="font-bold text-zinc-900">Tolak Permintaan Payout</h3>
        <p className="text-xs text-zinc-500">
          Partner: <strong>{payout.partner_email}</strong> · {formatRp(payout.requested_amount)}
        </p>
        <div>
          <label className="label">Alasan *</label>
          <textarea className="input-field resize-none" rows={3}
            placeholder="Misal: Data rekening tidak valid, indikasi fraud..."
            value={reason} onChange={e => setReason(e.target.value)} />
          <p className="text-[11px] text-zinc-400 mt-1.5">
            Saldo komisi tetap di partner (tidak ikut di-clawback). Partner bisa ajukan ulang.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-ghost flex-1">Batal</button>
          <button onClick={submit} disabled={!reason.trim() || loading}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-50">
            {loading && <Loader2 size={13} className="animate-spin" />} Tolak Payout
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Payout Row ───────────────────────────────────────────────────────────────
function PayoutRow({ payout, onChanged }) {
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);

  const phone = normalizePhone(payout.partner_phone);
  const waMsg = (text) => phone ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;

  return (
    <>
      <tr className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
        <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">{formatDate(payout.created_at)}</td>
        <td className="px-4 py-3">
          <p className="text-sm font-semibold text-zinc-800">{payout.partner_name || '—'}</p>
          <p className="text-xs text-zinc-400">{payout.partner_email}</p>
        </td>
        <td className="px-4 py-3 text-sm font-bold text-zinc-900 whitespace-nowrap">{formatRp(payout.requested_amount)}</td>
        <td className="px-4 py-3 text-xs hidden md:table-cell">
          <p className="text-zinc-700 font-semibold">{payout.bank_name}</p>
          <p className="text-zinc-500 font-mono">{payout.bank_account_number}</p>
          <p className="text-zinc-400">{payout.bank_account_name}</p>
        </td>
        <td className="px-4 py-3 hidden lg:table-cell text-xs text-zinc-500">
          {payout.partner_notes || '—'}
        </td>
        <td className="px-4 py-3"><StatusBadge status={payout.status} meta={PAYOUT_STATUS_META} /></td>
        <td className="px-4 py-3">
          {payout.status === 'pending' ? (
            <div className="flex items-center gap-1">
              <button onClick={() => setShowApprove(true)}
                className="flex items-center gap-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg transition-colors">
                <CheckCircle2 size={11} /> Bayar
              </button>
              <button onClick={() => setShowReject(true)}
                className="flex items-center gap-1 text-xs font-bold bg-red-100 hover:bg-red-200 text-red-700 px-2.5 py-1.5 rounded-lg transition-colors">
                <XCircle size={11} /> Tolak
              </button>
            </div>
          ) : payout.status === 'paid' ? (
            <div className="flex items-center gap-2">
              {payout.payment_proof_url && (
                <a href={payout.payment_proof_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline">Bukti</a>
              )}
              <a href={waMsg(`Halo, payout Anda sebesar ${formatRp(payout.requested_amount)} sudah ditransfer ke ${payout.bank_name} ${payout.bank_account_number}. Terima kasih!`)}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-emerald-600 hover:underline">
                <Phone size={11} /> Notif WA
              </a>
            </div>
          ) : (
            <span className="text-xs text-zinc-400">{payout.admin_notes || '—'}</span>
          )}
        </td>
      </tr>

      <AnimatePresence>
        {showApprove && (
          <ApprovePayoutModal payout={payout}
            onDone={() => { setShowApprove(false); onChanged(); }}
            onCancel={() => setShowApprove(false)} />
        )}
        {showReject && (
          <RejectPayoutModal payout={payout}
            onDone={() => { setShowReject(false); onChanged(); }}
            onCancel={() => setShowReject(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Tab: Payouts ─────────────────────────────────────────────────────────────
export function PayoutsTab() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('pending');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const list = await adminListPayoutRequests();
      setPayouts(list);
    } catch (err) {
      alert('Gagal: ' + err.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = payouts.filter(p => filter === 'all' || p.status === filter);

  const counts = {
    pending:  payouts.filter(p => p.status === 'pending').length,
    paid:     payouts.filter(p => p.status === 'paid').length,
    rejected: payouts.filter(p => p.status === 'rejected').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-zinc-500">
          {counts.pending} pending · {counts.paid} paid · {counts.rejected} rejected
        </p>
        <button onClick={fetchData} disabled={loading} className="btn-ghost flex items-center gap-1.5 text-sm">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="flex bg-zinc-100 rounded-lg p-1 gap-1 w-fit">
        {[['all','Semua'], ['pending','Pending'], ['paid','Paid'], ['rejected','Rejected']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${filter === val ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}>
            {label}
            {val === 'pending' && counts.pending > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{counts.pending}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-12 flex items-center justify-center gap-3 text-zinc-400">
          <Loader2 size={18} className="animate-spin" /><span className="text-sm">Memuat...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-zinc-400 text-sm">
          Tidak ada permintaan payout di status ini.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Tanggal</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Partner</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Jumlah</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 hidden md:table-cell">Bank</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 hidden lg:table-cell">Catatan Partner</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <PayoutRow key={p.id} payout={p} onChanged={fetchData} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
