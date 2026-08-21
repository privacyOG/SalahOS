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

async function seed(page, locale) {
  await page.addInitScript(
    ({ serializedSettings }) => {
      localStorage.setItem('salahos.settings', serializedSettings);
    },
    { serializedSettings: JSON.stringify(settingsFor(locale)) },
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

async function validateEnglishFlow(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
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
    await seed(page, 'en');
    await page.goto(`${baseUrl}/?surface=admin&adminView=themes`, { waitUntil: 'networkidle' });
    await page.locator('.prayer-board-config-editor').waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready);

    if ((await page.locator('.prayer-board-template-card').count()) !== 6) {
      throw new Error('display-theme gallery must render exactly six required templates');
    }
    if ((await page.locator('.prayer-board-template-card[aria-pressed="true"]').count()) !== 1) {
      throw new Error('display-theme gallery must expose exactly one selected template');
    }

    await capture(page, 'prayer-board-config-gallery-en');

    await page.locator('[data-template-card="minimal-modern"]').click();
    const mosqueName = page.locator('input[placeholder="Mosque branding"]');
    await mosqueName.fill('Stage 23 Preview Masjid');

    const apply = page.locator('.prayer-board-config-actions button.primary');
    if (!(await apply.isDisabled())) {
      throw new Error('apply must remain disabled until the current draft is previewed');
    }

    await page.locator('.prayer-board-config-actions button.secondary').click();
    const preview = page.locator('.prayer-board-fullscreen-preview');
    await preview.waitFor({ state: 'visible' });
    if ((await page.locator('[data-prayer-board-template="minimal-modern"]').count()) !== 1) {
      throw new Error('full-screen preview did not render the selected template');
    }
    await page.setViewportSize({ width: 1920, height: 1080 });
    await capture(page, 'prayer-board-config-preview-en');

    await page.locator('.prayer-board-fullscreen-preview__close').click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    if (await apply.isDisabled()) {
      throw new Error('apply must become available after previewing the current draft');
    }
    await apply.click();

    const persisted = await page.evaluate(() => {
      const raw = localStorage.getItem('salahos.prayerBoardDisplayConfig');
      return raw === null ? null : JSON.parse(raw);
    });
    if (persisted?.templateId !== 'minimal-modern') {
      throw new Error(`applied template was not persisted: ${JSON.stringify(persisted)}`);
    }
    for (const core of ['current-time', 'next-prayer', 'countdown', 'prayer-timetable']) {
      if (persisted.moduleVisibility?.[core] !== true) {
        throw new Error(`core module ${core} was not forced visible`);
      }
    }

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${baseUrl}/?mode=smart-display`, { waitUntil: 'networkidle' });
    const root = page.locator('.smart-display');
    await root.waitFor({ state: 'visible' });
    if ((await root.getAttribute('data-display-template')) !== 'minimal-modern') {
      throw new Error('smart-display runtime did not consume the applied template configuration');
    }
    if ((await page.locator('[data-prayer-board-template="minimal-modern"]').count()) !== 1) {
      throw new Error('smart-display runtime did not render the applied prayer board');
    }
    if ((await page.locator('.minimal-modern-prayer').count()) !== 5) {
      throw new Error('applied prayer board did not preserve the five obligatory prayers');
    }
    if (!(await page.locator('body').textContent()).includes('Stage 23 Preview Masjid')) {
      throw new Error('applied mosque branding was not rendered');
    }

    const overflow = await overflowState(page);
    if (
      overflow.bodyScrollWidth > overflow.width + 2 ||
      overflow.documentScrollWidth > overflow.width + 2
    ) {
      throw new Error(`applied display overflow: ${JSON.stringify(overflow)}`);
    }
    if (errors.length > 0) throw new Error(`page errors: ${errors.join(' | ')}`);
    if (externalRequests.length > 0) {
      throw new Error(`external requests: ${JSON.stringify(externalRequests)}`);
    }

    await capture(page, 'prayer-board-config-applied-display-en');
    return { galleryTemplates: 6, appliedTemplate: persisted.templateId };
  } finally {
    await context.close();
  }
}

async function validateArabicPreview(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));

  try {
    await seed(page, 'ar');
    await page.goto(`${baseUrl}/?surface=admin&adminView=themes`, { waitUntil: 'networkidle' });
    await page.locator('.prayer-board-config-editor').waitFor({ state: 'visible' });
    await page.locator('[data-template-card="family-classroom"]').click();
    await page.locator('.prayer-board-config-actions button.secondary').click();
    await page.setViewportSize({ width: 1920, height: 1080 });

    const stage = page.locator('.prayer-board-fullscreen-preview__stage');
    await stage.waitFor({ state: 'visible' });
    if (
      (await stage.getAttribute('dir')) !== 'rtl' ||
      (await stage.getAttribute('lang')) !== 'ar'
    ) {
      throw new Error('Arabic preview did not preserve RTL direction and language');
    }
    if ((await page.locator('[data-prayer-board-template="family-classroom"]').count()) !== 1) {
      throw new Error('Arabic full-screen preview did not render Family & Classroom');
    }
    if (!(await page.locator('body').textContent()).includes('الصلاة')) {
      throw new Error('Arabic prayer copy was not present in preview');
    }
    if (errors.length > 0) throw new Error(`Arabic preview page errors: ${errors.join(' | ')}`);

    await capture(page, 'prayer-board-config-preview-ar-rtl');
    return { direction: 'rtl', template: 'family-classroom' };
  } finally {
    await context.close();
  }
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const results = [await validateEnglishFlow(browser), await validateArabicPreview(browser)];
  await writeFile(
    path.join(artifactDirectory, 'prayer-board-config-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(`Prayer-board configuration visual checks passed: ${results.length} flows`);
} finally {
  await browser.close();
}
