import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { LOGIN_URL, NAV_LINKS, REGISTER_URL } from './constants';
import BrandLogo from '../BrandLogo';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-[var(--border)] bg-white/85 backdrop-blur-xl'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 lg:px-8">
        <a href="#top">
          <BrandLogo
            markClassName="h-11 w-11 shrink-0"
            textClassName="text-lg text-[var(--text-primary)]"
            subtitle="Untuk percetakan Indonesia"
          />
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-[var(--text-secondary)] transition hover:text-[var(--brand-blue)]"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={LOGIN_URL}
            className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:border-[var(--brand-blue)] hover:text-[var(--brand-blue)]"
          >
            Masuk
          </a>
          <a
            href={REGISTER_URL}
            className="rounded-xl bg-[var(--brand-blue)] px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:scale-[1.02] hover:bg-[var(--brand-blue-dark)]"
          >
            Coba Gratis
          </a>
        </div>

        <button
          type="button"
          aria-label="Buka menu"
          onClick={() => setMenuOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-primary)] md:hidden"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-[var(--border)] bg-white px-4 pb-6 pt-4 md:hidden">
          <div className="space-y-3">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-3 py-3 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--brand-blue-light)] hover:text-[var(--brand-blue)]"
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className="mt-4 grid gap-3">
            <a
              href={LOGIN_URL}
              className="rounded-xl border border-[var(--border)] px-4 py-3 text-center text-sm font-semibold text-[var(--text-primary)]"
            >
              Masuk
            </a>
            <a
              href={REGISTER_URL}
              className="rounded-xl bg-[var(--brand-blue)] px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Coba Gratis
            </a>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
