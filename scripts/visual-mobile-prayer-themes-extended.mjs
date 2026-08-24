import { mkdir } from 'node:fs/promises';
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

const mosqueNames = {
  en: 'SalahOS Community Masjid and Learning Centre for Families and Visitors',
  ar: 'مسجد ومركز صلاح أو إس المجتمعي للتعليم وخدمة العائلات والزوار',
  tr: 'SalahOS Merkez Camii Eğitim Toplum ve Aile Hizmetleri Merkezi',
  id: 'Masjid Komunitas SalahOS dan Pusat Pendidikan Keluarga serta Pengunjung',
};

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
      mosqueName: mosqueNames[locale],
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
        },
      ],
    },
    notifications: {},
  };
}

async function seed(page, locale, templateId = 'heritage-classic') {
  await page.addInitScript(
    ({ now, settings, config }) => {
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
      localStorage.setItem('salahos.settings', JSON.stringify(settings));
      localStorage.setItem('salahos.mobilePrayerBoardDisplayConfig', JSON.stringify(config));
    },
    {
      now: fixedNow,
      settings: settingsFor(locale),
      config: {
        version: 1,
        templateId,
        primaryLocale: locale,
        languageMode: 'single',
        timeFormat: 'h23',
        accentPreset: 'jewel',
      },
    },
  );
}

async function assertNoHorizontalOverflow(page, name) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
  }));
  if (dimensions.body > dimensions.viewport + 2 || dimensions.document > dimensions.viewport + 2) {
    throw new Error(`${name} horizontal overflow: ${JSON.stringify(dimensions)}`);
  }
}

async function capture(page, name) {
  await page.screenshot({
    path: path.join(artifactDirectory, `${name}.png`),
    fullPage: false,
    animations: 'disabled',
  });
}

async function validateTranslatedTheme(browser, scenario) {
  const context = await browser.newContext({
    viewport: scenario.viewport,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  try {
    await seed(page, scenario.locale, scenario.templateId);
    await page.goto(`${baseUrl}/?view=today`, { waitUntil: 'networkidle' });
    const surface = page.locator('.mobile-prayer-theme-surface');
    await surface.waitFor({ state: 'visible' });
    if ((await surface.getAttribute('data-mobile-prayer-template')) !== scenario.templateId) {
      throw new Error(`${scenario.name} did not apply ${scenario.templateId}`);
    }
    if ((await page.locator('.congregation-nav .congregation-nav-item').count()) !== 5) {
      throw new Error(`${scenario.name} did not preserve the five-item primary navigation`);
    }
    if (
      (await page
        .locator('.today-prayer-row:not(.today-prayer-row--header):not(.is-supplementary)')
        .count()) !== 5
    ) {
      throw new Error(`${scenario.name} did not preserve five obligatory prayer rows`);
    }
    await assertNoHorizontalOverflow(page, scenario.name);
    await capture(page, scenario.name);
  } finally {
    await context.close();
  }
}

async function validateQiblaLayout(browser, scenario) {
  const context = await browser.newContext({
    viewport: scenario.viewport,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();

  try {
    await seed(page, scenario.locale);
    await page.goto(`${baseUrl}/?view=qiblah`, { waitUntil: 'networkidle' });
    const compass = page.locator('.qibla-compass-dial');
    await compass.waitFor({ state: 'visible' });
    if ((await compass.locator('.qibla-degree-label').count()) !== 12) {
      throw new Error(`${scenario.name} lost degree-number labels`);
    }
    if ((await compass.locator('.qibla-tick').count()) !== 72) {
      throw new Error(`${scenario.name} lost the 5-degree tick ring`);
    }
    if ((await compass.locator('.qibla-cardinal-label').count()) !== 4) {
      throw new Error(`${scenario.name} lost cardinal labels`);
    }
    if ((await compass.locator('.qibla-intercardinal-label').count()) !== 4) {
      throw new Error(`${scenario.name} lost intercardinal labels`);
    }
    const box = await compass.boundingBox();
    if (box === null || box.width < 220 || box.height < 220) {
      throw new Error(`${scenario.name} compass is too small for readable directional guidance`);
    }
    await assertNoHorizontalOverflow(page, scenario.name);
    await capture(page, scenario.name);

    await page.locator('.qibla-view-switch button').nth(1).click();
    const map = page.locator('.qibla-map-shell');
    await map.waitFor({ state: 'visible' });
    if ((await map.getAttribute('data-map-provider')) !== 'local-fallback') {
      throw new Error(
        `${scenario.name} must use the network-free no-key fallback provider in the normal visual build`,
      );
    }
    if ((await map.getAttribute('data-google-map-state')) !== 'unconfigured') {
      throw new Error(
        `${scenario.name} must report Google Maps as unconfigured in the no-key build`,
      );
    }
    if ((await page.locator('[data-qibla-map-fallback]').count()) !== 1) {
      throw new Error(`${scenario.name} is missing the local manual-pin Qiblah fallback`);
    }
    await assertNoHorizontalOverflow(page, `${scenario.name}-map`);
    await capture(page, `${scenario.name}-map`);
  } finally {
    await context.close();
  }
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  await validateTranslatedTheme(browser, {
    name: 'mobile-theme-minimal-phone-tr-long-name',
    locale: 'tr',
    templateId: 'minimal-modern',
    viewport: { width: 390, height: 844 },
  });
  await validateTranslatedTheme(browser, {
    name: 'mobile-theme-scenic-large-phone-id-long-name',
    locale: 'id',
    templateId: 'scenic-spiritual',
    viewport: { width: 430, height: 932 },
  });

  await validateQiblaLayout(browser, {
    name: 'qibla-premium-phone-landscape-en',
    locale: 'en',
    viewport: { width: 844, height: 390 },
  });
  await validateQiblaLayout(browser, {
    name: 'qibla-premium-tablet-en',
    locale: 'en',
    viewport: { width: 1024, height: 1366 },
  });
  await validateQiblaLayout(browser, {
    name: 'qibla-premium-phone-ar-rtl',
    locale: 'ar',
    viewport: { width: 390, height: 844 },
  });

  console.log('Extended mobile theme and Qibla acceptance passed');
} finally {
  await browser.close();
}
