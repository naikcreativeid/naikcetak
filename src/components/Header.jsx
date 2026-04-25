import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package2, LogOut, User, Calculator, FileText, Brain,
  LayoutDashboard, Mail, Package, Timer, Menu, X, Zap,
  Scissors, Printer, Database, Layers, Cpu, ShieldCheck, CreditCard, Store,
  BarChart3, Truck, ClipboardList,
} from 'lucide-react';
import { logout } from '../lib/supabase';
import { PLANS } from '../lib/plans';

const NAV_GROUPS = [
  {
    label: 'MAIN MENU',
    items: [
      { id: 'dashboard', Icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'OPERASIONAL',
    items: [
      { id: 'calculator',    Icon: Calculator, label: 'Kalkulator HPP'  },
      { id: 'laporan',       Icon: BarChart3,  label: 'Laporan Keuangan', badge: 'Pro', badgeColor: 'blue' },
      { id: 'invoice',       Icon: FileText,   label: 'Invoice'         },
      { id: 'suratJalan',    Icon: Truck,      label: 'Surat Jalan',      badge: 'Pro', badgeColor: 'blue' },
      { id: 'poSupplier',    Icon: ClipboardList, label: 'PO Supplier',   badge: 'Pro', badgeColor: 'blue' },
      { id: 'quotation',     Icon: Timer,      label: 'Quotation'       },
      { id: 'tracking',      Icon: Package,    label: 'Tracking Order'  },
      { id: 'tokoSaya',      Icon: Store,      label: 'Toko Saya'       },
    ],
  },
  {
    label: 'PRODUKSI',
    items: [
      { id: 'potong',   Icon: Scissors, label: 'Kalkulator Potong Kertas' },
      { id: 'cetakan',  Icon: Printer,  label: 'Kalkulator Biaya Cetak'   },
    ],
  },
  {
    label: 'DATA REFERENSI',
    items: [
      { id: 'masterKertas',    Icon: Database, label: 'Database Kertas'   },
      { id: 'masterFinishing', Icon: Layers,   label: 'Layanan Finishing' },
      { id: 'masterMesin',     Icon: Cpu,      label: 'Pengaturan Mesin'  },
    ],
  },
  {
    label: 'ASISTEN AI',
    items: [
      { id: 'brief', Icon: Brain, label: 'AI Brief Analyzer' },
      { id: 'email', Icon: Mail,  label: 'Email & Proposal'  },
    ],
  },
];

function NavItems({ activePage, onNav, isAdmin }) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
      {NAV_GROUPS.map(group => (
        <div key={group.label}>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2 mb-1.5">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {group.items.map(({ id, Icon, label, badge, badgeColor }) => (
              <button
                key={id}
                onClick={() => onNav(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all text-left ${
                  activePage === id
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <Icon size={15} className="shrink-0" />
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                    badgeColor === 'blue'    ? 'bg-blue-100 text-blue-700' :
                    badgeColor === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-zinc-100 text-zinc-500'
                  }`}>{badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
      {!isAdmin && (
        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2 mb-1.5">AKUN</p>
          <button onClick={() => onNav('subscription')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all text-left ${
              activePage === 'subscription'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}>
            <CreditCard size={15} className="shrink-0" /> Status Langganan
          </button>
        </div>
      )}
      {isAdmin && (
        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2 mb-1.5">ADMIN</p>
          <button onClick={() => onNav('adminUpgrades')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all text-left ${
              activePage === 'adminUpgrades'
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}>
            <ShieldCheck size={15} className="shrink-0" /> Admin Panel
          </button>
        </div>
      )}
    </nav>
  );
}

function UserSection({ user, onLoginClick, onProfileClick }) {
  const handleLogout = async () => {
    try { await logout(); } catch (e) { console.error(e); }
  };

  return (
    <div className="px-3 py-4 border-t border-zinc-100 space-y-1">
      <div className="flex items-center gap-1.5 px-3 py-1.5 mb-1">
        <Zap size={10} className="text-emerald-500 shrink-0" />
        <span className="text-[10px] font-semibold text-emerald-600">Groq AI Aktif</span>
      </div>
      {user ? (
        <>
          <button
            onClick={onProfileClick}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 transition-colors text-left"
          >
            <User size={12} className="text-zinc-400 shrink-0" />
            <span className="text-xs text-zinc-600 truncate">{user.email}</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={12} /> Keluar
          </button>
        </>
      ) : (
        <button
          onClick={onLoginClick}
          className="w-full bg-zinc-900 hover:bg-zinc-700 text-white py-2.5 rounded-lg text-sm font-bold transition-colors"
        >
          Masuk / Daftar
        </button>
      )}
    </div>
  );
}

function PlanBadge({ plan = 'starter', onUpgradeClick }) {
  const cfg = PLANS[plan] ?? PLANS.starter;
  if (plan === 'starter') {
    return (
      <button onClick={onUpgradeClick}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 hover:from-blue-100 hover:to-blue-200 transition-all">
        <span className="text-xs font-bold text-blue-700">Upgrade ke Pro</span>
        <Zap size={11} className="text-blue-500" />
      </button>
    );
  }
  return (
    <div className="flex items-center justify-center px-3 py-1.5 rounded-lg"
      style={{ background: cfg.color + '18', border: `1px solid ${cfg.color}40` }}>
      <span className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.badge}</span>
    </div>
  );
}

export default function Header({ user, onLoginClick, activePage, onPageChange, plan, onUpgradeClick, isAdmin }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleNav = (id) => {
    onPageChange?.(id);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* ── Desktop sidebar (md+) ─────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-56 bg-white border-r border-zinc-200 z-40">
        {/* Logo */}
        <div className="px-5 h-14 flex items-center border-b border-zinc-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center shrink-0">
              <Package2 size={15} className="text-white" />
            </div>
            <span className="font-bold text-zinc-900 text-base tracking-tight">naikcetak</span>
          </div>
        </div>

        <NavItems activePage={activePage} onNav={handleNav} isAdmin={isAdmin} />
        {!isAdmin && (
          <div className="px-3 pb-2">
            <PlanBadge plan={plan} onUpgradeClick={onUpgradeClick} />
          </div>
        )}
        <UserSection user={user} onLoginClick={onLoginClick} onProfileClick={() => handleNav('profil')} />
      </aside>

      {/* ── Mobile top bar ────────────────────────────────────────────────── */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-zinc-200 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-zinc-900 rounded-lg flex items-center justify-center">
            <Package2 size={13} className="text-white" />
          </div>
          <span className="font-bold text-zinc-900 text-sm tracking-tight">naikcetak</span>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={() => handleNav('profil')}
              className="text-[11px] text-zinc-400 truncate max-w-[110px] hover:text-zinc-700 transition-colors"
            >
              {user.email}
            </button>
          )}
          <button
            onClick={() => setDrawerOpen(v => !v)}
            className="p-2 rounded-lg hover:bg-zinc-100 transition-colors text-zinc-700"
          >
            {drawerOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="md:hidden fixed inset-0 bg-black/40 z-50"
            />
            <motion.aside
              key="drawer"
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="md:hidden fixed inset-y-0 left-0 w-64 bg-white z-50 shadow-2xl flex flex-col"
            >
              {/* Drawer logo */}
              <div className="px-5 h-14 flex items-center border-b border-zinc-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center shrink-0">
                    <Package2 size={15} className="text-white" />
                  </div>
                  <span className="font-bold text-zinc-900 text-base tracking-tight">naikcetak</span>
                </div>
              </div>

              <NavItems activePage={activePage} onNav={handleNav} isAdmin={isAdmin} />
              {!isAdmin && (
                <div className="px-3 pb-2">
                  <PlanBadge plan={plan} onUpgradeClick={() => { setDrawerOpen(false); onUpgradeClick?.(); }} />
                </div>
              )}
              <UserSection user={user} onLoginClick={onLoginClick} onProfileClick={() => handleNav('profil')} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
