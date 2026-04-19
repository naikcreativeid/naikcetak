import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2, CheckCircle2, Copy, Upload } from 'lucide-react';
import { PLANS, PAYMENT_INFO, getEffectivePrice } from '../lib/plans';
import { submitUpgradeRequest, uploadPaymentProof } from '../lib/supabase';

// ── Step indicator ────────────────────────────────────────────────────────────
const STEPS = ['Pilih Paket', 'Pembayaran', 'Transfer', 'Bukti', 'Selesai'];

function StepBar({ current }) {
  return (
    <div className="flex items-center gap-1 px-6 py-3 border-b border-zinc-100">
      {STEPS.map((label, i) => (
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
          {i < STEPS.length - 1 && <div className="flex-1 h-px bg-zinc-100 mx-1" />}
        </div>
      ))}
    </div>
  );
}

// ── Plan card ─────────────────────────────────────────────────────────────────
const PLAN_FEATURES = [
  ['kalkulatorHPP',       'Kalkulator HPP'],
  ['invoice',             'Generator Invoice'],
  ['quotation',           'Quotation + Countdown'],
  ['trackingOrder',       'Tracking Order'],
  ['exportPDF',           'Export PDF'],
  ['groqAI',              'Asisten AI'],
  ['groqAIIncluded',      'AI key sudah termasuk'],
  ['whatsappIntegration', 'Integrasi WhatsApp'],
  ['multiOutlet',         'Multi Outlet / Cabang'],
  ['prioritySupport',     'Priority Support'],
  ['onboardingCall',      'Onboarding Call'],
];

