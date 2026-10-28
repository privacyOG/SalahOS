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
const allowedOrigin = new URL(baseUrl).origin;

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
    prayerSourceMode: 'calculated',
    location: {
      coordinates: { latitude: -33.8688, longitude: 151.2093 },
      timeZone: 'Australia/Sydney',
    },
    mosqueTimetable: null,
    notifications: {},
  };
}

function board(templateId, locale, mosqueName) {
  const artworkId = {
    'heritage-classic': 'geometric-heritage',
    'minimal-modern': 'quiet-grid',
    'bold-countdown-focus': 'countdown-field',
    'structured-split-board': 'structured-lines',
    'home-hub': 'structured-lines',
    'scenic-spiritual': 'scenic-gradient',
    'family-classroom': 'classroom-pattern',
  }[templateId];
  return {
    version: 1,
    templateId,
    primaryLocale: locale,
    languageMode: 'single',
    timeFormat: 'h23',
    accentPreset: locale === 'ar' ? 'midnight' : 'neutral',
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
      weather: false,
    },
    branding: { mosqueName: { [locale]: mosqueName }, logo: null },
    background: { kind: 'builtin', artworkId },
  };
}

async function seed(page, locale, config) {
  await page.addInitScript(
    ({ serializedSettings, serializedConfig }) => {
      localStorage.setItem('salahos.settings', serializedSettings);
      localStorage.setItem('salahos.prayerBoardDisplayConfig', serializedConfig);
    },
    {
      serializedSettings: JSON.stringify(settingsFor(locale)),
      serializedConfig: JSON.stringify(config),
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

async function overflowState(page) {
  return page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
  }));
}

async function assertHomeHubGeometry(page, scenario) {
  if (scenario.templateId !== 'home-hub') return;
  const metrics = await page.evaluate(() => {
    const board = document.querySelector('.home-hub-board');
    const timetable = board?.querySelector('.structured-split-board__timetable');
    const rows = Array.from(board?.querySelectorAll('.structured-prayer-row') ?? []);
    const clock = board?.querySelector('.structured-split-board__clock');
    const next = board?.querySelector('.structured-split-board__next');
    const prayerTitle = board?.querySelector('.structured-split-board__next-heading strong');
    const countdown = board?.querySelector('.structured-split-board__countdown strong');
    const bounds = (element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
    };
    const textFitsRow = (row) => {
      const parent = bounds(row);
      return Array.from(row.querySelectorAll('strong'))
        .filter((item) => item.getClientRects().length > 0)
        .every((item) => {
          const rect = bounds(item);
          return rect.left >= parent.left - 3 && rect.right <= parent.right + 3;
        });
    };
    if (
      board === null ||
      timetable === null ||
      clock === null ||
      next === null ||
      prayerTitle === null ||
      countdown === null
    ) {
      return null;
    }
    return {
      viewportWidth: window.innerWidth,
      variant: board.getAttribute('data-structured-variant'),
      iqamahAvailable: board.getAttribute('data-iqamah-available'),
      iqamahHidden: Array.from(board.querySelectorAll('.structured-prayer-row__iqamah')).every(
        (element) => getComputedStyle(element).display === 'none',
      ),
      prayerTitleColor: getComputedStyle(prayerTitle).color,
      countdownColor: getComputedStyle(countdown).color,
      root: bounds(board),
      timetable: bounds(timetable),
      cards: rows.map(bounds),
      textFits: rows.map(textFitsRow),
      clock: bounds(clock),
      next: bounds(next),
    };
  });
  if (metrics === null || metrics.cards.length !== 5) {
    throw new Error(`${scenario.name} is missing the complete Home Hub prayer layout`);
  }
  if (
    metrics.variant === 'classic' &&
    (metrics.prayerTitleColor !== 'rgb(255, 226, 160)' ||
      metrics.countdownColor !== 'rgb(255, 226, 160)')
  ) {
    throw new Error(`${scenario.name} classic next-prayer text lost its readable gold foreground`);
  }
  if (metrics.iqamahAvailable === 'false' && !metrics.iqamahHidden) {
    throw new Error(`${scenario.name} exposed unconfigured congregation placeholders`);
  }
  if (metrics.textFits.some((fits) => !fits)) {
    throw new Error(`${scenario.name} has a prayer value clipped inside its card`);
  }
  if (
    metrics.cards.some(
      (card) =>
        card.left < metrics.timetable.left - 3 ||
        card.right > metrics.timetable.right + 3 ||
        card.top < metrics.timetable.top - 3 ||
        card.bottom > metrics.timetable.bottom + 3,
    )
  ) {
    throw new Error(`${scenario.name} prayer cards escaped the timetable panel`);
  }
  if (scenario.width >= 1180) {
    if (
      metrics.cards.some((card) => Math.abs(card.top - metrics.cards[0].top) > 3) ||
      (metrics.clock.right > metrics.next.left + 3 &&
        metrics.next.right > metrics.clock.left + 3 &&
        metrics.clock.bottom > metrics.next.top + 3 &&
        metrics.next.bottom > metrics.clock.top + 3)
    ) {
      throw new Error(`${scenario.name} lost its horizontal five-prayer/clock layout`);
    }
  }
}

