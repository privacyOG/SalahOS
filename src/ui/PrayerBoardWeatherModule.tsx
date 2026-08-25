import type { PrayerBoardWeatherSnapshot } from '../domain/prayerBoardTemplate';
import type { Locale } from '../i18n/translations';
import type { PrayerBoardWeatherDetails } from '../platform/prayerBoardWeather';
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
  readonly feelsLike: string;
  readonly highLow: string;
  readonly rainChance: string;
  readonly humidity: string;
  readonly wind: string;
  readonly uv: string;
  readonly sunrise: string;
  readonly sunset: string;
  readonly updated: string;
  readonly cached: string;
  readonly approximate: string;
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
    feelsLike: 'Feels',
    highLow: 'High / low',
    rainChance: 'Rain',
    humidity: 'Humidity',
    wind: 'Wind',
    uv: 'UV',
    sunrise: 'Sunrise',
    sunset: 'Sunset',
    updated: 'Updated',
    cached: 'Cached',
    approximate: 'Approx. location',
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
    feelsLike: 'المحسوسة',
    highLow: 'العظمى / الصغرى',
    rainChance: 'المطر',
    humidity: 'الرطوبة',
    wind: 'الرياح',
    uv: 'الأشعة',
    sunrise: 'الشروق',
    sunset: 'الغروب',
    updated: 'آخر تحديث',
    cached: 'بيانات محفوظة',
    approximate: 'موقع تقريبي',
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
    feelsLike: 'Hissedilen',
    highLow: 'Yüksek / düşük',
    rainChance: 'Yağmur',
    humidity: 'Nem',
    wind: 'Rüzgâr',
    uv: 'UV',
    sunrise: 'Gün doğumu',
    sunset: 'Gün batımı',
    updated: 'Güncellendi',
    cached: 'Önbellek',
    approximate: 'Yaklaşık konum',
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
    feelsLike: 'Terasa',
    highLow: 'Tinggi / rendah',
    rainChance: 'Hujan',
    humidity: 'Kelembapan',
    wind: 'Angin',
    uv: 'UV',
    sunrise: 'Matahari terbit',
    sunset: 'Matahari terbenam',
    updated: 'Diperbarui',
    cached: 'Tersimpan',
    approximate: 'Lokasi perkiraan',
  },
};

type WeatherView = PrayerBoardWeatherSnapshot & Partial<PrayerBoardWeatherDetails>;

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

function rounded(value: number | null | undefined): string | null {
  return typeof value === 'number' && Number.isFinite(value) ? String(Math.round(value)) : null;
}

function percentage(value: number | null | undefined): string | null {
  const number = rounded(value);
  return number === null ? null : `${number}%`;
}

function clockTime(value: string | null | undefined, locale: Locale): string | null {
  if (typeof value !== 'string') return null;
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) return null;
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-AU' : locale, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(instant);
}

export function PrayerBoardWeatherModule({
  weather,
  locale,
}: Readonly<{ weather: WeatherView | null; locale: Locale }>) {
  if (
    weather === null ||
    (weather.state !== 'ready' && weather.state !== 'stale') ||
    weather.temperatureC === null
  ) {
    return null;
  }

  const text = copy[locale];
  const feelsLike = rounded(weather.feelsLikeC);
  const high = rounded(weather.highC);
  const low = rounded(weather.lowC);
  const rain = percentage(weather.precipitationProbabilityPercent);
  const humidity = percentage(weather.humidityPercent);
  const wind = rounded(weather.windSpeedKmh);
  const uv = rounded(weather.uvIndex);
  const sunrise = clockTime(weather.sunriseAtIso, locale);
  const sunset = clockTime(weather.sunsetAtIso, locale);
  const updated = clockTime(weather.fetchedAtIso ?? weather.observedAtIso, locale);
  const approximate =
    weather.locationSource === 'native-network-approximate' ||
    weather.locationSource === 'browser-network-approximate' ||
    (typeof weather.locationAccuracyMeters === 'number' && weather.locationAccuracyMeters > 250);

  return (
    <aside
      className="prayer-board-weather"
      aria-label={text.label}
      data-weather-state={weather.state}
    >
      <div className="prayer-board-weather__primary">
        <strong>{Math.round(weather.temperatureC)}°C</strong>
        <span>{localizedSummary(locale, weather.summary)}</span>
        {feelsLike !== null && (
          <small>
            {text.feelsLike} {feelsLike}°
          </small>
        )}
      </div>
      <div className="prayer-board-weather__details">
        {high !== null && low !== null && (
          <span>
            <small>{text.highLow}</small>
            <strong>
              {high}° / {low}°
            </strong>
          </span>
        )}
        {rain !== null && (
          <span>
            <small>{text.rainChance}</small>
            <strong>{rain}</strong>
          </span>
        )}
        {humidity !== null && (
          <span>
            <small>{text.humidity}</small>
            <strong>{humidity}</strong>
          </span>
        )}
        {wind !== null && (
          <span>
            <small>{text.wind}</small>
            <strong>{wind} km/h</strong>
          </span>
        )}
        {uv !== null && (
          <span>
            <small>{text.uv}</small>
            <strong>{uv}</strong>
          </span>
        )}
        {sunrise !== null && (
          <span>
            <small>{text.sunrise}</small>
            <strong>{sunrise}</strong>
          </span>
        )}
        {sunset !== null && (
          <span>
            <small>{text.sunset}</small>
            <strong>{sunset}</strong>
          </span>
        )}
      </div>
      <small className="prayer-board-weather__freshness">
        {weather.state === 'stale' ? `${text.cached} · ` : ''}
        {updated === null ? text.updated : `${text.updated} ${updated}`}
        {approximate ? ` · ${text.approximate}` : ''}
      </small>
    </aside>
  );
}
