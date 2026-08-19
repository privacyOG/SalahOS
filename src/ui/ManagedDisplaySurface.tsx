import type { CSSProperties, KeyboardEvent, ReactNode } from 'react';

import './managed-display-surface.css';

export type ManagedDisplayProfile = 'tv-16x9' | 'portrait-foyer' | 'touch-display-2';

export interface ManagedDisplayPrayer {
  readonly name: string;
  readonly adhan: string;
  readonly iqamah: string | null;
  readonly active?: boolean;
}

interface ManagedDisplaySurfaceProps {
  readonly profile: ManagedDisplayProfile;
  readonly mosqueName: string;
  readonly localDateLabel: string;
  readonly currentTimeLabel: string;
  readonly prayers: readonly ManagedDisplayPrayer[];
  readonly headline?: string | null;
  readonly footer?: ReactNode;
  readonly burnInShift?: number;
  readonly onAdministratorExit?: () => void;
}

export function ManagedDisplaySurface({
  profile,
  mosqueName,
  localDateLabel,
  currentTimeLabel,
  prayers,
  headline = null,
  footer,
  burnInShift = 0,
  onAdministratorExit,
}: ManagedDisplaySurfaceProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' || event.key === 'Backspace') {
      onAdministratorExit?.();
    }
  };

  const frameStyle = { '--display-shift': `${String(burnInShift)}px` } as CSSProperties;

  return (
    <section
      className="managed-display"
      data-profile={profile}
      data-burn-in-shift={String(burnInShift)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label={`${mosqueName} prayer display`}
    >
      <div className="managed-display__frame" style={frameStyle}>
        <header className="managed-display__header">
          <div>
            <p className="managed-display__eyebrow">Prayer times</p>
            <h1>{mosqueName}</h1>
          </div>
          <div className="managed-display__clock" aria-label="Current local time">
            <strong>{currentTimeLabel}</strong>
            <span>{localDateLabel}</span>
          </div>
        </header>

        {headline ? <p className="managed-display__headline">{headline}</p> : null}

        <div className="managed-display__prayers" role="list" aria-label="Prayer schedule">
          {prayers.map((prayer) => (
            <article
              className="managed-display__prayer"
              data-active={prayer.active ? 'true' : 'false'}
              key={prayer.name}
              role="listitem"
            >
              <h2>{prayer.name}</h2>
              <div>
                <span>Adhan</span>
                <strong>{prayer.adhan}</strong>
              </div>
              <div>
                <span>Iqamah</span>
                <strong>{prayer.iqamah ?? '—'}</strong>
              </div>
            </article>
          ))}
        </div>

        <footer className="managed-display__footer">
          <span className="managed-display__recovery">Esc / Back to exit display mode</span>
          {footer}
        </footer>
      </div>
    </section>
  );
}
