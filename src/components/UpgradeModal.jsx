import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2, CheckCircle2, Copy, Upload, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { PLANS, PAYMENT_INFO, getEffectivePrice } from '../lib/plans';
import { submitUpgradeRequest, uploadPaymentProof } from '../lib/supabase';

// ── Pro features grid ─────────────────────────────────────────────────────────
const PRO_FEATURES = [
  [
    { label: 'Potong Kertas',         desc: 'tidak terbatas' },
    { label: 'Hitung Cetakan',        desc: 'tidak terbatas' },
    { label: 'Export PDF Invoice',    desc: '+ Quotation profesional' },
    { label: 'Groq AI',               desc: 'Brief Analyzer & Email' },
    { label: 'WhatsApp Integration',  desc: 'kirim langsung dari app' },
  ],
  [
    { label: 'Master Kertas',         desc: 'tidak terbatas' },
    { label: 'Master Finishing & Mesin', desc: 'database lengkap' },
    { label: 'Riwayat kalkulasi',     desc: '1 tahun penuh' },
    { label: '3 akun tim',            desc: 'kolaborasi bersama' },
    { label: 'Tracking Order publik', desc: 'klien pantau sendiri' },
    { label: 'Support prioritas WA',  desc: 'respons lebih cepat' },
  ],
];

const STARTER_FEATURES = [
  { ok: true,  label: 'Potong Kertas — 10x/bulan' },
  { ok: true,  label: 'Hitung Cetakan — 5x/bulan' },
  { ok: true,  label: 'Master Kertas — maks 5 jenis' },
  { ok: true,  label: '1 akun pengguna' },
  { ok: false, label: 'Groq AI features' },
  { ok: false, label: 'Export PDF Invoice' },
  { ok: false, label: 'Quotation & Tracking Order' },
  { ok: false, label: 'Penggunaan tidak terbatas' },
];

