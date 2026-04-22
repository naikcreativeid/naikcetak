export default function SectionHeading({ eyebrow, title, subtitle, center = true }) {
  return (
    <div className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-2xl'}>
      {eyebrow ? (
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-[var(--brand-blue)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-4xl font-extrabold leading-[1.02] tracking-[-0.03em] text-[var(--text-primary)] sm:text-5xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-5 text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
