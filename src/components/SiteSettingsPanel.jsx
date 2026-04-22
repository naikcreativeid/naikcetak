import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, Loader2, RefreshCw, Save, Search, Share2, Globe2, ShieldOff, MousePointerClick } from 'lucide-react';
import {
  DEFAULT_SITE_SETTINGS,
  getSiteSettings,
  saveSiteSettings,
  uploadSiteAsset,
} from '../lib/supabase';

function UploadCard({ label, hint, value, onUpload, loading, accept = 'image/*' }) {
  return (
    <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/70 p-4 text-center transition hover:border-blue-300 hover:bg-blue-50">
      {value ? (
        <img src={value} alt={label} className="mx-auto h-28 w-full rounded-xl object-contain bg-white" />
      ) : (
        <div className="flex h-28 flex-col items-center justify-center text-zinc-400">
          {loading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
          <p className="mt-2 text-sm font-semibold text-zinc-700">{loading ? 'Mengupload...' : label}</p>
          <p className="mt-1 text-xs text-zinc-400">{hint}</p>
        </div>
      )}
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}

function PreviewCard({ title, url, metaTitle, description, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
        <Icon size={13} /> {title}
      </div>
      <div className="space-y-1">
        <p className="text-base font-bold text-blue-700 line-clamp-2">{metaTitle || DEFAULT_SITE_SETTINGS.site_title}</p>
        <p className="text-xs text-emerald-600">{url}</p>
        <p className="text-sm leading-relaxed text-zinc-500 line-clamp-3">
          {description || DEFAULT_SITE_SETTINGS.meta_description}
        </p>
      </div>
    </div>
  );
}

export default function SiteSettingsPanel() {
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setSettings(await getSiteSettings());
      setMessage('');
    } catch (err) {
      setMessage(err.message || 'Gagal memuat pengaturan SEO.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setValue = (key, value) => {
    setMessage('');
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleUpload = async (key, kind, file) => {
    if (!file) return;
    setUploading(key);
    setMessage('');
    try {
      const url = await uploadSiteAsset(file, kind);
      setSettings((prev) => ({ ...prev, [key]: url }));
    } catch (err) {
      setMessage(err.message || 'Upload aset gagal.');
    } finally {
      setUploading('');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const saved = await saveSiteSettings(settings);
      setSettings(saved);
      setMessage('Pengaturan SEO berhasil disimpan.');
    } catch (err) {
      setMessage(err.message || 'Gagal menyimpan pengaturan SEO.');
    } finally {
      setSaving(false);
    }
  };

  const canonicalUrl = 'https://naikcetak.com';
  const previewData = useMemo(() => ({
    title: settings.site_title || DEFAULT_SITE_SETTINGS.site_title,
    description: settings.meta_description || DEFAULT_SITE_SETTINGS.meta_description,
    image: settings.meta_image_url || '',
  }), [settings]);

  if (loading) {
    return (
      <div className="card p-12 flex items-center justify-center gap-3 text-zinc-400">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Memuat pengaturan SEO...</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-lg font-bold text-zinc-900">Pengaturan SEO Metadata</h3>
          <p className="mt-1 text-sm text-zinc-500">Atur title, meta description, meta image, favicon, logo loading, dan perilaku SEO untuk website naikcetak.com.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="btn-ghost flex items-center gap-2 text-sm">
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-zinc-700 disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">Judul Tag</label>
                <input
                  className="input-field"
                  value={settings.site_title || ''}
                  onChange={(e) => setValue('site_title', e.target.value)}
                  placeholder="naikcetak — ERP & HPP untuk percetakan"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">Meta Description</label>
                <textarea
                  className="input-field min-h-36 resize-none"
                  value={settings.meta_description || ''}
                  onChange={(e) => setValue('meta_description', e.target.value)}
                  placeholder="Tuliskan deskripsi yang menarik untuk hasil pencarian Google dan preview media sosial."
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <UploadCard
                  label="Upload Meta Gambar"
                  hint=".jpg, .jpeg, .png, .webp"
                  value={previewData.image}
                  loading={uploading === 'meta_image_url'}
                  onUpload={(file) => handleUpload('meta_image_url', 'meta-image', file)}
                />
                <UploadCard
                  label="Upload Favicon"
                  hint=".png, .ico, .svg"
                  value={settings.favicon_url}
                  loading={uploading === 'favicon_url'}
                  onUpload={(file) => handleUpload('favicon_url', 'favicon', file)}
                  accept=".png,.ico,.svg,image/*"
                />
                <UploadCard
                  label="Upload Loading Logo"
                  hint=".png, .svg, .webp"
                  value={settings.loading_logo_url}
                  loading={uploading === 'loading_logo_url'}
                  onUpload={(file) => handleUpload('loading_logo_url', 'loading-logo', file)}
                  accept=".png,.svg,.webp,image/*"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-zinc-900">Kontrol SEO & Akses</p>
            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <div className="pr-4">
                  <p className="text-sm font-semibold text-zinc-800">Matikan Search Engine Crawler</p>
                  <p className="mt-1 text-xs text-zinc-500">Pasang meta robots `noindex, nofollow` untuk mencegah website diindeks.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setValue('disable_crawler', !settings.disable_crawler)}
                  className={`h-6 w-11 rounded-full px-0.5 transition ${settings.disable_crawler ? 'bg-zinc-900' : 'bg-zinc-300'}`}
                >
                  <span className={`block h-5 w-5 rounded-full bg-white shadow transition ${settings.disable_crawler ? 'translate-x-5' : ''}`} />
                </button>
              </label>

              <label className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <div className="pr-4">
                  <p className="text-sm font-semibold text-zinc-800">Matikan Fungsi Klik Kanan</p>
                  <p className="mt-1 text-xs text-zinc-500">Blok menu klik kanan di website untuk pengunjung umum.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setValue('disable_right_click', !settings.disable_right_click)}
                  className={`h-6 w-11 rounded-full px-0.5 transition ${settings.disable_right_click ? 'bg-zinc-900' : 'bg-zinc-300'}`}
                >
                  <span className={`block h-5 w-5 rounded-full bg-white shadow transition ${settings.disable_right_click ? 'translate-x-5' : ''}`} />
                </button>
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <PreviewCard title="Pratinjau di Google Search" url={canonicalUrl} metaTitle={previewData.title} description={previewData.description} icon={Search} />
          <PreviewCard title="Pratinjau di Sosial Media" url={canonicalUrl} metaTitle={previewData.title} description={previewData.description} icon={Share2} />

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Globe2 size={16} className="text-zinc-400" />
              <p className="text-sm font-bold text-zinc-900">Status Website</p>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">Crawler</p>
                <p className="mt-1 text-sm font-semibold text-zinc-800">
                  {settings.disable_crawler ? 'Nonaktif — search engine akan diblok' : 'Aktif — website boleh diindeks'}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">Klik Kanan</p>
                <p className="mt-1 text-sm font-semibold text-zinc-800">
                  {settings.disable_right_click ? 'Diblok untuk pengunjung' : 'Normal — pengunjung bisa klik kanan'}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">Aset Aktif</p>
                <p className="mt-1 text-sm font-semibold text-zinc-800">
                  {settings.meta_image_url ? 'Meta image siap' : 'Meta image belum diisi'} • {settings.favicon_url ? 'Favicon siap' : 'Favicon belum diisi'}
                </p>
              </div>
            </div>

            {message && (
              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {message}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <ShieldOff size={18} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-bold text-amber-800">Catatan penting</p>
                <p className="mt-1 text-sm leading-relaxed text-amber-700">
                  Karena app ini berbasis SPA, metadata akan diperbarui saat halaman dimuat di browser. Untuk hasil SEO dan preview sosial yang paling kuat,
                  pastikan deployment Anda memakai HTML utama yang mengambil setting ini atau tambahkan prerender di tahap berikutnya.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
