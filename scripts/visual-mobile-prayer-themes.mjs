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

const scenarios = [
  {
    name: 'mobile-theme-heritage-phone-minimum-en',
    templateId: 'heritage-classic',
    accentPreset: 'jewel',
    locale: 'en',
    width: 320,
    height: 720,
  },
  {
    name: 'mobile-theme-minimal-phone-en',
    templateId: 'minimal-modern',
    accentPreset: 'emerald',
    locale: 'en',
    width: 390,
    height: 844,
  },
  {
    name: 'mobile-theme-bold-phone-landscape-en',
    templateId: 'bold-countdown-focus',
    accentPreset: 'midnight',
    locale: 'en',
    width: 844,
    height: 390,
  },
  {
    name: 'mobile-theme-structured-tablet-en',
    templateId: 'structured-split-board',
    accentPreset: 'neutral',
    locale: 'en',
    width: 1024,
    height: 1366,
  },
  {
    name: 'mobile-theme-scenic-large-phone-en',
    templateId: 'scenic-spiritual',
    accentPreset: 'jewel',
    locale: 'en',
    width: 430,
    height: 932,
  },
  {
    name: 'mobile-theme-family-phone-ar-rtl',
    templateId: 'family-classroom',
    accentPreset: 'sandstone',
    locale: 'ar',
    width: 390,
    height: 844,
  },
];

function settingsFor(locale) {
  return {
    version: 2,
    locale,
    theme: locale === 'ar' ? 'dark' : 'light',
    timeFormat: 'h23',
    calculationMethodId: 'muslim-world-league',
    asrConvention: 'standard',
    highLatitudeRule: 'angle-based',
    hijriCorrectionDays: 0,
    prayerAdjustments: {},
    prayerSourceMode: 'local-mosque',
    location: {
      coordinates: { latitude: -33.8688, longitude: 151.2093 },
      timeZone: 'Australia/Sydney',
    },
    mosqueTimetable: {
      mosqueName: 'SalahOS Community Masjid & Learning Centre',
      days: [
        {
          date: '2026-08-21',
          prayers: {
            fajr: { startLocalMinutes: 300, iqamah: { kind: 'fixed', localMinutes: 330 } },
            dhuhr: { startLocalMinutes: 780, iqamah: { kind: 'fixed', localMinutes: 810 } },
            asr: { startLocalMinutes: 930, iqamah: { kind: 'fixed', localMinutes: 960 } },
            maghrib: { startLocalMinutes: 1080, iqamah: { kind: 'fixed', localMinutes: 1090 } },
            isha: { startLocalMinutes: 1170, iqamah: { kind: 'fixed', localMinutes: 1200 } },
          },
          jumuahSessions: [
            { label: 'Jumu‘ah 1', khutbahLocalMinutes: 780, salahLocalMinutes: 800 },
            { label: 'Jumu‘ah 2', khutbahLocalMinutes: 840, salahLocalMinutes: 860 },
          ],
        },
      ],
    },
    notifications: {},
  };
}

function mobileConfigFor(scenario) {
  return {
    version: 1,
    templateId: scenario.templateId,
    primaryLocale: scenario.locale,
    languageMode: 'single',
    timeFormat: 'h23',
    accentPreset: scenario.accentPreset,
  };
}

async function seed(page, scenario) {
  await page.addInitScript(
    ({ now, settings, mobileConfig }) => {
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
      if (localStorage.getItem('salahos.settings') === null) {
        localStorage.setItem('salahos.settings', JSON.stringify(settings));
      }
      if (localStorage.getItem('salahos.mobilePrayerBoardDisplayConfig') === null) {
        localStorage.setItem(
          'salahos.mobilePrayerBoardDisplayConfig',
          JSON.stringify(mobileConfig),
        );
      }
    },
    {
      now: fixedNow,
      settings: settingsFor(scenario.locale),
      mobileConfig: mobileConfigFor(scenario),
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

async function assertNoHorizontalOverflow(page, name) {
  const overflow = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
  }));
  if (overflow.body > overflow.width + 2 || overflow.document > overflow.width + 2) {
    throw new Error(`${name} horizontal overflow: ${JSON.stringify(overflow)}`);
  }
}

