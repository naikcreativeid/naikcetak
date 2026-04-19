import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Plus, Search, Pencil, Trash2, X, Copy, Printer } from 'lucide-react';
import { loadKertas, saveKertas, genId, formatRp, hargaPerLembar } from '../lib/masterData';

const EMPTY = { nama: '', gsm: '', p: '', l: '', hargaRim: '' };

// ── Add / Edit Form ───────────────────────────────────────────────────────────
function KertasForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ? { ...initial } : EMPTY);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const perLembar = +form.hargaRim ? hargaPerLembar(+form.hargaRim) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nama || !form.gsm || !form.p || !form.l || !form.hargaRim) return;
    onSave({ ...form, gsm: +form.gsm, p: +form.p, l: +form.l, hargaRim: +form.hargaRim });
  };

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="card shadow-sm mb-4">
      <div className="card-header">
        <span className="section-title">{initial?.id ? 'Edit Kertas' : 'Tambah Kertas Baru'}</span>
        <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-600 transition-colors"><X size={15} /></button>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="label">Nama Kertas *</label>
          <input className="input-field" placeholder="Duplex, Art Paper, HVS..." value={form.nama}
            onChange={e => set('nama', e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Gramatur (gsm) *</label>
            <input type="number" min="1" className="input-field" placeholder="300"
              value={form.gsm} onChange={e => set('gsm', e.target.value)} required />
          </div>
          <div>
            <label className="label">Harga / Rim (Rp) *</label>
            <input type="number" min="0" className="input-field" placeholder="2500000"
              value={form.hargaRim} onChange={e => set('hargaRim', e.target.value)} required />
          </div>
          <div>
            <label className="label">Panjang / P (cm) *</label>
            <input type="number" min="1" step="0.1" className="input-field" placeholder="79"
              value={form.p} onChange={e => set('p', e.target.value)} required />
          </div>
          <div>
            <label className="label">Lebar / L (cm) *</label>
            <input type="number" min="1" step="0.1" className="input-field" placeholder="109"
              value={form.l} onChange={e => set('l', e.target.value)} required />
          </div>
        </div>
        {perLembar > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm">
            <span className="text-blue-500 font-semibold">Harga per lembar otomatis: </span>
            <span className="text-blue-800 font-black">{formatRp(perLembar)}</span>
            <span className="text-blue-400 text-xs ml-1">(rim ÷ 500)</span>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel} className="btn-ghost px-4 py-2 rounded-lg text-sm">Batal</button>
          <button type="submit" className="btn-primary px-5 py-2 rounded-lg text-sm">Simpan</button>
        </div>
      </form>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MasterKertas() {
  const [items, setItems]       = useState([]);
  const [search, setSearch]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { setItems(loadKertas()); }, []);

  const filtered = items.filter(k =>
    k.nama.toLowerCase().includes(search.toLowerCase())
  );

  const write = (updated) => { setItems(updated); saveKertas(updated); };

  const handleSave = (form) => {
    if (form.id) {
      write(items.map(k => k.id === form.id ? form : k));
    } else {
      write([{ ...form, id: genId() }, ...items]);
    }
    setShowForm(false);
    setEditItem(null);
  };

  const handleDelete = (id) => {
    write(items.filter(k => k.id !== id));
    setDeleteId(null);
  };

  const handleDuplicate = (k) => {
    write([{ ...k, id: genId(), nama: k.nama + ' (Kopi)' }, ...items]);
  };

  const openEdit = (k) => { setEditItem(k); setShowForm(false); };
  const openAdd  = () => { setEditItem(null); setShowForm(v => !v); };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-zinc-900">Master Harga Kertas</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Database kertas — dipakai auto-fill di Potong Kertas & Hitung Cetakan</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => window.print()} className="btn-ghost px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <Printer size={12} /> Cetak
          </button>
          <button onClick={openAdd} className="btn-primary px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5">
            <Plus size={14} /> Tambah Baru
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input className="input-field pl-9" placeholder="Cari nama kertas..." value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 shadow-sm">
          <p className="section-title mb-1.5">Total Jenis Kertas</p>
          <p className="text-2xl font-black text-zinc-900">{items.length}</p>
        </div>
        <div className="card p-4 shadow-sm">
          <p className="section-title mb-1.5">Ditampilkan</p>
          <p className="text-2xl font-black text-zinc-900">{filtered.length}</p>
        </div>
      </div>

      {/* Form */}
      <AnimatePresence>
        {(showForm || editItem) && (
          <KertasForm
            initial={editItem}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditItem(null); }}
          />
        )}
      </AnimatePresence>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card shadow-sm p-12 text-center">
          <Database size={28} className="text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-zinc-400">
            {items.length === 0 ? 'Belum ada data kertas' : 'Tidak ada hasil pencarian'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filtered.map(k => (
              <motion.div key={k.id} layout
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                className="card shadow-sm">
                <div className="px-5 py-4 flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
                    <Database size={16} className="text-zinc-400" />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-zinc-900 text-sm">{k.nama}</p>
                      <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-bold">
                        {k.gsm} gsm
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-zinc-400">{k.p} × {k.l} cm</span>
                      <span className="text-xs font-semibold text-emerald-600">{formatRp(k.hargaRim)} / rim</span>
                      <span className="text-xs font-semibold text-blue-600">{formatRp(hargaPerLembar(k.hargaRim))} / lbr</span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={() => handleDuplicate(k)} title="Duplikat"
                      className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors">
                      <Copy size={13} />
                    </button>
                    <button onClick={() => openEdit(k)}
                      className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setDeleteId(k.id)}
                      className="p-2 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Inline delete confirm */}
                <AnimatePresence>
                  {deleteId === k.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-5 py-3 bg-red-50 border-t border-red-100 flex items-center justify-between gap-3">
                        <p className="text-xs text-red-700 font-semibold">Hapus "{k.nama}"? Tidak bisa dibatalkan.</p>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => setDeleteId(null)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-white border border-zinc-200 font-bold text-zinc-600">
                            Batal
                          </button>
                          <button onClick={() => handleDelete(k.id)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white font-bold">
                            Hapus
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <p className="text-center text-[11px] text-zinc-400 pb-4">
        Data kertas disimpan secara lokal di browser Anda.
      </p>
    </div>
  );
}
