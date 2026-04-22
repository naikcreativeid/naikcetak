import { FINAL_CTA_ACTIONS } from './constants';

export default function FinalCtaSection() {
  return (
    <section className="px-4 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[40px] bg-[linear-gradient(135deg,_var(--brand-blue-dark)_0%,_var(--bg-dark)_100%)] px-6 py-14 text-center text-white shadow-[var(--shadow-lg)] lg:px-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-white/10 text-4xl backdrop-blur">
            🖨️
          </div>
          <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-display font-extrabold leading-[1.04] tracking-[-0.03em] text-white sm:text-5xl">
            Sudah Siap Hitung Lebih Cepat & Akurat?
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-100">
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
