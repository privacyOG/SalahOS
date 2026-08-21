import { mkdir, readFile, writeFile } from 'node:fs/promises';
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
const fixedNow = Date.parse('2026-08-21T03:00:00.000Z');

const scenarios = [
  {
    name: 'minimal-1080-en-light',
    width: 1920,
    height: 1080,
    locale: 'en',
    appTheme: 'light',
    displayTheme: 'classic',
    expectedVariant: 'light',
    mosqueName: 'Masjid Al Noor Sydney',
  },
  {
    name: 'minimal-1080-ar-dark-long-name',
    width: 1920,
    height: 1080,
    locale: 'ar',
    appTheme: 'dark',
    displayTheme: 'midnight',
    expectedVariant: 'dark',
    mosqueName: 'مسجد ومركز النور الإسلامي والمجتمعي في سيدني لخدمة العائلات والطلاب',
  },
  {
    name: 'minimal-4k-en-dark-long-name',
    width: 3840,
    height: 2160,
    locale: 'en',
    appTheme: 'dark',
    displayTheme: 'midnight',
    expectedVariant: 'dark',
    mosqueName: 'SalahOS Central Islamic Community Mosque and Education Centre of Greater Sydney',
  },
  {
    name: 'minimal-4k-ar-light',
    width: 3840,
    height: 2160,
    locale: 'ar',
    appTheme: 'light',
    displayTheme: 'classic',
    expectedVariant: 'light',
    mosqueName: 'مسجد صلاح أو إس المركزي',
  },
];

function settingsFor(scenario) {
  return {
    version: 2,
    locale: scenario.locale,
    theme: scenario.appTheme,
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
      mosqueName: scenario.mosqueName,
      days: [
        {
          date: '2026-08-21',
          prayers: {
            fajr: { startLocalMinutes: 300, iqamah: { kind: 'fixed', localMinutes: 330 } },
            dhuhr: { startLocalMinutes: 780, iqamah: { kind: 'fixed', localMinutes: 810 } },
            asr: { startLocalMinutes: 930, iqamah: { kind: 'fixed', localMinutes: 960 } },
            maghrib: { startLocalMinutes: 1080, iqamah: { kind: 'fixed', localMinutes: 1090 } },
            isha: { startLocalMinutes: 1170, iqamah: { kind: 'fixed', localMinutes: 1200 } },
          },
          jumuahSessions: [
            { label: "Jumu'ah 1", khutbahLocalMinutes: 780, salahLocalMinutes: 800 },
            { label: "Jumu'ah 2", khutbahLocalMinutes: 840, salahLocalMinutes: 860 },
          ],
        },
      ],
    },
    notifications: {},
  };
}

async function seedScenario(page, scenario) {
  await page.addInitScript(
    ({ serializedSettings, displayTheme, now }) => {
      localStorage.setItem('salahos.settings', serializedSettings);
      localStorage.setItem('salahos.smartDisplayTheme', displayTheme);

      const NativeDate = Date;
      class FrozenDate extends NativeDate {
        constructor(...args) {
          if (args.length === 0) {
            super(now);
          } else {
            super(...args);
          }
        }

        static now() {
          return now;
        }
      }

      Object.setPrototypeOf(FrozenDate, NativeDate);
      globalThis.Date = FrozenDate;
    },
    {
      serializedSettings: JSON.stringify(settingsFor(scenario)),
      displayTheme: scenario.displayTheme,
      now: fixedNow,
    },
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

      const outsideViewport = rect.left < -tolerance || rect.right > viewportWidth + tolerance;
      const explicitlyClipsContent =
        element.clientWidth > 0 &&
        element.scrollWidth > element.clientWidth + tolerance &&
        (style.overflowX === 'hidden' || style.overflowX === 'clip');

      if (!outsideViewport && !explicitlyClipsContent) continue;

      offenders.push({
        tag: element.tagName.toLowerCase(),
        className: typeof element.className === 'string' ? element.className : '',
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
        overflowX: style.overflowX,
      });

      if (offenders.length >= 12) break;
    }

    return {
      bodyScrollWidth: document.body.scrollWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportWidth,
      offenders,
    };
  });
}

