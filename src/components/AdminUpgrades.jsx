import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, Search, RefreshCw, CheckCircle2, XCircle,
  Eye, Phone, Mail, ExternalLink, Loader2, Clock, UserPlus,
  KeyRound, Trash2, Zap, Users, ChevronDown, ChevronUp,
  Bell, TrendingUp, AlertCircle, Timer, MessageCircle, Globe2, Wallet,
} from 'lucide-react';
import {
  adminGetUpgradeRequests, adminApproveUpgrade, adminRejectUpgrade,
  adminGetAllUsers, adminCreateUser, adminResetUserPassword, adminDirectUpgrade, adminDeleteUser,
  getSubscriptionStats, adminGetReminderList, adminMarkReminderSent, adminSendStarterFollowUpEmails, getPaymentProofAccessUrl,
} from '../lib/supabase';
import { getPaymentStatusLabel } from '../lib/payments';
import { PLANS } from '../lib/plans';
import { formatRp } from '../lib/masterData';
import AdminSubscriptionDashboard from './AdminSubscriptionDashboard';
import SiteSettingsPanel from './SiteSettingsPanel';
import { PartnersTab, PayoutsTab } from './AdminReferral';

const PAYMENT_INFO_WA = import.meta.env.VITE_ADMIN_WA ?? '6281234567890';

