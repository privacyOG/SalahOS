import { access, mkdir, writeFile } from 'node:fs/promises';
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

const prayerTimetable = {
  mosqueName: 'Masjid Al Noor',
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
      taraweehSessions: [{ label: 'Taraweeh', startLocalMinutes: 1230 }],
    },
  ],
};

const mosqueLibrary = {
  version: 1,
  selectedProfileId: 'masjid-al-noor:sydney',
  profiles: [
    {
      id: 'masjid-al-noor:sydney',
      organizationId: null,
      parentMosqueId: null,
      name: { en: 'Masjid Al Noor', ar: 'مسجد النور' },
      description: null,
      address: { formatted: '12 Community Street, Sydney NSW', countryCode: 'AU' },
      coordinates: { latitude: -33.873, longitude: 151.207 },
      timeZone: 'Australia/Sydney',
      facilities: ['wudu', 'parking', 'women-prayer-space', 'wheelchair-accessible'],
      accessibilityNotes: null,
      contact: { links: [] },
      logo: null,
    },
  ],
};

const communityLibrary = {
  version: 1,
  announcements: [
    {
      announcementId: 'stage26-announcement',
      mosqueId: 'masjid-al-noor:sydney',
      english: {
        title: 'Friday parking update',
        body: 'Please keep the western access lane clear before Jumu‘ah.',
      },
      arabic: {
        title: 'تحديث مواقف الجمعة',
        body: 'يرجى إبقاء ممر الدخول الغربي خالياً قبل صلاة الجمعة.',
      },
      imageUrl: null,
      callToActionUrl: null,
      priority: 'priority',
      pinned: true,
      surfaces: ['mobile', 'web'],
      startsAt: '2026-08-20T00:00:00.000Z',
      endsAt: '2026-08-22T12:00:00.000Z',
      recurrence: 'none',
      archived: false,
    },
  ],
  events: [
    {
      eventId: 'stage26-event',
      mosqueId: 'masjid-al-noor:sydney',
      english: {
        title: 'Family breakfast and community information session',
        description: 'A community breakfast after the weekend Fajr prayer.',
      },
      arabic: {
        title: 'فطور العائلات وجلسة المعلومات المجتمعية',
        description: 'فطور مجتمعي بعد صلاة الفجر في عطلة نهاية الأسبوع.',
      },
      venue: 'Community hall',
      allDay: false,
      startsAt: '2026-08-22T21:00:00.000Z',
      endsAt: '2026-08-22T23:00:00.000Z',
      recurrence: 'none',
      imageUrl: null,
      registrationUrl: null,
      surfaces: ['mobile', 'web'],
    },
  ],
};

function settings(locale, theme) {
  return {
    version: 2,
    locale,
    theme,
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
    mosqueTimetable: prayerTimetable,
    notifications: {},
  };
}

