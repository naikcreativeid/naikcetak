import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Loader2,
  MessageCircle,
  QrCode,
  UploadCloud,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { PLANS, getEffectivePrice } from '../lib/plans';
import { supabase, getUpgradeRequestByOrderId, uploadPaymentProof } from '../lib/supabase';
import {
  buildWhatsAppPaymentText,
  formatPaymentMethodLabel,
  formatUniqueCode,
  getInstructionDeadline,
  getPaymentEnv,
  getPaymentMethodMeta,
  getPaymentMethodOptions,
  getPaymentStatusLabel,
  getPaymentStatusMeta,
} from '../lib/payments';

const PRO_FEATURES = [
  [
    { label: 'Kalkulator Potong Kertas', desc: 'penggunaan tidak terbatas' },
    { label: 'Kalkulator Biaya Cetak', desc: 'penggunaan tidak terbatas' },
    { label: 'Export PDF Invoice', desc: '+ quotation profesional' },
    { label: 'AI Assistant', desc: 'brief analyzer & email' },
    { label: 'Integrasi WhatsApp', desc: 'langsung dari app' },
  ],
  [
    { label: 'Database Kertas', desc: 'tidak terbatas' },
    { label: 'Layanan Finishing & Mesin', desc: 'database lengkap' },
    { label: 'Riwayat kalkulasi', desc: '1 tahun penuh' },
    { label: '3 akun tim', desc: 'kolaborasi bersama' },
    { label: 'Tracking Order publik', desc: 'klien pantau sendiri' },
    { label: 'Support prioritas', desc: 'respons lebih cepat' },
  ],
];

const STARTER_FEATURES = [
  { ok: true, label: 'Kalkulator Potong Kertas - 10x/bulan' },
  { ok: true, label: 'Kalkulator Biaya Cetak - 5x/bulan' },
  { ok: true, label: 'Database Kertas - maks 5 jenis' },
  { ok: true, label: '1 akun pengguna' },
  { ok: false, label: 'AI Assistant' },
  { ok: false, label: 'Export PDF Invoice' },
  { ok: false, label: 'Quotation & Tracking Order' },
  { ok: false, label: 'Penggunaan tidak terbatas' },
];

