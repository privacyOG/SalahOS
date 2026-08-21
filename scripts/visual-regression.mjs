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

const fixedNow = Date.parse('2026-08-17T05:30:00.000Z');
const stage22FixedNow = Date.parse('2026-08-21T03:00:00.000Z');

const stage22MosqueLibrary = {
  version: 1,
  selectedProfileId: 'masjid-al-noor:sydney',
  profiles: [
    {
      id: 'masjid-al-noor:sydney',
      organizationId: null,
      parentMosqueId: null,
      name: { en: 'Masjid Al Noor', ar: 'مسجد النور' },
      description: {
        en: 'A local mosque profile used for deterministic congregation visual acceptance.',
        ar: 'ملف مسجد محلي يستخدم لاختبار واجهة جماعة المسجد بصرياً بصورة ثابتة.',
      },
      address: { formatted: '12 Community Street, Sydney NSW', countryCode: 'AU' },
      coordinates: { latitude: -33.873, longitude: 151.207 },
      timeZone: 'Australia/Sydney',
      facilities: ['wudu', 'parking', 'women-prayer-space', 'wheelchair-accessible'],
      accessibilityNotes: null,
      contact: {
        email: 'info@masjidalnoor.example',
        phone: '+61 2 9000 0000',
        links: [],
      },
      logo: null,
    },
    {
      id: 'lakemba-community-mosque:sydney',
      organizationId: null,
      parentMosqueId: null,
      name: { en: 'Lakemba Community Mosque', ar: 'مسجد مجتمع لاكمبا' },
      description: null,
      address: { formatted: '45 Haldon Street, Lakemba NSW', countryCode: 'AU' },
      coordinates: { latitude: -33.919, longitude: 151.075 },
      timeZone: 'Australia/Sydney',
      facilities: ['wudu', 'toilets', 'family-room'],
      accessibilityNotes: null,
      contact: { links: [] },
      logo: null,
    },
  ],
};

const stage22CommunityLibrary = {
  version: 1,
  announcements: [
    {
      announcementId: 'friday-parking',
      mosqueId: 'masjid-al-noor:sydney',
      english: {
        title: 'Friday parking update',
        body: 'Please keep the western access lane clear before Jumu‘ah.',
      },
      arabic: {
        title: 'تحديث مواقف الجمعة',
        body: 'يرجى إبقاء ممر الدخول الغربي خالياً قبل صلاة الجمعة.',
      },
      imageUrl: null,
      callToActionUrl: null,
      priority: 'priority',
      pinned: true,
      surfaces: ['mobile', 'web'],
      startsAt: '2026-08-20T00:00:00.000Z',
      endsAt: '2026-08-22T12:00:00.000Z',
      recurrence: 'none',
      archived: false,
    },
  ],
  events: [
    {
      eventId: 'family-breakfast',
      mosqueId: 'masjid-al-noor:sydney',
      english: {
        title: 'Family breakfast',
        description: 'A community breakfast after the weekend Fajr prayer.',
      },
      arabic: {
        title: 'فطور العائلات',
        description: 'فطور مجتمعي بعد صلاة الفجر في عطلة نهاية الأسبوع.',
      },
      venue: 'Community hall',
      allDay: false,
      startsAt: '2026-08-22T21:00:00.000Z',
      endsAt: '2026-08-22T23:00:00.000Z',
      recurrence: 'none',
      imageUrl: null,
      registrationUrl: null,
      surfaces: ['mobile', 'web'],
    },
  ],
};

function settingsFor(locale, theme, stage22Seed = false) {
  return {
    version: 2,
    locale,
    theme,
    timeFormat: 'h23',
    calculationMethodId: 'muslim-world-league',
    asrConvention: 'standard',
    highLatitudeRule: 'angle-based',
    hijriCorrectionDays: 0,
    prayerAdjustments: {},
    prayerSourceMode: stage22Seed ? 'local-mosque' : 'calculated',
    location: {
      coordinates: {
        latitude: -33.8688,
        longitude: 151.2093,
      },
      timeZone: 'Australia/Sydney',
    },
    mosqueTimetable: stage22Seed
      ? {
          mosqueName: 'Masjid Al Noor',
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
        }
      : null,
    notifications: {},
  };
}