async function seed(page, locale, theme, displayTheme = null) {
  await page.addInitScript(
    ({ persistedSettings, persistedMosques, persistedCommunity, now, palette }) => {
      localStorage.setItem('salahos.settings', persistedSettings);
      localStorage.setItem('salahos.mosqueProfileLibrary', persistedMosques);
      localStorage.setItem('salahos.communityContent', persistedCommunity);
      if (palette !== null) localStorage.setItem('salahos.smartDisplayTheme', palette);

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
    {
      persistedSettings: JSON.stringify(settings(locale, theme)),
      persistedMosques: JSON.stringify(mosqueLibrary),
      persistedCommunity: JSON.stringify(communityLibrary),
      now: fixedNow,
      palette: displayTheme,
    },
  );
}

function parseCssColor(value) {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  const shortHex = /^#([0-9a-f]{3})$/i.exec(normalized);
  if (shortHex) {
    const [r, g, b] = shortHex[1].split('').map((digit) => Number.parseInt(`${digit}${digit}`, 16));
    return { r, g, b, a: 1 };
  }
  const longHex = /^#([0-9a-f]{6})$/i.exec(normalized);
  if (longHex) {
    return {
      r: Number.parseInt(longHex[1].slice(0, 2), 16),
      g: Number.parseInt(longHex[1].slice(2, 4), 16),
      b: Number.parseInt(longHex[1].slice(4, 6), 16),
      a: 1,
    };
  }
  const rgb =
    /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i.exec(
      normalized,
    );
  if (!rgb) throw new Error(`Unsupported CSS colour ${value}`);
  const alphaRaw = rgb[4] ?? '1';
  const alpha = alphaRaw.endsWith('%')
    ? Number.parseFloat(alphaRaw) / 100
    : Number.parseFloat(alphaRaw);
  return {
    r: Number.parseFloat(rgb[1]),
    g: Number.parseFloat(rgb[2]),
    b: Number.parseFloat(rgb[3]),
    a: alpha,
  };
}

function composite(foreground, background) {
  const a = foreground.a + background.a * (1 - foreground.a);
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
  return {
    r: (foreground.r * foreground.a + background.r * background.a * (1 - foreground.a)) / a,
    g: (foreground.g * foreground.a + background.g * background.a * (1 - foreground.a)) / a,
    b: (foreground.b * foreground.a + background.b * background.a * (1 - foreground.a)) / a,
    a,
  };
}

function relativeLuminance(color) {
  const channel = (component) => {
    const value = component / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

function contrastRatio(foreground, background) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function assertContrast(name, foreground, background, minimum = 4.5) {
  const ratio = contrastRatio(foreground, background);
  if (ratio + 0.001 < minimum) {
    throw new Error(`${name} contrast ${ratio.toFixed(2)} is below ${minimum.toFixed(1)}:1`);
  }
  return Number(ratio.toFixed(2));
}

async function readVariables(page, selector, names) {
  return page.locator(selector).evaluate((element, requestedNames) => {
    const style = getComputedStyle(element);
    return Object.fromEntries(
      requestedNames.map((name) => [name, style.getPropertyValue(name).trim()]),
    );
  }, names);
}

async function validateApplicationContrast(browser, theme) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  try {
    await seed(page, 'en', theme);
    await page.goto(`${baseUrl}/?view=today`, { waitUntil: 'networkidle' });
    await page.locator('.today-screen').waitFor({ state: 'visible' });
    const variables = await readVariables(page, ':root', [
      '--salah-bg-canvas',
      '--salah-bg-surface',
      '--salah-bg-control',
      '--salah-bg-accent-soft',
      '--salah-fg-primary',
      '--salah-fg-secondary',
      '--salah-fg-tertiary',
      '--salah-focus-ring',
    ]);
    const canvas = parseCssColor(variables['--salah-bg-canvas']);
    const surface = composite(parseCssColor(variables['--salah-bg-surface']), canvas);
    const control = composite(parseCssColor(variables['--salah-bg-control']), canvas);
    const accentSurface = composite(parseCssColor(variables['--salah-bg-accent-soft']), canvas);
    const primary = parseCssColor(variables['--salah-fg-primary']);
    const secondary = parseCssColor(variables['--salah-fg-secondary']);
    const tertiary = parseCssColor(variables['--salah-fg-tertiary']);
    const focus = parseCssColor(variables['--salah-focus-ring']);
    return {
      theme,
      primaryOnCanvas: assertContrast(`${theme} primary/canvas`, primary, canvas),
      primaryOnSurface: assertContrast(`${theme} primary/surface`, primary, surface),
      primaryOnControl: assertContrast(`${theme} primary/control`, primary, control),
      primaryOnAccentSurface: assertContrast(`${theme} primary/accent`, primary, accentSurface),
      secondaryOnCanvas: assertContrast(`${theme} secondary/canvas`, secondary, canvas),
      tertiaryOnCanvas: assertContrast(`${theme} tertiary/canvas`, tertiary, canvas),
      focusOnCanvas: assertContrast(`${theme} focus/canvas`, focus, canvas, 3),
    };
  } finally {
    await context.close();
  }
}

async function validateDisplayContrast(browser, displayTheme) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  try {
    await seed(page, 'en', 'dark', displayTheme);
    await page.goto(`${baseUrl}/?mode=smart-display&template=heritage-classic`, {
      waitUntil: 'networkidle',
    });
    await page.locator('.smart-display').waitFor({ state: 'visible' });
    const variables = await readVariables(page, '.smart-display', [
      '--page',
      '--card',
      '--next-card',
      '--text',
      '--muted',
    ]);
    const pageBackground = parseCssColor(variables['--page']);
    const card = composite(parseCssColor(variables['--card']), pageBackground);
    const nextCard = composite(parseCssColor(variables['--next-card']), pageBackground);
    const text = parseCssColor(variables['--text']);
    const muted = parseCssColor(variables['--muted']);
    return {
      displayTheme,
      textOnPage: assertContrast(`${displayTheme} text/page`, text, pageBackground),
      textOnCard: assertContrast(`${displayTheme} text/card`, text, card),
      textOnNext: assertContrast(`${displayTheme} text/next`, text, nextCard),
      mutedOnPage: assertContrast(`${displayTheme} muted/page`, muted, pageBackground),
    };
  } finally {
    await context.close();
  }
}

async function horizontalOverflow(page) {
  return page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
  }));
}

