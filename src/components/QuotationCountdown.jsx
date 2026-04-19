import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Plus, Copy, ExternalLink, Send, Clock, Trash2, RefreshCw, ChevronDown, ChevronUp, Gift, X } from 'lucide-react';

const STORAGE_KEY = 'nc_quotations_v1';

const DURATION_OPTIONS = [
  { label: '6 Jam',  hours: 6  },
  { label: '12 Jam', hours: 12 },
  { label: '24 Jam', hours: 24 },
  { label: '48 Jam', hours: 48 },
  { label: '3 Hari', hours: 72 },
];

const BONUS_PRESETS = [
  'Free Ongkir',
  'Free Desain',
  'Diskon 5%',
  'Gratis Sample',
  'Priority Produksi',
];

const STATUS_META = {
  draft:   { label: 'Draft',        color: 'text-zinc-500',   bg: 'bg-zinc-100',   border: 'border-zinc-200'   },
  sent:    { label: 'Terkirim',     color: 'text-blue-600',   bg: 'bg-blue-50',    border: 'border-blue-200'   },
  opened:  { label: 'Sudah Dilihat',color: 'text-violet-600', bg: 'bg-violet-50',  border: 'border-violet-200' },
  acc:     { label: 'ACC ✓',        color: 'text-emerald-600',bg: 'bg-emerald-50', border: 'border-emerald-200'},
  expired: { label: 'Expired',      color: 'text-red-500',    bg: 'bg-red-50',     border: 'border-red-200'    },
};

