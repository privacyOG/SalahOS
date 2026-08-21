import { writeFile } from 'node:fs/promises';
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

const stage22FixedNow = Date.parse('2026-08-21T03:00:00.000Z');
const ramadanFixedNow = Date.parse('2026-03-01T03:00:00.000Z');

const mosqueLibrary = {
  version: 1,
  selectedProfileId: 'masjid-al-noor:sydney',
  profiles: [
    {
      id: 'masjid-al-noor:sydney',
      organizationId: null,
      parentMosqueId: null,
      name: { en: 'Masjid Al Noor', ar: 'مسجد النور' },
      description: null,
      address: { formatted: '12 Community Street, Sydney NSW', countryCode: 'AU' },
      coordinates: { latitude: -33.873, longitude: 151.207 },
      timeZone: 'Australia/Sydney',
      facilities: ['wudu', 'parking', 'women-prayer-space', 'wheelchair-accessible'],
      accessibilityNotes: null,
      contact: { links: [] },
      logo: null,
    },
  ],
};

const communityLibrary = {
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

function settingsFor(locale, theme, mosqueDate) {
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
    prayerSourceMode: 'local-mosque',
    location: {
      coordinates: { latitude: -33.8688, longitude: 151.2093 },
      timeZone: 'Australia/Sydney',
    },
    mosqueTimetable: {
      mosqueName: 'Masjid Al Noor',
      days: [
        {
          date: mosqueDate,
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
          taraweehSessions: [{ label: 'Taraweeh', startLocalMinutes: 1230 }],
        },
      ],
    },
    notifications: {},
  };
}

const scenarios = [
  {
    name: 'phone-today-community-en-light',
    width: 390,
    height: 844,
    locale: 'en',
    theme: 'light',
    now: stage22FixedNow,
    mosqueDate: '2026-08-21',
    community: true,
    readySelector: '.today-community-preview',
    visibleSelectors: ['.today-community-preview'],
    hiddenSelectors: ['.today-seasonal'],
  },
  {
    name: 'tablet-today-stale-ar-dark',
    width: 1024,
    height: 1366,
    locale: 'ar',
    theme: 'dark',
    now: stage22FixedNow,
    mosqueDate: '2026-08-20',
    community: true,
    readySelector: ".today-context-state[data-state='stale-timetable']",
    visibleSelectors: [".today-context-state[data-state='stale-timetable']"],
  },
  {
    name: 'phone-today-ramadan-en-dark',
    width: 390,
    height: 844,
    locale: 'en',
    theme: 'dark',
    now: ramadanFixedNow,
    mosqueDate: '2026-03-01',
    community: false,
    readySelector: '.today-seasonal',
    visibleSelectors: ['.today-seasonal', '.today-seasonal__taraweeh'],
  },
];

function expectedDirection(locale) {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

async function seed(page, scenario) {
  await page.addInitScript(
    ({ serializedSettings, serializedMosques, serializedCommunity, frozenNow }) => {
      localStorage.setItem('salahos.settings', serializedSettings);
      localStorage.setItem('salahos.mosqueProfileLibrary', serializedMosques);
      if (serializedCommunity === null) {
        localStorage.removeItem('salahos.communityContent');
      } else {
        localStorage.setItem('salahos.communityContent', serializedCommunity);
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
        settingsFor(scenario.locale, scenario.theme, scenario.mosqueDate),
      ),
      serializedMosques: JSON.stringify(mosqueLibrary),
      serializedCommunity: scenario.community ? JSON.stringify(communityLibrary) : null,
      frozenNow: scenario.now,
    },
  );
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
      if (rect.left >= -tolerance && rect.right <= viewportWidth + tolerance) continue;
      offenders.push({
        tag: element.tagName.toLowerCase(),
        className: typeof element.className === 'string' ? element.className : '',
        left: Math.round(rect.left),
        right: Math.round(rect.right),
      });
      if (offenders.length >= 12) break;
    }
    return {
      viewportWidth,
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      offenders,
    };
  });
}

const browser = await chromium.launch({ headless: true });
const results = [];
const failures = [];

try {
  for (const scenario of scenarios) {
    const context = await browser.newContext({
      viewport: { width: scenario.width, height: scenario.height },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    try {
      await seed(page, scenario);
      await page.goto(`${baseUrl}/?view=today`, { waitUntil: 'networkidle' });
      await page.locator(scenario.readySelector).waitFor({ state: 'visible' });

      for (const selector of scenario.visibleSelectors ?? []) {
        if ((await visibleSelectorCount(page, selector)) === 0) {
          throw new Error(`${scenario.name} expected visible selector ${selector}`);
        }
      }
      for (const selector of scenario.hiddenSelectors ?? []) {
        if ((await visibleSelectorCount(page, selector)) > 0) {
          throw new Error(`${scenario.name} expected hidden selector ${selector}`);
        }
      }

      const documentState = await page.evaluate(() => ({
        lang: document.documentElement.lang,
        dir: document.documentElement.dir,
        theme: document.documentElement.dataset.theme ?? null,
      }));
      if (documentState.lang !== scenario.locale) {
        throw new Error(`${scenario.name} expected lang=${scenario.locale}`);
      }
      if (documentState.dir !== expectedDirection(scenario.locale)) {
        throw new Error(`${scenario.name} expected dir=${expectedDirection(scenario.locale)}`);
      }
      if (documentState.theme !== scenario.theme) {
        throw new Error(`${scenario.name} expected theme=${scenario.theme}`);
      }
      if (pageErrors.length > 0) {
        throw new Error(`${scenario.name} page errors: ${pageErrors.join(' | ')}`);
      }

      const overflow = await findHorizontalOverflow(page);
      if (
        overflow.bodyScrollWidth > overflow.viewportWidth + 2 ||
        overflow.documentScrollWidth > overflow.viewportWidth + 2 ||
        overflow.offenders.length > 0
      ) {
        throw new Error(`${scenario.name} horizontal overflow: ${JSON.stringify(overflow)}`);
      }

      await page.screenshot({
        path: path.join(artifactDirectory, `${scenario.name}.png`),
        fullPage: true,
        animations: 'disabled',
      });
      results.push({ name: scenario.name, status: 'passed', overflow });
      console.log(`PASS ${scenario.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ name: scenario.name, message });
      results.push({ name: scenario.name, status: 'failed', message });
      console.error(`FAIL ${scenario.name}: ${message}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}

await writeFile(
  path.join(artifactDirectory, 'today-context-results.json'),
  `${JSON.stringify({ scenarios: results }, null, 2)}\n`,
  'utf8',
);

if (failures.length > 0) {
  throw new Error(`Today contextual visual failures: ${JSON.stringify(failures)}`);
}

console.log(`Today contextual visual acceptance passed ${String(results.length)} scenarios.`);
