import { useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, FileText, Sparkles, Store, TrendingUp } from 'lucide-react';
import BrandLogo from './BrandLogo';

const PAGE_CONTENT = {
  tentang: {
    eyebrow: 'Tentang NaikCetak',
    seoTitle: 'Tentang NaikCetak - Software Manajemen Percetakan',
    seoDescription:
      'Kenali NaikCetak, software manajemen percetakan untuk hitung HPP, dokumen operasional, tracking order, dan storefront percetakan.',
    title: 'Software manajemen percetakan yang dibuat untuk kerja harian, bukan sekadar demo.',
    description:
      'NaikCetak membantu owner dan tim percetakan menghitung biaya dengan lebih akurat, bekerja lebih rapi, dan melayani klien dengan lebih profesional dari satu dashboard.',
    highlights: [
      'Kalkulator HPP dan biaya cetak untuk keputusan harga yang lebih cepat.',
      'Invoice, quotation, surat jalan, dan PO supplier yang siap dipakai operasional.',
      'Tracking order publik dan toko online agar klien lebih mudah follow up tanpa chat berulang.',
    ],
    sections: [
      {
        title: 'Kenapa NaikCetak dibuat',
        body:
          'Banyak percetakan masih mengandalkan spreadsheet acak, catatan manual, dan chat yang tercecer. Akibatnya margin sering bocor, follow up lambat, dan tim sibuk mengulang pekerjaan yang sama. NaikCetak dirancang untuk menutup celah itu dengan alur kerja yang lebih terstruktur.',
      },
      {
        title: 'Fokus produk kami',
        body:
          'Kami fokus pada kebutuhan yang benar-benar terjadi di lapangan: menghitung HPP, menyiapkan dokumen transaksi, memantau order, dan membuka kanal order online yang terlihat profesional. Setiap fitur dipilih untuk membantu bisnis percetakan naik level tanpa menambah kerumitan.',
      },
      {
        title: 'Siapa yang cocok memakai NaikCetak',
        body:
          'NaikCetak cocok untuk owner percetakan, admin operasional, staf produksi, dan tim penjualan yang ingin bekerja lebih cepat dengan data yang lebih rapi. Baik untuk usaha yang baru mulai maupun percetakan yang ingin menstandarkan workflow internal.',
      },
    ],
  },
  blog: {
    eyebrow: 'Blog',
    seoTitle: 'Blog NaikCetak - Insight Percetakan dan Operasional',
    seoDescription:
      'Blog NaikCetak sedang disiapkan untuk insight pricing, workflow percetakan, dokumen operasional, dan strategi pertumbuhan bisnis.',
    title: 'Pusat insight operasional percetakan akan hadir di NaikCetak.',
    description:
      'Halaman blog kami sedang disiapkan untuk membagikan panduan pricing, workflow percetakan, template operasional, dan strategi menaikkan profit tanpa bikin proses makin rumit.',
    highlights: [
      'Panduan hitung HPP dan margin untuk berbagai jenis order.',
      'Tips membuat invoice, quotation, dan alur follow up lebih meyakinkan.',
      'Praktik operasional yang relevan untuk owner dan admin percetakan Indonesia.',
    ],
    sections: [
      {
        title: 'Topik yang sedang kami siapkan',
        body:
          'Kami akan menerbitkan materi seputar efisiensi produksi, standar dokumen penjualan, pengelolaan order, penggunaan tracking, dan cara memanfaatkan fitur NaikCetak agar hasilnya benar-benar terasa dalam operasional sehari-hari.',
      },
      {
        title: 'Untuk sementara',
        body:
          'Jika Anda butuh bantuan atau ingin request topik tertentu, silakan hubungi kami lewat WhatsApp atau email. Kami senang menyusun materi yang benar-benar dibutuhkan pelaku usaha percetakan.',
      },
    ],
  },
  karir: {
    eyebrow: 'Karir',
    seoTitle: 'Karir di NaikCetak',
    seoDescription:
      'Peluang bergabung dengan NaikCetak untuk membangun software yang membantu bisnis percetakan Indonesia bekerja lebih modern.',
    title: 'Kami membuka peluang untuk orang-orang yang ingin membangun software yang berguna di dunia nyata.',
    description:
      'NaikCetak berkembang dengan fokus yang jelas: membantu bisnis percetakan Indonesia bekerja lebih modern. Kami mencari orang yang peduli pada produk, eksekusi yang rapi, dan dampak nyata untuk pengguna.',
    highlights: [
      'Budaya kerja yang fokus pada output, kejelasan, dan tanggung jawab.',
      'Ruang untuk ikut membentuk produk yang dipakai bisnis nyata.',
      'Kolaborasi lintas fungsi untuk pengembangan produk, growth, dan support.',
    ],
    sections: [
      {
        title: 'Bidang yang biasanya kami butuhkan',
        body:
          'Kami tertarik dengan talenta di area product, engineering, customer success, growth marketing, dan operasional. Walaupun belum selalu ada posisi terbuka, kami terbuka menerima profil yang kuat dan relevan.',
      },
      {
        title: 'Cara melamar',
        body:
          'Kirim profil singkat, portfolio atau CV, serta penjelasan singkat mengenai peran yang Anda incar ke email resmi kami. Cantumkan subjek email yang jelas agar proses review lebih cepat.',
      },
    ],
  },
  changelog: {
    eyebrow: 'Changelog',
    seoTitle: 'Changelog NaikCetak',
    seoDescription:
      'Ringkasan area pengembangan dan pembaruan utama di NaikCetak untuk operasional, dokumen, tracking, dan storefront percetakan.',
    title: 'Perubahan produk utama di NaikCetak kami rangkum agar pengguna tahu apa yang berkembang.',
    description:
      'Berikut ringkasan area pengembangan yang saat ini sudah menjadi bagian penting dari NaikCetak dan akan terus kami tingkatkan.',
    highlights: [
      'Kalkulator HPP, biaya cetak, dan simulasi untuk membantu akurasi harga.',
      'Dokumen operasional seperti invoice, quotation, surat jalan, dan PO supplier.',
      'Tracking order, storefront publik, langganan Pro, dan dukungan pembayaran Midtrans.',
    ],
    sections: [
      {
        title: 'Peningkatan operasional',
        body:
          'NaikCetak terus memperkuat area yang paling sering dipakai pengguna: akurasi perhitungan, kelengkapan dokumen, dan pengalaman dashboard yang lebih cepat dipahami oleh owner maupun tim.',
      },
      {
        title: 'Peningkatan komersial',
        body:
          'Kami juga mengembangkan fitur yang mendukung pertumbuhan bisnis seperti halaman toko publik, workflow quotation, tracking order untuk klien, serta alur berlangganan dan aktivasi yang lebih rapi.',
      },
      {
        title: 'Komitmen pembaruan',
        body:
          'Setiap pembaruan diarahkan pada satu tujuan utama: membuat operasional percetakan lebih efisien, lebih profesional, dan lebih mudah ditingkatkan seiring pertumbuhan bisnis.',
      },
    ],
  },
  roadmap: {
    eyebrow: 'Roadmap',
    seoTitle: 'Roadmap NaikCetak',
    seoDescription:
      'Arah pengembangan NaikCetak untuk akurasi kalkulasi, kelancaran operasional, dan pengalaman klien percetakan yang lebih profesional.',
    title: 'Arah pengembangan NaikCetak difokuskan pada workflow yang benar-benar dipakai percetakan.',
    description:
      'Roadmap kami bertumpu pada tiga area besar: akurasi kalkulasi, kelancaran operasional, dan pengalaman klien yang lebih profesional dari awal order sampai selesai.',
    highlights: [
      'Workflow yang lebih lengkap untuk produksi dan dokumen.',
      'Peningkatan pengalaman storefront, tracking, dan follow up klien.',
      'Penguatan pelaporan, automasi, dan integrasi yang mendukung skala bisnis.',
    ],
    sections: [
      {
        title: 'Area prioritas berikutnya',
        body:
          'Kami memprioritaskan penyempurnaan dokumen, reporting yang lebih kuat, alur admin yang lebih cepat, dan pengalaman pelanggan yang lebih percaya diri ketika menerima quotation, invoice, maupun link tracking.',
      },
      {
        title: 'Cara kami menentukan prioritas',
        body:
          'Roadmap disusun berdasarkan kebutuhan riil pengguna, frekuensi pekerjaan yang berulang, potensi penghematan waktu, dan pengaruh fitur terhadap profit serta kualitas layanan percetakan.',
      },
    ],
  },
};

