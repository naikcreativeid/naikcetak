import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, Loader2, CheckCircle2, AlertCircle, Clock3, Zap } from 'lucide-react';
import { PLANS, getEffectivePrice } from '../lib/plans';
import { supabase, getUpgradeRequestByOrderId } from '../lib/supabase';
import { createMidtransTransaction, getMidtransStatusLabel, loadMidtransSnapScript } from '../lib/midtrans';

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

const PAYMENT_STATE_META = {
  pending: { label: 'Menunggu pembayaran', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-400' },
  settlement: { label: 'Pembayaran berhasil', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  capture: { label: 'Pembayaran berhasil', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  deny: { label: 'Pembayaran ditolak', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  cancel: { label: 'Pembayaran dibatalkan', bg: 'bg-zinc-100', text: 'text-zinc-600', dot: 'bg-zinc-400' },
  expire: { label: 'Pembayaran kedaluwarsa', bg: 'bg-zinc-100', text: 'text-zinc-600', dot: 'bg-zinc-400' },
  failure: { label: 'Pembayaran gagal', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  approved: { label: 'Paket aktif', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  rejected: { label: 'Permintaan ditolak', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  cancelled: { label: 'Permintaan dibatalkan', bg: 'bg-zinc-100', text: 'text-zinc-600', dot: 'bg-zinc-400' },
};

function PaymentStatusBadge({ status }) {
  const meta = PAYMENT_STATE_META[status] ?? PAYMENT_STATE_META.pending;
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
            Checkout otomatis via Midtrans Snap. Begitu pembayaran terkonfirmasi, paket Anda aktif tanpa upload bukti transfer manual.
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
            BAYAR DENGAN MIDTRANS SNAP
          </motion.button>

          <p className="text-[11px] text-center text-zinc-400 mt-2 leading-relaxed">
            Mendukung transfer bank, e-wallet, QRIS, dan metode lain yang aktif di akun Midtrans Anda.
          </p>
        </div>
      </div>
    </div>
  );
}

function ResultPanel({ state, orderStatus, orderId, error, onRetry, onClose }) {
  const isSuccess = state === 'success';
  const isFailed = state === 'failed';

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
            isSuccess ? 'bg-emerald-100' : isFailed ? 'bg-red-100' : 'bg-blue-100'
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 size={30} className="text-emerald-600" />
          ) : isFailed ? (
            <AlertCircle size={30} className="text-red-600" />
          ) : (
            <Clock3 size={30} className="text-blue-600" />
          )}
        </div>

        <h3 className="text-lg font-bold text-zinc-900">
          {isSuccess ? 'Pembayaran berhasil' : isFailed ? 'Pembayaran belum berhasil' : 'Menunggu konfirmasi pembayaran'}
        </h3>
        <p className="text-sm text-zinc-500 mt-2 max-w-sm mx-auto leading-relaxed">
          {isSuccess
            ? 'Midtrans sudah mengirim konfirmasi ke server kami dan paket Anda akan aktif otomatis.'
            : isFailed
              ? error || 'Transaksi belum selesai. Anda bisa mencoba lagi kapan saja.'
              : 'Popup Midtrans sudah diproses. Kami sedang menunggu webhook untuk memastikan status transaksi terbaru.'}
        </p>
      </div>

      {orderStatus && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Status Midtrans</p>
            <PaymentStatusBadge status={orderStatus} />
          </div>
          <p className="text-sm font-bold text-zinc-900">{getMidtransStatusLabel(orderStatus)}</p>
          {orderId && (
            <p className="text-[11px] text-zinc-400 mt-2">
              Order ID: <span className="font-mono">{orderId}</span>
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {isSuccess ? (
          <button
            onClick={onClose}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Tutup & Kembali ke Dashboard
          </button>
        ) : (
          <>
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-zinc-200 text-zinc-600 rounded-xl hover:bg-zinc-50 text-sm transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={onRetry}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Coba Lagi
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function UpgradeModal({ user, onClose, onSuccess }) {
  const [step, setStep] = useState(0);
  const [cycle, setCycle] = useState('yearly');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentState, setPaymentState] = useState('idle');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [activeOrderId, setActiveOrderId] = useState('');
  const pollingRef = useRef(null);

  const price = useMemo(() => getEffectivePrice('pro', cycle), [cycle]);

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
    stopPolling();
    setActiveOrderId(orderId);

    const poll = async () => {
      try {
        const row = await getUpgradeRequestByOrderId(user.id, orderId);
        if (!row) return;

        const latestStatus = row.transaction_status || row.status;
        setPaymentStatus(latestStatus);

        if (['settlement', 'capture'].includes(row.transaction_status) || row.status === 'approved') {
          stopPolling();
          setPaymentState('success');
          await onSuccess?.();
          return;
        }

        if (['deny', 'expire', 'cancel', 'failure'].includes(row.transaction_status) || ['rejected', 'cancelled'].includes(row.status)) {
          stopPolling();
          setPaymentState('failed');
          setError(`Status terakhir: ${getMidtransStatusLabel(row.transaction_status || row.status)}`);
        }
      } catch (pollError) {
        console.error('[midtrans-poll]', pollError);
      }
    };

    poll();
    pollingRef.current = window.setInterval(poll, 3000);
    window.setTimeout(() => {
      if (pollingRef.current) stopPolling();
    }, 90000);
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError('');

    try {
      const sessionResult = await supabase.auth.getSession();
      const accessToken = sessionResult.data.session?.access_token;
      if (!accessToken) throw new Error('Sesi login tidak ditemukan. Silakan login ulang.');

      const customerDetails = {
        first_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pelanggan',
        email: user.email,
        phone: user.user_metadata?.phone_number || '',
      };

      const transaction = await createMidtransTransaction({
        accessToken,
        planId: 'pro',
        billingCycle: cycle,
        customerDetails,
        paymentNotes,
      });

      const snap = await loadMidtransSnapScript();
      if (!snap) throw new Error('Midtrans Snap gagal dimuat');

      setPaymentState('awaiting');
      setPaymentStatus('pending');
      setStep(2);
      startPolling(transaction.orderId);

      snap.pay(transaction.token, {
        onSuccess: (result) => {
          setPaymentState('awaiting');
          setPaymentStatus(result.transaction_status || 'settlement');
          startPolling(transaction.orderId);
        },
        onPending: (result) => {
          setPaymentState('awaiting');
          setPaymentStatus(result.transaction_status || 'pending');
          startPolling(transaction.orderId);
        },
        onError: (result) => {
          stopPolling();
          setPaymentState('failed');
          setPaymentStatus(result?.transaction_status || 'failure');
          setError(result?.status_message || 'Midtrans mengembalikan error saat memproses transaksi.');
        },
        onClose: () => {
          setPaymentState((current) => (current === 'success' ? current : 'failed'));
          setError((current) => current || 'Popup pembayaran ditutup sebelum transaksi selesai.');
        },
      });
    } catch (checkoutError) {
      setError(checkoutError.message || 'Gagal memulai pembayaran');
      setPaymentState('failed');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError('');
    setPaymentState('idle');
    setPaymentStatus('');
    setActiveOrderId('');
    setStep(1);
  };

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
          step === 0 ? 'max-w-4xl max-h-[92vh]' : 'max-w-lg max-h-[92vh]'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
          <h2 className="font-bold text-zinc-900 text-sm">
            {step === 0 ? 'Pilih Paket naikcetak' : 'Checkout Midtrans Snap'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className={`overflow-y-auto flex-1 ${step > 0 ? 'p-6' : ''}`}>
          {step === 0 && (
            <ComparisonView cycle={cycle} onCycleChange={setCycle} onUpgrade={() => setStep(1)} />
          )}

          {step === 1 && (
            <div className="space-y-5">
              <p className="text-sm text-zinc-500">
                Pilih siklus pembayaran untuk paket <strong>Pro</strong>, lalu lanjutkan checkout otomatis dengan Midtrans Snap.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'monthly', label: 'Bulanan', note: '' },
                  { value: 'yearly', label: 'Tahunan', note: 'Hemat 47%' },
                ].map(({ value, label, note }) => {
                  const displayPrice = value === 'yearly' ? PLANS.pro.prices.yearlyPerMonth : PLANS.pro.prices.monthly;
                  const totalPrice = value === 'yearly' ? PLANS.pro.prices.yearly : null;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCycle(value)}
                      className={`text-left rounded-xl border-2 p-4 transition-all ${
                        cycle === value ? 'border-blue-500 bg-blue-50' : 'border-zinc-200 hover:border-zinc-300'
                      }`}
                    >
                      <p className="text-sm font-semibold text-zinc-800">{label}</p>
                      <p className="text-xl font-black text-zinc-900 mt-1">
                        Rp {displayPrice.toLocaleString('id-ID')}
                      </p>
                      <p className="text-xs text-zinc-400">/bulan</p>
                      {totalPrice && (
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          (Rp {totalPrice.toLocaleString('id-ID')}/tahun)
                        </p>
                      )}
                      {note && (
                        <span className="mt-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                          {note}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">Ringkasan checkout</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600">Paket Pro · {cycle === 'yearly' ? 'Tahunan' : 'Bulanan'}</span>
                  <span className="font-black text-zinc-900">Rp {price.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-zinc-600">Gateway</span>
                  <span className="font-semibold text-zinc-900">Midtrans Snap</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">Catatan invoice (opsional)</label>
                <textarea
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  rows={2}
                  placeholder="Misal: nama perusahaan atau catatan internal..."
                  value={paymentNotes}
                  onChange={(event) => setPaymentNotes(event.target.value)}
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(0)}
                  className="px-4 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  Kembali
                </button>
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  Bayar Sekarang
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <ResultPanel
              state={paymentState}
              orderStatus={paymentStatus}
              orderId={activeOrderId}
              error={error}
              onRetry={handleRetry}
              onClose={onClose}
            />
          )}
        </div>

        {activeOrderId && step === 2 && (
          <div className="px-6 py-3 border-t border-zinc-100 bg-zinc-50 text-[11px] text-zinc-400 font-mono">
            Order ID: {activeOrderId}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
