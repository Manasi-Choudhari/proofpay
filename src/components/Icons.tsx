type P = { className?: string };

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

export const LockIcon = ({ className = "w-5 h-5" }: P) => (
  <svg {...base} className={className}>
    <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    <path d="M12 14.5v2" />
  </svg>
);

export const ScanIcon = ({ className = "w-5 h-5" }: P) => (
  <svg {...base} className={className}>
    <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </svg>
);

export const BoltIcon = ({ className = "w-5 h-5" }: P) => (
  <svg {...base} className={className}>
    <path d="M13 3 5 13.5h6L10.5 21 19 10.5h-6L13 3Z" />
  </svg>
);

export const KeyIcon = ({ className = "w-4 h-4" }: P) => (
  <svg {...base} className={className}>
    <circle cx="8" cy="15" r="4" />
    <path d="m11 12 8-8M16 7l2 2M14 9l2 2" />
  </svg>
);

export const ShieldIcon = ({ className = "w-4 h-4" }: P) => (
  <svg {...base} className={className}>
    <path d="M12 3 5 6v5.5c0 4.2 2.9 7.9 7 9.5 4.1-1.6 7-5.3 7-9.5V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const ReceiptIcon = ({ className = "w-4 h-4" }: P) => (
  <svg {...base} className={className}>
    <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
    <path d="M9 8h6M9 12h6M9 16h3" />
  </svg>
);

export const CheckIcon = ({ className = "w-4 h-4" }: P) => (
  <svg {...base} strokeWidth={2.25} className={className}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const ArrowIcon = ({ className = "w-4 h-4" }: P) => (
  <svg {...base} strokeWidth={2} className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const UserIcon = ({ className = "w-5 h-5" }: P) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

export const BotIcon = ({ className = "w-5 h-5" }: P) => (
  <svg {...base} className={className}>
    <rect x="4" y="8" width="16" height="12" rx="3" />
    <path d="M12 4v4M9 14h.01M15 14h.01M2 13v3M22 13v3" />
  </svg>
);

export const GithubIcon = ({ className = "w-4 h-4" }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M12 2C6.48 2 2 6.58 2 12.22c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.36-3.37-1.36-.46-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.56 2.35 1.11 2.92.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.4 9.4 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.64 1.03 2.76 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9v2.81c0 .27.18.6.69.49A10.1 10.1 0 0 0 22 12.22C22 6.58 17.52 2 12 2Z" />
  </svg>
);
