import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase, resetPasswordByEmail } from '../lib/supabase';
import BrandLogo from './BrandLogo';

function Spinner() {
  return <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
}

// ── Step 1: masukkan email ────────────────────────────────────────────────────
function CheckEmailForm({ onNext }) {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(email.trim().toLowerCase());
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-zinc-900 mb-1">Lupa Password?</h2>
      <p className="text-zinc-500 text-sm mb-6">
        Masukkan email Anda lalu atur password baru langsung — tanpa perlu cek email.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email</label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              required placeholder="email@percetakan.com"
              className="w-full pl-9 pr-4 py-3 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
          </div>
        </div>
        <button type="submit" disabled={loading || !email}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2">
          {loading ? <><Spinner /> Loading...</> : 'Lanjut →'}
        </button>
      </form>
    </>
  );
}

// ── Step 2: isi password baru (via RPC — tidak kirim email) ──────────────────
function NewPasswordForm({ email, onDone }) {
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password minimal 8 karakter.'); return; }
    if (password !== confirm)  { setError('Password tidak sama.'); return; }
    setLoading(true); setError('');
    try {
      const result = await resetPasswordByEmail(email, password);
      if (result === 'not_found') {
        setError('Email tidak ditemukan. Pastikan email sudah terdaftar.');
        return;
      }
      onDone();
    } catch (err) {
      setError(err.message || 'Gagal mengubah password. Coba lagi.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-zinc-900 mb-1">Password Baru</h2>
      <p className="text-zinc-500 text-sm mb-1">Mengatur ulang password untuk:</p>
      <p className="font-semibold text-zinc-800 text-sm mb-5">{email}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Password Baru</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              required placeholder="Minimal 8 karakter"
              className="w-full pl-9 pr-10 py-3 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Konfirmasi Password</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input type={showPw ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
              required placeholder="Ulangi password baru"
              className={`w-full pl-9 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition ${
                confirm && confirm === password
                  ? 'border-green-300 focus:border-green-400 focus:ring-green-100'
                  : 'border-zinc-200 focus:border-blue-500 focus:ring-blue-100'
              }`} />
          </div>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2">
          {loading ? <><Spinner /> Menyimpan...</> : 'Simpan Password Baru'}
        </button>
      </form>
    </>
  );
}

// ── Step 2 (session): user datang via link supabase lama ─────────────────────
function SessionPasswordForm({ onDone }) {
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) { setError('Password minimal 8 karakter.'); return; }
    if (password !== confirm)  { setError('Password tidak sama.'); return; }
    setLoading(true); setError('');
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      onDone();
    } catch (err) {
      setError(err.message || 'Gagal mengubah password. Coba lagi.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-zinc-900 mb-1">Buat Password Baru</h2>
      <p className="text-zinc-500 text-sm mb-6">Isi password baru untuk akun Anda.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Password Baru</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              required placeholder="Minimal 8 karakter"
              className="w-full pl-9 pr-10 py-3 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition" />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">Konfirmasi Password</label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input type={showPw ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
              required placeholder="Ulangi password baru"
              className={`w-full pl-9 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition ${
                confirm && confirm === password
                  ? 'border-green-300 focus:border-green-400 focus:ring-green-100'
                  : 'border-zinc-200 focus:border-blue-500 focus:ring-blue-100'
              }`} />
          </div>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2">
          {loading ? <><Spinner /> Menyimpan...</> : 'Simpan Password Baru'}
        </button>
      </form>
    </>
  );
}

// ── Sukses ────────────────────────────────────────────────────────────────────
function SuccessView({ onLogin }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-zinc-900 mb-2">Password Berhasil Diubah!</h2>
      <p className="text-zinc-500 text-sm mb-6">Silakan masuk dengan password baru Anda.</p>
      <button onClick={onLogin}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition">
        Masuk Sekarang
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ResetPasswordPage({ hasSession, onLogin }) {
  const [view,  setView]  = useState(hasSession ? 'session' : 'check-email');
  const [email, setEmail] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">

        <div className="mb-8">
          <BrandLogo
            markClassName="h-8 w-8 shrink-0"
            textClassName="text-base text-zinc-900"
          />
        </div>

        {view === 'check-email' && (
          <CheckEmailForm onNext={(e) => { setEmail(e); setView('new-password'); }} />
        )}
        {view === 'new-password' && (
          <NewPasswordForm email={email} onDone={() => setView('success')} />
        )}
        {view === 'session' && (
          <SessionPasswordForm onDone={() => setView('success')} />
        )}
        {view === 'success' && (
          <SuccessView onLogin={onLogin} />
        )}

        {(view === 'check-email' || view === 'new-password') && (
          <p className="text-center text-sm text-zinc-500 mt-5">
            Ingat password?{' '}
            <button onClick={onLogin} className="text-blue-600 font-semibold hover:underline">
              Masuk di sini
            </button>
          </p>
        )}
      </motion.div>
    </div>
  );
}
