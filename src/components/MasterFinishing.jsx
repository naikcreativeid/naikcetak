import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Plus, Search, Pencil, Trash2, X, Copy } from 'lucide-react';
import { loadFinishing, saveFinishing, genId, formatRp } from '../lib/masterData';

const JENIS_OPTIONS = [
  { value: 'per_cm2',        label: 'Per cm²'          },
  { value: 'per_lembar',     label: 'Per Lembar'        },
  { value: 'minimum_charge', label: 'Minimum Charge'    },
  { value: 'flat',           label: 'Flat (per job)'    },
];

const JENIS_BADGE = {
  per_cm2:        { label: 'Per cm²',       color: 'bg-blue-50 text-blue-600 border-blue-200'         },
  per_lembar:     { label: 'Per Lembar',    color: 'bg-violet-50 text-violet-600 border-violet-200'   },
  minimum_charge: { label: 'Min. Charge',   color: 'bg-orange-50 text-orange-600 border-orange-200'   },
  flat:           { label: 'Flat',          color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
};

const EMPTY = { nama: '', jenis: 'per_cm2', harga: '', min: '', hargaTambah: '', keterangan: '' };

// ── Formula preview ───────────────────────────────────────────────────────────
function FormulaPreview({ item }) {
  const { jenis, harga, min, hargaTambah } = item;
  if (jenis === 'per_cm2')
    return <span>P × L × <strong>{harga}</strong> × qty</span>;
  if (jenis === 'per_lembar')
    return <span>lembar × <strong>{formatRp(harga)}</strong></span>;
  if (jenis === 'minimum_charge')
    return <span>Min <strong>{formatRp(min)}</strong> + (lbr × <strong>{formatRp(hargaTambah)}</strong>)</span>;
  return <span>Flat <strong>{formatRp(harga)}</strong></span>;
}

// ── Form ──────────────────────────────────────────────────────────────────────
function FinishingForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ? { ...initial } : EMPTY);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nama) return;
    onSave({
      ...form,
      harga:       parseFloat(form.harga)       || 0,
      min:         parseFloat(form.min)         || 0,
      hargaTambah: parseFloat(form.hargaTambah) || 0,
    });
  };

  const needsMin        = form.jenis === 'minimum_charge';
  const needsHargaTambah = form.jenis === 'minimum_charge';
  const needsHarga      = form.jenis !== 'minimum_charge';

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="card shadow-sm mb-4">
      <div className="card-header">
        <span className="section-title">{initial?.id ? 'Edit Finishing' : 'Tambah Finishing Baru'}</span>
        <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-600 transition-colors"><X size={15} /></button>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="label">Nama Finishing *</label>
            <input className="input-field" placeholder="Laminating Doff, Pond, Hot Stamp..."
              value={form.nama} onChange={e => set('nama', e.target.value)} required />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label">Jenis Kalkulasi</label>
            <select className="input-field" value={form.jenis} onChange={e => set('jenis', e.target.value)}>
              {JENIS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Harga satuan — not shown for minimum_charge (uses min + hargaTambah) */}
          {needsHarga && (
            <div>
              <label className="label">
                {form.jenis === 'per_cm2' ? 'Harga per cm² (Rp)' :
                 form.jenis === 'per_lembar' ? 'Harga per Lembar (Rp)' : 'Harga Flat (Rp)'}
              </label>
              <input type="number" min="0" step="0.01" className="input-field"
                placeholder={form.jenis === 'per_cm2' ? '0.20' : '150'}
                value={form.harga} onChange={e => set('harga', e.target.value)} />
            </div>
          )}

          {needsMin && (
            <div>
              <label className="label">Minimum Charge (Rp)</label>
              <input type="number" min="0" className="input-field" placeholder="70000"
                value={form.min} onChange={e => set('min', e.target.value)} />
            </div>
          )}
          {needsHargaTambah && (
            <div>
              <label className="label">Harga Tambahan / Lbr (Rp)</label>
              <input type="number" min="0" className="input-field" placeholder="40"
                value={form.hargaTambah} onChange={e => set('hargaTambah', e.target.value)} />
            </div>
          )}

          <div className="col-span-2">
            <label className="label">Keterangan</label>
            <input className="input-field" placeholder="Catatan opsional..."
              value={form.keterangan} onChange={e => set('keterangan', e.target.value)} />
          </div>
        </div>

        {/* Formula preview */}
        <div className="bg-zinc-50 rounded-xl px-4 py-3 text-xs text-zinc-500">
          Formula: <FormulaPreview item={form} />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCancel} className="btn-ghost px-4 py-2 rounded-lg text-sm">Batal</button>
          <button type="submit" className="btn-primary px-5 py-2 rounded-lg text-sm">Simpan</button>
        </div>
      </form>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MasterFinishing() {
  const [items, setItems]       = useState([]);
  const [search, setSearch]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { setItems(loadFinishing()); }, []);

  const filtered = items.filter(f =>
    f.nama.toLowerCase().includes(search.toLowerCase())
  );

  const write = (updated) => { setItems(updated); saveFinishing(updated); };

  const handleSave = (form) => {
    if (form.id) write(items.map(f => f.id === form.id ? form : f));
    else write([{ ...form, id: genId() }, ...items]);
    setShowForm(false); setEditItem(null);
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-zinc-900">Master Finishing</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Database finishing — dipakai di dropdown Hitung Cetakan</p>
        </div>
        <button onClick={() => { setEditItem(null); setShowForm(v => !v); }}
          className="btn-primary px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 shrink-0">
          <Plus size={14} /> Tambah Baru
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input className="input-field pl-9" placeholder="Cari nama finishing..." value={search}
          onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Jenis', value: items.length },
          { label: 'Ditampilkan', value: filtered.length },
        ].map(s => (
          <div key={s.label} className="card p-4 shadow-sm">
            <p className="section-title mb-1.5">{s.label}</p>
            <p className="text-2xl font-black text-zinc-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      <AnimatePresence>
        {(showForm || editItem) && (
          <FinishingForm
            initial={editItem}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditItem(null); }}
          />
        )}
      </AnimatePresence>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card shadow-sm p-12 text-center">
          <Layers size={28} className="text-zinc-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-zinc-400">
            {items.length === 0 ? 'Belum ada data finishing' : 'Tidak ada hasil pencarian'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filtered.map(f => {
              const badge = JENIS_BADGE[f.jenis] ?? JENIS_BADGE.flat;
              return (
                <motion.div key={f.id} layout
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                  className="card shadow-sm">
                  <div className="px-5 py-4 flex items-start gap-4">
                    <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      <Layers size={16} className="text-zinc-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-zinc-900 text-sm">{f.nama}</p>
                        <span className={`text-[10px] border px-2 py-0.5 rounded-full font-bold ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-1">
                        <FormulaPreview item={f} />
                      </div>
                      {f.keterangan && (
                        <p className="text-xs text-zinc-400 mt-0.5 italic">{f.keterangan}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button onClick={() => write([{ ...f, id: genId(), nama: f.nama + ' (Kopi)' }, ...items])}
                        className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors">
                        <Copy size={13} />
                      </button>
                      <button onClick={() => { setEditItem(f); setShowForm(false); }}
                        className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteId(f.id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-500 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {deleteId === f.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-5 py-3 bg-red-50 border-t border-red-100 flex items-center justify-between gap-3">
                          <p className="text-xs text-red-700 font-semibold">Hapus "{f.nama}"?</p>
                          <div className="flex gap-2 shrink-0">
                            <button onClick={() => setDeleteId(null)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-white border border-zinc-200 font-bold text-zinc-600">Batal</button>
                            <button onClick={() => { write(items.filter(x => x.id !== f.id)); setDeleteId(null); }}
                              className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white font-bold">Hapus</button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
