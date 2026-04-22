import { useEffect } from 'react';
import Navbar from './landing/Navbar';
import HeroSection from './landing/HeroSection';
import ProblemSection from './landing/ProblemSection';
import FeaturesSection from './landing/FeaturesSection';
import DemoSection from './landing/DemoSection';
import ProofSection from './landing/ProofSection';
import PricingSection from './landing/PricingSection';
import FinalCtaSection from './landing/FinalCtaSection';
import FooterSection from './landing/FooterSection';

const SEO = {
  title: 'NaikCetak — Software Manajemen Percetakan All-in-One untuk Indonesia',
  description:
    'Hitung HPP, biaya cetak, buat invoice profesional, tracking order, dan kelola toko online percetakan kamu dalam satu dashboard. Gratis untuk mulai.',
  ogTitle: 'NaikCetak — Hitung Biaya Cetak 10x Lebih Cepat & Akurat',
  ogDescription:
    'Software percetakan Indonesia: Kalkulator HPP, Potong Kertas, Biaya Cetak, Invoice Generator, Order Tracking, dan AI Assistant. Coba gratis.',
  ogImage: 'https://naikcetak.com/og-image.png',
  keywords:
    'software percetakan, kalkulator HPP percetakan, hitung biaya cetak, invoice percetakan, manajemen percetakan Indonesia',
};

function setMeta(selector, attribute, value) {
  const element = document.querySelector(selector);
  if (element) element.setAttribute(attribute, value);
}

export default function LandingPage() {
  useEffect(() => {
    document.title = SEO.title;
    setMeta('meta[name="description"]', 'content', SEO.description);
    setMeta('meta[name="keywords"]', 'content', SEO.keywords);
    setMeta('meta[property="og:title"]', 'content', SEO.ogTitle);
    setMeta('meta[property="og:description"]', 'content', SEO.ogDescription);
    setMeta('meta[property="og:image"]', 'content', SEO.ogImage);

    const elements = Array.from(document.querySelectorAll('[data-reveal]'));
    elements.forEach((element) => element.classList.add('reveal-base'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -48px 0px' },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="overflow-x-hidden bg-white">
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <DemoSection />
        <ProofSection />
        <PricingSection />
        <FinalCtaSection />
      </main>
      <FooterSection />
    </div>
  );
}
