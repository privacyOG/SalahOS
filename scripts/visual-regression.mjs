import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const PREVIEW_ORIGIN = 'http://127.0.0.1:4173';
const DEBUG_ORIGIN = 'http://127.0.0.1:9222';
const OUTPUT_DIRECTORY = resolve('artifacts/visual-regression');
const SETTINGS_STORAGE_KEY = 'salahos.settings';
const FIXED_NOW_MILLISECONDS = Date.parse('2026-08-16T12:00:00.000Z');
const BROWSER_PROFILE_DIRECTORY = resolve(tmpdir(), `salahos-visual-${String(process.pid)}`);

const visualCases = [
  {
    name: 'phone-portrait-en-light',
    path: '/',
    readySelector: '.app-shell',
    width: 390,
    height: 844,
    locale: 'en',
    theme: 'light',
    direction: 'ltr',
    textScalePercent: 100,
  },
  {
    name: 'phone-portrait-ar-dark',
    path: '/',
    readySelector: '.app-shell',
    width: 390,
    height: 844,
    locale: 'ar',
    theme: 'dark',
    direction: 'rtl',
    textScalePercent: 100,
  },
  {
    name: 'phone-landscape-en-light',
    path: '/',
    readySelector: '.app-shell',
    width: 844,
    height: 390,
    locale: 'en',
    theme: 'light',
    direction: 'ltr',
    textScalePercent: 100,
  },
  {
    name: 'tablet-en-light',
    path: '/',
    readySelector: '.app-shell',
    width: 1024,
    height: 1366,
    locale: 'en',
    theme: 'light',
    direction: 'ltr',
    textScalePercent: 100,
  },
  {
    name: 'kiosk-1080p-ar-dark',
    path: '/?mode=smart-display',
    readySelector: '.smart-display',
    width: 1920,
    height: 1080,
    locale: 'ar',
    theme: 'dark',
    direction: 'rtl',
    textScalePercent: 100,
  },
  {
    name: 'phone-portrait-en-light-text-125',
    path: '/',
    readySelector: '.app-shell',
    width: 390,
    height: 844,
    locale: 'en',
    theme: 'light',
    direction: 'ltr',
    textScalePercent: 125,
  },
];

function fixtureSettings(locale, theme) {
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
    prayerSourceMode: 'calculated',
    location: {
      coordinates: { latitude: -33.8688, longitude: 151.2093 },
      timeZone: 'Australia/Sydney',
    },
    mosqueTimetable: null,
  };
}

function commandExists(command) {
  const checker = process.platform === 'win32' ? 'where' : 'which';
  return spawnSync(checker, [command], { stdio: 'ignore' }).status === 0;
}

function browserCommand() {
  const candidates = [
    process.env.CHROME_BIN,
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser',
  ].filter(Boolean);
  const found = candidates.find((candidate) => commandExists(candidate));
  if (found === undefined) {
    throw new Error(
      'Chrome/Chromium was not found. Set CHROME_BIN or install a supported browser before running visual regression.',
    );
  }
  return found;
}

function browserArguments() {
  const args = [
    '--headless=new',
    '--disable-background-networking',
    '--disable-default-apps',
    '--disable-dev-shm-usage',
    '--disable-extensions',
    '--disable-gpu',
    '--disable-sync',
    '--metrics-recording-only',
    '--no-first-run',
    '--remote-debugging-port=9222',
    `--user-data-dir=${BROWSER_PROFILE_DIRECTORY}`,
    'about:blank',
  ];
  if (typeof process.getuid === 'function' && process.getuid() === 0) {
    args.splice(args.length - 1, 0, '--no-sandbox');
  }
  return args;
}