const applicationScenarios = [
  { name: 'phone-portrait-en-light', width: 390, height: 844, locale: 'en', theme: 'light' },
  { name: 'phone-portrait-ar-dark', width: 390, height: 844, locale: 'ar', theme: 'dark' },
  { name: 'phone-landscape-en-dark', width: 844, height: 390, locale: 'en', theme: 'dark' },
  { name: 'tablet-en-light', width: 1024, height: 1366, locale: 'en', theme: 'light' },
  { name: 'tablet-ar-dark', width: 1024, height: 1366, locale: 'ar', theme: 'dark' },
  { name: 'kiosk-1080-en-dark', width: 1920, height: 1080, locale: 'en', theme: 'dark' },
  { name: 'kiosk-1080-ar-light', width: 1920, height: 1080, locale: 'ar', theme: 'light' },
  { name: 'large-4k-en-dark', width: 3840, height: 2160, locale: 'en', theme: 'dark' },
  {
    name: 'phone-large-text-ar-dark',
    width: 390,
    height: 844,
    locale: 'ar',
    theme: 'dark',
    url: '?view=settings',
    fontScale: 1.25,
    readySelector: '.settings-screen',
  },
  {
    name: 'phone-settings-en-light',
    width: 390,
    height: 844,
    locale: 'en',
    theme: 'light',
    url: '?view=settings',
    readySelector: '.settings-category-grid',
  },
  {
    name: 'phone-settings-appearance-ar-dark',
    width: 390,
    height: 844,
    locale: 'ar',
    theme: 'dark',
    url: '?view=settings&settingsView=appearance',
    readySelector: '.settings-focus-panel',
  },
  {
    name: 'tablet-settings-prayer-en-light',
    width: 1024,
    height: 1366,
    locale: 'en',
    theme: 'light',
    url: '?view=settings&settingsView=prayer',
    readySelector: '.settings-focus-panel',
  },
  {
    name: 'phone-settings-mosque-en-light',
    width: 390,
    height: 844,
    locale: 'en',
    theme: 'light',
    url: '?view=settings&settingsView=mosque',
    readySelector: ".settings-screen__legacy[data-settings-category='mosque']",
    visibleSelectors: ['.mosque-library-row'],
    hiddenSelectors: [
      '.manual-mosque-fieldset',
      '.mosque-import-grid',
      '.mosque-import-payload',
      '.offsets-fieldset',
      '.notification-fieldset',
      '.settings-transfer',
    ],
  },
  {
    name: 'tablet-settings-advanced-ar-dark',
    width: 1024,
    height: 1366,
    locale: 'ar',
    theme: 'dark',
    url: '?view=settings&settingsView=advanced',
    readySelector: ".settings-screen__legacy[data-settings-category='advanced']",
    visibleSelectors: [
      '.manual-mosque-fieldset',
      '.mosque-import-grid',
      '.mosque-import-payload',
      '.offsets-fieldset',
    ],
    hiddenSelectors: [
      '.settings-grid',
      '.mosque-library-row',
      '.notification-fieldset',
      '.settings-transfer',
    ],
  },
  {
    name: 'phone-mosques-en-light',
    width: 390,
    height: 844,
    locale: 'en',
    theme: 'light',
    url: '?view=mosques',
    readySelector: '.mosques-screen',
    stage22Seed: true,
    frozenNow: stage22FixedNow,
  },
  {
    name: 'tablet-mosques-ar-dark',
    width: 1024,
    height: 1366,
    locale: 'ar',
    theme: 'dark',
    url: '?view=mosques',
    readySelector: '.mosques-screen',
    stage22Seed: true,
    frozenNow: stage22FixedNow,
  },
  {
    name: 'phone-qiblah-en-dark',
    width: 390,
    height: 844,
    locale: 'en',
    theme: 'dark',
    url: '?view=qiblah',
    readySelector: '.qibla-finder',
  },
  {
    name: 'phone-landscape-qiblah-en-light',
    width: 844,
    height: 390,
    locale: 'en',
    theme: 'light',
    url: '?view=qiblah',
    readySelector: '.qibla-primary-workspace',
  },
  {
    name: 'tablet-qiblah-ar-dark',
    width: 1024,
    height: 1366,
    locale: 'ar',
    theme: 'dark',
    url: '?view=qiblah',
    readySelector: '.qibla-primary-workspace',
  },
  {
    name: 'desktop-qiblah-en-light',
    width: 1440,
    height: 1000,
    locale: 'en',
    theme: 'light',
    url: '?view=qiblah',
    readySelector: '.qibla-primary-workspace',
  },
  {
    name: 'tablet-community-ar-dark',
    width: 1024,
    height: 1366,
    locale: 'ar',
    theme: 'dark',
    url: '?view=community',
    readySelector: '.community-screen',
    stage22Seed: true,
    frozenNow: stage22FixedNow,
  },
  {
    name: 'phone-community-events-en-light',
    width: 390,
    height: 844,
    locale: 'en',
    theme: 'light',
    url: '?view=community',
    readySelector: '.community-screen',
    stage22Seed: true,
    frozenNow: stage22FixedNow,
    communityTab: 'events',
  },
  {
    name: 'desktop-admin-en-light',
    width: 1440,
    height: 1000,
    locale: 'en',
    theme: 'light',
    url: '?surface=admin',
    readySelector: '.admin-shell',
  },
];