function PlanCard({ planId, selected, cycle, onSelect }) {
  const plan  = PLANS[planId];
  const price = getEffectivePrice(planId, cycle);
  const isEB  = plan.earlyBird.active;

  return (
    <button
      type="button"
      onClick={() => onSelect(planId)}
      className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
        selected === planId ? 'border-blue-500 bg-blue-50' : 'border-zinc-200 hover:border-zinc-300'
      }`}
    >
      <div className="flex items-start justify-between mb-2 gap-2">
        <div>
          <span className="font-bold text-zinc-900">{plan.name}</span>
          {isEB && (
            <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
              🔥 Early Bird
            </span>
          )}
          <p className="text-xs text-zinc-500 mt-0.5">{plan.tagline}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-black text-zinc-900">
            {price === 0 ? 'Gratis' : 'Rp\u00A0' + price.toLocaleString('id-ID')}
          </p>
          {price > 0 && (
            <p className="text-[10px] text-zinc-400">/{cycle === 'monthly' ? 'bulan' : 'tahun'}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-3">
        {PLAN_FEATURES.map(([key, label]) =>
          plan.features[key] ? (
            <div key={key} className="flex items-center gap-1 text-xs text-zinc-700">
              <Check size={10} className="text-emerald-500 shrink-0" />{label}
            </div>
          ) : null
        )}
      </div>
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function UpgradeModal({ user, currentPlan = 'starter', onClose, onSuccess }) {
  const [step, setStep]               = useState(0);
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [cycle, setCycle]             = useState('monthly');
  const [paymentMethod, setPaymentMethod] = useState('transfer_bca');
  const [paymentNotes, setPaymentNotes]   = useState('');
  const [requestId, setRequestId]     = useState(null);
  const [proofFile, setProofFile]     = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [copied, setCopied]           = useState(false);

  const price       = getEffectivePrice(selectedPlan, cycle);
  const planConfig  = PLANS[selectedPlan];

  const copyNo = () => {
    navigator.clipboard.writeText(PAYMENT_INFO.accountNumber);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const waLink = (type = 'upload') => {
    const msg = type === 'upload'
      ? `Halo admin naikcetak! Saya sudah transfer untuk upgrade ke paket ${planConfig.name} (${cycle === 'monthly' ? 'bulanan' : 'tahunan'}). ID Request: ${requestId}. Mohon dikonfirmasi ya 🙏`
      : `Halo admin naikcetak! Saya ingin upgrade ke paket ${planConfig.name}. Apakah masih tersedia?`;
    return `https://wa.me/${PAYMENT_INFO.whatsappAdmin}?text=${encodeURIComponent(msg)}`;
  };

  // ── Submit request ──────────────────────────────────────────────────────────
  const handleSubmitRequest = async () => {
    setLoading(true); setError('');
    try {
      const req = await submitUpgradeRequest(user.id, {
        requestedPlan: selectedPlan, billingCycle: cycle,
        paymentMethod, paymentNotes, amountToPay: price,
        userEmail: user.email,
        userName: user.user_metadata?.full_name ?? user.email,
      });
      setRequestId(req.id);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Gagal mengirim permintaan');
    } finally { setLoading(false); }
  };

  // ── Upload bukti ────────────────────────────────────────────────────────────
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

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
          <h2 className="font-bold text-zinc-900">Upgrade Plan naikcetak</h2>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        <StepBar current={step} />

        <div className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* ── STEP 0: Pilih Paket ── */}
          {step === 0 && (
            <>
              <p className="text-sm text-zinc-500">Pilih paket yang sesuai kebutuhan percetakan Anda</p>
              <div className="space-y-3">
                {['pro', 'business'].map(id => (
                  <PlanCard key={id} planId={id} selected={selectedPlan} cycle={cycle} onSelect={setSelectedPlan} />
                ))}
              </div>
              <button onClick={() => setStep(1)} className="btn-primary w-full">
                Lanjut →
              </button>
            </>
          )}

          {/* ── STEP 1: Siklus Pembayaran ── */}
          {step === 1 && (
            <>
              <p className="text-sm text-zinc-500">
                Pilih siklus pembayaran untuk paket <strong>{planConfig.name}</strong>
              </p>

              {/* Toggle cycle */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { val: 'monthly', label: 'Bulanan', note: '' },
                  { val: 'yearly',  label: 'Tahunan', note: 'Hemat ~34%' },
                ].map(({ val, label, note }) => {
                  const p = getEffectivePrice(selectedPlan, val);
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
                      {note && <span className="mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">{note}</span>}
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="label">Metode Transfer</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="input-field">
                  <option value="transfer_bca">Transfer BCA</option>
                  <option value="transfer_mandiri">Transfer Mandiri</option>
                  <option value="transfer_bri">Transfer BRI</option>
                  <option value="transfer_bni">Transfer BNI</option>
                  <option value="qris">QRIS</option>
                </select>
              </div>

              <div>
                <label className="label">Catatan (opsional)</label>
                <textarea className="input-field resize-none" rows={2}
                  placeholder="Nama / perusahaan untuk memudahkan verifikasi..."
                  value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)} />
              </div>

              <div className="bg-zinc-50 rounded-xl px-4 py-3 flex justify-between text-sm">
                <span className="text-zinc-600">{planConfig.name} · {cycle === 'monthly' ? 'Bulanan' : 'Tahunan'}</span>
                <span className="font-black text-zinc-900">Rp {price.toLocaleString('id-ID')}</span>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(0)} className="btn-ghost px-4">← Kembali</button>
                <button onClick={() => setStep(2)} className="btn-primary flex-1">Lihat Info Transfer →</button>
              </div>
            </>
          )}

          {/* ── STEP 2: Info Transfer ── */}
          {step === 2 && (
            <>
              <p className="text-sm text-zinc-500">Transfer ke rekening berikut, lalu klik "Sudah Transfer"</p>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Rekening Tujuan</p>
                {[['Bank', PAYMENT_INFO.bank], ['Atas Nama', PAYMENT_INFO.accountName]].map(([l, v]) => (
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
                <button onClick={() => setStep(1)} className="btn-ghost px-4">← Kembali</button>
                <button onClick={handleSubmitRequest} disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {loading && <Loader2 size={13} className="animate-spin" />}
                  Sudah Transfer →
                </button>
              </div>
            </>
          )}

          {/* ── STEP 3: Upload Bukti ── */}
          {step === 3 && (
            <>
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
                <button onClick={onClose} className="btn-ghost flex-1">Nanti Saja</button>
                <button onClick={handleUploadProof} disabled={!proofFile || loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {loading && <Loader2 size={13} className="animate-spin" />}
                  Upload Bukti →
                </button>
              </div>
            </>
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
