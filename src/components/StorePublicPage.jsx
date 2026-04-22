import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, MapPin, MessageCircle, Instagram, Clock3, Package2, ArrowRight,
  Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { getPublicStoreBySlug, submitPublicStoreOrder } from '../lib/supabase';

function formatPrice(minPrice, maxPrice) {
  if (!minPrice && !maxPrice) return 'Hubungi toko';
  if (minPrice && maxPrice && minPrice !== maxPrice) {
    return `Rp ${Number(minPrice).toLocaleString('id-ID')} - Rp ${Number(maxPrice).toLocaleString('id-ID')}`;
  }
  return `Mulai Rp ${Number(minPrice || maxPrice).toLocaleString('id-ID')}`;
}

function ensureMeta(name, content, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    if (property) el.setAttribute('property', name);
    else el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function EmptyCover() {
  return (
    <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.28),_transparent_30%),linear-gradient(135deg,_#0f172a,_#1d4ed8_45%,_#38bdf8)]" />
  );
}

function NotFoundState() {
  return (
    <div className="min-h-screen bg-[#f4f7fb] px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-[32px] border border-blue-100 bg-white p-8 shadow-[0_30px_90px_rgba(37,99,235,0.08)]">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white">
            <Package2 size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-500">naikcetak</p>
            <h1 className="text-2xl font-black text-zinc-900">Halaman toko tidak ditemukan</h1>
          </div>
        </div>
        <p className="max-w-xl text-sm leading-7 text-zinc-500">
          Tautan toko ini mungkin belum aktif, sudah diubah, atau sementara dinonaktifkan oleh pemilik percetakan.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="https://naikcetak.com"
            className="rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
          >
            Kembali ke naikcetak
          </a>
          <a
            href="https://app.naikcetak.com/#/login?tab=daftar"
            className="rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            Daftarkan percetakan Anda
          </a>
        </div>
      </div>
    </div>
  );
}