const ICONS = [Sparkles, TrendingUp, FileText, Store, Clock3, CheckCircle2];

function SectionCard({ index, title, body }) {
  const Icon = ICONS[index % ICONS.length];

  return (
    <article className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-sm)]">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-blue-light)] text-[var(--brand-blue)]">
        <Icon size={22} />
      </div>
      <h3 className="text-xl font-bold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-3 leading-7 text-[var(--text-secondary)]">{body}</p>
    </article>
  );
}

export default function MarketingPage({ pageKey }) {
  const page = PAGE_CONTENT[pageKey] ?? PAGE_CONTENT.tentang;

  useEffect(() => {
    document.title = page.seoTitle;

    const descriptionTag = document.querySelector('meta[name="description"]');
    if (descriptionTag) {
      descriptionTag.setAttribute('content', page.seoDescription);
    }
  }, [page]);

  return (
    <div className="min-h-screen bg-[var(--bg-gray)] text-[var(--text-primary)]">
      <header className="border-b border-[var(--border)] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <BrandLogo
              markClassName="h-11 w-11 shrink-0"
              textClassName="text-lg"
              subtitle="Untuk percetakan Indonesia"
            />
          </a>

          <div className="flex items-center gap-3">
            <a
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
            >
              <ArrowLeft size={16} />
              Kembali ke Landing Page
            </a>
            <a
              href="https://app.naikcetak.com/#/login?tab=daftar"
              className="hidden rounded-xl bg-[var(--brand-blue)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--brand-blue-dark)] md:inline-flex"
            >
              Coba Gratis
            </a>
          </div>
        </div>
      </header>

      <main className="px-4 py-10 lg:px-8 lg:py-16">
        <section className="mx-auto max-w-7xl overflow-hidden rounded-[36px] bg-[var(--bg-dark)] px-6 py-10 text-white shadow-[0_32px_80px_rgba(15,23,42,0.18)] lg:px-10 lg:py-14">
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-white/60">{page.eyebrow}</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight lg:text-5xl">
                {page.title}
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 lg:text-lg">
                {page.description}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="https://app.naikcetak.com/#/login?tab=daftar"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[var(--bg-dark)] transition hover:translate-y-[-1px]"
                >
                  Mulai Pakai NaikCetak
                  <ArrowRight size={16} />
                </a>
                <a
                  href="https://wa.me/6282261039601"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Hubungi Kami
                </a>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/8 p-6 backdrop-blur">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/60">Yang sudah tersedia di NaikCetak</p>
              <div className="mt-5 space-y-4">
                {page.highlights.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                      <CheckCircle2 size={16} />
                    </div>
                    <p className="text-sm leading-7 text-slate-200">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-8 grid max-w-7xl gap-6 lg:grid-cols-3">
          {page.sections.map((section, index) => (
            <SectionCard key={section.title} index={index} title={section.title} body={section.body} />
          ))}
        </section>
      </main>
    </div>
  );
}
