import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Copy, ExternalLink, RefreshCw, X,
  MessageCircle, ChevronDown, ChevronUp, Check, Upload, Loader2,
  Share2, Link, ToggleLeft, ToggleRight, Trash2, Edit,
  Clock, Package, Users, CheckCircle,
} from 'lucide-react';
import {
  createClientOrder, getUserClientOrders, updateClientOrder,
  deleteClientOrder, addOrderStatusUpdate, uploadOrderPhoto,
  toggleOrderTracking, getClientTrackingUrl,
} from '../lib/supabase';

// ── Status config ─────────────────────────────────────────────────────────────
export const STATUS_CONFIG = {
  order_masuk: { label: 'Order Masuk',   color: 'text-zinc-600',    bg: 'bg-zinc-100',    border: 'border-zinc-300',    step: 0 },
  desain:      { label: 'Desain',        color: 'text-sky-700',     bg: 'bg-sky-50',      border: 'border-sky-200',     step: 1 },
  acc_desain:  { label: 'ACC Desain',    color: 'text-indigo-700',  bg: 'bg-indigo-50',   border: 'border-indigo-200',  step: 2 },
  cetak:       { label: 'Cetak',         color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200',    step: 3 },
  finishing:   { label: 'Finishing',     color: 'text-violet-700',  bg: 'bg-violet-50',   border: 'border-violet-200',  step: 4 },
  qc:          { label: 'Quality Check', color: 'text-orange-700',  bg: 'bg-orange-50',   border: 'border-orange-200',  step: 5 },
  siap_kirim:  { label: 'Siap Kirim',    color: 'text-teal-700',    bg: 'bg-teal-50',     border: 'border-teal-200',    step: 6 },
  selesai:     { label: 'Selesai ✓',     color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200', step: 7 },
  dibatalkan:  { label: 'Dibatalkan',    color: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-200',     step: -1 },
};
export const STATUSES = Object.keys(STATUS_CONFIG);
const ACTIVE_STATUSES = ['order_masuk','desain','acc_desain','cetak','finishing','qc','siap_kirim'];
const STEP_STATUSES   = ['order_masuk','desain','acc_desain','cetak','finishing','qc','siap_kirim','selesai'];

const PRODUCT_TYPES = ['Brosur','Banner','Kartu Nama','Stiker','Nota','Kalender','Poster','Buku','Undangan','Kemasan','Lainnya'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatusBadge({ status, size = 'sm' }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.order_masuk;
  const isActive = ACTIVE_STATUSES.includes(status);
  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border
      ${size === 'sm' ? 'text-[11px] px-2.5 py-0.5' : 'text-xs px-3 py-1'}
      ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      {isActive && status !== 'order_masuk' && (
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${cfg.color.replace('text-', 'bg-')}`} />
      )}
      {cfg.label}
    </span>
  );
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatRelative(d) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'baru saja';
  if (mins < 60)  return `${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  return `${days} hari lalu`;
}

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = useCallback((text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);
  return { copied, copy };
}

function Field({ label, children, required }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-600 mb-1">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function resolveTrackingUrl(order) {
  return order?.tracking_url || getClientTrackingUrl(order?.tracking_token);
}

// ── Add / Edit modal ──────────────────────────────────────────────────────────
const EMPTY_FORM = {
  client_name:'', client_phone:'', client_email:'',
  product_name:'', product_type:'', quantity:1, unit:'pcs',
  paper_type:'', size:'', finishing:'', colors:4, notes:'',
  price_hpp:'', price_sell:'', dp_amount:'', dp_paid:false,
  deadline_date:'', estimated_done_date:'',
  is_tracking_active: true,
};

function AddEditModal({ order, user, onClose, onSaved }) {
  const [form, setForm]     = useState(order ? {
    ...EMPTY_FORM,
    client_name:          order.client_name ?? '',
    client_phone:         order.client_phone ?? '',
    client_email:         order.client_email ?? '',
    product_name:         order.product_name ?? '',
    product_type:         order.product_type ?? '',
    quantity:             order.quantity ?? 1,
    unit:                 order.unit ?? 'pcs',
    paper_type:           order.paper_type ?? '',
    size:                 order.size ?? '',
    finishing:            order.finishing ?? '',
    colors:               order.colors ?? 4,
    notes:                order.notes ?? '',
    price_hpp:            order.price_hpp ?? '',
    price_sell:           order.price_sell ?? '',
    dp_amount:            order.dp_amount ?? '',
    dp_paid:              order.dp_paid ?? false,
    deadline_date:        order.deadline_date ? order.deadline_date.split('T')[0] : '',
    estimated_done_date:  order.estimated_done_date ? order.estimated_done_date.split('T')[0] : '',
    is_tracking_active:   order.is_tracking_active ?? true,
  } : { ...EMPTY_FORM });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [showAdvanced, setShowAdvanced] = useState(Boolean(order));
  const isEdit = Boolean(order);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_name.trim()) { setError('Nama klien wajib diisi.'); return; }
    if (!form.product_name.trim()) { setError('Nama produk wajib diisi.'); return; }
    setLoading(true); setError('');
    try {
      const payload = {
        ...form,
        quantity:       parseInt(form.quantity) || 1,
        colors:         parseInt(form.colors) || 4,
        price_hpp:      form.price_hpp ? parseInt(form.price_hpp) : null,
        price_sell:     form.price_sell ? parseInt(form.price_sell) : null,
        dp_amount:      form.dp_amount ? parseInt(form.dp_amount) : null,
        deadline_date:  form.deadline_date || null,
        estimated_done_date: form.estimated_done_date || null,
      };
      if (isEdit) {
        await updateClientOrder(order.id, payload);
      } else {
        await createClientOrder(user.id, payload, user?.email);
      }
      onSaved();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan order');
    } finally { setLoading(false); }
  };

  const inp = 'w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 shrink-0">
          <div>
            <h2 className="font-bold text-zinc-900">{isEdit ? 'Edit Order' : 'Tambah Order Baru'}</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Isi data klien dan detail pesanan terlebih dahulu. Pengaturan lanjutan bisa dibuka bila diperlukan.</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-4 pb-24 space-y-5">

          {/* Klien */}
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Info Klien</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nama Klien" required>
                <input value={form.client_name} onChange={e => set('client_name', e.target.value)} className={inp} placeholder="Nama / perusahaan klien" />
              </Field>
              <Field label="No. WhatsApp">
                <input value={form.client_phone} onChange={e => set('client_phone', e.target.value)} className={inp} placeholder="08xx / 62xx" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Email (opsional)">
                  <input type="email" value={form.client_email} onChange={e => set('client_email', e.target.value)} className={inp} placeholder="email@klien.com" />
                </Field>
              </div>
            </div>
          </div>

          {/* Pesanan */}
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Detail Pesanan</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Field label="Nama Produk" required>
                  <input value={form.product_name} onChange={e => set('product_name', e.target.value)} className={inp} placeholder="Brosur A4 Full Color" />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:col-span-2">
                <Field label="Jenis Produk">
                  <select value={form.product_type} onChange={e => set('product_type', e.target.value)} className={inp}>
                    <option value="">— Pilih —</option>
                    {PRODUCT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Jumlah">
                  <div className="grid grid-cols-[1fr_120px] gap-2">
                    <input type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} className={inp} min={1} />
                    <select value={form.unit} onChange={e => set('unit', e.target.value)} className={inp}>
                      {['pcs','lembar','set','rim','kg'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </Field>
              </div>
            </div>
          </div>

          {/* Spesifikasi */}
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Spesifikasi</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:col-span-2">
                <Field label="Jenis Kertas">
                  <input value={form.paper_type} onChange={e => set('paper_type', e.target.value)} className={inp} placeholder="Art Paper 150gsm" />
                </Field>
                <Field label="Ukuran">
                  <input value={form.size} onChange={e => set('size', e.target.value)} className={inp} placeholder="21 × 29.7 cm" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Finishing">
                  <input value={form.finishing} onChange={e => set('finishing', e.target.value)} className={inp} placeholder="Laminasi Doff + Spot UV" />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Catatan Khusus">
                  <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className={`${inp} resize-none min-h-[96px]`} rows={4} placeholder="Catatan tambahan..." />
                </Field>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 overflow-hidden">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAdvanced(prev => !prev);
              }}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-zinc-100/80 transition-colors"
            >
              <div>
                <p className="text-sm font-semibold text-zinc-800">Pengaturan lanjutan</p>
                <p className="text-xs text-zinc-500 mt-0.5">Timeline, harga internal, dan status link tracking klien.</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 shrink-0">
                {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {showAdvanced && (
              <div className="border-t border-zinc-200 bg-white px-4 py-4 space-y-5">
                {/* Timeline */}
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Timeline</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Deadline" required={false}>
                      <input type="date" value={form.deadline_date} onChange={e => set('deadline_date', e.target.value)} className={inp} />
                    </Field>
                    <Field label="Estimasi Selesai">
                      <input type="date" value={form.estimated_done_date} onChange={e => set('estimated_done_date', e.target.value)} className={inp} />
                    </Field>
                  </div>
                </div>

                {/* Harga */}
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Harga internal</p>
                  <p className="text-[10px] text-zinc-400 mb-3">Bagian ini hanya terlihat di dashboard Anda.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="HPP (Rp)">
                      <input type="number" value={form.price_hpp} onChange={e => set('price_hpp', e.target.value)} className={inp} placeholder="0" />
                    </Field>
                    <Field label="Harga Jual (Rp)">
                      <input type="number" value={form.price_sell} onChange={e => set('price_sell', e.target.value)} className={inp} placeholder="0" />
                    </Field>
                    <Field label="DP (Rp)">
                      <input type="number" value={form.dp_amount} onChange={e => set('dp_amount', e.target.value)} className={inp} placeholder="0" />
                    </Field>
                    <Field label="Status DP">
                      <button type="button" onClick={() => set('dp_paid', !form.dp_paid)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all w-full ${form.dp_paid ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-zinc-200 text-zinc-500 bg-white'}`}>
                        {form.dp_paid ? <ToggleRight size={16} className="text-emerald-600" /> : <ToggleLeft size={16} />}
                        {form.dp_paid ? 'Lunas' : 'Belum'}
                      </button>
                    </Field>
                  </div>
                </div>

                {/* Tracking */}
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Link Tracking Klien</p>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <button type="button" onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      set('is_tracking_active', !form.is_tracking_active);
                    }}
                      className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 mt-0.5 ${form.is_tracking_active ? 'bg-blue-500' : 'bg-zinc-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.is_tracking_active ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <div>
                      <p className="text-sm text-zinc-700 font-medium">Aktifkan link tracking untuk klien</p>
                      <p className="text-xs text-zinc-500 mt-0.5">Jika aktif, link progress bisa langsung dibuka tanpa login.</p>
                    </div>
                  </label>
                  {isEdit && resolveTrackingUrl(order) && (
                    <div className="mt-3 bg-zinc-50 rounded-lg p-3 flex items-center gap-2">
                      <Link size={12} className="text-zinc-400 shrink-0" />
                      <span className="text-xs text-zinc-500 truncate flex-1">{resolveTrackingUrl(order)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}
        </form>

        <div className="px-6 py-4 border-t border-zinc-100 shrink-0 flex gap-2 bg-white">
          <button onClick={onClose} className="px-4 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:bg-zinc-50 transition-colors">Batal</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
            {loading && <Loader2 size={13} className="animate-spin" />}
            {isEdit ? 'Simpan Perubahan' : 'Simpan & Generate Link'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Update status modal ───────────────────────────────────────────────────────
function UpdateStatusModal({ order, user, onClose, onUpdated }) {
  const [status,    setStatus]    = useState(order.current_status);
  const [note,      setNote]      = useState('');
  const [photo,     setPhoto]     = useState(null);
  const [notifyWA,  setNotifyWA]  = useState(true);
  const [loading,   setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');

  const waLink = () => {
    const phone = order.client_phone?.replace(/\D/g, '').replace(/^0/, '62');
    const trackUrl = resolveTrackingUrl(order);
    const msg = `Halo ${order.client_name}! Ada update untuk pesanan ${order.order_number}:\n\n` +
      `📦 ${order.product_name}\n🔄 Status: ${STATUS_CONFIG[status]?.label}\n` +
      (note ? `📝 ${note}\n` : '') +
      (trackUrl ? `\nPantau progress Anda di: ${trackUrl}` : '');
    return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : null;
  };

  const handleUpdate = async () => {
    setLoading(true); setError('');
    try {
      let photoUrl = null;
      if (photo) {
        setUploading(true);
        photoUrl = await uploadOrderPhoto(user.id, photo);
        setUploading(false);
      }
      await addOrderStatusUpdate(order.id, {
        statusFrom: order.current_status,
        statusTo:   status,
        note:       note.trim() || null,
        photoUrl,
        updatedBy:  user.email,
      });
      if (notifyWA) {
        const wa = waLink();
        if (wa) window.open(wa, '_blank', 'noopener');
      }
      onUpdated();
    } catch (err) {
      setError(err.message || 'Gagal update status');
    } finally { setLoading(false); setUploading(false); }
  };

  const inp = 'w-full border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <h3 className="font-bold text-zinc-900">Update Status</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{order.order_number} · {order.client_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"><X size={16} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Status Baru</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className={inp}>
              {STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Catatan (opsional)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} className={`${inp} resize-none`}
              placeholder="Proses cetak selesai, masuk finishing..." />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Foto Progress (opsional)</label>
            <label className="flex items-center gap-2 border-2 border-dashed border-zinc-200 rounded-xl px-4 py-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
              <Upload size={15} className="text-zinc-400" />
              <span className="text-sm text-zinc-500">{photo ? photo.name : 'Upload foto progress'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={e => setPhoto(e.target.files?.[0] ?? null)} />
            </label>
          </div>

          {order.client_phone && (
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" checked={notifyWA} onChange={e => setNotifyWA(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-zinc-700">Kirim notifikasi WhatsApp ke klien</span>
            </label>
          )}

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2.5 border border-zinc-200 rounded-xl text-sm text-zinc-600 hover:bg-zinc-50 transition-colors">Batal</button>
            <button onClick={handleUpdate} disabled={loading || status === order.current_status}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              {(loading || uploading) && <Loader2 size={13} className="animate-spin" />}
              {uploading ? 'Upload foto...' : 'Update Status'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Detail drawer ─────────────────────────────────────────────────────────────
function DetailDrawer({ order, user, onClose, onEdit, onUpdate, onRefresh }) {
  const [tab, setTab]       = useState('info');
  const { copied, copy }    = useCopy();
  const [toggling, setToggling] = useState(false);

  const toggleTracking = async () => {
    setToggling(true);
    try { await toggleOrderTracking(order.id, !order.is_tracking_active); onRefresh(); }
    catch (e) { console.error(e); }
    finally { setToggling(false); }
  };

  const waShare = () => {
    const phone = order.client_phone?.replace(/\D/g, '').replace(/^0/, '62');
    const msg = `Halo ${order.client_name}! Anda bisa memantau progress pesanan ${order.order_number} (${order.product_name}) secara real-time di:\n${resolveTrackingUrl(order)}`;
    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank', 'noopener');
  };

  const Row = ({ label, value }) => value ? (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-zinc-50 last:border-0">
      <span className="text-xs text-zinc-400 shrink-0">{label}</span>
      <span className="text-xs text-zinc-800 text-right font-medium">{value}</span>
    </div>
  ) : null;

  const updates = order.order_updates ?? [];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-end p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ x: 440 }} animate={{ x: 0 }} exit={{ x: 440 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col h-full max-h-[96vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-zinc-100 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-black text-zinc-900">{order.order_number}</span>
              <StatusBadge status={order.current_status} />
            </div>
            <p className="text-xs text-zinc-500">{order.client_name} · {order.product_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors shrink-0"><X size={15} /></button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 py-3 border-b border-zinc-100 shrink-0">
          <button onClick={onUpdate} className="flex-1 text-xs font-semibold py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Update Status</button>
          <button onClick={onEdit} className="px-3 py-2 border border-zinc-200 rounded-lg text-xs text-zinc-600 hover:bg-zinc-50 transition-colors"><Edit size={13} /></button>
          {order.client_phone && (
            <a href={`https://wa.me/${order.client_phone.replace(/\D/g,'').replace(/^0/,'62')}`}
              target="_blank" rel="noopener noreferrer"
              className="px-3 py-2 border border-emerald-200 rounded-lg text-xs text-emerald-600 hover:bg-emerald-50 transition-colors">
              <MessageCircle size={13} />
            </a>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-100 shrink-0">
          {[['info','Info'],['timeline','Timeline'],['tracking','Link']].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${tab === id ? 'text-blue-600 border-b-2 border-blue-600' : 'text-zinc-400 hover:text-zinc-600'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-5">

          {/* Tab: Info */}
          {tab === 'info' && (
            <div className="space-y-4">
              <div className="bg-zinc-50 rounded-xl p-4">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Klien</p>
                <Row label="Nama"     value={order.client_name} />
                <Row label="WhatsApp" value={order.client_phone} />
                <Row label="Email"    value={order.client_email} />
              </div>
              <div className="bg-zinc-50 rounded-xl p-4">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Pesanan</p>
                <Row label="Produk"    value={order.product_name} />
                <Row label="Jenis"     value={order.product_type} />
                <Row label="Jumlah"    value={`${order.quantity?.toLocaleString('id-ID')} ${order.unit}`} />
                <Row label="Kertas"    value={order.paper_type} />
                <Row label="Ukuran"    value={order.size} />
                <Row label="Finishing" value={order.finishing} />
              </div>
              <div className="bg-zinc-50 rounded-xl p-4">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Harga & Timeline</p>
                <Row label="Deadline"     value={formatDate(order.deadline_date)} />
                <Row label="Est. Selesai" value={formatDate(order.estimated_done_date)} />
                {order.price_sell && <Row label="Harga Jual" value={`Rp ${order.price_sell.toLocaleString('id-ID')}`} />}
                {order.dp_amount  && <Row label="DP"         value={`Rp ${order.dp_amount.toLocaleString('id-ID')} · ${order.dp_paid ? 'Lunas' : 'Belum'}`} />}
              </div>
              {order.notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Catatan</p>
                  <p className="text-xs text-amber-800">{order.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* Tab: Timeline */}
          {tab === 'timeline' && (
            <div className="space-y-4">
              {/* Stepper */}
              <div className="space-y-0">
                {STEP_STATUSES.map((s, i) => {
                  const cfg = STATUS_CONFIG[s];
                  const currentStep = STATUS_CONFIG[order.current_status]?.step ?? 0;
                  const done   = cfg.step < currentStep;
                  const active = cfg.step === currentStep;
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
                        {done ? <Check size={11} className="text-white" /> :
                         active ? <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> :
                                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />}
                      </div>
                      <div className="pt-1">
                        <p className={`text-sm font-semibold ${done || active ? 'text-zinc-900' : 'text-zinc-300'}`}>{cfg.label}</p>
                        {active && <p className="text-[11px] text-blue-500 mt-0.5">Sedang berjalan...</p>}
                        {done   && <p className="text-[11px] text-emerald-500 mt-0.5">Selesai ✓</p>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Log */}
              {updates.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Riwayat Update</p>
                  <div className="space-y-2">
                    {[...updates].reverse().map((u, i) => (
                      <div key={i} className="flex gap-3 text-xs">
                        <div className="w-5 h-5 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 mt-0.5">
                          <RefreshCw size={9} className="text-zinc-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <StatusBadge status={u.status_to} />
                            <span className="text-zinc-400">{formatRelative(u.created_at)}</span>
                          </div>
                          {u.note && <p className="text-zinc-600 mt-1">{u.note}</p>}
                          {u.photo_url && (
                            <a href={u.photo_url} target="_blank" rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-blue-500 hover:underline">
                              <ExternalLink size={10} /> Lihat foto
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Tracking */}
          {tab === 'tracking' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-2">Link Tracking Klien</p>
                <p className="text-xs text-zinc-600 break-all mb-3">{resolveTrackingUrl(order) || '—'}</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => copy(resolveTrackingUrl(order))}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-50 transition-colors">
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    {copied ? 'Disalin!' : 'Copy Link'}
                  </button>
                  <a href={resolveTrackingUrl(order)} target="_blank" rel="noopener noreferrer"
                    className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-semibold rounded-lg transition-colors ${
                      order.is_tracking_active
                        ? 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-400 pointer-events-none'
                    }`}>
                    <ExternalLink size={11} /> Buka Preview
                  </a>
                  <button onClick={waShare} disabled={!order.is_tracking_active}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      order.is_tracking_active
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                    }`}>
                    <Share2 size={11} /> Share WA
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-zinc-800">Status Link</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{order.is_tracking_active ? 'Klien bisa membuka link ini' : 'Link tidak aktif'}</p>
                </div>
                <button onClick={toggleTracking} disabled={toggling}
                  className={`w-12 h-6 rounded-full transition-colors flex items-center px-0.5 ${order.is_tracking_active ? 'bg-blue-500' : 'bg-zinc-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${order.is_tracking_active ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ClientTracker({ user }) {
  const [orders,      setOrders]     = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [search,      setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAdd,     setShowAdd]    = useState(false);
  const [editOrder,   setEditOrder]  = useState(null);
  const [updateOrder, setUpdateOrder] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try { setOrders(await getUserClientOrders(user.id)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchSearch = !q || o.client_name.toLowerCase().includes(q) || o.order_number.toLowerCase().includes(q) || o.product_name.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || o.current_status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Stats
  const totalActive    = orders.filter(o => ACTIVE_STATUSES.includes(o.current_status)).length;
  const totalSelesai   = orders.filter(o => o.current_status === 'selesai').length;
  const withDeadline   = orders.filter(o => o.deadline_date && ACTIVE_STATUSES.includes(o.current_status));
  const nearDeadline   = withDeadline.filter(o => new Date(o.deadline_date) - Date.now() < 3 * 86400000).length;

  const handleSaved = async () => {
    await load();
    setShowAdd(false);
    setEditOrder(null);
  };
  const handleUpdated = async () => {
    await load();
    setUpdateOrder(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus order ini?')) return;
    await deleteClientOrder(id);
    setOrders(p => p.filter(o => o.id !== id));
  };

  const { copy, copied } = useCopy();

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-zinc-500 text-sm">Masuk untuk mengakses Client Tracker.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-zinc-900">Client Tracker</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Bagikan link progress order ke klien tanpa perlu login</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
          <Plus size={15} /> Tambah Order Baru
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Order Aktif',      value: totalActive,  icon: Package,       color: 'text-blue-600',    bg: 'bg-blue-50'    },
          { label: 'Hampir Deadline',  value: nearDeadline, icon: Clock,         color: 'text-orange-600',  bg: 'bg-orange-50'  },
          { label: 'Selesai Bulan Ini',value: totalSelesai, icon: CheckCircle,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Order',      value: orders.length,icon: Users,         color: 'text-zinc-600',    bg: 'bg-zinc-50'    },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bg}`}>
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className="text-xl font-black text-zinc-900">{value}</p>
              <p className="text-[11px] text-zinc-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama klien / nomor order..."
            className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-zinc-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white">
          <option value="all">Semua Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-zinc-400 gap-2">
            <Loader2 size={16} className="animate-spin" /> Memuat...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package size={36} className="text-zinc-200 mx-auto mb-3" />
            <p className="text-zinc-500 font-semibold">Belum ada order</p>
            <p className="text-zinc-400 text-sm mt-1">Klik "+ Tambah Order Baru" untuk membuat order pertama</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  {['No. Order','Klien','Produk','Status','Deadline','Aksi'].map(h => (
                    <th key={h} className="text-left text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {filtered.map(order => {
                  const isUrgent = order.deadline_date && new Date(order.deadline_date) - Date.now() < 86400000 && ACTIVE_STATUSES.includes(order.current_status);
                  return (
                    <tr key={order.id} className="hover:bg-zinc-50 transition-colors cursor-pointer" onClick={() => setDetailOrder(order)}>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-zinc-700">{order.order_number}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-zinc-900">{order.client_name}</p>
                        {order.client_phone && <p className="text-[11px] text-zinc-400">{order.client_phone}</p>}
                      </td>
                      <td className="px-4 py-3 text-zinc-700 max-w-[160px]">
                        <p className="truncate">{order.product_name}</p>
                        <p className="text-[11px] text-zinc-400">{order.quantity?.toLocaleString('id-ID')} {order.unit}</p>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={order.current_status} /></td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${isUrgent ? 'text-red-600 font-bold' : 'text-zinc-500'}`}>
                          {order.deadline_date ? formatDate(order.deadline_date) : '—'}
                          {isUrgent && ' ⚠'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setUpdateOrder(order)} title="Update Status"
                            className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <RefreshCw size={13} />
                          </button>
                          <button onClick={() => { copy(resolveTrackingUrl(order)); }} title="Copy Link"
                            className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                            {copied ? <Check size={13} className="text-emerald-500" /> : <Link size={13} />}
                          </button>
                          <button onClick={() => setEditOrder(order)} title="Edit"
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors">
                            <Edit size={13} />
                          </button>
                          <button onClick={() => handleDelete(order.id)} title="Hapus"
                            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAdd && (
          <AddEditModal key="add" user={user} onClose={() => setShowAdd(false)} onSaved={handleSaved} />
        )}
        {editOrder && (
          <AddEditModal key="edit" order={editOrder} user={user} onClose={() => setEditOrder(null)} onSaved={handleSaved} />
        )}
        {updateOrder && (
          <UpdateStatusModal key="update" order={updateOrder} user={user} onClose={() => setUpdateOrder(null)} onUpdated={handleUpdated} />
        )}
        {detailOrder && (
          <DetailDrawer key="detail" order={orders.find(o => o.id === detailOrder.id) ?? detailOrder}
            user={user} onClose={() => setDetailOrder(null)}
            onEdit={() => { setEditOrder(detailOrder); setDetailOrder(null); }}
            onUpdate={() => setUpdateOrder(detailOrder)}
            onRefresh={load}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

