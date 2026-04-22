import { ArrowRight, PlayCircle } from 'lucide-react';
import { CITIES, HERO_METRICS, HERO_PROOFS, REGISTER_URL } from './constants';
import { HeroDashboardMockup } from './Mockups';

export default function HeroSection() {
  return (
    <header
      id="top"
      className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(27,79,216,0.18),_transparent_35%),linear-gradient(180deg,_#ffffff_0%,_#f8fbff_58%,_#ffffff_100%)] px-4 pb-16 pt-28 sm:pb-20 lg:px-8 lg:pb-24 lg:pt-32"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--brand-blue)]/40 to-transparent" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(520px,0.95fr)]">
        <div className="reveal-base" data-reveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/90 px-4 py-2 text-sm font-semibold text-[var(--brand-blue)] shadow-[var(--shadow-sm)]">
            Software manajemen percetakan all-in-one
          </div>
          <h1
            className="mt-6 text-[clamp(2rem,6vw,4.9rem)] font-display italic leading-[0.95] text-[var(--text-primary)]"
            style={{ fontFamily: '"Instrument Serif", serif' }}
          >
            Percetakan Kamu Masih
            <br />
            Hitung Harga Pakai <span className="text-[var(--brand-blue)]">Excel?</span>
            <br />
            Sudah Saatnya Naik Level.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
            NaikCetak adalah software manajemen percetakan all-in-one. Hitung HPP, buat invoice,
            lacak order, dan tampil profesional ke klien, semua dari satu dashboard. Tanpa ribet.
            Tanpa salah hitung.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={REGISTER_URL}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-blue)] px-6 py-4 text-base font-bold text-white transition duration-200 hover:scale-[1.02] hover:bg-[var(--brand-blue-dark)]"
            >
              Coba Gratis Sekarang <ArrowRight size={18} />
            </a>
            <a
              href="#demo"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-6 py-4 text-base font-semibold text-[var(--text-primary)] transition duration-200 hover:scale-[1.02] hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
            >
              <PlayCircle size={18} />
              Lihat Demo
            </a>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {HERO_PROOFS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]">
                <Icon size={16} className="text-[var(--accent-green)]" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="reveal-base" data-reveal style={{ transitionDelay: '120ms' }}>
          <HeroDashboardMockup metrics={HERO_METRICS} />
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-7xl reveal-base" data-reveal style={{ transitionDelay: '180ms' }}>
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
