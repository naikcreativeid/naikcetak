import { ArrowRight, CheckCircle2 } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { FEATURES, REGISTER_URL } from './constants';
import { FeatureMockup } from './Mockups';

export default function FeaturesSection() {
  return (
    <section id="fitur" className="bg-[var(--bg-gray)] px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="reveal-base" data-reveal>
          <SectionHeading
            eyebrow="Solusi"
            title="Semua yang Dibutuhkan Percetakan Modern"
            subtitle="Dari hitung kertas sampai kirim invoice, semua terintegrasi dalam satu platform."
          />
        </div>

        <div className="mt-14 space-y-10">
          {FEATURES.map((feature, index) => {
            const reversed = index % 2 === 1;
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                data-reveal
                className="reveal-base grid gap-8 rounded-[36px] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-md)] lg:grid-cols-2 lg:p-8"
              >
                <div className={reversed ? 'lg:order-2' : ''}>
                  <FeatureMockup variant={feature.mockup} />
                </div>
                <div className={`flex items-center ${reversed ? 'lg:order-1' : ''}`}>
                  <div>
                    <div
                      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.25em]"
                      style={{ backgroundColor: `${feature.accent}16`, color: feature.accent }}
                    >
                      <Icon size={14} />
                      {feature.label}
                    </div>
                    <h3 className="mt-5 text-4xl font-display font-bold leading-tight tracking-[-0.03em] text-[var(--text-primary)]">
                      {feature.title}
                    </h3>
                    <p className="mt-5 text-lg leading-8 text-[var(--text-secondary)]">{feature.description}</p>
                    <div className="mt-6 space-y-3">
                      {feature.bullets.map((bullet) => (
                        <div key={bullet} className="flex items-start gap-3 text-base text-[var(--text-primary)]">
                          <CheckCircle2 size={18} className="mt-1 shrink-0 text-[var(--accent-green)]" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8 flex flex-wrap gap-4">
                      <a
                        href={REGISTER_URL}
                        className="inline-flex items-center gap-2 text-sm font-bold text-[var(--brand-blue)] transition hover:text-[var(--brand-blue-dark)]"
                      >
                        {feature.linkLabel} <ArrowRight size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
