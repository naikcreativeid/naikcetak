import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package2, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

function Spinner() {
  return <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
}

// ── Request reset (kirim email) ───────────────────────────────────────────────
function RequestResetForm({ onSent }) {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#/reset-password`,
      });
      if (err) throw err;
      onSent(email);
    } catch (err) {
      setError(err.message?.includes('rate limit')
        ? 'Terlalu banyak permintaan. Tunggu beberapa menit.'
        : 'Koneksi bermasalah. Coba lagi.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-zinc-900 mb-1">Lupa Password?</h2>
      <p className="text-zinc-500 text-sm mb-6">
        Masukkan email Anda dan kami kirimkan link untuk reset password.
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

        {error && <p className="text-red-500 text-xs">{error}</p>}

        <button type="submit" disabled={loading || !email}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2">
          {loading ? <><Spinner /> Mengirim...</> : 'Kirim Link Reset Password'}
        </button>
      </form>
    </>
  );
}

// ── Email sent confirmation ───────────────────────────────────────────────────
function EmailSentView({ email }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Mail size={28} className="text-blue-600" />
      </div>
      <h2 className="text-xl font-bold text-zinc-900 mb-2">Cek Email Anda!</h2>
      <p className="text-zinc-500 text-sm mb-1">Link reset password dikirim ke:</p>
      <p className="font-semibold text-zinc-800 mb-4">{email}</p>
      <div className="bg-blue-50 rounded-xl p-4 text-left text-xs text-blue-700 space-y-1.5">
        <p>1. Buka email dari Supabase / naikcetak</p>
        <p>2. Klik link "Reset Password"</p>
        <p>3. Anda akan diarahkan kembali untuk mengisi password baru</p>
      </div>
      <p className="text-xs text-zinc-400 mt-4">
        Tidak dapat email? Cek folder spam atau tunggu 1-2 menit.
      </p>
    </div>
  );
}

// ── New password form (setelah klik link dari email) ──────────────────────────
function NewPasswordForm({ onDone }) {
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

// ── Success ───────────────────────────────────────────────────────────────────
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
  const [view,      setView]      = useState(hasSession ? 'new-password' : 'request');
  const [sentEmail, setSentEmail] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-zinc-900 rounded-xl flex items-center justify-center">
            <Package2 size={15} className="text-white" />
          </div>
          <span className="font-bold text-zinc-900">naikcetak</span>
        </div>

        {view === 'request'      && <RequestResetForm onSent={(e) => { setSentEmail(e); setView('sent'); }} />}
        {view === 'sent'         && <EmailSentView email={sentEmail} />}
        {view === 'new-password' && <NewPasswordForm onDone={() => setView('success')} />}
        {view === 'success'      && <SuccessView onLogin={onLogin} />}

        {(view === 'request' || view === 'sent') && (
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
