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
    ready: '.qiblah-v2',
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
  const c = rgb.map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function parseRgb(value) {
  const m = value.match(/rgba?\((\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/);
  return m ? [+m[1], +m[2], +m[3]] : null;
}
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
    await page.addInitScript(
      ({ settings, largeText }) => {
        localStorage.setItem('salahos.settings', JSON.stringify(settings));
        if (largeText) document.documentElement.style.fontSize = '125%';
      },
      {
        settings: { ...baseSettings, locale: s.locale ?? 'en', theme: s.theme, palette: s.palette },
        largeText: !!s.largeText,
      },
    );
    await page.goto(baseUrl + s.url, { waitUntil: 'networkidle' });
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
    const failures = await page.locator('body *:visible').evaluateAll((els) =>
      els
        .filter((el) => {
          const text = (el.textContent ?? '').trim();
          if (!text || el.children.length > 0) return false;
          const st = getComputedStyle(el),
            bg = getComputedStyle(el.parentElement ?? el).backgroundColor;
          return { fg: st.color, bg };
        })
        .slice(0, 250),
    );
    for (const item of failures) {
      if (!item || typeof item !== 'object') continue;
      const fg = parseRgb(item.fg),
        bg = parseRgb(item.bg);
      if (!fg || !bg) continue;
      const l1 = luminance(fg),
        l2 = luminance(bg),
        ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      if (ratio < 3)
        throw new Error(`${s.name}: visible text contrast below 3:1 (${ratio.toFixed(2)})`);
    }
    await context.close();
    console.log(`theme matrix passed: ${s.name}`);
  }
} finally {
  await browser.close();
}
console.log(
  `Theme visual matrix passed ${scenarios.length} scenarios including today, qiblah, settings, smart-display, system, rtl and large-text.`,
);
