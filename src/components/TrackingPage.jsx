import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package2, MessageCircle, Search, RefreshCw, ArrowLeft } from 'lucide-react';

const STORAGE_KEY = 'nc_orders_v1';

const STEPS_ORDER = ['terima', 'desain', 'produksi', 'finishing', 'qc', 'kirim'];

const STEP_LABELS = {
  terima: 'Order Diterima', desain: 'Proses Desain',
  produksi: 'Produksi', finishing: 'Finishing',
  qc: 'Quality Check', kirim: 'Siap Kirim',
};

const STATUS_CONFIG = {
  terima:    { label: 'Order Diterima',  color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',   dot: 'bg-blue-500',    pct: 10  },
  desain:    { label: 'Proses Desain',   color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-500',  pct: 25  },
  produksi:  { label: 'Produksi',        color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  dot: 'bg-amber-500',   pct: 55  },
  finishing: { label: 'Finishing',       color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500',  pct: 75  },
  qc:        { label: 'Quality Check',   color: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-200',dot: 'bg-emerald-500', pct: 90  },
  kirim:     { label: 'Siap Kirim',      color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',   dot: 'bg-blue-500',    pct: 97  },
  selesai:   { label: 'Selesai ✓',       color: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-200',dot: 'bg-emerald-500', pct: 100 },
};

function loadOrders() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function computeSteps(status) {
  const currentIdx = status === 'selesai' ? STEPS_ORDER.length : STEPS_ORDER.indexOf(status);
  return STEPS_ORDER.map((id, i) => ({
    id, label: STEP_LABELS[id],
    done:   i < currentIdx || status === 'selesai',
    active: i === currentIdx && status !== 'selesai',
  }));
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return dateStr; }
}

// ── Order Detail View ─────────────────────────────────────────────────────────

function OrderDetail({ order, onBack }) {
  const st   = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.terima;
  const pct  = st.pct;
  const steps = computeSteps(order.status);
  const pulse = order.status === 'produksi' || order.status === 'finishing';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 max-w-lg mx-auto"
    >
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 mb-1.5">Status Order Anda</p>
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight leading-none">{order.client}</h2>
              <p className="text-xs text-zinc-500 mt-1.5">{order.product}</p>
            </div>
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border shrink-0 ${st.color} ${st.bg} ${st.border}`}>
              {pulse && <span className={`w-1.5 h-1.5 rounded-full ${st.dot} animate-pulse`} />}
              {st.label}
            </span>
          </div>

          {/* Progress */}
          <div className="flex justify-between text-[10px] text-zinc-400 mb-1.5">
            <span>{formatDate(order.order_date) ?? 'Tanggal order'}</span>
            <span className="font-bold text-zinc-700">{pct}%</span>
          </div>
          <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-zinc-900 rounded-full"
            />
          </div>
          {order.est_selesai && (
            <p className="text-[10px] text-zinc-400 mt-1.5 text-right">
              Estimasi selesai: <span className="font-semibold text-zinc-600">{formatDate(order.est_selesai)}</span>
            </p>
          )}
        </div>
      </div>

      {/* Spesifikasi */}
      {(order.bahan || order.ukuran || order.finishing || order.qty) && (
        <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-zinc-100">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">Spesifikasi Pesanan</p>
          </div>
          <div className="p-5 space-y-0">
            {[
              ['Produk',    order.product],
              order.bahan     && ['Bahan',     order.bahan],
              order.ukuran    && ['Ukuran',    order.ukuran],
              order.finishing && ['Finishing', order.finishing],
              order.qty       && ['Qty',       `${Number(order.qty).toLocaleString('id-ID')} pcs`],
            ].filter(Boolean).map(([l, v]) => (
              <div key={l} className="flex justify-between items-start gap-4 py-2 border-b border-zinc-50 last:border-0">
                <span className="text-[11px] text-zinc-400 shrink-0">{l}</span>
                <span className="text-xs font-medium text-zinc-700 text-right">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Update dari percetakan */}
      {order.notes && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-500 mb-2">Update dari Percetakan</p>
          <p className="text-sm text-blue-800 leading-relaxed">{order.notes}</p>
        </div>
      )}

      {/* Alur produksi */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-zinc-100">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400">Alur Produksi</p>
        </div>
        <div className="p-5">
          <div className="space-y-0">
            {steps.map((step, i) => (
              <div key={step.id} className="flex gap-3 relative pb-5 last:pb-0">
                {i < steps.length - 1 && (
                  <div className={`absolute left-[13px] top-7 bottom-0 w-0.5 ${step.done ? 'bg-zinc-900' : 'bg-zinc-100'}`} />
                )}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 border-2 transition-all ${
                  step.done   ? 'bg-zinc-900 border-zinc-900' :
                  step.active ? 'bg-white border-zinc-900' :
                                'bg-zinc-50 border-zinc-200'
                }`}>
                  {step.done ? (
                    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
                  ) : step.active ? (
                    <div className="w-2 h-2 rounded-full bg-zinc-900 animate-pulse" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                  )}
                </div>
                <div className="pt-0.5">
                  <p className={`text-sm font-semibold ${step.done || step.active ? 'text-zinc-900' : 'text-zinc-300'}`}>{step.label}</p>
                  {step.active && <p className="text-[11px] text-zinc-500 mt-0.5">Sedang dalam proses...</p>}
                  {step.done   && <p className="text-[11px] text-emerald-600 mt-0.5">Selesai ✓</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WhatsApp */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 text-center space-y-3 shadow-sm">
        <p className="text-xs text-zinc-500">Ada pertanyaan tentang pesanan Anda?</p>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Halo, saya ingin menanyakan update pesanan atas nama ${order.client} — ${order.product}. Terima kasih 🙏`)}`}
          target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors"
        >
          <MessageCircle size={16} /> Hubungi Percetakan via WhatsApp
        </a>
      </div>

      {/* Back */}
      <div className="text-center pb-4">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
          <ArrowLeft size={12} /> Cek nomor order lain
        </button>
      </div>
    </motion.div>
  );
}

// ── Main Tracking Page ────────────────────────────────────────────────────────

export default function TrackingPage({ initialToken }) {
  const [code, setCode]         = useState(initialToken ?? '');
  const [order, setOrder]       = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);

  // Auto-search if a token was passed directly in the URL
  useEffect(() => {
    if (initialToken?.trim()) {
      doSearch(initialToken.trim().toUpperCase());
    }
  }, [initialToken]);

  function doSearch(q) {
    if (!q) return;
    setLoading(true); setOrder(null); setNotFound(false); setSearched(false);
    const orders = loadOrders();
    setTimeout(() => {
      const found = orders.find(o => o.token === q.toUpperCase());
      setLoading(false); setSearched(true);
      if (found) setOrder(found);
      else setNotFound(true);
    }, 700);
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center">
              <Package2 size={16} className="text-white" />
            </div>
            <span className="font-bold text-zinc-900 text-base tracking-tight">naikcetak</span>
          </div>
          <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2.5 py-1 rounded-full">
            Tracking Order
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {order ? (
            <OrderDetail key="detail" order={order} onBack={() => { setOrder(null); setNotFound(false); setSearched(false); setCode(''); }} />
          ) : (
            <motion.div key="search" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              {/* Hero */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Package2 size={28} className="text-white" />
                </div>
                <h1 className="text-2xl font-black text-zinc-900 tracking-tight mb-2">Lacak Pesanan Anda</h1>
                <p className="text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto">
                  Masukkan kode tracking yang diberikan percetakan untuk melihat status produksi secara real-time.
                </p>
              </div>

              {/* Search card */}
              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 mb-3">
                  Kode Tracking
                </label>
                <input
                  value={code}
                  onChange={e => { setCode(e.target.value.toUpperCase()); setNotFound(false); }}
                  onKeyDown={e => e.key === 'Enter' && doSearch(code)}
                  placeholder="Contoh: A1B2C3D4"
                  maxLength={8}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-center font-mono text-xl font-bold tracking-[0.4em] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent placeholder:text-zinc-300 placeholder:font-normal placeholder:tracking-normal placeholder:text-base mb-4"
                />
                <button
                  onClick={() => doSearch(code)}
                  disabled={loading || !code.trim()}
                  className="w-full bg-zinc-900 hover:bg-zinc-700 disabled:bg-zinc-200 disabled:cursor-not-allowed text-white text-sm font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><RefreshCw size={14} className="animate-spin" /> Mencari...</>
                    : <><Search size={14} /> Lacak Pesanan</>}
                </button>
              </div>

              {/* Not found */}
              <AnimatePresence>
                {notFound && searched && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                    <p className="text-2xl mb-2">🔍</p>
                    <p className="text-sm font-bold text-red-700 mb-1">Kode tidak ditemukan</p>
                    <p className="text-xs text-red-500">Periksa kembali kode dari percetakan atau hubungi langsung.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer note */}
              <p className="text-center text-[11px] text-zinc-400 pt-4">
                Kode tracking dikirimkan oleh percetakan via WhatsApp saat order dikonfirmasi.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
