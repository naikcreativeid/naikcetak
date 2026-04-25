export function NaikCetakLogoMark({
  className = '',
  color = '#2F43D3',
  title = 'NaikCetak',
}) {
  return (
    <svg
      viewBox="0 0 1080 1080"
      role="img"
      aria-label={title}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <rect x="112" y="541" width="228" height="228" fill={color} />
      <rect x="740" y="311" width="228" height="228" fill={color} />
      <path
        d="M282 311H512C512 437.989 615.011 541 742 541V769C488.503 769 283 563.497 283 310L282 311Z"
        fill={color}
      />
    </svg>
  );
}

export default function BrandLogo({
  className = '',
  markClassName = '',
  textClassName = '',
  stacked = false,
  color = '#2F43D3',
  showText = true,
  subtitle,
}) {
  return (
    <div className={`flex ${stacked ? 'flex-col items-start' : 'items-center'} gap-3 ${className}`}>
      <NaikCetakLogoMark className={markClassName} color={color} />
      {showText ? (
        <div className="min-w-0">
          <div className={`font-extrabold tracking-tight ${textClassName}`}>NaikCetak</div>
          {subtitle ? <div className="text-xs text-[var(--text-muted)]">{subtitle}</div> : null}
        </div>
      ) : null}
    </div>
  );
}
