import { FINAL_CTA_ACTIONS } from './constants';

export default function FinalCtaSection() {
  return (
    <section className="px-4 py-18 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,_var(--brand-blue-dark)_0%,_var(--bg-dark)_100%)] px-5 py-12 text-center text-white shadow-[var(--shadow-lg)] sm:px-6 sm:py-14 lg:rounded-[40px] lg:px-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-white/10 text-4xl backdrop-blur">
            🖨️
          </div>
          <h2 className="mx-auto mt-6 max-w-3xl text-[clamp(2rem,5vw,3rem)] font-display font-bold leading-[1.14] tracking-[-0.02em] text-white sm:leading-[1.08]">
            Sudah Siap Hitung Lebih Cepat & Akurat?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-blue-100 sm:text-lg">
            Bergabung dengan 6.971+ percetakan Indonesia yang sudah pakai NaikCetak. Coba gratis hari ini,
            tanpa kartu kredit, tanpa komitmen.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {FINAL_CTA_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <a
                  key={action.label}
                  href={action.href}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-sm font-bold transition duration-200 hover:scale-[1.02] ${
                    action.primary
                      ? 'bg-white text-[var(--brand-blue-dark)] hover:bg-blue-50'
                      : 'border border-white/25 bg-white/10 text-white hover:bg-white/15'
                  }`}
                >
                  {action.label}
                  <Icon size={16} />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
