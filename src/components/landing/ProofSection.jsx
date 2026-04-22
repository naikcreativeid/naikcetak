import { Star } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { STATS, TESTIMONIALS } from './constants';

export default function ProofSection() {
  return (
    <section className="bg-[var(--bg-gray)] px-4 py-18 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="reveal-base" data-reveal>
          <SectionHeading
            eyebrow="Bukti"
            title="Dipercaya Percetakan dari Sabang sampai Merauke"
            subtitle="Angka yang sehat untuk bisnis kamu, tampilan yang lebih profesional untuk klien kamu."
          />
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STATS.map((stat, index) => (
            <div
              key={stat.label}
              data-reveal
              className="reveal-base rounded-[28px] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6"
              style={{ transitionDelay: `${index * 60}ms` }}
            >
              <p className="text-4xl font-extrabold text-[var(--text-primary)]">{stat.value}</p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {TESTIMONIALS.map((item, index) => (
            <article
              key={item.name}
              data-reveal
              className="reveal-base rounded-[30px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6"
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <div className="flex gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <Star key={starIndex} size={18} className="fill-current" />
                ))}
              </div>
              <p className="mt-5 text-base leading-8 text-[var(--text-primary)] sm:text-lg">"{item.quote}"</p>
              <div className="mt-6 border-t border-[var(--border)] pt-5">
                <p className="font-bold text-[var(--text-primary)]">{item.name}</p>
                <p className="text-sm text-[var(--text-secondary)]">{item.company}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
