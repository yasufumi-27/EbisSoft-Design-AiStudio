import type { SVGProps } from "react";

/** サービス・強みカードなどで使うアイコンのキー */
export type IconKey =
  | "layout"
  | "target"
  | "cart"
  | "code"
  | "refresh"
  | "search"
  | "gauge"
  | "palette"
  | "shield"
  | "headset"
  | "rocket"
  | "chart"
  | "check"
  | "arrowRight"
  | "phone"
  | "mail"
  | "pin"
  | "clock"
  | "sparkles"
  | "cube"
  | "film"
  | "award"
  | "user"
  | "chat"
  | "share"
  | "plug"
  | "bolt"
  | "play"
  | "external"
  | "ar"
  | "mic"
  | "globe"
  | "bot"
  | "bell"
  | "calc"
  | "sliders"
  | "flask"
  | "heart"
  | "cpu";

const base: SVGProps<SVGSVGElement> = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const iconMap: Record<IconKey, (props: SVGProps<SVGSVGElement>) => React.ReactElement> = {
  layout: (p) => (
    <svg {...base} {...p}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  ),
  target: (p) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  ),
  cart: (p) => (
    <svg {...base} {...p}>
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
      <path d="M2 3h3l2.4 12.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L22 7H6" />
    </svg>
  ),
  code: (p) => (
    <svg {...base} {...p}>
      <path d="m8 18-6-6 6-6M16 6l6 6-6 6" />
    </svg>
  ),
  refresh: (p) => (
    <svg {...base} {...p}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
    </svg>
  ),
  search: (p) => (
    <svg {...base} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  gauge: (p) => (
    <svg {...base} {...p}>
      <path d="M12 14 8 9" />
      <path d="M3.5 18a9 9 0 1 1 17 0" />
      <circle cx="12" cy="14" r="1.5" />
    </svg>
  ),
  palette: (p) => (
    <svg {...base} {...p}>
      <path d="M12 3a9 9 0 1 0 0 18 2.5 2.5 0 0 0 2-4 2.5 2.5 0 0 1 2-4h1a4 4 0 0 0 4-4 9 9 0 0 0-9-6Z" />
      <circle cx="8" cy="11" r="1" />
      <circle cx="12" cy="8" r="1" />
      <circle cx="16" cy="11" r="1" />
    </svg>
  ),
  shield: (p) => (
    <svg {...base} {...p}>
      <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  ),
  headset: (p) => (
    <svg {...base} {...p}>
      <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
      <path d="M4 13a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2ZM20 13a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2Z" />
      <path d="M20 19a4 4 0 0 1-4 3h-2" />
    </svg>
  ),
  rocket: (p) => (
    <svg {...base} {...p}>
      <path d="M5 13c-1.5 1.5-2 5-2 5s3.5-.5 5-2c.8-.8.8-2 0-3a2 2 0 0 0-3 0Z" />
      <path d="M14 6c2.5-2.5 6-2 6-2s.5 3.5-2 6l-7 7-4-4 7-7Z" />
      <circle cx="15" cy="9" r="1" />
    </svg>
  ),
  chart: (p) => (
    <svg {...base} {...p}>
      <path d="M3 3v18h18" />
      <path d="m7 14 3-4 3 2 4-6" />
    </svg>
  ),
  check: (p) => (
    <svg {...base} {...p}>
      <path d="m5 12 5 5L20 7" />
    </svg>
  ),
  arrowRight: (p) => (
    <svg {...base} {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  phone: (p) => (
    <svg {...base} {...p}>
      <path d="M4 4h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 4 6 2 2 0 0 1 4 4Z" />
    </svg>
  ),
  mail: (p) => (
    <svg {...base} {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  ),
  pin: (p) => (
    <svg {...base} {...p}>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  ),
  clock: (p) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  sparkles: (p) => (
    <svg {...base} {...p}>
      <path d="M12 4l1.7 4.6L18 10l-4.3 1.4L12 16l-1.7-4.6L6 10l4.3-1.4L12 4Z" />
      <path d="M18.5 14l.8 2.1 2 .7-2 .8-.8 2-.8-2-2-.8 2-.7.8-2.1Z" />
    </svg>
  ),
  cube: (p) => (
    <svg {...base} {...p}>
      <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" />
      <path d="M4 7.5 12 12l8-4.5M12 12v9" />
    </svg>
  ),
  film: (p) => (
    <svg {...base} {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
    </svg>
  ),
  award: (p) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="9" r="5.5" />
      <path d="m8.8 13.5-1.8 7 5-3 5 3-1.8-7" />
    </svg>
  ),
  user: (p) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </svg>
  ),
  chat: (p) => (
    <svg {...base} {...p}>
      <path d="M21 12a8 8 0 0 1-8 8H8l-4 3v-5.5A8 8 0 0 1 8 4h5a8 8 0 0 1 8 8Z" />
      <path d="M9 11h.01M12.5 11h.01M16 11h.01" />
    </svg>
  ),
  share: (p) => (
    <svg {...base} {...p}>
      <circle cx="18" cy="5" r="2.6" />
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="18" cy="19" r="2.6" />
      <path d="m8.4 10.8 7.2-4.2M8.4 13.2l7.2 4.2" />
    </svg>
  ),
  cpu: (p) => (
    <svg {...base} {...p}>
      <rect x="6.5" y="6.5" width="11" height="11" rx="2" />
      <rect x="10" y="10" width="4" height="4" rx="1" />
      <path d="M9.5 3v3.5M14.5 3v3.5M9.5 17.5V21M14.5 17.5V21M3 9.5h3.5M3 14.5h3.5M17.5 9.5H21M17.5 14.5H21" />
    </svg>
  ),
  plug: (p) => (
    <svg {...base} {...p}>
      <path d="M9 3v6M15 3v6" />
      <path d="M6.5 9h11v2.5a5.5 5.5 0 0 1-11 0V9Z" />
      <path d="M12 17v4" />
    </svg>
  ),
  bolt: (p) => (
    <svg {...base} {...p}>
      <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />
    </svg>
  ),
  play: (p) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="m10 8.5 6 3.5-6 3.5v-7Z" />
    </svg>
  ),
  ar: (p) => (
    <svg {...base} {...p}>
      <path d="M3 8V5a2 2 0 0 1 2-2h3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3" />
      <path d="M12 8.2 8 10.4v4.4l4 2.2 4-2.2v-4.4L12 8.2Z" />
      <path d="M8 10.4 12 12.6l4-2.2M12 12.6V17" />
    </svg>
  ),
  mic: (p) => (
    <svg {...base} {...p}>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5V21M9 21h6" />
    </svg>
  ),
  globe: (p) => (
    <svg {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
    </svg>
  ),
  bot: (p) => (
    <svg {...base} {...p}>
      <rect x="4" y="8" width="16" height="11" rx="3" />
      <path d="M12 4.5V8M9.5 13h.01M14.5 13h.01M9 16.5h6" />
      <circle cx="12" cy="3.5" r="1.2" />
      <path d="M2 12.5v3M22 12.5v3" />
    </svg>
  ),
  bell: (p) => (
    <svg {...base} {...p}>
      <path d="M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5Z" />
      <path d="M10.3 19a2 2 0 0 0 3.4 0" />
    </svg>
  ),
  calc: (p) => (
    <svg {...base} {...p}>
      <rect x="4" y="2.5" width="16" height="19" rx="2.5" />
      <path d="M8 7h8" />
      <path d="M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01" />
    </svg>
  ),
  sliders: (p) => (
    <svg {...base} {...p}>
      <path d="M4 7h10M18 7h2M4 12h4M12 12h8M4 17h12M20 17h0" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="17" r="2" />
    </svg>
  ),
  flask: (p) => (
    <svg {...base} {...p}>
      <path d="M9 3h6v5l4.5 9a2.5 2.5 0 0 1-2.2 3.7H6.7A2.5 2.5 0 0 1 4.5 17L9 8V3Z" />
      <path d="M6.6 13h10.8" />
    </svg>
  ),
  heart: (p) => (
    <svg {...base} {...p}>
      <path d="M12 20s-7-4.3-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7 2.8C19 15.7 12 20 12 20Z" />
    </svg>
  ),
  external: (p) => (
    <svg {...base} {...p}>
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
    </svg>
  ),
};

export function Icon({
  name,
  className,
  ...props
}: { name: IconKey; className?: string } & SVGProps<SVGSVGElement>) {
  const Cmp = iconMap[name];
  return <Cmp className={className} {...props} />;
}
