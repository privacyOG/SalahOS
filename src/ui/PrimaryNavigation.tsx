export type PrimaryNavigationItem = Readonly<{
  id: string;
  label: string;
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
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
