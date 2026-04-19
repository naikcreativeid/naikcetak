import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, Plus, X, MessageCircle, RotateCcw, Save, AlertTriangle } from 'lucide-react';
import {
  loadKertas, loadFinishing, loadMesin,
  loadRiwayatCetak, saveRiwayatCetak,
  genId, formatRp, hargaPerLembar, calculateCuts, calcFinishing,
} from '../lib/masterData';
import { saveActivity } from '../lib/supabase';

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children, badge }) {
  return (
    <div className="card shadow-sm">
      <div className="card-header">
        <span className="section-title">{title}</span>
        {badge != null && (
          <span className="text-[10px] bg-zinc-900 text-white px-2 py-0.5 rounded-full font-bold">{badge}</span>
        )}
      </div>
      <div className="p-5 space-y-3">{children}</div>
    </div>
  );
}

// ── Row helper ────────────────────────────────────────────────────────────────
function Row({ label, value, bold, accent }) {
  return (
    <div className="flex justify-between items-start gap-3 py-1.5 border-b border-zinc-50 last:border-0">
      <span className="text-xs text-zinc-400 shrink-0">{label}</span>
      <span className={`text-xs text-right font-semibold ${bold ? 'font-black text-zinc-900 text-sm' : 'text-zinc-700'} ${accent || ''}`}>
        {value}
      </span>
    </div>
  );
}