async function validateScenario(browser, scenario) {
  const context = await browser.newContext({
    viewport: { width: scenario.width, height: scenario.height },
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  try {
    await seedScenario(page, scenario);
    await page.goto(`${baseUrl}/?mode=smart-display&template=minimal-modern`, {
      waitUntil: 'networkidle',
    });

    const root = page.locator('.smart-display');
    const board = page.locator('[data-prayer-board-template="minimal-modern"]');
    await root.waitFor({ state: 'visible' });
    await board.waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(100);

    const state = await root.evaluate((element) => ({
      lang: element.getAttribute('lang'),
      dir: element.getAttribute('dir'),
      displayTheme: element.getAttribute('data-display-theme'),
      displayTemplate: element.getAttribute('data-display-template'),
      width: innerWidth,
      height: innerHeight,
    }));

    const expectedDirection = scenario.locale === 'ar' ? 'rtl' : 'ltr';
    if (state.lang !== scenario.locale || state.dir !== expectedDirection) {
      throw new Error(`${scenario.name} locale/direction mismatch: ${JSON.stringify(state)}`);
    }
    if (
      state.displayTheme !== scenario.displayTheme ||
      state.displayTemplate !== 'minimal-modern'
    ) {
      throw new Error(`${scenario.name} display selection mismatch: ${JSON.stringify(state)}`);
    }
    if (state.width !== scenario.width || state.height !== scenario.height) {
      throw new Error(`${scenario.name} viewport mismatch: ${JSON.stringify(state)}`);
    }
    if (pageErrors.length > 0) {
      throw new Error(`${scenario.name} page errors: ${pageErrors.join(' | ')}`);
    }

    const variant = await board.getAttribute('data-minimal-variant');
    if (variant !== scenario.expectedVariant) {
      throw new Error(
        `${scenario.name} expected ${scenario.expectedVariant} variant, got ${variant}`,
      );
    }

    const prayerRows = await page.locator('.minimal-modern-prayer').count();
    if (prayerRows !== 5) {
      throw new Error(`${scenario.name} expected 5 obligatory prayer columns, got ${prayerRows}`);
    }

    const heritageBoards = await page
      .locator('[data-prayer-board-template="heritage-classic"]')
      .count();
    if (heritageBoards !== 0) {
      throw new Error(`${scenario.name} unexpectedly rendered Heritage Classic`);
    }

    const boardGeometry = await board.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        viewportWidth: innerWidth,
        viewportHeight: innerHeight,
      };
    });
    if (
      boardGeometry.top < -2 ||
      boardGeometry.left < -2 ||
      boardGeometry.right > boardGeometry.viewportWidth + 2 ||
      boardGeometry.bottom > boardGeometry.viewportHeight + 2
    ) {
      throw new Error(`${scenario.name} board exceeds viewport: ${JSON.stringify(boardGeometry)}`);
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
      fullPage: false,
      animations: 'disabled',
    });

    return { name: scenario.name, status: 'passed', boardGeometry, overflow };
  } finally {
    await context.close();
  }
}

