import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, Plus, Trash2, Printer, MessageCircle, Mail, Save,
  RefreshCw, History, Search, Download, Users, X,
} from 'lucide-react';
import { genId, formatRp, loadKertas } from '../lib/masterData';

const KEY_LIST     = 'naikcetak_po_list';
const KEY_COUNTER  = 'naikcetak_po_counter';
const KEY_DRAFT    = 'naikcetak_po_draft';
const KEY_SUPPLIER = 'naikcetak_suppliers';
const KEY_TOKO     = 'naikcetak_toko_profile';

const pad = (n, len = 3) => String(n).padStart(len, '0');

function genNoPO(counter) {
  const d = new Date();
  return `PO/${d.getFullYear()}/${pad(d.getMonth() + 1, 2)}/${pad(counter)}`;
}

const loadJSON = (key, fb) => { try { return JSON.parse(localStorage.getItem(key)) ?? fb; } catch { return fb; } };
const saveJSON = (key, v)  => { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ } };

const formatTglID = (iso) => iso ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

const emptyItem = () => ({ id: genId(), nama: '', spesifikasi: '', qty: 1, satuan: 'rim', harga: 0 });

const makeDefault = () => {
  const toko = loadJSON(KEY_TOKO, {}) || {};
  const counter = Number(localStorage.getItem(KEY_COUNTER) || 0) + 1;
  const today = new Date();
  const due   = new Date(Date.now() + 3 * 86400000);
  return {
    namaPercetakan:    toko.namaPercetakan    || 'NaikCetakPro',
    alamatPercetakan:  toko.alamatPercetakan  || '',
    teleponPercetakan: toko.teleponPercetakan || '',
    emailPercetakan:   toko.emailPercetakan   || '',
    noPO: genNoPO(counter),
    tanggalOrder: today.toISOString().slice(0, 10),
    dueDate:      due.toISOString().slice(0, 10),
    prioritas: 'normal',
    metodeBayar: 'Transfer Bank',
    namaSupplier: '', alamatSupplier: '', noWASupplier: '',
    emailSupplier: '', picSupplier: '',
    items: [emptyItem()],
    diskon: 0, ppn: false,
    catatan: '',
  };
};

// Kalkulasi total
function hitungTotal(form) {
  const subtotal = form.items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.harga) || 0), 0);
  const diskonRp = subtotal * (Number(form.diskon) || 0) / 100;
  const afterDisc = subtotal - diskonRp;
  const ppnRp = form.ppn ? afterDisc * 0.11 : 0;
  return { subtotal, diskonRp, ppnRp, total: afterDisc + ppnRp };
}

