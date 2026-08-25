import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const baseUrl = process.env.SALAHOS_VISUAL_BASE_URL ?? 'http://127.0.0.1:4173';
const playwrightModule = process.env.SALAHOS_VISUAL_PLAYWRIGHT_MODULE;
const artifactDirectory = path.resolve(
  process.env.SALAHOS_VISUAL_ARTIFACT_DIR ?? 'visual-artifacts',
);

if (!playwrightModule) {
  throw new Error('SALAHOS_VISUAL_PLAYWRIGHT_MODULE must point to the isolated Playwright module');
}

const { chromium } = await import(pathToFileURL(playwrightModule).href);
const weatherEndpoint = 'https://api.open-meteo.com/v1/forecast';

function settings() {
  return {
    version: 2,
    locale: 'en',
    theme: 'dark',
    timeFormat: 'h23',
    calculationMethodId: 'muslim-world-league',
    asrConvention: 'standard',
    highLatitudeRule: 'angle-based',
    hijriCorrectionDays: 0,
    prayerAdjustments: {},
    prayerSourceMode: 'calculated',
    location: {
      coordinates: { latitude: -33.8688, longitude: 151.2093 },
      timeZone: 'Australia/Sydney',
    },
    mosqueTimetable: null,
    notifications: {},
  };
}

function boardConfig() {
  return {
    version: 1,
    templateId: 'minimal-modern',
    primaryLocale: 'en',
    languageMode: 'single',
    timeFormat: 'h23',
    accentPreset: 'midnight',
    moduleVisibility: {
      'current-time': true,
      dates: true,
      'next-prayer': true,
      countdown: true,
      'prayer-timetable': true,
      jumuah: true,
      'sunrise-sunset': true,
      'mosque-branding': true,
      announcements: false,
      weather: true,
    },
    branding: {
      mosqueName: { en: 'Stage 23 Weather Masjid' },
      logo: null,
    },
    background: { kind: 'builtin', artworkId: 'quiet-grid' },
  };
}

function weatherResponse() {
  return {
    current: {
      time: 1787614200,
      temperature_2m: 18.4,
      apparent_temperature: 17.2,
      relative_humidity_2m: 67,
      weather_code: 2,
      wind_speed_10m: 11.5,
    },
    daily: {
      temperature_2m_max: [21.3],
      temperature_2m_min: [12.6],
      precipitation_probability_max: [35],
      uv_index_max: [4.2],
      sunrise: [1787583600],
      sunset: [1787626800],
    },
  };
}

async function seedBase(page, weatherPayload) {
  await page.addInitScript(
    ({ serializedSettings, serializedBoard, serializedWeather }) => {
      localStorage.setItem('salahos.settings', serializedSettings);
      localStorage.setItem('salahos.prayerBoardDisplayConfig', serializedBoard);
      if (serializedWeather === null) {
        localStorage.removeItem('salahos.prayerBoardWeather');
      } else if (localStorage.getItem('salahos.prayerBoardWeather') === null) {
        localStorage.setItem('salahos.prayerBoardWeather', serializedWeather);
      }
    },
    {
      serializedSettings: JSON.stringify(settings()),
      serializedBoard: JSON.stringify(boardConfig()),
      serializedWeather: weatherPayload === null ? null : JSON.stringify(weatherPayload),
    },
  );
}

async function capture(page, name) {
  await page.screenshot({
    path: path.join(artifactDirectory, `${name}.png`),
    fullPage: false,
    animations: 'disabled',
  });
}