export default function StorePublicPage({ slug }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);
  const [form, setForm] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    productName: '',
    quantity: 1,
    size: '',
    finishing: '',
    notes: '',
    unit: 'pcs',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadStore() {
      setLoading(true);
      setError('');
      try {
        const data = await getPublicStoreBySlug(slug);
        if (!cancelled) setPayload(data);
      } catch (err) {
        if (!cancelled) {
          setPayload(null);
          setError(err.message || 'Gagal memuat halaman toko');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadStore();
    return () => { cancelled = true; };
  }, [slug]);

  const store = payload?.store ?? null;
  const products = payload?.products ?? [];

  useEffect(() => {
    if (!store) return;
    const title = `${store.store_name} — Percetakan di ${store.store_city || 'Indonesia'} | naikcetak`;
    const description = store.store_tagline || store.store_description || 'Pesan layanan percetakan langsung dari halaman toko publik naikcetak.';
    document.title = title;
    ensureMeta('description', description);
    ensureMeta('og:title', title, true);
    ensureMeta('og:description', description, true);
  }, [store]);

  const whatsappLink = useMemo(() => {
    const digits = (store?.store_whatsapp || '').replace(/\D/g, '').replace(/^0/, '62');
    return digits ? `https://wa.me/${digits}` : null;
  }, [store?.store_whatsapp]);

  function scrollToForm(productName) {
    setForm((prev) => ({ ...prev, productName, unit: 'pcs' }));
    document.getElementById('request-order-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await submitPublicStoreOrder(slug, form);
      setSubmitted(true);
      setForm({
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        productName: '',
        quantity: 1,
        size: '',
        finishing: '',
        notes: '',
        unit: 'pcs',
      });
    } catch (err) {
      setError(err.message || 'Gagal mengirim request order');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
        <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm font-semibold text-zinc-600 shadow-sm">
          <Loader2 size={18} className="animate-spin text-blue-500" />
          Memuat halaman toko...
        </div>
      </div>
    );
  }

  if (!store || error) return <NotFoundState />;

  return (
    <div className="min-h-screen bg-[#eff4fb] text-zinc-900">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <nav className="mb-5 flex items-center justify-between rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
          <a href="https://naikcetak.com" className="flex items-center gap-2 font-bold tracking-tight text-zinc-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white">
              <Package2 size={16} />
            </span>
            naikcetak
          </a>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Powered by naikcetak</span>
        </nav>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.08)]"
        >
          <div className="relative h-52 overflow-hidden sm:h-64">
            {store.store_cover_url ? (
              <img src={store.store_cover_url} alt={store.store_name} className="h-full w-full object-cover" />
            ) : (
              <EmptyCover />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/65 via-[#0f172a]/10 to-transparent" />
          </div>

          <div className="relative px-5 pb-8 pt-0 sm:px-8">
            <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border-4 border-white bg-zinc-100 shadow-xl sm:h-28 sm:w-28">
                  {store.store_logo_url ? (
                    <img src={store.store_logo_url} alt={store.store_name} className="h-full w-full object-cover" />
                  ) : (
                    <Building2 size={34} className="text-zinc-400" />
                  )}
                </div>
                <div className="min-w-0 pb-1">
                  <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">{store.store_name}</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">{store.store_tagline || store.store_description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
                    {store.store_city && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={14} className="text-blue-500" />
                        {store.store_city}
                      </span>
                    )}
                    {whatsappLink && (
                      <a href={whatsappLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 hover:text-emerald-700">
                        <MessageCircle size={14} />
                        WhatsApp
                      </a>
                    )}
                    {store.store_instagram && (
                      <a
                        href={`https://instagram.com/${store.store_instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-pink-600 hover:text-pink-700"
                      >
                        <Instagram size={14} />
                        {store.store_instagram}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <a
                href="#request-order-form"
                className="inline-flex items-center gap-2 self-start rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
              >
                Request Order
                <ArrowRight size={15} />
              </a>
            </div>
          </div>
        </motion.section>

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-500">Layanan Kami</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">Pilih layanan yang ingin Anda pesan</h2>
            </div>
            <p className="hidden text-sm text-zinc-400 md:block">Harga dapat menyesuaikan spesifikasi final & jumlah order</p>
          </div>

          {products.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-blue-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
              Toko ini belum menampilkan layanan publik. Anda tetap bisa kirim request custom lewat form di bawah.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product, index) => (
                <motion.article
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="flex h-full flex-col rounded-[28px] border border-white/70 bg-white p-5 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      {product.category && (
                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-blue-500">{product.category}</p>
                      )}
                      <h3 className="mt-2 text-lg font-black tracking-tight text-zinc-900">{product.name}</h3>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                      {product.min_order || 1}+ {product.unit || 'pcs'}
                    </span>
                  </div>

                  <p className="flex-1 text-sm leading-6 text-zinc-500">{product.description || 'Layanan cetak profesional dengan kualitas produksi terbaik.'}</p>

                  <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl bg-zinc-50 px-4 py-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Harga</p>
                      <p className="mt-1 text-sm font-bold text-zinc-900">{formatPrice(product.min_price, product.max_price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500">
                        <Clock3 size={12} />
                        {product.lead_time_days || 3} hari
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => scrollToForm(product.name)}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
                  >
                    Pesan Ini
                  </button>
                </motion.article>
              ))}
            </div>
          )}
        </section>

        <section id="request-order-form" className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-500">Request Order</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">Kirim kebutuhan cetak Anda</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Isi detail order di bawah. Tim toko akan meninjau request dan menghubungi Anda melalui WhatsApp.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Nama Lengkap*</span>
                  <input className="input-field" value={form.clientName} onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))} required />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">No WhatsApp*</span>
                  <input className="input-field" value={form.clientPhone} onChange={(e) => setForm((p) => ({ ...p, clientPhone: e.target.value }))} required />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Email</span>
                  <input className="input-field" type="email" value={form.clientEmail} onChange={(e) => setForm((p) => ({ ...p, clientEmail: e.target.value }))} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Produk yang Dipesan*</span>
                  <input className="input-field" value={form.productName} onChange={(e) => setForm((p) => ({ ...p, productName: e.target.value }))} required />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_130px_130px]">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Ukuran</span>
                  <input className="input-field" value={form.size} onChange={(e) => setForm((p) => ({ ...p, size: e.target.value }))} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Jumlah*</span>
                  <input className="input-field" type="number" min="1" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} required />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Satuan</span>
                  <input className="input-field" value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Finishing</span>
                <input className="input-field" value={form.finishing} onChange={(e) => setForm((p) => ({ ...p, finishing: e.target.value }))} />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Catatan tambahan</span>
                <textarea className="input-field min-h-32 resize-none" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
              </label>

              {error && (
                <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              {submitted && (
                <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
                  Terima kasih! Kami akan menghubungi Anda via WA.
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                Kirim Request Order
              </button>
            </form>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-500">Mengapa lewat halaman ini?</p>
              <div className="mt-4 space-y-4">
                {[
                  ['Harga dan layanan tampil jelas', 'Klien bisa membandingkan layanan tanpa perlu tanya satu per satu.'],
                  ['Request masuk lebih rapi', 'Semua detail order langsung tercatat dan siap ditinjau pemilik toko.'],
                  ['Follow up lebih cepat', 'Toko bisa balas dengan estimasi harga dan status order dari dashboard.'],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-2xl bg-zinc-50 px-4 py-4">
                    <p className="text-sm font-bold text-zinc-900">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-zinc-500">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
