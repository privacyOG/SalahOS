import type { PrayerBoardTimeFormat } from '../domain/prayerBoardTemplate';
import { formatLocalTime, translate } from '../i18n/i18n';
import type { Locale } from '../i18n/translations';
import { BidiText } from './BidiText';

export interface TodayJumuahPresentationSession {
  readonly label: string | null;
  readonly khutbahLocalMinutes: number | null;
  readonly salahLocalMinutes: number;
}

export interface TodayJumuahSectionProps {
  readonly sessions: readonly TodayJumuahPresentationSession[];
  readonly locale: Locale;
  readonly timeFormat: PrayerBoardTimeFormat;
  readonly promoted?: boolean;
}

export function TodayJumuahSection({
  sessions,
  locale,
  timeFormat,
  promoted = false,
}: TodayJumuahSectionProps) {
  return (
    <section
      className={`today-jumuah${promoted ? ' today-jumuah--promoted' : ''}`}
      aria-labelledby="today-jumuah-title"
      data-today-jumuah-promoted={promoted ? 'true' : 'false'}
    >
      <div className="today-section-heading">
        <div>
          <p>{translate(locale, 'today')}</p>
          <h2 id="today-jumuah-title">{translate(locale, 'jumuah')}</h2>
        </div>
      </div>
      <div className="today-jumuah__sessions">
        {sessions.map((session, index) => (
          <div
            key={`${session.label ?? 'jumuah'}-${String(session.salahLocalMinutes)}-${String(index)}`}
          >
            <strong>
              <BidiText>{session.label ?? translate(locale, 'jumuah')}</BidiText>
            </strong>
            {session.khutbahLocalMinutes !== null && (
              <span>
                {translate(locale, 'khutbah')} ·{' '}
                {formatLocalTime(session.khutbahLocalMinutes, locale, timeFormat)}
              </span>
            )}
            <span>
              {translate(locale, 'salah')} ·{' '}
              {formatLocalTime(session.salahLocalMinutes, locale, timeFormat)}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
