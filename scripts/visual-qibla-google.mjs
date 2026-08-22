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
const fixedNow = Date.parse('2026-08-21T03:00:00.000Z');
const transparentPixel = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
);

const settings = {
  version: 2,
  locale: 'en',
  theme: 'light',
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

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 430, height: 932 } });
const page = await context.newPage();
const requestedGoogleMapsUrls = [];

try {
  await page.addInitScript(
    ({ now, persistedSettings }) => {
      const NativeDate = Date;
      class FixedDate extends NativeDate {
        constructor(...args) {
          super(...(args.length === 0 ? [now] : args));
        }

        static now() {
          return now;
        }
      }
      globalThis.Date = FixedDate;
      localStorage.setItem('salahos.settings', JSON.stringify(persistedSettings));
    },
    { now: fixedNow, persistedSettings: settings },
  );

  await page.route('https://maps.googleapis.com/maps/api/staticmap**', (route) => {
    requestedGoogleMapsUrls.push(route.request().url());
    return route.fulfill({ status: 200, contentType: 'image/png', body: transparentPixel });
  });

  await page.goto(`${baseUrl}/?view=qiblah`, { waitUntil: 'networkidle' });
  const map = page.locator('.qibla-map-shell');
  await map.waitFor({ state: 'visible' });

  if ((await map.getAttribute('data-map-provider')) !== 'google-satellite') {
    throw new Error('Configured visual build did not select the Google satellite Qibla map');
  }

  const satellite = map.locator('.qibla-map-google-satellite');
  if ((await satellite.count()) !== 1) {
    throw new Error('Google satellite Qibla map image was not rendered');
  }
  if ((await map.locator('.qibla-map-tiles').count()) !== 0) {
    throw new Error('OpenStreetMap tiles rendered while Google satellite mode was selected');
  }
  if (requestedGoogleMapsUrls.length !== 1) {
    throw new Error(
      `Expected one Google Static Maps request, received ${requestedGoogleMapsUrls.length}`,
    );
  }

  const requestedUrl = new URL(requestedGoogleMapsUrls[0]);
  if (requestedUrl.searchParams.get('maptype') !== 'satellite') {
    throw new Error('Google Qibla map request did not use satellite imagery');
  }
  if (requestedUrl.searchParams.get('key') !== 'salahos-visual-fixture-key') {
    throw new Error('Google Qibla visual fixture did not receive the isolated build-time key');
  }
  if ((await map.locator('.qibla-map-bearing-overlay').count()) !== 1) {
    throw new Error('Qibla bearing overlay is missing in Google satellite mode');
  }
  if ((await map.locator('.qibla-map-user-marker').count()) !== 1) {
    throw new Error('Current-location marker is missing in Google satellite mode');
  }
  if ((await map.locator('.qibla-map-kaaba-chip').count()) !== 1) {
    throw new Error('Kaaba context marker is missing in Google satellite mode');
  }

  const width = await page.evaluate(() => document.documentElement.clientWidth);
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  if (scrollWidth > width + 2) {
    throw new Error(
      `Google satellite Qibla fixture has horizontal overflow: ${scrollWidth}/${width}`,
    );
  }

  await page.screenshot({
    path: path.join(artifactDirectory, 'qibla-google-satellite-phone-en.png'),
    fullPage: false,
    animations: 'disabled',
  });
  await writeFile(
    path.join(artifactDirectory, 'qibla-google-satellite-results.json'),
    `${JSON.stringify(
      {
        provider: 'google-satellite',
        requestHost: requestedUrl.host,
        maptype: requestedUrl.searchParams.get('maptype'),
      },
      null,
      2,
    )}\n`,
  );
  console.log('Google satellite Qibla visual acceptance passed');
} finally {
  await context.close();
  await browser.close();
}
