import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator, FileText, Brain, Clock, Package2,
  Timer, Package, Scissors, Printer, Database, Layers,
  Mail, RefreshCw, Trash2, Cloud, CloudOff, History,
  TrendingUp, ChevronRight,
} from 'lucide-react';
import { getUserActivity, getUserProjects, deleteActivity, isConfigured } from '../lib/supabase';
import { loadRiwayatPotong, loadRiwayatCetak, formatRp } from '../lib/masterData';

// ── Constants ─────────────────────────────────────────────────────────────────
const HARI  = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

function greeting(h) {
  if (h < 11) return 'Selamat Pagi';
  if (h < 15) return 'Selamat Siang';
  if (h < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

function firstName(user) {
  if (!user) return null;
  const meta = user.user_metadata?.full_name || user.user_metadata?.name;
  if (meta) return meta.split(' ')[0];
  return user.email?.split('@')[0] ?? null;
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 2)  return 'baru saja';
  if (m < 60) return `${m} menit lalu`;
  if (h < 24) return `${h} jam lalu`;
  if (d <  7) return `${d} hari lalu`;
  const dt = new Date(dateStr);
  return `${dt.getDate()} ${BULAN[dt.getMonth()]}`;
}

// ── Feature definitions ───────────────────────────────────────────────────────
const FEATURED = [
  {
    id: 'calculator', Icon: Calculator, title: 'Kalkulator HPP',
    desc: 'Hitung harga pokok produksi kemasan box secara real-time dengan imposition otomatis',
    iconBg: 'bg-zinc-900', accent: 'text-zinc-700',
  },
  {
    id: 'invoice', Icon: FileText, title: 'Invoice Generator',
    desc: 'Buat invoice profesional dengan 4 template desain siap cetak A4',
    iconBg: 'bg-blue-600', accent: 'text-blue-600',
  },
  {
    id: 'brief', Icon: Brain, title: 'AI Brief Analyzer',
    desc: 'Analisis brief klien & generate quotation + WA otomatis menggunakan Groq AI',
    iconBg: 'bg-violet-600', accent: 'text-violet-600',
  },
];

const UTILITY_GROUPS = [
  {
    label: 'PRODUKSI',
    color: 'emerald',
    items: [
      { id: 'potong',   Icon: Scissors, title: 'Kalkulator Potong Kertas', tag: null, iconBg: 'bg-pink-500'    },
      { id: 'cetakan',  Icon: Printer,  title: 'Kalkulator Biaya Cetak',   tag: null, iconBg: 'bg-emerald-600' },
    ],
  },
  {
    label: 'OPERASIONAL',
    color: 'blue',
    items: [
      { id: 'quotation', Icon: Timer,   title: 'Quotation',        tag: null, iconBg: 'bg-orange-500' },
      { id: 'tracking',  Icon: Package, title: 'Tracking Order',   tag: null, iconBg: 'bg-teal-500'   },
      { id: 'email',     Icon: Mail,    title: 'Email & Proposal', tag: null, iconBg: 'bg-indigo-500' },
    ],
  },
  {
    label: 'DATA REFERENSI',
    color: 'zinc',
    items: [
      { id: 'masterKertas',    Icon: Database, title: 'Database Kertas',   tag: null, iconBg: 'bg-zinc-500' },
      { id: 'masterFinishing', Icon: Layers,   title: 'Layanan Finishing', tag: null, iconBg: 'bg-zinc-500' },
    ],
  },
];

// ── Riwayat tipe config ───────────────────────────────────────────────────────
const TIPE_META = {
  potong_kertas:  { label: 'Kalkulator Potong Kertas', Icon: Scissors,   color: 'text-pink-600',    bg: 'bg-pink-50',    page: 'potong'    },
  hitung_cetakan: { label: 'Kalkulator Biaya Cetak',   Icon: Printer,    color: 'text-emerald-600', bg: 'bg-emerald-50', page: 'cetakan'   },
  hpp_calculator: { label: 'Kalkulator HPP',           Icon: Calculator, color: 'text-zinc-700',    bg: 'bg-zinc-100',   page: 'calculator'},
  invoice:        { label: 'Invoice',                  Icon: FileText,   color: 'text-blue-600',    bg: 'bg-blue-50',    page: 'invoice'   },
};

function ringkasanText(tipe, r) {
  if (!r) return '';
  if (tipe === 'potong_kertas')
    return [r.jumlah && `${Number(r.jumlah).toLocaleString('id-ID')} pcs`,
            r.potonganPerLembar && `${r.potonganPerLembar} pot/lbr`,
            r.totalHarga && formatRp(r.totalHarga)].filter(Boolean).join(' · ');
  if (tipe === 'hitung_cetakan')
    return [r.jumlah && `${Number(r.jumlah).toLocaleString('id-ID')} pcs`,
            r.total && formatRp(r.total)].filter(Boolean).join(' · ');
  if (tipe === 'hpp_calculator')
    return [r.qty && `${Number(r.qty).toLocaleString('id-ID')} pcs`,
            r.hpp && `HPP ${formatRp(r.hpp)}`].filter(Boolean).join(' · ');
  return '';
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function Skeleton({ className }) {
  return <div className={`bg-zinc-100 rounded animate-pulse ${className}`} />;
}

// ── Riwayat Section ───────────────────────────────────────────────────────────
function RiwayatSection({ user, onNavigate }) {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [cloudOk, setCloudOk]   = useState(null); // null=unknown, true=ok, false=error
  const [deleteId, setDeleteId] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (user && isConfigured) {
        const [activities, projects] = await Promise.all([
          getUserActivity(user.id, 15),
          getUserProjects(user.id),
        ]);
        const projItems = projects.slice(0, 5).map(p => ({
          id: p.id,
          tipe: 'hpp_calculator',
          judul: p.product_name || 'Tanpa nama',
          ringkasan: { qty: p.target_qty, hpp: p.hpp, total: p.total_cost },
          created_at: p.created_at,
          _source: 'projects',
        }));
        const merged = [...activities.map(a => ({ ...a, _source: 'activity_log' })), ...projItems]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 15);
        setItems(merged);
        setCloudOk(true);
      } else {
        // Fallback: localStorage
        const potong = loadRiwayatPotong().slice(0, 8).map(r => ({
          id: r.id,
          tipe: 'potong_kertas',
          judul: r.namaCustomer || 'Tanpa nama',
          ringkasan: r.ringkasan,
          created_at: r.tanggal,
          _source: 'local',
        }));
        const cetak = loadRiwayatCetak().slice(0, 8).map(r => ({
          id: r.id,
          tipe: 'hitung_cetakan',
          judul: r.namaCustomer || 'Tanpa nama',
          ringkasan: r.ringkasan,
          created_at: r.tanggal,
          _source: 'local',
        }));
        const merged = [...potong, ...cetak]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 15);
        setItems(merged);
        setCloudOk(false);
      }
    } catch {
      setCloudOk(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (item) => {
    try {
      if (item._source === 'activity_log') await deleteActivity(item.id);
      setItems(prev => prev.filter(x => x.id !== item.id));
    } catch { /* silent */ }
    setDeleteId(null);
  };

  return (
    <div className="card shadow-sm">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <History size={14} className="text-zinc-400" />
          <span className="section-title">Riwayat Terbaru</span>
          {cloudOk === true && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <Cloud size={9} /> Cloud
            </span>
          )}
          {cloudOk === false && !user && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
              <CloudOff size={9} /> Lokal
            </span>
          )}
        </div>
        <button onClick={fetchData} disabled={loading}
          className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Cloud upsell for guests */}
      {!user && (
        <div className="px-5 pt-4 pb-1">
          <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700">
            <Cloud size={13} className="shrink-0 text-blue-500" />
            <span>
              <strong>Masuk untuk sync cloud.</strong> Riwayat saat ini hanya tersimpan di browser ini dan bisa hilang.
            </span>
          </div>
        </div>
      )}

      <div className="divide-y divide-zinc-50">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-2.5 w-48" />
              </div>
              <Skeleton className="h-2.5 w-16 shrink-0" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <History size={20} className="text-zinc-300" />
            </div>
            <p className="text-sm font-bold text-zinc-400">Belum ada riwayat</p>
            <p className="text-xs text-zinc-300 mt-1">Mulai hitung dan simpan — riwayat akan tampil di sini</p>
          </div>
        ) : (
          <>
            <AnimatePresence>
              {items.map((item) => {
                const meta = TIPE_META[item.tipe] ?? TIPE_META.hpp_calculator;
                const IconComp = meta.Icon;
                return (
                  <motion.div key={item.id} layout
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="group">
                    <div className="px-5 py-3.5 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
                        <IconComp size={14} className={meta.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-zinc-900 truncate">{item.judul || '—'}</p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${meta.bg} ${meta.color} shrink-0`}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5 truncate">
                          {ringkasanText(item.tipe, item.ringkasan)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-zinc-400 hidden sm:block">
                          {timeAgo(item.created_at)}
                        </span>
                        <button
                          onClick={() => onNavigate?.(meta.page)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700"
                          title="Buka fitur">
                          <ChevronRight size={12} />
                        </button>
                        {item._source !== 'local' && (
                          <button
                            onClick={() => setDeleteId(item.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-400">
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline delete confirm */}
                    <AnimatePresence>
                      {deleteId === item.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="mx-5 mb-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                            <p className="text-xs text-red-700 font-semibold">Hapus entri ini dari riwayat?</p>
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => setDeleteId(null)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-white border border-zinc-200 font-bold text-zinc-600">Batal</button>
                              <button onClick={() => handleDelete(item)}
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

            <div className="px-5 py-3 text-center">
              <p className="text-[11px] text-zinc-400">
                {cloudOk ? `${items.length} entri tersimpan di cloud` : `${items.length} entri tersimpan lokal`}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ user, onNavigate }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const name    = firstName(user);
  const salam   = greeting(now.getHours());
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Hero Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="card p-8 flex items-center justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400 mb-2">{salam}</p>
            <h1 className="text-3xl font-black text-zinc-900 tracking-tight leading-none truncate">
              {name ? `Halo, ${name}!` : 'Selamat Datang!'}
            </h1>
            <p className="text-sm text-zinc-400 mt-3 leading-relaxed max-w-sm">
              {user
                ? 'Riwayat kalkulasi tersimpan di cloud dan bisa diakses dari perangkat manapun.'
                : 'Masuk untuk menyimpan riwayat ke cloud dan sinkronisasi lintas perangkat.'}
            </p>
          </div>
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center shrink-0">
            <Package2 size={28} className="text-white" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }} className="card p-6">
          <p className="section-title mb-4">Hari Ini</p>
          <div className="text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">{HARI[now.getDay()]}</p>
            <p className="text-[64px] font-black text-zinc-900 leading-none my-0.5 tabular-nums">{now.getDate()}</p>
            <p className="text-sm font-bold text-zinc-500">{BULAN[now.getMonth()]} {now.getFullYear()}</p>
            <div className="mt-3 flex items-center justify-center gap-2 bg-zinc-50 border border-zinc-100 rounded-xl py-2.5 px-4">
              <Clock size={11} className="text-zinc-400" />
              <span className="font-mono font-bold text-zinc-700 text-sm tracking-wider tabular-nums">{timeStr}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Quick Access — Featured ────────────────────────────────────────── */}
      <div>
        <p className="section-title mb-4">Akses Cepat Fitur</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {FEATURED.map((f, i) => (
            <motion.button key={f.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.06 }}
              onClick={() => onNavigate(f.id)}
              className="card p-6 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all group cursor-pointer">
              <div className={`w-10 h-10 ${f.iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <f.Icon size={18} className="text-white" />
              </div>
              <h3 className="font-bold text-zinc-900 text-sm mb-1.5">{f.title}</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">{f.desc}</p>
              <p className={`mt-4 text-[10px] font-black uppercase tracking-widest ${f.accent} flex items-center gap-1`}>
                Buka Fitur →
              </p>
            </motion.button>
          ))}
        </div>

        {/* Utility groups */}
        <div className="space-y-3">
          {UTILITY_GROUPS.map((group, gi) => (
            <motion.div key={group.label}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + gi * 0.04 }}>
              <p className="section-title mb-2.5">{group.label}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {group.items.map(item => (
                  <button key={item.id} onClick={() => onNavigate(item.id)}
                    className="card p-4 text-left hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer flex items-center gap-3">
                    <div className={`w-8 h-8 ${item.iconBg} rounded-lg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                      <item.Icon size={14} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-800 truncate">{item.title}</p>
                      {item.tag && (
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                          {item.tag}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Riwayat ───────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <RiwayatSection user={user} onNavigate={onNavigate} />
      </motion.div>
    </div>
  );
}