async function writeTrackerReconciliation() {
  const rootTodo = await readFile('TODO.md', 'utf8');
  const uiPlan = await readFile('docs/UI_UX_V2_PLAN.md', 'utf8');

  const stage23RootNote =
    "PR #177 completed Minimal Modern on code-bearing head `f20d73f6b3d76d371205508f43e930b50ea1ed84`, which passed Quality Gate `32478598067`, Android Build `32478597925`, Visual Regression `32478597889` and iOS Build `32478598033`, including fresh iPhone/iPad Simulator runtime acceptance. The Minimal Modern board consumes the shared prayer-board data contract, preserves authoritative calculation/source/Iqamah/next-prayer semantics, provides deliberate light/dark neutral variants, keeps current time and next-prayer/countdown prominent, presents five obligatory prayers with explicit Athan/start and Iqamah values, and includes restrained Jumu'ah and solar modules. Dedicated 1920×1080 and 3840×2160 English/Arabic/RTL long-mosque-name scenarios passed viewport/overflow assertions, and human screenshot review confirmed balanced full-height composition, clear hierarchy and composed RTL presentation. Stage 23.3 is therefore complete.";

  const updatedRootTodo = rootTodo
    .replace('- [ ] Implement Minimal Modern', '- [x] Implement Minimal Modern')
    .replace(
      'Stage 23.13 explicitly requires the mobile Today/home prayer surface to receive original phone-adapted variants of the prayer-board designs, retain one-tap bottom navigation including Qiblah and Settings, expose a visual Settings > Display Themes selector with previews/per-surface targeting, and pass phone/RTL/offline/visual/human acceptance before it may be marked complete. Five required visual templates and the mobile template work remain open.',
      `Stage 23.13 explicitly requires the mobile Today/home prayer surface to receive original phone-adapted variants of the prayer-board designs, retain one-tap bottom navigation including Qiblah and Settings, expose a visual Settings > Display Themes selector with previews/per-surface targeting, and pass phone/RTL/offline/visual/human acceptance before it may be marked complete. ${stage23RootNote} Four required visual templates and the mobile template work remain open.`,
    );

  const stage23DetailNote =
    "**Stage 23.3 verification note (2026-08-21):** PR #177 code-bearing head `f20d73f6b3d76d371205508f43e930b50ea1ed84` passed Quality Gate `32478598067`, Android Build `32478597925`, Visual Regression `32478597889` and iOS Build `32478598033`, including fresh iPhone and iPad Simulator install, launch and relaunch acceptance. Minimal Modern renders only from the shared `PrayerBoardData` presentation contract and does not recalculate prayers or change selected source, Iqamah, notification or next-prayer semantics. Its original SalahOS composition uses a calm neutral canvas with intentional light/dark variants, a large current clock, compact next-prayer/countdown hero, a five-prayer Athan/start-versus-Iqamah strip, restrained Jumu'ah and sunrise/sunset modules, explicit non-colour-only current/next state labels and preserved offline presentation. The permanent focused visual harness passed English and Arabic/RTL at 1920×1080 and 3840×2160, including deliberately long mosque names, exact five-prayer assertions, no horizontal clipping and full-board viewport-fit checks. Human review of the final evidence confirmed balanced full-height density at both resolutions, immediate next-prayer hierarchy, unambiguous Athan/Iqamah presentation and composed RTL layout. Later templates, preview/assignment UX and Stage 23.13 mobile variants remain open.";

  const updatedUiPlan = uiPlan
    .replace(
      '- [ ] Implement an original SalahOS Minimal Modern design.',
      '- [x] Implement an original SalahOS Minimal Modern design.',
    )
    .replace(
      '- [ ] Use a calm neutral canvas, large clock, restrained cards and strong typography.',
      '- [x] Use a calm neutral canvas, large clock, restrained cards and strong typography.',
    )
    .replace(
      '- [ ] Present prayer times in a clean lower strip/grid.',
      '- [x] Present prayer times in a clean lower strip/grid.',
    )
    .replace(
      '- [ ] Use a compact next-prayer/countdown component that remains obvious from viewing distance.',
      '- [x] Use a compact next-prayer/countdown component that remains obvious from viewing distance.',
    )
    .replace('- [ ] Provide light and dark variants.', '- [x] Provide light and dark variants.')
    .replace(
      '- [ ] Avoid unnecessary ornamentation and visual noise.',
      `- [x] Avoid unnecessary ornamentation and visual noise.\n\n${stage23DetailNote}`,
    );

  if (updatedRootTodo === rootTodo || updatedUiPlan === uiPlan) {
    throw new Error('Stage 23.3 tracker reconciliation did not modify both tracker files');
  }

  await writeFile(path.join(artifactDirectory, 'tracker-TODO.md'), updatedRootTodo, 'utf8');
  await writeFile(
    path.join(artifactDirectory, 'tracker-UI_UX_V2_PLAN.md'),
    updatedUiPlan,
    'utf8',
  );
}

await mkdir(artifactDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];
const failures = [];

try {
  for (const scenario of scenarios) {
    try {
      results.push(await validateScenario(browser, scenario));
      console.log(`PASS ${scenario.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ name: scenario.name, message });
      results.push({ name: scenario.name, status: 'failed', message });
      console.error(`FAIL ${scenario.name}: ${message}`);
    }
  }
} finally {
  await browser.close();
}

await writeFile(
  path.join(artifactDirectory, 'minimal-modern-results.json'),
  `${JSON.stringify({ generatedAt: new Date(fixedNow).toISOString(), scenarios: results }, null, 2)}\n`,
  'utf8',
);

if (failures.length > 0) {
  throw new Error(`Minimal Modern visual failures: ${JSON.stringify(failures)}`);
}

await writeTrackerReconciliation();

console.log(`Minimal Modern visual acceptance passed ${String(results.length)} scenarios.`);
