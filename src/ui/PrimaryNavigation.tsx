export type PrimaryNavigationIcon = 'today' | 'mosques' | 'qiblah' | 'community' | 'settings';

export type PrimaryNavigationItem = Readonly<{
  id: string;
  label: string;
  icon: PrimaryNavigationIcon;
  current?: boolean;
  onSelect: () => void;
}>;

type PrimaryNavigationProps = Readonly<{
  ariaLabel: string;
  items: readonly PrimaryNavigationItem[];
}>;

function NavigationIcon({ icon }: Readonly<{ icon: PrimaryNavigationIcon }>) {
  const commonProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    focusable: false,
    'aria-hidden': true,
  };

  switch (icon) {
    case 'mosques':
      return (
        <svg {...commonProps}>
          <path d="M4 20h16" />
          <path d="M6.5 20v-6.5h11V20" />
          <path d="M8 13.5a4 4 0 0 1 8 0" />
          <path d="M18.5 20V8.5" />
          <path d="M17.5 8.5h2" />
          <path d="M18.5 6.5v-2" />
        </svg>
      );
    case 'qiblah':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="m14.8 9.2-1.9 4.2-4.2 1.9 1.9-4.2 4.2-1.9Z" />
          <path d="M12 3.5V2" />
        </svg>
      );
    case 'community':
      return (
        <svg {...commonProps}>
          <circle cx="9" cy="9" r="3" />
          <circle cx="16.5" cy="10" r="2.25" />
          <path d="M3.5 19c.45-3.3 2.35-5 5.5-5s5.05 1.7 5.5 5" />
          <path d="M14.5 14.8c2.75-.45 4.7 1 5.4 4.2" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19 12a7.2 7.2 0 0 0-.1-1l2-1.55-2-3.45-2.45 1a7.7 7.7 0 0 0-1.75-1L14.4 3h-4.8L9.3 6a7.7 7.7 0 0 0-1.75 1L5.1 6l-2 3.45L5.1 11a7.2 7.2 0 0 0 0 2L3.1 14.55l2 3.45 2.45-1a7.7 7.7 0 0 0 1.75 1l.3 3h4.8l.3-3a7.7 7.7 0 0 0 1.75-1l2.45 1 2-3.45L18.9 13c.07-.33.1-.66.1-1Z" />
        </svg>
      );
    case 'today':
    default:
      return (
        <svg {...commonProps}>
          <rect x="4" y="5.5" width="16" height="14" rx="2.5" />
          <path d="M8 3.5v4M16 3.5v4M4 9.5h16" />
          <circle cx="12" cy="14" r="2" />
        </svg>
      );
  }
}

export function PrimaryNavigation({ ariaLabel, items }: PrimaryNavigationProps) {
  return (
    <nav className="congregation-nav" aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          type="button"
          className="congregation-nav-item"
          aria-current={item.current === true ? 'page' : undefined}
          key={item.id}
          onClick={item.onSelect}
        >
          <span className="congregation-nav-icon">
            <NavigationIcon icon={item.icon} />
          </span>
          <span className="congregation-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
