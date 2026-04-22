import { XCircle } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { PAIN_POINTS } from './constants';

export default function ProblemSection() {
  return (
    <section className="bg-white px-4 py-18 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="reveal-base" data-reveal>
          <SectionHeading
            eyebrow="Problem"
            title="Capek Hitung Manual yang Sering Salah?"
            subtitle="Percetakan modern ada yang terus rugi karena masalah-masalah ini membuat masalah kecil menjadi masalah harian Anda."
          />
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {PAIN_POINTS.map((item, index) => (
            <article
              key={item.title}
              data-reveal
              className="reveal-base rounded-[28px] border border-rose-200 bg-rose-50/70 p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(244,63,94,0.12)] sm:p-6"
              style={{ transitionDelay: `${index * 70}ms` }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-[var(--shadow-sm)]">
                <XCircle size={22} />
              </div>
              <h3 className="mt-5 text-xl font-bold leading-8 text-[var(--text-primary)]">{item.title}</h3>
              <p className="mt-3 leading-7 text-[var(--text-secondary)]">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