function assertNoHorizontalOverflow(name, overflow) {
  if (overflow.body > overflow.viewport + 2 || overflow.document > overflow.viewport + 2) {
    throw new Error(`${name} horizontal overflow: ${JSON.stringify(overflow)}`);
  }
}

async function interactiveNameFailures(page) {
  return page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        rect.width > 0 &&
        rect.height > 0
      );
    };
    const labelledByText = (element) => {
      const ids = (element.getAttribute('aria-labelledby') ?? '').split(/\s+/).filter(Boolean);
      return ids
        .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
        .join(' ')
        .trim();
    };
    const associatedLabelText = (element) => {
      if (!(
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement
      )) {
        return '';
      }
      const labels = element.labels === null ? [] : [...element.labels];
      return labels
        .map((label) => label.textContent?.trim() ?? '')
        .join(' ')
        .trim();
    };
    return [...document.querySelectorAll('button, a[href], input, select, textarea, summary')]
      .filter(
        (element) =>
          element instanceof HTMLElement && visible(element) && !element.hasAttribute('disabled'),
      )
      .map((element) => ({
        tag: element.tagName.toLowerCase(),
        className: typeof element.className === 'string' ? element.className : '',
        name:
          element.getAttribute('aria-label')?.trim() ||
          labelledByText(element) ||
          associatedLabelText(element) ||
          element.textContent?.trim() ||
          element.getAttribute('title')?.trim() ||
          '',
      }))
      .filter((entry) => entry.name.length === 0);
  });
}

async function visibleFocusEvidence(page) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await page.keyboard.press('Tab');
    const evidence = await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement) || element === document.body) return null;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      return {
        tag: element.tagName.toLowerCase(),
        className: typeof element.className === 'string' ? element.className : '',
        outlineStyle: style.outlineStyle,
        outlineWidth: Number.parseFloat(style.outlineWidth) || 0,
        boxShadow: style.boxShadow,
      };
    });
    if (evidence === null) continue;
    if (
      (evidence.outlineStyle !== 'none' && evidence.outlineWidth >= 2) ||
      (evidence.boxShadow !== 'none' && evidence.boxShadow.length > 0)
    ) {
      return evidence;
    }
  }
  throw new Error('No keyboard-focusable control exposed a visible focus indicator');
}

async function rtlTypographyFailures(page) {
  return page.evaluate(() => {
    const arabic = /[\u0600-\u06ff]/;
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        rect.width > 0 &&
        rect.height > 0
      );
    };
    return [...document.querySelectorAll('body *')]
      .filter((element) => element instanceof HTMLElement && visible(element))
      .map((element) => {
        const text = element.childElementCount === 0 ? (element.textContent?.trim() ?? '') : '';
        if (!arabic.test(text)) return null;
        const style = getComputedStyle(element);
        const letterSpacing =
          style.letterSpacing === 'normal' ? 0 : Number.parseFloat(style.letterSpacing) || 0;
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === 'string' ? element.className : '',
          text: text.slice(0, 80),
          letterSpacing,
          textTransform: style.textTransform,
        };
      })
      .filter(
        (entry) =>
          entry !== null &&
          (Math.abs(entry.letterSpacing) > 0.1 ||
            (entry.textTransform !== 'none' && entry.textTransform !== 'initial')),
      );
  });
}