async function assertPrayerBoardDataBoundary(page, name) {
  const today = page.locator('main.today-screen');
  if ((await today.getAttribute('data-prayer-board-data-version')) !== '1') {
    throw new Error(`${name} did not render through PrayerBoardData v1`);
  }
  if ((await today.getAttribute('data-prayer-board-source')) !== 'local-mosque') {
    throw new Error(`${name} did not preserve the PrayerBoardData source mode`);
  }
}

async function validateTheme(browser, scenario) {
  const context = await browser.newContext({
    viewport: { width: scenario.width, height: scenario.height },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  try {
    await seed(page, scenario);
    await page.goto(`${baseUrl}/?view=today`, { waitUntil: 'networkidle' });
    const surface = page.locator('.mobile-prayer-theme-surface');
    await surface.waitFor({ state: 'visible' });
    if ((await surface.getAttribute('data-mobile-prayer-template')) !== scenario.templateId) {
      throw new Error(`${scenario.name} did not apply ${scenario.templateId}`);
    }
    await assertPrayerBoardDataBoundary(page, scenario.name);
    const obligatoryPrayerRows = page.locator(
      '.today-prayer-row:not(.today-prayer-row--header):not(.is-supplementary)',
    );
    if ((await obligatoryPrayerRows.count()) !== 5) {
      throw new Error(`${scenario.name} did not preserve exactly five obligatory prayer rows`);
    }
    if ((await page.locator('.today-prayer-row.is-supplementary').count()) !== 1) {
      throw new Error(`${scenario.name} did not preserve Sunrise as one supplementary row`);
    }
    if (scenario.locale === 'ar' && (await surface.getAttribute('dir')) === 'ltr') {
      throw new Error(`${scenario.name} lost RTL presentation`);
    }
    await assertNoHorizontalOverflow(page, scenario.name);
    if (errors.length > 0) throw new Error(`${scenario.name} page errors: ${errors.join(' | ')}`);
    await capture(page, scenario.name);

    if (scenario.name === 'mobile-theme-minimal-phone-en') {
      await context.setOffline(true);
      await page.evaluate(() => {
        window.dispatchEvent(new Event('offline'));
      });
      await page.locator('.today-screen__offline').waitFor({ state: 'visible' });
      await assertPrayerBoardDataBoundary(page, `${scenario.name}-offline`);
      await capture(page, 'mobile-theme-minimal-phone-offline-en');
    }

    return { name: scenario.name, templateId: scenario.templateId };
  } finally {
    await context.close();
  }
}

async function validateSelectorFlow(browser) {
  const scenario = scenarios[1];
  const context = await browser.newContext({ viewport: { width: 430, height: 932 } });
  const page = await context.newPage();
  try {
    await seed(page, scenario);
    await page.goto(`${baseUrl}/?view=settings&settingsView=display-themes`, {
      waitUntil: 'networkidle',
    });
    const editor = page.locator('.settings-display-entry .mobile-prayer-theme-settings');
    await editor.waitFor({ state: 'visible' });
    if ((await editor.locator('[data-mobile-theme-choice]').count()) !== 6) {
      throw new Error('Phone/Home theme selector must expose exactly six designs');
    }
    const managedDisplayLink = page.locator(
      '.settings-display-entry > .surface-entry-card__action',
    );
    if ((await managedDisplayLink.count()) !== 1) {
      throw new Error('TV/kiosk managed-display theme target must remain separately reachable');
    }

    await editor.locator('[data-mobile-theme-choice="scenic-spiritual"]').click();
    const apply = editor.locator('.mobile-prayer-theme-settings__actions button.primary');
    if (!(await apply.isDisabled())) {
      throw new Error('Phone/Home apply must remain disabled until preview');
    }
    await editor.locator('.mobile-prayer-theme-settings__actions button.secondary').click();
    await page.locator('.mobile-theme-preview-dialog').waitFor({ state: 'visible' });
    await capture(page, 'mobile-theme-selector-preview-en');
    await page.locator('.mobile-theme-preview-dialog__toolbar button').click();
    if (await apply.isDisabled()) throw new Error('Phone/Home apply did not unlock after preview');
    await apply.click();

    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('salahos.mobilePrayerBoardDisplayConfig');
      return raw === null ? null : JSON.parse(raw);
    });
    if (stored?.templateId !== 'scenic-spiritual') {
      throw new Error(`Phone/Home selection was not persisted: ${JSON.stringify(stored)}`);
    }

    await page.goto(`${baseUrl}/?view=today`, { waitUntil: 'networkidle' });
    if (
      (await page
        .locator('.mobile-prayer-theme-surface')
        .getAttribute('data-mobile-prayer-template')) !== 'scenic-spiritual'
    ) {
      throw new Error('Applied Phone/Home selection was not rendered on Today');
    }
    await assertPrayerBoardDataBoundary(page, 'mobile-theme-selector-applied-today-en');
    await capture(page, 'mobile-theme-selector-applied-today-en');
    return { selectorApplied: stored.templateId };
  } finally {
    await context.close();
  }
}

