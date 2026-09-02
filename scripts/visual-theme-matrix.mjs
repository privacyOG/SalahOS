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
  const srgb = value.match(
    /^color\(srgb\s+([+-]?(?:\d*\.?\d+))\s+([+-]?(?:\d*\.?\d+))\s+([+-]?(?:\d*\.?\d+))(?:\s*\/\s*([+-]?(?:\d*\.?\d+)))?\)$/i,
  );
  if (srgb) return srgb.slice(1, 4).map((component) => Number(component) * 255);
  const values = value.match(/[\d.]+/g);
  return values && values.length >= 3 ? values.slice(0, 3).map(Number) : null;
}
const contrastFailures = [];
const browser = await chromium.launch({ headless: true });
try {
  for (const s of scenarios) {
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
      if (root.palette !== s.palette) throw new Error(`${s.name}: palette did not apply`);
      if (s.theme !== 'system' && root.theme !== s.theme)
        throw new Error(`${s.name}: appearance did not apply`);
      if (s.theme === 'system' && root.theme !== s.scheme)
        throw new Error(`${s.name}: system appearance did not resolve`);
      if ((s.locale ?? 'en') === 'ar' && root.dir !== 'rtl')
        throw new Error(`${s.name}: rtl did not apply`);
      if (root.overflow) throw new Error(`${s.name}: horizontal clipping detected`);

      const samples = await page.locator('body *:visible').evaluateAll((elements) => {
        const parseCssColor = (value) => {
          const srgb = value.match(
            /^color\(srgb\s+([+-]?(?:\d*\.?\d+))\s+([+-]?(?:\d*\.?\d+))\s+([+-]?(?:\d*\.?\d+))(?:\s*\/\s*([+-]?(?:\d*\.?\d+)))?\)$/i,
          );
          if (srgb) {
            return {
              r: Number(srgb[1]) * 255,
              g: Number(srgb[2]) * 255,
              b: Number(srgb[3]) * 255,
              a: srgb[4] === undefined ? 1 : Number(srgb[4]),
            };
          }
          const values = value.match(/[\d.]+/g);
          if (!values || values.length < 3) return null;
          return {
            r: Number(values[0]),
            g: Number(values[1]),
            b: Number(values[2]),
            a: values.length >= 4 ? Number(values[3]) : 1,
          };
        };
        const compositeOver = (front, back) => {
          const alpha = front.a + back.a * (1 - front.a);
          if (alpha <= 0) return { r: 0, g: 0, b: 0, a: 0 };
          const behind = back.a * (1 - front.a);
          return {
            r: (front.r * front.a + back.r * behind) / alpha,
            g: (front.g * front.a + back.g * behind) / alpha,
            b: (front.b * front.a + back.b * behind) / alpha,
            a: alpha,
          };
        };
        const resolveEffectiveBackground = (element) => {
          let backgroundElement = element;
          let effective = { r: 0, g: 0, b: 0, a: 0 };
          let complexBackground = false;
          while (backgroundElement !== null && effective.a < 0.999) {
            const backgroundStyle = getComputedStyle(backgroundElement);
            complexBackground ||= backgroundStyle.backgroundImage !== 'none';
            const layer = parseCssColor(backgroundStyle.backgroundColor);
            if (layer !== null && layer.a > 0) effective = compositeOver(effective, layer);
            backgroundElement = backgroundElement.parentElement;
          }
          if (effective.a < 0.999) {
            effective = compositeOver(effective, { r: 255, g: 255, b: 255, a: 1 });
          }
          return {
            background: [effective.r, effective.g, effective.b],
            complexBackground,
          };
        };

        return elements
          .map((element) => {
            const text = (element.textContent ?? '').trim();
            if (!text || element.children.length > 0) return null;

            const style = getComputedStyle(element);
            const { background, complexBackground } = resolveEffectiveBackground(element);
            const fontWeight = Number.parseInt(style.fontWeight, 10);
            return {
              fg: style.color,
              bg: background,
              fontSize: Number.parseFloat(style.fontSize),
              fontWeight: Number.isFinite(fontWeight) ? fontWeight : 400,
              text: text.slice(0, 80),
              complexBackground,
            };
          })
          .filter((sample) => sample !== null)
          .slice(0, 250);
      });

      const failuresBeforeScenario = contrastFailures.length;
      for (const item of samples) {
        if (item.complexBackground) continue;
        const fg = parseRgb(item.fg);
        const bg = item.bg;
        if (!fg || !bg) continue;

        const l1 = luminance(fg);
        const l2 = luminance(bg);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        const largeText = item.fontSize >= 24 || (item.fontSize >= 18.66 && item.fontWeight >= 700);
        const minimumRatio = largeText ? 3 : 4.5;
        if (ratio < minimumRatio) {
          contrastFailures.push(
            `${s.name}: visible text contrast below ${minimumRatio}:1 (${ratio.toFixed(2)}) for ${JSON.stringify(item.text)}`,
          );
        }
      }
      if (contrastFailures.length === failuresBeforeScenario) {
        console.log(`theme matrix passed: ${s.name}`);
      } else {
        console.log(
          `theme matrix collected ${contrastFailures.length - failuresBeforeScenario} contrast failure(s): ${s.name}`,
        );
      }
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
if (contrastFailures.length > 0) {
  throw new Error(
    `Theme visual matrix found ${contrastFailures.length} contrast failure(s):\n${contrastFailures.join('\n')}`,
  );
}
console.log(
  `Theme visual matrix passed ${scenarios.length} scenarios including today, qiblah, settings, smart-display, system, rtl and large-text.`,
);