async function validateCongregationScenario(browser, scenario) {
  const context = await browser.newContext({
    viewport: { width: scenario.width, height: scenario.height },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await seed(page, scenario.locale, scenario.theme);
    await page.goto(`${baseUrl}/?view=${scenario.view}`, { waitUntil: 'networkidle' });
    await page.locator(scenario.readySelector).waitFor({ state: 'visible' });
    await page.evaluate(() => document.fonts.ready);

    const state = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      dir: document.documentElement.dir,
      navCount: document.querySelectorAll('nav, [role="navigation"]').length,
      labelledRegions: document.querySelectorAll(
        'main, section[aria-labelledby], section[aria-label]',
      ).length,
      headings: [...document.querySelectorAll('h1, h2')].filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }).length,
      tableRows: document.querySelectorAll('.today-prayer-table [role="row"]').length,
      currentStateText:
        document.querySelector('.today-prayer-row.is-current')?.textContent?.trim() ?? '',
      nextStateText: document.querySelector('.today-prayer-row.is-next')?.textContent?.trim() ?? '',
      bidiCount: document.querySelectorAll('bdi, [dir="ltr"]').length,
    }));
    const expectedDirection = scenario.locale === 'ar' ? 'rtl' : 'ltr';
    if (state.lang !== scenario.locale || state.dir !== expectedDirection) {
      throw new Error(`${scenario.name} locale/direction mismatch: ${JSON.stringify(state)}`);
    }
    if (state.navCount === 0 || state.labelledRegions === 0 || state.headings === 0) {
      throw new Error(
        `${scenario.name} semantic landmark/heading structure missing: ${JSON.stringify(state)}`,
      );
    }
    if (scenario.view === 'today') {
      if (state.tableRows !== 6) {
        throw new Error(`${scenario.name} expected prayer table header plus five prayer rows`);
      }
      if (state.currentStateText.length === 0 || state.nextStateText.length === 0) {
        throw new Error(`${scenario.name} current/next prayer state lacks textual status`);
      }
    }
    if (scenario.locale === 'ar' && state.bidiCount === 0) {
      throw new Error(`${scenario.name} has no explicit mixed-direction isolation`);
    }
    if (errors.length > 0) throw new Error(`${scenario.name} page errors: ${errors.join(' | ')}`);

    const names = await interactiveNameFailures(page);
    if (names.length > 0) {
      throw new Error(
        `${scenario.name} unnamed interactive controls: ${JSON.stringify(names.slice(0, 8))}`,
      );
    }
    const rtlFailures = scenario.locale === 'ar' ? await rtlTypographyFailures(page) : [];
    if (rtlFailures.length > 0) {
      throw new Error(
        `${scenario.name} Latin-only RTL typography: ${JSON.stringify(rtlFailures.slice(0, 8))}`,
      );
    }
    const overflow = await horizontalOverflow(page);
    assertNoHorizontalOverflow(scenario.name, overflow);
    const focus = await visibleFocusEvidence(page);

    await page.screenshot({
      path: path.join(artifactDirectory, `${scenario.name}.png`),
      fullPage: true,
      animations: 'disabled',
    });
    return { name: scenario.name, ...state, focus, overflow };
  } finally {
    await context.close();
  }
}