function loadQuotations() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveQuotations(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function genId() {
  return 'NC-QT-' + Date.now().toString(36).toUpperCase();
}

function getQuotationUrl(id) {
  return window.location.origin + window.location.pathname + '#/quotation/' + id;
}

function formatCountdown(ms) {
  if (ms <= 0) return { str: '00:00:00', urgent: true };
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const urgent = ms < 3 * 60 * 60 * 1000;
  const str = [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
  return { str, urgent };
}

function formatCurrency(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

// ── Mini countdown ticker for the list card ──────────────────────────────────
function MiniTimer({ expiresAt }) {
  const [ms, setMs] = useState(expiresAt - Date.now());

  useEffect(() => {
    const id = setInterval(() => setMs(expiresAt - Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const { str, urgent } = formatCountdown(ms);
  return (
    <span className={`font-mono text-xs font-bold ${urgent ? 'text-orange-500' : 'text-zinc-700'}`}>
      {ms <= 0 ? 'Expired' : str}
    </span>
  );
}

// ── Create / Edit Form ────────────────────────────────────────────────────────
const EMPTY_FORM = {
  clientName: '', clientBusiness: '', product: '', material: '',
  ukuran: '', finishing: '', qty: '', total: '', timeline: '',
  slots: 5, durIdx: 1, bonuses: [], catatan: '', wa: '',
};

function QuotationForm({ onSave, onCancel, initial }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);
  const [customBonus, setCustomBonus] = useState('');
  const [showBonuses, setShowBonuses] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const toggleBonus = (b) => {
    setForm(p => ({
      ...p,
      bonuses: p.bonuses.includes(b) ? p.bonuses.filter(x => x !== b) : [...p.bonuses, b],
    }));
  };

  const addCustom = () => {
    const b = customBonus.trim();
    if (!b || form.bonuses.includes(b)) return;
    setForm(p => ({ ...p, bonuses: [...p.bonuses, b] }));
    setCustomBonus('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.clientName || !form.product || !form.total) return;
    onSave(form);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="card shadow-sm mb-6"
    >
      <div className="card-header">
        <span className="section-title">Buat Quotation Baru</span>
        <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-600 transition-colors">
          <X size={16} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        {/* Client info */}
        <div>
          <p className="section-title mb-3">Informasi Klien</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Nama Klien *</label>
              <input className="input-field" placeholder="Budi Santoso" value={form.clientName} onChange={e => set('clientName', e.target.value)} required />
            </div>
            <div>
              <label className="label">Nama Bisnis</label>
              <input className="input-field" placeholder="Toko XYZ" value={form.clientBusiness} onChange={e => set('clientBusiness', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">No. WhatsApp Klien</label>
              <input className="input-field" placeholder="628xxxxxxxxxx" value={form.wa} onChange={e => set('wa', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Produk */}
        <div>
          <p className="section-title mb-3">Detail Penawaran</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Produk *</label>
              <input className="input-field" placeholder="Box Kemasan Makanan" value={form.product} onChange={e => set('product', e.target.value)} required />
            </div>
            <div>
              <label className="label">Material / Bahan</label>
              <input className="input-field" placeholder="Duplex 400gr" value={form.material} onChange={e => set('material', e.target.value)} />
            </div>
            <div>
              <label className="label">Ukuran</label>
              <input className="input-field" placeholder="20×15×10 cm" value={form.ukuran} onChange={e => set('ukuran', e.target.value)} />
            </div>
            <div>
              <label className="label">Finishing</label>
              <input className="input-field" placeholder="Laminasi Doff + Spot UV" value={form.finishing} onChange={e => set('finishing', e.target.value)} />
            </div>
            <div>
              <label className="label">Qty (pcs)</label>
              <input type="number" min="1" className="input-field" placeholder="1000" value={form.qty} onChange={e => set('qty', e.target.value)} />
            </div>
            <div>
              <label className="label">Total Harga *</label>
              <input type="number" min="0" className="input-field" placeholder="2500000" value={form.total} onChange={e => set('total', e.target.value)} required />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Timeline Produksi</label>
              <input className="input-field" placeholder="5-7 hari kerja" value={form.timeline} onChange={e => set('timeline', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Slots + Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Slot Produksi Tersisa</label>
            <input type="range" min="0" max="10" value={form.slots} onChange={e => set('slots', +e.target.value)}
              className="w-full accent-zinc-900 mt-2" />
            <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
              <span>0 slot</span>
              <span className={`font-bold ${form.slots <= 2 ? 'text-red-500' : 'text-zinc-700'}`}>{form.slots} slot</span>
              <span>10 slot</span>
            </div>
          </div>
          <div>
            <label className="label">Durasi Penawaran</label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {DURATION_OPTIONS.map((opt, i) => (
                <button key={i} type="button"
                  onClick={() => set('durIdx', i)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                    form.durIdx === i
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-400'
                  }`}
                >{opt.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Bonuses */}
        <div>
          <button type="button" onClick={() => setShowBonuses(v => !v)}
            className="flex items-center gap-2 section-title hover:text-zinc-600 transition-colors">
            <Gift size={12} /> Bonus & Insentif
            {showBonuses ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <AnimatePresence>
            {showBonuses && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-3 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {BONUS_PRESETS.map(b => (
                      <button key={b} type="button" onClick={() => toggleBonus(b)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          form.bonuses.includes(b)
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-400'
                        }`}
                      >{b}</button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input className="input-field flex-1" placeholder="Bonus custom..." value={customBonus}
                      onChange={e => setCustomBonus(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())} />
                    <button type="button" onClick={addCustom} className="btn-ghost px-3 py-2 rounded-lg text-xs font-bold">
                      <Plus size={14} />
                    </button>
                  </div>
                  {form.bonuses.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {form.bonuses.map(b => (
                        <span key={b} className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                          {b}
                          <button type="button" onClick={() => toggleBonus(b)} className="hover:text-red-500 transition-colors">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Catatan */}
        <div>
          <label className="label">Catatan untuk Klien</label>
          <textarea className="input-field resize-none" rows={2} placeholder="Harga sudah termasuk desain dasar, revisi 2x..."
            value={form.catatan} onChange={e => set('catatan', e.target.value)} />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel} className="btn-ghost px-4 py-2 rounded-lg text-sm font-bold">Batal</button>
          <button type="submit" className="btn-primary px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
            <Timer size={14} /> Buat Quotation
          </button>
        </div>
      </form>
    </motion.div>
  );
}

// ── Quotation Card ────────────────────────────────────────────────────────────
function QuotationCard({ q, onDelete, onExtend, onUpdateStatus }) {
  const [copied, setCopied] = useState(false);
  const st = STATUS_META[q.status] ?? STATUS_META.draft;
  const url = getQuotationUrl(q.id);
  const isExpired = Date.now() > q.expiresAt && q.status !== 'acc';

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { /* fallback silent */ }
  };

  const sendWA = () => {
    if (!q.wa) return;
    const msg = `Halo ${q.clientName}, berikut link penawaran eksklusif dari kami:\n\n${url}\n\nPenawaran ini berlaku terbatas. Segera konfirmasi ya! 🙏`;
    window.open(`https://wa.me/${q.wa.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    onUpdateStatus(q.id, 'sent');
  };

  const slotPct = (q.slots / 10) * 100;
  const slotUrgent = q.slots <= 2;

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      className="card shadow-sm">
      <div className="px-5 py-4 border-b border-zinc-100 flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-black text-zinc-900 truncate">{q.clientName}</p>
            {q.clientBusiness && <span className="text-[10px] text-zinc-400">· {q.clientBusiness}</span>}
            <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.color} ${st.bg} ${st.border}`}>
              {st.label}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5 truncate">{q.product}{q.qty ? ` · ${Number(q.qty).toLocaleString('id-ID')} pcs` : ''}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-zinc-900">{formatCurrency(q.total)}</p>
          <MiniTimer expiresAt={q.expiresAt} />
        </div>
      </div>

      {/* Slot bar */}
      <div className="px-5 pt-3 pb-1">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-zinc-400">Slot Produksi</span>
          <span className={`font-bold ${slotUrgent ? 'text-red-500' : 'text-zinc-600'}`}>{q.slots}/10</span>
        </div>
        <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${slotUrgent ? 'bg-red-500' : 'bg-zinc-900'}`} style={{ width: `${slotPct}%` }} />
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-3 flex flex-wrap gap-2">
        <button onClick={() => copy(url)} className="btn-ghost px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5">
          <Copy size={11} /> {copied ? 'Tersalin!' : 'Copy Link'}
        </button>
        <a href={url} target="_blank" rel="noreferrer"
          onClick={() => q.status === 'sent' && onUpdateStatus(q.id, 'opened')}
          className="btn-ghost px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5">
          <ExternalLink size={11} /> Preview
        </a>
        {q.wa && (
          <button onClick={sendWA} className="btn-ghost px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 text-emerald-700 hover:bg-emerald-50">
            <Send size={11} /> Kirim WA
          </button>
        )}
        {!isExpired && q.status !== 'acc' && (
          <button onClick={() => onExtend(q.id)} className="btn-ghost px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 text-blue-600 hover:bg-blue-50">
            <RefreshCw size={11} /> +24 Jam
          </button>
        )}
        <button onClick={() => onDelete(q.id)} className="btn-ghost px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 text-red-500 hover:bg-red-50 ml-auto">
          <Trash2 size={11} />
        </button>
      </div>

      {/* Status tracker */}
      <div className="px-5 pb-4">
        <div className="flex gap-1">
          {['draft', 'sent', 'opened', 'acc', 'expired'].map((s, i) => {
            const statuses = ['draft', 'sent', 'opened', 'acc', 'expired'];
            const curIdx = statuses.indexOf(isExpired && q.status !== 'acc' ? 'expired' : q.status);
            const done = i <= curIdx;
            const m = STATUS_META[s];
            return (
              <div key={s} className="flex-1 text-center">
                <div className={`h-1 rounded-full mb-1 transition-all ${done ? 'bg-zinc-900' : 'bg-zinc-100'}`} />
                <span className={`text-[9px] font-bold ${done ? 'text-zinc-700' : 'text-zinc-300'}`}>{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Admin Panel ──────────────────────────────────────────────────────────
export default function QuotationCountdown() {
  const [quotations, setQuotations] = useState(loadQuotations);
  const [showForm, setShowForm]     = useState(false);

  useEffect(() => {
    saveQuotations(quotations);
  }, [quotations]);

  // Auto-expire check every minute
  useEffect(() => {
    const id = setInterval(() => {
      setQuotations(prev => prev.map(q =>
        q.status !== 'acc' && Date.now() > q.expiresAt ? { ...q, status: 'expired' } : q
      ));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const handleCreate = useCallback((form) => {
    const hours = DURATION_OPTIONS[form.durIdx].hours;
    const now = Date.now();
    const q = {
      id: genId(),
      ...form,
      status: 'draft',
      expiresAt: now + hours * 3600_000,
      createdAt: new Date().toISOString(),
    };
    setQuotations(prev => [q, ...prev]);
    setShowForm(false);
  }, []);

  const handleDelete = useCallback((id) => {
    setQuotations(prev => prev.filter(q => q.id !== id));
  }, []);

  const handleExtend = useCallback((id) => {
    setQuotations(prev => prev.map(q =>
      q.id === id ? { ...q, expiresAt: q.expiresAt + 24 * 3600_000, status: q.status === 'expired' ? 'sent' : q.status } : q
    ));
  }, []);

  const handleUpdateStatus = useCallback((id, status) => {
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, status } : q));
  }, []);

  // Stats
  const active  = quotations.filter(q => q.status !== 'expired' && q.status !== 'acc').length;
  const accCount = quotations.filter(q => q.status === 'acc').length;
  const totalValue = quotations.filter(q => q.status === 'acc').reduce((s, q) => s + (+q.total || 0), 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-zinc-900 tracking-tight">Quotation Countdown</h1>
          <p className="text-sm text-zinc-500 mt-1">Buat penawaran dengan timer countdown & kirim ke klien via WhatsApp</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shrink-0">
          <Plus size={14} /> Buat Quotation
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Aktif',      value: active,    color: 'text-blue-600' },
          { label: 'ACC',        value: accCount,  color: 'text-emerald-600' },
          { label: 'Total ACC',  value: formatCurrency(totalValue), color: 'text-zinc-900' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card shadow-sm p-4 text-center">
            <p className={`text-lg font-black ${color}`}>{value}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5 font-bold uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && <QuotationForm onSave={handleCreate} onCancel={() => setShowForm(false)} />}
      </AnimatePresence>

      {/* List */}
      {quotations.length === 0 ? (
        <div className="card shadow-sm p-12 text-center">
          <Timer size={32} className="text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-zinc-400">Belum ada quotation</p>
          <p className="text-xs text-zinc-300 mt-1">Buat penawaran pertama Anda untuk klien</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {quotations.map(q => (
              <QuotationCard key={q.id} q={q}
                onDelete={handleDelete}
                onExtend={handleExtend}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
