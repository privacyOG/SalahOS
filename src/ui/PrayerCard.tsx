export interface PrayerCardProps {
  readonly prayerName: string;
  readonly isCurrent: boolean;
  readonly isNext: boolean;
  readonly isSupplementary: boolean;
  readonly currentPrayerLabel: string;
  readonly prayerStartLabel: string;
  readonly startTime: string;
  readonly iqamahLabel: string;
  readonly iqamahTime: string;
  readonly highLatitudeIndicator?: string | null;
  readonly manualAdjustmentIndicator?: string | null;
}

export function PrayerCard({
  prayerName,
  isCurrent,
  isNext,
  isSupplementary,
  currentPrayerLabel,
  prayerStartLabel,
  startTime,
  iqamahLabel,
  iqamahTime,
  highLatitudeIndicator = null,
  manualAdjustmentIndicator = null,
}: PrayerCardProps) {
  const classes = [
    'prayer-card',
    isCurrent ? 'prayer-card-current' : '',
    isNext ? 'prayer-card-next' : '',
    isSupplementary ? 'prayer-card-supplementary' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={classes}>
      <div>
        <span>{prayerName}</span>
        {isCurrent && <span className="current-prayer-badge">{currentPrayerLabel}</span>}
      </div>
      <div className="prayer-times">
        <div>
          <span className="prayer-time-label">{prayerStartLabel}</span>
          <strong>{startTime}</strong>
        </div>
        {!isSupplementary && (
          <div>
            <span className="prayer-time-label">{iqamahLabel}</span>
            <strong className="iqamah-time">{iqamahTime}</strong>
          </div>
        )}
      </div>
      <div className="prayer-card-badges">
        {highLatitudeIndicator !== null && (
          <span className="prayer-indicator high-latitude-indicator">
            {highLatitudeIndicator}
          </span>
        )}
        {manualAdjustmentIndicator !== null && (
          <span className="prayer-indicator manual-adjustment-indicator">
            {manualAdjustmentIndicator}
          </span>
        )}
      </div>
    </article>
  );
}