// ── Billing toggle ────────────────────────────────────────────────────────────
function BillingToggle({ cycle, onChange }) {
  return (
    <div className="inline-flex items-center bg-blue-100/70 rounded-full p-1 gap-0.5">
      {[['monthly','Bulanan'],['yearly','Tahunan']].map(([val, label]) => (
        <button key={val} type="button" onClick={() => onChange(val)}
          className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            cycle === val ? 'bg-white shadow text-blue-700' : 'text-blue-500 hover:text-blue-700'
          }`}>
          {label}
          {val === 'yearly' && (
            <span className="ml-1.5 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              HEMAT 34%
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Comparison view (Step 0) ──────────────────────────────────────────────────
function ComparisonView({ cycle, onCycleChange, onUpgrade }) {
  const [showPayInfo, setShowPayInfo] = useState(false);
  const proPrice     = getEffectivePrice('pro', cycle);
  const proNormal    = PLANS.pro.prices[cycle === 'monthly' ? 'monthly' : 'yearly'];
  const isEarlyBird  = PLANS.pro.earlyBird.active;

  return (
    <div className="flex flex-col md:flex-row overflow-hidden">
      {/* ── Left: Starter ── */}
      <div className="md:w-[35%] p-6 border-b md:border-b-0 md:border-r border-zinc-100 flex flex-col shrink-0">
        <div className="flex-1">
          <span className="inline-block text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-100 px-2.5 py-1 rounded-full mb-3">
            PAKET SAAT INI
          </span>
          <h3 className="text-xl font-bold text-zinc-900 mb-1">Starter</h3>
          <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
            Akses terbatas untuk mengenal fitur dasar naikcetak.
          </p>

          <div className="mb-5">
            <span className="text-4xl font-black text-zinc-900">Rp 0</span>
            <span className="text-sm text-zinc-400 ml-1">/selamanya</span>
          </div>

          <ul className="space-y-2">
            {STARTER_FEATURES.map(({ ok, label }) => (
              <li key={label} className="flex items-start gap-2 text-xs">
                {ok
                  ? <Check size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                  : <X     size={13} className="text-red-400 shrink-0 mt-0.5" />
                }
                <span className={ok ? 'text-zinc-700' : 'text-zinc-400 line-through'}>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <button disabled
          className="mt-6 w-full py-2.5 bg-zinc-100 text-zinc-400 text-xs font-bold rounded-xl cursor-not-allowed tracking-wide">
          PAKET ANDA SAAT INI
        </button>
      </div>

      {/* ── Right: Pro ── */}
      <div className="flex-1 bg-gradient-to-br from-white to-[#EFF6FF] p-6 flex flex-col relative">
        {/* Popular badge */}
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center gap-1 bg-[#F59E0B] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow">
            ⭐ PALING DIMINATI
          </span>
        </div>

        <div className="flex-1">
          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-2">
            <Zap size={10} className="inline mr-1" />UNLOCK SEMUA FITUR
          </p>

          <h3 className="text-4xl font-black text-zinc-900 mb-1">
            naikcetak <span className="text-blue-600">PRO</span>
          </h3>

          <p className="text-sm text-zinc-500 mb-4 leading-relaxed">
            Hemat waktu berjam-jam setiap hari. Hitung lebih cepat, kelola lebih rapi.
          </p>

          {/* Billing toggle */}
          <div className="mb-4">
            <BillingToggle cycle={cycle} onChange={onCycleChange} />
          </div>

          {/* Price */}
          <div className="mb-5">
            {isEarlyBird && proNormal !== proPrice && (
              <span className="text-sm text-zinc-400 line-through mr-2">
                Rp {proNormal.toLocaleString('id-ID')}
              </span>
            )}
            <span className="text-4xl font-black text-blue-600">
              Rp {proPrice.toLocaleString('id-ID')}
            </span>
            <span className="text-sm text-zinc-500 ml-1">/{cycle === 'monthly' ? 'bulan' : 'bulan'}</span>
            {cycle === 'yearly' && (
              <p className="text-xs text-zinc-400 mt-0.5">
                (Rp {getEffectivePrice('pro', 'yearly').toLocaleString('id-ID')}/tahun)
              </p>
            )}
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {PRO_FEATURES.map((col, ci) => (
              <div key={ci} className="space-y-2.5">
                {col.map(({ label, desc }) => (
                  <div key={label} className="flex items-start gap-1.5">
                    <Check size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-zinc-800 leading-tight">{label}</p>
                      <p className="text-[10px] text-zinc-400 leading-tight">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6">
          <motion.button
            onClick={onUpgrade}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg hover:shadow-blue-200">
            ⚡ UPGRADE KE PRO SEKARANG
          </motion.button>

          <p className="text-[11px] text-center text-zinc-400 mt-2 leading-relaxed">
            💰 Hemat 34% jika bayar tahunan · Aktivasi maksimal 1×24 jam · Transfer ke rekening naikcetak
          </p>

          {/* Collapsible payment info */}
          <button type="button" onClick={() => setShowPayInfo(v => !v)}
            className="w-full flex items-center justify-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-600 mt-2 transition-colors">
            ℹ Cara upgrade
            {showPayInfo ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          <AnimatePresence>
            {showPayInfo && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-hidden">
                <div className="bg-blue-50 rounded-xl px-4 py-3 mt-2 text-[11px] text-blue-700 leading-relaxed">
                  Pilih plan → Transfer ke rekening naikcetak → Upload bukti transfer → Admin aktivasi akun Anda dalam 1×24 jam hari kerja.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Payment steps (Step 1–4) ──────────────────────────────────────────────────
const STEP_LABELS = ['Pembayaran', 'Transfer', 'Bukti', 'Selesai'];

function StepBar({ current }) {
  return (
    <div className="flex items-center gap-1 px-6 py-3 border-b border-zinc-100">
      {STEP_LABELS.map((label, i) => (
        <div key={i} className="flex items-center gap-1 flex-1 last:flex-none">
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
            i < current  ? 'bg-emerald-500 text-white' :
            i === current ? 'bg-zinc-900 text-white' :
                           'bg-zinc-100 text-zinc-400'
          }`}>
            {i < current ? <Check size={10} /> : i + 1}
          </div>
          <span className={`text-[10px] hidden sm:block ${i === current ? 'font-semibold text-zinc-800' : 'text-zinc-400'}`}>
            {label}
          </span>
          {i < STEP_LABELS.length - 1 && <div className="flex-1 h-px bg-zinc-100 mx-1" />}
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function UpgradeModal({ user, currentPlan = 'starter', onClose, onSuccess }) {
  const [step,          setStep]          = useState(0);
  const [cycle,         setCycle]         = useState('yearly');
  const [paymentMethod, setPaymentMethod] = useState('transfer_bca');
  const [paymentNotes,  setPaymentNotes]  = useState('');
  const [requestId,     setRequestId]     = useState(null);
  const [proofFile,     setProofFile]     = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [copied,        setCopied]        = useState(false);

  const price      = getEffectivePrice('pro', cycle);
  const planConfig = PLANS.pro;

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const copyNo = useCallback(() => {
    navigator.clipboard.writeText(PAYMENT_INFO.accountNumber);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }, []);

  const waLink = (type = 'upload') => {
    const msg = type === 'upload'
      ? `Halo admin naikcetak! Saya sudah transfer untuk upgrade ke paket Pro (${cycle === 'monthly' ? 'bulanan' : 'tahunan'}). ID Request: ${requestId}. Mohon dikonfirmasi ya 🙏`
      : `Halo admin naikcetak! Saya ingin upgrade ke paket Pro. Apakah masih tersedia?`;
    return `https://wa.me/${PAYMENT_INFO.whatsappAdmin}?text=${encodeURIComponent(msg)}`;
  };

  const handleSubmitRequest = async () => {
    setLoading(true); setError('');
    try {
      const req = await submitUpgradeRequest(user.id, {
        requestedPlan: 'pro', billingCycle: cycle,
        paymentMethod, paymentNotes, amountToPay: price,
        userEmail: user.email,
        userName: user.user_metadata?.full_name ?? user.email,
      });
      setRequestId(req.id);
      setStep(3); // skip to upload (step 3 = index 2 in STEP_LABELS)
    } catch (err) {
      setError(err.message || 'Gagal mengirim permintaan');
    } finally { setLoading(false); }
  };

  const handleUploadProof = async () => {
    if (!proofFile || !requestId) return;
    setLoading(true); setError('');
    try {
      await uploadPaymentProof(user.id, requestId, proofFile);
      setStep(4);
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Gagal upload bukti');
    } finally { setLoading(false); }
  };

  // Payment step index is offset by 1 (step 1 = StepBar index 0)
  const stepBarIndex = step - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        layout
        className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col ${
          step === 0 ? 'max-w-4xl max-h-[92vh]' : 'max-w-lg max-h-[92vh]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
          <h2 className="font-bold text-zinc-900 text-sm">
            {step === 0 ? 'Pilih Paket naikcetak' : 'Upgrade ke Pro'}
          </h2>
          <button onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Step bar (only for payment steps) */}
        {step > 0 && step < 5 && <StepBar current={stepBarIndex} />}

        {/* Content */}
        <div className={`overflow-y-auto flex-1 ${step > 0 ? 'p-6' : ''}`}>

          {/* ── STEP 0: Comparison ── */}
          {step === 0 && (
            <ComparisonView
              cycle={cycle}
              onCycleChange={setCycle}
              onUpgrade={() => setStep(1)}
            />
          )}

          {/* ── STEP 1: Billing ── */}
          {step === 1 && (
            <div className="space-y-5">
              <p className="text-sm text-zinc-500">
                Pilih siklus pembayaran untuk paket <strong>Pro</strong>
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { val: 'monthly', label: 'Bulanan',  note: '' },
                  { val: 'yearly',  label: 'Tahunan',  note: 'Hemat ~34%' },
                ].map(({ val, label, note }) => {
                  const p = getEffectivePrice('pro', val);
                  return (
                    <button key={val} type="button" onClick={() => setCycle(val)}
                      className={`text-left rounded-xl border-2 p-4 transition-all ${
                        cycle === val ? 'border-blue-500 bg-blue-50' : 'border-zinc-200 hover:border-zinc-300'
                      }`}>
                      <p className="text-sm font-semibold text-zinc-800">{label}</p>
                      <p className="text-xl font-black text-zinc-900 mt-1">
                        Rp {p.toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-zinc-400">/{val === 'monthly' ? 'bulan' : 'tahun'}</p>
                      {note && (
                        <span className="mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                          {note}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Metode Transfer</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                  <option value="transfer_bca">Transfer BCA</option>
                  <option value="transfer_mandiri">Transfer Mandiri</option>
                  <option value="transfer_bri">Transfer BRI</option>
                  <option value="transfer_bni">Transfer BNI</option>
                  <option value="qris">QRIS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Catatan (opsional)</label>
                <textarea className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  rows={2} placeholder="Nama / perusahaan untuk memudahkan verifikasi..."
                  value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} />
              </div>

              <div className="bg-zinc-50 rounded-xl px-4 py-3 flex justify-between text-sm">
                <span className="text-zinc-600">Pro · {cycle === 'monthly' ? 'Bulanan' : 'Tahunan'}</span>
                <span className="font-black text-zinc-900">Rp {price.toLocaleString('id-ID')}</span>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(0)} className="px-4 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:bg-zinc-50 transition-colors">
                  ← Kembali
                </button>
                <button onClick={() => setStep(2)} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors">
                  Lihat Info Transfer →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Transfer info ── */}
          {step === 2 && (
            <div className="space-y-5">
              <p className="text-sm text-zinc-500">Transfer ke rekening berikut, lalu klik "Sudah Transfer"</p>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Rekening Tujuan</p>
                {[['Bank', PAYMENT_INFO.bank],['Atas Nama', PAYMENT_INFO.accountName]].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm">
                    <span className="text-zinc-500">{l}</span>
                    <span className="font-bold text-zinc-900">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm items-center">
                  <span className="text-zinc-500">No. Rekening</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-zinc-900">{PAYMENT_INFO.accountNumber}</span>
                    <button onClick={copyNo} className="text-zinc-400 hover:text-blue-600 transition-colors">
                      {copied ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
                <div className="border-t border-blue-200 pt-3 flex justify-between">
                  <span className="text-sm font-semibold text-zinc-700">Total Transfer</span>
                  <span className="text-lg font-black text-blue-700">Rp {price.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
                <strong>⚠ Penting:</strong> Transfer tepat nominal di atas agar verifikasi lebih cepat.
              </div>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="px-4 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:bg-zinc-50 transition-colors">
                  ← Kembali
                </button>
                <button onClick={handleSubmitRequest} disabled={loading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                  {loading && <Loader2 size={13} className="animate-spin" />}
                  Sudah Transfer →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Upload bukti ── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="text-center">
                <CheckCircle2 size={36} className="text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-zinc-800">Permintaan upgrade tercatat!</p>
                <p className="text-xs text-zinc-400 mt-0.5 font-mono">ID: {requestId}</p>
              </div>

              <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 rounded-xl p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                <Upload size={20} className="text-zinc-400 mb-2" />
                <p className="text-sm text-zinc-600 font-semibold">
                  {proofFile ? proofFile.name : 'Upload screenshot bukti transfer'}
                </p>
                <p className="text-xs text-zinc-400 mt-1">JPG, PNG, atau PDF · Maks 5MB</p>
                <input type="file" accept="image/*,.pdf" className="hidden"
                  onChange={e => setProofFile(e.target.files?.[0] ?? null)} />
              </label>

              <p className="text-xs text-center text-zinc-400">
                Atau konfirmasi langsung via{' '}
                <a href={waLink('upload')} target="_blank" rel="noopener noreferrer"
                  className="text-emerald-600 font-semibold hover:underline">
                  WhatsApp Admin
                </a>
              </p>

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <div className="flex gap-2">
                <button onClick={onClose} className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:bg-zinc-50 transition-colors">
                  Nanti Saja
                </button>
                <button onClick={handleUploadProof} disabled={!proofFile || loading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                  {loading && <Loader2 size={13} className="animate-spin" />}
                  Upload Bukti →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Selesai ── */}
          {step === 4 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-lg">Bukti Transfer Diterima! 🎉</h3>
                <p className="text-sm text-zinc-500 mt-1 max-w-xs mx-auto">
                  Admin akan memverifikasi dalam <strong>1×24 jam</strong> hari kerja dan mengaktifkan akun Anda.
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 text-left">
                <p className="text-xs font-bold text-blue-700 mb-2 uppercase tracking-wider">Langkah Selanjutnya</p>
                <ol className="text-xs text-blue-600 space-y-1.5">
                  <li>1. Admin verifikasi pembayaran</li>
                  <li>2. Akun diaktifkan + notifikasi WA</li>
                  <li>3. Login ulang untuk melihat fitur aktif</li>
                </ol>
              </div>

              <a href={waLink('upload')} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl text-sm transition-colors">
                📲 Chat WA Admin untuk konfirmasi cepat
              </a>
              <button onClick={onClose}
                className="w-full py-3 border border-zinc-200 text-zinc-600 rounded-xl hover:bg-zinc-50 text-sm transition-colors">
                Tutup & Kembali ke Dashboard
              </button>
            </div>
          )}

        </div>
      </motion.div>
    </motion.div>
  );
}
