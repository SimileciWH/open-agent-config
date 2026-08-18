interface MascotSvgProps {
  size: number;
}

/** Original Kimi-inspired mark for the agent picker, not an official logo. */
export function KimiMascot({ size }: MascotSvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="kimi-gradient" x1="4" y1="3" x2="20" y2="21">
          <stop offset="0" stopColor="#6d8cff" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#kimi-gradient)" />
      <path
        d="M8 7.5v9M8 12h3.2l4.4-4.5M11.2 12l4.8 4.5"
        fill="none"
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="m17.6 5.6.45 1.35 1.35.45-1.35.45-.45 1.35-.45-1.35-1.35-.45 1.35-.45.45-1.35Z"
        fill="#fff"
        opacity=".92"
      />
    </svg>
  );
}
