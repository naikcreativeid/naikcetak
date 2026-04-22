import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package2, MessageCircle, Clock, Gift, CheckCircle, AlertTriangle } from 'lucide-react';

const STORAGE_KEY = 'nc_quotations_v1';

function loadQuotation(id) {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return list.find(q => q.id === id) ?? null;
  } catch { return null; }
}

function decodeQuotationPayload(encoded) {
  if (!encoded) return null;
  try {
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
    return JSON.parse(decodeURIComponent(escape(atob(padded))));
  } catch {
    return null;
  }
}

function markOpened(id) {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const updated = list.map(q => q.id === id && q.status === 'sent' ? { ...q, status: 'opened' } : q);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch { /* silent */ }
}

function markAcc(id) {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const updated = list.map(q => q.id === id ? { ...q, status: 'acc' } : q);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch { /* silent */ }
}

function formatCurrency(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

function formatCountdown(ms) {
  if (ms <= 0) return { h: '00', m: '00', s: '00', urgent: true, expired: true };
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const urgent = ms < 3 * 60 * 60 * 1000;
  return {
    h: String(h).padStart(2, '0'),
    m: String(m).padStart(2, '0'),
    s: String(s).padStart(2, '0'),
    urgent, expired: false,
  };
}

// ── Countdown Clock ───────────────────────────────────────────────────────────
function CountdownClock({ expiresAt }) {
  const [ms, setMs] = useState(expiresAt - Date.now());

  useEffect(() => {
    const id = setInterval(() => setMs(expiresAt - Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const { h, m, s, urgent, expired } = formatCountdown(ms);

  if (expired) {
    return (
      <div className="flex items-center gap-2 justify-center text-red-400">
        <AlertTriangle size={16} />
        <span className="text-sm font-bold">Penawaran telah berakhir</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 justify-center">
      {[h, m, s].map((val, i) => (
        <span key={i} className="flex items-center gap-2">
          <span className={`font-mono text-3xl font-black tabular-nums transition-colors ${urgent ? 'text-orange-400' : 'text-white'}`}>
            {val}
          </span>
          {i < 2 && <span className={`text-xl font-bold ${urgent ? 'text-orange-400' : 'text-zinc-500'}`}>:</span>}
        </span>
      ))}
    </div>
  );
}

// ── Main Client Page ──────────────────────────────────────────────────────────
export default function QuotationClientPage({ quotationId, encodedData = '' }) {
  const [q, setQ]       = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [accDone, setAccDone]   = useState(false);

  useEffect(() => {
    if (!quotationId) { setNotFound(true); return; }
    const fromUrl = decodeQuotationPayload(encodedData);
    const found = fromUrl?.id === quotationId ? fromUrl : loadQuotation(quotationId);
    if (!found) { setNotFound(true); return; }
    setQ(found);
    if (!fromUrl) markOpened(quotationId);
    if (found.status === 'acc') setAccDone(true);
  }, [quotationId, encodedData]);

  const handleAcc = () => {
    if (!q) return;
    markAcc(q.id);
    setAccDone(true);
    if (q.wa) {
      const msg = `Halo, saya ${q.clientName} ingin mengkonfirmasi ACC penawaran untuk:\n\n📦 ${q.product}\n💰 ${formatCurrency(q.total)}\n\nTerima kasih! 🙏`;
      window.open(`https://wa.me/${q.wa.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const isExpired = q && Date.now() > q.expiresAt && q.status !== 'acc';
  const slotPct = q ? (q.slots / 10) * 100 : 0;
  const slotUrgent = q && q.slots <= 2;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="bg-zinc-900/80 backdrop-blur border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
              <Package2 size={14} className="text-zinc-900" />
            </div>
            <span className="font-bold text-white text-sm tracking-tight">naikcetak</span>
          </div>
          <span className="text-[10px] font-bold text-zinc-500 bg-zinc-800 px-2.5 py-1 rounded-full">Penawaran Khusus</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <AnimatePresence mode="wait">
          {notFound ? (
            <motion.div key="notfound" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-20">
              <p className="text-4xl mb-4">🔍</p>
              <p className="text-lg font-bold text-zinc-300">Penawaran tidak ditemukan</p>
              <p className="text-sm text-zinc-500 mt-2">Link mungkin sudah tidak valid atau telah dihapus.</p>
            </motion.div>
          ) : !q ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-20">
              <div className="w-8 h-8 border-2 border-zinc-700 border-t-white rounded-full animate-spin mx-auto" />
            </motion.div>
          ) : (
            <motion.div key="content" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

              {/* ACC banner */}
              <AnimatePresence>
                {accDone && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-center">
                    <CheckCircle size={32} className="text-emerald-400 mx-auto mb-2" />
                    <p className="text-base font-black text-emerald-300">Penawaran Dikonfirmasi!</p>
                    <p className="text-xs text-emerald-500 mt-1">Tim kami akan segera menghubungi Anda.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hero card */}
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="p-5 border-b border-zinc-800">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-1">Penawaran untuk</p>
                  <h1 className="text-2xl font-black text-white leading-tight">{q.clientName}</h1>
                  {q.clientBusiness && <p className="text-sm text-zinc-400 mt-0.5">{q.clientBusiness}</p>}
                </div>

                {/* Countdown */}
                <div className={`p-6 border-b border-zinc-800 ${isExpired ? 'bg-red-950/20' : ''}`}>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] text-center mb-4">
                    {isExpired ? 'Penawaran Berakhir' : 'Penawaran Berakhir Dalam'}
                  </p>
                  <CountdownClock expiresAt={q.expiresAt} />
                  {!isExpired && (
                    <p className="text-[10px] text-zinc-600 text-center mt-3">
                      Penawaran ini <span className="text-zinc-400 font-semibold">hanya berlaku sementara</span>. Segera konfirmasi!
                    </p>
                  )}
                </div>

                {/* Slot bar */}
                <div className="p-5 border-b border-zinc-800">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-zinc-500">Slot Produksi Tersedia</span>
                    <span className={`font-bold ${slotUrgent ? 'text-red-400' : 'text-zinc-300'}`}>
                      {q.slots} slot tersisa
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${slotPct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${slotUrgent ? 'bg-red-500' : 'bg-emerald-500'}`}
                    />
                  </div>
                  {slotUrgent && (
                    <p className="text-[11px] text-red-400 mt-1.5 font-semibold">⚠ Slot hampir habis!</p>
                  )}
                </div>
              </div>

              {/* Detail penawaran */}
              <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em]">Detail Penawaran</p>
                </div>
                <div className="p-5">
                  {[
                    ['Produk',    q.product],
                    q.material   && ['Material',  q.material],
                    q.ukuran     && ['Ukuran',    q.ukuran],
                    q.finishing  && ['Finishing', q.finishing],
                    q.qty        && ['Qty',       `${Number(q.qty).toLocaleString('id-ID')} pcs`],
                    q.timeline   && ['Timeline',  q.timeline],
                  ].filter(Boolean).map(([l, v]) => (
                    <div key={l} className="flex justify-between items-start gap-4 py-2.5 border-b border-zinc-800/50 last:border-0">
                      <span className="text-xs text-zinc-500 shrink-0">{l}</span>
                      <span className="text-sm font-semibold text-zinc-200 text-right">{v}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-4 mt-2 border-t border-zinc-700">
                    <span className="text-sm text-zinc-400">Total Harga</span>
                    <span className="text-xl font-black text-white">{formatCurrency(q.total)}</span>
                  </div>
                </div>
              </div>

              {/* Bonuses */}
              {q.bonuses?.length > 0 && (
                <div className="bg-gradient-to-br from-emerald-950/50 to-zinc-900 rounded-2xl border border-emerald-800/30 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Gift size={14} className="text-emerald-400" />
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.15em]">Bonus Spesial</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {q.bonuses.map(b => (
                      <span key={b} className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold px-3 py-1.5 rounded-full">
                        ✓ {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Catatan */}
              {q.catatan && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-2">Catatan</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{q.catatan}</p>
                </div>
              )}

              {/* CTA */}
              {!accDone && !isExpired && (
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 space-y-3">
                  <p className="text-xs text-zinc-500 text-center">Setuju dengan penawaran ini? Klik tombol di bawah untuk konfirmasi.</p>
                  <button onClick={handleAcc}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-base">
                    <MessageCircle size={18} /> ACC & Hubungi via WhatsApp
                  </button>
                  <p className="text-[10px] text-zinc-600 text-center">Dengan mengklik, Anda menyetujui penawaran di atas</p>
                </div>
              )}

              {isExpired && (
                <div className="bg-red-950/20 border border-red-800/30 rounded-2xl p-5 text-center">
                  <AlertTriangle size={24} className="text-red-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-red-300">Penawaran Telah Berakhir</p>
                  <p className="text-xs text-red-500 mt-1">Hubungi percetakan untuk penawaran baru.</p>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
