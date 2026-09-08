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

function settings(locale) {
  return {
    version: 2,
    locale,
    theme: 'light',
    palette: 'salah-classic',
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
  await page.addInitScript((persisted) => {
    localStorage.setItem('salahos.settings', JSON.stringify(persisted));
  }, settings(locale));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function assertNoPageOverflow(page, name) {
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert(
    metrics.scrollWidth <= metrics.innerWidth + 1,
    `${name} caused horizontal page overflow: ${String(metrics.scrollWidth)} > ${String(metrics.innerWidth)}`,
  );
  return metrics;
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    await seed(page, 'en');
    await page.goto(`${baseUrl}/?view=calendar`, { waitUntil: 'networkidle' });

    const calendar = page.locator('.prayer-calendar');
    await calendar.waitFor({ state: 'visible' });
    await calendar.getByText('Prayer Calendar', { exact: true }).waitFor();
    const agenda = calendar.locator('[data-calendar-agenda]');
    await agenda.waitFor({ state: 'visible' });
    assert(
      (await agenda.locator('[data-calendar-day-card]').count()) >= 28,
      'Monthly mobile agenda is incomplete',
    );
    assert(
      !(await calendar.locator('[data-calendar-desktop-timetable]').isVisible()),
      'Desktop timetable remained visible on mobile',
    );

    const mobileTimetable = calendar.locator('[data-calendar-full-timetable]');
    assert(
      (await mobileTimetable.getAttribute('open')) === null,
      'Full mobile timetable should start collapsed',
    );
    await mobileTimetable.locator('summary').click();
    await mobileTimetable.locator('table').waitFor({ state: 'visible' });
    const metrics = await assertNoPageOverflow(page, 'English mobile calendar');

    await page.screenshot({
      path: path.join(artifactDirectory, 'v160-calendar-phone-en.png'),
      fullPage: true,
      animations: 'disabled',
    });
    results.push({ name: 'phone-en', ...metrics });
    await context.close();
  }

  {
    const context = await browser.newContext({
      viewport: { width: 360, height: 780 },
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    await seed(page, 'ar');
    await page.goto(`${baseUrl}/?view=calendar`, { waitUntil: 'networkidle' });

    const calendar = page.locator('.prayer-calendar');
    await calendar.waitFor({ state: 'visible' });
    await calendar.getByText('تقويم الصلاة', { exact: true }).waitFor();
    assert(
      (await page.locator('html').getAttribute('dir')) === 'rtl',
      'Arabic calendar did not use RTL',
    );
    await calendar.getByRole('tab', { name: 'شهري' }).waitFor();
    await calendar.locator('[data-calendar-agenda]').waitFor({ state: 'visible' });
    await calendar.getByText('الجدول الكامل', { exact: true }).waitFor();
    const metrics = await assertNoPageOverflow(page, 'Arabic mobile calendar');

    await page.screenshot({
      path: path.join(artifactDirectory, 'v160-calendar-phone-ar.png'),
      fullPage: true,
      animations: 'disabled',
    });
    results.push({ name: 'phone-ar-rtl', ...metrics });
    await context.close();
  }
} finally {
  await browser.close();
}

await writeFile(
  path.join(artifactDirectory, 'v160-prayer-calendar-results.json'),
  `${JSON.stringify(results, null, 2)}\n`,
);
console.log(JSON.stringify(results, null, 2));