async function validateAutomaticWeatherFromAvailableLocation(browser) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  let providerRequests = 0;
  await page.route(`${weatherEndpoint}**`, async (route) => {
    providerRequests += 1;
    const requestUrl = route.request().url();
    if (
      !requestUrl.includes('latitude=-33.8688') ||
      !requestUrl.includes('longitude=151.2093')
    ) {
      throw new Error(`automatic weather request did not use the available location: ${requestUrl}`);
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(weatherResponse()),
    });
  });

  try {
    await seedBase(page, null);
    await page.goto(`${baseUrl}/?mode=smart-display`, { waitUntil: 'networkidle' });
    const weather = page.locator('.prayer-board-weather');
    await weather.waitFor({ state: 'visible' });
    const weatherText = (await weather.textContent()) ?? '';
    if (!weatherText.includes('18°C') || !weatherText.includes('Partly cloudy')) {
      throw new Error('automatic weather did not render current conditions');
    }
    if (providerRequests < 1) {
      throw new Error('automatic weather provider was not contacted');
    }
    if ((await page.locator('.minimal-modern-prayer').count()) !== 5) {
      throw new Error('automatic weather changed the obligatory prayer table');
    }
    await capture(page, 'prayer-board-weather-automatic-location-en');
    return { automaticProviderRequests: providerRequests, rendered: true };
  } finally {
    await context.close();
  }
}

async function validateConfiguredWeatherAndFallback(browser) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  let providerFails = false;
  let providerRequests = 0;
  await page.route(`${weatherEndpoint}**`, async (route) => {
    providerRequests += 1;
    const requestUrl = route.request().url();
    if (
      !requestUrl.includes('latitude=-33.8688') ||
      !requestUrl.includes('longitude=151.2093')
    ) {
      throw new Error(`weather request did not use resolved coordinates: ${requestUrl}`);
    }
    if (providerFails) {
      await route.abort();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(weatherResponse()),
    });
  });

  const weatherPayload = {
    version: 1,
    config: {
      version: 1,
      enabled: true,
      provider: 'open-meteo',
      latitude: -33.8688,
      longitude: 151.2093,
      locationLabel: 'Sydney',
    },
    cache: null,
  };

  try {
    await seedBase(page, weatherPayload);
    await page.goto(`${baseUrl}/?mode=smart-display`, { waitUntil: 'networkidle' });
    const weather = page.locator('.prayer-board-weather');
    await weather.waitFor({ state: 'visible' });
    if (!(await weather.textContent()).includes('18°C')) {
      throw new Error('resolved-location weather temperature did not render');
    }
    if (!(await weather.textContent()).includes('Partly cloudy')) {
      throw new Error('resolved-location weather summary did not render');
    }
    if (providerRequests < 1) throw new Error('weather provider was not contacted');
    if ((await page.locator('.minimal-modern-prayer').count()) !== 5) {
      throw new Error('weather changed the obligatory prayer table');
    }
    await capture(page, 'prayer-board-weather-ready-en');

    providerFails = true;
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('.prayer-board-weather').waitFor({ state: 'visible' });
    if (!(await page.locator('.prayer-board-weather').textContent()).includes('18°C')) {
      throw new Error('fresh last-known-good weather did not survive provider failure');
    }
    if ((await page.locator('.minimal-modern-prayer').count()) !== 5) {
      throw new Error('provider failure interrupted prayer rendering');
    }
    await capture(page, 'prayer-board-weather-provider-failure-cache-en');

    await page.evaluate(() => {
      const raw = localStorage.getItem('salahos.prayerBoardWeather');
      if (raw === null) throw new Error('weather cache is missing');
      const payload = JSON.parse(raw);
      if (payload.cache === null) throw new Error('weather cache was not populated');
      payload.cache.cachedAtIso = '2026-08-21T00:00:00.000Z';
      localStorage.setItem('salahos.prayerBoardWeather', JSON.stringify(payload));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(250);
    if ((await page.locator('.prayer-board-weather').count()) !== 0) {
      throw new Error('expired weather cache rendered a stale placeholder');
    }
    if ((await page.locator('.minimal-modern-prayer').count()) !== 5) {
      throw new Error('expired weather cache interrupted prayer rendering');
    }
    await capture(page, 'prayer-board-weather-expired-hidden-en');

    return { providerRequests, cacheFallback: true, expiredHidden: true };
  } finally {
    await context.close();
  }
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const results = [
    await validateAutomaticWeatherFromAvailableLocation(browser),
    await validateConfiguredWeatherAndFallback(browser),
  ];
  await writeFile(
    path.join(artifactDirectory, 'prayer-board-weather-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(`Prayer-board weather visual checks passed: ${results.length} flows`);
} finally {
  await browser.close();
}
