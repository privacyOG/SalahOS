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
const fixedNow = Date.parse('2026-08-23T05:30:00.000Z');
const templates = [
  ['heritage-classic', '.heritage-classic-board'],
  ['minimal-modern', '.minimal-modern-board'],
  ['bold-countdown-focus', '.bold-countdown-board'],
  ['structured-split-board', '.structured-split-board'],
  ['scenic-spiritual', '.scenic-spiritual-board'],
  ['family-classroom', '.family-classroom-board'],
];

function persistedSettings(locale = 'en') {
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

async function seed(page, locale = 'en') {
  await page.addInitScript(
    ({ serializedSettings, now }) => {
      localStorage.setItem('salahos.settings', serializedSettings);
      const NativeDate = Date;
      class FrozenDate extends NativeDate {
        constructor(...args) {
          if (args.length === 0) super(now);
          else super(...args);
        }
        static now() {
          return now;
        }
      }
      Object.setPrototypeOf(FrozenDate, NativeDate);
      globalThis.Date = FrozenDate;
    },
    { serializedSettings: JSON.stringify(persistedSettings(locale)), now: fixedNow },
  );
}

async function assertNoHorizontalOverflow(page, name) {
  const metrics = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
  }));
  if (metrics.body > metrics.viewport + 2 || metrics.document > metrics.viewport + 2) {
    throw new Error(`${name} horizontal overflow: ${JSON.stringify(metrics)}`);
  }
}