const touchDisplayScenarios = [
  {
    name: 'touch-5-portrait-en',
    width: 720,
    height: 1280,
    url: '?fixture=touch-display-2&display=5&orientation=portrait&locale=en',
    locale: 'en',
  },
  {
    name: 'touch-7-portrait-ar',
    width: 720,
    height: 1280,
    url: '?fixture=touch-display-2&display=7&orientation=portrait&locale=ar',
    locale: 'ar',
  },
  {
    name: 'touch-10-portrait-en',
    width: 1200,
    height: 1920,
    url: '?fixture=touch-display-2&display=10&orientation=portrait&locale=en',
    locale: 'en',
  },
  {
    name: 'touch-7-landscape-en',
    width: 1280,
    height: 720,
    url: '?fixture=touch-display-2&display=7&orientation=landscape&locale=en',
    locale: 'en',
  },
  {
    name: 'touch-10-landscape-ar',
    width: 1920,
    height: 1200,
    url: '?fixture=touch-display-2&display=10&orientation=landscape&locale=ar',
    locale: 'ar',
  },
];

function expectedDirection(locale) {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

async function seedApplication(page, scenario) {
  await page.addInitScript(
    ({ serializedSettings, serializedMosqueLibrary, serializedCommunityLibrary, frozenNow }) => {
      localStorage.setItem('salahos.settings', serializedSettings);
      if (serializedMosqueLibrary !== null) {
        localStorage.setItem('salahos.mosqueProfileLibrary', serializedMosqueLibrary);
      }
      if (serializedCommunityLibrary !== null) {
        localStorage.setItem('salahos.communityContent', serializedCommunityLibrary);
      }

      const NativeDate = Date;
      class FrozenDate extends NativeDate {
        constructor(...args) {
          if (args.length === 0) {
            super(frozenNow);
          } else {
            super(...args);
          }
        }

        static now() {
          return frozenNow;
        }
      }

      Object.setPrototypeOf(FrozenDate, NativeDate);
      globalThis.Date = FrozenDate;
    },
    {
      serializedSettings: JSON.stringify(
        settingsFor(scenario.locale, scenario.theme, scenario.stage22Seed === true),
      ),
      serializedMosqueLibrary:
        scenario.stage22Seed === true ? JSON.stringify(stage22MosqueLibrary) : null,
      serializedCommunityLibrary:
        scenario.stage22Seed === true ? JSON.stringify(stage22CommunityLibrary) : null,
      frozenNow: scenario.frozenNow ?? fixedNow,
    },
  );
}

async function findHorizontalOverflow(page) {
  return page.evaluate(() => {
    const tolerance = 2;
    const viewportWidth = document.documentElement.clientWidth;
    const offenders = [];

    for (const element of document.querySelectorAll('body *')) {
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') continue;

      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;

      const outsideViewport = rect.left < -tolerance || rect.right > viewportWidth + tolerance;
      const isFormControl =
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLButtonElement;
      const explicitlyClipsContent =
        !isFormControl &&
        element.clientWidth > 0 &&
        element.scrollWidth > element.clientWidth + tolerance &&
        (style.overflowX === 'hidden' || style.overflowX === 'clip');

      if (!outsideViewport && !explicitlyClipsContent) continue;

      offenders.push({
        tag: element.tagName.toLowerCase(),
        className: typeof element.className === 'string' ? element.className : '',
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        overflowX: style.overflowX,
      });

      if (offenders.length >= 12) break;
    }

    return {
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportWidth,
      offenders,
    };
  });
}

function assertNoHorizontalOverflow(name, overflow) {
  if (
    overflow.bodyScrollWidth > overflow.viewportWidth + 2 ||
    overflow.documentScrollWidth > overflow.viewportWidth + 2 ||
    overflow.offenders.length > 0
  ) {
    throw new Error(`${name} horizontal overflow: ${JSON.stringify(overflow)}`);
  }
}

async function visibleSelectorCount(page, selector) {
  return page.locator(selector).evaluateAll(
    (elements) =>
      elements.filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          rect.width > 0 &&
          rect.height > 0
        );
      }).length,
  );
}

