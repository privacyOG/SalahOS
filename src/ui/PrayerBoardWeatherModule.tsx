import type { PrayerBoardWeatherSnapshot } from '../domain/prayerBoardTemplate';
import type { Locale } from '../i18n/translations';
import './prayer-board-weather.css';

interface WeatherCopy {
  readonly label: string;
  readonly clear: string;
  readonly partlyCloudy: string;
  readonly overcast: string;
  readonly fog: string;
  readonly drizzle: string;
  readonly rain: string;
  readonly snow: string;
  readonly showers: string;
  readonly snowShowers: string;
  readonly thunderstorm: string;
  readonly weather: string;
}

const copy: Readonly<Record<Locale, WeatherCopy>> = {
  en: {
    label: 'Weather',
    clear: 'Clear',
    partlyCloudy: 'Partly cloudy',
    overcast: 'Overcast',
    fog: 'Fog',
    drizzle: 'Drizzle',
    rain: 'Rain',
    snow: 'Snow',
    showers: 'Showers',
    snowShowers: 'Snow showers',
    thunderstorm: 'Thunderstorm',
    weather: 'Weather',
  },
  ar: {
    label: 'الطقس',
    clear: 'صافٍ',
    partlyCloudy: 'غائم جزئياً',
    overcast: 'غائم',
    fog: 'ضباب',
    drizzle: 'رذاذ',
    rain: 'مطر',
    snow: 'ثلج',
    showers: 'زخات',
    snowShowers: 'زخات ثلجية',
    thunderstorm: 'عاصفة رعدية',
    weather: 'الطقس',
  },
  tr: {
    label: 'Hava',
    clear: 'Açık',
    partlyCloudy: 'Parçalı bulutlu',
    overcast: 'Kapalı',
    fog: 'Sis',
    drizzle: 'Çiseleme',
    rain: 'Yağmur',
    snow: 'Kar',
    showers: 'Sağanak',
    snowShowers: 'Kar sağanağı',
    thunderstorm: 'Gök gürültülü fırtına',
    weather: 'Hava',
  },
  id: {
    label: 'Cuaca',
    clear: 'Cerah',
    partlyCloudy: 'Berawan sebagian',
    overcast: 'Berawan',
    fog: 'Kabut',
    drizzle: 'Gerimis',
    rain: 'Hujan',
    snow: 'Salju',
    showers: 'Hujan singkat',
    snowShowers: 'Hujan salju',
    thunderstorm: 'Badai petir',
    weather: 'Cuaca',
  },
};

function localizedSummary(locale: Locale, summary: string | null): string {
  const text = copy[locale];
  switch (summary) {
    case 'Clear':
      return text.clear;
    case 'Partly cloudy':
      return text.partlyCloudy;
    case 'Overcast':
      return text.overcast;
    case 'Fog':
      return text.fog;
    case 'Drizzle':
      return text.drizzle;
    case 'Rain':
      return text.rain;
    case 'Snow':
      return text.snow;
    case 'Showers':
      return text.showers;
    case 'Snow showers':
      return text.snowShowers;
    case 'Thunderstorm':
      return text.thunderstorm;
    default:
      return text.weather;
  }
}

export function PrayerBoardWeatherModule({
  weather,
  locale,
}: Readonly<{ weather: PrayerBoardWeatherSnapshot | null; locale: Locale }>) {
  if (weather?.state !== 'ready' || weather.temperatureC === null) return null;
  return (
    <aside className="prayer-board-weather" aria-label={copy[locale].label}>
      <strong>{Math.round(weather.temperatureC)}°C</strong>
      <span>{localizedSummary(locale, weather.summary)}</span>
    </aside>
  );
}