const STATUS_META = {
  pending:  { label: 'Menunggu',  bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-400'  },
  approved: { label: 'Disetujui', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  rejected: { label: 'Ditolak',   bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
  cancelled:{ label: 'Dibatalkan',bg: 'bg-zinc-100',   text: 'text-zinc-500',   dot: 'bg-zinc-400'   },
};

const TRANSACTION_STATUS_META = {
  manual_review: { label: 'Manual review', bg: 'bg-zinc-100', text: 'text-zinc-600', dot: 'bg-zinc-400' },
  pending: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-400' },
  settlement: { label: 'Settlement', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  capture: { label: 'Capture', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  deny: { label: 'Denied', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  cancel: { label: 'Cancelled', bg: 'bg-zinc-100', text: 'text-zinc-600', dot: 'bg-zinc-400' },
  cancelled: { label: 'Cancelled', bg: 'bg-zinc-100', text: 'text-zinc-600', dot: 'bg-zinc-400' },
  expire: { label: 'Expired', bg: 'bg-zinc-100', text: 'text-zinc-600', dot: 'bg-zinc-400' },
  failure: { label: 'Failed', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  approved: { label: 'Paid', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  rejected: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
};

const PAYMENT_GATEWAY_META = {
  legacy_auto: { label: 'Legacy Auto', bg: 'bg-sky-100', text: 'text-sky-700' },
  manual: { label: 'Manual', bg: 'bg-zinc-100', text: 'text-zinc-600' },
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
  if (diff < 60)    return 'Baru saja';
  if (diff < 3600)  return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return 'â€”';
  return new Date(dateStr).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isAutomatedGateway(req) {
  return Boolean(req.snap_token);
}

function getTransactionState(req) {
  if (req.transaction_status) return req.transaction_status;
  if (req.status === 'approved') return 'approved';
  if (req.status === 'rejected') return 'rejected';
  if (req.status === 'cancelled') return 'cancelled';
  return 'manual_review';
}

function getPaymentMethodLabel(method) {
  if (!method) return 'â€”';
  return method
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function TransactionBadge({ status }) {
  const meta = TRANSACTION_STATUS_META[status] ?? TRANSACTION_STATUS_META.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold ${meta.bg} ${meta.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

const FOLLOW_UP_STORAGE_KEY = 'naikcetak-followup-templates-v1';

const FOLLOW_UP_DEFAULTS = [
  'Halo {name}, terima kasih sudah daftar di naikcetak. Kalau Anda mau, saya bisa bantu aktifkan langkah awal supaya akun Anda langsung siap dipakai.',
  'Halo {name}, saya follow up ya. Sudah sempat coba dashboard naikcetak? Kalau ada yang membingungkan, saya bantu arahkan langkah berikutnya.',
  'Halo {name}, banyak percetakan mulai dari Starter lalu lanjut pakai fitur Pro setelah workflow-nya terasa cocok. Kalau Anda mau lihat alurnya, saya bisa bantu jelaskan singkat.',
  'Halo {name}, saya ingatkan lagi ya. Kalau Anda ingin mempercepat invoice, quotation, dan tracking order, saya bisa bantu tunjukkan fitur yang paling relevan untuk percetakan Anda.',
  'Halo {name}, ini follow up terakhir dari saya untuk saat ini. Kalau Anda ingin lanjut setup atau upgrade kapan pun, tinggal balas WhatsApp ini ya. Saya siap bantu.',
];

function getStoredFollowUpTemplates() {
  if (typeof window === 'undefined') return FOLLOW_UP_DEFAULTS;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(FOLLOW_UP_STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed) || parsed.length !== 5) return FOLLOW_UP_DEFAULTS;
    return parsed.map((item, index) => (typeof item === 'string' && item.trim() ? item : FOLLOW_UP_DEFAULTS[index]));
  } catch {
    return FOLLOW_UP_DEFAULTS;
  }
}

function saveFollowUpTemplates(templates) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(FOLLOW_UP_STORAGE_KEY, JSON.stringify(templates));
}

function normalizePhone(phone) {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}

function buildFollowUpText(template, user) {
  const displayName = user.full_name || user.company_name || user.email || 'kak';
  return template
    .replaceAll('{name}', displayName)
    .replaceAll('{email}', user.email || '')
    .replaceAll('{plan}', (PLANS[user.plan]?.name ?? user.plan ?? 'Starter'));
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

// ── Reset Password Modal ──────────────────────────────────────────────────────
function ResetPasswordModal({ targetUser, onDone, onCancel }) {
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleReset = async () => {
    if (password.length < 8) { alert('Password minimal 8 karakter.'); return; }
    if (!confirm(`Reset password ${targetUser.email}?`)) return;
    setLoading(true);
    try {
      await adminResetUserPassword(targetUser.id, password);
      alert(`Password ${targetUser.email} berhasil diubah.`);
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
        <h3 className="font-bold text-zinc-900 flex items-center gap-2">
          <KeyRound size={16} /> Reset Password
        </h3>
        <p className="text-xs text-zinc-500">User: <strong>{targetUser.email}</strong></p>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Password Baru</label>
          <input type="text" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Masukkan password baru (min. 8 karakter)"
            className="input-field" />
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-ghost flex-1">Batal</button>
          <button onClick={handleReset} disabled={password.length < 8 || loading}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-50">
            {loading && <Loader2 size={13} className="animate-spin" />}
            Reset Password
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Upgrade User Modal ────────────────────────────────────────────────────────
function UpgradeUserModal({ targetUser, onDone, onCancel }) {
  const [plan,    setPlan]    = useState('pro');
  const [months,  setMonths]  = useState(1);
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!confirm(`Upgrade ${targetUser.email} ke ${plan} selama ${months} bulan?`)) return;
    setLoading(true);
    try {
      await adminDirectUpgrade(targetUser.id, plan, months);
      alert(`${targetUser.email} berhasil di-upgrade ke ${plan}.`);
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
        <h3 className="font-bold text-zinc-900 flex items-center gap-2">
          <Zap size={16} className="text-blue-600" /> Upgrade User
        </h3>
        <p className="text-xs text-zinc-500">User: <strong>{targetUser.email}</strong></p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Paket</label>
            <select value={plan} onChange={e => setPlan(e.target.value)} className="input-field">
              <option value="pro">Pro</option>
              <option value="business">Business</option>
              <option value="starter">Starter (downgrade)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Durasi (bulan)</label>
            <input type="number" min={1} max={24} value={months} onChange={e => setMonths(+e.target.value)}
              className="input-field" />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-ghost flex-1">Batal</button>
          <button onClick={handleUpgrade} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-50">
            {loading && <Loader2 size={13} className="animate-spin" />}
            Upgrade Sekarang
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Request Row ───────────────────────────────────────────────────────────────
function RequestRow({ req, adminEmail, onApproved, onRejected }) {
  const [approving, setApproving]   = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [proofOpen, setProofOpen]   = useState(false);
  const [approvedAt, setApprovedAt] = useState(null);
  const [proofUrl, setProofUrl]     = useState('');
  const [proofLoading, setProofLoading] = useState(false);
  const [proofError, setProofError] = useState('');

  const plan = PLANS[req.requested_plan];
  const automatedPayment = isAutomatedGateway(req);
  const transactionState = getTransactionState(req);
  const gatewayMeta = PAYMENT_GATEWAY_META[automatedPayment ? 'legacy_auto' : 'manual'];

  const openProof = async () => {
    if (!req.payment_proof_url) return;

    setProofOpen(true);
    setProofLoading(true);
    setProofError('');

    try {
      const signedUrl = await getPaymentProofAccessUrl(req.payment_proof_url);
      setProofUrl(signedUrl || req.payment_proof_url);
    } catch (err) {
      setProofError(err.message || 'Bukti transfer tidak bisa dimuat.');
      setProofUrl(req.payment_proof_url);
    } finally {
      setProofLoading(false);
    }
  };

  const previewUrl = proofUrl || req.payment_proof_url;
  const isPdfProof = /\.pdf($|\?)/i.test(previewUrl ?? '');

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
      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
        <td className="px-4 py-3">
          <p className="text-sm font-semibold text-zinc-800 truncate max-w-[160px]">{req.user_name || '—'}</p>
          <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
            <Mail size={10} /> {req.user_email}
          </p>
        </td>
        <td className="px-4 py-3">
          <span className="text-sm font-bold" style={{ color: plan?.color ?? '#374151' }}>
            {plan?.name ?? req.requested_plan}
          </span>
          <p className="text-xs text-zinc-400">{req.billing_cycle === 'monthly' ? 'Bulanan' : 'Tahunan'}</p>
        </td>
        <td className="px-4 py-3 text-sm font-bold text-zinc-800 whitespace-nowrap">
          {formatRp(req.amount_to_pay)}
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          <div className="space-y-1 min-w-[210px]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${gatewayMeta.bg} ${gatewayMeta.text}`}>
                {gatewayMeta.label}
              </span>
              <TransactionBadge status={transactionState} />
            </div>
            <p className="text-xs text-zinc-600">{getPaymentMethodLabel(req.payment_method)}</p>
            {req.order_id && (
              <p className="text-[11px] text-zinc-400">
                Order ID: <span className="font-mono">{req.order_id}</span>
              </p>
            )}
          </div>
        </td>
        <td className="px-4 py-3 hidden lg:table-cell">
          {req.payment_proof_url ? (
            <button onClick={openProof}
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold">
              <Eye size={12} /> Lihat
            </button>
          ) : (
            <span className="text-xs text-zinc-300">{automatedPayment ? 'Otomatis' : 'Belum upload'}</span>
          )}
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          <div className="space-y-1 min-w-[170px] text-[11px] text-zinc-500">
            <p className="flex items-center gap-1 text-zinc-400">
              <Clock size={10} />
              Diajukan {timeAgo(req.submitted_at)}
            </p>
            <p>Submit: {formatDateTime(req.submitted_at)}</p>
            {req.paid_at && <p className="text-emerald-600">Paid: {formatDateTime(req.paid_at)}</p>}
            {req.webhook_received_at && <p>Verified: {formatDateTime(req.webhook_received_at)}</p>}
          </div>
        </td>
        <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
        <td className="px-4 py-3">
          {req.status === 'pending' && !automatedPayment ? (
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
          ) : req.status === 'pending' && automatedPayment ? (
            <div className="space-y-1.5">
              <div className="text-[11px] text-zinc-500">
                <p className="font-semibold text-sky-700">Diproses otomatis</p>
                <p>{getPaymentStatusLabel(req.transaction_status || 'pending')}</p>
              </div>
              <button onClick={() => setShowReject(true)}
                className="flex items-center gap-1 text-[11px] font-bold bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-md transition-colors">
                <XCircle size={10} /> Batalkan
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
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                    <ExternalLink size={11} /> Buka di tab baru
                  </a>
                  <button onClick={() => setProofOpen(false)} className="text-zinc-400 hover:text-zinc-700">✕</button>
                </div>
              </div>
              <div className="bg-zinc-50 p-4 min-h-[280px] flex items-center justify-center">
                {proofLoading ? (
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <Loader2 size={15} className="animate-spin" /> Memuat bukti transfer...
                  </div>
                ) : proofError ? (
                  <div className="text-center space-y-2">
                    <p className="text-sm text-red-500">{proofError}</p>
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline">
                      <ExternalLink size={12} /> Buka bukti di tab baru
                    </a>
                  </div>
                ) : isPdfProof ? (
                  <iframe
                    title="Bukti Transfer PDF"
                    src={previewUrl}
                    className="w-full h-[60vh] rounded-xl bg-white"
                  />
                ) : (
                  <img src={previewUrl} alt="Bukti Transfer"
                    className="w-full max-h-[60vh] object-contain bg-zinc-50" />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReject && (
          <RejectModal req={req} adminEmail={adminEmail}
            onDone={(id, reason) => { setShowReject(false); onRejected(id, reason); }}
            onCancel={() => setShowReject(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Stats Cards ──────────────────────────────────────────────────────────────
function StatsCards({ stats }) {
  if (!stats) return null;
  const fmt = (n) => new Intl.NumberFormat('id-ID').format(n ?? 0);

  const cards = [
    { label: 'Total User',      value: stats.total_users,      icon: Users,       color: 'bg-zinc-100 text-zinc-700' },
    { label: 'Pro Aktif',       value: stats.pro_users,        icon: Zap,         color: 'bg-blue-100 text-blue-700' },
    { label: 'Business Aktif',  value: stats.business_users,   icon: TrendingUp,  color: 'bg-amber-100 text-amber-700' },
    { label: 'Expiring 7 Hari', value: stats.expiring_7days,   icon: Timer,       color: 'bg-orange-100 text-orange-700' },
    { label: 'Grace Period',    value: stats.grace_period,     icon: AlertCircle, color: 'bg-red-100 text-red-700' },
    { label: 'Pending Bayar',   value: stats.pending_approval, icon: Clock,       color: 'bg-amber-100 text-amber-700' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-2">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="card p-3 flex flex-col gap-1">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
            <Icon size={13} />
          </div>
          <p className="text-xl font-bold text-zinc-900 leading-none">{value ?? 0}</p>
          <p className="text-[11px] text-zinc-500 leading-tight">{label}</p>
        </div>
      ))}
      <div className="card p-3 flex flex-col gap-1 col-span-2 sm:col-span-3 lg:col-span-6 lg:hidden">
        <p className="text-xs text-zinc-500">Estimasi MRR</p>
        <p className="text-lg font-bold text-zinc-900">Rp {fmt(stats.mrr_estimate)}</p>
      </div>
      <div className="hidden lg:block card p-3 flex-col gap-1" style={{ display: 'none' }}>
      </div>
    </div>
  );
}

// ── Tab: Reminders ────────────────────────────────────────────────────────────
function RemindersTab({ user }) {
  const [reminders, setReminders] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [sent,      setSent]      = useState(new Set());
  const [emailSending, setEmailSending] = useState(false);
  const [emailPreview, setEmailPreview] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try { setReminders(await adminGetReminderList()); }
    catch (err) { alert('Gagal: ' + err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSent = async (r) => {
    try {
      await adminMarkReminderSent(r.user_id, r.reminder_type);
      setSent(prev => new Set([...prev, `${r.user_id}:${r.reminder_type}`]));
    } catch (err) { alert('Gagal: ' + err.message); }
  };

  const handlePreviewEmails = async () => {
    try {
      const result = await adminSendStarterFollowUpEmails({ dryRun: true, limit: 20 });
      setEmailPreview(result);
    } catch (err) {
      alert('Preview email gagal: ' + err.message);
    }
  };

  const handleSendEmails = async () => {
    if (!confirm('Kirim follow-up email ke user Starter yang belum pernah dikontak?')) return;
    setEmailSending(true);
    try {
      const result = await adminSendStarterFollowUpEmails({ dryRun: false, limit: 20 });
      alert(`Follow-up email terkirim ke ${result.sentCount ?? 0} user.`);
      setEmailPreview(null);
    } catch (err) {
      alert('Kirim email gagal: ' + err.message);
    } finally {
      setEmailSending(false);
    }
  };

  const PLAN_COLOR = { starter: '#6B7280', pro: '#2563EB', business: '#D97706' };

  const REMINDER_META = {
    '7_days':      { label: '7 Hari',       bg: 'bg-blue-100',   text: 'text-blue-700'   },
    '3_days':      { label: '3 Hari',       bg: 'bg-orange-100', text: 'text-orange-700' },
    '1_day':       { label: '1 Hari',       bg: 'bg-red-100',    text: 'text-red-700'    },
    'grace_period':{ label: 'Grace Period', bg: 'bg-zinc-100',   text: 'text-zinc-600'   },
  };

  const buildWaMsg = (r) => {
    const name = r.company_name || r.full_name || r.user_email;
    const planName = r.plan?.toUpperCase() ?? 'PRO';
    const expDate = r.plan_expires_at
      ? new Date(r.plan_expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : '—';
    const graceEnd = r.grace_period_ends_at
      ? new Date(r.grace_period_ends_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : '—';

    if (r.reminder_type === 'grace_period') {
      return encodeURIComponent(
        `Halo ${name}! 👋\n\nPaket *${planName}* Anda di naikcetak sudah berakhir.\n\n` +
        `⚠️ Anda masih bisa mengakses semua fitur hingga *${graceEnd}* (grace period 3 hari).\n\n` +
        `Perpanjang sekarang agar akses tidak terputus:\n👉 Hubungi admin untuk konfirmasi perpanjangan.\n\n` +
        `Terima kasih! 🙏`
      );
    }
    const days = r.reminder_type === '7_days' ? '7 hari' : r.reminder_type === '3_days' ? '3 hari' : '1 hari';
    return encodeURIComponent(
      `Halo ${name}! 👋\n\nIni pengingat dari naikcetak 🖨\n\n` +
      `Paket *${planName}* Anda akan berakhir pada *${expDate}* (${days} lagi).\n\n` +
      `Perpanjang sekarang agar tidak terputus akses:\n👉 Hubungi admin untuk konfirmasi.\n\n` +
      `Ada pertanyaan? Balas pesan ini. Terima kasih! 🙏`
    );
  };

  if (loading) return (
    <div className="card p-12 flex items-center justify-center gap-3 text-zinc-400">
      <Loader2 size={18} className="animate-spin" /><span className="text-sm">Memuat...</span>
    </div>
  );

  if (reminders.length === 0) return (
    <div className="card p-12 text-center text-zinc-400 text-sm">
      Tidak ada user yang perlu diingatkan saat ini.
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-zinc-500">{reminders.length} user perlu dihubungi</p>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handlePreviewEmails} className="btn-ghost text-sm">
            Preview Email Starter
          </button>
          <button
            onClick={handleSendEmails}
            disabled={emailSending}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            {emailSending && <Loader2 size={13} className="animate-spin" />}
            Kirim Email Starter
          </button>
          <button onClick={fetch} disabled={loading} className="btn-ghost flex items-center gap-1.5 text-sm">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>
      {emailPreview && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Preview email siap untuk <strong>{emailPreview.candidateCount ?? 0} user</strong>.
        </div>
      )}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500">User</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Plan</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Jenis Reminder</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Expire</th>
                <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {reminders.map((r, i) => {
                const key   = `${r.user_id}:${r.reminder_type}`;
                const meta  = REMINDER_META[r.reminder_type] ?? REMINDER_META['7_days'];
                const done  = sent.has(key);
                const phone = r.phone_number?.replace(/\D/g, '').replace(/^0/, '62');
                return (
                  <tr key={i} className={`border-b border-zinc-100 transition-colors ${done ? 'opacity-40' : 'hover:bg-zinc-50/50'}`}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-zinc-800">{r.company_name || r.full_name || '—'}</p>
                      <p className="text-xs text-zinc-400">{r.user_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold" style={{ color: PLAN_COLOR[r.plan] }}>
                        {r.plan?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${meta.bg} ${meta.text}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {r.plan_expires_at ? new Date(r.plan_expires_at).toLocaleDateString('id-ID') : (
                        r.grace_period_ends_at ? `Grace s/d ${new Date(r.grace_period_ends_at).toLocaleDateString('id-ID')}` : '—'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {phone ? (
                          <a href={`https://wa.me/${phone}?text=${buildWaMsg(r)}`}
                            target="_blank" rel="noopener noreferrer"
                            onClick={() => handleSent(r)}
                            className="flex items-center gap-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg transition-colors">
                            <Phone size={11} /> Kirim WA
                          </a>
                        ) : (
                          <span className="text-xs text-zinc-300">No HP tidak ada</span>
                        )}
                        {!done && (
                          <button onClick={() => handleSent(r)}
                            className="text-xs text-zinc-400 hover:text-zinc-600 px-2 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors">
                            Tandai Terkirim
                          </button>
                        )}
                        {done && <span className="text-xs text-emerald-600 font-semibold">✓ Terkirim</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-zinc-400">
        Catatan: Klik "Kirim WA" akan membuka WhatsApp dengan pesan sudah terisi. Setelah kirim, status otomatis ditandai.
      </p>
    </div>
  );
}

// ── Tab: Upgrade Requests ─────────────────────────────────────────────────────
function UpgradeRequestsTab({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('pending');
  const [search,   setSearch]   = useState('');
  const [sort,     setSort]     = useState('newest');

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
      return (r.user_email ?? '').toLowerCase().includes(q) || (r.user_name ?? '').toLowerCase().includes(q);
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
    cancelled: requests.filter(r => r.status === 'cancelled').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-zinc-500">
          {counts.pending} menunggu · {counts.approved} disetujui · {counts.rejected} ditolak · {counts.cancelled} dibatalkan
        </p>
        <button onClick={fetchRequests} disabled={loading} className="flex items-center gap-2 btn-ghost text-sm">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex bg-zinc-100 rounded-lg p-1 gap-1">
          {[['all', 'Semua'], ['pending', 'Menunggu'], ['approved', 'Disetujui'], ['rejected', 'Ditolak'], ['cancelled', 'Dibatalkan']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${filter === val ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}>
              {label}
              {val === 'pending' && counts.pending > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">{counts.pending}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input className="input-field pl-8 text-sm py-1.5" placeholder="Cari nama / email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)} className="input-field text-xs py-1.5 w-auto">
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
          <option value="highest">Nominal Tertinggi</option>
        </select>
      </div>

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
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 hidden md:table-cell">Pembayaran</th>
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

function FollowUpComposer({ targetUser, onClose }) {
  const [templates, setTemplates] = useState(() => getStoredFollowUpTemplates());

  const phone = normalizePhone(targetUser.phone_number);

  const setTemplate = (index, value) => {
    setTemplates(prev => {
      const next = [...prev];
      next[index] = value;
      saveFollowUpTemplates(next);
      return next;
    });
  };

  const openWhatsApp = (index) => {
    const text = buildFollowUpText(templates[index], targetUser);
    const baseUrl = phone ? `https://wa.me/${phone}` : 'https://wa.me/';
    window.open(`${baseUrl}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: 12, opacity: 0.96 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0.96 }}
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <h3 className="text-base font-bold text-zinc-900">Follow Up Text</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Atur 5 pesan follow-up untuk {targetUser.full_name || targetUser.email}. Klik tombol WhatsApp untuk mengirim manual.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors">
            <XCircle size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-emerald-50 px-3 py-2">
            <button
              type="button"
              onClick={() => openWhatsApp(0)}
              className="w-10 h-10 rounded-full bg-white text-emerald-600 border border-emerald-200 flex items-center justify-center hover:bg-emerald-100 transition-colors"
              title="Kirim follow-up 1 via WhatsApp"
            >
              <Phone size={18} />
            </button>
            {templates.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => openWhatsApp(index)}
                className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-700 font-bold text-sm hover:bg-zinc-200 transition-colors"
                title={`Kirim follow-up ${index + 1}`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {!phone && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Nomor WhatsApp user belum ada. Tombol kirim tetap membuka WhatsApp, tetapi Anda perlu memilih kontak secara manual.
            </div>
          )}

          <div className="space-y-4">
            {templates.map((template, index) => (
              <div key={index} className="rounded-2xl border border-zinc-200 p-4 bg-zinc-50/60">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-sm font-bold text-zinc-700">
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold text-zinc-800">Follow-up {index + 1}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openWhatsApp(index)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg transition-colors"
                  >
                    <MessageCircle size={13} /> WhatsApp
                  </button>
                </div>
                <textarea
                  value={template}
                  onChange={(e) => setTemplate(index, e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm resize-y focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Tab: Kelola User ──────────────────────────────────────────────────────────
function ManageUsersTab({ user }) {
  const [users,       setUsers]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [upgradeTarget, setUpgradeTarget] = useState(null);
  const [followUpTarget, setFollowUpTarget] = useState(null);

  // Add user form state
  const [newName,     setNewName]     = useState('');
  const [newEmail,    setNewEmail]    = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating,    setCreating]    = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminGetAllUsers();
      setUsers(data);
    } catch (err) {
      alert('Gagal memuat user: ' + err.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) { alert('Password minimal 8 karakter.'); return; }
    setCreating(true);
    try {
      await adminCreateUser(newEmail, newPassword, newName);
      alert(`User ${newEmail} berhasil dibuat. Bisa langsung login.`);
      setNewName(''); setNewEmail(''); setNewPassword('');
      setShowAddForm(false);
      fetchUsers();
    } catch (err) {
      alert('Gagal membuat user: ' + err.message);
    } finally { setCreating(false); }
  };

  const handleDelete = async (u) => {
    if (!confirm(`Hapus user ${u.email}? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await adminDeleteUser(u.id);
      setUsers(prev => prev.filter(x => x.id !== u.id));
    } catch (err) {
      alert('Gagal hapus: ' + err.message);
    }
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.email ?? '').toLowerCase().includes(q) || (u.full_name ?? '').toLowerCase().includes(q);
  });

  const PLAN_COLOR = { starter: '#6B7280', pro: '#2563EB', business: '#D97706' };

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input className="input-field pl-8 text-sm py-1.5" placeholder="Cari nama / email..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button onClick={fetchUsers} disabled={loading} className="btn-ghost flex items-center gap-1.5 text-sm">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setShowAddForm(v => !v)}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors">
            <UserPlus size={14} />
            {showAddForm ? 'Tutup' : 'Tambah User'}
            {showAddForm ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* Add user form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="card p-5 border-2 border-dashed border-zinc-300 bg-zinc-50/50">
            <h3 className="font-bold text-zinc-800 mb-4 flex items-center gap-2">
              <UserPlus size={15} /> Tambah User Manual
            </h3>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Nama Lengkap</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  required placeholder="Nama user" className="input-field text-sm py-2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Email</label>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  required placeholder="email@contoh.com" className="input-field text-sm py-2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-600 mb-1">Password Awal (min. 8 karakter)</label>
                <input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  required placeholder="Password langsung bisa dipakai" className="input-field text-sm py-2" />
              </div>
              <div className="sm:col-span-3 flex justify-end">
                <button type="submit" disabled={creating}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
                  {creating ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
                  {creating ? 'Membuat...' : 'Buat Akun Sekarang'}
                </button>
              </div>
            </form>
            <p className="text-xs text-zinc-400 mt-2">
              ✓ User langsung bisa login — tidak perlu verifikasi email.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User table */}
      {loading ? (
        <div className="card p-12 flex items-center justify-center gap-3 text-zinc-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Memuat data user...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-zinc-400 text-sm">
          {search ? 'Tidak ada user yang cocok.' : 'Belum ada user.'}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500">User</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Plan</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 hidden md:table-cell">Bergabung</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500 hidden lg:table-cell">Aktif Hingga</th>
                  <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-zinc-800">{u.full_name || '—'}</p>
                      <p className="text-xs text-zinc-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-bold" style={{ color: PLAN_COLOR[u.plan] ?? '#374151' }}>
                        {PLANS[u.plan]?.name ?? u.plan ?? 'Starter'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400 hidden md:table-cell">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400 hidden lg:table-cell">
                      {u.plan_expires_at ? new Date(u.plan_expires_at).toLocaleDateString('id-ID') : (u.plan === 'starter' ? 'Selamanya' : '—')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        <button onClick={() => setResetTarget(u)}
                          className="flex items-center gap-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1.5 rounded-lg transition-colors">
                          <KeyRound size={11} /> Reset PW
                        </button>
                        <button onClick={() => setUpgradeTarget(u)}
                          className="flex items-center gap-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-1.5 rounded-lg transition-colors">
                          <Zap size={11} /> Upgrade
                        </button>
                        {u.plan === 'starter' && (
                          <button onClick={() => setFollowUpTarget(u)}
                            className="flex items-center gap-1 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 px-2 py-1.5 rounded-lg transition-colors">
                            <MessageCircle size={11} /> Follow Up
                          </button>
                        )}
                        <button onClick={() => handleDelete(u)}
                          className="flex items-center gap-1 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1.5 rounded-lg transition-colors">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-zinc-100 bg-zinc-50">
            <p className="text-xs text-zinc-400">{filtered.length} user</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {resetTarget && (
          <ResetPasswordModal targetUser={resetTarget}
            onDone={() => { setResetTarget(null); }}
            onCancel={() => setResetTarget(null)} />
        )}
        {upgradeTarget && (
          <UpgradeUserModal targetUser={upgradeTarget}
            onDone={() => { setUpgradeTarget(null); fetchUsers(); }}
            onCancel={() => setUpgradeTarget(null)} />
        )}
        {followUpTarget && (
          <FollowUpComposer
            targetUser={followUpTarget}
            onClose={() => setFollowUpTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminUpgrades({ user }) {
  const [tab,   setTab]   = useState('requests');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getSubscriptionStats().then(setStats).catch(() => {});
  }, []);

  const fmtRp = (n) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n ?? 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-zinc-700" />
          <h2 className="text-lg font-bold text-zinc-900">Admin Panel</h2>
        </div>
        {stats && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
            <TrendingUp size={13} className="text-emerald-600" />
            <span className="text-sm font-bold text-emerald-700">Est. MRR: {fmtRp(stats.mrr_estimate)}</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Tabs */}
      <div className="flex bg-zinc-100 rounded-xl p-1 gap-1 flex-wrap">
        {[
          { id: 'requests',      label: 'Upgrade Requests', icon: CheckCircle2 },
          { id: 'users',         label: 'Kelola User',      icon: Users        },
          { id: 'reminders',     label: 'Reminders',        icon: Bell         },
          { id: 'subscriptions', label: 'Subscriptions',    icon: TrendingUp   },
          { id: 'partners',      label: 'Partners',         icon: Users        },
          { id: 'payouts',       label: 'Payouts',          icon: Wallet       },
          { id: 'seo',           label: 'SEO Website',      icon: Globe2       },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
              tab === id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'requests'      && <UpgradeRequestsTab        user={user} />}
      {tab === 'users'         && <ManageUsersTab            user={user} />}
      {tab === 'reminders'     && <RemindersTab              user={user} />}
      {tab === 'subscriptions' && <AdminSubscriptionDashboard />}
      {tab === 'partners'      && <PartnersTab />}
      {tab === 'payouts'       && <PayoutsTab />}
      {tab === 'seo'           && <SiteSettingsPanel user={user} />}
    </div>
  );
}
