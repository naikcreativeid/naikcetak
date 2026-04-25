import { Instagram, Music4 } from 'lucide-react';
import { FOOTER_LINKS, INSTAGRAM_URL, TIKTOK_URL } from './constants';
import BrandLogo from '../BrandLogo';

const socials = [
  { label: 'TikTok', href: TIKTOK_URL, icon: Music4, handle: '@naikcetak.app' },
  { label: 'Instagram', href: INSTAGRAM_URL, icon: Instagram, handle: '@naikcetakapp' },
];

export default function FooterSection() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-gray)] px-4 py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <BrandLogo
              markClassName="h-12 w-12 shrink-0"
              textClassName="text-lg text-[var(--text-primary)]"
              subtitle="Naik level, jangan naik risiko rugi."
            />
            <p className="mt-5 max-w-sm leading-7 text-[var(--text-secondary)]">
              SaaS manajemen percetakan yang membantu owner hitung lebih cepat, jual lebih rapi, dan melayani klien lebih profesional.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {socials.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-[var(--text-secondary)] transition hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
                    aria-label={social.label}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-gray)]">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{social.label}</p>
                      <p className="text-xs text-[var(--text-muted)]">{social.handle}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--text-primary)]">{group.title}</p>
              <div className="mt-5 space-y-3">
                {group.items.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="block text-[15px] text-[var(--text-secondary)] transition hover:text-[var(--brand-blue)]"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-[var(--border)] pt-6 text-sm text-[var(--text-secondary)]">
          &copy; 2026 NaikCetak. Dibuat untuk membantu percetakan Indonesia bekerja lebih rapi dan lebih untung.
        </div>
      </div>
    </footer>
  );
}
