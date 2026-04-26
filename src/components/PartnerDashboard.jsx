import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Copy, Check, Loader2, RefreshCw, Wallet, Clock,
  XCircle, Send, AlertCircle, ExternalLink,
  TrendingUp, ShieldCheck, Hourglass, Banknote, Share2,
} from 'lucide-react';
import {
  ensureReferralCode, getPartnerSummary, getPartnerCommissions,
  requestPayout, getUserPayoutRequests,
} from '../lib/supabase';
import { formatRp } from '../lib/masterData';

const STATUS_META = {
  awaiting_partner_approval: { label: 'Menunggu Aktivasi Partner', bg: 'bg-zinc-100',    text: 'text-zinc-600',    dot: 'bg-zinc-400'   },
  pending:                   { label: 'Pending (7 hari)',          bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-400'  },
  available:                 { label: 'Siap Cair',                 bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  paid:                      { label: 'Sudah Dibayar',             bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500'   },
  clawed_back:               { label: 'Dibatalkan',                bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500'    },
};

const PAYOUT_STATUS_META = {
  pending:  { label: 'Menunggu Review', bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-400'   },
  approved: { label: 'Disetujui',       bg: 'bg-blue-100',    text: 'text-blue-700',    dot: 'bg-blue-500'    },
  paid:     { label: 'Sudah Ditransfer',bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  rejected: { label: 'Ditolak',         bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500'     },
};

const PARTNER_STATUS_META = {
  pending:  { label: 'Menunggu persetujuan admin', bg: 'bg-amber-50',   border: 'border-amber-200',  text: 'text-amber-800',   icon: Hourglass },
  approved: { label: 'Partner Aktif',              bg: 'bg-emerald-50', border: 'border-emerald-200',text: 'text-emerald-800', icon: ShieldCheck },
  rejected: { label: 'Pengajuan Ditolak',          bg: 'bg-red-50',     border: 'border-red-200',    text: 'text-red-800',     icon: XCircle },
};

function StatusBadge({ status, meta = STATUS_META }) {
  const m = meta[status] ?? meta.pending ?? Object.values(meta)[0];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function CodeCard({ code, partnerStatus, rejectionReason }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/?ref=${code}`;
  const meta = PARTNER_STATUS_META[partnerStatus] ?? PARTNER_STATUS_META.pending;
  const Icon = meta.icon;

  const copy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const share = () => {
    const text = `Halo! Coba NaikCetak — kalkulator HPP & manajemen percetakan all-in-one. Daftar pakai link saya: ${link}`;
    if (navigator.share) {
      navigator.share({ title: 'NaikCetak Elite Partner', text, url: link }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    }
  };

  return (
    <div className="card p-5 space-y-4">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${meta.bg} ${meta.border} ${meta.text}`}>
        <Icon size={14} />
        <span className="text-xs font-semibold">{meta.label}</span>
      </div>

      {partnerStatus === 'rejected' && rejectionReason && (
        <p className="text-xs text-red-600 -mt-2">Alasan: {rejectionReason}</p>
      )}

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Kode Referral Anda</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 font-mono text-2xl font-bold text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-center tracking-wider">
            {code}
          </code>
          <button onClick={() => copy(code)}
            className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold bg-zinc-900 hover:bg-zinc-700 text-white rounded-lg transition-colors">
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Tersalin' : 'Salin'}
          </button>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Link Referral</p>
        <div className="flex items-center gap-2">
          <input readOnly value={link}
            className="flex-1 input-field font-mono text-xs" />
          <button onClick={() => copy(link)}
            className="px-3 py-2 text-xs font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg transition-colors">
            <Copy size={12} />
          </button>
          <button onClick={share}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
            <Share2 size={12} /> Bagikan
          </button>
        </div>
      </div>

      <p className="text-[11px] text-zinc-500 leading-relaxed">
        Setiap user yang upgrade ke Pro/Business via link Anda → Anda dapat komisi otomatis.
        Komisi ditahan 7 hari sebelum siap dicairkan (anti-refund).
      </p>
    </div>
  );
}

function StatsCards({ summary }) {
  if (!summary) return null;

  const cards = [
    { label: 'Total Referral',  value: summary.total_referrals ?? 0,                 sub: `${summary.paying_referrals ?? 0} membayar`, Icon: Users,      color: 'bg-zinc-100 text-zinc-700' },
    { label: 'Menunggu Aktivasi',value: formatRp(summary.awaiting_amount ?? 0),       sub: 'Belum dihitung',                            Icon: Hourglass,  color: 'bg-zinc-100 text-zinc-600' },
    { label: 'Pending (7 hari)',value: formatRp(summary.pending_amount ?? 0),         sub: 'Sedang matang',                             Icon: Clock,      color: 'bg-amber-100 text-amber-700' },
    { label: 'Siap Cair',       value: formatRp(summary.available_amount ?? 0),       sub: 'Bisa dicairkan',                            Icon: Wallet,     color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Sudah Dibayar',   value: formatRp(summary.paid_amount ?? 0),            sub: 'Lifetime payout',                           Icon: Banknote,   color: 'bg-blue-100 text-blue-700' },
    { label: 'Total Lifetime',  value: formatRp(summary.lifetime_amount ?? 0),        sub: 'Semua komisi valid',                        Icon: TrendingUp, color: 'bg-purple-100 text-purple-700' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(({ label, value, sub, Icon, color }) => (
        <div key={label} className="card p-3 flex flex-col gap-1.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
            <Icon size={13} />
          </div>
          <p className="text-sm sm:text-base font-bold text-zinc-900 leading-tight break-words">{value}</p>
          <p className="text-[11px] font-semibold text-zinc-700 leading-tight">{label}</p>
          <p className="text-[10px] text-zinc-400 leading-tight">{sub}</p>
        </div>
      ))}
    </div>
  );
}

function PayoutModal({ summary, onClose, onDone }) {
  const available = summary?.available_amount ?? 0;
  const reserved  = summary?.pending_payout   ?? 0;
  const max       = Math.max(0, available - reserved);

  const [amount, setAmount]                = useState('');
  const [bankName, setBankName]            = useState('');
  const [accountNumber, setAccountNumber]  = useState('');
  const [accountName, setAccountName]      = useState('');
  const [notes, setNotes]                  = useState('');
  const [loading, setLoading]              = useState(false);
  const [error, setError]                  = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const num = parseInt(amount, 10);
    if (!num || num < 100000) { setError('Minimum payout Rp 100.000'); return; }
    if (num > max)            { setError(`Melebihi saldo siap cair (Rp ${max.toLocaleString('id-ID')})`); return; }
    if (!bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      setError('Isi nama bank, nomor rekening, dan atas nama'); return;
    }

    setLoading(true); setError('');
    try {
      await requestPayout({
        amount: num, bankName: bankName.trim(),
        accountNumber: accountNumber.trim(), accountName: accountName.trim(),
        notes: notes.trim() || null,
      });
      onDone();
    } catch (err) {
      setError(err.message || 'Gagal mengajukan payout');
    } finally { setLoading(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-zinc-900 flex items-center gap-2">
          <Send size={16} className="text-emerald-600" /> Ajukan Pencairan Komisi
        </h3>

        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-800">
          <p>Saldo siap cair: <strong>{formatRp(available)}</strong></p>
          {reserved > 0 && <p>Sedang diproses: {formatRp(reserved)}</p>}
          <p>Maksimum bisa diajukan: <strong>{formatRp(max)}</strong></p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Jumlah (min Rp 100.000)</label>
            <input type="number" min={100000} step={1000} value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="100000" className="input-field" required />
          </div>

          <div>
            <label className="label">Nama Bank</label>
            <input type="text" value={bankName} onChange={e => setBankName(e.target.value)}
              placeholder="Contoh: BCA, Mandiri, BNI" className="input-field" required />
          </div>

          <div>
            <label className="label">Nomor Rekening</label>
            <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
              placeholder="1234567890" className="input-field font-mono" required />
          </div>

          <div>
            <label className="label">Atas Nama</label>
            <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)}
              placeholder="Nama sesuai rekening" className="input-field" required />
          </div>

          <div>
            <label className="label">Catatan (opsional)</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Catatan untuk admin..." className="input-field resize-none" />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
              <AlertCircle size={13} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Batal</button>
            <button type="submit" disabled={loading || max < 100000}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-50">
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              Ajukan
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function CommissionsTable({ commissions }) {
  if (!commissions.length) {
    return (
      <div className="card p-12 text-center text-zinc-400 text-sm">
        Belum ada komisi. Ajak teman pakai kode Anda untuk mulai dapat komisi.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Tanggal</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Referee</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 hidden md:table-cell">Tipe</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Komisi</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 hidden lg:table-cell">Cair pada</th>
            </tr>
          </thead>
          <tbody>
            {commissions.map(c => (
              <tr key={c.id} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">{formatDate(c.created_at)}</td>
                <td className="px-4 py-3 text-xs text-zinc-700 font-mono">{c.referee_email}</td>
                <td className="px-4 py-3 text-xs hidden md:table-cell">
                  <span className="text-zinc-600">{c.billing_cycle === 'yearly' ? 'Tahunan' : 'Bulanan'}</span>
                  <span className="text-zinc-400"> · {c.is_renewal ? 'Renewal' : 'First'}</span>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-zinc-900 whitespace-nowrap">{formatRp(c.commission_amount)}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3 text-xs text-zinc-500 hidden lg:table-cell whitespace-nowrap">
                  {c.status === 'pending' ? formatDate(c.available_at) :
                   c.status === 'paid'    ? formatDate(c.paid_at) :
                   '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PayoutHistory({ payouts }) {
  if (!payouts.length) {
    return (
      <div className="card p-12 text-center text-zinc-400 text-sm">
        Belum ada riwayat pencairan.
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200 text-left">
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Tanggal Ajuan</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Jumlah</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 hidden md:table-cell">Bank</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500">Status</th>
              <th className="px-4 py-3 text-xs font-semibold text-zinc-500 hidden lg:table-cell">Bukti / Catatan</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map(p => (
              <tr key={p.id} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">{formatDate(p.created_at)}</td>
                <td className="px-4 py-3 text-sm font-bold text-zinc-900 whitespace-nowrap">{formatRp(p.requested_amount)}</td>
                <td className="px-4 py-3 text-xs hidden md:table-cell">
                  <p className="text-zinc-700 font-semibold">{p.bank_name}</p>
                  <p className="text-zinc-500 font-mono">{p.bank_account_number}</p>
                  <p className="text-zinc-400">{p.bank_account_name}</p>
                </td>
                <td className="px-4 py-3"><StatusBadge status={p.status} meta={PAYOUT_STATUS_META} /></td>
                <td className="px-4 py-3 text-xs hidden lg:table-cell">
                  {p.payment_proof_url ? (
                    <a href={p.payment_proof_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                      <ExternalLink size={11} /> Lihat bukti
                    </a>
                  ) : p.admin_notes ? (
                    <span className="text-zinc-500">{p.admin_notes}</span>
                  ) : <span className="text-zinc-300">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PartnerDashboard() {
  const [loading, setLoading]           = useState(true);
  const [codeRow, setCodeRow]           = useState(null);
  const [summary, setSummary]           = useState(null);
  const [commissions, setCommissions]   = useState([]);
  const [payouts, setPayouts]           = useState([]);
  const [tab, setTab]                   = useState('commissions');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [error, setError]               = useState('');

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [code, sum, coms, pays] = await Promise.all([
        ensureReferralCode(),
        getPartnerSummary(),
        getPartnerCommissions(),
        getUserPayoutRequests(),
      ]);
      setCodeRow(code);
      setSummary(sum);
      setCommissions(coms);
      setPayouts(pays);
    } catch (err) {
      setError(err.message || 'Gagal memuat data partner');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  if (loading && !codeRow) {
    return (
      <div className="card p-12 flex items-center justify-center gap-3 text-zinc-400">
        <Loader2 size={18} className="animate-spin" /><span className="text-sm">Memuat dashboard partner...</span>
      </div>
    );
  }

  if (error && !codeRow) {
    return (
      <div className="card p-8 text-center space-y-3">
        <AlertCircle size={24} className="text-red-500 mx-auto" />
        <p className="text-sm text-red-600">{error}</p>
        <button onClick={refresh} className="btn-ghost mx-auto">Coba lagi</button>
      </div>
    );
  }

  const partnerStatus = codeRow?.approval_status ?? 'pending';
  const available     = summary?.available_amount ?? 0;
  const reserved      = summary?.pending_payout   ?? 0;
  const canRequest    = partnerStatus === 'approved' && (available - reserved) >= 100000;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users size={18} className="text-zinc-700" />
            <h2 className="text-lg font-bold text-zinc-900">NaikCetak Elite Partner</h2>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">Bagikan kode Anda. Dapatkan komisi tiap referral upgrade ke Pro/Business.</p>
        </div>
        <button onClick={refresh} disabled={loading} className="btn-ghost flex items-center gap-1.5 text-sm">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4">
        {codeRow && (
          <CodeCard
            code={codeRow.code}
            partnerStatus={partnerStatus}
            rejectionReason={codeRow.rejection_reason}
          />
        )}

        <div className="space-y-4">
          <StatsCards summary={summary} />

          <div className="card p-4 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-br from-emerald-50 to-emerald-100/40 border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <Wallet size={18} />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Saldo Siap Cair</p>
                <p className="text-xl font-bold text-zinc-900">{formatRp(Math.max(0, available - reserved))}</p>
                {reserved > 0 && <p className="text-[10px] text-emerald-700">Rp {reserved.toLocaleString('id-ID')} sedang diproses</p>}
              </div>
            </div>
            <button onClick={() => setShowPayoutModal(true)} disabled={!canRequest}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Send size={14} /> Ajukan Pencairan
            </button>
          </div>

          {!canRequest && partnerStatus === 'approved' && (
            <p className="text-xs text-zinc-500">
              Minimum pencairan Rp 100.000. Kumpulkan saldo "Siap Cair" terlebih dahulu.
            </p>
          )}
          {partnerStatus === 'pending' && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Akun partner Anda menunggu persetujuan admin. Anda boleh mulai membagikan kode — komisi akan dihitung dan diaktifkan setelah approval.
            </p>
          )}
        </div>
      </div>

      <div className="flex bg-zinc-100 rounded-xl p-1 gap-1">
        {[
          { id: 'commissions', label: 'Riwayat Komisi', icon: TrendingUp },
          { id: 'payouts',     label: 'Riwayat Payout', icon: Banknote },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
              tab === id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
            }`}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'commissions' && <CommissionsTable commissions={commissions} />}
      {tab === 'payouts'     && <PayoutHistory payouts={payouts} />}

      <AnimatePresence>
        {showPayoutModal && (
          <PayoutModal
            summary={summary}
            onClose={() => setShowPayoutModal(false)}
            onDone={() => { setShowPayoutModal(false); refresh(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
