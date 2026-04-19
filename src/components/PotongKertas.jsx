import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, ChevronRight, RotateCcw, Save, Eye, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  loadKertas, loadRiwayatPotong, saveRiwayatPotong,
  genId, formatRp, hargaPerLembar, calculateCuts,
} from '../lib/masterData';
import { saveActivity } from '../lib/supabase';

// ── SVG Grid Visualisation ────────────────────────────────────────────────────
function GridViz({ paperW, paperH, pieces, result }) {
  const [hovered, setHovered] = useState(null);
  const svgRef = useRef(null);

  if (!paperW || !paperH || !pieces?.length) {
    return (
      <div className="flex items-center justify-center h-52 bg-zinc-50 rounded-xl border border-zinc-200 border-dashed">
        <p className="text-xs text-zinc-400">Visualisasi grid akan tampil di sini</p>
      </div>
    );
  }

  const PAD = 3;
  const vbW = paperW + PAD * 2;
  const vbH = paperH + PAD * 2;
  const ox = PAD, oy = PAD;

  const efLabel = result?.efisiensi?.toFixed(1) ?? '—';

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="w-full h-auto max-h-72 rounded-xl border border-zinc-200 bg-white"
        style={{ display: 'block' }}
      >
        {/* Paper background */}
        <rect x={ox} y={oy} width={paperW} height={paperH} fill="#F9FAFB" stroke="#D1D5DB" strokeWidth={0.4} rx={1} />

        {/* Cut pieces */}
        {pieces.map(p => (
          <g key={p.num} onMouseEnter={() => setHovered(p)} onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'crosshair' }}>
            <rect
              x={ox + p.x + 0.15} y={oy + p.y + 0.15}
              width={p.w - 0.3} height={p.h - 0.3}
              fill={hovered?.num === p.num ? '#BFDBFE' : '#DBEAFE'}
              stroke="#3B82F6" strokeWidth={0.25} rx={0.5}
            />
            {p.w > 4 && p.h > 3 && (
              <text
                x={ox + p.x + p.w / 2} y={oy + p.y + p.h / 2}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={Math.min(p.w, p.h) * 0.28}
                fill="#1D4ED8" fontWeight="700"
              >
                {p.num}
              </text>
            )}
          </g>
        ))}

        {/* Dimension labels */}
        <text x={ox + paperW / 2} y={oy + paperH + PAD - 0.5}
          textAnchor="middle" fontSize={2.2} fill="#9CA3AF" fontWeight="600">
          {paperW} cm
        </text>
        <text
          x={ox - 1.5} y={oy + paperH / 2}
          textAnchor="middle" fontSize={2.2} fill="#9CA3AF" fontWeight="600"
          transform={`rotate(-90, ${ox - 1.5}, ${oy + paperH / 2})`}
        >
          {paperH} cm
        </text>
      </svg>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-2 right-2 bg-zinc-900 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg pointer-events-none"
          >
            #{hovered.num} — {hovered.w.toFixed(1)}×{hovered.h.toFixed(1)} cm
            <br />
            <span className="text-zinc-400">
              pos ({hovered.x.toFixed(1)}, {hovered.y.toFixed(1)})
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Efficiency badge */}
      <div className="absolute bottom-2 right-2 bg-white/90 border border-zinc-200 rounded-lg px-2.5 py-1 text-[10px] font-bold text-zinc-600 shadow-sm">
        Efisiensi {efLabel}%
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ message, type = 'success', onDone }) {
  useEffect(() => {
    const id = setTimeout(onDone, 3000);
    return () => clearTimeout(id);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95 }}
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-bold ${
        type === 'success'
          ? 'bg-emerald-500 text-white'
          : 'bg-amber-500 text-white'
      }`}
    >
      {type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
      {message}
    </motion.div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent = 'blue' }) {
  const COLORS = {
    blue:   'bg-blue-50 border-blue-100 text-blue-600',
    pink:   'bg-pink-50 border-pink-100 text-pink-600',
    green:  'bg-emerald-50 border-emerald-100 text-emerald-600',
    orange: 'bg-orange-50 border-orange-100 text-orange-600',
    teal:   'bg-teal-50 border-teal-100 text-teal-600',
  };
  return (
    <div className={`rounded-2xl border p-4 ${COLORS[accent]}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className="text-lg font-black leading-tight">{value ?? '—'}</p>
      {sub && <p className="text-[10px] opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const INIT_FORM = {
  namaCustomer: '', namaKertas: '',
  gsm: '', hargaLembar: '',
  lebarKertas: '', tinggiKertas: '',
  lebarPotong: '', tinggiPotong: '',
  mode: 'greedy',
  jumlahDiperlukan: '',
};

export default function PotongKertas({ user, planHook, onCarryOver, onNavigate, onUpgradeClick }) {
  const [form, setForm]         = useState(INIT_FORM);
  const [result, setResult]     = useState(null);
  const [masterKertas, setMK]   = useState([]);
  const [toast, setToast]       = useState(null);
  const [errors, setErrors]     = useState({});
  const [calculating, setCalc]  = useState(false);

  useEffect(() => { setMK(loadKertas()); }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSelectKertas = (nama) => {
    const k = masterKertas.find(x => x.nama === nama);
    set('namaKertas', nama);
    if (k) {
      setForm(p => ({
        ...p,
        namaKertas:   k.nama,
        gsm:          k.gsm,
        hargaLembar:  Math.round(hargaPerLembar(k.hargaRim)),
        lebarKertas:  k.p,
        tinggiKertas: k.l,
      }));
    }
  };

  const validate = () => {
    const e = {};
    if (!form.lebarKertas)  e.lebarKertas  = 'Wajib diisi';
    if (!form.tinggiKertas) e.tinggiKertas = 'Wajib diisi';
    if (!form.lebarPotong)  e.lebarPotong  = 'Wajib diisi';
    if (!form.tinggiPotong) e.tinggiPotong = 'Wajib diisi';
    const wk = +form.lebarKertas, hk = +form.tinggiKertas;
    const wp = +form.lebarPotong, hp = +form.tinggiPotong;
    if (wk && wp && hp && wp > wk && hp > wk)
      e.lebarPotong = 'Ukuran potongan melebihi kertas';
    if (hk && wp && hp && hp > hk && wp > hk)
      e.tinggiPotong = 'Ukuran potongan melebihi kertas';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCalc = useCallback(() => {
    if (!validate()) return;
    if (form.mode === 'brute') setCalc(true);

    setTimeout(() => {
      const r = calculateCuts(
        +form.lebarKertas, +form.tinggiKertas,
        +form.lebarPotong, +form.tinggiPotong,
        form.mode,
      );
      setCalc(false);
      if (!r || r.potonganPerLembar === 0) {
        setToast({ msg: 'Tidak ada potongan yang bisa didapat', type: 'warn' });
        return;
      }
      const qty = +form.jumlahDiperlukan || 0;
      const kertasDibutuhkan = qty ? Math.ceil(qty / r.potonganPerLembar) : 0;
      const totalHarga = kertasDibutuhkan * (+form.hargaLembar || 0);
      setResult({ ...r, kertasDibutuhkan, totalHarga, qty });

      const msg = r.efisiensi < 50
        ? `${r.potonganPerLembar} pcs/lbr — Efisiensi rendah (${r.efisiensi.toFixed(1)}%)`
        : `✓ ${r.potonganPerLembar} potongan/lembar — Efisiensi ${r.efisiensi.toFixed(1)}%`;
      setToast({ msg, type: r.efisiensi < 50 ? 'warn' : 'success' });
    }, form.mode === 'brute' ? 100 : 0);
  }, [form]);

  const handleSave = async () => {
    if (!result) return;
    const ringkasan = {
      jumlah: result.qty,
      potonganPerLembar: result.potonganPerLembar,
      kertasDibutuhkan: result.kertasDibutuhkan,
      totalHarga: result.totalHarga,
      efisiensi: result.efisiensi,
    };
    // Save to localStorage
    const prev = loadRiwayatPotong();
    saveRiwayatPotong([{
      id: genId(), tipe: 'potong_kertas',
      tanggal: new Date().toISOString(),
      namaCustomer: form.namaCustomer, namaBahan: form.namaKertas,
      ringkasan, form: { ...form },
    }, ...prev]);
    // Save to cloud if logged in
    if (user) {
      try {
        await saveActivity(user.id, {
          tipe: 'potong_kertas',
          judul: form.namaCustomer || form.namaKertas || 'Potong Kertas',
          ringkasan,
        });
      } catch { /* fallback silent — sudah tersimpan lokal */ }
    }
    // Track usage & refresh counter
    if (user && planHook) await planHook.consumeUsage('potong_kertas');
    setToast({ msg: user ? 'Tersimpan ke cloud ☁' : 'Tersimpan (lokal)', type: 'success' });
  };

  const handleReset = () => { setForm(INIT_FORM); setResult(null); setErrors({}); };

  const handleCarryOver = () => {
    if (!result) return;
    onCarryOver?.({
      namaCetakan:       form.namaCustomer,
      jumlahCetakan:     form.jumlahDiperlukan,
      namaBahan:         form.namaKertas,
      ukuranBahanP:      form.lebarKertas,
      ukuranBahanL:      form.tinggiKertas,
      ukuranPotongP:     form.lebarPotong,
      ukuranPotongL:     form.tinggiPotong,
      hargaPerLembar:    form.hargaLembar,
      potonganPerLembar: result.potonganPerLembar,
      kertasDibutuhkan:  result.kertasDibutuhkan,
      totalHargaKertas:  result.totalHarga,
    });
    onNavigate?.('cetakan');
  };

  const hargaRim = +form.hargaLembar ? +form.hargaLembar * 500 : 0;

  return (
    <div className="space-y-0 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-xl font-black text-zinc-900">Potong Kertas</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Kalkulator pemotongan kertas profesional dengan visualisasi grid real-time</p>
      </div>

      {/* Usage limit banner */}
      {planHook && !planHook.withinLimit('potong_kertas') && (
        <div className="mb-4 flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-bold text-amber-800">Batas penggunaan bulanan tercapai</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Upgrade ke Pro untuk penggunaan tanpa batas.
            </p>
          </div>
          <button onClick={onUpgradeClick}
            className="shrink-0 text-xs font-bold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors">
            Upgrade
          </button>
        </div>
      )}
      {planHook && planHook.withinLimit('potong_kertas') && planHook.plan === 'starter' && (
        (() => {
          const rem = planHook.remainingUsage('potong_kertas');
          return rem <= 3 ? (
            <div className="mb-4 flex items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <p className="text-xs text-blue-700">
                Sisa <strong>{rem}x</strong> penggunaan bulan ini (Starter).
              </p>
              <button onClick={onUpgradeClick}
                className="shrink-0 text-xs font-bold text-blue-600 hover:underline">
                Upgrade Pro →
              </button>
            </div>
          ) : null;
        })()
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[390px_1fr] gap-5 items-start">

        {/* ── LEFT PANEL — Form ─────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Informasi Cetak */}
          <div className="card shadow-sm">
            <div className="card-header">
              <span className="section-title">Informasi Cetak</span>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="label">Nama Customer / Cetakan</label>
                <input className="input-field" placeholder="Nama klien atau nama job..."
                  value={form.namaCustomer} onChange={e => set('namaCustomer', e.target.value)} />
              </div>
              <div>
                <label className="label">Bahan Kertas</label>
                <select className="input-field" value={form.namaKertas}
                  onChange={e => handleSelectKertas(e.target.value)}>
                  <option value="">— Pilih dari master —</option>
                  {masterKertas.map(k => (
                    <option key={k.id} value={k.nama}>{k.nama} ({k.gsm} gsm, {k.p}×{k.l} cm)</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Gramatur (gsm)</label>
                  <input type="number" className="input-field" placeholder="300"
                    value={form.gsm} onChange={e => set('gsm', e.target.value)} />
                </div>
                <div>
                  <label className="label">Harga / Lembar (Rp)</label>
                  <input type="number" className="input-field" placeholder="5000"
                    value={form.hargaLembar} onChange={e => set('hargaLembar', e.target.value)} />
                </div>
              </div>
              {hargaRim > 0 && (
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-600">
                  Harga per Rim (500 lbr): <span className="font-black text-zinc-900">{formatRp(hargaRim)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Ukuran */}
          <div className="card shadow-sm">
            <div className="card-header">
              <span className="section-title">Ukuran</span>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Lebar Kertas (cm)</label>
                  <input type="number" min="1" step="0.1"
                    className={`input-field bg-zinc-100 ${errors.lebarKertas ? 'ring-2 ring-red-400' : ''}`}
                    placeholder="79"
                    value={form.lebarKertas} onChange={e => { set('lebarKertas', e.target.value); setErrors(p => ({ ...p, lebarKertas: '' })); }} />
                </div>
                <div>
                  <label className="label">Tinggi Kertas (cm)</label>
                  <input type="number" min="1" step="0.1"
                    className={`input-field bg-zinc-100 ${errors.tinggiKertas ? 'ring-2 ring-red-400' : ''}`}
                    placeholder="109"
                    value={form.tinggiKertas} onChange={e => { set('tinggiKertas', e.target.value); setErrors(p => ({ ...p, tinggiKertas: '' })); }} />
                </div>
                <div>
                  <label className="label">Lebar Potongan (cm)</label>
                  <input type="number" min="0.1" step="0.1"
                    className={`input-field ${errors.lebarPotong ? 'ring-2 ring-red-400' : ''}`}
                    placeholder="20"
                    value={form.lebarPotong} onChange={e => { set('lebarPotong', e.target.value); setErrors(p => ({ ...p, lebarPotong: '' })); }} />
                  {errors.lebarPotong && <p className="text-[10px] text-red-500 mt-1">{errors.lebarPotong}</p>}
                </div>
                <div>
                  <label className="label">Tinggi Potongan (cm)</label>
                  <input type="number" min="0.1" step="0.1"
                    className={`input-field ${errors.tinggiPotong ? 'ring-2 ring-red-400' : ''}`}
                    placeholder="15"
                    value={form.tinggiPotong} onChange={e => { set('tinggiPotong', e.target.value); setErrors(p => ({ ...p, tinggiPotong: '' })); }} />
                  {errors.tinggiPotong && <p className="text-[10px] text-red-500 mt-1">{errors.tinggiPotong}</p>}
                </div>
              </div>

              <div>
                <label className="label">Mode Optimasi</label>
                <select className="input-field" value={form.mode} onChange={e => set('mode', e.target.value)}>
                  <option value="greedy">Cepat (Greedy) — Normal vs Rotasi 90°</option>
                  <option value="brute">Maksimal (Brute Force) — Coba semua strip</option>
                </select>
              </div>

              <div>
                <label className="label">Jumlah Cetakan Diperlukan</label>
                <input type="number" min="1" className="input-field" placeholder="3000"
                  value={form.jumlahDiperlukan} onChange={e => set('jumlahDiperlukan', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <button onClick={handleCalc} disabled={calculating}
              className="w-full btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2">
              {calculating
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menghitung...</>
                : <><Scissors size={15} /> Hitung Potongan</>}
            </button>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={handleSave} disabled={!result}
                className="btn-ghost py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40">
                <Save size={12} /> Simpan
              </button>
              <button disabled={!result}
                className="btn-ghost py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-violet-700 hover:bg-violet-50 disabled:opacity-40">
                <Eye size={12} /> Preview
              </button>
              <button onClick={handleReset}
                className="btn-ghost py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                <RotateCcw size={12} /> Reset
              </button>
            </div>
            <button onClick={handleCarryOver} disabled={!result}
              className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-amber-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Hitung Cetakan Lengkap <ChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* ── RIGHT PANEL — Results ─────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard label="Diperlukan"     value={result?.qty ? result.qty.toLocaleString('id-ID') : '—'} sub="pcs" accent="blue" />
            <StatCard label="Potongan/Lembar" value={result?.potonganPerLembar ?? '—'} sub="pcs per plano" accent="pink" />
            <StatCard label="Kertas Dibutuhkan" value={result?.kertasDibutuhkan ? result.kertasDibutuhkan.toLocaleString('id-ID') : '—'} sub="lembar" accent="green" />
            <StatCard label="Total Harga"    value={result?.totalHarga ? formatRp(result.totalHarga) : '—'} sub="estimasi kertas" accent="orange" />
            <StatCard label="Efisiensi"      value={result ? result.efisiensi.toFixed(1) + '%' : '—'} sub="penggunaan kertas" accent="teal" />
            {result && (
              <div className={`rounded-2xl border p-4 flex items-center justify-center text-center ${
                result.efisiensi >= 90 ? 'bg-emerald-50 border-emerald-100' :
                result.efisiensi >= 70 ? 'bg-blue-50 border-blue-100' :
                'bg-amber-50 border-amber-100'
              }`}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Strategi</p>
                  <span className={`text-xs font-black ${
                    result.efisiensi >= 90 ? 'text-emerald-600' :
                    result.efisiensi >= 70 ? 'text-blue-600' : 'text-amber-600'
                  }`}>
                    {result.strategy}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Efficiency warning/badge */}
          <AnimatePresence>
            {result && result.efisiensi < 50 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span><strong>Efisiensi rendah ({result.efisiensi.toFixed(1)}%).</strong> Pertimbangkan ukuran potongan alternatif atau orientasi berbeda.</span>
              </motion.div>
            )}
            {result && result.efisiensi >= 90 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs text-emerald-700">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                <span><strong>Efisiensi sangat baik!</strong> Penggunaan kertas sangat optimal.</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SVG Grid */}
          <div className="card shadow-sm">
            <div className="card-header">
              <span className="section-title">Visualisasi Grid</span>
              {result && (
                <span className="text-[10px] text-zinc-400">
                  {result.pieces.length} potongan pada 1 lembar plano
                </span>
              )}
            </div>
            <div className="p-4">
              <GridViz
                paperW={+form.lebarKertas}
                paperH={+form.tinggiKertas}
                pieces={result?.pieces}
                result={result}
              />
              {result && (
                <div className="flex gap-3 mt-3 text-[10px] text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-blue-200 border border-blue-400 inline-block" /> Potongan
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-zinc-100 border border-zinc-300 inline-block" /> Waste
                  </span>
                  <span className="ml-auto">Hover potongan untuk detail posisi</span>
                </div>
              )}
            </div>
          </div>

          {/* Detail panel */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="card shadow-sm">
                <div className="card-header">
                  <span className="section-title">Detail Kalkulasi</span>
                </div>
                <div className="p-5 space-y-3 text-sm">
                  {[
                    ['Ukuran Kertas',    `${form.lebarKertas} × ${form.tinggiKertas} cm`],
                    ['Ukuran Potongan',  `${form.lebarPotong} × ${form.tinggiPotong} cm`],
                    ['Luas Kertas',      `${(+form.lebarKertas * +form.tinggiKertas).toLocaleString('id-ID')} cm²`],
                    ['Luas Terpakai',    `${(+form.lebarPotong * +form.tinggiPotong * result.potonganPerLembar).toLocaleString('id-ID')} cm²`],
                    ['Luas Waste',       `${((+form.lebarKertas * +form.tinggiKertas) - (+form.lebarPotong * +form.tinggiPotong * result.potonganPerLembar)).toLocaleString('id-ID')} cm²`],
                    ['Mode',            form.mode === 'brute' ? 'Brute Force' : 'Greedy'],
                    ['Strategi',        result.strategy],
                  ].map(([l, v]) => (
                    <div key={l} className="flex justify-between items-center py-1.5 border-b border-zinc-50 last:border-0">
                      <span className="text-zinc-400 text-xs">{l}</span>
                      <span className="font-semibold text-zinc-800 text-xs">{v}</span>
                    </div>
                  ))}
                  {result.kertasDibutuhkan > 0 && (
                    <>
                      <div className="h-px bg-zinc-100 my-1" />
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-zinc-400 text-xs">Harga per Lembar</span>
                        <span className="font-semibold text-zinc-800 text-xs">{formatRp(+form.hargaLembar)}</span>
                      </div>
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-zinc-400 text-xs">Kertas Dibutuhkan</span>
                        <span className="font-semibold text-zinc-800 text-xs">{result.kertasDibutuhkan.toLocaleString('id-ID')} lembar</span>
                      </div>
                      <div className="flex justify-between items-center py-2 bg-zinc-50 px-3 rounded-lg">
                        <span className="font-bold text-zinc-700 text-xs">Total Harga Kertas</span>
                        <span className="font-black text-zinc-900 text-sm">{formatRp(result.totalHarga)}</span>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!result && (
            <div className="card shadow-sm p-12 text-center">
              <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Scissors size={24} className="text-zinc-400" />
              </div>
              <p className="text-sm font-bold text-zinc-400">Isi form & klik Hitung Potongan</p>
              <p className="text-xs text-zinc-300 mt-1">Visualisasi grid akan muncul di sini</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast
            key="toast"
            message={toast.msg}
            type={toast.type}
            onDone={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
