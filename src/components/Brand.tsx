export function Brand({ workspace = false }: { workspace?: boolean }) {
  return (
    <a
      className={workspace ? 'brand workspace-brand' : 'auth-brand'}
      href="/"
      aria-label="STEM Challenge Hub home"
    >
      <svg
        aria-hidden="true"
        className={workspace ? 'brand-mark workspace-brand-mark' : 'auth-brand-mark'}
        viewBox="0 0 40 40"
      >
        {/* Gradient definitions for premium look */}
        <defs>
          <linearGradient id="stemGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#2451d4', stopOpacity: 0.9 }} />
            <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 0.9 }} />
          </linearGradient>
          <linearGradient id="stemGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#f97316', stopOpacity: 0.9 }} />
            <stop offset="100%" style={{ stopColor: '#ec4899', stopOpacity: 0.9 }} />
          </linearGradient>
          <radialGradient id="stemCenter">
            <stop offset="0%" style={{ stopColor: '#fff', stopOpacity: 0.9 }} />
            <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 0.95 }} />
          </radialGradient>
        </defs>
        
        {/* Outer ring with glow effect */}
        <circle cx="20" cy="20" r="18" fill="none" stroke="#e9d5ff" strokeWidth="0.5" opacity="0.6" />
        
        {/* Orbital paths */}
        <ellipse
          cx="20"
          cy="20"
          rx="17"
          ry="6.5"
          fill="none"
          stroke="url(#stemGradient1)"
          strokeWidth="2.8"
          strokeLinecap="round"
          transform="rotate(-35 20 20)"
          opacity="0.85"
        />
        <ellipse
          cx="20"
          cy="20"
          rx="17"
          ry="6.5"
          fill="none"
          stroke="url(#stemGradient2)"
          strokeWidth="2.8"
          strokeLinecap="round"
          transform="rotate(35 20 20)"
          opacity="0.85"
        />
        
        {/* Center sphere with glow */}
        <circle cx="20" cy="20" r="3.5" fill="url(#stemCenter)" />
        <circle cx="20" cy="20" r="2.8" fill="#7c3aed" opacity="0.9" />
        
        {/* Orbital nodes */}
        <circle cx="9.5" cy="26.4" r="2.3" fill="#2451d4" opacity="0.9" />
        <circle cx="9.5" cy="26.4" r="1.2" fill="#fff" opacity="0.4" />
        
        <circle cx="30.5" cy="26.4" r="2.3" fill="#f97316" opacity="0.9" />
        <circle cx="30.5" cy="26.4" r="1.2" fill="#fff" opacity="0.4" />
      </svg>
      <span className="brand-label">
        <strong>STEM</strong>{' '}<span>Challenge Hub</span>
      </span>
    </a>
  )
}
