import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package2, MessageCircle, Search, RefreshCw, ArrowLeft, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { getOrderByToken } from '../lib/supabase';

// ── Legacy localStorage tracking (backward compat) ────────────────────────────
const STORAGE_KEY = 'nc_orders_v1';
function loadLegacyOrder(token) {
  try {
    const orders = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return orders.find(o => o.token === token?.toUpperCase()) ?? null;
  } catch { return null; }
}

// ── Status config (new client_orders system) ──────────────────────────────────
const NEW_STATUS = {
  order_masuk: { label: 'Order Masuk',   color: 'text-zinc-700',    bg: 'bg-zinc-100',   gradBg: '#f4f4f5',  gradText: '#3f3f46',  step: 0 },
  desain:      { label: 'Desain',        color: 'text-sky-700',     bg: 'bg-sky-50',     gradBg: '#f0f9ff',  gradText: '#0369a1',  step: 1 },
  acc_desain:  { label: 'ACC Desain',    color: 'text-indigo-700',  bg: 'bg-indigo-50',  gradBg: '#eef2ff',  gradText: '#4338ca',  step: 2 },
  cetak:       { label: 'Cetak',         color: 'text-blue-700',    bg: 'bg-blue-50',    gradBg: '#eff6ff',  gradText: '#1d4ed8',  step: 3 },
  finishing:   { label: 'Finishing',     color: 'text-violet-700',  bg: 'bg-violet-50',  gradBg: '#f5f3ff',  gradText: '#6d28d9',  step: 4 },
  qc:          { label: 'Quality Check', color: 'text-orange-700',  bg: 'bg-orange-50',  gradBg: '#fff7ed',  gradText: '#c2410c',  step: 5 },
  siap_kirim:  { label: 'Siap Kirim',    color: 'text-teal-700',    bg: 'bg-teal-50',    gradBg: '#f0fdfa',  gradText: '#0f766e',  step: 6 },
  selesai:     { label: 'Selesai ✓',     color: 'text-emerald-700', bg: 'bg-emerald-50', gradBg: '#ecfdf5',  gradText: '#065f46',  step: 7 },
  dibatalkan:  { label: 'Dibatalkan',    color: 'text-red-700',     bg: 'bg-red-50',     gradBg: '#fef2f2',  gradText: '#b91c1c',  step: -1 },
};

