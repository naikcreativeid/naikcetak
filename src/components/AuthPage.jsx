import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package2, Mail, Lock, Eye, EyeOff, User, Scissors, Printer, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { handleAuthError, AUTH_CODE } from '../lib/authErrors';

// ── Google icon SVG ───────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ── Password strength ─────────────────────────────────────────────────────────
function getStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let s = 0;
  if (pw.length >= 8)           s++;
  if (/[A-Z]/.test(pw))         s++;
  if (/[0-9]/.test(pw))         s++;
  if (/[^A-Za-z0-9]/.test(pw))  s++;
  if (s <= 1) return { score: s, label: 'Lemah',  color: 'bg-red-500',    text: 'text-red-500'    };
  if (s === 2) return { score: s, label: 'Sedang', color: 'bg-yellow-500', text: 'text-yellow-600' };
  return             { score: s, label: 'Kuat',   color: 'bg-green-500',  text: 'text-green-600'  };
}

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, error, children }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-zinc-700 mb-1.5">{label}</label>}
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
function Input({ icon: Icon, error, rightEl, ...props }) {
  return (
    <div className="relative">
      {Icon && <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />}
      <input
        {...props}
        className={`w-full py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all
          ${Icon ? 'pl-9' : 'pl-4'} ${rightEl ? 'pr-10' : 'pr-4'}
          ${error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
            : 'border-zinc-200 focus:border-blue-500 focus:ring-blue-100'
          }`}
      />
      {rightEl && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
function OrDivider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-zinc-200" />
      <span className="text-xs text-zinc-400 font-medium">ATAU</span>
      <div className="flex-1 h-px bg-zinc-200" />
    </div>
  );
}

// ── Google button ─────────────────────────────────────────────────────────────
function GoogleBtn({ label, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="w-full flex items-center justify-center gap-2.5 border border-zinc-300 hover:bg-zinc-50 text-zinc-700 py-3 rounded-xl font-medium text-sm transition-all hover:border-zinc-400">
      <GoogleIcon /> {label}
    </button>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
function Spinner() {
  return <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
}

// ── Success overlay ───────────────────────────────────────────────────────────
function SuccessView() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 to-blue-900">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-10 text-center shadow-2xl max-w-sm mx-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Akun berhasil dibuat!</h2>
        <p className="text-zinc-500 text-sm">Selamat datang 🎉<br />Mengarahkan ke dashboard...</p>
      </motion.div>
    </div>
  );
}

// ── Left panel ────────────────────────────────────────────────────────────────
function LeftPanel() {
  return (
    <div className="hidden md:flex flex-col w-[45%] bg-gradient-to-br from-[#1E40AF] to-[#2563EB] px-10 py-12 text-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-14">
        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
          <Package2 size={18} className="text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight">naikcetak</span>
      </div>

      <div className="flex-1">
        <h1 className="text-4xl font-bold leading-tight mb-4">
          Software Percetakan<br />Lebih Cerdas.
        </h1>
        <p className="text-blue-200 text-base leading-relaxed mb-10">
          Hitung biaya cetak, kelola order, dan otomasi operasional percetakan Anda dalam satu platform.
        </p>

        <div className="space-y-3">
          {[
            { Icon: Scissors, title: 'Kalkulator Potong Kertas', desc: 'Hitung efisiensi & estimasi biaya secara otomatis' },
            { Icon: Printer,  title: 'Kalkulator Biaya Cetak',  desc: 'Kertas, mesin, finishing, profit — semua terhitung' },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="bg-white/10 border border-white/20 rounded-xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
                <Icon size={16} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-blue-200 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-blue-300 text-xs mt-8">© 2025 naikcetak · Untuk percetakan Indonesia</p>
    </div>
  );
}

// ── Login form ────────────────────────────────────────────────────────────────
function LoginForm({ onSwitch, onSuccess }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');

    if (!supabase) {
      setError('Konfigurasi Supabase belum lengkap. Hubungi admin.');
      setLoading(false);
      return;
    }

    try {
      console.log('[Login] Mencoba masuk:', email);
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      console.log('[Login] Response:', { session: !!data?.session, error: err?.message, code: err?.code });

      if (err) {
        const mapped = handleAuthError(err);
        if (mapped === AUTH_CODE.NOT_FOUND) {
          setError('Akun tidak ditemukan. Daftar sekarang?');
        } else if (mapped === AUTH_CODE.NEEDS_CONFIRM) {
          setError('Email belum dikonfirmasi. Cek inbox/spam, atau hubungi admin untuk aktivasi manual.');
        } else {
          setError(mapped);
        }
      } else {
        onSuccess?.();
      }
    } catch (err) {
      console.error('[Login] Exception:', err);
      setError(handleAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
  };

  return (
    <motion.div key="masuk" initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }} transition={{ duration: 0.2 }}>
      <h2 className="text-2xl font-bold text-zinc-900 mb-1">Selamat Datang Kembali!</h2>
      <p className="text-zinc-500 text-sm mb-6">Masuk untuk mengakses dashboard Anda.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email">
          <Input type="email" placeholder="email@percetakan.com" icon={Mail}
            value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
        </Field>

        <Field label={
          <span className="flex items-center justify-between">
            Password
            <a href="#/reset-password" className="text-xs text-blue-600 hover:underline font-normal">
              Lupa Password?
            </a>
          </span>
        }>
          <Input type={showPw ? 'text' : 'password'} placeholder="Minimal 8 karakter" icon={Lock}
            value={password} onChange={e => setPassword(e.target.value)} required disabled={loading}
            rightEl={
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />
        </Field>

        {error && (
          <p className="text-red-500 text-xs">
            {error}
            {error.includes('tidak ditemukan') && (
              <button type="button" onClick={() => onSwitch('daftar')} className="underline ml-1">
                Daftar sekarang?
              </button>
            )}
          </p>
        )}

        <button type="submit" disabled={loading || !email || !password}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2">
          {loading ? <><Spinner /> Masuk...</> : 'Masuk'}
        </button>
      </form>

      <OrDivider />
      <GoogleBtn label="Lanjutkan dengan Google" onClick={handleGoogle} />

      <p className="text-center text-sm text-zinc-500 mt-5">
        Belum punya akun?{' '}
        <button onClick={() => onSwitch('daftar')} className="text-blue-600 font-semibold hover:underline">
          Daftar sekarang
        </button>
      </p>
    </motion.div>
  );
}

// ── Register form ─────────────────────────────────────────────────────────────
function RegisterForm({ onSwitch, onSuccess }) {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [showCf,   setShowCf]   = useState(false);
  const [agree,    setAgree]    = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errors,   setErrors]   = useState({});

  const strength = getStrength(password);
  const confirmOk = confirm && confirm === password;

  const validate = () => {
    const e = {};
    if (!name.trim())                                    e.name    = 'Nama lengkap wajib diisi.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))      e.email   = 'Format email tidak valid.';
    if (password.length < 8)                             e.password= 'Password minimal 8 karakter.';
    if (password !== confirm)                            e.confirm = 'Password tidak sama.';
    if (!agree)                                          e.agree   = 'Setujui syarat & ketentuan terlebih dahulu.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setLoading(true);

    if (!supabase) {
      setErrors({ general: 'Konfigurasi Supabase belum lengkap. Hubungi admin.' });
      setLoading(false);
      return;
    }

    try {
      console.log('[Register] Mencoba daftar:', email);
      const { data, error: err } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name } },
      });
      console.log('[Register] Response:', { user: data?.user?.id, session: !!data?.session, error: err?.message });

      if (err) {
        const mapped = handleAuthError(err);
        if (mapped === AUTH_CODE.EMAIL_EXISTS) {
          setErrors({ email: 'Email ini sudah terdaftar. Masuk di sini?' });
        } else {
          setErrors({ general: mapped });
        }
      } else if (data?.user && !data?.session) {
        // Email confirmation ON — user dibuat tapi belum dapat session
        setErrors({ general: 'Akun berhasil dibuat! Cek email Anda untuk konfirmasi sebelum login.' });
      } else {
        onSuccess?.('registered');
      }
    } catch (err) {
      console.error('[Register] Exception:', err);
      setErrors({ general: handleAuthError(err) });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
  };

  return (
    <motion.div key="daftar" initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.2 }}>
      <h2 className="text-2xl font-bold text-zinc-900 mb-1">Buat Akun Gratis</h2>
      <p className="text-zinc-500 text-sm mb-6">Mulai gratis, tidak perlu kartu kredit.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nama Lengkap" error={errors.name}>
          <Input type="text" placeholder="Nama Anda" icon={User}
            value={name} onChange={e => setName(e.target.value)} required disabled={loading}
            error={errors.name} />
        </Field>

        <Field label="Email" error={errors.email && (
          <span>
            {errors.email}
            {errors.email.includes('sudah terdaftar') && (
              <button type="button" onClick={() => onSwitch('masuk')} className="underline ml-1">
                Masuk di sini?
              </button>
            )}
          </span>
        )}>
          <Input type="email" placeholder="email@percetakan.com" icon={Mail}
            value={email} onChange={e => setEmail(e.target.value)} required disabled={loading}
            error={errors.email} />
        </Field>

        <div>
          <Field label="Password" error={errors.password}>
            <Input type={showPw ? 'text' : 'password'} placeholder="Minimal 8 karakter" icon={Lock}
              value={password} onChange={e => setPassword(e.target.value)} required disabled={loading}
              error={errors.password}
              rightEl={
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="text-zinc-400 hover:text-zinc-600 transition-colors">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />
          </Field>
          {password && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[1,2,3,4].map(i => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : 'bg-zinc-200'}`} />
                ))}
              </div>
              <p className={`text-xs mt-1 ${strength.text}`}>Kekuatan: {strength.label}</p>
            </div>
          )}
        </div>

        <Field label="Konfirmasi Password" error={errors.confirm}>
          <Input type={showCf ? 'text' : 'password'} placeholder="Ulangi password" icon={Lock}
            value={confirm} onChange={e => setConfirm(e.target.value)} required disabled={loading}
            error={errors.confirm}
            rightEl={
              <button type="button" onClick={() => setShowCf(v => !v)}
                className="text-zinc-400 hover:text-zinc-600 transition-colors">
                {showCf ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
            style={confirmOk ? { borderColor: '#86efac' } : undefined}
          />
        </Field>

        <div>
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 shrink-0" />
            <span className="text-xs text-zinc-600">
              Saya setuju dengan{' '}
              <a href="#" className="text-blue-600 hover:underline">Syarat & Ketentuan</a> naikcetak
            </span>
          </label>
          {errors.agree && <p className="text-red-500 text-xs mt-1">{errors.agree}</p>}
        </div>

        {errors.general && (
          errors.general.includes('Cek email') ? (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-blue-800 text-xs">
              {errors.general}
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <p className="text-red-600 text-xs">{errors.general}</p>
            </div>
          )
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2">
          {loading ? <><Spinner /> Membuat akun...</> : 'Buat Akun Gratis'}
        </button>
      </form>

      <OrDivider />
      <GoogleBtn label="Daftar dengan Google" onClick={handleGoogle} />

      <p className="text-center text-sm text-zinc-500 mt-5">
        Sudah punya akun?{' '}
        <button onClick={() => onSwitch('masuk')} className="text-blue-600 font-semibold hover:underline">
          Masuk di sini
        </button>
      </p>
    </motion.div>
  );
}

// ── Main AuthPage ─────────────────────────────────────────────────────────────
export default function AuthPage({ defaultTab = 'masuk', onSuccess }) {
  const [tab,     setTab]     = useState(defaultTab);
  const [success, setSuccess] = useState(false);

  useEffect(() => { setTab(defaultTab); }, [defaultTab]);

  const handleSuccess = (type) => {
    if (type === 'registered') {
      setSuccess(true);
      setTimeout(() => onSuccess?.(), 1500);
    } else {
      onSuccess?.();
    }
  };

  if (success) return <SuccessView />;

  return (
    <div className="min-h-screen flex">
      <LeftPanel />

      {/* Right column */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-10 overflow-y-auto">
        {/* Mobile logo */}
        <div className="flex md:hidden items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center">
            <Package2 size={15} className="text-white" />
          </div>
          <span className="font-bold text-zinc-900">naikcetak</span>
        </div>

        <div className="w-full max-w-[420px]">
          {/* Tab switcher */}
          <div className="flex border-b border-zinc-200 mb-7 relative">
            {[['masuk','Masuk'],['daftar','Daftar']].map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex-1 pb-3 text-sm font-semibold transition-colors ${tab === id ? 'text-blue-600' : 'text-zinc-400 hover:text-zinc-600'}`}>
                {label}
              </button>
            ))}
            <motion.div
              className="absolute bottom-0 h-0.5 bg-blue-600 rounded-full"
              animate={{ left: tab === 'masuk' ? '0%' : '50%', width: '50%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>

          <AnimatePresence mode="wait">
            {tab === 'masuk'
              ? <LoginForm   key="masuk"  onSwitch={setTab} onSuccess={() => handleSuccess('login')} />
              : <RegisterForm key="daftar" onSwitch={setTab} onSuccess={handleSuccess} />
            }
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
