import { CheckCircle2, Sparkles } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { VALUE_PILLARS, WORKFLOW_STEPS } from './constants';

function WorkflowItem({ item }) {
  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-blue-light)] text-sm font-extrabold text-[var(--brand-blue)]">
          {item.step}
        </div>
        <div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] sm:text-xl">{item.title}</h3>
        </div>
      </div>
      <p className="mt-4 leading-7 text-[var(--text-secondary)]">{item.description}</p>
    </div>
  );
}

function PillarCard({ pillar, index }) {
  return (
    <article
      data-reveal
      className="reveal-base rounded-[30px] border border-[var(--border)] bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] p-5 shadow-[var(--shadow-sm)] sm:p-6"
      style={{ transitionDelay: `${index * 70}ms` }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-dark)] text-white">
        <Sparkles size={18} />
      </div>
      <h3 className="mt-5 text-xl font-bold leading-8 text-[var(--text-primary)]">{pillar.title}</h3>
      <p className="mt-3 leading-7 text-[var(--text-secondary)]">{pillar.description}</p>
      <div className="mt-5 space-y-3">
        {pillar.points.map((point) => (
          <div key={point} className="flex items-start gap-3 text-sm text-[var(--text-primary)]">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[var(--accent-green)]" />
            <span className="leading-6">{point}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function WorthItSection() {
  return (
    <section className="bg-[var(--bg-gray)] px-4 py-24 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="reveal-base" data-reveal>
          <SectionHeading
            eyebrow="Kenapa Worth It"
            title="Bukan cuma banyak fitur, tapi satu workflow yang benar-benar kepakai setiap hari"
            subtitle="NaikCetak membantu Anda dari hitung biaya sampai follow up order. Hasilnya bukan sekadar software terlihat lengkap, tapi operasional benar-benar terasa lebih cepat, lebih rapi, dan lebih meyakinkan."
          />
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div data-reveal className="reveal-base rounded-[32px] border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-md)] sm:p-6 lg:p-7">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--brand-blue)]">Workflow Harian</p>
                <h3 className="mt-3 text-2xl font-bold text-[var(--text-primary)]">Dari hitung sampai order selesai</h3>
              </div>
              <div className="hidden rounded-2xl bg-[var(--brand-blue-light)] px-4 py-2 text-sm font-semibold text-[var(--brand-blue)] sm:block">
                Simple, rapi, dan terhubung
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {WORKFLOW_STEPS.map((item) => (
                <WorkflowItem key={item.step} item={item} />
              ))}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-1">
            {VALUE_PILLARS.map((pillar, index) => (
              <PillarCard key={pillar.title} pillar={pillar} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