const STEP_STATUSES = ['order_masuk','desain','acc_desain','cetak','finishing','qc','siap_kirim','selesai'];

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatRelative(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'baru saja';
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

// ── New-style public tracking view ───────────────────────────────────────────
function NewOrderDetail({ order }) {
  const st      = NEW_STATUS[order.current_status] ?? NEW_STATUS.order_masuk;
  const updates = order.updates ?? [];
  const [showSpec, setShowSpec] = useState(false);

  const currentStep = st.step;
  const isActive    = currentStep >= 0 && currentStep < 7;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-lg mx-auto">

      {/* Hero status card */}
      <div className="rounded-2xl overflow-hidden shadow-sm border border-zinc-200"
        style={{ background: `linear-gradient(135deg, ${st.gradBg}, white)` }}>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: st.gradText, opacity: 0.6 }}>
                STATUS PESANAN
              </p>
              <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full border ${st.color} ${st.bg}`}
                style={{ borderColor: st.gradText + '33' }}>
                {isActive && (
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: st.gradText }} />
                )}
                {st.label}
              </span>
            </div>
            <div className="text-right">
              <p className="font-black text-zinc-900 text-lg">{order.order_number}</p>
              <p className="text-xs text-zinc-500">{order.product_name}</p>
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <p><span className="text-zinc-400">Klien:</span> <span className="font-semibold text-zinc-800">{order.client_name}</span></p>
            {order.estimated_done_date && (
              <p><span className="text-zinc-400">Estimasi selesai:</span> <span className="font-semibold text-zinc-800">{formatDate(order.estimated_done_date)}</span></p>
            )}
            {order.deadline_date && !order.estimated_done_date && (
              <p><span className="text-zinc-400">Deadline:</span> <span className="font-semibold text-zinc-800">{formatDate(order.deadline_date)}</span></p>
            )}
          </div>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Alur Produksi</p>
        <div className="space-y-0">
          {STEP_STATUSES.map((s, i) => {
            const cfg  = NEW_STATUS[s];
            const done   = cfg.step < currentStep;
            const active = cfg.step === currentStep;
            const up     = updates.find(u => u.status_to === s);
            return (
              <div key={s} className="flex gap-3 relative pb-4 last:pb-0">
                {i < STEP_STATUSES.length - 1 && (
                  <div className={`absolute left-[13px] top-7 bottom-0 w-0.5 ${done ? 'bg-blue-400' : 'bg-zinc-100'}`} />
                )}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 border-2 transition-all ${
                  done   ? 'bg-blue-500 border-blue-500' :
                  active ? 'bg-white border-blue-500' :
                           'bg-zinc-50 border-zinc-200'
                }`}>
                  {done ? (
                    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
                  ) : active ? (
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                  )}
                </div>
                <div className="pt-1 flex-1">
                  <p className={`text-sm font-semibold ${done || active ? 'text-zinc-900' : 'text-zinc-300'}`}>{cfg.label}</p>
                  {active && <p className="text-[11px] text-blue-500 mt-0.5">Sedang berjalan...</p>}
                  {done && up?.note && <p className="text-[11px] text-zinc-500 mt-0.5">{up.note}</p>}
                  {done && up?.created_at && <p className="text-[10px] text-zinc-400 mt-0.5">{formatRelative(up.created_at)}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Update log */}
      {updates.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Riwayat Update</p>
          <div className="space-y-3">
            {[...updates].reverse().map((u, i) => (
              <div key={i} className="flex gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                  <RefreshCw size={9} className="text-blue-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${(NEW_STATUS[u.status_to] ?? NEW_STATUS.order_masuk).color} ${(NEW_STATUS[u.status_to] ?? NEW_STATUS.order_masuk).bg}`}>
                      {(NEW_STATUS[u.status_to] ?? NEW_STATUS.order_masuk).label}
                    </span>
                    <span className="text-zinc-400">{formatRelative(u.created_at)}</span>
                  </div>
                  {u.note && <p className="text-zinc-600 mt-1 leading-relaxed">{u.note}</p>}
                  {u.photo_url && (
                    <a href={u.photo_url} target="_blank" rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1 text-blue-500 hover:underline">
                      <ExternalLink size={10} /> Lihat foto progress
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spesifikasi (collapsible) */}
      {(order.product_name || order.size || order.finishing || order.paper_type) && (
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <button onClick={() => setShowSpec(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-50 transition-colors">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Detail Pesanan</p>
            {showSpec ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
          </button>
          <AnimatePresence>
            {showSpec && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="px-5 pb-4 space-y-0">
                  {[
                    ['Produk',    order.product_name],
                    ['Jumlah',    order.quantity ? `${order.quantity.toLocaleString('id-ID')} ${order.unit}` : null],
                    ['Kertas',    order.paper_type],
                    ['Ukuran',    order.size],
                    ['Finishing', order.finishing],
                  ].filter(([,v]) => v).map(([l, v]) => (
                    <div key={l} className="flex justify-between items-start gap-4 py-2 border-b border-zinc-50 last:border-0">
                      <span className="text-[11px] text-zinc-400 shrink-0">{l}</span>
                      <span className="text-xs font-medium text-zinc-700 text-right">{v}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Contact */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-5 text-center space-y-3 shadow-sm">
        <p className="text-xs text-zinc-500">Pertanyaan tentang pesanan Anda?</p>
        <a href={`https://wa.me/?text=${encodeURIComponent(`Halo, saya ingin menanyakan update pesanan ${order.order_number} — ${order.product_name}. Terima kasih 🙏`)}`}
          target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors">
          <MessageCircle size={15} /> Hubungi Percetakan via WhatsApp
        </a>
      </div>

      <p className="text-center text-[11px] text-zinc-400 pb-4">
        Update terakhir: {formatRelative(order.updated_at)} · Powered by <span className="font-semibold">naikcetak</span>
      </p>
    </motion.div>
  );
}

// ── Legacy order detail (localStorage) ───────────────────────────────────────
const LEGACY_STATUS = {
  terima:    { label: 'Order Diterima', color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    dot: 'bg-blue-500',    pct: 10  },
  desain:    { label: 'Proses Desain',  color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-200',  dot: 'bg-violet-500',  pct: 25  },
  produksi:  { label: 'Produksi',       color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200',   dot: 'bg-amber-500',   pct: 55  },
  finishing: { label: 'Finishing',      color: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-200',  dot: 'bg-orange-500',  pct: 75  },
  qc:        { label: 'Quality Check',  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', pct: 90  },
  kirim:     { label: 'Siap Kirim',     color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    dot: 'bg-blue-500',    pct: 97  },
  selesai:   { label: 'Selesai ✓',      color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500', pct: 100 },
};

const LEGACY_STEPS = ['terima','desain','produksi','finishing','qc','kirim'];

function LegacyOrderDetail({ order, onBack }) {
  const st    = LEGACY_STATUS[order.status] ?? LEGACY_STATUS.terima;
  const idx   = order.status === 'selesai' ? LEGACY_STEPS.length : LEGACY_STEPS.indexOf(order.status);
  const steps = LEGACY_STEPS.map((id, i) => ({
    id, label: LEGACY_STATUS[id].label,
    done: i < idx || order.status === 'selesai',
    active: i === idx && order.status !== 'selesai',
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 max-w-lg mx-auto">
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Status Order</p>
            <h2 className="text-xl font-black text-zinc-900">{order.client}</h2>
            <p className="text-xs text-zinc-500 mt-1">{order.product}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border shrink-0 ${st.color} ${st.bg} ${st.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.dot} animate-pulse`} />
            {st.label}
          </span>
        </div>
        <div className="h-2.5 bg-zinc-100 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${st.pct}%` }} transition={{ duration: 1 }}
            className="h-full bg-zinc-900 rounded-full" />
        </div>
        {order.est_selesai && (
          <p className="text-[10px] text-zinc-400 mt-1.5 text-right">
            Estimasi: <span className="font-semibold text-zinc-600">{new Date(order.est_selesai).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}</span>
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Alur Produksi</p>
        <div className="space-y-0">
          {steps.map((step, i) => (
            <div key={step.id} className="flex gap-3 relative pb-5 last:pb-0">
              {i < steps.length - 1 && (
                <div className={`absolute left-[13px] top-7 bottom-0 w-0.5 ${step.done ? 'bg-zinc-900' : 'bg-zinc-100'}`} />
              )}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 border-2 ${
                step.done   ? 'bg-zinc-900 border-zinc-900' :
                step.active ? 'bg-white border-zinc-900' : 'bg-zinc-50 border-zinc-200'
              }`}>
                {step.done ? <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
                 : step.active ? <div className="w-2 h-2 rounded-full bg-zinc-900 animate-pulse" />
                 : <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />}
              </div>
              <div className="pt-0.5">
                <p className={`text-sm font-semibold ${step.done || step.active ? 'text-zinc-900' : 'text-zinc-300'}`}>{step.label}</p>
                {step.active && <p className="text-[11px] text-zinc-500 mt-0.5">Sedang dalam proses...</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 p-5 text-center shadow-sm">
        <a href={`https://wa.me/?text=${encodeURIComponent(`Halo, saya ingin menanyakan update pesanan atas nama ${order.client} — ${order.product}. 🙏`)}`}
          target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-6 py-3 rounded-xl transition-colors">
          <MessageCircle size={15} /> Hubungi Percetakan via WhatsApp
        </a>
      </div>
      <div className="text-center pb-4">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors">
          <ArrowLeft size={12} /> Cek nomor order lain
        </button>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TrackingPage({ initialToken }) {
  const [code,      setCode]      = useState(initialToken ?? '');
  const [newOrder,  setNewOrder]  = useState(null);  // from Supabase
  const [legacyOrder, setLegacyOrder] = useState(null); // from localStorage
  const [notFound,  setNotFound]  = useState(false);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    if (initialToken?.trim()) doSearch(initialToken.trim());
  }, [initialToken]);

  async function doSearch(q) {
    if (!q) return;
    setLoading(true); setNewOrder(null); setLegacyOrder(null); setNotFound(false);

    // 1. Try Supabase (new client_orders)
    try {
      const data = await getOrderByToken(q);
      if (data) { setNewOrder(data); setLoading(false); return; }
    } catch { /* ignore */ }

    // 2. Fall back to localStorage (legacy short tokens)
    const legacy = loadLegacyOrder(q);
    if (legacy) { setLegacyOrder(legacy); setLoading(false); return; }

    setNotFound(true); setLoading(false);
  }

  const handleBack = () => { setNewOrder(null); setLegacyOrder(null); setNotFound(false); setCode(''); };

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

          {newOrder ? (
            <div key="new">
              <button onClick={handleBack} className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors mb-4">
                <ArrowLeft size={12} /> Lacak order lain
              </button>
              <NewOrderDetail order={newOrder} />
            </div>
          ) : legacyOrder ? (
            <LegacyOrderDetail key="legacy" order={legacyOrder} onBack={handleBack} />
          ) : (
            <motion.div key="search" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Package2 size={28} className="text-white" />
                </div>
                <h1 className="text-2xl font-black text-zinc-900 tracking-tight mb-2">Lacak Pesanan Anda</h1>
                <p className="text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto">
                  Masukkan kode tracking yang diberikan percetakan untuk melihat status produksi secara real-time.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
                  Kode Tracking
                </label>
                <input
                  value={code}
                  onChange={e => { setCode(e.target.value); setNotFound(false); }}
                  onKeyDown={e => e.key === 'Enter' && doSearch(code)}
                  placeholder="Masukkan kode tracking"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-center font-mono text-sm font-bold tracking-wider text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent placeholder:text-zinc-300 placeholder:font-normal placeholder:tracking-normal mb-4"
                />
                <button onClick={() => doSearch(code)} disabled={loading || !code.trim()}
                  className="w-full bg-zinc-900 hover:bg-zinc-700 disabled:bg-zinc-200 disabled:cursor-not-allowed text-white text-sm font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                  {loading ? <><RefreshCw size={14} className="animate-spin" /> Mencari...</> : <><Search size={14} /> Lacak Pesanan</>}
                </button>
              </div>

              <AnimatePresence>
                {notFound && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                    <p className="text-2xl mb-2">🔍</p>
                    <p className="text-sm font-bold text-red-700 mb-1">Kode tidak ditemukan</p>
                    <p className="text-xs text-red-500">Periksa kembali kode dari percetakan atau hubungi langsung.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-center text-[11px] text-zinc-400 pt-2">
                Kode tracking dikirimkan oleh percetakan via WhatsApp saat order dikonfirmasi.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