async function validateAdminScenario(browser, scenario) {
  const context = await browser.newContext({
    viewport: { width: scenario.width, height: scenario.height },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  try {
    await seed(page, 'en', scenario.theme);
    await page.goto(`${baseUrl}/?surface=admin&adminView=${scenario.adminView}`, {
      waitUntil: 'networkidle',
    });
    await page.locator('.admin-shell').waitFor({ state: 'visible' });
    const structure = await page.evaluate(() => ({
      nav: document.querySelectorAll('.admin-shell nav, .admin-shell [role="navigation"]').length,
      main: document.querySelectorAll('.admin-shell main, .admin-shell [role="main"]').length,
      headings: document.querySelectorAll('.admin-shell h1, .admin-shell h2').length,
    }));
    if (structure.nav === 0 || structure.main === 0 || structure.headings === 0) {
      throw new Error(
        `${scenario.name} admin landmark structure missing: ${JSON.stringify(structure)}`,
      );
    }
    const names = await interactiveNameFailures(page);
    if (names.length > 0) {
      throw new Error(
        `${scenario.name} unnamed admin controls: ${JSON.stringify(names.slice(0, 8))}`,
      );
    }
    const focus = await visibleFocusEvidence(page);
    const overflow = await horizontalOverflow(page);
    assertNoHorizontalOverflow(scenario.name, overflow);
    await page.screenshot({
      path: path.join(artifactDirectory, `${scenario.name}.png`),
      fullPage: true,
      animations: 'disabled',
    });
    return { name: scenario.name, structure, focus, overflow };
  } finally {
    await context.close();
  }
}

async function validateForcedColours(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    forcedColors: 'active',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  try {
    await seed(page, 'en', 'dark');
    await page.goto(`${baseUrl}/?view=today`, { waitUntil: 'networkidle' });
    await page.locator('.today-screen').waitFor({ state: 'visible' });
    const state = await page.evaluate(() => {
      const row = document.querySelector('.today-prayer-row.is-current');
      const navigationButton = document.querySelector('.congregation-nav button');
      if (!(row instanceof HTMLElement) || !(navigationButton instanceof HTMLElement)) {
        throw new Error('Forced-colours reference elements missing');
      }
      const rowStyle = getComputedStyle(row);
      const buttonStyle = getComputedStyle(navigationButton);
      return {
        forcedColors: matchMedia('(forced-colors: active)').matches,
        rowBorder: rowStyle.borderTopStyle,
        rowColor: rowStyle.color,
        buttonBorder: buttonStyle.borderTopStyle,
        buttonColor: buttonStyle.color,
      };
    });
    if (!state.forcedColors || state.buttonColor.length === 0 || state.rowColor.length === 0) {
      throw new Error(`Forced-colours mode inactive: ${JSON.stringify(state)}`);
    }
    const focus = await visibleFocusEvidence(page);
    await page.screenshot({
      path: path.join(artifactDirectory, 'stage26-forced-colours-phone-en.png'),
      fullPage: true,
      animations: 'disabled',
    });
    return { ...state, focus };
  } finally {
    await context.close();
  }
}

async function validateReducedMotionApplication(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  try {
    await seed(page, 'en', 'dark');
    await page.goto(`${baseUrl}/?view=today`, { waitUntil: 'networkidle' });
    await page.locator('.today-screen').waitFor({ state: 'visible' });
    const offenders = await page.evaluate(() =>
      [...document.querySelectorAll('button, a, .prayer-card')]
        .filter((element) => element instanceof HTMLElement)
        .map((element) => {
          const style = getComputedStyle(element);
          return {
            tag: element.tagName.toLowerCase(),
            className: typeof element.className === 'string' ? element.className : '',
            transitionMs: Math.max(
              ...style.transitionDuration
                .split(',')
                .map((value) => Number.parseFloat(value) * (value.includes('ms') ? 1 : 1000)),
            ),
            animationMs: Math.max(
              ...style.animationDuration
                .split(',')
                .map((value) => Number.parseFloat(value) * (value.includes('ms') ? 1 : 1000)),
            ),
          };
        })
        .filter((entry) => entry.transitionMs > 1 || entry.animationMs > 1),
    );
    if (offenders.length > 0) {
      throw new Error(
        `Reduced-motion application still animates: ${JSON.stringify(offenders.slice(0, 8))}`,
      );
    }
    return { offenders: 0 };
  } finally {
    await context.close();
  }
}

async function validatePrayerBoardScenario(browser, templateId, width, height) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const page = await context.newPage();
  const name = `stage26-board-${templateId}-ar-${width === 1920 ? '1080' : '4k'}`;
  try {
    await seed(page, 'ar', 'dark', 'emerald');
    await page.goto(`${baseUrl}/?mode=smart-display&template=${templateId}`, {
      waitUntil: 'networkidle',
    });
    const display = page.locator('.smart-display');
    await display.waitFor({ state: 'visible' });
    const state = await display.evaluate((element) => ({
      lang: element.getAttribute('lang'),
      dir: element.getAttribute('dir'),
      text: element.textContent?.trim() ?? '',
      bidi: element.querySelectorAll('bdi, [dir="ltr"]').length,
      width: innerWidth,
      height: innerHeight,
    }));
    if (
      state.lang !== 'ar' ||
      state.dir !== 'rtl' ||
      state.width !== width ||
      state.height !== height
    ) {
      throw new Error(`${name} RTL/viewport mismatch: ${JSON.stringify(state)}`);
    }
    if (state.bidi === 0) throw new Error(`${name} has no mixed-direction isolation`);
    const rtlFailures = await rtlTypographyFailures(page);
    if (rtlFailures.length > 0) {
      throw new Error(
        `${name} Latin-only RTL typography: ${JSON.stringify(rtlFailures.slice(0, 8))}`,
      );
    }
    const overflow = await horizontalOverflow(page);
    assertNoHorizontalOverflow(name, overflow);
    await page.screenshot({
      path: path.join(artifactDirectory, `${name}.png`),
      fullPage: false,
      animations: 'disabled',
    });
    return { name, bidi: state.bidi, overflow };
  } finally {
    await context.close();
  }
}

async function validateTouchCoverage(browser, scenario) {
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
    await page.locator('.touch-display-fixture').waitFor({ state: 'visible' });
    const overflow = await horizontalOverflow(page);
    assertNoHorizontalOverflow(scenario.name, overflow);
    await page.screenshot({
      path: path.join(artifactDirectory, `${scenario.name}.png`),
      fullPage: true,
      animations: 'disabled',
    });
    return { name: scenario.name, overflow };
  } finally {
    await context.close();
  }
}