async function validateQibla(browser) {
  const context = await browser.newContext({ viewport: { width: 430, height: 932 } });
  const page = await context.newPage();
  const transparentPixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );
  await page.route('https://tile.openstreetmap.org/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: transparentPixel }),
  );

  try {
    await seed(page, scenarios[1]);
    await page.goto(`${baseUrl}/?view=qiblah`, { waitUntil: 'networkidle' });
    const compass = page.locator('.qibla-compass-dial');
    await compass.waitFor({ state: 'visible' });
    if ((await compass.locator('.qibla-degree-label').count()) !== 12) {
      throw new Error('Qibla compass must show degree numbers every 30 degrees');
    }
    if ((await compass.locator('.qibla-cardinal-label').count()) !== 4) {
      throw new Error('Qibla compass must show four cardinal labels');
    }
    if ((await compass.locator('.qibla-intercardinal-label').count()) !== 4) {
      throw new Error('Qibla compass must show four intercardinal labels');
    }
    if ((await compass.locator('.qibla-tick').count()) !== 72) {
      throw new Error('Qibla compass must show 5-degree tick marks around the complete dial');
    }
    if ((await page.locator('.qibla-map-consent').count()) !== 0) {
      throw new Error('Qibla map must not be hidden behind the removed privacy-consent gate');
    }
    await assertNoHorizontalOverflow(page, 'qibla-premium-phone-en');
    await capture(page, 'qibla-premium-compass-phone-en');

    await page.locator('.qibla-view-switch button').nth(1).click();
    const map = page.locator('.qibla-map-shell');
    await map.waitFor({ state: 'visible' });
    if ((await map.getAttribute('data-map-provider')) !== 'openstreetmap') {
      throw new Error('No-key visual build must retain the OpenStreetMap Qibla map fallback');
    }
    await assertNoHorizontalOverflow(page, 'qibla-premium-map-phone-en');
    await capture(page, 'qibla-premium-map-phone-en');
    return { degreeLabels: 12, ticks: 72, provider: 'openstreetmap' };
  } finally {
    await context.close();
  }
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const results = [];
  for (const scenario of scenarios) results.push(await validateTheme(browser, scenario));
  results.push(await validateSelectorFlow(browser));
  results.push(await validateQibla(browser));
  await writeFile(
    path.join(artifactDirectory, 'mobile-prayer-theme-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(`Mobile prayer theme/Qibla visual acceptance passed: ${results.length} flows`);
} finally {
  await browser.close();
}