// ── Finishing item row ────────────────────────────────────────────────────────
function FinishingRow({ item, rumus, total, onRemove }) {
  return (
    <motion.div layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-2 py-2.5 border-b border-zinc-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-zinc-800">{item.nama}</p>
        <p className="text-[10px] text-zinc-400 mt-0.5 font-mono truncate">{rumus}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-black text-zinc-900">{formatRp(total)}</span>
        <button onClick={onRemove} className="text-zinc-300 hover:text-red-400 transition-colors">
          <X size={12} />
        </button>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const INIT = {
  namaCetakan: '', jumlahCetakan: '',
  namaBahan: '', ukuranBahanP: '', ukuranBahanL: '',
  ukuranPotongP: '', ukuranPotongL: '',
  hargaPerLembarOverride: '',
  namaMesin: '', warna: '4', warnaKhusus: '0',
  selectedFinishing: '',
  cmDilem: '', hargaPerCm: '',
  hargaLemBorongan: '',
  ongkosPacking: '', ongkosKirim: '', lainlain1: '', lainlain2: '',
  profit: '20',
};

export default function HitungCetakan({ user, planHook, initialData, onUpgradeClick }) {
  const [form, setForm]                 = useState(() => ({ ...INIT, ...initialData }));
  const [finishingList, setFinishingList] = useState([]);
  const [masterKertas, setMK]           = useState([]);
  const [masterFinishing, setMF]        = useState([]);
  const [masterMesin, setMM]            = useState([]);
  const [saved, setSaved]               = useState(false);

  useEffect(() => {
    setMK(loadKertas());
    setMF(loadFinishing());
    setMM(loadMesin());
  }, []);

  // Re-apply initialData when it changes (carry-over from PotongKertas)
  useEffect(() => {
    if (initialData) setForm(p => ({ ...p, ...initialData }));
  }, [initialData]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Auto-fill from master kertas
  const handleSelectKertas = (nama) => {
    const k = masterKertas.find(x => x.nama === nama);
    set('namaBahan', nama);
    if (k) setForm(p => ({
      ...p,
      namaBahan: k.nama,
      ukuranBahanP: k.p,
      ukuranBahanL: k.l,
      hargaPerLembarOverride: Math.round(hargaPerLembar(k.hargaRim)),
    }));
  };

  // Derived values
  const jumlah       = +form.jumlahCetakan  || 0;
  const bP           = +form.ukuranBahanP   || 0;
  const bL           = +form.ukuranBahanL   || 0;
  const pP           = +form.ukuranPotongP  || 0;
  const pL           = +form.ukuranPotongL  || 0;
  const hargaLembar  = +form.hargaPerLembarOverride || 0;

  const potonganPerLembar = useMemo(() => {
    if (!bP || !bL || !pP || !pL) return 1;
    const r = calculateCuts(bP, bL, pP, pL, 'greedy');
    return r?.potonganPerLembar || 1;
  }, [bP, bL, pP, pL]);

  const lembarDibutuhkan = jumlah ? Math.ceil(jumlah / potonganPerLembar) : 0;
  const totalHargaKertas = lembarDibutuhkan * hargaLembar;

  // Mesin calculation
  const mesin = masterMesin.find(m => m.nama === form.namaMesin);
  const warna = +form.warna || 1;
  const warnaKhusus = +form.warnaKhusus || 0;

  let hargaPlat = 0, ongkosCetak = 0, warningMesin = '';
  if (mesin) {
    hargaPlat = mesin.hargaPlat * (warna + warnaKhusus);
    if (lembarDibutuhkan < mesin.minLembar) {
      ongkosCetak = mesin.hargaPer1000 * warna + warnaKhusus * mesin.hargaWarnaKhusus;
      warningMesin = `Di bawah minimum ${mesin.minLembar.toLocaleString('id-ID')} lembar`;
    } else {
      ongkosCetak = (lembarDibutuhkan / 1000) * mesin.hargaPer1000 * warna
        + warnaKhusus * mesin.hargaWarnaKhusus;
    }
    ongkosCetak += hargaPlat;
  }

  // Finishing total
  const finishingCalcs = finishingList.map(item =>
    calcFinishing(item, { lebarPotong: pP, tinggiPotong: pL, jumlah, potonganPerLembar })
  );
  const totalFinishing = finishingCalcs.reduce((s, c) => s + c.total, 0);

  // Lem
  const totalLem = (+form.cmDilem || 0) * (+form.hargaPerCm || 0) * jumlah;
  const totalLemBorongan = (+form.hargaLemBorongan || 0) * jumlah;

  // Biaya tambahan
  const packing  = +form.ongkosPacking  || 0;
  const kirim    = +form.ongkosKirim    || 0;
  const lain1    = +form.lainlain1      || 0;
  const lain2    = +form.lainlain2      || 0;

  const subTotal = totalHargaKertas + ongkosCetak + totalFinishing
    + packing + kirim + lain1 + lain2 + totalLem + totalLemBorongan;
  const profitAmt = subTotal * ((+form.profit || 0) / 100);
  const total     = subTotal + profitAmt;
  const hargaSatuan = jumlah > 0 ? total / jumlah : 0;

  const addFinishing = () => {
    const item = masterFinishing.find(f => f.nama === form.selectedFinishing);
    if (!item || finishingList.find(f => f.id === item.id)) return;
    setFinishingList(p => [...p, item]);
    set('selectedFinishing', '');
  };

  const handleSave = async () => {
    const ringkasan = { jumlah, subTotal, profitAmt, total, hargaSatuan };
    // Save localStorage
    const prev = loadRiwayatCetak();
    saveRiwayatCetak([{
      id: genId(), tipe: 'hitung_cetakan',
      tanggal: new Date().toISOString(),
      namaCustomer: form.namaCetakan, namaBahan: form.namaBahan,
      ringkasan,
    }, ...prev]);
    // Save to cloud if logged in
    if (user) {
      try {
        await saveActivity(user.id, {
          tipe: 'hitung_cetakan',
          judul: form.namaCetakan || form.namaBahan || 'Hitung Cetakan',
          ringkasan,
        });
      } catch { /* silent */ }
    }
    if (user && planHook) await planHook.consumeUsage('hitung_cetakan');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleWA = () => {
    const msg = `*Rincian Biaya Cetak*\n\n` +
      `Nama: ${form.namaCetakan || '—'}\n` +
      `Bahan: ${form.namaBahan || '—'}\n` +
      `Qty: ${jumlah.toLocaleString('id-ID')} pcs\n\n` +
      `Kertas: ${formatRp(totalHargaKertas)}\n` +
      `Cetak: ${formatRp(ongkosCetak)}\n` +
      `Finishing: ${formatRp(totalFinishing)}\n` +
      `─────────────────\n` +
      `Sub Total: ${formatRp(subTotal)}\n` +
      `Profit (${form.profit}%): ${formatRp(profitAmt)}\n` +
      `*TOTAL: ${formatRp(total)}*\n` +
      `Harga Satuan: ${formatRp(hargaSatuan)} / pcs\n\n` +
      `_naikcetak_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-black text-zinc-900">Hitung Cetakan</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Kalkulasi biaya produksi cetak lengkap: kertas + ongkos + finishing + profit</p>
      </div>

      {/* Usage limit banner */}
      {planHook && !planHook.withinLimit('hitung_cetakan') && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-bold text-amber-800">Batas penggunaan bulanan tercapai</p>
            <p className="text-xs text-amber-600 mt-0.5">Upgrade ke Pro untuk penggunaan tanpa batas.</p>
          </div>
          <button onClick={onUpgradeClick}
            className="shrink-0 text-xs font-bold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors">
            Upgrade
          </button>
        </div>
      )}
      {planHook && planHook.withinLimit('hitung_cetakan') && planHook.plan === 'starter' && (
        (() => {
          const rem = planHook.remainingUsage('hitung_cetakan');
          return rem <= 2 ? (
            <div className="flex items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <p className="text-xs text-blue-700">
                Sisa <strong>{rem}x</strong> penggunaan bulan ini (Starter).
              </p>
              <button onClick={onUpgradeClick} className="shrink-0 text-xs font-bold text-blue-600 hover:underline">
                Upgrade Pro →
              </button>
            </div>
          ) : null;
        })()
      )}

      {initialData?.namaCetakan && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
          <Printer size={13} className="shrink-0" />
          <span>Data di-carry-over dari <strong>Potong Kertas</strong> — silakan lengkapi field yang tersisa.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* ── COL 1 ──────────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <Section title="Informasi Cetakan">
            <div>
              <label className="label">Nama Cetakan *</label>
              <input className="input-field" placeholder="Nama job / order"
                value={form.namaCetakan} onChange={e => set('namaCetakan', e.target.value)} />
            </div>
            <div>
              <label className="label">Jumlah Cetakan *</label>
              <input type="number" min="1" className="input-field" placeholder="3000"
                value={form.jumlahCetakan} onChange={e => set('jumlahCetakan', e.target.value)} />
            </div>
          </Section>

          <Section title="Harga Bahan">
            <div>
              <label className="label">Nama Bahan *</label>
              <select className="input-field" value={form.namaBahan}
                onChange={e => handleSelectKertas(e.target.value)}>
                <option value="">— Pilih dari master —</option>
                {masterKertas.map(k => (
                  <option key={k.id} value={k.nama}>{k.nama} ({k.gsm} gsm)</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Uk. Bahan P (cm)</label>
                <input type="number" className="input-field" placeholder="79"
                  value={form.ukuranBahanP} onChange={e => set('ukuranBahanP', e.target.value)} />
              </div>
              <div>
                <label className="label">Uk. Bahan L (cm)</label>
                <input type="number" className="input-field" placeholder="109"
                  value={form.ukuranBahanL} onChange={e => set('ukuranBahanL', e.target.value)} />
              </div>
              <div>
                <label className="label">Uk. Potong P (cm)</label>
                <input type="number" className="input-field" placeholder="20"
                  value={form.ukuranPotongP} onChange={e => set('ukuranPotongP', e.target.value)} />
              </div>
              <div>
                <label className="label">Uk. Potong L (cm)</label>
                <input type="number" className="input-field" placeholder="15"
                  value={form.ukuranPotongL} onChange={e => set('ukuranPotongL', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Harga / Lembar (Rp)</label>
              <input type="number" className="input-field" placeholder="5000"
                value={form.hargaPerLembarOverride} onChange={e => set('hargaPerLembarOverride', e.target.value)} />
            </div>
            {hargaLembar > 0 && (
              <div className="bg-zinc-50 rounded-xl px-4 py-2.5 text-xs text-zinc-500">
                Potongan/lbr: <strong className="text-zinc-800">{potonganPerLembar}</strong>
                <span className="mx-2">·</span>
                Lembar: <strong className="text-zinc-800">{lembarDibutuhkan.toLocaleString('id-ID')}</strong>
                <span className="mx-2">·</span>
                Total kertas: <strong className="text-emerald-700">{formatRp(totalHargaKertas)}</strong>
              </div>
            )}
          </Section>

          <Section title="Ongkos Cetak">
            <div>
              <label className="label">Nama Mesin *</label>
              <select className="input-field" value={form.namaMesin}
                onChange={e => set('namaMesin', e.target.value)}>
                <option value="">— Pilih mesin —</option>
                {masterMesin.map(m => (
                  <option key={m.id} value={m.nama}>{m.nama} (min {m.minLembar.toLocaleString('id-ID')} lbr)</option>
                ))}
              </select>
            </div>
            {warningMesin && (
              <div className="flex items-center gap-2 text-[11px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                <AlertTriangle size={12} className="shrink-0" /> {warningMesin}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Warna (CMYK)</label>
                <input type="number" min="1" max="8" className="input-field" value={form.warna}
                  onChange={e => set('warna', e.target.value)} />
              </div>
              <div>
                <label className="label">Warna Khusus</label>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => set('warnaKhusus', Math.max(0, +form.warnaKhusus - 1))}
                    className="btn-ghost px-2.5 py-1.5 rounded-lg text-sm font-bold">−</button>
                  <input type="number" min="0" className="input-field text-center"
                    value={form.warnaKhusus} onChange={e => set('warnaKhusus', e.target.value)} />
                  <button type="button" onClick={() => set('warnaKhusus', +form.warnaKhusus + 1)}
                    className="btn-ghost px-2.5 py-1.5 rounded-lg text-sm font-bold">+</button>
                </div>
              </div>
            </div>
            {mesin && (
              <div className="bg-zinc-50 rounded-xl px-4 py-3 space-y-1 text-xs text-zinc-500">
                <div className="flex justify-between"><span>Harga Plat ({warna + warnaKhusus} warna)</span><strong className="text-zinc-800">{formatRp(hargaPlat)}</strong></div>
                <div className="flex justify-between"><span>Total Ongkos Cetak</span><strong className="text-zinc-800">{formatRp(ongkosCetak)}</strong></div>
              </div>
            )}
          </Section>
        </div>

        {/* ── COL 2 ──────────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <Section title="Finishing" badge={finishingList.length || undefined}>
            <div className="flex gap-2">
              <select className="input-field flex-1" value={form.selectedFinishing}
                onChange={e => set('selectedFinishing', e.target.value)}>
                <option value="">— Pilih finishing —</option>
                {masterFinishing.map(f => (
                  <option key={f.id} value={f.nama}>{f.nama}</option>
                ))}
              </select>
              <button onClick={addFinishing} disabled={!form.selectedFinishing}
                className="btn-primary px-3 py-2 rounded-xl flex items-center gap-1 text-xs font-bold">
                <Plus size={13} /> Tambah
              </button>
            </div>
            <div className="min-h-[60px]">
              <AnimatePresence>
                {finishingList.map((item, i) => (
                  <FinishingRow
                    key={item.id}
                    item={item}
                    rumus={finishingCalcs[i]?.rumus ?? ''}
                    total={finishingCalcs[i]?.total ?? 0}
                    onRemove={() => setFinishingList(p => p.filter((_, j) => j !== i))}
                  />
                ))}
              </AnimatePresence>
              {finishingList.length === 0 && (
                <p className="text-xs text-zinc-400 text-center py-4">Belum ada finishing ditambahkan</p>
              )}
            </div>
            {finishingList.length > 0 && (
              <div className="flex justify-between pt-2 border-t border-zinc-100 text-xs font-black">
                <span className="text-zinc-500">Finishing ({finishingList.length} item)</span>
                <span className="text-zinc-900">{formatRp(totalFinishing)}</span>
              </div>
            )}
          </Section>

          <Section title="Ongkos Lem">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Cm Dilem</label>
                <input type="number" min="0" className="input-field" placeholder="5"
                  value={form.cmDilem} onChange={e => set('cmDilem', e.target.value)} />
              </div>
              <div>
                <label className="label">Harga / cm (Rp)</label>
                <input type="number" min="0" className="input-field" placeholder="50"
                  value={form.hargaPerCm} onChange={e => set('hargaPerCm', e.target.value)} />
              </div>
            </div>
            {totalLem > 0 && (
              <div className="bg-zinc-50 rounded-xl px-4 py-2 text-xs text-zinc-500">
                Total: <strong className="text-zinc-800">{formatRp(totalLem)}</strong>
                <span className="text-zinc-400 ml-1">({form.cmDilem} × {form.hargaPerCm} × {jumlah})</span>
              </div>
            )}
          </Section>

          <Section title="Ongkos Lem Borongan">
            <div>
              <label className="label">Harga / Lembar (Rp)</label>
              <input type="number" min="0" className="input-field" placeholder="100"
                value={form.hargaLemBorongan} onChange={e => set('hargaLemBorongan', e.target.value)} />
            </div>
            {totalLemBorongan > 0 && (
              <div className="bg-zinc-50 rounded-xl px-4 py-2 text-xs text-zinc-500">
                Total: <strong className="text-zinc-800">{formatRp(totalLemBorongan)}</strong>
              </div>
            )}
          </Section>
        </div>

        {/* ── COL 3 ──────────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <Section title="Biaya Tambahan">
            {[
              ['ongkosPacking', 'Ongkos Packing'],
              ['ongkosKirim',   'Ongkos Kirim'],
              ['lainlain1',     'Biaya Lain-lain 1'],
              ['lainlain2',     'Biaya Lain-lain 2'],
            ].map(([k, l]) => (
              <div key={k}>
                <label className="label">{l} (Rp)</label>
                <input type="number" min="0" className="input-field" placeholder="0"
                  value={form[k]} onChange={e => set(k, e.target.value)} />
              </div>
            ))}
          </Section>

          {/* Summary */}
          <div className="card shadow-sm">
            <div className="card-header">
              <span className="section-title">Ringkasan Total</span>
            </div>
            <div className="p-5 space-y-0.5">
              <Row label="Kertas"         value={formatRp(totalHargaKertas)} />
              <Row label="Ongkos Cetak"   value={formatRp(ongkosCetak)} />
              <Row label="Finishing"      value={formatRp(totalFinishing)} />
              <Row label="Packing"        value={formatRp(packing)} />
              <Row label="Kirim"          value={formatRp(kirim)} />
              <Row label="Lain-lain"      value={formatRp(lain1 + lain2)} />
              <Row label="Lem"            value={formatRp(totalLem)} />
              <Row label="Lem Borongan"   value={formatRp(totalLemBorongan)} />
              <div className="border-t border-zinc-200 mt-2 pt-3 flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-600">Sub Total</span>
                <span className="text-sm font-black text-zinc-900">{formatRp(subTotal)}</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-zinc-400 shrink-0">Profit (%)</span>
                <input type="number" min="0" max="200" className="input-field py-1 text-xs w-16 text-center"
                  value={form.profit} onChange={e => set('profit', e.target.value)} />
                <span className="text-xs font-semibold text-emerald-600 ml-auto">{formatRp(profitAmt)}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mt-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-emerald-700">TOTAL</span>
                  <span className="text-xl font-black text-emerald-800">{formatRp(total)}</span>
                </div>
                {hargaSatuan > 0 && (
                  <p className="text-[10px] text-emerald-600 mt-1 text-right">
                    {formatRp(hargaSatuan)} / pcs
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <button onClick={handleSave}
              className={`w-full btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${saved ? 'bg-emerald-600' : ''}`}>
              <Save size={15} /> {saved ? 'Tersimpan!' : 'Simpan Riwayat'}
            </button>
            <button onClick={handleWA}
              className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white transition-colors text-sm">
              <MessageCircle size={15} /> Kirim via WhatsApp
            </button>
            <button onClick={() => { setForm(INIT); setFinishingList([]); }}
              className="w-full btn-ghost py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-sm">
              <RotateCcw size={15} /> Reset Form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
