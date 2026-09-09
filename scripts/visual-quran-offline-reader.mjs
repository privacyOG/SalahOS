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

function persistedSettings(locale = 'en') {
  return {
    version: 2,
    locale,
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  await page.addInitScript((settings) => {
    localStorage.setItem('salahos.settings', JSON.stringify(settings));
  }, persistedSettings());
  await page.goto(`${baseUrl}/?view=knowledge&knowledgeView=quran`, { waitUntil: 'networkidle' });

  const experience = page.locator('[data-knowledge-experience]');
  await experience.waitFor({ state: 'visible' });
  assert(
    (await experience.getAttribute('data-knowledge-view')) === 'quran',
    'Direct Qur’an Knowledge route did not activate the reader section',
  );

  const reader = page.locator('[data-quran-offline-reader]');
  await reader.waitFor({ state: 'visible' });
  await reader.getByText('114 surahs · 6,236 ayat', { exact: false }).waitFor();
  assert(
    (await reader.locator('[data-quran-translation-mode]').inputValue()) === 'salahos-2026',
    'SalahOS 2026 is not the default English meaning for a fresh reader',
  );

  const navigationDisclosure = reader.locator('[data-quran-navigation-disclosure]');
  assert(
    (await navigationDisclosure.getAttribute('open')) === null,
    'Secondary Qur’an navigation should be collapsed by default',
  );
  await navigationDisclosure.locator('summary').click();
  assert(
    (await navigationDisclosure.getAttribute('open')) !== null,
    'Qur’an navigation disclosure did not open on demand',
  );

  const surahIndex = reader.locator('[data-quran-surah-index]');
  await surahIndex.waitFor({ state: 'visible' });
  assert(
    (await surahIndex.locator('[data-quran-surah-option]').count()) === 114,
    'Complete Qur’an reader did not expose all 114 surahs in the searchable index',
  );
  const surahSearch = surahIndex.locator('[data-quran-surah-search]');
  await surahSearch.fill('not-a-surah');
  await surahIndex.locator('[data-quran-surah-search-empty]').waitFor({ state: 'visible' });
  await surahSearch.fill('2');
  const alBaqarahOption = surahIndex.locator('[data-quran-surah-option="2"]');
  await alBaqarahOption.waitFor({ state: 'visible' });
  const alBaqarahText = (await alBaqarahOption.textContent()) ?? '';
  assert(
    alBaqarahText.includes('286') && alBaqarahText.includes('Medinan'),
    'Searchable surah index did not expose Surah 2 ayah count and revelation place',
  );
  await alBaqarahOption.click();
  await reader.locator('[data-quran-virtual-scroll]').waitFor({ state: 'visible' });
  assert(
    (await reader.locator('[data-quran-virtual-key]').count()) < 20,
    'Al-Baqarah virtual reader rendered an unexpectedly large initial DOM window',
  );

  const openingBasmala = reader.locator('[data-quran-basmala]');
  assert(
    (await openingBasmala.count()) === 1,
    'An ordinary surah must render exactly one standalone opening Bismillah',
  );
  const basmalaText = ((await openingBasmala.textContent()) ?? '').trim();
  const alBaqarahFirst = reader.locator(
    '[data-quran-offline-ayah="2:1"] .knowledge-card__arabic',
  );
  await alBaqarahFirst.waitFor({ state: 'visible' });
  assert(
    !((await alBaqarahFirst.textContent()) ?? '').includes(basmalaText),
    'Surah 2 ayah 1 repeated the standalone Bismillah inside the ayah text',
  );

  await surahSearch.fill('1');
  const alFatihahOption = surahIndex.locator('[data-quran-surah-option="1"]');
  await alFatihahOption.waitFor({ state: 'visible' });
  await alFatihahOption.click();
  assert(
    (await reader.locator('[data-quran-basmala]').count()) === 0,
    'Al-Fatihah must not add a second standalone Bismillah above ayah 1',
  );
  const alFatihahFirst = reader.locator(
    '[data-quran-offline-ayah="1:1"] .knowledge-card__arabic',
  );
  await alFatihahFirst.waitFor({ state: 'visible' });
  assert(
    ((await alFatihahFirst.textContent()) ?? '').includes(basmalaText),
    'Al-Fatihah ayah 1 must retain the Bismillah as its ayah text',
  );
  await surahSearch.fill('');

  const search = reader.locator('[data-quran-offline-search]');
  await search.fill('114:6');
  const finalAyah = reader.locator('[data-quran-offline-ayah="114:6"]');
  await finalAyah.waitFor({ state: 'visible' });
  assert(
    (await finalAyah.locator('.knowledge-card__arabic').textContent())?.trim().length > 0,
    'Complete reader did not render Arabic for Qur’an 114:6',
  );
  assert(
    (await finalAyah.locator('.quran-offline-ayah__translation').count()) === 1,
    'Complete reader did not render the configured translation for Qur’an 114:6',
  );

  await finalAyah.click();
  await page.waitForFunction(() => {
    return (
      document.querySelector('[data-quran-offline-ayah="114:6"]')?.getAttribute('data-active') ===
      'true'
    );
  });
  await reader.locator('[data-quran-offline-bookmark="114:6"]').click();
  await reader.locator('[data-quran-offline-last-read="114:6"]').click();
  await page.waitForFunction(() => {
    const persistedPreferences = JSON.parse(
      localStorage.getItem('salahos.quran-reading-preferences.v1') ?? '{}',
    );
    return (
      persistedPreferences.bookmarkedAyahIds?.includes('114:6') === true &&
      persistedPreferences.lastReadAyahId === '114:6'
    );
  });
  const persisted = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('salahos.quran-reading-preferences.v1') ?? '{}'),
  );
  assert(
    persisted.bookmarkedAyahIds?.includes('114:6'),
    'Complete Qur’an bookmark did not persist by canonical verse key',
  );
  assert(
    persisted.lastReadAyahId === '114:6',
    'Complete Qur’an last-read position did not persist',
  );

  await search.fill('');
  await reader.locator('[data-quran-offline-resume]').click();
  await finalAyah.waitFor({ state: 'visible' });
  assert(
    (await finalAyah.getAttribute('data-resume-highlight')) === 'true',
    'Resume last read did not visibly highlight the restored ayah',
  );

  const preferencesDisclosure = reader.locator('[data-quran-preferences-disclosure]');
  assert(
    (await preferencesDisclosure.getAttribute('open')) === null,
    'Qur’an reading preferences should be collapsed by default',
  );
  await preferencesDisclosure.locator('summary').click();
  await reader.locator('[data-quran-reading-mode="page"]').click();
  const pageGroupingNote = reader.locator('[data-quran-page-grouping-note]');
  await pageGroupingNote.waitFor({ state: 'visible' });
  assert(
    ((await pageGroupingNote.textContent()) ?? '').includes('not a facsimile page'),
    'Page mode did not disclose that source-page grouping is not a facsimile',
  );
  await reader.locator('[data-quran-reading-mode="list"]').click();

  await reader.locator('[data-quran-translation-mode]').selectOption('none');
  await page.waitForFunction(() => {
    const serialized = localStorage.getItem('salahos.quran-reading-preferences.v1');
    return serialized ? JSON.parse(serialized).translationMode === 'none' : false;
  });
  assert(
    (await reader.locator('.quran-offline-ayah__translation').count()) === 0,
    'Complete reader did not synchronize Arabic-only mode',
  );

  await reader.locator('[data-quran-font-select]').selectOption('amiri-quran');
  await reader.locator('[data-quran-size-select]').selectOption('xlarge');
  await page.waitForFunction(() => {
    const ayah = document.querySelector(
      '[data-quran-offline-ayah="114:6"] .knowledge-card__arabic',
    );
    return (
      ayah?.getAttribute('data-quran-font') === 'amiri-quran' &&
      ayah.getAttribute('data-quran-scale') === 'xlarge'
    );
  });

  await reader.locator('[data-quran-translation-mode]').selectOption('pickthall-1930');
  await search.fill('20:14');
  const curatedAyah = reader.locator('[data-quran-offline-ayah="20:14"]');
  await curatedAyah.waitFor({ state: 'visible' });
  assert(
    (await curatedAyah.locator('.quran-offline-ayah__tafsir').count()) === 1,
    'Curated tafsir attribution was not connected to the complete Qur’an reader',
  );
  await curatedAyah.getByText('Tafsir al-Jalalayn', { exact: true }).waitFor();

  const relatedAyah = curatedAyah.locator('[data-quran-related-reference]').first();
  await relatedAyah.click();
  const returnToSearch = reader.locator('[data-quran-return-to-search]');
  await returnToSearch.waitFor({ state: 'visible' });
  assert((await search.inputValue()) === '', 'Related ayah navigation did not leave search view');
  await returnToSearch.click();
  assert(
    (await search.inputValue()) === '20:14',
    'Return-to-search did not restore the previous Qur’an query',
  );
  await curatedAyah.waitFor({ state: 'visible' });

  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert(
    metrics.scrollWidth <= metrics.innerWidth + 1,
    `Complete Qur’an reader caused mobile horizontal overflow: ${String(metrics.scrollWidth)}px > ${String(metrics.innerWidth)}px`,
  );

  await page.screenshot({
    path: path.join(artifactDirectory, 'stage55-complete-quran-reader-mobile.png'),
    fullPage: true,
    animations: 'disabled',
  });
  results.push({ name: 'complete-quran-reader-mobile', ...metrics });
  await context.close();

  await writeFile(
    path.join(artifactDirectory, 'stage55-complete-quran-reader-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log('Stage 55 complete Quran reader acceptance passed.');
} finally {
  await browser.close();
}
