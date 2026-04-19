import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, Trash2, Image as ImageIcon, Printer,
  Save, History, Settings, RefreshCcw, Check, X, Clock,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { saveInvoice, getUserInvoices, deleteInvoice } from '../lib/supabase';
import { formatRupiah } from '../utils/calculator';

const COLORS = ['#18181b', '#5D45FD', '#2563eb', '#059669', '#dc2626', '#d97706'];
const TEMPLATES = ['minimalis', 'modern', 'classic', 'bold'];
const STATUS_STYLES = {
  Pending:   'bg-amber-100 text-amber-700',
  Paid:      'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-red-100 text-red-700',
};

function genInvoiceNumber() {
  return `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}
function today() { return new Date().toISOString().split('T')[0]; }
function addDays(n) { return new Date(Date.now() + n * 86400000).toISOString().split('T')[0]; }

export default function InvoiceGenerator({ user, onLoginRequest }) {
  const invoiceRef  = useRef(null);
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('editor');
  const [invoices,  setInvoices]  = useState([]);
  const [toast,     setToast]     = useState(null);
  const [exporting, setExporting] = useState(null);

  // ── Invoice config ──────────────────────────────────────────────────────
  const [template,       setTemplate]       = useState('minimalis');
  const [themeColor,     setThemeColor]     = useState(COLORS[0]);
  const [logo,           setLogo]           = useState(null);
  const [invoiceNumber,  setInvoiceNumber]  = useState(genInvoiceNumber);
  const [status,         setStatus]         = useState('Pending');
  const [invoiceType,    setInvoiceType]    = useState('full');
  const [date,           setDate]           = useState(today);
  const [dueDate,        setDueDate]        = useState(() => addDays(7));
  const [fromName,       setFromName]       = useState('NaikCetak Studio');
  const [fromInfo,       setFromInfo]       = useState('Email: naikcetak@email.com\nTelp: 081234567890\nJakarta, Indonesia');
  const [toName,         setToName]         = useState('Nama Klien');
  const [toAddress,      setToAddress]      = useState('Alamat Klien...');
  const [items,          setItems]          = useState([
    { id: '1', description: 'Cetak Box Kemasan Offset', qty: 1000, price: 2500 },
  ]);
  const [tax,      setTax]      = useState(0);
  const [discount, setDiscount] = useState(0);
  const [notes,    setNotes]    = useState(
    'Terima kasih atas kepercayaan Anda.\nPembayaran via transfer ke:\nBCA 1234567890 a.n. NaikCetak Studio'
  );

  // ── Calculations ────────────────────────────────────────────────────────
  const subtotal   = items.reduce((a, i) => a + i.qty * i.price, 0);
  const taxAmount  = Math.round((subtotal * tax) / 100);
  const total      = subtotal + taxAmount - discount;
  const dpAmount   = Math.round(total * 0.5);
  const amountDue  = invoiceType === 'dp' ? dpAmount
                   : invoiceType === 'pelunasan' ? total - dpAmount
                   : total;

  const invoiceTypeLabel = invoiceType === 'dp'        ? 'Invoice DP 50%'
                         : invoiceType === 'pelunasan' ? 'Invoice Pelunasan 50%'
                         : 'Tagihan Penuh';

  // ── Toast ───────────────────────────────────────────────────────────────
  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Fetch history ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    getUserInvoices(user.id).then(setInvoices).catch(console.error);
  }, [user, activeTab]);

  // ── Items CRUD ──────────────────────────────────────────────────────────
  const addItem    = () => setItems(p => [...p, { id: Math.random().toString(36).slice(2), description: '', qty: 1, price: 0 }]);
  const removeItem = (id) => { if (items.length > 1) setItems(p => p.filter(i => i.id !== id)); };
  const updateItem = (id, field, value) => setItems(p => p.map(i => i.id === id ? { ...i, [field]: value } : i));

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogo(reader.result);
    reader.readAsDataURL(file);
  };

  // ── Export ──────────────────────────────────────────────────────────────
  const exportAsImage = async () => {
    if (!invoiceRef.current) return;
    setExporting('image');
    try {
      const url = await toPng(invoiceRef.current, { quality: 1, pixelRatio: 2 });
      const a = document.createElement('a');
      a.download = `${invoiceNumber}.png`;
      a.href = url;
      a.click();
      showToast('Invoice berhasil diunduh sebagai gambar.');
    } catch { showToast('Gagal mengunduh gambar.', 'error'); }
    finally { setExporting(null); }
  };

  const exportAsPdf = async () => {
    if (!invoiceRef.current) return;
    setExporting('pdf');
    try {
      const url = await toPng(invoiceRef.current, { quality: 1, pixelRatio: 2 });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const props = pdf.getImageProperties(url);
      const w = pdf.internal.pageSize.getWidth();
      const h = (props.height * w) / props.width;
      pdf.addImage(url, 'PNG', 0, 0, w, h);
      pdf.save(`${invoiceNumber}.pdf`);
      showToast('Invoice berhasil diunduh sebagai PDF.');
    } catch { showToast('Gagal membuat PDF.', 'error'); }
    finally { setExporting(null); }
  };

  // ── Save / Delete / Load ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) { onLoginRequest?.(); showToast('Login terlebih dahulu untuk menyimpan.', 'error'); return; }
    try {
      await saveInvoice(user.id, {
        invoiceNumber, status, invoiceType, template, themeColor,
        date, dueDate, fromName, fromInfo, toName, toAddress,
        items, tax, discount, notes, logo,
        subtotal, total, amountDue,
      });
      showToast('Invoice berhasil disimpan ke riwayat.');
    } catch (err) {
      console.error('Save invoice error:', err);
      showToast(`Gagal: ${err?.message ?? 'Unknown error'}`, 'error');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Hapus invoice ini?')) return;
    try {
      await deleteInvoice(id);
      setInvoices(p => p.filter(i => i.id !== id));
      showToast('Invoice dihapus.');
    } catch { showToast('Gagal menghapus.', 'error'); }
  };

  const loadInvoice = (inv) => {
    setTemplate(inv.template || 'minimalis');
    setThemeColor(inv.theme_color || COLORS[0]);
    setInvoiceNumber(inv.invoice_number || '');
    setStatus(inv.status || 'Pending');
    setInvoiceType(inv.invoice_type || 'full');
    setDate(inv.date || today());
    setDueDate(inv.due_date || addDays(7));
    setFromName(inv.from_name || '');
    setFromInfo(inv.from_info || '');
    setToName(inv.to_name || '');
    setToAddress(inv.to_address || '');
    setItems(inv.items || []);
    setTax(inv.tax || 0);
    setDiscount(inv.discount || 0);
    setNotes(inv.notes || '');
    setLogo(inv.logo || null);
    setActiveTab('editor');
    showToast('Invoice dimuat ke editor.');
  };

  const resetForm = () => {
    setInvoiceNumber(genInvoiceNumber());
    setStatus('Pending');
    setInvoiceType('full');
    setToName('Nama Klien');
    setToAddress('Alamat Klien...');
    setItems([{ id: '1', description: 'Cetak Box Kemasan Offset', qty: 1000, price: 2500 }]);
    setTax(0);
    setDiscount(0);
    setLogo(null);
    showToast('Formulir direset.');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed top-20 right-4 z-[100] px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg ${
              toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-white'
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center">
              <FileText size={15} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-zinc-900 text-sm tracking-tight">Invoice Generator</p>
              <p className="text-[10px] text-zinc-400">Buat tagihan profesional · DP 50% / Pelunasan</p>
            </div>
          </div>
          <div className="flex items-center bg-zinc-100 rounded-xl p-1 gap-1">
            {[['editor', Settings, 'Editor'], ['riwayat', History, 'Riwayat']].map(([tab, Icon, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  activeTab === tab ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <Icon size={11} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'editor' ? (
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start"
          >
            {/* ── LEFT CONFIG ─────────────────────────────── */}
            <div className="space-y-4">

              {/* Template & Color */}
              <div className="card">
                <div className="card-header"><span className="section-title">Tampilan Dokumen</span></div>
                <div className="p-5 space-y-4">
                  <div>
                    <p className="label">Template</p>
                    <div className="grid grid-cols-2 gap-2">
                      {TEMPLATES.map(t => (
                        <button
                          key={t}
                          onClick={() => setTemplate(t)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold capitalize transition-all ${
                            template === t
                              ? 'border-zinc-900 bg-zinc-900 text-white'
                              : 'border-zinc-200 text-zinc-600 hover:border-zinc-400'
                          }`}
                        >
                          {t} {template === t && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="label">Warna Tema</p>
                    <div className="flex items-center gap-2.5">
                      {COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setThemeColor(c)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                            themeColor === c ? 'ring-4 ring-offset-1 ring-zinc-400 scale-110' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: c }}
                        >
                          {themeColor === c && <Check size={12} className="text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div className="card">
                <div className="card-header">
                  <span className="section-title">Informasi Dasar</span>
                  <button
                    onClick={resetForm}
                    className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    <RefreshCcw size={11} /> Reset
                  </button>
                </div>
                <div className="p-5 space-y-4">
                  {/* Logo */}
                  <div>
                    <p className="label">Logo Bisnis</p>
                    <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="h-20 rounded-xl border-2 border-dashed border-zinc-200 flex items-center justify-center cursor-pointer hover:border-zinc-400 transition-colors relative overflow-hidden group"
                    >
                      {logo ? (
                        <>
                          <img src={logo} alt="Logo" className="h-full w-full object-contain p-2" />
                          <button
                            onClick={e => { e.stopPropagation(); setLogo(null); }}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center hidden group-hover:flex"
                          >
                            <X size={9} />
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1 pointer-events-none">
                          <Plus size={16} className="text-zinc-300" />
                          <span className="text-[10px] text-zinc-400">Upload logo</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="label">No. Invoice</p>
                      <input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="input-field text-xs font-mono" />
                    </div>
                    <div>
                      <p className="label">Status</p>
                      <select value={status} onChange={e => setStatus(e.target.value)} className="input-field text-xs">
                        <option>Pending</option>
                        <option>Paid</option>
                        <option>Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* DP System */}
                  <div>
                    <p className="label">Tipe Invoice</p>
                    <select value={invoiceType} onChange={e => setInvoiceType(e.target.value)} className="input-field text-xs">
                      <option value="full">Tagihan Penuh</option>
                      <option value="dp">Invoice DP 50%</option>
                      <option value="pelunasan">Invoice Pelunasan 50%</option>
                    </select>
                    {invoiceType !== 'full' && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-xl border border-blue-100 grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <p className="font-bold text-blue-400 uppercase tracking-widest">DP 50%</p>
                          <p className="font-mono font-bold text-blue-800">{formatRupiah(dpAmount)}</p>
                        </div>
                        <div>
                          <p className="font-bold text-blue-400 uppercase tracking-widest">Pelunasan 50%</p>
                          <p className="font-mono font-bold text-blue-800">{formatRupiah(total - dpAmount)}</p>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-blue-100">
                          <p className="font-bold text-blue-400 uppercase tracking-widest">Tagihan ini</p>
                          <p className="font-mono font-black text-blue-900">{formatRupiah(amountDue)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="label">Tanggal</p>
                      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field text-xs" />
                    </div>
                    <div>
                      <p className="label">Jatuh Tempo</p>
                      <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="input-field text-xs" />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-100 space-y-3">
                    <div>
                      <p className="label" style={{ color: themeColor }}>Dari (Bisnis Anda)</p>
                      <input value={fromName} onChange={e => setFromName(e.target.value)} className="input-field text-xs font-bold mb-2" placeholder="Nama Bisnis" />
                      <textarea value={fromInfo} onChange={e => setFromInfo(e.target.value)} className="input-field text-xs resize-none h-16" placeholder="Info kontak..." />
                    </div>
                    <div>
                      <p className="label" style={{ color: themeColor }}>Kepada (Klien)</p>
                      <input value={toName} onChange={e => setToName(e.target.value)} className="input-field text-xs font-bold mb-2" placeholder="Nama Klien" />
                      <textarea value={toAddress} onChange={e => setToAddress(e.target.value)} className="input-field text-xs resize-none h-16" placeholder="Alamat klien..." />
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="card">
                <div className="card-header">
                  <span className="section-title">Item Tagihan</span>
                  <button onClick={addItem} className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-zinc-900 transition-colors">
                    <Plus size={11} /> Tambah Item
                  </button>
                </div>
                <div className="p-5 space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="p-3 rounded-xl bg-zinc-50 border border-zinc-100 relative group">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center hidden group-hover:flex transition-colors"
                      >
                        <Trash2 size={9} />
                      </button>
                      <input
                        value={item.description}
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                        className="input-field text-xs font-semibold mb-2"
                        placeholder="Deskripsi layanan / produk"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="label">Qty</p>
                          <input type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', parseFloat(e.target.value) || 0)} className="input-mono text-xs" />
                        </div>
                        <div>
                          <p className="label">Harga (Rp)</p>
                          <input type="number" value={item.price} onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)} className="input-mono text-xs" />
                        </div>
                      </div>
                      <div className="mt-1.5 text-right">
                        <span className="text-[10px] font-mono font-bold text-zinc-400">= {formatRupiah(item.qty * item.price)}</span>
                      </div>
                    </div>
                  ))}

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-100">
                    <div>
                      <p className="label">Pajak (%)</p>
                      <input type="number" value={tax} onChange={e => setTax(parseFloat(e.target.value) || 0)} className="input-mono text-xs" />
                    </div>
                    <div>
                      <p className="label">Diskon (Rp)</p>
                      <input type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} className="input-mono text-xs" />
                    </div>
                  </div>

                  <div>
                    <p className="label">Catatan / Info Pembayaran</p>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} className="input-field text-xs resize-none h-24" placeholder="Catatan pembayaran..." />
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT PREVIEW ────────────────────────────── */}
            <div className="space-y-4 lg:sticky lg:top-20">
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={handleSave}
                  className="btn-primary flex items-center justify-center gap-2 py-3 rounded-xl"
                >
                  <Save size={14} /> Simpan
                </button>
                <button
                  onClick={exportAsImage}
                  disabled={!!exporting}
                  className="btn-ghost flex items-center justify-center gap-2 py-3 rounded-xl disabled:opacity-50"
                >
                  <ImageIcon size={14} /> {exporting === 'image' ? '...' : 'Gambar'}
                </button>
                <button
                  onClick={exportAsPdf}
                  disabled={!!exporting}
                  className="btn-ghost flex items-center justify-center gap-2 py-3 rounded-xl disabled:opacity-50"
                >
                  <Printer size={14} /> {exporting === 'pdf' ? '...' : 'PDF'}
                </button>
              </div>

              {/* Invoice Canvas — A4 */}
              <div className="bg-zinc-200 rounded-2xl p-4 overflow-auto">
                <div style={{ width: '794px' }}>
                  <div
                    ref={invoiceRef}
                    style={{
                      width: '794px',
                      minHeight: '1123px',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box',
                      fontFamily: template === 'classic'
                        ? 'Georgia, "Times New Roman", serif'
                        : 'Inter, system-ui, sans-serif',
                      borderLeft: template === 'bold' ? `18px solid ${themeColor}` : undefined,
                      border: template === 'classic' ? '1px solid #d4d4d8' : undefined,
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* ═══ MINIMALIS ═══ */}
                    {template === 'minimalis' && (
                      <div style={{ padding: '56px 64px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a1a1aa', marginBottom: 8 }}>Invoice</div>
                            <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-2px', color: '#18181b', lineHeight: 1 }}>#{invoiceNumber}</div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 4, backgroundColor: status === 'Paid' ? '#d1fae5' : status === 'Cancelled' ? '#fee2e2' : '#fef3c7', color: status === 'Paid' ? '#065f46' : status === 'Cancelled' ? '#991b1b' : '#92400e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{status}</span>
                              {invoiceType !== 'full' && <span style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 4, backgroundColor: '#dbeafe', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{invoiceTypeLabel}</span>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {logo && <img src={logo} alt="logo" style={{ height: 44, marginBottom: 12, marginLeft: 'auto', objectFit: 'contain' }} />}
                            <div style={{ fontSize: 15, fontWeight: 900, color: '#18181b' }}>{fromName}</div>
                            <div style={{ fontSize: 10, color: '#71717a', marginTop: 4, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{fromInfo}</div>
                          </div>
                        </div>

                        {/* Divider */}
                        <div style={{ height: 1, backgroundColor: '#f4f4f5', marginBottom: 28 }} />

                        {/* Client + Dates */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 36 }}>
                          <div>
                            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#a1a1aa', marginBottom: 6 }}>Tagihan Kepada</div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#18181b' }}>{toName}</div>
                            <div style={{ fontSize: 10, color: '#71717a', marginTop: 4, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{toAddress}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#a1a1aa', marginBottom: 3 }}>Tanggal</div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#18181b' }}>{date}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#a1a1aa', marginBottom: 3 }}>Jatuh Tempo</div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#18181b' }}>{dueDate}</div>
                            </div>
                          </div>
                        </div>

                        {/* Table */}
                        <div style={{ marginBottom: 32 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 130px 140px', gap: 8, paddingBottom: 10, borderBottom: '1.5px solid #18181b' }}>
                            {['Deskripsi Layanan', 'Qty', 'Harga Unit', 'Total'].map((h, i) => (
                              <span key={h} style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#71717a', textAlign: i > 0 ? 'right' : 'left' }}>{h}</span>
                            ))}
                          </div>
                          {items.map((item, idx) => (
                            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 130px 140px', gap: 8, padding: '11px 0', borderBottom: '1px solid #f4f4f5' }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#27272a' }}>{item.description || 'Tanpa Deskripsi'}</span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#71717a', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{item.qty.toLocaleString('id-ID')}</span>
                              <span style={{ fontSize: 10, fontWeight: 500, color: '#a1a1aa', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>Rp {item.price.toLocaleString('id-ID')}</span>
                              <span style={{ fontSize: 11, fontWeight: 800, color: '#18181b', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>Rp {(item.qty * item.price).toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                        </div>

                        {/* Summary + Notes */}
                        <div style={{ display: 'flex', gap: 32, marginTop: 'auto' }}>
                          <div style={{ flex: 1, padding: '16px 20px', backgroundColor: '#fafafa', borderRadius: 8, border: '1px dashed #e4e4e7' }}>
                            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#a1a1aa', marginBottom: 8 }}>Catatan &amp; Pembayaran</div>
                            <div style={{ fontSize: 10, color: '#71717a', lineHeight: 1.8, fontStyle: 'italic', whiteSpace: 'pre-line' }}>{notes}</div>
                          </div>
                          <div style={{ width: 240, flexShrink: 0 }}>
                            {[['Subtotal', `Rp ${subtotal.toLocaleString('id-ID')}`], ...(tax > 0 ? [[`Pajak (${tax}%)`, `Rp ${taxAmount.toLocaleString('id-ID')}`]] : []), ...(discount > 0 ? [['Diskon', `- Rp ${discount.toLocaleString('id-ID')}`]] : []), ...(invoiceType !== 'full' ? [['Total', `Rp ${total.toLocaleString('id-ID')}`], ['DP 50%', `Rp ${dpAmount.toLocaleString('id-ID')}`], ['Pelunasan 50%', `Rp ${(total - dpAmount).toLocaleString('id-ID')}`]] : [])].map(([label, val], i, arr) => (
                              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f4f4f5', fontSize: 10, color: label === 'Diskon' ? '#ef4444' : '#71717a' }}>
                                <span style={{ fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: 9 }}>{label}</span>
                                <span style={{ fontFamily: 'monospace', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{val}</span>
                              </div>
                            ))}
                            <div style={{ paddingTop: 14, borderTop: '2px solid #18181b', marginTop: 4 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: themeColor }}>{invoiceType === 'dp' ? 'Tagihan DP 50%' : invoiceType === 'pelunasan' ? 'Tagihan Pelunasan' : 'Total Tagihan'}</span>
                                <span style={{ fontSize: 22, fontWeight: 900, color: themeColor, fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>Rp {amountDue.toLocaleString('id-ID')}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div style={{ marginTop: 48, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                          <div style={{ fontSize: 8, color: '#d4d4d8' }}>Generated by NaikCetak</div>
                          <div style={{ textAlign: 'center', borderTop: '1px solid #e4e4e7', paddingTop: 10, width: 160 }}>
                            <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#52525b' }}>{fromName}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ═══ MODERN ═══ */}
                    {template === 'modern' && (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Colored Header Band */}
                        <div style={{ backgroundColor: themeColor, padding: '36px 56px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 42, fontWeight: 900, color: 'white', letterSpacing: '-2px', lineHeight: 1 }}>INVOICE</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 6, fontWeight: 600, letterSpacing: '0.1em' }}>#{invoiceNumber}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {logo && <img src={logo} alt="logo" style={{ height: 40, marginBottom: 10, marginLeft: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />}
                            <div style={{ fontSize: 16, fontWeight: 900, color: 'white' }}>{fromName}</div>
                            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 4, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{fromInfo}</div>
                          </div>
                        </div>

                        {/* Info Bar */}
                        <div style={{ backgroundColor: '#f8f8f8', padding: '16px 56px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, borderBottom: '1px solid #e4e4e7' }}>
                          {[['Tanggal', date], ['Jatuh Tempo', dueDate], ['Status', status], ['Tipe', invoiceTypeLabel]].map(([label, val]) => (
                            <div key={label}>
                              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a1a1aa', marginBottom: 3 }}>{label}</div>
                              <div style={{ fontSize: 11, fontWeight: 800, color: '#18181b' }}>{val}</div>
                            </div>
                          ))}
                        </div>

                        <div style={{ padding: '32px 56px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                          {/* Client */}
                          <div style={{ backgroundColor: '#f8f8f8', borderRadius: 10, padding: '16px 20px', marginBottom: 28, borderLeft: `4px solid ${themeColor}` }}>
                            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a1a1aa', marginBottom: 6 }}>Tagihan Kepada</div>
                            <div style={{ fontSize: 14, fontWeight: 900, color: '#18181b' }}>{toName}</div>
                            <div style={{ fontSize: 10, color: '#71717a', marginTop: 3, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{toAddress}</div>
                          </div>

                          {/* Table */}
                          <div style={{ marginBottom: 28, borderRadius: 10, overflow: 'hidden', border: '1px solid #e4e4e7' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 130px 140px', gap: 8, padding: '10px 16px', backgroundColor: themeColor }}>
                              {['Deskripsi Layanan', 'Qty', 'Harga Unit', 'Total'].map((h, i) => (
                                <span key={h} style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)', textAlign: i > 0 ? 'right' : 'left' }}>{h}</span>
                              ))}
                            </div>
                            {items.map((item, idx) => (
                              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 130px 140px', gap: 8, padding: '12px 16px', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa', borderTop: '1px solid #f4f4f5' }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#27272a' }}>{item.description || 'Tanpa Deskripsi'}</span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#71717a', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{item.qty.toLocaleString('id-ID')}</span>
                                <span style={{ fontSize: 10, fontWeight: 500, color: '#a1a1aa', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>Rp {item.price.toLocaleString('id-ID')}</span>
                                <span style={{ fontSize: 11, fontWeight: 800, color: '#18181b', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>Rp {(item.qty * item.price).toLocaleString('id-ID')}</span>
                              </div>
                            ))}
                          </div>

                          {/* Summary + Notes */}
                          <div style={{ display: 'flex', gap: 24, marginTop: 'auto' }}>
                            <div style={{ flex: 1, padding: '16px 20px', backgroundColor: '#f8f8f8', borderRadius: 10 }}>
                              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a1a1aa', marginBottom: 8 }}>Catatan &amp; Pembayaran</div>
                              <div style={{ fontSize: 10, color: '#71717a', lineHeight: 1.8, fontStyle: 'italic', whiteSpace: 'pre-line' }}>{notes}</div>
                            </div>
                            <div style={{ width: 240, flexShrink: 0 }}>
                              {[['Subtotal', `Rp ${subtotal.toLocaleString('id-ID')}`, false], ...(tax > 0 ? [[`Pajak (${tax}%)`, `Rp ${taxAmount.toLocaleString('id-ID')}`, false]] : []), ...(discount > 0 ? [['Diskon', `- Rp ${discount.toLocaleString('id-ID')}`, false]] : []), ...(invoiceType !== 'full' ? [['Total', `Rp ${total.toLocaleString('id-ID')}`, false], ['DP 50%', `Rp ${dpAmount.toLocaleString('id-ID')}`, false], ['Pelunasan 50%', `Rp ${(total - dpAmount).toLocaleString('id-ID')}`, false]] : [])].map(([label, val]) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f4f4f5', fontSize: 10, color: label === 'Diskon' ? '#ef4444' : '#71717a' }}>
                                  <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.12em' }}>{label}</span>
                                  <span style={{ fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>{val}</span>
                                </div>
                              ))}
                              <div style={{ backgroundColor: themeColor, borderRadius: 8, padding: '12px 16px', marginTop: 8 }}>
                                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>{invoiceType === 'dp' ? 'Tagihan DP 50%' : invoiceType === 'pelunasan' ? 'Tagihan Pelunasan' : 'Total Tagihan'}</div>
                                <div style={{ fontSize: 24, fontWeight: 900, color: 'white', fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>Rp {amountDue.toLocaleString('id-ID')}</div>
                              </div>
                            </div>
                          </div>

                          {/* Footer */}
                          <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div style={{ fontSize: 8, color: '#d4d4d8' }}>Generated by NaikCetak</div>
                            <div style={{ textAlign: 'center', borderTop: `2px solid ${themeColor}`, paddingTop: 10, width: 160 }}>
                              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#52525b' }}>{fromName}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ═══ CLASSIC ═══ */}
                    {template === 'classic' && (
                      <div style={{ margin: 20, border: `1px solid ${themeColor}`, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ border: '3px double #d4d4d8', margin: 6, flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 52px' }}>
                          {/* Top center company */}
                          <div style={{ textAlign: 'center', marginBottom: 28, paddingBottom: 20, borderBottom: `2px solid ${themeColor}` }}>
                            {logo && <img src={logo} alt="logo" style={{ height: 48, marginBottom: 10, margin: '0 auto 10px', objectFit: 'contain', display: 'block' }} />}
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#18181b', fontStyle: 'italic', letterSpacing: '0.05em' }}>{fromName}</div>
                            <div style={{ fontSize: 10, color: '#71717a', marginTop: 4, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{fromInfo}</div>
                          </div>

                          {/* INVOICE title */}
                          <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <div style={{ fontSize: 32, fontWeight: 700, fontStyle: 'italic', color: themeColor, letterSpacing: '0.05em' }}>Invoice</div>
                            <div style={{ fontSize: 11, color: '#71717a', marginTop: 4 }}>Nomor: {invoiceNumber}</div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 10px', border: `1px solid ${themeColor}`, color: themeColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{status}</span>
                              {invoiceType !== 'full' && <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 10px', border: '1px solid #3b82f6', color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{invoiceTypeLabel}</span>}
                            </div>
                          </div>

                          {/* Client + Dates */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 28, padding: '16px 0', borderTop: '1px solid #e4e4e7', borderBottom: '1px solid #e4e4e7' }}>
                            <div>
                              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a1a1aa', marginBottom: 6 }}>Tagihan Kepada</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#18181b', fontStyle: 'italic' }}>{toName}</div>
                              <div style={{ fontSize: 10, color: '#71717a', marginTop: 4, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{toAddress}</div>
                            </div>
                            <div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                {[['Tanggal', date], ['Jatuh Tempo', dueDate]].map(([l, v]) => (
                                  <div key={l}>
                                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a1a1aa', marginBottom: 3 }}>{l}</div>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: '#18181b' }}>{v}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Classic table with full borders */}
                          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 28, fontSize: 11 }}>
                            <thead>
                              <tr style={{ backgroundColor: themeColor }}>
                                {['Deskripsi Layanan', 'Qty', 'Harga Unit', 'Total'].map((h, i) => (
                                  <th key={h} style={{ padding: '9px 12px', textAlign: i > 0 ? 'right' : 'left', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'white', border: `1px solid ${themeColor}` }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item, idx) => (
                                <tr key={item.id} style={{ backgroundColor: idx % 2 === 0 ? '#fafafa' : '#ffffff' }}>
                                  <td style={{ padding: '10px 12px', border: '1px solid #e4e4e7', fontWeight: 600, color: '#27272a' }}>{item.description || 'Tanpa Deskripsi'}</td>
                                  <td style={{ padding: '10px 12px', border: '1px solid #e4e4e7', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#71717a' }}>{item.qty.toLocaleString('id-ID')}</td>
                                  <td style={{ padding: '10px 12px', border: '1px solid #e4e4e7', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace', fontSize: 10, color: '#a1a1aa' }}>Rp {item.price.toLocaleString('id-ID')}</td>
                                  <td style={{ padding: '10px 12px', border: '1px solid #e4e4e7', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace', fontWeight: 800, color: '#18181b' }}>Rp {(item.qty * item.price).toLocaleString('id-ID')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Summary + Notes */}
                          <div style={{ display: 'flex', gap: 28, marginTop: 'auto' }}>
                            <div style={{ flex: 1, padding: '14px 18px', border: '1px solid #e4e4e7' }}>
                              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a1a1aa', marginBottom: 8 }}>Catatan &amp; Pembayaran</div>
                              <div style={{ fontSize: 10, color: '#71717a', lineHeight: 1.8, fontStyle: 'italic', whiteSpace: 'pre-line' }}>{notes}</div>
                            </div>
                            <div style={{ width: 240, flexShrink: 0, border: '1px solid #e4e4e7', padding: '14px 18px' }}>
                              {[['Subtotal', `Rp ${subtotal.toLocaleString('id-ID')}`], ...(tax > 0 ? [[`Pajak (${tax}%)`, `Rp ${taxAmount.toLocaleString('id-ID')}`]] : []), ...(discount > 0 ? [['Diskon', `- Rp ${discount.toLocaleString('id-ID')}`]] : []), ...(invoiceType !== 'full' ? [['Total', `Rp ${total.toLocaleString('id-ID')}`], ['DP 50%', `Rp ${dpAmount.toLocaleString('id-ID')}`], ['Pelunasan 50%', `Rp ${(total - dpAmount).toLocaleString('id-ID')}`]] : [])].map(([label, val]) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f4f4f5', fontSize: 10, color: label === 'Diskon' ? '#ef4444' : '#71717a' }}>
                                  <span style={{ fontStyle: 'italic', fontWeight: 600 }}>{label}</span>
                                  <span style={{ fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>{val}</span>
                                </div>
                              ))}
                              <div style={{ marginTop: 10, paddingTop: 10, borderTop: `2px solid ${themeColor}`, textAlign: 'center' }}>
                                <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: themeColor, marginBottom: 4 }}>{invoiceType === 'dp' ? 'Tagihan DP 50%' : invoiceType === 'pelunasan' ? 'Tagihan Pelunasan' : 'Total Tagihan'}</div>
                                <div style={{ fontSize: 22, fontWeight: 900, color: themeColor, fontStyle: 'italic', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>Rp {amountDue.toLocaleString('id-ID')}</div>
                              </div>
                            </div>
                          </div>

                          {/* Footer */}
                          <div style={{ marginTop: 44, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e4e4e7', paddingTop: 20 }}>
                            <div style={{ fontSize: 10, fontStyle: 'italic', color: '#a1a1aa' }}>Terima kasih atas kepercayaan Anda.</div>
                            <div style={{ textAlign: 'center', width: 160 }}>
                              <div style={{ marginBottom: 36, fontSize: 8, color: '#a1a1aa', fontStyle: 'italic' }}>Tanda Tangan</div>
                              <div style={{ borderTop: '1px solid #d4d4d8', paddingTop: 8 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, fontStyle: 'italic', color: '#52525b' }}>{fromName}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ═══ BOLD ═══ */}
                    {template === 'bold' && (
                      <div style={{ padding: '52px 56px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
                          <div>
                            <div style={{ fontSize: 64, fontWeight: 900, color: themeColor, letterSpacing: '-4px', lineHeight: 0.9, textTransform: 'uppercase' }}>INVOICE</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#71717a', marginTop: 12, letterSpacing: '0.05em' }}>#{invoiceNumber}</div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                              <span style={{ fontSize: 10, fontWeight: 900, padding: '4px 12px', backgroundColor: status === 'Paid' ? '#022c22' : status === 'Cancelled' ? '#450a0a' : '#1c1917', color: 'white', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{status}</span>
                              {invoiceType !== 'full' && <span style={{ fontSize: 10, fontWeight: 900, padding: '4px 12px', backgroundColor: '#1e3a5f', color: 'white', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{invoiceTypeLabel}</span>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {logo && <img src={logo} alt="logo" style={{ height: 48, marginBottom: 12, marginLeft: 'auto', objectFit: 'contain' }} />}
                            <div style={{ fontSize: 18, fontWeight: 900, color: '#18181b', textTransform: 'uppercase', letterSpacing: '-0.5px' }}>{fromName}</div>
                            <div style={{ fontSize: 10, color: '#71717a', marginTop: 6, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{fromInfo}</div>
                          </div>
                        </div>

                        {/* Thick divider */}
                        <div style={{ height: 4, backgroundColor: themeColor, marginBottom: 28 }} />

                        {/* Client + Dates */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
                          <div style={{ borderLeft: `4px solid ${themeColor}`, paddingLeft: 16 }}>
                            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: themeColor, marginBottom: 6 }}>Tagihan Kepada</div>
                            <div style={{ fontSize: 16, fontWeight: 900, color: '#18181b', textTransform: 'uppercase' }}>{toName}</div>
                            <div style={{ fontSize: 10, color: '#71717a', marginTop: 4, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{toAddress}</div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {[['Tanggal', date], ['Jatuh Tempo', dueDate]].map(([l, v]) => (
                              <div key={l} style={{ backgroundColor: '#f4f4f5', padding: '12px 16px' }}>
                                <div style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#a1a1aa', marginBottom: 4 }}>{l}</div>
                                <div style={{ fontSize: 12, fontWeight: 900, color: '#18181b' }}>{v}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Table */}
                        <div style={{ marginBottom: 32 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 130px 140px', gap: 8, padding: '12px 16px', backgroundColor: '#18181b' }}>
                            {['Deskripsi Layanan', 'Qty', 'Harga Unit', 'Total'].map((h, i) => (
                              <span key={h} style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'white', textAlign: i > 0 ? 'right' : 'left' }}>{h}</span>
                            ))}
                          </div>
                          {items.map((item, idx) => (
                            <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 130px 140px', gap: 8, padding: '14px 16px', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f9f9f9', borderBottom: '1px solid #e4e4e7' }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#18181b' }}>{item.description || 'Tanpa Deskripsi'}</span>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#71717a', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{item.qty.toLocaleString('id-ID')}</span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#a1a1aa', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>Rp {item.price.toLocaleString('id-ID')}</span>
                              <span style={{ fontSize: 12, fontWeight: 900, color: '#18181b', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace' }}>Rp {(item.qty * item.price).toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                        </div>

                        {/* Summary + Notes */}
                        <div style={{ display: 'flex', gap: 28, marginTop: 'auto' }}>
                          <div style={{ flex: 1, padding: '16px 20px', backgroundColor: '#f4f4f5', borderLeft: `4px solid ${themeColor}` }}>
                            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: themeColor, marginBottom: 8 }}>Catatan &amp; Pembayaran</div>
                            <div style={{ fontSize: 10, color: '#71717a', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{notes}</div>
                          </div>
                          <div style={{ width: 240, flexShrink: 0 }}>
                            {[['Subtotal', `Rp ${subtotal.toLocaleString('id-ID')}`], ...(tax > 0 ? [[`Pajak (${tax}%)`, `Rp ${taxAmount.toLocaleString('id-ID')}`]] : []), ...(discount > 0 ? [['Diskon', `- Rp ${discount.toLocaleString('id-ID')}`]] : []), ...(invoiceType !== 'full' ? [['Total', `Rp ${total.toLocaleString('id-ID')}`], ['DP 50%', `Rp ${dpAmount.toLocaleString('id-ID')}`], ['Pelunasan 50%', `Rp ${(total - dpAmount).toLocaleString('id-ID')}`]] : [])].map(([label, val]) => (
                              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e4e4e7', fontSize: 11, color: label === 'Diskon' ? '#ef4444' : '#71717a' }}>
                                <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.12em' }}>{label}</span>
                                <span style={{ fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{val}</span>
                              </div>
                            ))}
                            <div style={{ backgroundColor: themeColor, padding: '16px 20px', marginTop: 8 }}>
                              <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>{invoiceType === 'dp' ? 'Tagihan DP 50%' : invoiceType === 'pelunasan' ? 'Tagihan Pelunasan' : 'Total Tagihan'}</div>
                              <div style={{ fontSize: 28, fontWeight: 900, color: 'white', fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px' }}>Rp {amountDue.toLocaleString('id-ID')}</div>
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div style={{ marginTop: 44, paddingTop: 16, borderTop: '4px solid #18181b', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                          <div style={{ fontSize: 8, color: '#d4d4d8' }}>Generated by NaikCetak</div>
                          <div style={{ textAlign: 'center', width: 160 }}>
                            <div style={{ marginBottom: 32, fontSize: 9, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Tanda Tangan</div>
                            <div style={{ borderTop: `2px solid ${themeColor}`, paddingTop: 8 }}>
                              <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#18181b', letterSpacing: '0.05em' }}>{fromName}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* ── HISTORY TAB ─────────────────────────────────────── */
          <motion.div
            key="riwayat"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className="card">
              <div className="card-header">
                <span className="section-title">Riwayat Invoice ({invoices.length})</span>
                <span className="text-[10px] text-zinc-400">Klik untuk memuat ke editor</span>
              </div>
              <div className="p-5">
                {invoices.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <FileText size={20} className="text-zinc-300" />
                    </div>
                    <p className="text-sm font-medium text-zinc-400">Belum ada invoice tersimpan</p>
                    <p className="text-xs text-zinc-300 mt-1">Buat invoice lalu klik Simpan</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {invoices.map(inv => (
                      <div
                        key={inv.id}
                        onClick={() => loadInvoice(inv)}
                        className="p-4 rounded-xl border border-zinc-100 hover:border-zinc-300 hover:shadow-md cursor-pointer transition-all relative group bg-zinc-50 hover:bg-white"
                      >
                        <button
                          onClick={e => handleDelete(inv.id, e)}
                          className="absolute top-3 right-3 w-6 h-6 bg-red-100 text-red-500 rounded-full items-center justify-center hidden group-hover:flex hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <Trash2 size={10} />
                        </button>
                        <div className="space-y-3">
                          <div className="flex items-start justify-between pr-6">
                            <div className="w-8 h-8 bg-white border border-zinc-200 rounded-xl flex items-center justify-center">
                              <FileText size={14} className="text-zinc-400" />
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded-md ${STATUS_STYLES[inv.status] || STATUS_STYLES.Pending}`}>
                                {inv.status}
                              </span>
                              {inv.invoice_type && inv.invoice_type !== 'full' && (
                                <span className="text-[8px] font-black px-2 py-0.5 rounded-md bg-blue-100 text-blue-700">
                                  {inv.invoice_type === 'dp' ? 'DP 50%' : 'PELUNASAN'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900 truncate">{inv.to_name}</p>
                            <p className="text-[10px] font-mono text-zinc-400">{inv.invoice_number}</p>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
                            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(inv.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}
                            </span>
                            <span className="text-sm font-black font-mono text-zinc-900">
                              Rp {(inv.amount_due ?? inv.total ?? 0).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
