import type { SVGProps } from 'react';

const P: Record<string, React.ReactNode> = {
  book: <><path d="M3 5.5C5.5 4.5 8.5 4.5 12 6.5c3.5-2 6.5-2 9-1V19c-2.5-1-5.5-1-9 1-3.5-2-6.5-2-9-1z" /><path d="M12 6.5V20" /><path d="M6 9h3M6 12h3M15 9h3M15 12h3" /></>,
  medkit: <><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M12 8.5v7M8.5 12h7" /></>,
  chip: <><rect x="6" y="6" width="12" height="12" rx="1.5" /><rect x="9.5" y="9.5" width="5" height="5" /><path d="M9 2.5v3.5M12 2.5v3.5M15 2.5v3.5M9 18v3.5M12 18v3.5M15 18v3.5M2.5 9H6M2.5 12H6M2.5 15H6M18 9h3.5M18 12h3.5M18 15h3.5" /></>,
  pin: <><path d="M12 13.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /><path d="M12 21s-6.5-6-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15 12 21 12 21z" /></>,
  map: <><path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z" /><path d="M9 4v13.5M15 6.5V20" /></>,
  layers: <><path d="m12 3 9 4.5-9 4.5-9-4.5z" /><path d="m3 12 9 4.5 9-4.5" /><path d="m3 16.5 9 4.5 9-4.5" /></>,
  bolt: <path d="M13 2 4.5 13.5H12L11 22l8.5-11.5H12z" />,
  drop: <path d="M12 3s6.5 7 6.5 11.5a6.5 6.5 0 0 1-13 0C5.5 10 12 3 12 3z" />,
  radio: <><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M7 8 17 3" /><circle cx="15.5" cy="14" r="3" /><path d="M6 12h4M6 15h4" /></>,
  flame: <path d="M12 22c4 0 7-2.7 7-6.8 0-4.6-4-6.7-4.5-11.2C11 6 9.5 9 9.8 11.5 8.3 10.6 7.6 9 7.5 8 5.8 10 5 12.4 5 15.2 5 19.3 8 22 12 22z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5z" /></>,
  tool: <path d="M14.5 6.5a4 4 0 0 0 5 5L21 13l-8 8-2.5-2.5 1.5-1.5L4 9 3 4l5 1 8 8 1.5-1.5L16 10a4 4 0 0 0-1.5-3.5z" />,
  food: <><path d="M5 3v7a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M7 3v18" /><path d="M17 21V3c-2.2 1.2-3.5 3.8-3.5 7v3H17" /></>,
  shield: <path d="M12 2.5 4 5.5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10v-6z" />,
  light: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" /></>,
  tent: <><path d="M12 3 2 20h20z" /><path d="m12 3 5 17M12 3 7 20" /><path d="M10 20l2-5 2 5" /></>,
  sprout: <><path d="M12 21v-9" /><path d="M12 12c0-4-3-6.5-7.5-6.5C4.5 10 7.5 12 12 12zM12 10c0-3.5 2.5-6 7-6 0 4-2.5 6-7 6z" /></>,
  jar: <><rect x="6" y="7" width="12" height="14" rx="2" /><path d="M7.5 3h9v4h-9zM9 12h6" /></>,
  people: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6" /><circle cx="17" cy="9" r="2.5" /><path d="M16 14c3 0 5 2.2 5 5" /></>,
  storage: <><rect x="5" y="2.5" width="14" height="19" rx="2" /><path d="M9 6h1M12 6h1M15 6h1M9 17.5h6" /></>,
  wifiOff: <><path d="M2 2l20 20" /><path d="M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.7M14.5 10.4A10 10 0 0 1 19 13M2 9a15 15 0 0 1 4.3-2.8M10.5 5.1A15 15 0 0 1 22 9" /><circle cx="12" cy="20" r=".8" /></>,
  wifi: <><path d="M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 14 0M2 9.5a15 15 0 0 1 20 0" /><circle cx="12" cy="20" r=".8" /></>,
  download: <><path d="M12 3v12M7 10l5 5 5-5" /><path d="M4 17v3h16v-3" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.4-4.4" /></>,
  send: <path d="M21 3 3 10.5l7.5 2.5L13 21z" />,
  close: <path d="M5 5l14 14M19 5 5 19" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  check: <path d="m4.5 12.5 5 5 10-11" />,
  trash: <path d="M4 6.5h16M9 6.5V4h6v2.5M6 6.5l1 14h10l1-14" />,
  bookmark: <path d="M6 3h12v18l-6-4.5L6 21z" />,
  locate: <><circle cx="12" cy="12" r="6.5" /><circle cx="12" cy="12" r="2" /><path d="M12 2v3.5M12 18.5V22M2 12h3.5M18.5 12H22" /></>,
  home: <><path d="M3 11 12 3.5 21 11" /><path d="M5.5 9.5V20h13V9.5" /></>,
  cart: <><path d="M3 3.5h2.5l2.4 11.5h10.6L21 7H6.4" /><circle cx="9.5" cy="19.5" r="1.4" /><circle cx="17" cy="19.5" r="1.4" /></>,
  power: <><path d="M12 2.5v9" /><path d="M6.3 6.3a8 8 0 1 0 11.4 0" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>,
  external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
  battery: <><rect x="2.5" y="7" width="17" height="10" rx="2" /><path d="M22 10.5v3M6 10v4M9.5 10v4" /></>,
  stop: <rect x="6" y="6" width="12" height="12" rx="1.5" />,
};

export default function Icon({ name, size = 22, ...rest }: { name: string; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {P[name] ?? P.book}
    </svg>
  );
}