async function validateRuntime(browser, scenario) {
  const context = await browser.newContext({
    viewport: { width: scenario.width ?? 1920, height: scenario.height ?? 1080 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const errors = [];
  const externalRequests = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    const url = request.url();
    if (url.startsWith('data:') || url.startsWith('blob:')) return;
    try {
      if (new URL(url).origin !== allowedOrigin) externalRequests.push(url);
    } catch {
      externalRequests.push(url);
    }
  });

  try {
    const config = board(scenario.templateId, scenario.locale, scenario.mosqueName);
    await seed(page, scenario.locale, config);
    await page.goto(`${baseUrl}/?mode=smart-display`, { waitUntil: 'networkidle' });
    const root = page.locator('.smart-display');
    await root.waitFor({ state: 'visible' });

    if ((await root.getAttribute('data-display-template')) !== scenario.templateId) {
      throw new Error(`${scenario.name} did not consume persisted template configuration`);
    }
    if (
      (await page.locator(`[data-prayer-board-template="${scenario.templateId}"]`).count()) !== 1
    ) {
      throw new Error(`${scenario.name} did not render the persisted prayer-board template`);
    }
    if ((await page.locator('[data-prayer]').count()) < 5) {
      throw new Error(`${scenario.name} did not preserve the five-prayer timetable`);
    }
    const body = (await page.locator('body').textContent()) ?? '';
    if (!body.includes(scenario.mosqueName)) {
      throw new Error(`${scenario.name} did not render persisted mosque branding`);
    }
    if (
      scenario.locale === 'ar' &&
      (await page.evaluate(() => document.documentElement.dir)) !== 'rtl'
    ) {
      throw new Error('Arabic persisted display configuration did not render RTL');
    }

    const persisted = await page.evaluate(() => {
      const raw = localStorage.getItem('salahos.prayerBoardDisplayConfig');
      return raw === null ? null : JSON.parse(raw);
    });
    if (
      persisted?.templateId !== scenario.templateId ||
      persisted?.background?.kind !== 'builtin' ||
      typeof persisted?.background?.artworkId !== 'string'
    ) {
      throw new Error(
        `${scenario.name} persisted config was not retained: ${JSON.stringify(persisted)}`,
      );
    }
    for (const core of ['current-time', 'next-prayer', 'countdown', 'prayer-timetable']) {
      if (persisted.moduleVisibility?.[core] !== true) {
        throw new Error(`${scenario.name} core module ${core} was not visible`);
      }
    }

    const overflow = await overflowState(page);
    if (
      overflow.bodyScrollWidth > overflow.width + 2 ||
      overflow.documentScrollWidth > overflow.width + 2
    ) {
      throw new Error(`${scenario.name} display overflow: ${JSON.stringify(overflow)}`);
    }
    if (errors.length > 0) throw new Error(`${scenario.name} page errors: ${errors.join(' | ')}`);
    if (externalRequests.length > 0) {
      throw new Error(`${scenario.name} external requests: ${JSON.stringify(externalRequests)}`);
    }

    await assertHomeHubGeometry(page, scenario);
    await capture(page, scenario.name);
    return {
      name: scenario.name,
      template: scenario.templateId,
      locale: scenario.locale,
      persisted: true,
    };
  } finally {
    await context.close();
  }
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const results = [];
  for (const scenario of [
    {
      name: 'home-hub-1280x800-en',
      templateId: 'home-hub',
      locale: 'en',
      mosqueName: 'SalahOS Community Masjid',
      width: 1280,
      height: 800,
    },
    {
      name: 'home-hub-1280x800-ar-rtl',
      templateId: 'home-hub',
      locale: 'ar',
      mosqueName: 'مسجد صلاح',
      width: 1280,
      height: 800,
    },
    {
      name: 'home-hub-1920x1080-en',
      templateId: 'home-hub',
      locale: 'en',
      mosqueName: 'SalahOS Community Masjid',
      width: 1920,
      height: 1080,
    },
    {
      name: 'home-hub-390x844-ar-rtl',
      templateId: 'home-hub',
      locale: 'ar',
      mosqueName: 'مسجد صلاح',
      width: 390,
      height: 844,
    },
    {
      name: 'prayer-board-config-runtime-en',
      templateId: 'minimal-modern',
      locale: 'en',
      mosqueName: 'Stage 23 Local Masjid',
    },
    {
      name: 'prayer-board-config-runtime-ar-rtl',
      templateId: 'family-classroom',
      locale: 'ar',
      mosqueName: 'مسجد المرحلة ٢٣',
    },
  ]) {
    results.push(await validateRuntime(browser, scenario));
  }
  await writeFile(
    path.join(artifactDirectory, 'prayer-board-config-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(`Prayer-board persisted configuration checks passed: ${results.length} flows`);
} finally {
  await browser.close();
}
