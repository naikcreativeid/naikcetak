import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Plus, Search, Pencil, Trash2, X, Copy } from 'lucide-react';
import { loadMesin, saveMesin, genId, formatRp } from '../lib/masterData';

const EMPTY = { nama: '', minLembar: '', hargaPer1000: '', hargaWarnaKhusus: '', hargaPlat: '', hargaTambahan: '' };

// ── Form ──────────────────────────────────────────────────────────────────────
function MesinForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ?? EMPTY);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nama || !form.hargaPer1000) return;
    onSave({
      ...form,
      minLembar:        +form.minLembar        || 0,
      hargaPer1000:     +form.hargaPer1000     || 0,
      hargaWarnaKhusus: +form.hargaWarnaKhusus || 0,
      hargaPlat:        +form.hargaPlat        || 0,
      hargaTambahan:    +form.hargaTambahan     || 0,
    });
  };

  // Preview: harga 1 lembar di atas minimum
  const preview1000 = +form.hargaPer1000 || 0;
  const previewPerLembar = preview1000 > 0 ? preview1000 / 1000 : 0;

  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      className="card shadow-sm mb-4">
      <div className="card-header">
        <span className="section-title">{initial?.id ? 'Edit Mesin' : 'Tambah Mesin Baru'}</span>
        <button onClick={onCancel} className="text-zinc-400 hover:text-zinc-600"><X size={15} /></button>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="label">Nama Mesin *</label>
          <input className="input-field" placeholder="SM52, GTO, Digital A3..."
            value={form.nama} onChange={e => set('nama', e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Min. Lembar</label>
            <input type="number" min="0" className="input-field" placeholder="1000"
              value={form.minLembar} onChange={e => set('minLembar', e.target.value)} />
          </div>
          <div>
            <label className="label">Harga per 1.000 Lbr (Rp) *</label>
            <input type="number" min="0" className="input-field" placeholder="85000"
              value={form.hargaPer1000} onChange={e => set('hargaPer1000', e.target.value)} required />
          </div>
          <div>
            <label className="label">Harga Warna Khusus (Rp)</label>
            <input type="number" min="0" className="input-field" placeholder="50000"
              value={form.hargaWarnaKhusus} onChange={e => set('hargaWarnaKhusus', e.target.value)} />
          </div>
          <div>
            <label className="label">Harga Plat / Warna (Rp)</label>
            <input type="number" min="0" className="input-field" placeholder="55000"
              value={form.hargaPlat} onChange={e => set('hargaPlat', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="label">Harga Tambahan / Lembar di Atas Min (Rp)</label>
            <input type="number" min="0" className="input-field" placeholder="85"
              value={form.hargaTambahan} onChange={e => set('hargaTambahan', e.target.value)} />
          </div>
        </div>

        {previewPerLembar > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-sm text-blue-700">
            ≈ {formatRp(previewPerLembar)} / lembar
            {+form.minLembar > 0 && (
              <span className="ml-2 text-blue-500">· min {Number(form.minLembar).toLocaleString('id-ID')} lembar</span>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button type="submit" className="btn-primary flex-1">
            {initial?.id ? 'Simpan Perubahan' : 'Tambah Mesin'}
          </button>
          <button type="button" onClick={onCancel} className="btn-ghost px-4">Batal</button>
        </div>
      </form>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MasterMesin() {
  const [items, setItems] = useState(() => loadMesin());
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const filtered = items.filter(m =>
    m.nama.toLowerCase().includes(search.toLowerCase())
  );

  const persist = (updated) => { setItems(updated); saveMesin(updated); };

  const handleSave = (data) => {
    if (data.id) {
      persist(items.map(m => m.id === data.id ? data : m));
    } else {
      persist([{ ...data, id: genId() }, ...items]);
    }
    setShowForm(false);
    setEditItem(null);
  };

  const handleDelete = (id) => {
    persist(items.filter(m => m.id !== id));
    setDeleteId(null);
  };

  const handleDuplicate = (item) => {
    const copy = { ...item, id: genId(), nama: item.nama + ' (Kopi)' };
    persist([copy, ...items]);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-black text-zinc-900">Pengaturan Mesin</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            {items.length} mesin tersimpan — digunakan di Kalkulator Biaya Cetak
          </p>
        </div>
        <button
          onClick={() => { setEditItem(null); setShowForm(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={14} /> Tambah Mesin
        </button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {(showForm || editItem) && (
          <MesinForm
            key={editItem?.id ?? 'new'}
            initial={editItem}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditItem(null); }}
          />
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          className="input-field pl-8"
          placeholder="Cari nama mesin..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-zinc-400 text-sm">
          {search ? 'Tidak ada mesin yang cocok.' : 'Belum ada data mesin. Tambah dulu!'}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="text-left px-4 py-3 font-semibold text-zinc-600">Nama Mesin</th>
                  <th className="text-right px-4 py-3 font-semibold text-zinc-600">Min. Lbr</th>
                  <th className="text-right px-4 py-3 font-semibold text-zinc-600">Harga/1.000</th>
                  <th className="text-right px-4 py-3 font-semibold text-zinc-600 hidden sm:table-cell">Warna Khusus</th>
                  <th className="text-right px-4 py-3 font-semibold text-zinc-600 hidden sm:table-cell">Plat/Warna</th>
                  <th className="text-right px-4 py-3 font-semibold text-zinc-600 hidden md:table-cell">+/Lbr</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((m, i) => (
                    <motion.tr
                      key={m.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`border-b border-zinc-100 last:border-0 ${i % 2 === 0 ? '' : 'bg-zinc-50/50'}`}
                    >
                      <td className="px-4 py-3 font-semibold text-zinc-800">{m.nama}</td>
                      <td className="px-4 py-3 text-right text-zinc-600">
                        {m.minLembar > 0 ? Number(m.minLembar).toLocaleString('id-ID') : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-700">
                        {formatRp(m.hargaPer1000)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-600 hidden sm:table-cell">
                        {m.hargaWarnaKhusus > 0 ? formatRp(m.hargaWarnaKhusus) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-600 hidden sm:table-cell">
                        {m.hargaPlat > 0 ? formatRp(m.hargaPlat) : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-500 hidden md:table-cell">
                        {m.hargaTambahan > 0 ? formatRp(m.hargaTambahan) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {deleteId === m.id ? (
                            <>
                              <span className="text-xs text-red-600 font-semibold mr-1">Hapus?</span>
                              <button onClick={() => handleDelete(m.id)}
                                className="text-xs bg-red-600 text-white px-2 py-1 rounded-md hover:bg-red-700 transition-colors">
                                Ya
                              </button>
                              <button onClick={() => setDeleteId(null)}
                                className="text-xs text-zinc-500 px-2 py-1 rounded-md hover:bg-zinc-100 transition-colors">
                                Batal
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleDuplicate(m)}
                                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors"
                                title="Duplikat">
                                <Copy size={13} />
                              </button>
                              <button onClick={() => { setEditItem(m); setShowForm(false); }}
                                className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Edit">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => setDeleteId(m.id)}
                                className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="Hapus">
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info harga */}
      <div className="text-xs text-zinc-400 px-1">
        Harga/1.000 = biaya cetak per 1.000 lembar · Plat dikenakan per warna · Warna khusus = biaya tambahan spot color
      </div>
    </div>
  );
}
