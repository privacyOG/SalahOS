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

function persistedSettings() {
  return {
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
}

async function seed(page) {
  await page.addInitScript((settings) => {
    localStorage.setItem('salahos.settings', JSON.stringify(settings));
  }, persistedSettings());
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
  return metrics;
}

async function validateAssistiveTechnologySemantics(page, name) {
  const result = await page.evaluate(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== 'hidden' &&
        style.display !== 'none'
      );
    };
    const controls = [
      ...document.querySelectorAll('button, a, summary, input, select, textarea'),
    ].filter((element) => element instanceof HTMLElement && visible(element));
    const unnamed = controls
      .filter((element) => {
        const text = element.textContent?.trim() ?? '';
        const aria = element.getAttribute('aria-label')?.trim() ?? '';
        const labelledBy = element.getAttribute('aria-labelledby')?.trim() ?? '';
        const title = element.getAttribute('title')?.trim() ?? '';
        return (
          text.length === 0 && aria.length === 0 && labelledBy.length === 0 && title.length === 0
        );
      })
      .map((element) => `${element.tagName.toLowerCase()}.${element.className}`);
    return {
      controls: controls.length,
      unnamed,
      currentPrayerAnnouncements: document.querySelectorAll('[data-current-prayer]').length,
      direction: document.documentElement.dir || 'ltr',
    };
  });
  if (result.controls === 0) throw new Error(`${name} exposed no interactive controls`);
  if (result.unnamed.length > 0) {
    throw new Error(
      `${name} has visible controls without accessible names: ${result.unnamed.join(', ')}`,
    );
  }
  if (result.currentPrayerAnnouncements === 0) {
    throw new Error(`${name} did not expose current-prayer semantics`);
  }
  return result;
}

async function validateProfile(browser, profile) {
  const context = await browser.newContext({
    viewport: { width: profile.width, height: profile.height },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  try {
    await seed(page);
    await page.goto(`${baseUrl}/?view=today`, { waitUntil: 'networkidle' });
    await page.locator('.today-screen').waitFor({ state: 'visible' });

    const reducedMotion = await page.evaluate(
      () => globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    if (!reducedMotion)
      throw new Error(`${profile.name} did not receive reduced-motion preference`);

    const semantics = await validateAssistiveTechnologySemantics(page, profile.name);
    const normalOverflow = await assertNoHorizontalOverflow(page, profile.name);

    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await page.waitForTimeout(50);
    const largeTextOverflow = await assertNoHorizontalOverflow(
      page,
      `${profile.name} at 200% text`,
    );
    const nextPrayerVisible = await page.locator('.today-next').isVisible();
    if (!nextPrayerVisible)
      throw new Error(`${profile.name} lost the next-prayer hierarchy at 200% text`);

    await page.screenshot({
      path: path.join(artifactDirectory, `${profile.name}-large-text.png`),
      fullPage: true,
      animations: 'disabled',
    });

    return { ...profile, reducedMotion, semantics, normalOverflow, largeTextOverflow };
  } finally {
    await context.close();
  }
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const profiles = [];
  for (const profile of [
    { name: 'stage58-android-phone-semantics', width: 412, height: 915 },
    { name: 'stage58-iphone-semantics', width: 390, height: 844 },
    { name: 'stage58-ipad-semantics', width: 820, height: 1180 },
  ]) {
    profiles.push(await validateProfile(browser, profile));
  }

  await writeFile(
    path.join(artifactDirectory, 'stage58-real-world-verification.json'),
    `${JSON.stringify({ profiles }, null, 2)}\n`,
  );
  console.log(
    'Stage 58 assistive-technology semantic, 200% text and reduced-motion acceptance passed.',
  );
} finally {
  await browser.close();
}