function PaymentStatusBadge({ status }) {
  const meta = getPaymentStatusMeta(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${meta.bg} ${meta.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

function BillingToggle({ cycle, onChange }) {
  return (
    <div className="inline-flex items-center bg-blue-100/70 rounded-full p-1 gap-0.5">
      {[['monthly', 'Bulanan'], ['yearly', 'Tahunan']].map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`relative px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            cycle === value ? 'bg-white shadow text-blue-700' : 'text-blue-500 hover:text-blue-700'
          }`}
        >
          {label}
          {value === 'yearly' && (
            <span className="ml-1.5 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              HEMAT 47%
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function ComparisonView({ cycle, onCycleChange, onUpgrade }) {
  const proPrice = cycle === 'yearly' ? PLANS.pro.prices.yearlyPerMonth : PLANS.pro.prices.monthly;

  return (
    <div className="flex flex-col md:flex-row overflow-hidden">
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
                {ok ? (
                  <Check size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <X size={13} className="text-red-400 shrink-0 mt-0.5" />
                )}
                <span className={ok ? 'text-zinc-700' : 'text-zinc-400 line-through'}>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          disabled
          className="mt-6 w-full py-2.5 bg-zinc-100 text-zinc-400 text-xs font-bold rounded-xl cursor-not-allowed tracking-wide"
        >
          PAKET ANDA SAAT INI
        </button>
      </div>

      <div className="flex-1 bg-gradient-to-br from-white to-[#EFF6FF] p-6 flex flex-col relative">
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center gap-1 bg-[#F59E0B] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow">
            PALING DIMINATI
          </span>
        </div>

        <div className="flex-1">
          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-2">
            <Zap size={10} className="inline mr-1" />
            UNLOCK SEMUA FITUR
          </p>

          <h3 className="text-4xl font-black text-zinc-900 mb-1">
            naikcetak <span className="text-blue-600">PRO</span>
          </h3>

          <p className="text-sm text-zinc-500 mb-4 leading-relaxed">
            Checkout manual yang rapi: pilih metode bayar, transfer sesuai nominal unik, kirim bukti, lalu admin verifikasi dan paket aktif.
          </p>

          <div className="mb-4">
            <BillingToggle cycle={cycle} onChange={onCycleChange} />
          </div>

          <div className="mb-5">
            {cycle === 'yearly' && (
              <span className="text-sm text-zinc-400 line-through mr-2">
                Rp {PLANS.pro.prices.monthly.toLocaleString('id-ID')}
              </span>
            )}
            <span className="text-4xl font-black text-blue-600">
              Rp {proPrice.toLocaleString('id-ID')}
            </span>
            <span className="text-sm text-zinc-500 ml-1">/bulan</span>
            {cycle === 'yearly' && (
              <p className="text-xs text-zinc-400 mt-0.5">
                (Rp {PLANS.pro.prices.yearly.toLocaleString('id-ID')}/tahun)
              </p>
            )}
          </div>

          {cycle === 'yearly' && (
            <div className="mb-4 inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold px-3 py-1.5 rounded-full">
              Early Access - akses fitur baru lebih awal, khusus plan tahunan
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            {PRO_FEATURES.map((column, columnIndex) => (
              <div key={columnIndex} className="space-y-2.5">
                {column.map(({ label, desc }) => (
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

        <div className="mt-6">
          <motion.button
            onClick={onUpgrade}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg hover:shadow-blue-200"
          >
            LANJUT CHECKOUT MANUAL
          </motion.button>

          <p className="text-[11px] text-center text-zinc-400 mt-2 leading-relaxed">
            Tersedia transfer BCA, Mandiri, dan QRIS. Nominal dilengkapi kode unik 3 digit agar mudah dicek.
          </p>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ currentStep }) {
  const steps = ['Detail Pemesan', 'Pembayaran', 'Instruksi Bayar'];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {steps.map((label, index) => {
        const active = currentStep === index + 1;
        const done = currentStep > index + 1;
        return (
          <div key={label} className="flex items-center gap-2 shrink-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                done
                  ? 'bg-emerald-100 text-emerald-700'
                  : active
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 text-zinc-400'
              }`}
            >
              {done ? <Check size={14} /> : index + 1}
            </div>
            <span className={`text-xs font-semibold ${active || done ? 'text-zinc-800' : 'text-zinc-400'}`}>
              {label}
            </span>
            {index < steps.length - 1 && <div className="w-8 h-px bg-zinc-200" />}
          </div>
        );
      })}
    </div>
  );
}

function InstructionDeadline({ createdAt }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000 * 30);
    return () => window.clearInterval(id);
  }, []);

  const deadline = getInstructionDeadline(createdAt);
  const diff = Math.max(0, deadline.getTime() - now);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-[11px] font-semibold text-amber-700">
      <Clock3 size={12} />
      Selesaikan pembayaran dalam {hours}j {minutes}m
    </div>
  );
}

function PaymentMethodCard({ method, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(method.id)}
      className={`rounded-2xl border-2 p-4 text-left transition-all ${
        selected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-zinc-200 hover:border-zinc-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-zinc-900">{method.label}</p>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{method.instructions}</p>
        </div>
        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selected ? 'border-blue-600 bg-blue-600' : 'border-zinc-300'}`}>
          {selected && <Check size={12} className="text-white" />}
        </div>
      </div>
      {method.accountNumber && (
        <div className="mt-3 rounded-xl bg-white/80 border border-blue-100 px-3 py-2">
          <p className="text-[11px] text-zinc-500">Rekening tujuan</p>
          <p className="text-sm font-bold text-zinc-900">{method.accountNumber}</p>
          <p className="text-[11px] text-zinc-500">{method.accountName}</p>
        </div>
      )}
      {method.id === 'qris' && (
        <div className="mt-3 rounded-xl bg-white/80 border border-blue-100 px-3 py-2 flex items-center gap-2 text-xs text-zinc-600">
          <QrCode size={14} className="text-blue-600" />
          QRIS akan tampil di langkah instruksi bayar.
        </div>
      )}
    </button>
  );
}

function ResultNotice({ status, error }) {
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected' || status === 'cancelled';
  const iconClass = isApproved ? 'bg-emerald-100 text-emerald-600' : isRejected ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600';

  return (
    <div className="text-center">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${iconClass}`}>
        {isApproved ? <CheckCircle2 size={30} /> : isRejected ? <AlertCircle size={30} /> : <Wallet size={30} />}
      </div>
      <h3 className="text-lg font-bold text-zinc-900">{getPaymentStatusLabel(status)}</h3>
      <p className="text-sm text-zinc-500 mt-2 max-w-sm mx-auto leading-relaxed">
        {isApproved
          ? 'Pembayaran Anda sudah diverifikasi. Paket Pro akan langsung aktif di akun ini.'
          : isRejected
            ? error || 'Permintaan upgrade belum berhasil diproses. Silakan hubungi admin bila perlu.'
            : 'Transfer sesuai nominal unik, upload bukti pembayaran, lalu admin akan memverifikasi secepatnya.'}
      </p>
    </div>
  );
}

export default function UpgradeModal({ user, onClose, onSuccess }) {
  const env = getPaymentEnv();
  const paymentMethods = useMemo(() => getPaymentMethodOptions(), []);
  const [view, setView] = useState(0);
  const [step, setStep] = useState(1);
  const [cycle, setCycle] = useState('yearly');
  const [customerName, setCustomerName] = useState(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
  const [paymentMethod, setPaymentMethod] = useState('bank_bca');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [proofLoading, setProofLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('pending');
  const [requestData, setRequestData] = useState(null);
  const [proofFileName, setProofFileName] = useState('');
  const [copied, setCopied] = useState('');
  const [qrisFailed, setQrisFailed] = useState(false);
  const pollingRef = useRef(null);

  const price = useMemo(() => getEffectivePrice('pro', cycle), [cycle]);
  const paymentMeta = useMemo(() => getPaymentMethodMeta(paymentMethod), [paymentMethod]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => () => {
    if (pollingRef.current) window.clearInterval(pollingRef.current);
  }, []);

  const stopPolling = () => {
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const startPolling = (orderId) => {
    if (!orderId) return;
    stopPolling();

    const poll = async () => {
      try {
        const row = await getUpgradeRequestByOrderId(user.id, orderId);
        if (!row) return;

        const latestStatus = row.transaction_status || row.status || 'pending';
        setStatus(latestStatus);
        setRequestData((current) => (current ? { ...current, createdAt: row.created_at, proofUrl: row.payment_proof_url || current.proofUrl } : current));

        if (latestStatus === 'approved') {
          stopPolling();
          await onSuccess?.();
          return;
        }

        if (['rejected', 'cancelled'].includes(latestStatus)) {
          stopPolling();
        }
      } catch (pollError) {
        console.error('[manual-payment-poll]', pollError);
      }
    };

    poll();
    pollingRef.current = window.setInterval(poll, 5000);
  };

  const copyText = async (value, key) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(''), 1600);
    } catch {
      setCopied('');
    }
  };

  const handleCreateCheckout = async () => {
    setCheckoutLoading(true);
    setError('');

    try {
      const sessionResult = await supabase.auth.getSession();
      const accessToken = sessionResult.data.session?.access_token;
      if (!accessToken) throw new Error('Sesi login tidak ditemukan. Silakan login ulang.');

      const response = await fetch('/api/manual-upgrade-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          planId: 'pro',
          billingCycle: cycle,
          customerName,
          paymentMethod,
          paymentNotes,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Gagal membuat instruksi pembayaran.');

      setRequestData({
        ...payload,
        proofUrl: '',
      });
      setStatus('pending');
      setView(1);
      setStep(3);
      startPolling(payload.orderId);
    } catch (checkoutError) {
      setError(checkoutError.message || 'Gagal memulai checkout manual.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleUploadProof = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !requestData?.requestId) return;

    setProofLoading(true);
    setError('');

    try {
      const publicUrl = await uploadPaymentProof(user.id, requestData.requestId, file);
      setProofFileName(file.name);
      setRequestData((current) => ({ ...current, proofUrl: publicUrl }));
      setStatus('manual_review');
    } catch (uploadError) {
      setError(uploadError.message || 'Gagal upload bukti pembayaran.');
    } finally {
      setProofLoading(false);
      event.target.value = '';
    }
  };

  const handleRetry = () => {
    stopPolling();
    setView(0);
    setStep(1);
    setError('');
    setStatus('pending');
    setRequestData(null);
    setProofFileName('');
    setQrisFailed(false);
  };

  const waLink = requestData
    ? buildWhatsAppPaymentText({
        adminWhatsApp: env.adminWhatsApp,
        customerName: customerName || user.email,
        planName: PLANS.pro.name,
        billingCycleLabel: cycle === 'yearly' ? 'Tahunan' : 'Bulanan',
        amount: requestData.amountToPay,
        orderId: requestData.orderId,
        paymentMethod,
      })
    : '#';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={`bg-white rounded-2xl shadow-2xl w-full overflow-hidden flex flex-col ${
          view === 0 ? 'max-w-4xl max-h-[92vh]' : 'max-w-3xl max-h-[92vh]'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
          <div className="space-y-2">
            <h2 className="font-bold text-zinc-900 text-sm">
              {view === 0 ? 'Pilih Paket naikcetak' : 'Checkout Pembayaran Manual'}
            </h2>
            {view === 1 && <StepIndicator currentStep={step} />}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className={`overflow-y-auto flex-1 ${view === 1 ? 'p-6' : ''}`}>
          {view === 0 && (
            <ComparisonView cycle={cycle} onCycleChange={setCycle} onUpgrade={() => { setView(1); setStep(1); }} />
          )}

          {view === 1 && (
            <div className="space-y-6">
              {step === 1 && (
                <>
                  <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Nama pemesan</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(event) => setCustomerName(event.target.value)}
                          placeholder="Nama lengkap atau nama usaha"
                          className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email akun</label>
                        <input
                          type="email"
                          value={user.email || ''}
                          disabled
                          className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm bg-zinc-50 text-zinc-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Siklus pembayaran</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { value: 'monthly', label: 'Bulanan', note: 'Rp 149.000 / bulan' },
                            { value: 'yearly', label: 'Tahunan', note: 'Rp 948.000 / tahun' },
                          ].map(({ value, label, note }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setCycle(value)}
                              className={`rounded-2xl border-2 p-4 text-left transition-all ${
                                cycle === value ? 'border-blue-500 bg-blue-50' : 'border-zinc-200 hover:border-zinc-300'
                              }`}
                            >
                              <p className="text-sm font-bold text-zinc-900">{label}</p>
                              <p className="text-xs text-zinc-500 mt-1">{note}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Ringkasan</p>
                        <p className="text-2xl font-black text-zinc-900 mt-2">
                          Rp {price.toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {cycle === 'yearly' ? 'Tagihan tahunan dibayar sekali di awal.' : 'Tagihan bulanan untuk 30 hari akses Pro.'}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white border border-zinc-200 px-4 py-3 text-sm text-zinc-600 leading-relaxed">
                        Setelah langkah berikutnya, sistem akan membuat nominal unik 3 digit untuk memudahkan verifikasi transfer BCA, Mandiri, atau QRIS.
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setView(0)}
                      className="px-4 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
                    >
                      Kembali
                    </button>
                    <button
                      onClick={() => setStep(2)}
                      disabled={!customerName.trim()}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors"
                    >
                      Lanjut ke Pembayaran
                    </button>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-zinc-500">
                        Pilih metode pembayaran manual yang paling nyaman. Nominal akhir akan ditambah kode unik 3 digit setelah checkout dibuat.
                      </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      {paymentMethods.map((method) => (
                        <PaymentMethodCard
                          key={method.id}
                          method={method}
                          selected={paymentMethod === method.id}
                          onSelect={setPaymentMethod}
                        />
                      ))}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1.5">Catatan pembayaran (opsional)</label>
                      <textarea
                        className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        rows={3}
                        placeholder="Misal: nama perusahaan, kebutuhan invoice, atau catatan untuk admin..."
                        value={paymentNotes}
                        onChange={(event) => setPaymentNotes(event.target.value)}
                      />
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-zinc-600">Paket Pro · {cycle === 'yearly' ? 'Tahunan' : 'Bulanan'}</span>
                        <span className="font-black text-zinc-900">Rp {price.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-sm mt-2">
                        <span className="text-zinc-600">Metode bayar</span>
                        <span className="font-semibold text-zinc-900">{paymentMeta.label}</span>
                      </div>
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep(1)}
                      className="px-4 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
                    >
                      Kembali
                    </button>
                    <button
                      onClick={handleCreateCheckout}
                      disabled={checkoutLoading}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {checkoutLoading && <Loader2 size={14} className="animate-spin" />}
                      Buat Instruksi Bayar
                    </button>
                  </div>
                </>
              )}

              {step === 3 && requestData && (
                <>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <ResultNotice status={status} error={error} />
                    <InstructionDeadline createdAt={requestData.createdAt} />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <PaymentStatusBadge status={status} />
                    <span className="text-xs text-zinc-400 font-mono">Order ID: {requestData.orderId}</span>
                  </div>

                  <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Nominal yang harus dibayar</p>
                        <p className="text-3xl font-black text-zinc-900 mt-2">
                          Rp {Number(requestData.amountToPay || 0).toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs text-zinc-500 mt-2">
                          Harga paket Rp {Number(requestData.baseAmount || 0).toLocaleString('id-ID')} + kode unik {formatUniqueCode(requestData.uniqueCode)}.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => copyText(String(requestData.amountToPay), 'amount')}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-zinc-700 border border-blue-100 hover:bg-blue-100 transition-colors"
                          >
                            <Copy size={12} />
                            {copied === 'amount' ? 'Nominal tersalin' : 'Salin nominal'}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyText(requestData.orderId, 'order')}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-zinc-700 border border-blue-100 hover:bg-blue-100 transition-colors"
                          >
                            <Copy size={12} />
                            {copied === 'order' ? 'Order ID tersalin' : 'Salin Order ID'}
                          </button>
                        </div>
                      </div>

                      {paymentMethod !== 'qris' ? (
                        <div className="rounded-2xl border border-zinc-200 p-5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-3">Tujuan transfer</p>
                          <div className="space-y-2">
                            <div>
                              <p className="text-sm font-bold text-zinc-900">{paymentMeta.label}</p>
                              <p className="text-sm text-zinc-600">{paymentMeta.accountNumber}</p>
                              <p className="text-xs text-zinc-500">{paymentMeta.accountName}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyText(paymentMeta.accountNumber, 'account')}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
                            >
                              <Copy size={12} />
                              {copied === 'account' ? 'Rekening tersalin' : 'Salin nomor rekening'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-zinc-200 p-5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-3">Scan QRIS</p>
                          {!qrisFailed ? (
                            <img
                              src={env.qrisImage}
                              alt="QRIS NaikCetak"
                              className="w-full max-w-xs rounded-2xl border border-zinc-200 bg-white"
                              onError={() => setQrisFailed(true)}
                            />
                          ) : (
                            <div className="w-full max-w-xs rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm text-zinc-500">
                              File QRIS belum tersedia di <span className="font-mono">{env.qrisImage}</span>. Tambahkan gambar QRIS agar pelanggan bisa scan langsung dari checkout.
                            </div>
                          )}
                        </div>
                      )}

                      <div className="rounded-2xl border border-zinc-200 p-5 space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Langkah selanjutnya</p>
                        <ol className="space-y-2 text-sm text-zinc-600">
                          <li>1. Bayar sesuai nominal unik di atas.</li>
                          <li>2. Upload bukti transfer atau screenshot pembayaran.</li>
                          <li>3. Klik WhatsApp admin bila ingin konfirmasi lebih cepat.</li>
                          <li>4. Tunggu status berubah menjadi aktif setelah diverifikasi.</li>
                        </ol>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-zinc-200 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-3">Upload bukti pembayaran</p>
                        <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors">
                          <UploadCloud size={22} className="text-blue-600" />
                          <div>
                            <p className="text-sm font-semibold text-zinc-800">
                              {proofLoading ? 'Mengunggah bukti...' : 'Pilih file bukti transfer'}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">JPG, PNG, atau PDF dari mobile banking / e-wallet Anda.</p>
                          </div>
                          <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleUploadProof} />
                        </label>
                        {(proofFileName || requestData.proofUrl) && (
                          <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">
                            Bukti tersimpan{proofFileName ? `: ${proofFileName}` : '. Admin sekarang bisa meninjau pembayaran Anda.'}
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl border border-zinc-200 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-3">Konfirmasi cepat ke admin</p>
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 text-sm transition-colors"
                        >
                          <MessageCircle size={15} />
                          Buka WhatsApp Admin
                        </a>
                        <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
                          Template pesan otomatis sudah menyertakan nama, paket, metode pembayaran, nominal, dan Order ID.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-zinc-200 p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">Status saat ini</p>
                        <p className="text-sm font-bold text-zinc-900">{getPaymentStatusLabel(status)}</p>
                        <p className="text-xs text-zinc-500 mt-2">
                          Refresh status berlangsung otomatis selama modal terbuka. Anda juga bisa menutup modal ini dan memantau dari halaman Subscription.
                        </p>
                      </div>
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <div className="flex gap-2">
                    {status === 'approved' ? (
                      <button
                        onClick={onClose}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors"
                      >
                        Tutup & Kembali ke Dashboard
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleRetry}
                          className="px-4 py-3 border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
                        >
                          Buat Checkout Baru
                        </button>
                        <button
                          onClick={onClose}
                          className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors"
                        >
                          Tutup
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
