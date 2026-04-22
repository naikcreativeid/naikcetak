export default function SectionHeading({ eyebrow, title, subtitle, center = true }) {
  return (
    <div className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl'}>
      {eyebrow ? (
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-[var(--brand-blue)] sm:mb-5">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.14] tracking-[-0.02em] text-[var(--text-primary)] sm:leading-[1.08]">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-6 text-base leading-7 text-[var(--text-secondary)] sm:mt-7 sm:text-lg sm:leading-8">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
