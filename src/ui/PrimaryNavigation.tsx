import { SalahIcon, type SalahIconName } from './SalahIcon';

export type PrimaryNavigationIcon = Extract<
  SalahIconName,
  'today' | 'mosques' | 'qiblah' | 'knowledge' | 'community' | 'settings'
>;

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
            <SalahIcon name={item.icon} />
          </span>
          <span className="congregation-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
