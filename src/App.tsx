import { useEffect, useState } from 'react';
import { applyDocumentLocale, localeDirection, translate } from './i18n/i18n';
import type { Locale, TranslationKey } from './i18n/translations';

const prayers: readonly TranslationKey[] = [
  'prayerFajr',
  'prayerDhuhr',
  'prayerAsr',
  'prayerMaghrib',
  'prayerIsha',
];

export function App() {
  const [locale, setLocale] = useState<Locale>('en');

  useEffect(() => {
    applyDocumentLocale(document.documentElement, locale);
  }, [locale]);

  const direction = localeDirection(locale);

  return (
    <main className="app-shell" dir={direction}>
      <header className="hero">
        <div className="hero-toolbar">
          <p className="eyebrow">{translate(locale, 'appName')}</p>
          <label className="language-control">
            <span>{translate(locale, 'language')}</span>
            <select
              aria-label={translate(locale, 'language')}
              value={locale}
              onChange={(event) => setLocale(event.target.value as Locale)}
            >
              <option value="en">{translate(locale, 'english')}</option>
              <option value="ar">{translate(locale, 'arabic')}</option>
            </select>
          </label>
        </div>
        <h1>{translate(locale, 'heroTitle')}</h1>
        <p className="hero-copy">{translate(locale, 'heroCopy')}</p>
      </header>

      <section className="status-card" aria-labelledby="today-heading">
        <div>
          <p className="label">{translate(locale, 'currentLocation')}</p>
          <p className="value">{translate(locale, 'notConfigured')}</p>
        </div>
        <div>
          <p className="label">{translate(locale, 'calculationSource')}</p>
          <p className="value">{translate(locale, 'notConfigured')}</p>
        </div>
      </section>

      <section className="prayer-panel" aria-labelledby="today-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{translate(locale, 'today')}</p>
            <h2 id="today-heading">{translate(locale, 'dailyPrayers')}</h2>
          </div>
          <p className="next-prayer">{translate(locale, 'configureLocation')}</p>
        </div>

        <div className="prayer-grid">
          {prayers.map((prayer) => (
            <article className="prayer-card" key={prayer}>
              <span>{translate(locale, prayer)}</span>
              <strong aria-label={translate(locale, 'notConfigured')}>—</strong>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
