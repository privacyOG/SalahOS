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

const googleMapsFixture = `
(() => {
  class Listener {
    constructor(remove) { this.remove = remove; }
  }

  class MockMap {
    constructor(element, options) {
      this.element = element;
      this.center = options.center;
      this.zoom = options.zoom;
      this.mapTypeId = options.mapTypeId;
      this.listeners = new globalThis.Map();
      this.fitCount = 0;
      element.dataset.mockGoogleReady = 'true';
      element.dataset.mockMapType = this.mapTypeId;
      globalThis.__salahosGoogleMap = this;
    }
    addListener(name, callback) {
      this.listeners.set(name, callback);
      return new Listener(() => this.listeners.delete(name));
    }
    fitBounds() {
      this.fitCount += 1;
      this.zoom = 4;
      this.element.dataset.mockFitCount = String(this.fitCount);
      this.listeners.get('zoom_changed')?.();
    }
    getZoom() { return this.zoom; }
    setCenter(position) {
      this.center = position;
      this.element.dataset.mockCenter = JSON.stringify(position);
    }
    setMapTypeId(type) {
      this.mapTypeId = type;
      this.element.dataset.mockMapType = type;
    }
    setZoom(zoom) {
      this.zoom = zoom;
      this.element.dataset.mockZoom = String(zoom);
      this.listeners.get('zoom_changed')?.();
    }
  }

  class MockMarker {
    constructor(options) {
      this.options = options;
      this.position = options.position;
      this.map = options.map;
      globalThis.__salahosGoogleMarkers ??= [];
      globalThis.__salahosGoogleMarkers.push(this);
      const marker = document.createElement('span');
      marker.className = options.title.includes('Kaaba')
        ? 'visual-google-kaaba-marker'
        : 'visual-google-user-marker';
      marker.textContent = options.title.includes('Kaaba') ? 'K' : '●';
      options.map.element.append(marker);
      this.element = marker;
    }
    setMap(map) {
      this.map = map;
      if (map === null) this.element.remove();
    }
    setPosition(position) { this.position = position; }
  }

  class MockPolyline {
    constructor(options) {
      this.options = { ...options };
      this.path = options.path;
      this.map = options.map;
      globalThis.__salahosGooglePolylines ??= [];
      globalThis.__salahosGooglePolylines.push(this);
    }
    setMap(map) { this.map = map; }
    setOptions(options) { this.options = { ...this.options, ...options }; }
    setPath(path) { this.path = path; }
  }

  class MockBounds {
    constructor() { this.points = []; }
    extend(position) { this.points.push(position); return this; }
  }

  globalThis.google = {
    maps: {
      Map: MockMap,
      Marker: MockMarker,
      Polyline: MockPolyline,
      LatLngBounds: MockBounds,
    },
  };
})();
`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function seedPage(page) {
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
      localStorage.setItem(
        'salahos.qibla-permission-onboarding',
        JSON.stringify({ version: 1, completed: true }),
      );
    },
    { now: fixedNow, persistedSettings: settings },
  );
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  {
    const context = await browser.newContext({
      viewport: { width: 430, height: 932 },
      permissions: ['geolocation'],
      geolocation: { latitude: -33.8688, longitude: 151.2093, accuracy: 8 },
    });
    const page = await context.newPage();
    const requestedGoogleMapsUrls = [];
    await seedPage(page);
    await page.route('https://maps.googleapis.com/maps/api/js**', (route) => {
      requestedGoogleMapsUrls.push(route.request().url());
      return route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: googleMapsFixture,
      });
    });

    await page.goto(`${baseUrl}/?view=qiblah`, { waitUntil: 'networkidle' });
    await page.locator('.qibla-view-switch button').nth(1).click();
    const map = page.locator('.qibla-map-shell');
    await map.waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      return (
        document.querySelector('.qibla-map-shell')?.getAttribute('data-google-map-state') ===
        'ready'
      );
    });

    assert(
      (await map.getAttribute('data-map-provider')) === 'google-satellite',
      'Google satellite was not the default interactive provider',
    );
    assert(
      requestedGoogleMapsUrls.length === 1,
      `Expected one Google Maps JavaScript request, received ${requestedGoogleMapsUrls.length}`,
    );
    const requestedUrl = new URL(requestedGoogleMapsUrls[0]);
    assert(
      requestedUrl.pathname === '/maps/api/js',
      'Interactive Google Maps loader used the wrong endpoint',
    );
    assert(
      requestedUrl.searchParams.get('key') === 'salahos-visual-fixture-key',
      'Visual fixture did not receive the isolated build-time key',
    );

    const initial = await page.evaluate(() => ({
      mapType: globalThis.__salahosGoogleMap?.mapTypeId,
      fitCount: globalThis.__salahosGoogleMap?.fitCount,
      markers: (globalThis.__salahosGoogleMarkers ?? []).map((marker) => ({
        title: marker.options.title,
        position: marker.position,
      })),
      polylines: (globalThis.__salahosGooglePolylines ?? []).map((line) => ({
        color: line.options.strokeColor,
        weight: line.options.strokeWeight,
        geodesic: line.options.geodesic,
        path: line.path,
      })),
    }));
    assert(initial.mapType === 'satellite', 'Google map did not initialize in Satellite mode');
    assert(initial.fitCount >= 1, 'Google map did not fit the user-to-Kaaba route on first load');
    assert(
      initial.markers.some((marker) => marker.title === 'Current location'),
      'Current-location marker is missing',
    );
    assert(
      initial.markers.some((marker) => marker.title === 'Kaaba, Makkah'),
      'Kaaba marker is missing',
    );
    const satelliteLine = initial.polylines.find((line) => line.color === '#e53e30');
    assert(
      satelliteLine?.weight === 6,
      'Satellite Qiblah route is not the expected thick red line',
    );
    assert(satelliteLine?.geodesic === true, 'Qiblah route is not geodesic');
    assert(
      initial.polylines.some((line) => line.color === '#ffffff' && line.weight === 10),
      'Qiblah route contrast halo is missing',
    );

    await map.getByRole('button', { name: 'Map', exact: true }).click();
    await page.waitForFunction(
      () =>
        document.querySelector('.qibla-map-shell')?.getAttribute('data-map-provider') ===
        'google-roadmap',
    );
    const roadmapColor = await page.evaluate(
      () =>
        globalThis.__salahosGooglePolylines?.find((line) => line.options.zIndex === 2)?.options
          .strokeColor,
    );
    assert(roadmapColor === '#1267d6', 'Roadmap Qiblah route did not switch to high-contrast blue');

    await map.getByRole('button', { name: 'Hybrid', exact: true }).click();
    await page.waitForFunction(
      () =>
        document.querySelector('.qibla-map-shell')?.getAttribute('data-map-provider') ===
        'google-hybrid',
    );
    const hybridColor = await page.evaluate(
      () =>
        globalThis.__salahosGooglePolylines?.find((line) => line.options.zIndex === 2)?.options
          .strokeColor,
    );
    assert(
      hybridColor === '#e53e30',
      'Hybrid Qiblah route did not switch back to imagery-safe red',
    );

    await map.getByRole('button', { name: 'Show full Qiblah route' }).click();
    const refitCount = await page.evaluate(() => globalThis.__salahosGoogleMap?.fitCount ?? 0);
    assert(refitCount >= 2, 'Full-route control did not refit the user-to-Kaaba path');

    await page.evaluate(() => {
      globalThis.__salahosGoogleMap?.listeners.get('click')?.({
        latLng: { lat: () => -33.9, lng: () => 151.1 },
      });
    });
    await page.waitForFunction(() =>
      document.querySelector('.qibla-location-bar')?.textContent?.includes('-33.90000'),
    );
    assert(
      (await page.locator('.qibla-location-bar').textContent())?.includes('151.10000'),
      'Google map click did not preserve manual pin selection',
    );

    const width = await page.evaluate(() => document.documentElement.clientWidth);
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    assert(
      scrollWidth <= width + 2,
      `Interactive Google Qiblah map has horizontal overflow: ${scrollWidth}/${width}`,
    );

    await page.screenshot({
      path: path.join(artifactDirectory, 'qibla-google-interactive-phone-en.png'),
      fullPage: false,
      animations: 'disabled',
    });
    results.push({
      name: 'interactive-google-map',
      provider: await map.getAttribute('data-map-provider'),
      requestHost: requestedUrl.host,
      markers: initial.markers.length,
      polylines: initial.polylines.length,
      refitCount,
    });
    await context.close();
  }

  {
    const context = await browser.newContext({ viewport: { width: 430, height: 932 } });
    const page = await context.newPage();
    await seedPage(page);
    await page.route('https://maps.googleapis.com/maps/api/js**', (route) => route.abort());
    await page.goto(`${baseUrl}/?view=qiblah`, { waitUntil: 'domcontentloaded' });
    await page.locator('.qibla-view-switch button').nth(1).click();
    await page.waitForFunction(() => {
      return (
        document.querySelector('.qibla-map-shell')?.getAttribute('data-google-map-state') ===
        'error'
      );
    });

    const map = page.locator('.qibla-map-shell');
    assert(
      (await map.getAttribute('data-map-provider')) === 'local-fallback',
      'Google provider failure did not activate the local bearing fallback',
    );
    assert(
      (await page.locator('[data-qibla-map-fallback]').count()) === 1,
      'Provider-error local fallback is missing',
    );
    assert(
      (await page.getByRole('button', { name: 'Retry Google Maps' }).count()) === 1,
      'Google provider failure has no retry action',
    );

    const locationBar = page.locator('.qibla-location-bar');
    const before = await locationBar.textContent();
    const fallback = page.locator('[data-qibla-map-fallback]');
    const box = await fallback.boundingBox();
    if (box === null) throw new Error('Local Qiblah fallback has no measurable viewport');
    await fallback.click({
      position: { x: box.width * 0.72, y: box.height * 0.42 },
    });
    await page.waitForFunction(
      (previous) => document.querySelector('.qibla-location-bar')?.textContent !== previous,
      before,
    );
    const after = await locationBar.textContent();
    assert(after !== before, 'Local provider-error fallback did not retain manual pin selection');

    results.push({
      name: 'google-provider-error-fallback',
      provider: await map.getAttribute('data-map-provider'),
      manualPinChanged: after !== before,
    });
    await context.close();
  }

  await writeFile(
    path.join(artifactDirectory, 'qibla-google-interactive-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(`Interactive Google Qiblah map acceptance passed: ${String(results.length)} flows.`);
} finally {
  await browser.close();
}