// ── Dokumen cetak PO ─────────────────────────────────────────────────────────
function PODoc({ data }) {
  const t = hitungTotal(data);
  const urgent = data.prioritas !== 'normal';
  return (
    <div className="po-print-area" style={{ padding: '14mm 15mm' }}>
      <div className="po-kop">
        <div>
          <div className="doc-kop-logo">{data.namaPercetakan || '—'}</div>
          <div className="doc-kop-addr">
            {[data.alamatPercetakan, data.teleponPercetakan, data.emailPercetakan].filter(Boolean).join(' · ')}
          </div>
        </div>
        <div>
          <div className="po-title">Purchase Order</div>
          <div className="doc-no" style={{ textAlign: 'right' }}>No. {data.noPO}</div>
          {urgent && <div style={{ textAlign: 'right' }}><span className="po-urgent">{data.prioritas === 'asap' ? 'SEGERA' : 'Urgent'}</span></div>}
        </div>
      </div>

      <div className="po-parties">
        <div>
          <div className="po-party-label">Dari</div>
          <div className="po-party-name">{data.namaPercetakan || '—'}</div>
          <div className="po-party-detail">{[data.alamatPercetakan, data.teleponPercetakan, data.emailPercetakan].filter(Boolean).join('\n')}</div>
        </div>
        <div>
          <div className="po-party-label">Kepada</div>
          <div className="po-party-name">{data.namaSupplier || '—'}</div>
          <div className="po-party-detail">{[data.alamatSupplier, data.noWASupplier, data.emailSupplier, data.picSupplier && `PIC: ${data.picSupplier}`].filter(Boolean).join('\n')}</div>
        </div>
      </div>

      <div className="po-meta-row">
        <div><div className="doc-meta-label">Tgl Order</div><div className="doc-meta-val">{formatTglID(data.tanggalOrder)}</div></div>
        <div><div className="doc-meta-label">Dibutuhkan Sebelum</div><div className="doc-meta-val">{formatTglID(data.dueDate)}</div></div>
        <div><div className="doc-meta-label">Metode Bayar</div><div className="doc-meta-val">{data.metodeBayar}</div></div>
      </div>

      <table className="po-tbl">
        <thead>
          <tr>
            <th style={{ width: '22pt' }}>No</th>
            <th>Nama Item</th>
            <th>Spesifikasi</th>
            <th style={{ width: '36pt', textAlign: 'right' }}>Qty</th>
            <th style={{ width: '44pt' }}>Satuan</th>
            <th style={{ width: '70pt', textAlign: 'right' }}>Harga</th>
            <th style={{ width: '72pt' }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {data.items.filter(i => i.nama).map((i, idx) => {
            const sub = (Number(i.qty) || 0) * (Number(i.harga) || 0);
            return (
              <tr key={i.id}>
                <td>{idx + 1}</td>
                <td>{i.nama}</td>
                <td>{i.spesifikasi || '—'}</td>
                <td style={{ textAlign: 'right' }}>{i.qty}</td>
                <td>{i.satuan}</td>
                <td style={{ textAlign: 'right' }}>{formatRp(i.harga)}</td>
                <td>{formatRp(sub)}</td>
              </tr>
            );
          })}
          {data.items.filter(i => i.nama).length === 0 && (
            <tr><td colSpan={7} style={{ textAlign: 'center', color: '#999', padding: '10pt' }}>Belum ada item</td></tr>
          )}
        </tbody>
      </table>

      <div className="po-summary">
        <div className="po-summary-table">
          <div className="po-summary-row"><span>Sub Total</span><span>{formatRp(t.subtotal)}</span></div>
          {t.diskonRp > 0 && <div className="po-summary-row"><span>Diskon ({data.diskon}%)</span><span>-{formatRp(t.diskonRp)}</span></div>}
          {data.ppn && <div className="po-summary-row"><span>PPN 11%</span><span>{formatRp(t.ppnRp)}</span></div>}
          <div className="po-summary-total"><span>TOTAL</span><span>{formatRp(t.total)}</span></div>
        </div>
      </div>

      {data.catatan && (
        <div className="doc-catatan">
          <div className="doc-catatan-label">Catatan</div>
          <div className="doc-catatan-val">{data.catatan}</div>
        </div>
      )}

      <div className="doc-footer" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '16pt' }}>
        <div className="doc-ttd"><div className="doc-ttd-label">Hormat Kami,<br />{data.namaPercetakan}</div><div className="doc-ttd-line">(......................)</div></div>
        <div className="doc-ttd"><div className="doc-ttd-label">Diterima Supplier,</div><div className="doc-ttd-line">(......................)</div></div>
      </div>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function POSupplier() {
  const [tab, setTab]         = useState('form');
  const [form, setForm]       = useState(() => loadJSON(KEY_DRAFT, null) || makeDefault());
  const [riwayat, setRiwayat] = useState(() => loadJSON(KEY_LIST, []));
  const [suppliers, setSuppliers] = useState(() => loadJSON(KEY_SUPPLIER, []));
  const [showSuppliers, setShowSuppliers] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch]   = useState('');
  const [toast, setToast]     = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const kertasList = useMemo(() => loadKertas(), []);
  const formRef = useRef(form);
  formRef.current = form;

  useEffect(() => {
    const id = setInterval(() => saveJSON(KEY_DRAFT, formRef.current), 30000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const id = setTimeout(() => saveJSON(KEY_DRAFT, form), 500);
    return () => clearTimeout(id);
  }, [form]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const updateItem = (id, k, v) =>
    setForm(p => ({ ...p, items: p.items.map(x => x.id === id ? { ...x, [k]: v } : x) }));
  const tambahItem = () => setForm(p => ({ ...p, items: [...p.items, emptyItem()] }));
  const hapusItem  = (id) => setForm(p => ({
    ...p, items: p.items.length <= 1 ? p.items : p.items.filter(x => x.id !== id),
  }));

  const regenerateNo = () => {
    const c = Number(localStorage.getItem(KEY_COUNTER) || 0) + 1;
    set('noPO', genNoPO(c));
  };

  const t = hitungTotal(form);

  const handleSimpan = () => {
    const c = Number(localStorage.getItem(KEY_COUNTER) || 0) + 1;
    const entry = { ...form, id: form._id || genId(), total: t.total, savedAt: new Date().toISOString() };
    delete entry._id;
    const list = [entry, ...riwayat.filter(r => r.id !== entry.id)];
    setRiwayat(list);
    saveJSON(KEY_LIST, list);
    localStorage.setItem(KEY_COUNTER, String(c));
    showToast('PO tersimpan di riwayat ✓');
  };

  const handlePrint = () => { saveJSON(KEY_DRAFT, form); window.print(); };

  const handleWA = () => {
    if (!form.noWASupplier) { showToast('Isi no. WA supplier dulu'); return; }
    const noWA = form.noWASupplier.replace(/\D/g, '').replace(/^0/, '62');
    const list = form.items.filter(i => i.nama).map((i, idx) => {
      const sub = (Number(i.qty) || 0) * (Number(i.harga) || 0);
      return `${idx + 1}. ${i.nama} — ${i.qty} ${i.satuan} × ${formatRp(i.harga)} = ${formatRp(sub)}`;
    }).join('\n');
    const txt = encodeURIComponent(
      `*PURCHASE ORDER — ${form.noPO}*\n` +
      `Tanggal: ${formatTglID(form.tanggalOrder)}\n` +
      `Dibutuhkan sebelum: ${formatTglID(form.dueDate)}\n\n` +
      `*Dari:* ${form.namaPercetakan}\n` +
      `*Kepada:* ${form.namaSupplier}\n\n` +
      `*Item:*\n${list}\n\n` +
      `*TOTAL: ${formatRp(t.total)}*\n\n` +
      `${form.catatan ? `Catatan: ${form.catatan}\n\n` : ''}` +
      `Mohon konfirmasi ketersediaan & estimasi pengiriman. Terima kasih 🙏`
    );
    window.open(`https://wa.me/${noWA}?text=${txt}`, '_blank');
  };

  const handleEmail = () => {
    if (!form.emailSupplier) { showToast('Isi email supplier dulu'); return; }
    const subject = encodeURIComponent(`Purchase Order ${form.noPO} — ${form.namaPercetakan}`);
    const body = encodeURIComponent(
      `Kepada Yth.\n${form.namaSupplier}\n\n` +
      `Bersama email ini kami mengajukan Purchase Order:\n\n` +
      `No. PO    : ${form.noPO}\n` +
      `Tgl Order : ${formatTglID(form.tanggalOrder)}\n` +
      `Due Date  : ${formatTglID(form.dueDate)}\n` +
      `Total PO  : ${formatRp(t.total)}\n\n` +
      `Detail item terlampir dalam dokumen PO.\n\n` +
      `${form.catatan || ''}\n\n` +
      `Hormat kami,\n${form.namaPercetakan}\n${form.teleponPercetakan}`
    );
    window.location.href = `mailto:${form.emailSupplier}?subject=${subject}&body=${body}`;
  };

  const handleBaru = () => {
    saveJSON(KEY_DRAFT, null);
    setForm(makeDefault());
    setTab('form');
    showToast('Form PO baru siap');
  };

  const loadFromRiwayat = (r) => { setForm({ ...r, _id: r.id }); setTab('form'); };
  const hapusRiwayat = (id) => {
    const list = riwayat.filter(r => r.id !== id);
    setRiwayat(list); saveJSON(KEY_LIST, list); setDeleteId(null);
    showToast('Riwayat dihapus');
  };

  // Supplier CRUD
  const simpanSupplier = () => {
    if (!form.namaSupplier) return;
    const exist = suppliers.find(s => s.nama.toLowerCase() === form.namaSupplier.toLowerCase());
    const data = {
      id: exist?.id || genId(),
      nama: form.namaSupplier, alamat: form.alamatSupplier,
      noWA: form.noWASupplier, email: form.emailSupplier, pic: form.picSupplier,
    };
    const list = exist ? suppliers.map(s => s.id === exist.id ? data : s) : [data, ...suppliers];
    setSuppliers(list); saveJSON(KEY_SUPPLIER, list);
    showToast(exist ? 'Supplier diperbarui ✓' : 'Supplier disimpan ✓');
  };
  const pilihSupplier = (s) => {
    setForm(p => ({ ...p, namaSupplier: s.nama, alamatSupplier: s.alamat || '', noWASupplier: s.noWA || '', emailSupplier: s.email || '', picSupplier: s.pic || '' }));
    setShowSuppliers(false);
  };
  const hapusSupplier = (id) => {
    const list = suppliers.filter(s => s.id !== id);
    setSuppliers(list); saveJSON(KEY_SUPPLIER, list);
  };

  // Import kertas
  const [importSel, setImportSel] = useState({});
  const toggleImport = (k) => setImportSel(s => ({ ...s, [k.id]: s[k.id] ? undefined : { qty: 1, data: k } }));
  const setImportQty = (id, qty) => setImportSel(s => ({ ...s, [id]: { ...s[id], qty } }));
  const importKertas = () => {
    const newItems = Object.values(importSel).filter(Boolean).map(({ qty, data }) => ({
      id: genId(),
      nama: `${data.nama} ${data.gsm}gsm`,
      spesifikasi: `${data.p} × ${data.l} cm`,
      qty: Number(qty) || 1,
      satuan: 'rim',
      harga: data.hargaRim,
    }));
    if (newItems.length === 0) { setShowImport(false); return; }
    setForm(p => {
      const existing = p.items.filter(i => i.nama); // buang baris kosong
      return { ...p, items: [...existing, ...newItems] };
    });
    setImportSel({});
    setShowImport(false);
    showToast(`${newItems.length} item ditambahkan ✓`);
  };

  const filtered = useMemo(() => {
    if (!search) return riwayat;
    const q = search.toLowerCase();
    return riwayat.filter(r =>
      (r.noPO || '').toLowerCase().includes(q) ||
      (r.namaSupplier || '').toLowerCase().includes(q)
    );
  }, [riwayat, search]);

  const statBulan = useMemo(() => {
    const now = new Date();
    const rows = riwayat.filter(r => {
      const d = new Date(r.tanggalOrder || r.savedAt);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    return {
      totalBulan: rows.reduce((s, r) => s + (r.total || 0), 0),
      jumlah: rows.length,
      supplierAktif: new Set(rows.map(r => r.namaSupplier).filter(Boolean)).size,
    };
  }, [riwayat]);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap" data-no-print>
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
            <ClipboardList size={22} className="text-blue-600" /> PO Supplier
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Generate Purchase Order ke supplier kertas dalam 1 klik</p>
        </div>
        <div className="flex gap-1 bg-zinc-100 p-1 rounded-lg">
          <button onClick={() => setTab('form')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md ${tab === 'form' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}>
            Form
          </button>
          <button onClick={() => setTab('riwayat')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 ${tab === 'riwayat' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}>
            <History size={12} /> Riwayat ({riwayat.length})
          </button>
        </div>
      </div>

      {tab === 'form' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] gap-5" data-no-print>
          {/* FORM */}
          <div className="space-y-4">
            <Section title="Identitas Percetakan">
              <Field label="Nama Percetakan" value={form.namaPercetakan} onChange={v => set('namaPercetakan', v)} />
              <Field label="Alamat"          value={form.alamatPercetakan} onChange={v => set('alamatPercetakan', v)} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Telepon" value={form.teleponPercetakan} onChange={v => set('teleponPercetakan', v)} />
                <Field label="Email"   value={form.emailPercetakan}   onChange={v => set('emailPercetakan', v)} />
              </div>
            </Section>

            <Section
              title="Data Supplier"
              action={
                <button onClick={() => setShowSuppliers(true)}
                  className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <Users size={11} /> Daftar Supplier
                </button>
              }
            >
              <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
                <Field label="Nama Supplier" value={form.namaSupplier} onChange={v => set('namaSupplier', v)} />
                <button onClick={simpanSupplier}
                  className="px-3 h-[38px] text-xs font-bold bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 whitespace-nowrap">
                  + Simpan
                </button>
              </div>
              <div>
                <label className="label">Alamat</label>
                <textarea rows={2} className="input-field resize-none"
                  value={form.alamatSupplier} onChange={e => set('alamatSupplier', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="No. WA / Telp" value={form.noWASupplier} onChange={v => set('noWASupplier', v)} />
                <Field label="Email"         value={form.emailSupplier} onChange={v => set('emailSupplier', v)} />
              </div>
              <Field label="PIC / Kontak" value={form.picSupplier} onChange={v => set('picSupplier', v)} />
            </Section>

            <Section title="Detail PO">
              <div>
                <label className="label">No. PO</label>
                <div className="flex gap-2">
                  <input className="input-field flex-1" value={form.noPO} onChange={e => set('noPO', e.target.value)} />
                  <button onClick={regenerateNo} className="px-3 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50">
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Field type="date" label="Tgl Order" value={form.tanggalOrder} onChange={v => set('tanggalOrder', v)} />
                <Field type="date" label="Due Date" value={form.dueDate} onChange={v => set('dueDate', v)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Prioritas</label>
                  <select className="input-field" value={form.prioritas} onChange={e => set('prioritas', e.target.value)}>
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="asap">ASAP (Segera)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Metode Bayar</label>
                  <select className="input-field" value={form.metodeBayar} onChange={e => set('metodeBayar', e.target.value)}>
                    {['Transfer Bank','COD','Tempo N30','Tempo N45','Tempo N60','Cash'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </Section>

            <Section
              title="Item PO"
              action={
                <button onClick={() => setShowImport(true)}
                  className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                  <Download size={11} /> Import Database Kertas
                </button>
              }
            >
              <div className="space-y-1.5">
                {form.items.map((it, i) => (
                  <div key={it.id} className="grid grid-cols-[18px_1.4fr_1fr_50px_60px_90px_22px] gap-1 items-center">
                    <span className="text-[10px] text-zinc-400 font-semibold">{i + 1}</span>
                    <input className="input-field !py-1.5 !text-xs" placeholder="Nama item" list="kertas-list"
                      value={it.nama} onChange={e => {
                        const v = e.target.value;
                        const match = kertasList.find(k => `${k.nama} ${k.gsm}gsm` === v);
                        if (match) {
                          updateItem(it.id, 'nama', v);
                          updateItem(it.id, 'spesifikasi', `${match.p} × ${match.l} cm`);
                          updateItem(it.id, 'harga', match.hargaRim);
                        } else {
                          updateItem(it.id, 'nama', v);
                        }
                      }} />
                    <input className="input-field !py-1.5 !text-xs" placeholder="Spesifikasi"
                      value={it.spesifikasi} onChange={e => updateItem(it.id, 'spesifikasi', e.target.value)} />
                    <input type="number" min="1" className="input-field !py-1.5 !text-xs text-right"
                      value={it.qty} onChange={e => updateItem(it.id, 'qty', e.target.value)} />
                    <select className="input-field !py-1.5 !text-xs"
                      value={it.satuan} onChange={e => updateItem(it.id, 'satuan', e.target.value)}>
                      {['rim','lembar','kg','roll','pak','pcs'].map(s => <option key={s}>{s}</option>)}
                    </select>
                    <input type="number" className="input-field !py-1.5 !text-xs text-right" placeholder="Harga"
                      value={it.harga} onChange={e => updateItem(it.id, 'harga', e.target.value)} />
                    <button onClick={() => hapusItem(it.id)} disabled={form.items.length <= 1}
                      className="p-1 text-zinc-400 hover:text-red-600 disabled:opacity-30">
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
                <datalist id="kertas-list">
                  {kertasList.map(k => <option key={k.id} value={`${k.nama} ${k.gsm}gsm`} />)}
                </datalist>
                <button onClick={tambahItem}
                  className="w-full py-1.5 border-2 border-dashed border-zinc-200 rounded-lg text-xs font-semibold text-zinc-500 hover:border-blue-400 hover:text-blue-600 flex items-center justify-center gap-1.5">
                  <Plus size={12} /> Tambah Item
                </button>
              </div>

              <div className="border-t border-zinc-100 pt-3 space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-zinc-500">Sub Total</span><span className="font-bold">{formatRp(t.subtotal)}</span></div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-zinc-500">Diskon</span>
                  <div className="flex items-center gap-1">
                    <input type="number" min="0" max="100" className="input-field !py-1 !w-16 !text-xs text-right"
                      value={form.diskon} onChange={e => set('diskon', e.target.value)} />
                    <span className="text-zinc-400">%</span>
                  </div>
                </div>
                <label className="flex justify-between items-center cursor-pointer">
                  <span className="text-zinc-500">PPN 11%</span>
                  <input type="checkbox" checked={form.ppn} onChange={e => set('ppn', e.target.checked)} />
                </label>
                <div className="flex justify-between pt-2 border-t border-zinc-200 text-sm">
                  <span className="font-bold">TOTAL</span>
                  <span className="font-black text-blue-600">{formatRp(t.total)}</span>
                </div>
              </div>
            </Section>

            <Section title="Catatan ke Supplier">
              <textarea rows={3} className="input-field resize-none"
                placeholder="Contoh: Tolong konfirmasi stok sebelum kirim."
                value={form.catatan} onChange={e => set('catatan', e.target.value)} />
            </Section>

            <div className="flex gap-2 flex-wrap sticky bottom-4 bg-white/90 backdrop-blur p-3 rounded-xl border border-zinc-200 shadow-sm">
              <button onClick={handleSimpan}
                className="flex-1 min-w-[100px] bg-zinc-900 text-white text-sm font-bold py-2.5 rounded-lg hover:bg-zinc-700 flex items-center justify-center gap-1.5">
                <Save size={14} /> Simpan
              </button>
              <button onClick={handlePrint}
                className="flex-1 min-w-[100px] bg-blue-600 text-white text-sm font-bold py-2.5 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1.5">
                <Printer size={14} /> Cetak
              </button>
              <button onClick={handleWA}
                className="px-3 bg-green-600 text-white text-sm font-bold py-2.5 rounded-lg hover:bg-green-700 flex items-center justify-center gap-1.5">
                <MessageCircle size={14} /> WA
              </button>
              <button onClick={handleEmail}
                className="px-3 border border-zinc-200 text-zinc-700 text-sm font-bold py-2.5 rounded-lg hover:bg-zinc-50 flex items-center gap-1.5">
                <Mail size={14} /> Email
              </button>
              <button onClick={handleBaru}
                className="px-3 border border-zinc-200 text-zinc-600 text-sm font-bold py-2.5 rounded-lg hover:bg-zinc-50">
                Baru
              </button>
            </div>
          </div>

          {/* PREVIEW */}
          <div className="lg:sticky lg:top-4 h-fit">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Preview Cetak · A4</p>
            <div className="bg-zinc-100 rounded-xl p-4 overflow-auto max-h-[85vh]">
              <div className="doc-print-root bg-white shadow-lg mx-auto" style={{ width: '210mm', transform: 'scale(0.72)', transformOrigin: 'top left', marginBottom: -80 }}>
                <PODoc data={form} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4" data-no-print>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard label="Total PO Bulan Ini" value={formatRp(statBulan.totalBulan)} />
            <StatCard label="Jumlah PO" value={statBulan.jumlah} />
            <StatCard label="Supplier Aktif" value={statBulan.supplierAktif} />
          </div>

          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <div className="flex gap-2 mb-4 items-center flex-wrap">
              <div className="flex-1 min-w-[200px] relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="input-field pl-9" placeholder="Cari no. PO atau supplier..." />
              </div>
              <button onClick={handleBaru}
                className="bg-zinc-900 text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-zinc-700 flex items-center gap-1.5">
                <Plus size={12} /> Buat PO Baru
              </button>
            </div>
            {filtered.length === 0 ? (
              <div className="text-center py-10 text-sm text-zinc-400">
                {search ? 'Tidak ada yang cocok.' : 'Belum ada riwayat PO.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left">
                      <th className="px-3 py-2.5 text-[11px] font-bold uppercase text-zinc-500">No. PO</th>
                      <th className="px-3 py-2.5 text-[11px] font-bold uppercase text-zinc-500">Supplier</th>
                      <th className="px-3 py-2.5 text-[11px] font-bold uppercase text-zinc-500 text-right">Total</th>
                      <th className="px-3 py-2.5 text-[11px] font-bold uppercase text-zinc-500">Tgl Order</th>
                      <th className="px-3 py-2.5 text-[11px] font-bold uppercase text-zinc-500">Due</th>
                      <th className="px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr key={r.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                        <td className="px-3 py-3 font-mono text-xs">{r.noPO}</td>
                        <td className="px-3 py-3 font-semibold">{r.namaSupplier || '—'}</td>
                        <td className="px-3 py-3 text-right font-bold">{formatRp(r.total || 0)}</td>
                        <td className="px-3 py-3 text-zinc-600 text-xs">{formatTglID(r.tanggalOrder)}</td>
                        <td className="px-3 py-3 text-zinc-600 text-xs">{formatTglID(r.dueDate)}</td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <button onClick={() => loadFromRiwayat(r)} className="text-xs font-bold text-blue-600 hover:underline mr-3">Buka</button>
                          {deleteId === r.id ? (
                            <span className="inline-flex gap-1">
                              <button onClick={() => hapusRiwayat(r.id)} className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded">Hapus</button>
                              <button onClick={() => setDeleteId(null)} className="text-xs text-zinc-500 px-2 py-1">Batal</button>
                            </span>
                          ) : (
                            <button onClick={() => setDeleteId(r.id)} className="text-xs text-zinc-400 hover:text-red-500">
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
        </div>
      )}

      {/* Supplier Drawer */}
      <AnimatePresence>
        {showSuppliers && (
          <>
            <motion.div className="fixed inset-0 bg-black/40 z-50"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSuppliers(false)} data-no-print />
            <motion.div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 28 }}
              data-no-print>
              <div className="flex items-center justify-between p-4 border-b border-zinc-200">
                <h3 className="font-bold text-zinc-900">Daftar Supplier</h3>
                <button onClick={() => setShowSuppliers(false)}><X size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {suppliers.length === 0 ? (
                  <p className="text-center text-sm text-zinc-400 py-10">
                    Belum ada supplier tersimpan.<br />Isi form supplier & klik "+ Simpan" untuk menambah.
                  </p>
                ) : suppliers.map(s => (
                  <div key={s.id} className="border border-zinc-200 rounded-lg p-3">
                    <p className="font-bold text-sm text-zinc-900">{s.nama}</p>
                    <p className="text-xs text-zinc-500">{[s.noWA, s.alamat].filter(Boolean).join(' · ')}</p>
                    {s.pic && <p className="text-xs text-zinc-500">PIC: {s.pic}</p>}
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => pilihSupplier(s)}
                        className="text-xs font-bold bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Pilih</button>
                      <button onClick={() => hapusSupplier(s.id)}
                        className="text-xs text-red-500 hover:underline">Hapus</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Import Kertas Modal */}
      <AnimatePresence>
        {showImport && (
          <>
            <motion.div className="fixed inset-0 bg-black/40 z-50"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowImport(false)} data-no-print />
            <motion.div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
              data-no-print>
              <motion.div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl pointer-events-auto"
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
                <div className="flex items-center justify-between p-4 border-b border-zinc-200">
                  <h3 className="font-bold text-zinc-900">Import dari Database Kertas</h3>
                  <button onClick={() => setShowImport(false)}><X size={18} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                  {kertasList.map(k => {
                    const sel = importSel[k.id];
                    return (
                      <div key={k.id} className={`border rounded-lg p-2.5 cursor-pointer transition-colors ${sel ? 'border-blue-400 bg-blue-50' : 'border-zinc-200 hover:border-zinc-300'}`}
                        onClick={() => toggleImport(k)}>
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={!!sel} readOnly />
                          <div className="flex-1">
                            <p className="text-sm font-bold">{k.nama} {k.gsm}gsm</p>
                            <p className="text-xs text-zinc-500">{k.p} × {k.l} cm · {formatRp(k.hargaRim)}/rim</p>
                          </div>
                          {sel && (
                            <input type="number" min="1" className="input-field !py-1 !w-16 !text-xs text-right"
                              value={sel.qty} onClick={e => e.stopPropagation()}
                              onChange={e => setImportQty(k.id, e.target.value)} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-4 border-t border-zinc-200 flex gap-2">
                  <button onClick={() => setShowImport(false)}
                    className="flex-1 border border-zinc-200 text-zinc-600 text-sm font-bold py-2 rounded-lg hover:bg-zinc-50">Batal</button>
                  <button onClick={importKertas}
                    className="flex-1 bg-blue-600 text-white text-sm font-bold py-2 rounded-lg hover:bg-blue-700">
                    Import ({Object.values(importSel).filter(Boolean).length})
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-lg z-50" data-no-print>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Subcomponents ─────────────────────────────────────────────────────────────
function Section({ title, action, children }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{title}</p>
        {action}
      </div>
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

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-1">{label}</p>
      <p className="text-xl font-black text-zinc-900">{value}</p>
    </div>
  );
}
