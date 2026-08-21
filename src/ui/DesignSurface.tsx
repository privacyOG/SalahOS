import type { ButtonHTMLAttributes, ReactNode } from 'react';

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

type DesignButtonVariant = 'primary' | 'secondary' | 'quiet' | 'destructive' | 'icon';

type DesignButtonProps = Readonly<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: DesignButtonVariant;
  }
>;

export function DesignButton({
  variant = 'secondary',
  className,
  type = 'button',
  ...props
}: DesignButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={classes('ds-button', `ds-button--${variant}`, className)}
    />
  );
}

type FormFieldProps = Readonly<{
  htmlFor: string;
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}>;

export function FormField({ htmlFor, label, hint, children, className }: FormFieldProps) {
  return (
    <div className={classes('ds-field', className)}>
      <label className="ds-field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint === undefined ? null : <p className="ds-field__hint">{hint}</p>}
    </div>
  );
}

type StatusPillProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

export function StatusPill({ children, className }: StatusPillProps) {
  return <span className={classes('ds-status-pill', className)}>{children}</span>;
}

export type DesignState =
  'loading' | 'offline' | 'stale' | 'sync-pending' | 'sync-error' | 'permission-denied' | 'empty';

type StateBannerProps = Readonly<{
  state: DesignState;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}>;

export function StateBanner({ state, title, description, action, className }: StateBannerProps) {
  const assertive = state === 'sync-error' || state === 'permission-denied';

  return (
    <div
      className={classes('ds-banner', className)}
      data-state={state}
      role={assertive ? 'alert' : 'status'}
      aria-live={assertive ? 'assertive' : 'polite'}
    >
      <strong>{title}</strong>
      {description === undefined ? null : <span>{description}</span>}
      {action === undefined ? null : <div className="ds-inline">{action}</div>}
    </div>
  );
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

type PrayerRowProps = Readonly<{
  name: ReactNode;
  startTime: ReactNode;
  iqamahTime?: ReactNode;
  className?: string;
}>;

export function PrayerRow({ name, startTime, iqamahTime, className }: PrayerRowProps) {
  return (
    <div className={classes('ds-prayer-row', className)}>
      <span className="ds-prayer-row__name">{name}</span>
      <span className="ds-prayer-row__time">{startTime}</span>
      {iqamahTime === undefined ? null : (
        <span className="ds-prayer-row__iqamah">{iqamahTime}</span>
      )}
    </div>
  );
}

type NextPrayerSummaryProps = Readonly<{
  name: ReactNode;
  startTime: ReactNode;
  iqamahTime?: ReactNode;
  countdown?: ReactNode;
  className?: string;
}>;

export function NextPrayerSummary({
  name,
  startTime,
  iqamahTime,
  countdown,
  className,
}: NextPrayerSummaryProps) {
  return (
    <section className={classes('ds-next-prayer', className)} aria-label="Next prayer">
      <strong className="ds-type-prayer-name">{name}</strong>
      <div className="ds-next-prayer__times">
        <span className="ds-type-prayer-time">{startTime}</span>
        {iqamahTime === undefined ? null : <span className="ds-type-iqamah">{iqamahTime}</span>}
      </div>
      {countdown === undefined ? null : <span className="ds-type-countdown">{countdown}</span>}
    </section>
  );
}

type MosqueSummaryProps = Readonly<{
  name: ReactNode;
  detail?: ReactNode;
  status?: ReactNode;
  className?: string;
}>;

export function MosqueSummary({ name, detail, status, className }: MosqueSummaryProps) {
  return (
    <div className={classes('ds-mosque-summary', className)}>
      <strong>{name}</strong>
      {detail === undefined ? null : <span className="ds-type-metadata">{detail}</span>}
      {status === undefined ? null : <div className="ds-inline">{status}</div>}
    </div>
  );
}

type AnnouncementPreviewProps = Readonly<{
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
  className?: string;
}>;

export function AnnouncementPreview({
  title,
  description,
  meta,
  className,
}: AnnouncementPreviewProps) {
  return (
    <article className={classes('ds-announcement-preview', className)}>
      <strong>{title}</strong>
      {description === undefined ? null : <span>{description}</span>}
      {meta === undefined ? null : <span className="ds-type-caption">{meta}</span>}
    </article>
  );
}
