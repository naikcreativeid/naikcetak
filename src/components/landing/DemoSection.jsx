import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { DEMO_TABS, REGISTER_URL } from './constants';
import { FeatureMockup } from './Mockups';

export default function DemoSection() {
  const [activeTab, setActiveTab] = useState(DEMO_TABS[0].id);
  const activeContent = DEMO_TABS.find((tab) => tab.id === activeTab) ?? DEMO_TABS[0];

  return (
    <section id="demo" className="bg-white px-4 py-24 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="reveal-base" data-reveal>
          <SectionHeading
            eyebrow="Demo Produk"
            title="Lihat NaikCetak Beraksi"
            subtitle="Software yang dirancang khusus untuk percetakan Indonesia."
          />
        </div>

        <div data-reveal className="reveal-base mt-12 rounded-[32px] border border-[var(--border)] bg-[var(--bg-gray)] p-3 shadow-[var(--shadow-md)] sm:p-4 lg:rounded-[36px] lg:p-6">
          <div className="overflow-x-auto">
            <div className="flex min-w-max border-b border-[var(--border)]">
              {DEMO_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-4 text-sm font-semibold whitespace-nowrap transition sm:px-6 ${
                    activeTab === tab.id
                      ? 'text-[var(--brand-blue)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`absolute inset-x-4 bottom-0 h-0.5 rounded-full transition ${
                      activeTab === tab.id ? 'bg-[var(--brand-blue)] opacity-100' : 'opacity-0'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
            <div className="transition-opacity duration-300">
              <FeatureMockup variant={activeContent.id} />
            </div>
            <div className="rounded-[28px] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--brand-blue)]">Preview</p>
              <h3 className="mt-4 text-2xl font-bold leading-[1.18] text-[var(--text-primary)] sm:text-3xl">{activeContent.title}</h3>
              <p className="mt-4 leading-7 text-[var(--text-secondary)]">{activeContent.subtitle}</p>
              <a
                href={REGISTER_URL}
                className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[var(--brand-blue)] px-5 py-3 text-sm font-bold text-white transition duration-200 hover:scale-[1.02] hover:bg-[var(--brand-blue-dark)]"
              >
                Coba Gratis Sekarang <ArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
