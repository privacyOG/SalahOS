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

const { chromium } = await import(pathToFileURL(path.resolve(playwrightModule)).href);
const fixedNow = Date.parse('2026-08-23T05:30:00.000Z');
const persistedSettings = JSON.stringify({
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
});

const settingsScenarios = [
  {
    name: 'stage27-settings-location-phone',
    category: 'location',
    viewport: { width: 390, height: 844 },
    selector: '.settings-location-panel',
  },
  {
    name: 'stage27-settings-mosque-tablet',
    category: 'mosque',
    viewport: { width: 1024, height: 768 },
    selector: '.mosque-library-row',
  },
  {
    name: 'stage27-settings-notifications-phone',
    category: 'notifications',
    viewport: { width: 430, height: 932 },
    selector: '.notification-fieldset',
  },
  {
    name: 'stage27-settings-advanced-desktop',
    category: 'advanced',
    viewport: { width: 1440, height: 1000 },
    selector: '.offsets-fieldset',
  },
  {
    name: 'stage27-settings-display-themes-desktop',
    category: 'display-themes',
    viewport: { width: 1440, height: 1000 },
    selector: '.prayer-board-weather-settings',
  },
];

async function seed(page) {
  await page.addInitScript(
    ({ settings, now }) => {
      localStorage.setItem('salahos.settings', settings);
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
    { settings: persistedSettings, now: fixedNow },
  );
}

async function retirementState(page) {
  return page.evaluate(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    const rootLegacyTokens = [
      '--page',
      '--page-glow',
      '--text',
      '--muted',
      '--label',
      '--card',
      '--control',
      '--control-border',
      '--card-border',
      '--divider',
      '--accent',
      '--next-card',
      '--warning',
      '--warning-bg',
      '--provenance',
      '--shadow',
    ].filter((token) => rootStyle.getPropertyValue(token).trim().length > 0);
    return {
      viewportWidth: document.documentElement.clientWidth,
      bodyWidth: document.body.scrollWidth,
      documentWidth: document.documentElement.scrollWidth,
      legacyWrapperCount: document.querySelectorAll(
        '.settings-screen__legacy, .legacy-core-route, [data-settings-category]',
      ).length,
      nestedLegacyAppShellCount: document.querySelectorAll('.settings-screen .app-shell').length,
      rootLegacyTokens,
    };
  });
}

function assertRetired(name, state) {
  if (state.legacyWrapperCount !== 0 || state.nestedLegacyAppShellCount !== 0) {
    throw new Error(`${name} still exposes retired Settings composition: ${JSON.stringify(state)}`);
  }
  if (state.rootLegacyTokens.length !== 0) {
    throw new Error(
      `${name} still resolves root compatibility tokens: ${state.rootLegacyTokens.join(', ')}`,
    );
  }
  if (state.bodyWidth > state.viewportWidth + 2 || state.documentWidth > state.viewportWidth + 2) {
    throw new Error(`${name} horizontal overflow: ${JSON.stringify(state)}`);
  }
}

async function validateSettingsScenario(browser, scenario) {
  const context = await browser.newContext({
    viewport: scenario.viewport,
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  try {
    await seed(page);
    await page.goto(`${baseUrl}/?view=settings&settingsView=${scenario.category}`, {
      waitUntil: 'networkidle',
    });
    await page.locator('.settings-screen').waitFor({ state: 'visible' });
    await page.locator(scenario.selector).first().waitFor({ state: 'visible' });
    const state = await retirementState(page);
    const routeState = await page.evaluate((category) => {
      const route = document.querySelector('.congregation-route--settings');
      const screen = document.querySelector('.settings-screen');
      return {
        settingsRouteCount: document.querySelectorAll('.congregation-route--settings').length,
        settingsScreenCount: document.querySelectorAll('.settings-screen').length,
        ownedPanelCount: document.querySelectorAll('.settings-feature-panel, .settings-focus-panel')
          .length,
        categoryInUrl: new URLSearchParams(location.search).get('settingsView'),
        routeVisible: route instanceof HTMLElement && route.getBoundingClientRect().height > 0,
        screenVisible: screen instanceof HTMLElement && screen.getBoundingClientRect().height > 0,
        expectedCategory: category,
      };
    }, scenario.category);
    if (
      routeState.settingsRouteCount !== 1 ||
      routeState.settingsScreenCount !== 1 ||
      routeState.ownedPanelCount < 1 ||
      routeState.categoryInUrl !== scenario.category ||
      !routeState.routeVisible ||
      !routeState.screenVisible
    ) {
      throw new Error(`${scenario.name} v2 route ownership failed: ${JSON.stringify(routeState)}`);
    }
    if (pageErrors.length > 0) {
      throw new Error(`${scenario.name} page errors: ${pageErrors.join(' | ')}`);
    }
    assertRetired(scenario.name, state);
    await page.screenshot({
      path: path.join(artifactDirectory, `${scenario.name}.png`),
      fullPage: true,
      animations: 'disabled',
    });
    return { ...scenario, ...state, ...routeState };
  } finally {
    await context.close();
  }
}

async function validateSmartDisplay(browser) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  try {
    await seed(page);
    await page.goto(`${baseUrl}/?mode=smart-display&template=heritage-classic`, {
      waitUntil: 'networkidle',
    });
    await page.locator('.smart-display').waitFor({ state: 'visible' });
    const state = await retirementState(page);
    const displayState = await page.evaluate(() => ({
      smartDisplayCount: document.querySelectorAll('.smart-display').length,
      congregationShellCount: document.querySelectorAll('.congregation-shell').length,
      settingsScreenCount: document.querySelectorAll('.settings-screen').length,
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    }));
    if (
      displayState.smartDisplayCount !== 1 ||
      displayState.congregationShellCount !== 0 ||
      displayState.settingsScreenCount !== 0
    ) {
      throw new Error(`Stage 27 smart-display ownership failed: ${JSON.stringify(displayState)}`);
    }
    if (pageErrors.length > 0) {
      throw new Error(`Stage 27 smart-display page errors: ${pageErrors.join(' | ')}`);
    }
    assertRetired('stage27-smart-display-1080', state);
    await page.screenshot({
      path: path.join(artifactDirectory, 'stage27-smart-display-1080.png'),
      fullPage: false,
      animations: 'disabled',
    });
    return { name: 'stage27-smart-display-1080', ...state, ...displayState };
  } finally {
    await context.close();
  }
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const settingsResults = [];
  for (const scenario of settingsScenarios) {
    settingsResults.push(await validateSettingsScenario(browser, scenario));
  }
  const smartDisplay = await validateSmartDisplay(browser);
  const results = { settingsResults, smartDisplay };
  await writeFile(
    path.join(artifactDirectory, 'stage27-ui-v2-retirement-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
    'utf8',
  );
  console.log(`Stage 27 UI/UX v2 retirement acceptance passed: ${JSON.stringify(results)}`);
} finally {
  await browser.close();
}
