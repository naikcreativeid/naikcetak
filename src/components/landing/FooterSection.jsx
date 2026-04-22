import { Instagram, Linkedin, Printer, Youtube } from 'lucide-react';
import { APP_URL, FOOTER_LINKS } from './constants';

const socials = [
  { label: 'Instagram', href: APP_URL, icon: Instagram },
  { label: 'LinkedIn', href: APP_URL, icon: Linkedin },
  { label: 'YouTube', href: APP_URL, icon: Youtube },
];

export default function FooterSection() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-gray)] px-4 py-14 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-dark)] text-white">
                <Printer size={20} />
              </div>
              <div>
                <p className="text-lg font-extrabold text-[var(--text-primary)]">NaikCetak</p>
                <p className="text-sm text-[var(--text-secondary)]">Naik level, jangan naik risiko rugi.</p>
              </div>
            </div>
            <p className="mt-5 max-w-sm leading-7 text-[var(--text-secondary)]">
              SaaS manajemen percetakan yang membantu owner hitung lebih cepat, jual lebih rapi, dan melayani klien lebih profesional.
            </p>
            <div className="mt-6 flex gap-3">
              {socials.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-[var(--text-secondary)] transition hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
                    aria-label={social.label}
                  >
                    <Icon size={18} />
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
          © 2026 NaikCetak. Dibuat dengan ❤️ untuk percetakan Indonesia.
        </div>
      </div>
    </footer>
  );
}
