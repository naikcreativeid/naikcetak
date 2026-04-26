import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, RefreshCcw, AlertTriangle, TrendingUp, Lightbulb, HelpCircle, MessageCircle, Upload, Image as ImageIcon, X, FileText, Download, FileImage, FileDown, Box, Ruler, Layers3 } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { analyzeBriefImage } from '../lib/gemini';
import { getDielineMeta } from '../lib/dieline';

const MODEL = 'llama-3.3-70b-versatile';
const MAX_IMAGE_DIMENSION = 1280;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const EXAMPLES = [
  'Halo, saya punya bisnis skincare namanya Glowby. Butuh kemasan buat serum 30ml, kira-kira 500 pcs dulu buat launching. Maunya yang keliatan premium, ada emboss logo kalau bisa. Budget sekitar 10 jutaan. Butuhnya sekitar 3 minggu lagi.',
  'Mau pesan dus makanan buat snack keripik singkong. Ukurannya sekitar 15x10x8 cm, food grade ya. Qty 1000 pcs, full color print. Budget fleksibel asal kualitas bagus. Kapan bisa selesai kalau order sekarang?',
  'Butuh paperbag buat toko baju saya, ada 2 ukuran: kecil buat aksesoris sama besar buat baju. Laminasi doff, ada logo. Kira-kira 300 pcs masing-masing ukuran. Deadline akhir bulan ini.',
];

const SYSTEM_PROMPT = `Kamu adalah konsultan kemasan percetakan profesional di Indonesia. Tugasmu menganalisis brief klien dan menghasilkan quotation kemasan yang detail.

Dari teks brief klien, ekstrak dan generate dalam format JSON berikut (HANYA JSON, tanpa teks lain):
{
  "klien": {
    "nama_bisnis": "...",
    "industri": "...",
    "kontak_person": "..."
  },
  "kebutuhan": {
    "jenis_kemasan": "...",
    "deskripsi": "...",
    "ukuran_estimasi": "...",
    "qty": angka,
    "bahan_rekomendasi": "...",
    "finishing": ["...", "..."],
    "warna_cetak": "..."
  },
  "timeline": {
    "deadline_klien": "...",
    "estimasi_produksi": "...",
    "status_urgency": "normal|segera|express"
  },
  "quotation": {
    "harga_satuan_min": angka,
    "harga_satuan_max": angka,
    "total_min": angka,
    "total_max": angka,
    "dp_50pct": angka,
    "catatan_harga": "..."
  },
  "rekomendasi_ai": {
    "saran_utama": "...",
    "upsell": "...",
    "resiko": "..."
  },
  "status_brief": "lengkap|perlu_klarifikasi",
  "pertanyaan_klarifikasi": ["...", "..."]
}

Untuk harga gunakan referensi pasar Indonesia 2024:
- Rigid box premium: Rp 15.000–45.000/pcs
- Box karton custom: Rp 2.500–8.000/pcs
- Paperbag art paper: Rp 3.500–9.000/pcs
- Sleeve karton: Rp 2.000–6.000/pcs
- Kalkulasi total = harga_satuan * qty
- DP 50% dari total_min`;

const fmt = n => 'Rp ' + Math.round(n).toLocaleString('id-ID');

