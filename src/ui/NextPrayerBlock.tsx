export interface NextPrayerBlockProps {
  readonly nextPrayerLabel: string | null;
  readonly countdown: string;
  readonly tomorrow: boolean;
  readonly nextPrayerText: string;
  readonly notConfiguredText: string;
  readonly tomorrowText: string;
}

export function NextPrayerBlock({
  nextPrayerLabel,
  countdown,
  tomorrow,
  nextPrayerText,
  notConfiguredText,
  tomorrowText,
}: NextPrayerBlockProps) {
  return (
    <div className="next-prayer-block">
      <p>{nextPrayerText}</p>
      <strong>{nextPrayerLabel ?? notConfiguredText}</strong>
      <p className="countdown">{countdown}</p>
      {tomorrow && <p>{tomorrowText}</p>}
    </div>
  );
}
