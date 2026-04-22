import { ArrowRight, CheckCircle2 } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { FEATURES, REGISTER_URL } from './constants';
import { FeatureMockup } from './Mockups';

export default function FeaturesSection() {
  return (
    <section id="fitur" className="bg-[var(--bg-gray)] px-4 py-24 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="reveal-base" data-reveal>
          <SectionHeading
            eyebrow="Solusi"
            title="Semua yang Dibutuhkan Percetakan Modern"
            subtitle="Dari hitung kertas sampai kirim invoice, semua terintegrasi dalam satu platform."
          />
        </div>

        <div className="mt-12 space-y-6 sm:mt-14 sm:space-y-8 lg:space-y-10">
          {FEATURES.map((feature, index) => {
            const reversed = index % 2 === 1;
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                data-reveal
                className="reveal-base grid gap-6 rounded-[28px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-md)] sm:gap-8 sm:rounded-[32px] sm:p-6 lg:grid-cols-2 lg:gap-10 lg:rounded-[36px] lg:p-8"
              >
                <div className={reversed ? 'lg:order-2' : ''}>
                  <FeatureMockup variant={feature.mockup} />
                </div>
                <div className={`flex items-center ${reversed ? 'lg:order-1' : ''}`}>
                  <div>
                    <div
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.25em]"
                      style={{ backgroundColor: `${feature.accent}16`, color: feature.accent }}
                    >
                      <Icon size={12} className="sm:h-[14px] sm:w-[14px]" />
                      {feature.label}
                    </div>
                    <h3 className="mt-4 text-[clamp(1.55rem,4vw,2.5rem)] font-display font-bold leading-[1.18] tracking-[-0.02em] text-[var(--text-primary)] sm:mt-5 sm:leading-[1.12]">
                      {feature.title}
                    </h3>
                    <p className="mt-4 text-[15px] leading-7 text-[var(--text-secondary)] sm:mt-5 sm:text-lg sm:leading-8">{feature.description}</p>
                    <div className="mt-5 space-y-2.5 sm:mt-6 sm:space-y-3">
                      {feature.bullets.map((bullet) => (
                        <div key={bullet} className="flex items-start gap-2.5 text-[15px] leading-7 text-[var(--text-primary)] sm:gap-3 sm:text-base">
                          <CheckCircle2 size={16} className="mt-1 shrink-0 text-[var(--accent-green)] sm:h-[18px] sm:w-[18px]" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex flex-wrap gap-4 sm:mt-8">
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