const URGENCY = {
  normal:  { label: 'Normal',  cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  segera:  { label: 'Segera',  cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  express: { label: 'Express', cls: 'bg-red-50 text-red-700 border border-red-200' },
};

const STEPS = [
  'Menghubungi Groq AI...',
  'Menganalisis brief klien...',
  'Mengekstrak spesifikasi kemasan...',
  'Menghitung estimasi harga...',
  'Menyusun quotation...',
];

const STEPS_IMAGE = [
  'Mengupload foto ke AI...',
  'Mendeteksi jenis kemasan...',
  'Mengestimasi dimensi & material...',
  'Menganalisa finishing & warna...',
  'Menyusun quotation visual...',
];

function slugify(value) {
  return (value || 'kemasan')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'kemasan';
}

function downloadBlob(filename, blob, type = 'application/octet-stream') {
  const url = URL.createObjectURL(blob instanceof Blob ? blob : new Blob([blob], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function formatDimsForDisplay(dims) {
  if (!dims) return '—';
  return `${dims.length} × ${dims.width} × ${dims.height} cm`;
}

async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
          const scale = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Gambar tidak bisa dibaca'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('File tidak bisa dibaca'));
    reader.readAsDataURL(file);
  });
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-zinc-100 gap-4 last:border-0">
      <span className="text-[11px] text-zinc-400 shrink-0">{label}</span>
      <span className="text-[11px] font-semibold text-zinc-800 text-right">{value || '—'}</span>
    </div>
  );
}

export default function AIBriefAnalyzer() {
  const [mode,    setMode]    = useState('text'); // 'text' | 'image'
  const [brief,   setBrief]   = useState('');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState('');
  const [step,    setStep]    = useState(0);
  const [exporting, setExporting] = useState(null);

  const [imagePreview, setImagePreview] = useState(null); // data URL
  const [imageCaption, setImageCaption] = useState('');
  const fileInputRef = useRef(null);
  const presentationRef = useRef(null);

  const apiKey = import.meta.env.VITE_GROQ_API_KEY;

  const activeSteps = mode === 'image' ? STEPS_IMAGE : STEPS;
  const dielineMeta = useMemo(() => {
    if (!result?.kebutuhan?.jenis_kemasan || !result?.kebutuhan?.ukuran_estimasi) return null;
    return getDielineMeta({
      jenis: result.kebutuhan.jenis_kemasan,
      ukuran: result.kebutuhan.ukuran_estimasi,
    });
  }, [result]);
  const dielineFileBase = useMemo(() => {
    const business = result?.klien?.nama_bisnis || result?.kebutuhan?.jenis_kemasan || 'kemasan';
    return `dieline-${slugify(business)}`;
  }, [result]);

  async function handleImageSelect(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('File harus berupa gambar (JPG/PNG/WebP)'); return; }
    if (file.size > MAX_IMAGE_BYTES) { setError('Ukuran file maksimal 4 MB'); return; }
    setError('');
    try {
      const dataUrl = await compressImage(file);
      setImagePreview(dataUrl);
      setResult(null);
    } catch (e) {
      setError(e.message);
    }
  }

  async function analyzeImage() {
    if (!imagePreview) return;
    if (!apiKey) { setError('VITE_GROQ_API_KEY tidak ditemukan di file .env'); return; }
    setLoading(true); setResult(null); setError(''); setStep(0);
    const interval = setInterval(() => setStep(s => Math.min(s + 1, STEPS_IMAGE.length - 1)), 900);
    try {
      const data = await analyzeBriefImage({ imageDataUrl: imagePreview, caption: imageCaption });
      clearInterval(interval);
      setResult(data);
    } catch (e) {
      clearInterval(interval);
      setError(e.message.includes('JSON') ? 'AI response tidak valid. Coba foto yang lebih jelas.' : e.message);
    }
    setLoading(false);
  }

  async function analyze() {
    if (!brief.trim()) return;
    if (!apiKey) { setError('VITE_GROQ_API_KEY tidak ditemukan di file .env'); return; }
    setLoading(true); setResult(null); setError(''); setStep(0);
    const interval = setInterval(() => setStep(s => Math.min(s + 1, activeSteps.length - 1)), 900);
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0.3,
          max_tokens: 1200,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Brief klien:\n"${brief}"` },
          ],
        }),
      });
      clearInterval(interval);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || 'Groq API error'); }
      const data = await res.json();
      const raw  = data.choices[0].message.content.trim();
      setResult(JSON.parse(raw.replace(/```json|```/g, '').trim()));
    } catch (e) {
      clearInterval(interval);
      setError(e.message.includes('JSON') ? 'AI response tidak valid. Coba lagi.' : e.message);
    }
    setLoading(false);
  }

  function waQuotation(r) {
    const k = r.kebutuhan, q = r.quotation, t = r.timeline, kl = r.klien;
    const msg = [
      `Halo! Terima kasih sudah menghubungi kami 🙏`,
      ``,
      `Berikut *QUOTATION KEMASAN* untuk ${kl.nama_bisnis || 'Anda'}:`,
      ``,
      `📦 *Detail Kemasan:*`,
      `• Jenis: ${k.jenis_kemasan}`,
      `• Bahan: ${k.bahan_rekomendasi}`,
      `• Ukuran: ${k.ukuran_estimasi}`,
      `• Qty: ${k.qty?.toLocaleString('id-ID')} pcs`,
      `• Finishing: ${Array.isArray(k.finishing) ? k.finishing.join(', ') : k.finishing}`,
      `• Warna Cetak: ${k.warna_cetak}`,
      ``,
      `💰 *Estimasi Harga:*`,
      `• Harga satuan: ${fmt(q.harga_satuan_min)}–${fmt(q.harga_satuan_max)}/pcs`,
      `• *Total: ${fmt(q.total_min)}–${fmt(q.total_max)}*`,
      `• DP 50%: ${fmt(q.dp_50pct)}`,
      ``,
      `⏱ Estimasi produksi: ${t.estimasi_produksi}`,
      ``,
      q.catatan_harga,
      ``,
      `Silakan konfirmasi untuk kami proses ya! 🎁`,
    ].join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  }

  function downloadDielineSvg() {
    if (!dielineMeta?.ok) return;
    downloadBlob(`${dielineFileBase}.svg`, dielineMeta.svg, 'image/svg+xml;charset=utf-8');
  }

  async function downloadPresentationPng() {
    if (!presentationRef.current) return;
    setExporting('png');
    try {
      const url = await toPng(presentationRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#f4f7fb',
      });
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dielineFileBase}-presentation.png`;
      a.click();
    } catch (e) {
      setError(`Gagal export PNG: ${e.message}`);
    } finally {
      setExporting(null);
    }
  }

  async function downloadPresentationPdf() {
    if (!presentationRef.current) return;
    setExporting('pdf');
    try {
      const url = await toPng(presentationRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#f4f7fb',
      });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const props = pdf.getImageProperties(url);
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const maxW = pageW - margin * 2;
      const maxH = pageH - margin * 2;
      const scale = Math.min(maxW / props.width, maxH / props.height);
      const drawW = props.width * scale;
      const drawH = props.height * scale;
      pdf.addImage(url, 'PNG', margin, margin, drawW, drawH);
      pdf.save(`${dielineFileBase}-presentation.pdf`);
    } catch (e) {
      setError(`Gagal export PDF: ${e.message}`);
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Page Header */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center">
              <Brain size={15} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-zinc-900 text-sm tracking-tight">AI Brief Analyzer</p>
              <p className="text-[10px] text-zinc-400">Analisis brief klien &amp; generate quotation otomatis · {MODEL}</p>
            </div>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">
            <Zap size={11} /> Auto Quotation
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

        {/* ── Input ───────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="flex bg-zinc-100 rounded-xl p-1 gap-1">
            {[
              { id: 'text',  label: 'Brief Teks',     icon: FileText },
              { id: 'image', label: 'Foto Kemasan',   icon: ImageIcon },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id}
                onClick={() => { setMode(id); setResult(null); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
                  mode === id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                }`}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {mode === 'text' ? (
            <div className="card">
              <div className="card-header">
                <span className="section-title">Brief Klien</span>
                {brief && (
                  <button
                    onClick={() => { setBrief(''); setResult(null); setError(''); }}
                    className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    <RefreshCcw size={11} /> Reset
                  </button>
                )}
              </div>
              <div className="p-5 space-y-4">
                <textarea
                  value={brief}
                  onChange={e => setBrief(e.target.value)}
                  className="input-field resize-none h-36 text-sm leading-relaxed"
                  placeholder={`Paste atau ketik brief klien di sini...\n\nContoh: "Butuh box kemasan buat kue kering 500 pcs, ukuran sedang, full color, deadline 2 minggu, budget 3 juta..."`}
                />

                <div>
                  <p className="label mb-2">Coba contoh brief:</p>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLES.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => { setBrief(ex); setResult(null); setError(''); }}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:border-violet-400 hover:text-violet-700 transition-all"
                      >
                        Contoh {i + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={analyze}
                  disabled={loading || !brief.trim()}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="animate-pulse text-sm">{activeSteps[step]}</span>
                    </>
                  ) : (
                    <><Zap size={15} /> Analisis Brief &amp; Generate Quotation</>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <span className="section-title">Foto Kemasan Referensi</span>
                {imagePreview && (
                  <button
                    onClick={() => { setImagePreview(null); setImageCaption(''); setResult(null); setError(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    <RefreshCcw size={11} /> Reset
                  </button>
                )}
              </div>
              <div className="p-5 space-y-4">
                {!imagePreview ? (
                  <label
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-violet-400','bg-violet-50/30'); }}
                    onDragLeave={(e) => { e.currentTarget.classList.remove('border-violet-400','bg-violet-50/30'); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-violet-400','bg-violet-50/30');
                      handleImageSelect(e.dataTransfer.files?.[0]);
                    }}
                    className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-zinc-200 rounded-2xl p-10 cursor-pointer hover:border-violet-400 hover:bg-violet-50/30 transition-all"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleImageSelect(e.target.files?.[0])}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center">
                      <Upload size={20} className="text-violet-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-zinc-800">Upload foto kemasan</p>
                      <p className="text-[11px] text-zinc-400 mt-1">Klik atau drag &amp; drop · JPG / PNG / WebP · max 4 MB</p>
                    </div>
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
                    <img src={imagePreview} alt="Preview" className="w-full max-h-80 object-contain bg-zinc-50" />
                    <button
                      onClick={() => { setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                      title="Hapus gambar"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <div>
                  <p className="label mb-2">Catatan tambahan (opsional)</p>
                  <textarea
                    value={imageCaption}
                    onChange={e => setImageCaption(e.target.value)}
                    className="input-field resize-none h-20 text-sm leading-relaxed"
                    placeholder="Misal: Qty 1000 pcs, deadline 3 minggu, budget fleksibel, untuk brand skincare..."
                  />
                </div>

                <button
                  onClick={analyzeImage}
                  disabled={loading || !imagePreview}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="animate-pulse text-sm">{activeSteps[step]}</span>
                    </>
                  ) : (
                    <><Zap size={15} /> Analisis Foto &amp; Generate Quotation</>
                  )}
                </button>

                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  AI akan mendeteksi <strong>jenis kemasan, dimensi estimasi, material, finishing, warna cetak, dan draft dieline</strong> dari foto, lalu membuat quotation + presentasi siap kirim ke klien.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* ── Result ──────────────────────────────────────── */}
        <AnimatePresence>
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Status badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Analisis selesai
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${(URGENCY[result.timeline?.status_urgency] || URGENCY.normal).cls}`}>
                  {(URGENCY[result.timeline?.status_urgency] || URGENCY.normal).label}
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${result.status_brief === 'lengkap' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  {result.status_brief === 'lengkap' ? 'Brief Lengkap ✓' : 'Perlu Klarifikasi'}
                </span>
              </div>

              {/* Client + Timeline */}
              <div className="card">
                <div className="card-header"><span className="section-title">Identitas Klien</span></div>
                <div className="p-4">
                  <InfoRow label="Nama Bisnis"  value={result.klien?.nama_bisnis} />
                  <InfoRow label="Industri"     value={result.klien?.industri} />
                  <InfoRow label="Deadline"     value={result.timeline?.deadline_klien} />
                  <InfoRow label="Est. Produksi" value={result.timeline?.estimasi_produksi} />
                </div>
              </div>

              {/* Specs */}
              <div className="card">
                <div className="card-header"><span className="section-title">Spesifikasi Kemasan</span></div>
                <div className="p-4">
                  <InfoRow label="Jenis"    value={result.kebutuhan?.jenis_kemasan} />
                  <InfoRow label="Bahan"    value={result.kebutuhan?.bahan_rekomendasi} />
                  <InfoRow label="Ukuran"   value={result.kebutuhan?.ukuran_estimasi} />
                  <InfoRow label="Qty"      value={result.kebutuhan?.qty ? result.kebutuhan.qty.toLocaleString('id-ID') + ' pcs' : null} />
                  <InfoRow label="Warna"    value={result.kebutuhan?.warna_cetak} />
                  <InfoRow label="Finishing" value={Array.isArray(result.kebutuhan?.finishing) ? result.kebutuhan.finishing.join(', ') : result.kebutuhan?.finishing} />
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <span className="section-title">Breakdown Dieline</span>
                  {dielineMeta?.ok ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {dielineMeta.typeLabel}
                    </span>
                  ) : (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200">
                      Draft manual
                    </span>
                  )}
                </div>
                <div className="p-4 space-y-4">
                  {dielineMeta?.ok ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { label: 'Tipe', value: dielineMeta.typeLabel, Icon: Box },
                          { label: 'Ukuran jadi', value: formatDimsForDisplay(dielineMeta.dims), Icon: Ruler },
                          { label: 'Komponen', value: `${dielineMeta.summary?.length || 0} poin breakdown`, Icon: Layers3 },
                        ].map(({ label, value, Icon }) => (
                          <div key={label} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                            <div className="flex items-center gap-2 mb-2 text-zinc-500">
                              <Icon size={13} />
                              <span className="text-[10px] font-bold uppercase tracking-[0.15em]">{label}</span>
                            </div>
                            <p className="text-xs font-semibold text-zinc-900 leading-relaxed">{value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {dielineMeta.summary?.map((item) => (
                          <div key={item.label} className="rounded-2xl border border-zinc-200 bg-white p-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400 mb-1">{item.label}</p>
                            <p className="text-sm font-semibold text-zinc-800 leading-relaxed">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700 mb-2">Catatan Produksi</p>
                        <div className="space-y-1.5">
                          {dielineMeta.assumptions?.map((note, i) => (
                            <p key={i} className="text-xs text-amber-900 leading-relaxed">{i + 1}. {note}</p>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 leading-relaxed">
                      AI belum bisa membuat dieline standar otomatis untuk tipe kemasan ini. Biasanya ini terjadi jika ukuran belum terbaca jelas atau jenis kemasannya seperti pouch/flexible packaging yang butuh pola manufaktur khusus.
                    </div>
                  )}
                </div>
              </div>

              {dielineMeta?.ok && (
                <div className="card overflow-hidden">
                  <div className="card-header">
                    <span className="section-title">Preview Presentasi Client</span>
                    <span className="text-[10px] font-bold text-zinc-400">Siap download</span>
                  </div>
                  <div className="p-4 bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#eef3f8_100%)]">
                    <div
                      ref={presentationRef}
                      className="rounded-[28px] border border-zinc-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.12)] p-6 sm:p-8 space-y-6"
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-400">Packaging Dieline Preview</p>
                          <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">
                            {result.kebutuhan?.jenis_kemasan || 'Custom Packaging'}
                          </h3>
                          <p className="mt-2 text-sm text-zinc-500 max-w-2xl leading-relaxed">
                            Breakdown struktur kemasan otomatis dari AI analyzer berdasarkan brief/foto referensi klien.
                          </p>
                        </div>
                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 min-w-[180px]">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400 mb-1">Estimasi ukuran</p>
                          <p className="text-lg font-black text-zinc-900">{formatDimsForDisplay(dielineMeta.dims)}</p>
                          <p className="text-[11px] text-zinc-500 mt-1">{dielineMeta.typeLabel}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-5 items-start">
                        <div className="space-y-4">
                          {imagePreview && (
                            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-3">
                              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400 mb-2">Foto Referensi</p>
                              <img src={imagePreview} alt="Foto referensi kemasan" className="w-full rounded-2xl object-cover border border-zinc-200" />
                            </div>
                          )}

                          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400 mb-2">Spesifikasi Ringkas</p>
                            <div className="space-y-2">
                              <InfoRow label="Bahan" value={result.kebutuhan?.bahan_rekomendasi} />
                              <InfoRow label="Finishing" value={Array.isArray(result.kebutuhan?.finishing) ? result.kebutuhan.finishing.join(', ') : result.kebutuhan?.finishing} />
                              <InfoRow label="Warna" value={result.kebutuhan?.warna_cetak} />
                              <InfoRow label="Qty" value={result.kebutuhan?.qty ? `${result.kebutuhan.qty.toLocaleString('id-ID')} pcs` : '—'} />
                            </div>
                          </div>
                        </div>

                        <div className="rounded-3xl border border-zinc-200 bg-white p-4">
                          <div
                            className="rounded-[24px] border border-zinc-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] p-4"
                            dangerouslySetInnerHTML={{ __html: dielineMeta.svg }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400 mb-2">Highlight AI</p>
                          <p className="text-sm font-semibold text-zinc-800 leading-relaxed">{result.rekomendasi_ai?.saran_utama || '—'}</p>
                        </div>
                        <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400 mb-2">Catatan Approval</p>
                          <p className="text-sm font-semibold text-zinc-800 leading-relaxed">
                            Draft ini cocok untuk presentasi awal ke klien sebelum final artwork, proof ukuran, dan approval prepress.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quotation */}
              <div className="card overflow-hidden">
                <div className="px-5 py-4 bg-zinc-900 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-300">Estimasi Quotation</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ['Harga/pcs', result.quotation ? `${fmt(result.quotation.harga_satuan_min)}–\n${fmt(result.quotation.harga_satuan_max)}` : '—'],
                      ['Total',     result.quotation ? `${fmt(result.quotation.total_min)}–\n${fmt(result.quotation.total_max)}` : '—'],
                      ['DP 50%',    result.quotation?.dp_50pct ? fmt(result.quotation.dp_50pct) : '—'],
                    ].map(([label, val]) => (
                      <div key={label} className="bg-zinc-50 rounded-xl p-3 text-center">
                        <p className="label text-center mb-1.5">{label}</p>
                        <p className="font-mono font-black text-zinc-900 text-[11px] leading-snug whitespace-pre-line">{val}</p>
                      </div>
                    ))}
                  </div>
                  {result.quotation?.catatan_harga && (
                    <p className="text-[11px] text-zinc-500 italic border-t border-zinc-100 pt-3 leading-relaxed">
                      {result.quotation.catatan_harga}
                    </p>
                  )}
                </div>
              </div>

              {/* AI Rekomendasi */}
              <div className="card">
                <div className="card-header"><span className="section-title">Rekomendasi AI</span></div>
                <div className="p-4 space-y-2">
                  {[
                    { label: 'Saran Utama',     val: result.rekomendasi_ai?.saran_utama, Icon: Lightbulb,     cls: 'bg-emerald-50 text-emerald-800 border border-emerald-100' },
                    { label: 'Peluang Upsell',  val: result.rekomendasi_ai?.upsell,      Icon: TrendingUp,    cls: 'bg-blue-50 text-blue-800 border border-blue-100' },
                    { label: 'Risiko / Catatan',val: result.rekomendasi_ai?.resiko,      Icon: AlertTriangle, cls: 'bg-amber-50 text-amber-800 border border-amber-100' },
                  ].map(({ label, val, Icon, cls }) => (
                    <div key={label} className={`flex items-start gap-3 p-3 rounded-xl ${cls}`}>
                      <Icon size={13} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-0.5">{label}</p>
                        <p className="text-xs leading-relaxed">{val || '—'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Klarifikasi */}
              {result.pertanyaan_klarifikasi?.length > 0 && result.status_brief !== 'lengkap' && (
                <div className="card">
                  <div className="card-header">
                    <span className="section-title">Pertanyaan Klarifikasi</span>
                    <HelpCircle size={13} className="text-amber-500" />
                  </div>
                  <div className="p-4 space-y-2">
                    {result.pertanyaan_klarifikasi.map((q, i) => (
                      <div key={i} className="flex gap-2.5 text-xs text-zinc-600">
                        <span className="font-bold text-amber-500 shrink-0">{i + 1}.</span>
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => waQuotation(result)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-[#25D366] text-white hover:opacity-90 transition-opacity"
                >
                  <MessageCircle size={15} /> Kirim via WhatsApp
                </button>
                {dielineMeta?.ok ? (
                  <button
                    onClick={downloadDielineSvg}
                    className="btn-ghost flex items-center justify-center gap-2 py-3 rounded-xl"
                  >
                    <Download size={14} /> Download SVG Dieline
                  </button>
                ) : (
                  <button
                    disabled
                    className="btn-ghost flex items-center justify-center gap-2 py-3 rounded-xl opacity-50 cursor-not-allowed"
                  >
                    <Download size={14} /> SVG belum tersedia
                  </button>
                )}
                <button
                  onClick={downloadPresentationPng}
                  disabled={exporting === 'png' || !dielineMeta?.ok}
                  className="btn-ghost flex items-center justify-center gap-2 py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FileImage size={14} /> {exporting === 'png' ? 'Menyiapkan PNG...' : 'Download PNG Presentasi'}
                </button>
                <button
                  onClick={downloadPresentationPdf}
                  disabled={exporting === 'pdf' || !dielineMeta?.ok}
                  className="btn-ghost flex items-center justify-center gap-2 py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FileDown size={14} /> {exporting === 'pdf' ? 'Menyiapkan PDF...' : 'Download PDF Presentasi'}
                </button>
                <button
                  onClick={() => {
                    setResult(null);
                    setBrief('');
                    setImagePreview(null);
                    setImageCaption('');
                    setExporting(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="btn-ghost flex items-center justify-center gap-2 py-3 rounded-xl sm:col-span-2"
                >
                  <RefreshCcw size={14} /> Brief Baru
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