async function verifyGoldenStateArtifacts() {
  const fixtures = {
    currentAndNextPrayer: 'phone-portrait-en-light.png',
    unavailableOrStaleState: 'tablet-today-stale-ar-dark.png',
    jumuah: 'heritage-1080-en-classic.png',
    ramadan: 'phone-today-ramadan-en-dark.png',
  };
  for (const filename of Object.values(fixtures)) {
    await access(path.join(artifactDirectory, filename));
  }
  return fixtures;
}

await mkdir(artifactDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const contrast = {
    application: [],
    displays: [],
  };
  for (const theme of ['light', 'dark']) {
    contrast.application.push(await validateApplicationContrast(browser, theme));
  }
  for (const displayTheme of ['classic', 'midnight', 'sandstone', 'emerald']) {
    contrast.displays.push(await validateDisplayContrast(browser, displayTheme));
  }

  const congregation = [];
  const scenarios = [
    {
      name: 'stage26-phone-en-light-today',
      width: 390,
      height: 844,
      locale: 'en',
      theme: 'light',
      view: 'today',
      readySelector: '.today-screen',
    },
    {
      name: 'stage26-phone-en-dark-settings',
      width: 390,
      height: 844,
      locale: 'en',
      theme: 'dark',
      view: 'settings',
      readySelector: '.settings-screen',
    },
    {
      name: 'stage26-phone-ar-dark-today',
      width: 390,
      height: 844,
      locale: 'ar',
      theme: 'dark',
      view: 'today',
      readySelector: '.today-screen',
    },
    {
      name: 'stage26-tablet-ar-mosques',
      width: 1024,
      height: 1366,
      locale: 'ar',
      theme: 'light',
      view: 'mosques',
      readySelector: '.mosques-screen',
    },
    {
      name: 'stage26-tablet-ar-qiblah',
      width: 1024,
      height: 1366,
      locale: 'ar',
      theme: 'dark',
      view: 'qiblah',
      readySelector: '.qibla-finder',
    },
    {
      name: 'stage26-tablet-ar-community',
      width: 1024,
      height: 1366,
      locale: 'ar',
      theme: 'light',
      view: 'community',
      readySelector: '.community-screen',
    },
    {
      name: 'stage26-tablet-ar-settings',
      width: 1024,
      height: 1366,
      locale: 'ar',
      theme: 'dark',
      view: 'settings',
      readySelector: '.settings-screen',
    },
    {
      name: 'stage26-tablet-ar-today',
      width: 1024,
      height: 1366,
      locale: 'ar',
      theme: 'dark',
      view: 'today',
      readySelector: '.today-screen',
    },
    {
      name: 'stage26-tablet-en-light-today',
      width: 1024,
      height: 1366,
      locale: 'en',
      theme: 'light',
      view: 'today',
      readySelector: '.today-screen',
    },
    {
      name: 'stage26-desktop-en-today',
      width: 1440,
      height: 1000,
      locale: 'en',
      theme: 'light',
      view: 'today',
      readySelector: '.today-screen',
    },
    {
      name: 'stage26-desktop-en-mosques',
      width: 1440,
      height: 1000,
      locale: 'en',
      theme: 'dark',
      view: 'mosques',
      readySelector: '.mosques-screen',
    },
    {
      name: 'stage26-desktop-en-qiblah',
      width: 1440,
      height: 1000,
      locale: 'en',
      theme: 'light',
      view: 'qiblah',
      readySelector: '.qibla-finder',
    },
    {
      name: 'stage26-desktop-en-community',
      width: 1440,
      height: 1000,
      locale: 'en',
      theme: 'dark',
      view: 'community',
      readySelector: '.community-screen',
    },
    {
      name: 'stage26-desktop-en-settings',
      width: 1440,
      height: 1000,
      locale: 'en',
      theme: 'light',
      view: 'settings',
      readySelector: '.settings-screen',
    },
    {
      name: 'stage26-phone-tr-today',
      width: 390,
      height: 844,
      locale: 'tr',
      theme: 'light',
      view: 'today',
      readySelector: '.today-screen',
    },
    {
      name: 'stage26-phone-tr-settings',
      width: 390,
      height: 844,
      locale: 'tr',
      theme: 'dark',
      view: 'settings',
      readySelector: '.settings-screen',
    },
    {
      name: 'stage26-phone-id-today',
      width: 390,
      height: 844,
      locale: 'id',
      theme: 'dark',
      view: 'today',
      readySelector: '.today-screen',
    },
    {
      name: 'stage26-phone-id-settings',
      width: 390,
      height: 844,
      locale: 'id',
      theme: 'light',
      view: 'settings',
      readySelector: '.settings-screen',
    },
  ];
  for (const scenario of scenarios) {
    congregation.push(await validateCongregationScenario(browser, scenario));
  }

  const admin = [];
  for (const scenario of [
    {
      name: 'stage26-admin-overview-desktop',
      width: 1440,
      height: 1000,
      theme: 'light',
      adminView: 'overview',
    },
    {
      name: 'stage26-admin-displays-desktop',
      width: 1440,
      height: 1000,
      theme: 'dark',
      adminView: 'displays',
    },
  ]) {
    admin.push(await validateAdminScenario(browser, scenario));
  }

  const forcedColours = await validateForcedColours(browser);
  const reducedMotion = await validateReducedMotionApplication(browser);

  const boards = [];
  for (const templateId of [
    'heritage-classic',
    'minimal-modern',
    'bold-countdown-focus',
    'structured-split-board',
    'scenic-spiritual',
    'family-classroom',
  ]) {
    boards.push(await validatePrayerBoardScenario(browser, templateId, 1920, 1080));
    boards.push(await validatePrayerBoardScenario(browser, templateId, 3840, 2160));
  }

  const touch = [];
  for (const scenario of [
    {
      name: 'stage26-touch-portrait-en',
      size: '5',
      orientation: 'portrait',
      locale: 'en',
      width: 720,
      height: 1280,
    },
    {
      name: 'stage26-touch-landscape-ar',
      size: '7',
      orientation: 'landscape',
      locale: 'ar',
      width: 1280,
      height: 720,
    },
  ]) {
    touch.push(await validateTouchCoverage(browser, scenario));
  }

  const goldenStates = await verifyGoldenStateArtifacts();
  const results = {
    contrast,
    congregation,
    admin,
    forcedColours,
    reducedMotion,
    boards,
    touch,
    goldenStates,
  };
  await writeFile(
    path.join(artifactDirectory, 'stage26-accessibility-rtl-results.json'),
    `${JSON.stringify(results, null, 2)}\n`,
  );
  console.log(
    `Stage 26 accessibility/RTL acceptance passed: ${String(congregation.length)} congregation, ${String(admin.length)} admin, ${String(boards.length)} prayer-board and ${String(touch.length)} Touch Display scenarios.`,
  );
} finally {
  await browser.close();
}