async function validateApplicationScenario(browser, scenario) {
  const context = await browser.newContext({
    viewport: { width: scenario.width, height: scenario.height },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  try {
    await seedApplication(page, scenario);
    const targetUrl = scenario.url ? `${baseUrl}/${scenario.url}` : baseUrl;
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await page.locator(scenario.readySelector ?? '.app-shell').waitFor({ state: 'visible' });

    if (scenario.communityTab === 'events') {
      await page.locator('.community-screen__tabs button').nth(1).click();
      await page.locator('.community-preview-card--event').first().waitFor({ state: 'visible' });
    }

    if (scenario.fontScale) {
      await page.evaluate((scale) => {
        document.documentElement.style.fontSize = `${String(scale * 100)}%`;
      }, scenario.fontScale);
    }

    if (scenario.openSettings) {
      await page.locator('.settings-panel').evaluate((element) => {
        element.open = true;
      });
    }

    for (const selector of scenario.visibleSelectors ?? []) {
      const visibleCount = await visibleSelectorCount(page, selector);
      if (visibleCount === 0) {
        throw new Error(`${scenario.name} expected visible selector ${selector}`);
      }
    }

    for (const selector of scenario.hiddenSelectors ?? []) {
      const visibleCount = await visibleSelectorCount(page, selector);
      if (visibleCount > 0) {
        throw new Error(`${scenario.name} expected hidden selector ${selector}`);
      }
    }

    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(100);

    const documentState = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      theme: document.documentElement.dataset.theme ?? null,
      width: innerWidth,
      height: innerHeight,
    }));

    if (documentState.lang !== scenario.locale) {
      throw new Error(
        `${scenario.name} expected lang=${scenario.locale}, got ${documentState.lang}`,
      );
    }
    if (documentState.dir !== expectedDirection(scenario.locale)) {
      throw new Error(
        `${scenario.name} expected dir=${expectedDirection(scenario.locale)}, got ${documentState.dir}`,
      );
    }
    if (documentState.theme !== scenario.theme) {
      throw new Error(
        `${scenario.name} expected theme=${scenario.theme}, got ${documentState.theme}`,
      );
    }
    if (documentState.width !== scenario.width || documentState.height !== scenario.height) {
      throw new Error(`${scenario.name} viewport mismatch: ${JSON.stringify(documentState)}`);
    }
    if (pageErrors.length > 0) {
      throw new Error(`${scenario.name} page errors: ${pageErrors.join(' | ')}`);
    }

    const overflow = await findHorizontalOverflow(page);
    assertNoHorizontalOverflow(scenario.name, overflow);

    await page.screenshot({
      path: path.join(artifactDirectory, `${scenario.name}.png`),
      fullPage: true,
      animations: 'disabled',
    });

    return { name: scenario.name, status: 'passed', overflow };
  } finally {
    await context.close();
  }
}

