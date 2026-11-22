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
        <ellipse
          cx="20"
          cy="20"
          rx="17"
          ry="6.5"
          fill="none"
          stroke="#2451d4"
          strokeWidth="2.5"
          transform="rotate(-35 20 20)"
        />
        <ellipse
          cx="20"
          cy="20"
          rx="17"
          ry="6.5"
          fill="none"
          stroke="#f97316"
          strokeWidth="2.5"
          transform="rotate(35 20 20)"
        />
        <circle cx="20" cy="20" r="3" fill="#7c3aed" />
        <circle cx="9.5" cy="26.4" r="2" fill="#2451d4" />
        <circle cx="30.5" cy="26.4" r="2" fill="#f97316" />
      </svg>
      <span className="brand-label">
        <strong>STEM</strong>{' '}<span>Challenge Hub</span>
      </span>
    </a>
  )
}
