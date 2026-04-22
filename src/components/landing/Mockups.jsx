import { Calculator, CheckCircle2, PackageCheck, Scissors, TrendingUp } from 'lucide-react';

function BrowserFrame({ children, className = '' }) {
  return (
    <div
      className={`overflow-hidden rounded-[28px] border border-[var(--border)] bg-white shadow-[var(--shadow-lg)] ${className}`}
    >
      <div className="flex items-center gap-1.5 border-b border-[var(--border)] bg-slate-50 px-3 py-2.5 sm:gap-2 sm:px-4 sm:py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400 sm:h-3 sm:w-3" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400 sm:h-3 sm:w-3" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 sm:h-3 sm:w-3" />
        <div className="ml-2 h-8 flex-1 rounded-full border border-slate-200 bg-white px-3 text-[11px] leading-8 text-slate-400 sm:ml-3 sm:h-9 sm:px-4 sm:text-xs sm:leading-9">
          app.naikcetak.com/dashboard
        </div>
      </div>
      {children}
    </div>
  );
}

export function HeroDashboardMockup({ metrics = [] }) {
  return (
    <BrowserFrame className="relative mx-auto max-w-[620px]">
      <div className="grid gap-0 bg-[var(--bg-gray)] lg:grid-cols-[168px_minmax(0,1fr)]">
        <aside className="border-r border-[var(--border)] bg-slate-950 px-4 py-5 text-white">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-lg">P</div>
            <div>
              <p className="text-sm font-semibold">NaikCetak</p>
              <p className="text-xs text-slate-400">Dashboard Pro</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {['Dashboard', 'Kalkulator HPP', 'Invoice', 'Tracking Order', 'Toko Saya'].map((item, index) => (
              <div
                key={item}
                className={`rounded-2xl px-3 py-2 ${index === 0 ? 'bg-white text-slate-950' : 'bg-white/5 text-slate-300'}`}
              >
                {item}
              </div>
            ))}
          </div>
        </aside>

        <div className="space-y-5 p-5">
          <div className="grid gap-4 md:grid-cols-3">
            {metrics.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-3xl bg-white p-4 shadow-[var(--shadow-sm)]">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-blue-light)] text-[var(--brand-blue)]">
                  <Icon size={18} />
                </div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div className="rounded-3xl bg-white p-5 shadow-[var(--shadow-sm)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Perhitungan HPP Hari Ini</p>
                  <p className="text-sm text-slate-500">Pesanan dus frozen food 10.000 pcs</p>
                </div>
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
                  Margin Aman
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['Bahan', 'Rp 7.200.000'],
                  ['Finishing', 'Rp 2.150.000'],
                  ['Harga Jual', 'Rp 12.500.000'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
                    <p className="mt-2 text-lg font-bold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-[var(--shadow-sm)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                  <PackageCheck size={22} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Tracking Order</p>
                  <p className="text-sm text-slate-500">Box Hampers Lebaran</p>
                </div>
              </div>
              <div className="mb-3 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[var(--brand-blue)] to-violet-500" />
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Desain</span>
                <span>Cetak</span>
                <span>Finishing</span>
              </div>
              <div className="mt-4 rounded-2xl bg-slate-950 px-4 py-3 text-sm text-white">
                Update terakhir: Quality check selesai, siap kirim besok 10:00
              </div>
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

export function FeatureMockup({ variant }) {
  const variants = {
    hpp: (
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
        <div className="space-y-3">
          <div className="rounded-2xl bg-slate-50 p-3 sm:p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Input Produksi</p>
            <div className="mt-3 grid gap-2.5 sm:gap-3 sm:grid-cols-2">
              {['Ukuran Box', 'Gramatur Kertas', 'Biaya Cetak', 'Finishing'].map((item) => (
                <div key={item} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-500 sm:px-4 sm:py-3 sm:text-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-[var(--brand-blue-light)] p-3 sm:p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-blue)]">Hasil</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-slate-600 sm:text-sm">HPP per pcs</p>
                <p className="text-2xl font-bold text-slate-950 sm:text-3xl">Rp 1.250</p>
              </div>
              <div className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-emerald-600 sm:px-3 sm:text-sm">
                Margin 32%
              </div>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-950 p-4 text-white">
          <p className="text-xs font-semibold sm:text-sm">Rekomendasi Jual</p>
          <p className="mt-3 text-3xl font-bold sm:text-4xl">Rp 1.650</p>
          <p className="mt-3 text-xs leading-6 text-slate-300 sm:text-sm">Masih aman untuk diskon, tetap untung di volume besar.</p>
        </div>
      </div>
    ),
    cutting: (
      <div className="grid gap-3 sm:gap-4 md:grid-cols-[210px_minmax(0,1fr)]">
        <div className="rounded-2xl bg-slate-50 p-3 sm:p-4">
          <p className="text-sm font-semibold text-slate-900">Parameter Job</p>
          <div className="mt-3 space-y-3">
            {['Plano 79 x 109 cm', 'Produk 18 x 12 cm', 'Mode normal', 'Mode rotasi 90°'].map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-500 sm:px-4 sm:py-3 sm:text-sm">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Visualisasi Grid</p>
              <p className="text-xs text-slate-500 sm:text-sm">32 potong per lembar, waste 6%</p>
            </div>
            <div className="inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600 sm:text-xs">
              Paling Hemat
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-slate-50 p-2 sm:gap-2 sm:p-3">
            {Array.from({ length: 16 }).map((_, index) => (
              <div
                key={index}
                className="aspect-[4/3] rounded-xl bg-[var(--brand-blue-light)]"
                style={{ border: '1px solid rgba(27, 79, 216, 0.2)' }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    invoice: (
      <div className="grid gap-3 sm:gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-2xl bg-slate-50 p-3 sm:p-4">
          <p className="text-sm font-semibold text-slate-900">Editor Invoice</p>
          <div className="mt-3 space-y-3">
            {['Nama Klien', 'Item Pekerjaan', 'Pajak & Diskon', 'Warna Template'].map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-500 sm:px-4 sm:py-3 sm:text-sm">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <p className="text-lg font-bold text-slate-900 sm:text-xl">Invoice</p>
              <p className="text-xs text-slate-500 sm:text-sm">INV-2026-0423</p>
            </div>
            <div className="rounded-full bg-[var(--brand-blue-light)] px-3 py-1 text-[11px] font-semibold text-[var(--brand-blue)] sm:text-xs">
              Pending
            </div>
          </div>
          <div className="space-y-3 py-4 text-xs text-slate-600 sm:text-sm">
            <div className="flex justify-between gap-3"><span>Box Hampers Lebaran</span><strong>Rp 12.500.000</strong></div>
            <div className="flex justify-between gap-3"><span>Diskon</span><strong>- Rp 500.000</strong></div>
            <div className="flex justify-between gap-3"><span>PPN</span><strong>Rp 1.320.000</strong></div>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950 px-4 py-4 text-white">
            <span className="text-xs sm:text-sm">Total Tagihan</span>
            <strong className="text-base sm:text-xl">Rp 13.320.000</strong>
          </div>
        </div>
      </div>
    ),
    tracking: (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900 sm:text-base">Tracking Order Publik</p>
            <p className="mt-1 text-xs leading-6 text-slate-500 sm:text-sm">Order: Dus Kue Premium</p>
          </div>
          <div className="inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600 sm:text-xs">
            Real-time
          </div>
        </div>
        <div className="grid gap-2.5 sm:gap-3">
          {[
            ['Order Masuk', true],
            ['Desain', true],
            ['ACC Desain', true],
            ['Cetak', true],
            ['Finishing', true],
            ['QC', false],
            ['Siap Kirim', false],
            ['Selesai', false],
          ].map(([label, done]) => (
            <div key={label} className="flex items-center gap-2.5 rounded-2xl bg-slate-50 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
              <CheckCircle2 size={16} className={`shrink-0 ${done ? 'text-emerald-500' : 'text-slate-300'}`} />
              <span className={`text-xs leading-5 sm:text-sm ${done ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    store: (
      <div className="grid gap-3 sm:gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="rounded-2xl bg-white p-4 shadow-[var(--shadow-sm)] sm:p-5">
          <div className="mb-5 rounded-2xl bg-slate-950 p-4 text-white sm:p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Toko Saya</p>
            <p className="mt-2 break-all text-xl font-bold sm:text-2xl">app.naikcetak.com/printbandung</p>
            <p className="mt-2 text-xs leading-6 text-slate-300 sm:text-sm">Kemasan custom, sticker, paper bag, dan offset untuk brand lokal.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {['Dus Kemasan', 'Sticker Label', 'Paper Bag', 'Katalog Produk'].map((item) => (
              <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                <p className="text-sm font-semibold text-slate-900">{item}</p>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">Mulai dari Rp 750/pcs</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <p className="text-sm font-semibold text-slate-900">Request Order Masuk</p>
          <div className="mt-4 space-y-3">
            {['Nama brand', 'Jenis produk', 'Qty & deadline', 'Nomor WhatsApp'].map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-500 sm:px-4 sm:py-3 sm:text-sm">
                {item}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl bg-[var(--brand-blue)] px-4 py-3 text-xs font-semibold leading-6 text-white sm:text-sm">
            Request baru otomatis masuk ke dashboard dan siap di-follow up.
          </div>
        </div>
      </div>
    ),
    dashboard: (
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-3 sm:space-y-4">
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
            {[
              ['Job Aktif', '24'],
              ['Quotation Hari Ini', '11'],
              ['Invoice Pending', '7'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white p-3 shadow-[var(--shadow-sm)] sm:p-4">
                <p className="text-xs text-slate-500 sm:text-sm">{label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-[var(--shadow-sm)] sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Performa Minggu Ini</p>
              <TrendingUp size={18} className="text-emerald-500" />
            </div>
            <div className="flex h-32 items-end gap-2 sm:h-40 sm:gap-3">
              {[38, 64, 44, 80, 56, 90, 74].map((height, index) => (
                <div key={index} className="flex-1 rounded-t-2xl bg-gradient-to-t from-[var(--brand-blue)] to-sky-400" style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-950 p-4 text-white sm:p-5">
          <p className="text-sm font-semibold">Quick Access</p>
          <div className="mt-4 space-y-3">
            {[
              ['Kalkulator HPP', Calculator],
              ['Potong Kertas', Scissors],
              ['Tracking Order', PackageCheck],
            ].map(([label, Icon]) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                <Icon size={18} />
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    biaya: (
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="rounded-2xl bg-white p-4 shadow-[var(--shadow-sm)] sm:p-5">
          <p className="text-sm font-semibold text-slate-900">Kalkulator Biaya Cetak</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              'Kertas',
              'Mesin Cetak',
              'Laminasi',
              'UV Spot',
              'Packing',
              'Ongkir',
            ].map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500 sm:px-4 sm:py-3 sm:text-sm">
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-slate-950 p-4 text-white sm:p-5">
          <p className="text-sm font-semibold">Ringkasan Total</p>
          <div className="mt-4 space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between"><span>Biaya bahan</span><strong>Rp 8.200.000</strong></div>
            <div className="flex justify-between"><span>Finishing</span><strong>Rp 2.450.000</strong></div>
            <div className="flex justify-between"><span>Margin</span><strong>30%</strong></div>
          </div>
          <div className="mt-5 rounded-2xl bg-white px-4 py-4 text-slate-950">
            <p className="text-xs text-slate-500 sm:text-sm">Harga jual rekomendasi</p>
            <p className="mt-1 text-xl font-bold sm:text-2xl">Rp 14.365.000</p>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <BrowserFrame>
      <div className="bg-[var(--bg-gray)] p-3 sm:p-4">{variants[variant] ?? variants.dashboard}</div>
    </BrowserFrame>
  );
}
