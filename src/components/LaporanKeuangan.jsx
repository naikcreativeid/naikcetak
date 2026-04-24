import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Wallet, Receipt, PiggyBank, AlertCircle,
  BarChart3, PieChart, Download, Printer, FileSpreadsheet, ChevronRight,
  FileText, Calculator,
} from 'lucide-react';
import { getUserInvoices } from '../lib/supabase';
import { formatRp } from '../lib/masterData';

// ── Helpers ───────────────────────────────────────────────────────────────────
const BULAN_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const BULAN_LONG  = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

const HPP_RATIO_DEFAULT = 0.6; // estimasi HPP = 60% dari nilai invoice (fallback saat data HPP belum tersedia)

function formatJuta(n) {
  if (!n && n !== 0) return 'Rp 0';
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)} M`;
  if (abs >= 1_000_000)     return `Rp ${(n / 1_000_000).toFixed(1)} jt`;
  if (abs >= 1_000)         return `Rp ${(n / 1_000).toFixed(0)} rb`;
  return formatRp(n);
}

function normalizeStatus(s) {
  const v = String(s ?? '').toLowerCase();
  if (['lunas','paid','dibayar'].includes(v)) return 'lunas';
  if (['overdue','terlambat'].includes(v)) return 'overdue';
  return 'pending';
}

function monthKey(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
}

// ── Aggregation ───────────────────────────────────────────────────────────────
function aggregate(invoices, periodeKey) {
  const [py, pm] = periodeKey.split('-').map(Number);
  const now = new Date();

  // Invoice bulan ini
  const bulanIni = invoices.filter(inv => {
    const d = new Date(inv.date || inv.created_at);
    return d.getFullYear() === py && d.getMonth() + 1 === pm;
  });

  // Invoice bulan lalu (untuk perbandingan)
  const prev = new Date(py, pm - 2, 1);
  const bulanLalu = invoices.filter(inv => {
    const d = new Date(inv.date || inv.created_at);
    return d.getFullYear() === prev.getFullYear() && d.getMonth() === prev.getMonth();
  });

  const sumTotal = arr => arr.reduce((s, i) => s + Number(i.total || i.amount_due || 0), 0);

  const omzet        = sumTotal(bulanIni);
  const omzetLalu    = sumTotal(bulanLalu);
  const hpp          = omzet * HPP_RATIO_DEFAULT;
  const labaKotor    = omzet - hpp;
  const belumLunas   = bulanIni.filter(i => normalizeStatus(i.status) !== 'lunas');
  const nilaiBelumLunas = sumTotal(belumLunas);

  const pctOmzet = omzetLalu > 0 ? Math.round(((omzet - omzetLalu) / omzetLalu) * 100) : null;
  const pctHpp   = omzet > 0    ? Math.round((hpp / omzet) * 100) : 0;
  const margin   = omzet > 0    ? Math.round((labaKotor / omzet) * 100) : 0;

  // Tren 6 bulan terakhir dari periode
  const tren = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(py, pm - 1 - i, 1);
    const key = monthKey(d);
    const rows = invoices.filter(inv => monthKey(inv.date || inv.created_at) === key);
    const o = sumTotal(rows);
    tren.push({
      bulan:  BULAN_SHORT[d.getMonth()],
      omzet:  o,
      hpp:    o * HPP_RATIO_DEFAULT,
      laba:   o - o * HPP_RATIO_DEFAULT,
    });
  }

  // Status distribusi (dari periode aktif)
  const statCounts = { lunas: 0, pending: 0, overdue: 0 };
  bulanIni.forEach(i => { statCounts[normalizeStatus(i.status)]++; });
  const totalInv = bulanIni.length;

  // Invoice terbaru (keseluruhan, max 10)
  const terbaru = [...invoices]
    .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
    .slice(0, 10)
    .map(i => ({
      id:       i.id,
      no:       i.invoice_number || '—',
      klien:    i.to_name || '—',
      nilai:    Number(i.total || i.amount_due || 0),
      tanggal:  new Date(i.date || i.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      status:   normalizeStatus(i.status),
    }));

  return {
    omzet, hpp, labaKotor, nilaiBelumLunas,
    jumlahBelumLunas: belumLunas.length,
    pctOmzet, pctHpp, margin,
    tren, statCounts, totalInv, terbaru,
  };
}

// ── Filter periode dropdown ───────────────────────────────────────────────────
function buildPeriodOptions(invoices) {
  const set = new Set();
  const now = new Date();
  // Tambahkan 12 bulan terakhir + bulan yang ada data
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    set.add(monthKey(d));
  }
  invoices.forEach(i => set.add(monthKey(i.date || i.created_at)));
  return [...set]
    .sort((a, b) => b.localeCompare(a))
    .map(k => {
      const [y, m] = k.split('-').map(Number);
      return { value: k, label: `${BULAN_LONG[m - 1]} ${y}` };
    });
}

// ── Metric Card ───────────────────────────────────────────────────────────────
function MetricCard({ icon: Icon, label, value, sub, subTone = 'neutral', iconBg = 'bg-zinc-100', iconColor = 'text-zinc-600' }) {
  const toneClass = {
    pos:     'text-emerald-600',
    neg:     'text-red-600',
    neutral: 'text-zinc-500',
  }[subTone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-zinc-200 rounded-xl p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon size={15} className={iconColor} />
        </div>
      </div>
      <p className="text-2xl font-black text-zinc-900 tabular-nums">{value}</p>
      {sub && <p className={`text-xs mt-1.5 font-semibold ${toneClass}`}>{sub}</p>}
    </motion.div>
  );
}

// ── Grafik Tren (pure SVG) ────────────────────────────────────────────────────
function TrenChart({ data }) {
  const W = 560, H = 220, P = { t: 16, r: 16, b: 28, l: 52 };
  const max = Math.max(...data.map(d => Math.max(d.omzet, d.hpp)), 1);
  const barW = 14;
  const slotW = (W - P.l - P.r) / data.length;

  const yScale = v => P.t + (H - P.t - P.b) * (1 - v / max);

  // Garis laba
  const linePath = data.map((d, i) => {
    const x = P.l + slotW * i + slotW / 2;
    const y = yScale(d.laba);
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  const areaPath = `${linePath} L${P.l + slotW * (data.length - 1) + slotW / 2},${H - P.b} L${P.l + slotW / 2},${H - P.b} Z`;

  // Gridlines
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => max * f);

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        <LegendDot color="#2563EB" label="Omzet" />
        <LegendDot color="#94A3B8" label="HPP" />
        <LegendDot color="#10B981" label="Laba Kotor" dashed />
      </div>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[480px] h-[220px]">
          {/* Gridlines + Y labels */}
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={P.l} x2={W - P.r} y1={yScale(t)} y2={yScale(t)} stroke="#F1F5F9" strokeWidth="1" />
              <text x={P.l - 6} y={yScale(t) + 3} textAnchor="end" fontSize="9" fill="#94A3B8">{formatJuta(t)}</text>
            </g>
          ))}
          {/* Bars */}
          {data.map((d, i) => {
            const cx = P.l + slotW * i + slotW / 2;
            return (
              <g key={i}>
                <rect x={cx - barW - 1} y={yScale(d.omzet)} width={barW} height={H - P.b - yScale(d.omzet)}
                  fill="#2563EB" rx="2" />
                <rect x={cx + 1} y={yScale(d.hpp)} width={barW} height={H - P.b - yScale(d.hpp)}
                  fill="#94A3B8" rx="2" />
                <text x={cx} y={H - P.b + 14} textAnchor="middle" fontSize="10" fill="#64748B" fontWeight="600">{d.bulan}</text>
              </g>
            );
          })}
          {/* Laba area + line */}
          <path d={areaPath} fill="#10B981" opacity="0.08" />
          <path d={linePath} fill="none" stroke="#10B981" strokeWidth="2" strokeDasharray="4 3" />
          {data.map((d, i) => (
            <circle key={i}
              cx={P.l + slotW * i + slotW / 2} cy={yScale(d.laba)}
              r="3" fill="white" stroke="#10B981" strokeWidth="2" />
          ))}
        </svg>
      </div>
    </div>
  );
}

function LegendDot({ color, label, dashed }) {
  return (
    <div className="flex items-center gap-1.5">
      {dashed ? (
        <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke={color} strokeWidth="2" strokeDasharray="3 2" /></svg>
      ) : (
        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
      )}
      <span className="text-xs font-semibold text-zinc-600">{label}</span>
    </div>
  );
}

// ── Donut Status Invoice ─────────────────────────────────────────────────────
function StatusDonut({ counts, total }) {
  const lunas = counts.lunas, pending = counts.pending, overdue = counts.overdue;
  const safeTotal = total || 1;
  const segs = [
    { v: lunas,   color: '#10B981', label: 'Lunas' },
    { v: pending, color: '#F59E0B', label: 'Pending' },
    { v: overdue, color: '#EF4444', label: 'Overdue' },
  ];

  const r = 60, cx = 90, cy = 90, C = 2 * Math.PI * r;
  let offset = 0;
  const strokes = segs.map((s, i) => {
    const frac = s.v / safeTotal;
    const len = C * frac;
    const el = (
      <circle key={i} cx={cx} cy={cy} r={r} fill="none"
        stroke={s.color} strokeWidth="22"
        strokeDasharray={`${len} ${C - len}`}
        strokeDashoffset={-offset}
        transform={`rotate(-90 ${cx} ${cy})`}
      />
    );
    offset += len;
    return el;
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg viewBox="0 0 180 180" className="w-[180px] h-[180px]">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth="22" />
          {total > 0 && strokes}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-black text-zinc-900">{total}</p>
          <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Invoice</p>
        </div>
      </div>
      <div className="mt-4 w-full space-y-1.5">
        {segs.map(s => (
          <div key={s.label} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
              <span className="text-zinc-600 font-semibold">{s.label}</span>
            </div>
            <span className="font-bold text-zinc-800 tabular-nums">{s.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bar Chart Laba per Bulan ─────────────────────────────────────────────────
function LabaChart({ data }) {
  const W = 560, H = 180, P = { t: 12, r: 12, b: 24, l: 52 };
  const max = Math.max(...data.map(d => Math.abs(d.laba)), 1);
  const slotW = (W - P.l - P.r) / data.length;
  const barW = Math.min(32, slotW * 0.6);
  const mid = P.t + (H - P.t - P.b) / 2;

  const yScale = v => mid - (v / max) * ((H - P.t - P.b) / 2);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[480px] h-[180px]">
        <line x1={P.l} x2={W - P.r} y1={mid} y2={mid} stroke="#E2E8F0" strokeWidth="1" />
        <text x={P.l - 6} y={mid + 3} textAnchor="end" fontSize="9" fill="#94A3B8">0</text>
        <text x={P.l - 6} y={P.t + 8} textAnchor="end" fontSize="9" fill="#94A3B8">{formatJuta(max)}</text>
        {data.map((d, i) => {
          const cx = P.l + slotW * i + slotW / 2;
          const y = yScale(d.laba);
          const h = Math.abs(mid - y);
          const color = d.laba >= 0 ? '#10B981' : '#EF4444';
          return (
            <g key={i}>
              <rect x={cx - barW / 2} y={Math.min(mid, y)} width={barW} height={h}
                fill={color} rx="3" opacity="0.9" />
              <text x={cx} y={H - P.b + 14} textAnchor="middle" fontSize="10" fill="#64748B" fontWeight="600">{d.bulan}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Invoice Table ────────────────────────────────────────────────────────────
const STATUS_BADGE = {
  lunas:   'bg-green-50 text-green-700 border-green-200',
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
};
const STATUS_LABEL = { lunas: 'Lunas', pending: 'Pending', overdue: 'Overdue' };

function InvoiceTable({ rows, onNavigateInvoice }) {
  const [page, setPage] = useState(0);
  const perPage = 5;
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const slice = rows.slice(page * perPage, (page + 1) * perPage);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left">
              <th className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">No. Invoice</th>
              <th className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Klien</th>
              <th className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500 text-right">Nilai</th>
              <th className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Tanggal</th>
              <th className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider text-zinc-500">Status</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {slice.map(r => (
              <tr key={r.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                <td className="px-3 py-3 font-mono text-xs text-zinc-700">{r.no}</td>
                <td className="px-3 py-3 font-semibold text-zinc-800 truncate max-w-[180px]">{r.klien}</td>
                <td className="px-3 py-3 text-right font-bold text-zinc-900 tabular-nums">{formatRp(r.nilai)}</td>
                <td className="px-3 py-3 text-zinc-600">{r.tanggal}</td>
                <td className="px-3 py-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BADGE[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </td>
                <td className="px-3 py-3 text-right">
                  <button
                    onClick={() => onNavigateInvoice?.()}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-0.5 ml-auto"
                  >
                    Lihat <ChevronRight size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 px-1">
          <p className="text-[11px] text-zinc-400">
            Hal {page + 1} / {totalPages} · {rows.length} invoice
          </p>
          <div className="flex gap-1.5">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="px-2.5 py-1 text-xs font-bold rounded-md border border-zinc-200 text-zinc-600 disabled:opacity-40 hover:bg-zinc-50">‹ Prev</button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="px-2.5 py-1 text-xs font-bold rounded-md border border-zinc-200 text-zinc-600 disabled:opacity-40 hover:bg-zinc-50">Next ›</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CSV Export ───────────────────────────────────────────────────────────────
function exportCSV(rows, filename) {
  const header = ['No. Invoice', 'Klien', 'Nilai', 'Tanggal', 'Status'];
  const csv = [
    header.join(','),
    ...rows.map(r => [r.no, `"${(r.klien || '').replace(/"/g, '""')}"`, r.nilai, r.tanggal, r.status].join(','))
  ].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function LaporanKeuangan({ user, onNavigate }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [periode, setPeriode]   = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    getUserInvoices(user.id)
      .then(rows => { if (!cancelled) setInvoices(rows ?? []); })
      .catch(() => { if (!cancelled) setInvoices([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  const periodOptions = useMemo(() => buildPeriodOptions(invoices), [invoices]);
  const data          = useMemo(() => aggregate(invoices, periode), [invoices, periode]);
  const hasData       = invoices.length > 0;

  const handlePrint = () => window.print();

  // ── Empty State ─────────────────────────────────────────────────────────────
  if (!loading && !hasData) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Laporan Keuangan</h1>
          <p className="text-sm text-zinc-500 mt-1">Ringkasan omzet, HPP, laba kotor, dan status invoice percetakan Anda</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <BarChart3 size={32} className="text-blue-400" />
          </div>
          <h2 className="text-lg font-bold text-zinc-800">Belum ada data keuangan</h2>
          <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto">
            Mulai buat invoice atau simpan kalkulasi HPP untuk melihat laporan otomatis di halaman ini.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center mt-6">
            <button onClick={() => onNavigate?.('invoice')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-700 transition-colors">
              <FileText size={14} /> Buat Invoice Sekarang
            </button>
            <button onClick={() => onNavigate?.('calculator')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-200 text-zinc-700 text-sm font-bold rounded-xl hover:bg-zinc-50 transition-colors">
              <Calculator size={14} /> Coba Kalkulasi HPP
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5 print:space-y-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Laporan Keuangan</h1>
          <p className="text-sm text-zinc-500 mt-1">Ringkasan omzet, HPP, laba kotor, dan status invoice percetakan Anda</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap print:hidden">
          <select
            value={periode}
            onChange={e => setPeriode(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {periodOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50">
            <Printer size={13} /> Export PDF
          </button>
          <button onClick={() => exportCSV(data.terbaru, `laporan-${periode}.csv`)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50">
            <FileSpreadsheet size={13} /> Export Excel
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-xl p-5 animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={Wallet}
              label="Omzet"
              value={formatJuta(data.omzet)}
              sub={data.pctOmzet === null ? 'Tidak ada data pembanding'
                : `${data.pctOmzet >= 0 ? '+' : ''}${data.pctOmzet}% vs bulan lalu`}
              subTone={data.pctOmzet === null ? 'neutral' : data.pctOmzet >= 0 ? 'pos' : 'neg'}
              iconBg="bg-blue-50" iconColor="text-blue-600"
            />
            <MetricCard
              icon={Receipt}
              label="Total HPP"
              value={formatJuta(data.hpp)}
              sub={`${data.pctHpp}% dari omzet`}
              subTone="neutral"
              iconBg="bg-zinc-100" iconColor="text-zinc-600"
            />
            <MetricCard
              icon={PiggyBank}
              label="Laba Kotor"
              value={formatJuta(data.labaKotor)}
              sub={`Margin ${data.margin}%`}
              subTone={data.labaKotor >= 0 ? 'pos' : 'neg'}
              iconBg="bg-emerald-50" iconColor="text-emerald-600"
            />
            <MetricCard
              icon={AlertCircle}
              label="Belum Lunas"
              value={formatJuta(data.nilaiBelumLunas)}
              sub={`${data.jumlahBelumLunas} invoice`}
              subTone={data.jumlahBelumLunas > 0 ? 'neg' : 'neutral'}
              iconBg="bg-amber-50" iconColor="text-amber-600"
            />
          </div>

          {/* HPP estimate note */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-[11px] text-blue-700 flex items-start gap-2">
            <span className="mt-0.5">ℹ️</span>
            <span>HPP dihitung dari estimasi default {Math.round(HPP_RATIO_DEFAULT * 100)}% nilai invoice. Hubungkan data Kalkulator HPP untuk angka presisi.</span>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
            <div className="bg-white border border-zinc-200 rounded-xl p-5">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                  <TrendingUp size={14} className="text-blue-600" /> Tren 6 Bulan Terakhir
                </h3>
                <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Omzet · HPP · Laba</span>
              </div>
              <TrenChart data={data.tren} />
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-5">
              <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2 mb-3">
                <PieChart size={14} className="text-blue-600" /> Status Invoice
              </h3>
              <StatusDonut counts={data.statCounts} total={data.totalInv} />
            </div>
          </div>

          {/* Row 3 */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                <TrendingDown size={14} className="text-emerald-600" /> Laba Kotor per Bulan
              </h3>
              <div className="flex items-center gap-3 text-[11px] font-semibold text-zinc-500">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500" /> Untung</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-red-500" /> Rugi</span>
              </div>
            </div>
            <LabaChart data={data.tren} />
          </div>

          {/* Row 4 — Invoice Terbaru */}
          <div className="bg-white border border-zinc-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
                <FileText size={14} className="text-blue-600" /> Invoice Terbaru
              </h3>
              <button onClick={() => onNavigate?.('invoice')}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                Buka Invoice Generator <ChevronRight size={12} />
              </button>
            </div>
            {data.terbaru.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-400">Belum ada invoice pada periode ini.</div>
            ) : (
              <InvoiceTable rows={data.terbaru} onNavigateInvoice={() => onNavigate?.('invoice')} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
