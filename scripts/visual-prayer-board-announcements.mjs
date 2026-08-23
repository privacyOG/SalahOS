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

function settings(locale = 'en') {
  return {
    version: 2,
    locale,
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

function boardConfig(locale = 'en', announcements = true) {
  return {
    version: 1,
    templateId: 'minimal-modern',
    primaryLocale: locale,
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
      announcements,
      weather: false,
    },
    branding: {
      mosqueName: {
        en: 'Stage 23 Announcement Masjid',
        ar: 'مسجد إعلانات المرحلة ٢٣',
      },
      logo: null,
    },
    background: { kind: 'builtin', artworkId: 'quiet-grid' },
  };
}

function communityContent() {
  return {
    version: 1,
    announcements: [
      {
        announcementId: 'community-dinner',
        mosqueId: 'stage-23-masjid',
        english: {
          title: 'Community dinner after Maghrib',
          body: 'Families are welcome in the community hall this Saturday.',
        },
        arabic: {
          title: 'عشاء المجتمع بعد المغرب',
          body: 'نرحب بالعائلات في قاعة المجتمع يوم السبت.',
        },
        imageUrl: null,
        callToActionUrl: null,
        priority: 'normal',
        pinned: false,
        surfaces: ['display'],
        startsAt: '2026-01-01T00:00:00.000Z',
        endsAt: '2027-01-01T00:00:00.000Z',
        recurrence: 'none',
        archived: false,
      },
      {
        announcementId: 'classes',
        mosqueId: 'stage-23-masjid',
        english: {
          title: 'Weekend classes enrolment',
          body: 'Registration is open at the administration desk.',
        },
        arabic: {
          title: 'التسجيل في دروس نهاية الأسبوع',
          body: 'التسجيل مفتوح لدى مكتب الإدارة.',
        },
        imageUrl: null,
        callToActionUrl: null,
        priority: 'normal',
        pinned: false,
        surfaces: ['display'],
        startsAt: '2026-01-01T00:00:00.000Z',
        endsAt: '2027-01-01T00:00:00.000Z',
        recurrence: 'none',
        archived: false,
      },
    ],
    events: [],
  };
}

function rotationConfig() {
  return {
    version: 1,
    enabled: true,
    playlist: {
      playlistId: 'prayer-board-announcements:stage-23-masjid',
      mosqueId: 'stage-23-masjid',
      title: 'Prayer board announcements',
      revision: 1,
      scenes: [
        { sceneId: 'announcement:community-dinner', dwellSeconds: 30 },
        { sceneId: 'announcement:classes', dwellSeconds: 30 },
      ],
    },
    rules: [
      {
        kind: 'time-window',
        ruleId: 'prayer-board-announcements-all-day:stage-23-masjid',
        playlistId: 'prayer-board-announcements:stage-23-masjid',
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
        sceneId: 'announcement:community-dinner',
        mosqueId: 'stage-23-masjid',
        kind: 'announcement',
        title: 'Community dinner after Maghrib',
        offlineFallback: 'prayer-board',
        announcementId: 'community-dinner',
      },
      {
        sceneId: 'announcement:classes',
        mosqueId: 'stage-23-masjid',
        kind: 'announcement',
        title: 'Weekend classes enrolment',
        offlineFallback: 'prayer-board',
        announcementId: 'classes',
      },
    ],
  };
}

async function seed(page, locale, announcementsEnabled = true) {
  await page.addInitScript(
    ({ serializedSettings, serializedBoard, serializedCommunity, serializedRotation }) => {
      localStorage.setItem('salahos.settings', serializedSettings);
      localStorage.setItem('salahos.prayerBoardDisplayConfig', serializedBoard);
      localStorage.setItem('salahos.communityContent', serializedCommunity);
      localStorage.setItem('salahos.prayerBoardAnnouncementRotation', serializedRotation);
    },
    {
      serializedSettings: JSON.stringify(settings(locale)),
      serializedBoard: JSON.stringify(boardConfig(locale, announcementsEnabled)),
      serializedCommunity: JSON.stringify(communityContent()),
      serializedRotation: JSON.stringify(rotationConfig()),
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

async function validateActiveAnnouncement(browser, locale) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  try {
    await seed(page, locale, true);
    await page.goto(`${baseUrl}/?mode=smart-display`, { waitUntil: 'networkidle' });
    const display = page.locator('.smart-display');
    await display.waitFor({ state: 'visible' });
    const announcement = page.locator('.prayer-board-announcement');
    await announcement.waitFor({ state: 'visible' });
    if ((await page.locator('.minimal-modern-prayer').count()) !== 5) {
      throw new Error('announcement rotation changed the five-prayer timetable');
    }
    if ((await display.getAttribute('data-announcement-state')) !== 'active') {
      throw new Error('smart display did not report an active scheduled announcement');
    }
    const text = (await announcement.textContent()) ?? '';
    if (locale === 'ar') {
      if (!text.includes('إعلان')) throw new Error('Arabic announcement copy did not render');
      if ((await display.getAttribute('dir')) !== 'rtl') throw new Error('Arabic display is not RTL');
    } else if (!text.includes('announcement') && !text.includes('Announcement')) {
      throw new Error('English announcement label did not render');
    }
    const animationName = await announcement.evaluate(
      (element) => getComputedStyle(element).animationName,
    );
    if (animationName !== 'none') {
      throw new Error(`reduced-motion announcement animation remained active: ${animationName}`);
    }
    await capture(page, `prayer-board-announcement-active-${locale}`);
    return { locale, active: true, prayerRows: 5, reducedMotion: true };
  } finally {
    await context.close();
  }
}

async function validateModuleDisabled(browser) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  try {
    await seed(page, 'en', false);
    await page.goto(`${baseUrl}/?mode=smart-display`, { waitUntil: 'networkidle' });
    const display = page.locator('.smart-display');
    await display.waitFor({ state: 'visible' });
    if ((await page.locator('.prayer-board-announcement').count()) !== 0) {
      throw new Error('announcement rendered while the per-display module was disabled');
    }
    if ((await display.getAttribute('data-announcement-state')) !== 'module-hidden') {
      throw new Error('disabled announcement module was not reflected in runtime state');
    }
    if ((await page.locator('.minimal-modern-prayer').count()) !== 5) {
      throw new Error('disabling announcements changed the prayer timetable');
    }
    await capture(page, 'prayer-board-announcement-module-disabled-en');
    return { moduleDisabled: true, prayerRows: 5 };
  } finally {
    await context.close();
  }
}

async function validateAdminControls(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  try {
    await seed(page, 'en', true);
    await page.goto(`${baseUrl}/?surface=admin&adminView=themes`, { waitUntil: 'networkidle' });
    const panel = page.locator('.prayer-board-announcement-settings');
    await panel.waitFor({ state: 'visible' });
    if (!(await panel.textContent()).includes('Announcement rotation')) {
      throw new Error('announcement rotation administration panel did not render');
    }
    if (!(await panel.textContent()).includes('2 display announcements available')) {
      throw new Error('administration panel did not discover display-targeted announcements');
    }
    await capture(page, 'prayer-board-announcement-admin-en');
    return { adminControls: true, availableAnnouncements: 2 };
  } finally {
    await context.close();
  }
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const results = [
    await validateActiveAnnouncement(browser, 'en'),
    await validateActiveAnnouncement(browser, 'ar'),
    await validateModuleDisabled(browser),
    await validateAdminControls(browser),
  ];
  await writeFile(
    path.join(artifactDirectory, 'prayer-board-announcement-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(`Prayer-board announcement visual checks passed: ${results.length} flows`);
} finally {
  await browser.close();
}
