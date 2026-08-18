import type { ReactNode } from 'react';

type DesignSurfaceProps = Readonly<{
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  ariaLabel?: string;
}>;

function classes(...values: (string | false | undefined)[]): string {
  return values.filter(Boolean).join(' ');
}

export function DesignSurface({
  children,
  className,
  elevated = false,
  ariaLabel,
}: DesignSurfaceProps) {
  return (
    <section
      className={classes('ds-surface', elevated && 'ds-surface-raised', className)}
      aria-label={ariaLabel}
    >
      {children}
    </section>
  );
}

type StatusPillProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

export function StatusPill({ children, className }: StatusPillProps) {
  return <span className={classes('ds-status-pill', className)}>{children}</span>;
}

type EmptyStateProps = Readonly<{
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}>;

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="ds-empty-state" role="status">
      <div className="ds-stack">
        <strong>{title}</strong>
        {description === undefined ? null : <span>{description}</span>}
        {action === undefined ? null : <div className="ds-inline">{action}</div>}
      </div>
    </div>
  );
}
