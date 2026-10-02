// Inline SVG artwork: coin faces and the brand mark. Tonal gold only, no hard gradients.
export function CoinFace({ label = 'SVN', sub = 'AU 999.9', className = '', id = 'c' }) {
  return (
    <svg className={className} viewBox="0 0 200 200" role="img" aria-label={`${label} coin`}>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e6cb82" />
          <stop offset="0.5" stopColor="#c9a24b" />
          <stop offset="1" stopColor="#9a762b" />
        </linearGradient>
        <linearGradient id={`${id}-rim`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0d994" />
          <stop offset="1" stopColor="#8a6a25" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="96" fill={`url(#${id}-rim)`} />
      <circle cx="100" cy="100" r="88" fill={`url(#${id}-body)`} />
      <circle cx="100" cy="100" r="76" fill="none" stroke="#8a6a25" strokeWidth="1.5" strokeDasharray="2 5" opacity="0.8" />
      <circle cx="100" cy="100" r="66" fill="none" stroke="#f0d994" strokeWidth="1" opacity="0.7" />
      <text x="100" y="112" textAnchor="middle" fontFamily="'Bodoni Moda', Georgia, serif" fontWeight="700" fontSize={label.length > 3 ? 40 : 52} fill="#7a5a1c">{label}</text>
      <text x="100" y="112" dx="-1.2" dy="-1.2" textAnchor="middle" fontFamily="'Bodoni Moda', Georgia, serif" fontWeight="700" fontSize={label.length > 3 ? 40 : 52} fill="#f3dc9c" opacity="0.85">{label}</text>
      <text x="100" y="148" textAnchor="middle" fontFamily="'Hanken Grotesk', sans-serif" fontWeight="600" fontSize="11" letterSpacing="2" fill="#7a5a1c">{sub}</text>
    </svg>
  );
}

export function Mark() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="mk" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e6cb82" /><stop offset="1" stopColor="#9a762b" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#mk)" />
      <circle cx="20" cy="20" r="15" fill="none" stroke="#0b1a12" strokeOpacity="0.45" strokeWidth="1" />
      <text x="20" y="27" textAnchor="middle" fontFamily="'Bodoni Moda', Georgia, serif" fontWeight="700" fontSize="21" fill="#0b1a12">S</text>
    </svg>
  );
}

export function Diamond() {
  return (
    <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 0l6 6-6 6-6-6z" fill="currentColor" /></svg>
  );
}

export function Arrow() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 8h11M9 3.5L13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