async function waitForHttp(url, timeoutMs = 15_000) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      lastError = new Error(`${url} returned HTTP ${String(response.status)}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  throw new Error(`Timed out waiting for ${url}`, { cause: lastError });
}

class DevToolsSession {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id === undefined) return;
      const pending = this.pending.get(message.id);
      if (pending === undefined) return;
      this.pending.delete(message.id);
      if (message.error !== undefined) {
        pending.reject(new Error(message.error.message ?? 'DevTools command failed'));
      } else {
        pending.resolve(message.result ?? {});
      }
    });
    socket.addEventListener('close', () => {
      for (const pending of this.pending.values()) {
        pending.reject(new Error('DevTools connection closed'));
      }
      this.pending.clear();
    });
  }

  async send(method, params = {}) {
    const id = this.nextId;
    this.nextId += 1;
    const response = new Promise((resolveResponse, rejectResponse) => {
      this.pending.set(id, { resolve: resolveResponse, reject: rejectResponse });
    });
    this.socket.send(JSON.stringify({ id, method, params }));
    return response;
  }

  close() {
    this.socket.close();
  }
}

async function connectDevTools() {
  const response = await waitForHttp(`${DEBUG_ORIGIN}/json/list`);
  const targets = await response.json();
  const page = targets.find((target) => target.type === 'page');
  if (page?.webSocketDebuggerUrl === undefined) {
    throw new Error('Chrome did not expose a debuggable page target');
  }

  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener('error', () => rejectOpen(new Error('DevTools WebSocket failed')), {
      once: true,
    });
  });
  return new DevToolsSession(socket);
}

async function evaluate(session, expression) {
  const result = await session.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails !== undefined) {
    throw new Error(result.exceptionDetails.text ?? 'Browser evaluation failed');
  }
  return result.result?.value;
}

async function waitForReady(session, selector) {
  const started = Date.now();
  while (Date.now() - started < 15_000) {
    const ready = await evaluate(
      session,
      `document.readyState === 'complete' && document.querySelector(${JSON.stringify(selector)}) !== null`,
    );
    if (ready === true) return;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  throw new Error(`Application did not become ready for visual regression: ${selector}`);
}

async function renderCase(session, visualCase) {
  await session.send('Emulation.setDeviceMetricsOverride', {
    width: visualCase.width,
    height: visualCase.height,
    deviceScaleFactor: 1,
    mobile: visualCase.width < 900,
  });
  await session.send('Page.navigate', { url: `${PREVIEW_ORIGIN}${visualCase.path}` });
  await waitForReady(session, visualCase.readySelector);

  const settings = JSON.stringify(fixtureSettings(visualCase.locale, visualCase.theme));
  await evaluate(
    session,
    `localStorage.setItem(${JSON.stringify(SETTINGS_STORAGE_KEY)}, ${JSON.stringify(settings)}); location.reload();`,
  );
  await waitForReady(session, visualCase.readySelector);

  if (visualCase.textScalePercent !== 100) {
    await evaluate(
      session,
      `(() => {
        const style = document.createElement('style');
        style.dataset.visualRegressionTextScale = 'true';
        style.textContent = ':root { font-size: ${String(visualCase.textScalePercent)}% !important; }';
        document.head.append(style);
      })()`,
    );
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 150));
  }

  const assertions = await evaluate(
    session,
    `(() => ({
      direction: document.documentElement.dir,
      language: document.documentElement.lang,
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      expectedRootPresent: document.querySelector(${JSON.stringify(visualCase.readySelector)}) !== null,
      visibleTextLength: document.body.innerText.trim().length,
    }))()`,
  );

  if (assertions.direction !== visualCase.direction) {
    throw new Error(
      `${visualCase.name}: expected direction ${visualCase.direction}, received ${String(assertions.direction)}`,
    );
  }
  if (assertions.language !== visualCase.locale) {
    throw new Error(
      `${visualCase.name}: expected language ${visualCase.locale}, received ${String(assertions.language)}`,
    );
  }
  if (assertions.expectedRootPresent !== true || assertions.visibleTextLength < 40) {
    throw new Error(`${visualCase.name}: application did not render meaningful content`);
  }
  const maximumWidth = Math.max(assertions.documentWidth, assertions.bodyWidth);
  if (maximumWidth > assertions.viewportWidth + 1) {
    throw new Error(
      `${visualCase.name}: horizontal overflow detected (${String(maximumWidth)}px document in ${String(assertions.viewportWidth)}px viewport)`,
    );
  }

  const screenshot = await session.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  writeFileSync(
    resolve(OUTPUT_DIRECTORY, `${visualCase.name}.png`),
    Buffer.from(screenshot.data, 'base64'),
  );
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
mkdirSync(OUTPUT_DIRECTORY, { recursive: true });

const preview = spawn(
  npmCommand,
  ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173', '--strictPort'],
  { stdio: ['ignore', 'inherit', 'inherit'] },
);
const browser = spawn(browserCommand(), browserArguments(), {
  stdio: ['ignore', 'ignore', 'inherit'],
});

let session;
try {
  await waitForHttp(PREVIEW_ORIGIN);
  session = await connectDevTools();
  await session.send('Page.enable');
  await session.send('Runtime.enable');
  await session.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `Date.now = () => ${String(FIXED_NOW_MILLISECONDS)};`,
  });

  for (const visualCase of visualCases) {
    await renderCase(session, visualCase);
    console.log(`Visual regression passed: ${visualCase.name}`);
  }
  console.log(`Visual regression suite passed with ${String(visualCases.length)} screenshots.`);
} finally {
  session?.close();
  preview.kill('SIGTERM');
  browser.kill('SIGTERM');
}
