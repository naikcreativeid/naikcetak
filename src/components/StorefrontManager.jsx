import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle, Building2, Check, CheckCircle2, ChevronRight, Copy, ExternalLink,
  GripVertical, ImagePlus, Loader2, MessageCircle, Package2, Plus, Store,
  Upload, X,
} from 'lucide-react';
import {
  createStoreProduct,
  deleteStoreProduct,
  generateStoreSlugCandidate,
  generateUniqueStoreSlug,
  getStoreDashboardData,
  getStoreUrl,
  reorderStoreProducts,
  saveStoreProfile,
  updateStoreOrder,
  updateStoreProduct,
  uploadStoreAsset,
} from '../lib/supabase';

const ORDER_STATUSES = ['pending', 'reviewed', 'accepted', 'rejected', 'in_progress', 'done'];
const FILTERS = [
  { id: 'all', label: 'Semua' },
  { id: 'pending', label: 'Pending' },
  { id: 'accepted', label: 'Accepted' },
  { id: 'done', label: 'Done' },
];

const EMPTY_PRODUCT = {
  name: '',
  category: '',
  description: '',
  min_price: '',
  max_price: '',
  min_order: 1,
  unit: 'pcs',
  lead_time_days: 3,
  is_available: true,
};

function formatMoney(value) {
  if (!value) return 'Belum diatur';
  return `Rp ${Number(value).toLocaleString('id-ID')}`;
}

function orderStatusLabel(status) {
  const labels = {
    pending: 'Pending',
    reviewed: 'Reviewed',
    accepted: 'Accepted',
    rejected: 'Rejected',
    in_progress: 'In Progress',
    done: 'Done',
  };
  return labels[status] || status;
}

