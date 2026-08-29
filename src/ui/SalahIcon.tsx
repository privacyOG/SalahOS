import type { SVGProps } from 'react';
export type SalahIconName =
  | 'today'
  | 'calendar'
  | 'mosques'
  | 'qiblah'
  | 'knowledge'
  | 'community'
  | 'settings'
  | 'prayer'
  | 'iqamah'
  | 'location'
  | 'display'
  | 'administration';
type Props = Readonly<{ name: SalahIconName; className?: string; title?: string }>;
const common: SVGProps<SVGSVGElement> = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  focusable: false,
};
function Paths({ name }: { name: SalahIconName }) {
  switch (name) {
    case 'calendar':
      return (
        <>
          <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" />
          <path d="M7.5 2.5v4M16.5 2.5v4M3.5 9h17M7 13h2M11 13h2M15 13h2M7 17h2M11 17h2M15 17h2" />
        </>
      );
    case 'mosques':
      return (
        <>
          <path d="M4 20h16M6.5 20v-6.5h11V20M8 13.5a4 4 0 0 1 8 0M18.5 20V8.5M17.5 8.5h2M18.5 6.5v-2" />
        </>
      );
    case 'qiblah':
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="m14.8 9.2-1.9 4.2-4.2 1.9 1.9-4.2 4.2-1.9ZM12 3.5V2" />
        </>
      );
    case 'knowledge':
      return (
        <>
          <path d="M4.5 5.5c2.7-.75 5.2-.25 7.5 1.5v12c-2.3-1.75-4.8-2.25-7.5-1.5v-12ZM19.5 5.5c-2.7-.75-5.2-.25-7.5 1.5v12c2.3-1.75 4.8-2.25 7.5-1.5v-12ZM12 7v12" />
        </>
      );
    case 'community':
      return (
        <>
          <circle cx="9" cy="9" r="3" />
          <circle cx="16.5" cy="10" r="2.25" />
          <path d="M3.5 19c.45-3.3 2.35-5 5.5-5s5.05 1.7 5.5 5M14.5 14.8c2.75-.45 4.7 1 5.4 4.2" />
        </>
      );
    case 'settings':
      return (
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M19 12a7 7 0 0 0-.1-1l2-1.55-2-3.45-2.45 1a7.7 7.7 0 0 0-1.75-1L14.4 3h-4.8L9.3 6a7.7 7.7 0 0 0-1.75 1L5.1 6l-2 3.45L5.1 11a7 7 0 0 0 0 2L3.1 14.55l2 3.45 2.45-1a7.7 7.7 0 0 0 1.75 1l.3 3h4.8l.3-3a7.7 7.7 0 0 0 1.75-1l2.45 1 2-3.45L18.9 13c.07-.33.1-.66.1-1Z" />
        </>
      );
    case 'iqamah':
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7v5l3 2M8 3.5 6.5 2M16 3.5 17.5 2" />
        </>
      );
    case 'location':
      return (
        <>
          <path d="M12 21s6-5.25 6-11a6 6 0 1 0-12 0c0 5.75 6 11 6 11Z" />
          <circle cx="12" cy="10" r="2" />
        </>
      );
    case 'display':
      return (
        <>
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M9 21h6M12 17v4" />
        </>
      );
    case 'administration':
      return (
        <>
          <path d="M12 3 4.5 6v5.5c0 4.5 3 7.5 7.5 9.5 4.5-2 7.5-5 7.5-9.5V6L12 3Z" />
          <path d="M9.5 12 11 13.5l3.5-3.5" />
        </>
      );
    case 'prayer':
      return (
        <>
          <path d="M5 19.5h14M7 19.5v-5.25a5 5 0 0 1 10 0v5.25M9.5 8.5a3.1 3.1 0 0 1 5 0" />
        </>
      );
    default:
      return (
        <>
          <rect x="4" y="5.5" width="16" height="14" rx="2.5" />
          <path d="M8 3.5v4M16 3.5v4M4 9.5h16" />
          <circle cx="12" cy="14" r="2" />
        </>
      );
  }
}
export function SalahIcon({ name, className, title }: Props) {
  return (
    <svg
      {...common}
      className={['salah-icon', className].filter(Boolean).join(' ')}
      aria-hidden={title === undefined ? true : undefined}
      role={title === undefined ? undefined : 'img'}
    >
      {title === undefined ? null : <title>{title}</title>}
      <Paths name={name} />
    </svg>
  );
}
