import { pathToFileURL } from 'node:url';
const baseUrl = process.env.SALAHOS_VISUAL_BASE_URL ?? 'http://127.0.0.1:4173';
const playwrightModule = process.env.SALAHOS_VISUAL_PLAYWRIGHT_MODULE;
if (!playwrightModule)
  throw new Error('SALAHOS_VISUAL_PLAYWRIGHT_MODULE must point to the isolated Playwright module');
const { chromium } = await import(pathToFileURL(playwrightModule).href);
const baseSettings = {
  version: 2,
  locale: 'en',
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
const scenarios = [
  {
    name: 'today-phone-light',
    url: '/?view=today',
    ready: '.today-screen',
    theme: 'light',
    palette: 'salah-classic',
    viewport: { width: 390, height: 844 },
  },
  {
    name: 'qiblah-phone-dark',
    url: '/?view=qiblah',
    ready: '.qibla-finder--v2',
    theme: 'dark',
    palette: 'midnight-gold',
    viewport: { width: 390, height: 844 },
  },
  {
    name: 'settings-tablet-system',
    url: '/?view=settings&settings=display',
    ready: '.settings-screen',
    theme: 'system',
    scheme: 'dark',
    palette: 'emerald-mosque',
    viewport: { width: 820, height: 1180 },
  },
  {
    name: 'today-web-high-contrast',
    url: '/?view=today',
    ready: '.today-screen',
    theme: 'light',
    palette: 'high-contrast',
    viewport: { width: 1440, height: 900 },
  },
  {
    name: 'smart-display-royal-blue',
    url: '/?mode=smart-display',
    ready: '.smart-display',
    theme: 'dark',
    palette: 'royal-blue',
    viewport: { width: 1920, height: 1080 },
  },
  {
    name: 'smart-display-4k-olive',
    url: '/?mode=smart-display',
    ready: '.smart-display',
    theme: 'dark',
    palette: 'olive-heritage',
    viewport: { width: 3840, height: 2160 },
  },
  {
    name: 'rtl-large-text',
    url: '/?view=today',
    ready: '.today-screen',
    theme: 'dark',
    palette: 'desert-sand',
    locale: 'ar',
    largeText: true,
    viewport: { width: 430, height: 932 },
  },
];
function luminance(rgb) {
  const c = rgb.map((value) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function parseRgb(value) {
  const values = value.match(/[\d.]+/g);
  return values && values.length >= 3 ? values.slice(0, 3).map(Number) : null;
}
const browser = await chromium.launch({ headless: true });
const failures = [];
try {
  for (const s of scenarios) {
    const failureCountBeforeScenario = failures.length;
    const context = await browser.newContext({
      viewport: s.viewport,
      colorScheme: s.scheme ?? (s.theme === 'dark' ? 'dark' : 'light'),
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    try {
      await page.addInitScript(
        ({ settings }) => {
          localStorage.setItem('salahos.settings', JSON.stringify(settings));
        },
        {
          settings: {
            ...baseSettings,
            locale: s.locale ?? 'en',
            theme: s.theme,
            palette: s.palette,
          },
        },
      );
      await page.goto(baseUrl + s.url, { waitUntil: 'networkidle' });
      if (s.largeText) {
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '125%';
        });
      }
      await page.locator(s.ready).first().waitFor({ state: 'visible' });
      const root = await page.evaluate(() => ({
        theme: document.documentElement.dataset.theme,
        palette: document.documentElement.dataset.palette,
        dir: document.documentElement.dir,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
      }));
      if (root.palette !== s.palette) failures.push(`${s.name}: palette did not apply`);
      if (s.theme !== 'system' && root.theme !== s.theme)
        failures.push(`${s.name}: appearance did not apply`);
      if (s.theme === 'system' && root.theme !== s.scheme)
        failures.push(`${s.name}: system appearance did not resolve`);
      if ((s.locale ?? 'en') === 'ar' && root.dir !== 'rtl')
        failures.push(`${s.name}: rtl did not apply`);
      if (root.overflow) failures.push(`${s.name}: horizontal clipping detected`);

      const samples = await page.locator('body *:visible').evaluateAll((elements) =>
        elements
          .map((element) => {
            const text = (element.textContent ?? '').trim();
            if (!text || element.children.length > 0) return null;

            const style = getComputedStyle(element);
            let backgroundElement = element;
            let backgroundStyle = getComputedStyle(backgroundElement);
            let complexBackground = backgroundStyle.backgroundImage !== 'none';
            while (
              backgroundElement.parentElement !== null &&
              (backgroundStyle.backgroundColor === 'rgba(0, 0, 0, 0)' ||
                backgroundStyle.backgroundColor === 'transparent')
            ) {
              backgroundElement = backgroundElement.parentElement;
              backgroundStyle = getComputedStyle(backgroundElement);
              complexBackground ||= backgroundStyle.backgroundImage !== 'none';
            }

            const fontWeight = Number.parseInt(style.fontWeight, 10);
            return {
              fg: style.color,
              bg: backgroundStyle.backgroundColor,
              fontSize: Number.parseFloat(style.fontSize),
              fontWeight: Number.isFinite(fontWeight) ? fontWeight : 400,
              text: text.slice(0, 80),
              complexBackground,
            };
          })
          .filter((sample) => sample !== null)
          .slice(0, 250),
      );

      for (const item of samples) {
        if (item.complexBackground) continue;
        const fg = parseRgb(item.fg);
        const bg = parseRgb(item.bg);
        if (!fg || !bg) continue;

        const l1 = luminance(fg);
        const l2 = luminance(bg);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        const largeText = item.fontSize >= 24 || (item.fontSize >= 18.66 && item.fontWeight >= 700);
        const minimumRatio = largeText ? 3 : 4.5;
        if (ratio < minimumRatio) {
          failures.push(
            `${s.name}: visible text contrast below ${minimumRatio}:1 (${ratio.toFixed(2)}) for ${JSON.stringify(item.text)}`,
          );
        }
      }

      if (failures.length === failureCountBeforeScenario) {
        console.log(`theme matrix passed: ${s.name}`);
      } else {
        console.log(
          `theme matrix found ${String(failures.length - failureCountBeforeScenario)} issue(s): ${s.name}`,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${s.name}: scenario execution failed: ${message}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}

if (failures.length > 0) {
  throw new Error(`Theme visual matrix found ${String(failures.length)} issue(s):\n- ${failures.join('\n- ')}`);
}

console.log(
  `Theme visual matrix passed ${scenarios.length} scenarios including today, qiblah, settings, smart-display, system, rtl and large-text.`,
);