function ProductModal({ initialData, onClose, onSubmit, loading }) {
  const [form, setForm] = useState(initialData || EMPTY_PRODUCT);

  useEffect(() => {
    setForm(initialData || EMPTY_PRODUCT);
  }, [initialData]);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }} className="w-full max-w-2xl rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">{initialData?.id ? 'Edit Produk' : 'Tambah Produk'}</p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-zinc-900">{initialData?.id ? 'Perbarui layanan toko' : 'Tambahkan layanan publik baru'}</h3>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="label">Nama Produk*</span>
            <input className="input-field" value={form.name} onChange={(e) => update('name', e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Kategori</span>
            <input className="input-field" value={form.category} onChange={(e) => update('category', e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Satuan</span>
            <input className="input-field" value={form.unit} onChange={(e) => update('unit', e.target.value)} />
          </label>
          <label className="block sm:col-span-2">
            <span className="label">Deskripsi</span>
            <textarea className="input-field min-h-24 resize-none" value={form.description} onChange={(e) => update('description', e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Harga Mulai</span>
            <input className="input-field" type="number" value={form.min_price} onChange={(e) => update('min_price', e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Harga Sampai</span>
            <input className="input-field" type="number" value={form.max_price} onChange={(e) => update('max_price', e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Min Order</span>
            <input className="input-field" type="number" min="1" value={form.min_order} onChange={(e) => update('min_order', e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Estimasi Hari</span>
            <input className="input-field" type="number" min="1" value={form.lead_time_days} onChange={(e) => update('lead_time_days', e.target.value)} />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 sm:col-span-2">
            <input type="checkbox" checked={form.is_available} onChange={(e) => update('is_available', e.target.checked)} />
            <span className="text-sm font-semibold text-zinc-700">Produk tersedia untuk ditampilkan publik</span>
          </label>
        </div>

        <div className="flex gap-3 border-t border-zinc-100 px-6 py-4">
          <button onClick={onClose} className="btn-ghost">Batal</button>
          <button
            onClick={() => onSubmit(form)}
            disabled={loading || !form.name.trim()}
            className="btn-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            Simpan Produk
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function LockedPreview() {
  return (
    <div className="rounded-[32px] border border-blue-100 bg-white p-6 shadow-sm">
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-500">Feature Pro</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-zinc-900">Toko Saya</h2>
          <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-500">
            Buka toko online percetakan Anda. Klien bisa request order langsung tanpa WA dulu.
          </p>
          <div className="mt-6 space-y-3">
            {[
              'URL unik untuk toko Anda',
              'Daftar layanan & harga publik',
              'Order masuk langsung ke dashboard',
              'Update status order dan estimasi harga',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700">
                <CheckCircle2 size={16} className="text-emerald-500" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-dashed border-blue-200 bg-[linear-gradient(160deg,_#eff6ff,_#ffffff)] p-5">
          <div className="rounded-[24px] border border-white bg-white/90 p-4 shadow-sm">
            <div className="h-28 rounded-[20px] bg-[linear-gradient(135deg,_#0f172a,_#2563eb,_#38bdf8)]" />
            <div className="-mt-10 flex items-end gap-3 px-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-[26px] border-4 border-white bg-zinc-100">
                <Store size={28} className="text-zinc-400" />
              </div>
              <div className="pb-2">
                <div className="h-4 w-36 rounded-full bg-zinc-200" />
                <div className="mt-2 h-3 w-48 rounded-full bg-zinc-100" />
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-zinc-100 p-4">
                  <div className="h-3 w-20 rounded-full bg-blue-100" />
                  <div className="mt-3 h-4 w-40 rounded-full bg-zinc-200" />
                  <div className="mt-2 h-3 w-full rounded-full bg-zinc-100" />
                  <div className="mt-1 h-3 w-10/12 rounded-full bg-zinc-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StorefrontManager({ user }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assetUploading, setAssetUploading] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('settings');
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [productModal, setProductModal] = useState(null);
  const [productSaving, setProductSaving] = useState(false);
  const [settings, setSettings] = useState({
    store_name: '',
    store_slug: '',
    store_tagline: '',
    store_city: '',
    store_whatsapp: '',
    store_instagram: '',
    store_description: '',
    store_logo_url: '',
    store_cover_url: '',
    store_is_active: true,
  });
  const [onboarding, setOnboarding] = useState({
    step: 1,
    storeName: '',
    slug: '',
    city: '',
    whatsapp: '',
    tagline: '',
    productName: '',
    productPrice: '',
    productDescription: '',
    done: false,
  });
  const dragIdRef = useRef(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const data = await getStoreDashboardData(user.id);
      setProfile(data.profile);
      setProducts(data.products);
      setOrders(data.orders);
      setSettings({
        store_name: data.profile?.store_name || '',
        store_slug: data.profile?.store_slug || '',
        store_tagline: data.profile?.store_tagline || '',
        store_city: data.profile?.store_city || '',
        store_whatsapp: data.profile?.store_whatsapp || '',
        store_instagram: data.profile?.store_instagram || '',
        store_description: data.profile?.store_description || '',
        store_logo_url: data.profile?.store_logo_url || '',
        store_cover_url: data.profile?.store_cover_url || '',
        store_is_active: data.profile?.store_is_active ?? true,
      });
      if (!data.profile?.store_slug || !data.profile?.store_name) {
        const candidate = generateStoreSlugCandidate(data.profile?.store_name || user.user_metadata?.full_name || 'toko-cetak');
        setOnboarding((prev) => ({
          ...prev,
          storeName: data.profile?.store_name || '',
          slug: data.profile?.store_slug || candidate,
          city: data.profile?.store_city || '',
          whatsapp: data.profile?.store_whatsapp || '',
          tagline: data.profile?.store_tagline || '',
        }));
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat data toko');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(''), 2600);
    return () => clearTimeout(timer);
  }, [message]);

  const publicUrl = settings.store_slug ? getStoreUrl(settings.store_slug) : '';
  const pendingCount = useMemo(() => orders.filter((order) => order.status === 'pending').length, [orders]);
  const filteredOrders = useMemo(() => (
    filter === 'all' ? orders : orders.filter((order) => order.status === filter)
  ), [orders, filter]);

  async function handleSettingsSave() {
    setSaving(true);
    setError('');
    try {
      const data = await saveStoreProfile(user.id, settings);
      setProfile(data);
      setSettings((prev) => ({ ...prev, store_slug: data.store_slug }));
      setMessage('Pengaturan toko tersimpan');
    } catch (err) {
      setError(err.message || 'Gagal menyimpan pengaturan toko');
    } finally {
      setSaving(false);
    }
  }

  async function handleAssetUpload(kind, event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setAssetUploading(kind);
    setError('');
    try {
      const url = await uploadStoreAsset(user.id, file, kind);
      const field = kind === 'logo' ? 'store_logo_url' : 'store_cover_url';
      setSettings((prev) => ({ ...prev, [field]: url }));
      setMessage(`${kind === 'logo' ? 'Logo' : 'Cover'} berhasil diupload`);
    } catch (err) {
      setError(err.message || 'Gagal upload gambar');
    } finally {
      setAssetUploading('');
      event.target.value = '';
    }
  }

  async function handleProductSubmit(form) {
    setProductSaving(true);
    setError('');
    try {
      if (productModal?.id) {
        const updated = await updateStoreProduct(user.id, productModal.id, form);
        setProducts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setMessage('Produk berhasil diperbarui');
      } else {
        const created = await createStoreProduct(user.id, { ...form, sort_order: products.length });
        setProducts((prev) => [...prev, created]);
        setMessage('Produk berhasil ditambahkan');
      }
      setProductModal(null);
    } catch (err) {
      setError(err.message || 'Gagal menyimpan produk');
    } finally {
      setProductSaving(false);
    }
  }

  async function handleProductDelete(productId) {
    if (!window.confirm('Hapus produk ini dari halaman publik?')) return;
    try {
      await deleteStoreProduct(user.id, productId);
      setProducts((prev) => prev.filter((item) => item.id !== productId));
      setMessage('Produk berhasil dihapus');
    } catch (err) {
      setError(err.message || 'Gagal menghapus produk');
    }
  }

  async function moveProduct(productId, direction) {
    const currentIndex = products.findIndex((item) => item.id === productId);
    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= products.length) return;
    const nextProducts = [...products];
    const [item] = nextProducts.splice(currentIndex, 1);
    nextProducts.splice(nextIndex, 0, item);
    setProducts(nextProducts);
    await reorderStoreProducts(user.id, nextProducts.map((product) => product.id));
  }

  async function handleDrop(targetId) {
    const draggedId = dragIdRef.current;
    dragIdRef.current = null;
    if (!draggedId || draggedId === targetId) return;

    const nextProducts = [...products];
    const from = nextProducts.findIndex((item) => item.id === draggedId);
    const to = nextProducts.findIndex((item) => item.id === targetId);
    if (from < 0 || to < 0) return;

    const [item] = nextProducts.splice(from, 1);
    nextProducts.splice(to, 0, item);
    setProducts(nextProducts);

    try {
      await reorderStoreProducts(user.id, nextProducts.map((product) => product.id));
      setMessage('Urutan produk diperbarui');
    } catch (err) {
      setError(err.message || 'Gagal menyimpan urutan produk');
      loadData();
    }
  }

  async function handleOrderSave() {
    if (!selectedOrder) return;
    try {
      const updated = await updateStoreOrder(user.id, selectedOrder.id, selectedOrder);
      setOrders((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedOrder(updated);
      setMessage('Status order berhasil diperbarui');
    } catch (err) {
      setError(err.message || 'Gagal memperbarui order');
    }
  }

  async function completeOnboarding() {
    setSaving(true);
    setError('');
    try {
      const uniqueSlug = await generateUniqueStoreSlug(user.id, onboarding.slug || onboarding.storeName);
      const profileData = await saveStoreProfile(user.id, {
        store_name: onboarding.storeName,
        store_slug: uniqueSlug,
        store_city: onboarding.city,
        store_whatsapp: onboarding.whatsapp,
        store_tagline: onboarding.tagline,
        store_is_active: true,
      }, { preserveExistingSlug: false });

      if (onboarding.productName.trim()) {
        await createStoreProduct(user.id, {
          ...EMPTY_PRODUCT,
          name: onboarding.productName,
          min_price: onboarding.productPrice || null,
          description: onboarding.productDescription,
          sort_order: 0,
        });
      }

      setProfile(profileData);
      setOnboarding((prev) => ({ ...prev, done: true, slug: uniqueSlug }));
      await loadData();
    } catch (err) {
      setError(err.message || 'Gagal menyelesaikan setup toko');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm font-semibold text-zinc-600">
          <Loader2 size={18} className="animate-spin text-blue-500" />
          Memuat data toko...
        </div>
      </div>
    );
  }

  if (!profile?.store_slug || !profile?.store_name) {
    if (onboarding.done) {
      return (
        <div className="rounded-[32px] border border-emerald-200 bg-white p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-500">Setup selesai</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-zinc-900">Toko publik Anda sudah siap</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-500">
            Halaman toko sudah aktif. Sekarang Anda bisa membagikan link toko atau lanjut mengelola produk dan order dari tab di bawah.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={getStoreUrl(onboarding.slug)} target="_blank" rel="noreferrer" className="btn-primary inline-flex items-center gap-2">
              Buka halaman toko
              <ExternalLink size={15} />
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Halo, ini link toko kami di naikcetak: ${getStoreUrl(onboarding.slug)}`)}`}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost inline-flex items-center gap-2"
            >
              Bagikan ke WhatsApp
              <MessageCircle size={15} />
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-[32px] border border-white/80 bg-white p-6 shadow-sm">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] bg-[linear-gradient(150deg,_#0f172a,_#1d4ed8,_#38bdf8)] p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-100">Wizard Setup Toko</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Buat halaman order publik pertama Anda</h2>
            <p className="mt-4 text-sm leading-7 text-blue-100">
              Klien bisa lihat layanan, harga, lalu kirim request order langsung dari link toko Anda.
            </p>
            <div className="mt-8 space-y-3">
              {[1, 2, 3].map((step) => (
                <div key={step} className={`rounded-2xl px-4 py-3 text-sm font-semibold ${onboarding.step === step ? 'bg-white text-zinc-900' : 'bg-white/10 text-blue-100'}`}>
                  Langkah {step}
                </div>
              ))}
            </div>
          </div>

          <div>
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {onboarding.step === 1 && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">Langkah 1</p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">Apa nama percetakan Anda?</h3>
                </div>
                <label className="block">
                  <span className="label">Nama Toko</span>
                  <input
                    className="input-field"
                    value={onboarding.storeName}
                    onChange={(e) => {
                      const storeName = e.target.value;
                      setOnboarding((prev) => ({
                        ...prev,
                        storeName,
                        slug: generateStoreSlugCandidate(storeName),
                      }));
                    }}
                  />
                </label>
                <label className="block">
                  <span className="label">Slug URL</span>
                  <input className="input-field font-mono" value={onboarding.slug} onChange={(e) => setOnboarding((prev) => ({ ...prev, slug: generateStoreSlugCandidate(e.target.value) }))} />
                  <p className="mt-2 text-xs text-zinc-400">Preview: {getStoreUrl(onboarding.slug || 'toko-cetak')}</p>
                </label>
                <button disabled={!onboarding.storeName.trim()} onClick={() => setOnboarding((prev) => ({ ...prev, step: 2 }))} className="btn-primary inline-flex items-center gap-2">
                  Lanjut
                  <ChevronRight size={15} />
                </button>
              </div>
            )}

            {onboarding.step === 2 && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">Langkah 2</p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">Lengkapi info dasar toko</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="label">Kota</span>
                    <input className="input-field" value={onboarding.city} onChange={(e) => setOnboarding((prev) => ({ ...prev, city: e.target.value }))} />
                  </label>
                  <label className="block">
                    <span className="label">No WA Toko</span>
                    <input className="input-field" value={onboarding.whatsapp} onChange={(e) => setOnboarding((prev) => ({ ...prev, whatsapp: e.target.value }))} />
                  </label>
                </div>
                <label className="block">
                  <span className="label">Tagline</span>
                  <input className="input-field" value={onboarding.tagline} onChange={(e) => setOnboarding((prev) => ({ ...prev, tagline: e.target.value }))} />
                </label>
                <div className="flex gap-3">
                  <button onClick={() => setOnboarding((prev) => ({ ...prev, step: 1 }))} className="btn-ghost">Kembali</button>
                  <button onClick={() => setOnboarding((prev) => ({ ...prev, step: 3 }))} className="btn-primary inline-flex items-center gap-2">
                    Lanjut
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {onboarding.step === 3 && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">Langkah 3</p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">Tambahkan produk pertama</h3>
                  <p className="mt-2 text-sm text-zinc-500">Opsional. Anda bisa skip dan menambahkannya nanti.</p>
                </div>
                <label className="block">
                  <span className="label">Nama Produk</span>
                  <input className="input-field" value={onboarding.productName} onChange={(e) => setOnboarding((prev) => ({ ...prev, productName: e.target.value }))} />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="label">Harga Mulai</span>
                    <input className="input-field" type="number" value={onboarding.productPrice} onChange={(e) => setOnboarding((prev) => ({ ...prev, productPrice: e.target.value }))} />
                  </label>
                  <label className="block">
                    <span className="label">Deskripsi Singkat</span>
                    <input className="input-field" value={onboarding.productDescription} onChange={(e) => setOnboarding((prev) => ({ ...prev, productDescription: e.target.value }))} />
                  </label>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setOnboarding((prev) => ({ ...prev, step: 2 }))} className="btn-ghost">Kembali</button>
                  <button onClick={completeOnboarding} disabled={saving} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
                    {saving && <Loader2 size={15} className="animate-spin" />}
                    Selesaikan Setup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-white/80 bg-white p-6 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-500">Toko Saya</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-900">{settings.store_name || 'Toko Publik Percetakan'}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-500">
              Kelola profil toko, daftar layanan, dan semua request order yang masuk dari halaman publik Anda.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a href={publicUrl} target="_blank" rel="noreferrer" className="btn-primary inline-flex items-center gap-2">
                Buka Halaman Toko
                <ExternalLink size={15} />
              </a>
              <button onClick={async () => { await navigator.clipboard.writeText(publicUrl); setMessage('Link toko berhasil disalin'); }} className="btn-ghost inline-flex items-center gap-2">
                <Copy size={15} />
                Salin Link
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Status', value: settings.store_is_active ? 'Aktif' : 'Nonaktif' },
              { label: 'Produk Publik', value: `${products.length} layanan` },
              { label: 'Order Pending', value: `${pendingCount} order` },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">{item.label}</p>
                <p className="mt-2 text-xl font-black tracking-tight text-zinc-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}
      {message && (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <Check size={16} className="mt-0.5 shrink-0" />
          {message}
        </div>
      )}

      <div className="rounded-[32px] border border-white/80 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'settings', label: 'Pengaturan Toko' },
            { id: 'products', label: 'Kelola Produk' },
            { id: 'orders', label: `Order Masuk${pendingCount ? ` (${pendingCount})` : ''}` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${activeTab === tab.id ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'settings' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <div className="rounded-[32px] border border-white/80 bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="label">Nama Toko</span>
                <input className="input-field" value={settings.store_name} onChange={(e) => setSettings((prev) => ({ ...prev, store_name: e.target.value }))} />
              </label>
              <label className="block sm:col-span-2">
                <span className="label">Slug / URL</span>
                <div className="flex gap-2">
                  <input className="input-field font-mono" readOnly value={publicUrl} />
                  <button onClick={async () => { await navigator.clipboard.writeText(publicUrl); setMessage('Link toko berhasil disalin'); }} className="btn-ghost">
                    <Copy size={16} />
                  </button>
                </div>
              </label>
              <label className="block sm:col-span-2">
                <span className="label">Tagline</span>
                <input className="input-field" value={settings.store_tagline} onChange={(e) => setSettings((prev) => ({ ...prev, store_tagline: e.target.value }))} />
              </label>
              <label className="block">
                <span className="label">Kota</span>
                <input className="input-field" value={settings.store_city} onChange={(e) => setSettings((prev) => ({ ...prev, store_city: e.target.value }))} />
              </label>
              <label className="block">
                <span className="label">No WA Toko</span>
                <input className="input-field" value={settings.store_whatsapp} onChange={(e) => setSettings((prev) => ({ ...prev, store_whatsapp: e.target.value }))} />
              </label>
              <label className="block">
                <span className="label">Instagram</span>
                <input className="input-field" value={settings.store_instagram} onChange={(e) => setSettings((prev) => ({ ...prev, store_instagram: e.target.value }))} />
              </label>
              <label className="block sm:col-span-2">
                <span className="label">Deskripsi</span>
                <textarea className="input-field min-h-32 resize-none" value={settings.store_description} onChange={(e) => setSettings((prev) => ({ ...prev, store_description: e.target.value }))} />
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 sm:col-span-2">
                <input type="checkbox" checked={settings.store_is_active} onChange={(e) => setSettings((prev) => ({ ...prev, store_is_active: e.target.checked }))} />
                <span className="text-sm font-semibold text-zinc-700">Halaman publik aktif dan bisa diakses klien</span>
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={handleSettingsSave} disabled={saving} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
                {saving && <Loader2 size={15} className="animate-spin" />}
                Simpan Pengaturan
              </button>
              <a href={publicUrl} target="_blank" rel="noreferrer" className="btn-ghost inline-flex items-center gap-2">
                Preview Link
                <ExternalLink size={15} />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { key: 'store_logo_url', label: 'Logo Toko', kind: 'logo', height: 'h-44' },
              { key: 'store_cover_url', label: 'Cover Toko', kind: 'cover', height: 'h-52' },
            ].map((item) => (
              <div key={item.key} className="rounded-[32px] border border-white/80 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">{item.label}</p>
                    <h3 className="mt-1 text-lg font-black tracking-tight text-zinc-900">Upload {item.label.toLowerCase()}</h3>
                  </div>
                  <label className="btn-ghost inline-flex cursor-pointer items-center gap-2">
                    {assetUploading === item.kind ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                    Pilih Gambar
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAssetUpload(item.kind, e)} />
                  </label>
                </div>
                <div className={`overflow-hidden rounded-[24px] border border-zinc-100 bg-zinc-50 ${item.height} flex items-center justify-center`}>
                  {settings[item.key] ? (
                    <img src={settings[item.key]} alt={item.label} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-zinc-400">
                      <ImagePlus size={26} />
                      <span className="text-sm font-semibold">Belum ada gambar</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="rounded-[32px] border border-white/80 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">Kelola Produk</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">Produk dan layanan yang tampil di halaman publik</h2>
            </div>
            <button onClick={() => setProductModal(EMPTY_PRODUCT)} className="btn-primary inline-flex items-center gap-2">
              <Plus size={16} />
              Tambah Produk
            </button>
          </div>

          {products.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-blue-200 bg-blue-50/50 px-6 py-14 text-center">
              <Package2 size={28} className="mx-auto mb-3 text-blue-400" />
              <p className="text-lg font-bold text-zinc-900">Belum ada layanan publik</p>
              <p className="mt-2 text-sm text-zinc-500">Tambahkan produk pertama agar halaman toko Anda langsung bisa menerima request order.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  draggable
                  onDragStart={() => { dragIdRef.current = product.id; }}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDrop(product.id)}
                  className="grid gap-4 rounded-[26px] border border-zinc-100 bg-zinc-50 px-4 py-4 lg:grid-cols-[36px_1.2fr_0.9fr_0.75fr_0.65fr_auto]"
                >
                  <div className="flex items-center justify-center text-zinc-400">
                    <GripVertical size={18} />
                  </div>
                  <div>
                    <p className="text-lg font-black tracking-tight text-zinc-900">{product.name}</p>
                    <p className="mt-1 text-sm text-zinc-500">{product.description || 'Tanpa deskripsi.'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Kategori</p>
                    <p className="mt-2 text-sm font-semibold text-zinc-700">{product.category || 'Umum'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Harga</p>
                    <p className="mt-2 text-sm font-semibold text-zinc-700">{formatMoney(product.min_price)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Status</p>
                    <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${product.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-200 text-zinc-600'}`}>
                      {product.is_available ? 'Tersedia' : 'Disembunyikan'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => moveProduct(product.id, 'up')} disabled={index === 0} className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 disabled:opacity-40">Naik</button>
                    <button onClick={() => moveProduct(product.id, 'down')} disabled={index === products.length - 1} className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 disabled:opacity-40">Turun</button>
                    <button onClick={() => setProductModal(product)} className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-white">Edit</button>
                    <button onClick={() => handleProductDelete(product.id)} className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Hapus</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[32px] border border-white/80 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">Order Masuk</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">Request order dari halaman publik</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((item) => (
                  <button key={item.id} onClick={() => setFilter(item.id)} className={`rounded-full px-3 py-2 text-xs font-semibold ${filter === item.id ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600'}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-blue-200 bg-blue-50/50 px-6 py-14 text-center">
                <Building2 size={28} className="mx-auto mb-3 text-blue-400" />
                <p className="text-lg font-bold text-zinc-900">Belum ada order masuk</p>
                <p className="mt-2 text-sm text-zinc-500">Order dari halaman toko publik akan muncul otomatis di sini.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[24px] border border-zinc-100">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-left text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                    <tr>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3">Nama Klien</th>
                      <th className="px-4 py-3">Produk</th>
                      <th className="px-4 py-3">Qty</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} onClick={() => setSelectedOrder(order)} className="cursor-pointer border-t border-zinc-100 transition-colors hover:bg-zinc-50">
                        <td className="px-4 py-3 text-zinc-500">{new Date(order.created_at).toLocaleDateString('id-ID')}</td>
                        <td className="px-4 py-3 font-semibold text-zinc-900">{order.client_name}</td>
                        <td className="px-4 py-3 text-zinc-700">{order.product_name}</td>
                        <td className="px-4 py-3 text-zinc-500">{order.quantity} {order.unit}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${order.status === 'pending' ? 'bg-amber-100 text-amber-700' : order.status === 'done' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                            {orderStatusLabel(order.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-[32px] border border-white/80 bg-white p-6 shadow-sm">
            {selectedOrder ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-500">Detail Order</p>
                    <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">{selectedOrder.client_name}</h3>
                    <p className="mt-1 text-sm text-zinc-500">{selectedOrder.product_name} · {selectedOrder.quantity} {selectedOrder.unit}</p>
                  </div>
                  {selectedOrder.client_phone && (
                    <a
                      href={`https://wa.me/${selectedOrder.client_phone.replace(/\D/g, '').replace(/^0/, '62')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-ghost inline-flex items-center gap-2"
                    >
                      <MessageCircle size={15} />
                      Hubungi Klien
                    </a>
                  )}
                </div>

                <div className="rounded-[24px] bg-zinc-50 p-4 text-sm text-zinc-600">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div><span className="text-zinc-400">No. WA</span><p className="mt-1 font-semibold text-zinc-900">{selectedOrder.client_phone}</p></div>
                    <div><span className="text-zinc-400">Email</span><p className="mt-1 font-semibold text-zinc-900">{selectedOrder.client_email || '—'}</p></div>
                    <div><span className="text-zinc-400">Ukuran</span><p className="mt-1 font-semibold text-zinc-900">{selectedOrder.size || '—'}</p></div>
                    <div><span className="text-zinc-400">Finishing</span><p className="mt-1 font-semibold text-zinc-900">{selectedOrder.finishing || '—'}</p></div>
                  </div>
                  <div className="mt-4">
                    <span className="text-zinc-400">Catatan Klien</span>
                    <p className="mt-1 font-semibold text-zinc-900">{selectedOrder.notes || 'Tidak ada catatan tambahan.'}</p>
                  </div>
                </div>

                <label className="block">
                  <span className="label">Status</span>
                  <select className="input-field" value={selectedOrder.status} onChange={(e) => setSelectedOrder((prev) => ({ ...prev, status: e.target.value }))}>
                    {ORDER_STATUSES.map((status) => <option key={status} value={status}>{orderStatusLabel(status)}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="label">Estimasi Harga</span>
                  <input className="input-field" type="number" value={selectedOrder.estimated_price || ''} onChange={(e) => setSelectedOrder((prev) => ({ ...prev, estimated_price: e.target.value }))} />
                </label>
                <label className="block">
                  <span className="label">Catatan Admin</span>
                  <textarea className="input-field min-h-28 resize-none" value={selectedOrder.admin_notes || ''} onChange={(e) => setSelectedOrder((prev) => ({ ...prev, admin_notes: e.target.value }))} />
                </label>
                <button onClick={handleOrderSave} className="btn-primary">Simpan Update Order</button>
              </div>
            ) : (
              <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
                <Store size={30} className="mb-3 text-zinc-300" />
                <p className="text-lg font-bold text-zinc-900">Pilih order untuk melihat detail</p>
                <p className="mt-2 max-w-sm text-sm leading-7 text-zinc-500">Klik salah satu baris di tabel order untuk membuka detail, ubah status, tambah estimasi harga, dan catatan admin.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {productModal && (
          <ProductModal
            initialData={productModal.id ? productModal : null}
            onClose={() => setProductModal(null)}
            onSubmit={handleProductSubmit}
            loading={productSaving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export { LockedPreview };
