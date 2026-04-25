import { ArrowRight, PlayCircle } from 'lucide-react';
import { CITIES, HERO_METRICS, HERO_PROOFS, REGISTER_URL } from './constants';
import { HeroDashboardMockup } from './Mockups';

export default function HeroSection() {
  return (
    <header
      id="top"
      className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(27,79,216,0.14),_transparent_35%),linear-gradient(180deg,_#ffffff_0%,_#f8fbff_58%,_#ffffff_100%)] px-4 pb-18 pt-28 sm:pb-24 lg:px-8 lg:pb-28 lg:pt-32"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--brand-blue)]/40 to-transparent" />
      <div className="mx-auto max-w-6xl">
        <div className="reveal-base mx-auto max-w-4xl text-center" data-reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/90 px-4 py-2 text-xs font-semibold text-[var(--brand-blue)] shadow-[var(--shadow-sm)] sm:text-sm">
            Software manajemen percetakan all-in-one
          </div>
          <h1 className="mt-7 font-display text-[clamp(2.2rem,6vw,4.6rem)] font-bold tracking-[-0.04em] text-[var(--text-primary)]">
            <span className="block leading-[1.08] sm:leading-[1.02]">Operasional Percetakan</span>
            <span className="mt-2 block leading-[1.08] text-[var(--brand-blue)] sm:mt-1 sm:leading-[1.02]">
              Lebih Cepat
            </span>
            <span className="mt-2 block leading-[1.08] sm:mt-1 sm:leading-[1.02]">Lebih Rapi, Lebih Meyakinkan</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base sm:leading-8">
            Hitung HPP, biaya cetak, buat invoice dan quotation, pantau tracking order,
            sampai tampilkan storefront percetakan Anda. Semua dalam satu platform yang dibuat
            untuk membantu bisnis percetakan Indonesia terlihat lebih profesional dan bekerja lebih efisien.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href={REGISTER_URL}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--brand-blue)] px-6 py-3.5 text-sm font-bold text-white transition duration-200 hover:scale-[1.02] hover:bg-[var(--brand-blue-dark)] sm:min-h-0"
            >
              Coba Gratis Sekarang <ArrowRight size={18} />
            </a>
            <a
              href="#demo"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-6 py-3.5 text-sm font-semibold text-[var(--text-primary)] transition duration-200 hover:scale-[1.02] hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)] sm:min-h-0"
            >
              <PlayCircle size={18} />
              Lihat Fitur
            </a>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
            {HERO_PROOFS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]">
                <Icon size={16} className="text-[var(--accent-green)]" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="reveal-base mx-auto mt-12 max-w-4xl" data-reveal style={{ transitionDelay: '120ms' }}>
          <HeroDashboardMockup metrics={HERO_METRICS} />
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-7xl reveal-base border-t border-[var(--border)] pt-8 sm:mt-16 sm:pt-10" data-reveal style={{ transitionDelay: '180ms' }}>
        <p className="text-center text-xs font-bold uppercase tracking-[0.35em] text-[var(--text-muted)]">
          Dipercaya percetakan di seluruh Indonesia
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {CITIES.map((city) => (
            <span
              key={city}
              className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] shadow-[var(--shadow-sm)]"
            >
              {city}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
