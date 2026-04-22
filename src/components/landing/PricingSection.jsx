import { useMemo, useState } from 'react';
import { Check, X, ChevronDown } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { FAQS, REGISTER_URL } from './constants';

const starterItems = [
  ['Kalkulator Potong Kertas (terbatas)', true],
  ['Kalkulator Biaya Cetak (terbatas)', true],
  ['Kalkulator HPP', false],
  ['Invoice & Quotation Generator', false],
  ['Order Tracking System', false],
  ['Export PDF', false],
  ['AI Assistant', false],
  ['WhatsApp Integration', false],
  ['Toko Saya (Public Store)', false],
  ['Multi User', false],
  ['Priority Support', false],
];

const proItems = [
  'Kalkulator HPP (unlimited)',
  'Kalkulator Biaya Cetak (unlimited)',
  'Invoice & Quotation Generator',
  'Order Tracking System',
  'Export PDF',
  'AI Assistant (AI Brief Analyzer + Email & Proposal)',
  'WhatsApp Integration',
  'Toko Saya (Public Store)',
  'Multi User',
  'Priority Support',
];

export default function PricingSection() {
  const [billing, setBilling] = useState('monthly');
  const [openFaq, setOpenFaq] = useState(0);

  const proPrice = useMemo(
    () =>
      billing === 'monthly'
        ? { headline: 'Rp 149.000', suffix: '/ bulan', note: 'Bayar bulanan, fleksibel untuk mulai sekarang.' }
        : {
            headline: 'Rp 94.917',
            suffix: '/ bulan',
            note: 'Ditagih tahunan. Hemat Rp 648.996/tahun dibanding bayar bulanan.',
          },
    [billing],
  );

  return (
    <section id="harga" className="bg-white px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="reveal-base" data-reveal>
          <SectionHeading
            eyebrow="Harga"
            title="Harga Transparan, Tidak Ada Biaya Tersembunyi"
            subtitle="Mulai gratis, upgrade kapan saja. Tidak ada kontrak jangka panjang."
          />
        </div>

        <div className="mt-8 flex justify-center reveal-base" data-reveal>
          <div className="inline-flex rounded-2xl border border-[var(--border)] bg-[var(--bg-gray)] p-1">
            {[
              ['monthly', 'Bulanan'],
              ['yearly', 'Tahunan (hemat 47%)'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setBilling(value)}
                className={`rounded-2xl px-5 py-3 text-sm font-bold transition ${
                  billing === value
                    ? 'bg-white text-[var(--brand-blue)] shadow-[var(--shadow-sm)]'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <article
            data-reveal
            className="reveal-base order-2 rounded-[32px] border border-[var(--border)] bg-[var(--bg-gray)] p-6 lg:order-1"
          >
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">Starter</p>
            <h3 className="mt-4 text-3xl font-bold text-[var(--text-primary)]">Gratis</h3>
            <p className="mt-2 text-lg text-[var(--text-secondary)]">Untuk yang baru mulai</p>
            <p className="mt-5 text-5xl font-extrabold text-[var(--text-primary)]">Rp 0</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">/ bulan</p>

            <a
              href={REGISTER_URL}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-[var(--border)] bg-white px-5 py-4 text-sm font-bold text-[var(--text-primary)] transition hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
            >
              Mulai Gratis
            </a>

            <div className="mt-6 space-y-3">
              {starterItems.map(([label, enabled]) => (
                <div key={label} className="flex items-start gap-3 text-sm">
                  {enabled ? (
                    <Check size={18} className="mt-0.5 shrink-0 text-emerald-500" />
                  ) : (
                    <X size={18} className="mt-0.5 shrink-0 text-slate-300" />
                  )}
                  <span className={enabled ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}>{label}</span>
                </div>
              ))}
            </div>
          </article>

          <article
            data-reveal
            className="reveal-base order-1 relative rounded-[36px] border-2 border-[var(--brand-blue)] bg-[linear-gradient(180deg,_#ffffff_0%,_#eff4ff_100%)] p-7 shadow-[var(--shadow-lg)] lg:order-2"
          >
            <div className="absolute left-7 top-0 -translate-y-1/2 rounded-full bg-[var(--brand-blue)] px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-white">
              Paling Populer
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--brand-blue)]">Pro</p>
            <h3 className="mt-4 text-3xl font-bold text-[var(--text-primary)]">Untuk percetakan yang serius tumbuh</h3>
            <div className="mt-6 flex items-end gap-2">
              <span className="text-5xl font-extrabold text-[var(--text-primary)] transition-all duration-300">
                {proPrice.headline}
              </span>
              <span className="pb-2 text-base text-[var(--text-secondary)]">{proPrice.suffix}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              {billing === 'monthly'
                ? 'atau Rp 94.917/bulan jika bayar tahunan (hemat Rp 648.996/tahun)'
                : proPrice.note}
            </p>

            <a
              href={REGISTER_URL}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[var(--brand-blue)] px-5 py-4 text-sm font-bold text-white transition duration-200 hover:scale-[1.02] hover:bg-[var(--brand-blue-dark)]"
            >
              Pilih Pro →
            </a>

            <div className="mt-6 rounded-2xl bg-white/80 p-4 text-sm font-semibold text-[var(--text-primary)]">
              Termasuk semua di Starter, ditambah:
            </div>

            <div className="mt-5 space-y-3">
              {proItems.map((label) => (
                <div key={label} className="flex items-start gap-3 text-sm text-[var(--text-primary)]">
                  <Check size={18} className="mt-0.5 shrink-0 text-emerald-500" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </article>
        </div>

        <div id="faq" className="mt-12 rounded-[32px] border border-[var(--border)] bg-[var(--bg-gray)] p-5 shadow-[var(--shadow-sm)] lg:p-7">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--brand-blue)]">FAQ Mini</p>
          <div className="mt-5 divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
            {FAQS.map((faq, index) => (
              <div key={faq.question}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="pr-4 text-base font-semibold text-[var(--text-primary)]">{faq.question}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-[var(--text-muted)] transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div className={`grid transition-all duration-300 ${openFaq === index ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-[15px] leading-7 text-[var(--text-secondary)]">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
