import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Copy, Check, Edit2, Trash2, Package2, Link2, X, ExternalLink, ClipboardList } from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────

const STEPS_ORDER = ['terima', 'desain', 'produksi', 'finishing', 'qc', 'kirim'];

const STATUS_CONFIG = {
  terima:    { label: 'Order Diterima',  color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',   dot: 'bg-blue-500',    pct: 10  },
  desain:    { label: 'Proses Desain',   color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-500',  pct: 25  },
  produksi:  { label: 'Produksi',        color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  dot: 'bg-amber-500',   pct: 55  },
  finishing: { label: 'Finishing',       color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500',  pct: 75  },
  qc:        { label: 'Quality Check',   color: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-200',dot: 'bg-emerald-500', pct: 90  },
  kirim:     { label: 'Siap Kirim',      color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',   dot: 'bg-blue-500',    pct: 97  },
  selesai:   { label: 'Selesai ✓',       color: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-200',dot: 'bg-emerald-500', pct: 100 },
};

const STORAGE_KEY = 'nc_orders_v1';

// ── Helpers ──────────────────────────────────────────────────────────────────

function genToken() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function loadOrders() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveOrders(orders) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

function getTrackingUrl(token) {
  return `${window.location.origin}${window.location.pathname}#/track/${token}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.terima;
  const pulse = status === 'produksi' || status === 'finishing';
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {pulse && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />}
      {cfg.label}
    </span>
  );
}

function ProgressBar({ status }) {
  const pct = STATUS_CONFIG[status]?.pct ?? 0;
  return (
    <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="h-full bg-zinc-900 rounded-full"
      />
    </div>
  );
}

// ── Order Form (Add / Edit) ───────────────────────────────────────────────────

const EMPTY_FORM = {
  client: '', product: '', qty: '', bahan: '', ukuran: '',
  finishing: '', status: 'terima', order_date: '', est_selesai: '', notes: '',
};

function OrderForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="card">
      <div className="card-header">
        <span className="section-title">{initial ? 'Edit Order' : 'Tambah Order Baru'}</span>
        <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-700"><X size={16} /></button>
      </div>
      <div className="p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Nama Klien *</label>
            <input value={form.client} onChange={e => set('client', e.target.value)} placeholder="Glowby Skincare" className="input-field" />
          </div>
          <div>
            <label className="label">Produk *</label>
            <input value={form.product} onChange={e => set('product', e.target.value)} placeholder="Rigid Box Premium 30ml" className="input-field" />
          </div>
          <div>
            <label className="label">Bahan</label>
            <input value={form.bahan} onChange={e => set('bahan', e.target.value)} placeholder="Artboard 2mm + Linen" className="input-field" />
          </div>
          <div>
            <label className="label">Ukuran</label>
            <input value={form.ukuran} onChange={e => set('ukuran', e.target.value)} placeholder="8×8×12 cm" className="input-field" />
          </div>
          <div>
            <label className="label">Finishing</label>
            <input value={form.finishing} onChange={e => set('finishing', e.target.value)} placeholder="Emboss + Hot Stamp" className="input-field" />
          </div>
          <div>
            <label className="label">Qty (pcs)</label>
            <input type="number" value={form.qty} onChange={e => set('qty', e.target.value)} placeholder="500" className="input-field" />
          </div>
          <div>
            <label className="label">Tanggal Order</label>
            <input type="date" value={form.order_date} onChange={e => set('order_date', e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="label">Estimasi Selesai</label>
            <input type="date" value={form.est_selesai} onChange={e => set('est_selesai', e.target.value)} className="input-field" />
          </div>
        </div>

        <div>
          <label className="label">Status Saat Ini</label>
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5">
            {Object.entries(STATUS_CONFIG).map(([id, cfg]) => (
              <button key={id} onClick={() => set('status', id)}
                className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border transition-all ${form.status === id ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-300'}`}>
                {cfg.label.replace(' ✓', '')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Catatan untuk Klien</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
            placeholder="Update terbaru yang ingin ditampilkan ke klien..." className="input-field resize-none" />
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={() => { if (!form.client || !form.product) return; onSave(form); }}
            disabled={!form.client || !form.product} className="btn-primary flex-1">
            {initial ? 'Simpan Perubahan' : 'Buat Order & Generate Link'}
          </button>
          <button onClick={onCancel} className="btn-ghost px-5">Batal</button>
        </div>
      </div>
    </div>
  );
}

// ── Order Card with Link ──────────────────────────────────────────────────────

function OrderCard({ order, onEdit, onDelete }) {
  const [copied, setCopied]       = useState(null); // 'link' | 'code'
  const trackingUrl = getTrackingUrl(order.token);

  function copyLink() {
    navigator.clipboard.writeText(trackingUrl);
    setCopied('link');
    setTimeout(() => setCopied(null), 2500);
  }

  function copyCode() {
    navigator.clipboard.writeText(order.token);
    setCopied('code');
    setTimeout(() => setCopied(null), 2500);
  }

  return (
    <motion.div layout className="card overflow-visible">
      <div className="p-4">
        {/* Order header */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-zinc-900 rounded-xl flex items-center justify-center shrink-0">
            <Package2 size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="text-sm font-bold text-zinc-900 truncate">{order.client}</p>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-zinc-500 truncate mb-2">
              {order.product}{order.qty ? ` · ${Number(order.qty).toLocaleString('id-ID')} pcs` : ''}
            </p>
            <ProgressBar status={order.status} />
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={onEdit} className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-colors">
              <Edit2 size={13} />
            </button>
            <button onClick={onDelete} className="w-8 h-8 flex items-center justify-center rounded-lg bg-zinc-50 hover:bg-red-50 text-zinc-500 hover:text-red-500 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Shareable link row */}
        <div className="mt-3 p-3 bg-zinc-50 border border-zinc-100 rounded-xl space-y-2">
          <div className="flex items-center gap-2">
            <Link2 size={11} className="text-zinc-400 shrink-0" />
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Link Tracking untuk Klien</p>
          </div>

          {/* URL display */}
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-3 py-2 min-w-0">
            <p className="text-[11px] font-mono text-zinc-600 truncate flex-1">{trackingUrl}</p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button onClick={copyLink}
              className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-bold py-2 rounded-lg border transition-all ${
                copied === 'link'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-zinc-900 border-zinc-900 text-white hover:bg-zinc-700'
              }`}>
              {copied === 'link' ? <><Check size={11} /> Link Disalin!</> : <><Copy size={11} /> Salin Link</>}
            </button>
            <button onClick={copyCode}
              className={`flex items-center justify-center gap-1.5 text-[11px] font-bold px-3 py-2 rounded-lg border transition-all ${
                copied === 'code'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : 'bg-white border-zinc-200 text-zinc-500 hover:text-zinc-700'
              }`}>
              {copied === 'code' ? <><Check size={11} /> Kode!</> : <span className="font-mono tracking-widest">{order.token}</span>}
            </button>
            <a href={trackingUrl} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-1 text-[11px] font-semibold px-3 py-2 rounded-lg border bg-white border-zinc-200 text-zinc-500 hover:text-zinc-700 transition-colors">
              <ExternalLink size={11} /> Preview
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function OrderTrackingPortal() {
  const [orders, setOrders]     = useState(() => loadOrders());
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [search, setSearch]     = useState('');

  useEffect(() => { saveOrders(orders); }, [orders]);

  function addOrder(form) {
    const newOrder = { ...form, id: Date.now(), token: genToken(), createdAt: new Date().toISOString() };
    setOrders(prev => [newOrder, ...prev]);
    setShowForm(false);
  }

  function updateOrder(id, form) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...form, updatedAt: new Date().toISOString() } : o));
    setEditId(null);
  }

  function deleteOrder(id) {
    if (!window.confirm('Hapus order ini?')) return;
    setOrders(prev => prev.filter(o => o.id !== id));
  }

  const filtered = orders.filter(o =>
    !search ||
    o.client.toLowerCase().includes(search.toLowerCase()) ||
    o.product.toLowerCase().includes(search.toLowerCase()) ||
    o.token.includes(search.toUpperCase())
  );

  const publicUrl = `${window.location.origin}${window.location.pathname}#/track`;

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center shrink-0">
          <Package2 size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-base font-black text-zinc-900 tracking-tight">Portal Tracking Order</h1>
          <p className="text-[11px] text-zinc-400">Buat order → kirim link ke klien → update status kapan saja</p>
        </div>
        <a href={`${publicUrl}`} target="_blank" rel="noreferrer"
          className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-zinc-600 bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-full transition-colors shrink-0">
          <ExternalLink size={11} /> Halaman Klien
        </a>
      </div>

      {/* Info banner */}
      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
        <span className="text-lg shrink-0 mt-0.5">💡</span>
        <div>
          <p className="text-xs font-bold text-blue-800 mb-1">Cara kerja</p>
          <p className="text-xs text-blue-700 leading-relaxed">
            Buat order → salin link unik → kirim ke klien via WhatsApp. Klien buka link tanpa perlu login.
            Update status kapan saja, klien langsung lihat perubahannya.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex-1 min-w-48 flex items-center gap-2 bg-white border border-zinc-200 rounded-xl px-3">
          <Search size={14} className="text-zinc-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari klien, produk, atau kode..."
            className="flex-1 text-sm py-2.5 outline-none text-zinc-700 placeholder:text-zinc-300 bg-transparent" />
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); }} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Buat Order
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <OrderForm onSave={addOrder} onCancel={() => setShowForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {orders.length === 0 && !showForm && (
        <div className="card p-12 text-center">
          <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ClipboardList size={24} className="text-zinc-300" />
          </div>
          <p className="text-sm font-semibold text-zinc-500 mb-1">Belum ada order</p>
          <p className="text-xs text-zinc-400 mb-4">Klik "Buat Order" untuk membuat order pertama dan generate link tracking</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={14} className="inline mr-1.5" /> Buat Order Pertama
          </button>
        </div>
      )}

      {/* Order list */}
      <div className="space-y-3">
        {filtered.map(order => (
          <div key={order.id}>
            <AnimatePresence mode="wait">
              {editId === order.id ? (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <OrderForm initial={order} onSave={form => updateOrder(order.id, form)} onCancel={() => setEditId(null)} />
                </motion.div>
              ) : (
                <motion.div key="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <OrderCard
                    order={order}
                    onEdit={() => { setEditId(order.id); setShowForm(false); }}
                    onDelete={() => deleteOrder(order.id)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
