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
const fixedNow = new Date('2026-08-23T03:30:00.000Z');

function settings(locale) {
  const day = (date) => ({
    date,
    prayers: {
      fajr: { startLocalMinutes: 310, iqamah: { kind: 'fixed', localMinutes: 335 } },
      dhuhr: { startLocalMinutes: 720, iqamah: { kind: 'fixed', localMinutes: 750 } },
      asr: { startLocalMinutes: 930, iqamah: { kind: 'fixed', localMinutes: 955 } },
      maghrib: { startLocalMinutes: 1055, iqamah: { kind: 'fixed', localMinutes: 1065 } },
      isha: { startLocalMinutes: 1140, iqamah: { kind: 'fixed', localMinutes: 1170 } },
    },
  });
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
      mosqueName: locale === 'ar' ? 'مسجد النور' : 'Masjid Al Noor',
      days: [
        day('2026-08-23'),
        day('2026-08-24'),
        {
          ...day('2026-08-28'),
          jumuahSessions: [
            { label: 'Jumu‘ah 1', khutbahLocalMinutes: 750, salahLocalMinutes: 780 },
            { label: 'Jumu‘ah 2', khutbahLocalMinutes: 810, salahLocalMinutes: 840 },
          ],
        },
      ],
    },
    notifications: {},
  };
}

function communityContent() {
  return {
    version: 1,
    announcements: [
      {
        announcementId: 'parking-notice',
        mosqueId: 'masjid-al-noor',
        english: { title: 'Friday parking notice', body: 'Keep the western lane clear.' },
        arabic: { title: 'تنبيه مواقف الجمعة', body: 'يرجى إبقاء الممر الغربي خالياً.' },
        imageUrl: null,
        callToActionUrl: null,
        priority: 'priority',
        pinned: true,
        surfaces: ['mobile', 'web', 'display'],
        startsAt: '2026-08-23T05:00:00.000Z',
        endsAt: '2026-08-29T00:00:00.000Z',
        recurrence: 'none',
        archived: false,
      },
    ],
    events: [
      {
        eventId: 'family-dinner',
        mosqueId: 'masjid-al-noor',
        english: { title: 'Family dinner', description: 'Community dinner after Maghrib.' },
        arabic: { title: 'عشاء العائلات', description: 'عشاء مجتمعي بعد المغرب.' },
        venue: 'Community hall',
        allDay: false,
        startsAt: '2026-08-24T08:30:00.000Z',
        endsAt: '2026-08-24T10:00:00.000Z',
        recurrence: 'none',
        imageUrl: null,
        registrationUrl: null,
        surfaces: ['mobile', 'web', 'display'],
      },
    ],
  };
}

function rotationConfig() {
  return {
    version: 1,
    enabled: true,
    playlist: {
      playlistId: 'admin-overview-announcements',
      mosqueId: 'masjid-al-noor',
      title: 'Prayer board announcements',
      revision: 1,
      scenes: [{ sceneId: 'announcement:parking-notice', dwellSeconds: 30 }],
    },
    rules: [
      {
        kind: 'time-window',
        ruleId: 'admin-overview-all-day',
        playlistId: 'admin-overview-announcements',
        priority: 100,
        context: 'all',
        startDate: null,
        endDate: null,
        weekdays: [],
        startsAt: '00:00',
        endsAt: '00:00',
      },
    ],
    scenes: [
      {
        sceneId: 'announcement:parking-notice',
        mosqueId: 'masjid-al-noor',
        kind: 'announcement',
        title: 'Friday parking notice',
        offlineFallback: 'prayer-board',
        announcementId: 'parking-notice',
      },
    ],
  };
}

async function seed(page, locale) {
  await page.addInitScript(
    ({ persistedSettings, content, rotation }) => {
      localStorage.setItem('salahos.settings', persistedSettings);
      localStorage.setItem('salahos.communityContent', content);
      localStorage.setItem('salahos.prayerBoardAnnouncementRotation', rotation);
    },
    {
      persistedSettings: JSON.stringify(settings(locale)),
      content: JSON.stringify(communityContent()),
      rotation: JSON.stringify(rotationConfig()),
    },
  );
}

async function assertContained(page, name) {
  const geometry = await page.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    right: document.querySelector('.admin-shell')?.getBoundingClientRect().right ?? 0,
  }));
  if (geometry.scrollWidth > geometry.width || geometry.right > geometry.width + 1) {
    throw new Error(`${name} overflowed its viewport: ${JSON.stringify(geometry)}`);
  }
}

async function captureScenario(browser, scenario) {
  const context = await browser.newContext({
    viewport: { width: scenario.width, height: scenario.height },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.install({ time: fixedNow });

  try {
    await seed(page, scenario.locale);
    await page.goto(`${baseUrl}/?surface=admin&adminView=overview&adminFixture=stage24`, {
      waitUntil: 'networkidle',
    });
    await page.locator('.admin-overview').waitFor({ state: 'visible' });

    if ((await page.locator('.admin-shell-nav button').count()) !== 8) {
      throw new Error(`${scenario.name} did not render all eight administration destinations`);
    }
    if ((await page.locator('.admin-shell-breadcrumb').count()) !== 1) {
      throw new Error(`${scenario.name} did not render route context breadcrumbs`);
    }
    if ((await page.locator('.admin-prayer-table__row').count()) !== 5) {
      throw new Error(`${scenario.name} did not render five obligatory prayer rows`);
    }
    if ((await page.locator('.admin-fleet-counts > div').count()) !== 3) {
      throw new Error(`${scenario.name} did not render online/stale/offline fleet counts`);
    }
    const body = (await page.locator('body').textContent()) ?? '';
    for (const expected of ['rev-024', 'rev-025', 'Friday parking notice', 'Family dinner']) {
      if (scenario.locale === 'en' && !body.includes(expected)) {
        throw new Error(`${scenario.name} is missing overview evidence: ${expected}`);
      }
    }
    if (scenario.locale === 'ar' && (await page.locator('.admin-shell').getAttribute('dir')) !== 'rtl') {
      throw new Error(`${scenario.name} did not render the administration shell RTL`);
    }

    await assertContained(page, scenario.name);
    await page.screenshot({
      path: path.join(artifactDirectory, `${scenario.name}.png`),
      fullPage: true,
      animations: 'disabled',
    });

    if (scenario.navigate) {
      await page.locator('.admin-shell-nav button').nth(3).click();
      await page.locator('[data-admin-route="community"]').waitFor({ state: 'visible' });
      if (new URL(page.url()).searchParams.get('adminView') !== 'community') {
        throw new Error('administration navigation did not produce a reloadable Community route');
      }
      await assertContained(page, `${scenario.name}-community`);
    }

    if (errors.length > 0) throw new Error(`${scenario.name} page errors: ${errors.join(' | ')}`);
    return {
      name: scenario.name,
      destinations: 8,
      prayerRows: 5,
      rtl: scenario.locale === 'ar',
      contained: true,
    };
  } finally {
    await context.close();
  }
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const scenarios = [
    { name: 'admin-overview-desktop-en', width: 1600, height: 1100, locale: 'en', navigate: true },
    { name: 'admin-overview-tablet-ar-rtl', width: 1024, height: 1366, locale: 'ar' },
    { name: 'admin-overview-narrow-en', width: 390, height: 844, locale: 'en' },
  ];
  const results = [];
  for (const scenario of scenarios) results.push(await captureScenario(browser, scenario));
  await writeFile(
    path.join(artifactDirectory, 'admin-shell-overview-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(`Stage 24 admin shell visual acceptance passed ${results.length} scenarios.`);
} finally {
  await browser.close();
}
