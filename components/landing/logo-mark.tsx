export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#2447F9" />
      <path
        d="M9 22c0-6 4-6 7-6s7 0 7-6"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="23" cy="10" r="2.2" fill="#fff" />
      <circle cx="9" cy="22" r="2.2" fill="#fff" />
    </svg>
  );
}
