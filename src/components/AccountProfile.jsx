import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  UserCircle2, Mail, Phone, Building2, BadgeCheck,
  CreditCard, ShieldAlert, CheckCircle2, Save, ArrowLeft,
} from 'lucide-react';
import { updateUserProfile } from '../lib/supabase';
import { PLANS } from '../lib/plans';

function normalizePhone(phone) {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  return digits;
}

function Field({ label, required, icon: Icon, children, hint }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
        {label}{required && <span className="ml-1 text-red-400">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />}
        {children}
      </div>
      {hint && <p className="mt-1.5 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

export default function AccountProfile({
  user,
  profile,
  plan = 'starter',
  enforceWhatsapp = false,
  onBack,
  onSaved,
}) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    company_name: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      full_name: profile?.full_name || user?.user_metadata?.full_name || '',
      email: profile?.email || user?.email || '',
      phone_number: profile?.phone_number || '',
      company_name: profile?.company_name || '',
    });
  }, [profile, user]);

  const completion = useMemo(() => {
    const fields = [
      Boolean(form.full_name?.trim()),
      Boolean(form.email?.trim()),
      Boolean(normalizePhone(form.phone_number)),
      Boolean(form.company_name?.trim()),
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [form]);

  const planConfig = PLANS[plan] ?? PLANS.starter;
  const whatsappMissing = !normalizePhone(form.phone_number);

  const setValue = (key, value) => {
    setSaved(false);
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setError('');

    if (!form.full_name.trim()) {
      setError('Nama lengkap wajib diisi.');
      return;
    }

    if (!normalizePhone(form.phone_number)) {
      setError('Nomor WhatsApp wajib diisi agar akun Starter bisa digunakan.');
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile(user.id, {
        full_name: form.full_name.trim(),
        phone_number: normalizePhone(form.phone_number),
        company_name: form.company_name.trim() || null,
      });
      setSaved(true);
      onSaved?.();
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  const initials = (form.full_name || form.email || 'N').slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-700 text-2xl font-black text-white shadow-sm">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-zinc-900">{form.full_name || 'Profil Akun'}</h1>
              <div className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm text-zinc-500">
                <CreditCard size={13} className="text-zinc-400" />
                <span className="font-semibold" style={{ color: planConfig.color }}>{planConfig.name}</span>
                <span>•</span>
                <span>{form.email || user?.email}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {onBack && !enforceWhatsapp && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
              >
                <ArrowLeft size={14} /> Kembali
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
            >
              <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>
      </motion.div>

      {enforceWhatsapp && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-bold text-amber-800">Lengkapi WhatsApp sebelum lanjut memakai paket Starter</p>
              <p className="mt-1 text-sm text-amber-700">
                Kami menggunakan nomor WhatsApp untuk onboarding, follow up, dan membantu Anda lebih cepat saat ingin mencoba alur naikcetak atau upgrade ke Pro.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <button type="button" className="flex w-full items-center gap-3 rounded-2xl bg-zinc-900 px-4 py-3 text-left text-white">
              <UserCircle2 size={18} />
              <div>
                <p className="text-sm font-bold">Profil Akun</p>
                <p className="text-[11px] text-white/65">Data utama pengguna naikcetak</p>
              </div>
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="flex items-center justify-between text-sm font-semibold text-zinc-700">
              <span>Kelengkapan</span>
              <span>{completion}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-zinc-100">
              <div className="h-2 rounded-full bg-zinc-900 transition-all" style={{ width: `${completion}%` }} />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500">
              Lengkapi profil untuk memudahkan follow up, aktivasi fitur, dan rekomendasi penggunaan yang lebih tepat.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <p className="text-sm font-bold text-zinc-900">Status Langganan</p>
            <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">Current Plan</p>
              <p className="mt-1 text-xl font-black" style={{ color: planConfig.color }}>{planConfig.name}</p>
              <p className="mt-1 text-xs text-zinc-500">
                {plan === 'starter'
                  ? 'Isi WhatsApp agar admin bisa bantu onboarding dan follow up upgrade.'
                  : 'Profil Anda siap dipakai untuk fitur langganan aktif.'}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-lg font-bold text-zinc-900">Informasi Akun</p>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Nama Lengkap" required icon={UserCircle2}>
                <input
                  value={form.full_name}
                  onChange={(e) => setValue('full_name', e.target.value)}
                  className="input-field pl-10"
                  placeholder="Nama lengkap Anda"
                />
              </Field>

              <Field label="Email Address" icon={Mail}>
                <input value={form.email} disabled className="input-field pl-10 bg-zinc-50 text-zinc-500" />
              </Field>

              <Field
                label="Nomor WhatsApp"
                required
                icon={Phone}
                hint="Gunakan format 08xxx atau 62xxx. Nomor ini dipakai admin untuk follow up akun Starter."
              >
                <input
                  value={form.phone_number}
                  onChange={(e) => setValue('phone_number', e.target.value)}
                  className={`input-field pl-10 ${whatsappMissing ? 'border-amber-300 focus:border-amber-400 focus:ring-amber-100' : ''}`}
                  placeholder="08xxxxxxxxxx"
                />
              </Field>

              <Field label="Nama Usaha / Percetakan" icon={Building2}>
                <input
                  value={form.company_name}
                  onChange={(e) => setValue('company_name', e.target.value)}
                  className="input-field pl-10"
                  placeholder="Contoh: Cetak Jaya Bandung"
                />
              </Field>
            </div>

            {error && <p className="mt-4 text-sm font-medium text-red-500">{error}</p>}
            {saved && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                <CheckCircle2 size={14} /> Profil berhasil diperbarui
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-lg font-bold text-zinc-900">Kenapa WhatsApp penting?</p>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                {
                  title: 'Onboarding Lebih Cepat',
                  text: 'Admin bisa membantu aktivasi dan menjelaskan fitur yang paling relevan untuk percetakan Anda.',
                },
                {
                  title: 'Follow Up User Starter',
                  text: 'Tim Anda bisa menghubungi user Starter secara manual dengan template follow up yang sudah disiapkan.',
                },
                {
                  title: 'Dorong Konversi ke Pro',
                  text: 'Kontak aktif membuat follow up upgrade lebih terarah dan peluang upgrade menjadi lebih tinggi.',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-sm font-bold text-zinc-800">{item.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">{item.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
