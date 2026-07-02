import React, { memo } from 'react';

export type IconName =
  | 'cut'
  | 'drop'
  | 'flare'
  | 'eco'
  | 'arrow-right'
  | 'chevron-left'
  | 'chevron-right'
  | 'calendar'
  | 'instagram'
  | 'whatsapp';

interface IconProps {
  name: IconName | string;
  size?: number;
  className?: string;
}

const ICONS: Record<IconName, React.ReactNode> = {
  cut: (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <line x1="20" y1="4" x2="8.12" y2="15.88" />
      <line x1="14.47" y1="14.48" x2="20" y2="20" />
      <line x1="8.12" y1="8.12" x2="12" y2="12" />
    </>
  ),
  drop: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />,
  flare: (
    <>
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.36-6.36-.7.7M6.34 17.66l-.7.7m12.02.7-.7-.7M6.34 6.34l-.7-.7" />
      <circle cx="12" cy="12" r="4" />
    </>
  ),
  eco: (
    <>
      <path d="M2 22c1.25-1.25 2.5-2.5 3.75-2.5C9 16 9 13 12 10c3-3 6-3 9-3-1 4-2 7-5 9s-6 3-9 3c-1.75 0-3.25-.5-5-1z" />
      <path d="M2 22 12 12" />
    </>
  ),
  'arrow-right': (
    <>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </>
  ),
  'chevron-left': <polyline points="15 18 9 12 15 6" />,
  'chevron-right': <polyline points="9 18 15 12 9 6" />,
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  instagram: (
    <>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </>
  ),
  whatsapp: (
    <path
      fill="currentColor"
      stroke="none"
      d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.7.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35z"
    />
  ),
};

function IconBase({ name, size = 24, className }: IconProps): React.ReactElement {
  const content = ICONS[name as IconName] ?? ICONS.cut;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {content}
    </svg>
  );
}

export const Icon = memo(IconBase);