async function validateTouchDisplayScenario(browser, scenario) {
  const context = await browser.newContext({
    viewport: { width: scenario.width, height: scenario.height },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  try {
    await page.goto(`${baseUrl}/${scenario.url}`, { waitUntil: 'networkidle' });
    const fixture = page.locator('.touch-display-fixture');
    await fixture.waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready);

    const fixtureState = await fixture.evaluate((element) => ({
      lang: element.getAttribute('lang'),
      dir: element.getAttribute('dir'),
      viewport: element.getAttribute('data-viewport'),
      width: innerWidth,
      height: innerHeight,
    }));

    const expectedViewport = `${String(scenario.width)}x${String(scenario.height)}`;
    if (fixtureState.lang !== scenario.locale) {
      throw new Error(
        `${scenario.name} expected fixture lang=${scenario.locale}, got ${fixtureState.lang}`,
      );
    }
    if (fixtureState.dir !== expectedDirection(scenario.locale)) {
      throw new Error(
        `${scenario.name} expected fixture dir=${expectedDirection(scenario.locale)}, got ${fixtureState.dir}`,
      );
    }
    if (fixtureState.viewport !== expectedViewport) {
      throw new Error(
        `${scenario.name} expected data-viewport=${expectedViewport}, got ${fixtureState.viewport}`,
      );
    }
    if (fixtureState.width !== scenario.width || fixtureState.height !== scenario.height) {
      throw new Error(`${scenario.name} viewport mismatch: ${JSON.stringify(fixtureState)}`);
    }
    if (pageErrors.length > 0) {
      throw new Error(`${scenario.name} page errors: ${pageErrors.join(' | ')}`);
    }

    const overflow = await findHorizontalOverflow(page);
    assertNoHorizontalOverflow(scenario.name, overflow);

    await page.screenshot({
      path: path.join(artifactDirectory, `${scenario.name}.png`),
      fullPage: true,
      animations: 'disabled',
    });

    return { name: scenario.name, status: 'passed', overflow };
  } finally {
    await context.close();
  }
}

await mkdir(artifactDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];
const failures = [];

try {
  for (const scenario of applicationScenarios) {
    try {
      results.push(await validateApplicationScenario(browser, scenario));
      console.log(`PASS ${scenario.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ name: scenario.name, message });
      results.push({ name: scenario.name, status: 'failed', message });
      console.error(`FAIL ${scenario.name}: ${message}`);
    }
  }

  for (const scenario of touchDisplayScenarios) {
    try {
      results.push(await validateTouchDisplayScenario(browser, scenario));
      console.log(`PASS ${scenario.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ name: scenario.name, message });
      results.push({ name: scenario.name, status: 'failed', message });
      console.error(`FAIL ${scenario.name}: ${message}`);
    }
  }
} finally {
  await browser.close();
}

await writeFile(
  path.join(artifactDirectory, 'results.json'),
  `${JSON.stringify(
    {
      generatedAt: new Date(fixedNow).toISOString(),
      baseUrl,
      scenarios: results,
    },
    null,
    2,
  )}\n`,
  'utf8',
);

if (failures.length > 0) {
  throw new Error(`Visual regression failures: ${JSON.stringify(failures)}`);
}

console.log(`Visual regression passed ${String(results.length)} scenarios.`);
