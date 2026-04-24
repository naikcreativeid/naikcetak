import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, Plus, Trash2, Printer, MessageCircle, Save, RefreshCw,
  History, ArrowLeft, Search, FileText,
} from 'lucide-react';
import { genId } from '../lib/masterData';

const KEY_LIST    = 'naikcetak_sj_list';
const KEY_COUNTER = 'naikcetak_sj_counter';
const KEY_DRAFT   = 'naikcetak_sj_draft';
const KEY_TOKO    = 'naikcetak_toko_profile';

const pad = (n, len = 3) => String(n).padStart(len, '0');

function genNoSJ(counter) {
  const d = new Date();
  return `SJ/${d.getFullYear()}/${pad(d.getMonth() + 1, 2)}/${pad(counter)}`;
}

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function saveJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

function formatTglID(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

const emptyProduk = () => ({ id: genId(), nama: '', spesifikasi: '', qty: '', satuan: 'pcs' });

const makeDefault = () => {
  const toko = loadJSON(KEY_TOKO, {}) || {};
  const counter = Number(localStorage.getItem(KEY_COUNTER) || 0) + 1;
  return {
    namaPercetakan:    toko.namaPercetakan    || 'NaikCetakPro',
    alamatPercetakan:  toko.alamatPercetakan  || '',
    teleponPercetakan: toko.teleponPercetakan || '',
    websitePercetakan: toko.websitePercetakan || '',
    noSJ:     genNoSJ(counter),
    tanggal:  new Date().toISOString().slice(0, 10),
    namaKlien: '', noWAKlien: '', alamatTujuan: '',
    produk: [emptyProduk(), emptyProduk()],
    catatan: 'Barang harap diperiksa saat diterima. Kerusakan setelah pengiriman bukan tanggung jawab percetakan.',
  };
};

// ── Dokumen cetak (satu komponen, dirender di preview & dicetak) ────────────
function SJDoc({ data, copyLabel }) {
  const totalItem = data.produk.reduce((s, p) => s + (Number(p.qty) || 0), 0);
  return (
    <div className="sj-half">
      <div className="sj-copy-tag">{copyLabel}</div>
      <div className="doc-kop">
        <div>
          <div className="doc-kop-logo">{data.namaPercetakan || '—'}</div>
          <div className="doc-kop-addr">
            {[data.alamatPercetakan, data.teleponPercetakan, data.websitePercetakan].filter(Boolean).join(' · ')}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="doc-title">Surat Jalan</div>
          <div className="doc-no">No. {data.noSJ}</div>
          <div className="doc-date">{formatTglID(data.tanggal)}</div>
        </div>
      </div>

      <div className="doc-meta">
        <div>
          <div className="doc-meta-label">Kepada</div>
          <div className="doc-meta-val">{data.namaKlien || '—'}</div>
          {data.noWAKlien && <div style={{ fontSize: '8pt', color: '#555' }}>{data.noWAKlien}</div>}
        </div>
        <div>
          <div className="doc-meta-label">Alamat Tujuan</div>
          <div className="doc-meta-val">{data.alamatTujuan || '—'}</div>
        </div>
      </div>

      <table className="doc-tbl">
        <thead>
          <tr>
            <th style={{ width: '22pt' }}>No</th>
            <th>Nama Produk</th>
            <th>Spesifikasi</th>
            <th style={{ width: '40pt', textAlign: 'right' }}>Qty</th>
            <th style={{ width: '48pt' }}>Satuan</th>
          </tr>
        </thead>
        <tbody>
          {data.produk.filter(p => p.nama || p.qty).map((p, i) => (
            <tr key={p.id}>
              <td>{i + 1}</td>
              <td>{p.nama || '—'}</td>
              <td>{p.spesifikasi || '—'}</td>
              <td style={{ textAlign: 'right' }}>{p.qty || '—'}</td>
              <td>{p.satuan}</td>
            </tr>
          ))}
          {data.produk.filter(p => p.nama || p.qty).length === 0 && (
            <tr><td colSpan={5} style={{ textAlign: 'center', color: '#999', padding: '10pt' }}>Belum ada produk</td></tr>
          )}
          <tr><td colSpan={3} style={{ background: '#F5F5F5', fontWeight: 700 }}>Total Item</td>
            <td style={{ textAlign: 'right', background: '#F5F5F5', fontWeight: 700 }}>{totalItem}</td>
            <td style={{ background: '#F5F5F5' }} /></tr>
        </tbody>
      </table>

      {data.catatan && (
        <div className="doc-catatan">
          <div className="doc-catatan-label">Catatan</div>
          <div className="doc-catatan-val">{data.catatan}</div>
        </div>
      )}

      <div className="doc-footer" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="doc-ttd"><div className="doc-ttd-label">Pengirim</div><div className="doc-ttd-line">(......................)</div></div>
        <div className="doc-ttd"><div className="doc-ttd-label">Kurir</div><div className="doc-ttd-line">(......................)</div></div>
        <div className="doc-ttd"><div className="doc-ttd-label">Penerima</div><div className="doc-ttd-line">(......................)</div></div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SuratJalan() {
  const [tab, setTab]         = useState('form'); // 'form' | 'riwayat'
  const [form, setForm]       = useState(() => loadJSON(KEY_DRAFT, null) || makeDefault());
  const [riwayat, setRiwayat] = useState(() => loadJSON(KEY_LIST, []));
  const [search, setSearch]   = useState('');
  const [toast, setToast]     = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const formRef = useRef(form);
  formRef.current = form;

  // Auto-save draft every 30s
  useEffect(() => {
    const id = setInterval(() => saveJSON(KEY_DRAFT, formRef.current), 30000);
    return () => clearInterval(id);
  }, []);

  // Save draft on form change (debounced)
  useEffect(() => {
    const id = setTimeout(() => saveJSON(KEY_DRAFT, form), 500);
    return () => clearTimeout(id);
  }, [form]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const updateProduk = (id, k, v) =>
    setForm(p => ({ ...p, produk: p.produk.map(x => x.id === id ? { ...x, [k]: v } : x) }));

  const tambahProduk = () => setForm(p => ({ ...p, produk: [...p.produk, emptyProduk()] }));
  const hapusProduk  = (id) => setForm(p => ({
    ...p, produk: p.produk.length <= 1 ? p.produk : p.produk.filter(x => x.id !== id),
  }));

  const regenerateNo = () => {
    const counter = Number(localStorage.getItem(KEY_COUNTER) || 0) + 1;
    set('noSJ', genNoSJ(counter));
  };

  const handleSimpan = () => {
    const counter = Number(localStorage.getItem(KEY_COUNTER) || 0) + 1;
    const entry = { ...form, id: form._id || genId(), savedAt: new Date().toISOString() };
    delete entry._id;
    const list = [entry, ...riwayat.filter(r => r.id !== entry.id)];
    setRiwayat(list);
    saveJSON(KEY_LIST, list);
    localStorage.setItem(KEY_COUNTER, String(counter));
    showToast('Surat jalan tersimpan di riwayat ✓');
  };

  const handlePrint = () => {
    saveJSON(KEY_DRAFT, form);
    window.print();
  };

  const handleWA = () => {
    if (!form.noWAKlien) { showToast('Isi nomor WhatsApp klien dulu'); return; }
    const noWA = form.noWAKlien.replace(/\D/g, '').replace(/^0/, '62');
    const list = form.produk.filter(p => p.nama)
      .map((p, i) => `${i + 1}. ${p.nama} — ${p.qty} ${p.satuan}`).join('\n');
    const txt = encodeURIComponent(
      `*SURAT JALAN — ${form.noSJ}*\n` +
      `Tanggal: ${formatTglID(form.tanggal)}\n\n` +
      `*Kepada:* ${form.namaKlien}\n` +
      `*Alamat:* ${form.alamatTujuan}\n\n` +
      `*Daftar Produk:*\n${list}\n\n` +
      `Silakan periksa barang saat diterima. Terima kasih 🙏\n\n— ${form.namaPercetakan}`
    );
    window.open(`https://wa.me/${noWA}?text=${txt}`, '_blank');
  };

  const handleBaru = () => {
    saveJSON(KEY_DRAFT, null);
    setForm(makeDefault());
    setTab('form');
    showToast('Form baru siap diisi');
  };

  const loadFromRiwayat = (r) => {
    setForm({ ...r, _id: r.id });
    setTab('form');
  };

  const hapusRiwayat = (id) => {
    const list = riwayat.filter(r => r.id !== id);
    setRiwayat(list);
    saveJSON(KEY_LIST, list);
    setDeleteId(null);
    showToast('Riwayat dihapus');
  };

  const filtered = useMemo(() => {
    if (!search) return riwayat;
    const q = search.toLowerCase();
    return riwayat.filter(r =>
      (r.noSJ || '').toLowerCase().includes(q) ||
      (r.namaKlien || '').toLowerCase().includes(q)
    );
  }, [riwayat, search]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap" data-no-print>
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <Truck size={22} className="text-blue-600" /> Surat Jalan
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Buat dan cetak surat jalan — 1 lembar A4 untuk 2 salinan</p>
        </div>
        <div className="flex gap-1 bg-zinc-100 p-1 rounded-lg">
          <button onClick={() => setTab('form')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${tab === 'form' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}>
            Form
          </button>
          <button onClick={() => setTab('riwayat')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1.5 ${tab === 'riwayat' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}>
            <History size={12} /> Riwayat ({riwayat.length})
          </button>
        </div>
      </div>

      {tab === 'form' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-5" data-no-print>
          {/* ── FORM ───────────────────────────────────────────────────── */}
          <div className="space-y-4">
            <Section title="Identitas Percetakan">
              <Field label="Nama Percetakan" value={form.namaPercetakan} onChange={v => set('namaPercetakan', v)} />
              <Field label="Alamat"         value={form.alamatPercetakan} onChange={v => set('alamatPercetakan', v)} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Telepon"      value={form.teleponPercetakan} onChange={v => set('teleponPercetakan', v)} />
                <Field label="Website"      value={form.websitePercetakan} onChange={v => set('websitePercetakan', v)} />
              </div>
            </Section>

            <Section title="Detail Surat Jalan">
              <div>
                <label className="label">No. Surat Jalan</label>
                <div className="flex gap-2">
                  <input className="input-field flex-1" value={form.noSJ} onChange={e => set('noSJ', e.target.value)} />
                  <button onClick={regenerateNo} title="Generate ulang"
                    className="px-3 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50">
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
              <Field type="date" label="Tanggal Kirim" value={form.tanggal} onChange={v => set('tanggal', v)} />
            </Section>

            <Section title="Data Penerima">
              <Field label="Nama Klien"   value={form.namaKlien}    onChange={v => set('namaKlien', v)} />
              <Field label="No. WhatsApp" value={form.noWAKlien}    onChange={v => set('noWAKlien', v)} placeholder="08xx-xxxx-xxxx" />
              <div>
                <label className="label">Alamat Pengiriman</label>
                <textarea rows={2} className="input-field resize-none"
                  value={form.alamatTujuan} onChange={e => set('alamatTujuan', e.target.value)} />
              </div>
            </Section>

            <Section title="Daftar Produk">
              <div className="space-y-2">
                {form.produk.map((p, i) => (
                  <div key={p.id} className="grid grid-cols-[20px_1fr_1fr_70px_80px_28px] gap-1.5 items-center">
                    <span className="text-[11px] text-zinc-400 font-semibold">{i + 1}</span>
                    <input className="input-field !py-1.5 !text-xs" placeholder="Nama"
                      value={p.nama} onChange={e => updateProduk(p.id, 'nama', e.target.value)} />
                    <input className="input-field !py-1.5 !text-xs" placeholder="Spesifikasi"
                      value={p.spesifikasi} onChange={e => updateProduk(p.id, 'spesifikasi', e.target.value)} />
                    <input className="input-field !py-1.5 !text-xs" type="number" placeholder="Qty"
                      value={p.qty} onChange={e => updateProduk(p.id, 'qty', e.target.value)} />
                    <select className="input-field !py-1.5 !text-xs"
                      value={p.satuan} onChange={e => updateProduk(p.id, 'satuan', e.target.value)}>
                      {['pcs', 'set', 'rim', 'lembar', 'kg', 'roll', 'box', 'pack'].map(s => <option key={s}>{s}</option>)}
                    </select>
                    <button onClick={() => hapusProduk(p.id)} disabled={form.produk.length <= 1}
                      className="p-1.5 text-zinc-400 hover:text-red-600 disabled:opacity-30">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <button onClick={tambahProduk}
                  className="w-full py-1.5 border-2 border-dashed border-zinc-200 rounded-lg text-xs font-semibold text-zinc-500 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-1.5">
                  <Plus size={12} /> Tambah Produk
                </button>
              </div>
            </Section>

            <Section title="Catatan Pengiriman">
              <textarea rows={3} className="input-field resize-none"
                value={form.catatan} onChange={e => set('catatan', e.target.value)} />
            </Section>

            <div className="flex gap-2 flex-wrap sticky bottom-4 bg-white/90 backdrop-blur p-3 rounded-xl border border-zinc-200 shadow-sm">
              <button onClick={handleSimpan}
                className="flex-1 min-w-[120px] bg-zinc-900 text-white text-sm font-bold py-2.5 rounded-lg hover:bg-zinc-700 flex items-center justify-center gap-1.5">
                <Save size={14} /> Simpan
              </button>
              <button onClick={handlePrint}
                className="flex-1 min-w-[120px] bg-blue-600 text-white text-sm font-bold py-2.5 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1.5">
                <Printer size={14} /> Cetak
              </button>
              <button onClick={handleWA}
                className="px-4 bg-green-600 text-white text-sm font-bold py-2.5 rounded-lg hover:bg-green-700 flex items-center justify-center gap-1.5">
                <MessageCircle size={14} /> WA
              </button>
              <button onClick={handleBaru}
                className="px-4 border border-zinc-200 text-zinc-600 text-sm font-bold py-2.5 rounded-lg hover:bg-zinc-50">
                Baru
              </button>
            </div>
          </div>

          {/* ── PREVIEW ──────────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-4 h-fit">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Preview Cetak · A4</p>
            <div className="bg-zinc-100 rounded-xl p-4 overflow-auto max-h-[85vh]">
              <div className="doc-print-root bg-white shadow-lg mx-auto" style={{ width: '210mm', transform: 'scale(0.72)', transformOrigin: 'top left', marginBottom: -80 }}>
                <SJDoc data={form} copyLabel="Lembar Pengiriman" />
                <div className="sj-divider" />
                <SJDoc data={form} copyLabel="Arsip Percetakan" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <RiwayatTab
          rows={filtered}
          search={search}
          onSearch={setSearch}
          onNew={handleBaru}
          onLoad={loadFromRiwayat}
          onDelete={setDeleteId}
          deleteId={deleteId}
          onConfirmDelete={hapusRiwayat}
          onCancelDelete={() => setDeleteId(null)}
        />
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-lg z-50">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Subcomponents ────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-2.5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type={type} className="input-field" placeholder={placeholder}
        value={value ?? ''} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function RiwayatTab({ rows, search, onSearch, onNew, onLoad, onDelete, deleteId, onConfirmDelete, onCancelDelete }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5" data-no-print>
      <div className="flex gap-2 mb-4 items-center flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input value={search} onChange={e => onSearch(e.target.value)}
            className="input-field pl-9" placeholder="Cari no. SJ atau nama klien..." />
        </div>
        <button onClick={onNew}
          className="bg-zinc-900 text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-zinc-700 flex items-center gap-1.5">
          <Plus size={12} /> Buat SJ Baru
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-12 text-sm text-zinc-400">
          <FileText size={32} className="mx-auto mb-2 text-zinc-300" />
          {search ? 'Tidak ada yang cocok.' : 'Belum ada riwayat surat jalan.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left">
                <th className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">No. SJ</th>
                <th className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Klien</th>
                <th className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Produk</th>
                <th className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Tanggal</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                  <td className="px-3 py-3 font-mono text-xs">{r.noSJ}</td>
                  <td className="px-3 py-3 font-semibold">{r.namaKlien || '—'}</td>
                  <td className="px-3 py-3 text-zinc-500 text-xs">{(r.produk || []).filter(p => p.nama).length} item</td>
                  <td className="px-3 py-3 text-zinc-600 text-xs">{formatTglID(r.tanggal)}</td>
                  <td className="px-3 py-3 text-right">
                    <button onClick={() => onLoad(r)}
                      className="text-xs font-bold text-blue-600 hover:underline mr-3">Buka</button>
                    {deleteId === r.id ? (
                      <span className="inline-flex gap-1">
                        <button onClick={() => onConfirmDelete(r.id)}
                          className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded">Hapus</button>
                        <button onClick={onCancelDelete}
                          className="text-xs text-zinc-500 px-2 py-1">Batal</button>
                      </span>
                    ) : (
                      <button onClick={() => onDelete(r.id)}
                        className="text-xs text-zinc-400 hover:text-red-500">
                        <Trash2 size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