async function validateTouchDisplay(browser, scenario) {
  const context = await browser.newContext({
    viewport: { width: scenario.width, height: scenario.height },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  try {
    const query = new URLSearchParams({
      fixture: 'touch-display-2',
      display: scenario.size,
      orientation: scenario.orientation,
      locale: scenario.locale,
    });
    await page.goto(`${baseUrl}/?${query.toString()}`, { waitUntil: 'networkidle' });
    const root = page.locator('.touch-display-fixture');
    await root.waitFor({ state: 'visible' });
    await assertNoHorizontalOverflow(page, scenario.name);

    const metrics = await page.evaluate(() => {
      const rootElement = document.querySelector('.touch-display-fixture');
      const recovery = document.querySelector('.touch-display-fixture-recovery');
      const prayerGrid = document.querySelector('.touch-display-fixture .prayer-grid');
      if (!(rootElement instanceof HTMLElement) || !(recovery instanceof HTMLElement)) {
        throw new Error('Touch Display root/recovery control missing');
      }
      if (!(prayerGrid instanceof HTMLElement)) {
        throw new Error('Touch Display prayer grid missing');
      }
      const recoveryRect = recovery.getBoundingClientRect();
      const recoveryStyle = getComputedStyle(recovery);
      return {
        viewport: rootElement.dataset.viewport ?? '',
        size: rootElement.dataset.displaySize ?? '',
        orientation: rootElement.dataset.orientation ?? '',
        recoveryWidth: recoveryRect.width,
        recoveryHeight: recoveryRect.height,
        recoveryOpacity: Number.parseFloat(recoveryStyle.opacity),
        prayerColumns: getComputedStyle(prayerGrid).gridTemplateColumns.split(' ').length,
      };
    });

    if (metrics.viewport !== `${String(scenario.width)}x${String(scenario.height)}`) {
      throw new Error(`${scenario.name} fixture viewport mismatch: ${metrics.viewport}`);
    }
    if (metrics.recoveryWidth < 44 || metrics.recoveryHeight < 44) {
      throw new Error(`${scenario.name} recovery target is below 44px: ${JSON.stringify(metrics)}`);
    }
    if (metrics.recoveryOpacity > 0.6) {
      throw new Error(`${scenario.name} recovery affordance is too visually dominant`);
    }

    await page.screenshot({
      path: path.join(artifactDirectory, `${scenario.name}.png`),
      fullPage: true,
      animations: 'disabled',
    });

    if (scenario.verifyRecovery === true) {
      await page.locator('.touch-display-fixture-recovery').click();
      await page.waitForURL((url) => url.searchParams.get('view') === 'today');
      if (new URL(page.url()).searchParams.has('fixture')) {
        throw new Error(`${scenario.name} recovery did not leave fixture mode`);
      }
    }

    return { name: scenario.name, ...metrics };
  } finally {
    await context.close();
  }
}

async function validatePrayerBoard(browser, templateId, selector, width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: 'no-preference',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const name = `stage25-tv-${templateId}-${width === 1920 ? '1080' : '4k'}`;
  try {
    await seed(page, 'en');
    await page.goto(`${baseUrl}/?mode=smart-display&template=${templateId}`, {
      waitUntil: 'networkidle',
    });
    const root = page.locator(selector);
    await root.waitFor({ state: 'visible' });
    await assertNoHorizontalOverflow(page, name);

    const geometry = await root.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
      };
    });
    const burnInFrame = page.locator('.prayer-board-configured-surface');
    const burnIn = await page.locator('.smart-display').evaluate((display) => {
      const frame = display.querySelector('.prayer-board-configured-surface');
      if (!(frame instanceof HTMLElement)) throw new Error('Configured display frame missing');
      return {
        shiftIndex: display.dataset.burnInShift ?? '',
        transform: getComputedStyle(frame).transform,
      };
    });
    const metrics = { ...geometry, ...burnIn };
    const safeInset = 32;
    if (
      metrics.left < safeInset ||
      metrics.top < safeInset ||
      metrics.right > width - safeInset ||
      metrics.bottom > height - safeInset
    ) {
      throw new Error(`${name} escaped the validated safe frame: ${JSON.stringify(metrics)}`);
    }
    if (metrics.shiftIndex === '0' || metrics.transform === 'none') {
      throw new Error(`${name} burn-in mitigation is not active: ${JSON.stringify(metrics)}`);
    }

    if (templateId === 'heritage-classic' && width === 1920) {
      await page.screenshot({
        path: path.join(artifactDirectory, `${name}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    }
    if (templateId === 'family-classroom' && width === 3840) {
      await page.screenshot({
        path: path.join(artifactDirectory, `${name}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    }

    return { name, ...metrics };
  } finally {
    await context.close();
  }
}

async function validateReducedMotion(browser) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  try {
    await seed(page, 'en');
    await page.goto(`${baseUrl}/?mode=smart-display&template=minimal-modern`, {
      waitUntil: 'networkidle',
    });
    await page.locator('.minimal-modern-board').waitFor({ state: 'visible' });
    const burnInFrame = page.locator('.prayer-board-configured-surface');
    const transform = await burnInFrame.evaluate((element) => getComputedStyle(element).transform);
    if (transform !== 'none') {
      throw new Error(`Reduced-motion display still shifts: ${transform}`);
    }
    return transform;
  } finally {
    await context.close();
  }
}

async function validateKeyboardRecovery(browser) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  try {
    await seed(page, 'en');
    await page.goto(`${baseUrl}/?mode=smart-display&template=heritage-classic`, {
      waitUntil: 'networkidle',
    });
    await page.locator('.heritage-classic-board').waitFor({ state: 'visible' });
    await page.keyboard.press('Escape');
    await page.waitForURL((url) => url.searchParams.get('mode') !== 'smart-display');
    return page.url();
  } finally {
    await context.close();
  }
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const touch = [];
  for (const scenario of [
    {
      name: 'stage25-touch-5-portrait-en',
      size: '5',
      orientation: 'portrait',
      locale: 'en',
      width: 720,
      height: 1280,
      verifyRecovery: false,
    },
    {
      name: 'stage25-touch-7-landscape-en',
      size: '7',
      orientation: 'landscape',
      locale: 'en',
      width: 1280,
      height: 720,
      verifyRecovery: true,
    },
    {
      name: 'stage25-touch-10-portrait-ar',
      size: '10',
      orientation: 'portrait',
      locale: 'ar',
      width: 1200,
      height: 1920,
      verifyRecovery: false,
    },
    {
      name: 'stage25-touch-10-landscape-ar',
      size: '10',
      orientation: 'landscape',
      locale: 'ar',
      width: 1920,
      height: 1200,
      verifyRecovery: false,
    },
  ]) {
    touch.push(await validateTouchDisplay(browser, scenario));
  }

  const tv = [];
  for (const [templateId, selector] of templates) {
    tv.push(await validatePrayerBoard(browser, templateId, selector, 1920, 1080));
    tv.push(await validatePrayerBoard(browser, templateId, selector, 3840, 2160));
  }

  const reducedMotion = await validateReducedMotion(browser);
  const keyboardRecoveryUrl = await validateKeyboardRecovery(browser);
  await writeFile(
    path.join(artifactDirectory, 'stage25-display-device-results.json'),
    `${JSON.stringify({ touch, tv, reducedMotion, keyboardRecoveryUrl }, null, 2)}\n`,
  );
  console.log(
    `Stage 25 Touch Display and TV/kiosk acceptance passed: ${String(touch.length)} touch profiles and ${String(tv.length)} prayer-board profiles.`,
  );
} finally {
  await browser.close();
}
