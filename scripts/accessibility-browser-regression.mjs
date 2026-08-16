import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const PREVIEW_ORIGIN = 'http://127.0.0.1:4174';
const DEBUG_ORIGIN = 'http://127.0.0.1:9223';
const OUTPUT_DIRECTORY = resolve('artifacts/visual-regression');
const SETTINGS_STORAGE_KEY = 'salahos.settings';
const FIXED_NOW_MILLISECONDS = Date.parse('2026-08-16T12:00:00.000Z');
const BROWSER_PROFILE_DIRECTORY = resolve(tmpdir(), `salahos-accessibility-${String(process.pid)}`);

function fixtureSettings(locale = 'en', theme = 'light') {
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
      'Chrome/Chromium was not found. Set CHROME_BIN or install a supported browser before running accessibility regression.',
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
    '--remote-debugging-port=9223',
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

async function waitForState(session, { selector, locale, direction, theme }) {
  const started = Date.now();
  while (Date.now() - started < 15_000) {
    const ready = await evaluate(
      session,
      `(() => {
        const root = document.querySelector(${JSON.stringify(selector)});
        return document.readyState === 'complete' &&
          root !== null &&
          document.documentElement.lang === ${JSON.stringify(locale)} &&
          document.documentElement.dir === ${JSON.stringify(direction)} &&
          document.documentElement.dataset.theme === ${JSON.stringify(theme)};
      })()`,
    );
    if (ready === true) return;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  throw new Error(`Application did not settle for accessibility regression: ${selector}`);
}

async function loadFixture(session, { path, selector, locale, direction, theme }) {
  await session.send('Page.navigate', { url: `${PREVIEW_ORIGIN}${path}` });
  const initialStarted = Date.now();
  while (Date.now() - initialStarted < 15_000) {
    const hasStorage = await evaluate(session, `location.origin === ${JSON.stringify(PREVIEW_ORIGIN)}`);
    if (hasStorage === true) break;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }

  const settings = JSON.stringify(fixtureSettings(locale, theme));
  await evaluate(
    session,
    `localStorage.setItem(${JSON.stringify(SETTINGS_STORAGE_KEY)}, ${JSON.stringify(settings)}); location.reload();`,
  );
  await waitForState(session, { selector, locale, direction, theme });
}

async function verifyTwoHundredPercentReflow(session) {
  await session.send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await session.send('Emulation.setEmulatedMedia', { features: [] });
  await loadFixture(session, {
    path: '/',
    selector: '.app-shell',
    locale: 'en',
    direction: 'ltr',
    theme: 'light',
  });

  await evaluate(
    session,
    `(() => {
      const style = document.createElement('style');
      style.dataset.accessibilityTextScale = 'true';
      style.textContent = ':root { font-size: 200% !important; }';
      document.head.append(style);
    })()`,
  );
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 200));

  const result = await evaluate(
    session,
    `(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      textScale: getComputedStyle(document.documentElement).fontSize,
    }))()`,
  );
  const maximumWidth = Math.max(result.documentWidth, result.bodyWidth);
  if (maximumWidth > result.viewportWidth + 1) {
    throw new Error(
      `200% text reflow produced horizontal overflow (${String(maximumWidth)}px in ${String(result.viewportWidth)}px viewport)`,
    );
  }
  if (Number.parseFloat(result.textScale) < 31) {
    throw new Error(`200% text scaling did not apply; root font size is ${String(result.textScale)}`);
  }

  const screenshot = await session.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  });
  writeFileSync(
    resolve(OUTPUT_DIRECTORY, 'phone-portrait-en-light-text-200.png'),
    Buffer.from(screenshot.data, 'base64'),
  );
}

async function verifyKeyboardFocus(session) {
  await session.send('Page.bringToFront');
  await evaluate(
    session,
    `(() => {
      const active = document.activeElement;
      if (active instanceof HTMLElement) active.blur();
    })()`,
  );
  await session.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: 'Tab',
    code: 'Tab',
    windowsVirtualKeyCode: 9,
  });
  await session.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: 'Tab',
    code: 'Tab',
    windowsVirtualKeyCode: 9,
  });

  const focus = await evaluate(
    session,
    `(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement) || element === document.body) return null;
      const style = getComputedStyle(element);
      return {
        tag: element.tagName,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineOffset: style.outlineOffset,
      };
    })()`,
  );
  if (focus === null) {
    throw new Error('Keyboard Tab did not move focus to an interactive element');
  }
  if (focus.outlineStyle === 'none' || Number.parseFloat(focus.outlineWidth) < 3) {
    throw new Error(
      `Keyboard-focused ${String(focus.tag)} does not expose the required visible outline (${String(focus.outlineStyle)} ${String(focus.outlineWidth)})`,
    );
  }
  if (Number.parseFloat(focus.outlineOffset) < 3) {
    throw new Error(`Keyboard focus outline offset is too small: ${String(focus.outlineOffset)}`);
  }
}

async function verifyReducedMotion(session) {
  await session.send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await loadFixture(session, {
    path: '/?mode=smart-display',
    selector: '.smart-display',
    locale: 'ar',
    direction: 'rtl',
    theme: 'dark',
  });

  const animationName = await evaluate(
    session,
    `getComputedStyle(document.querySelector('.smart-display-header')).animationName`,
  );
  if (animationName !== 'none') {
    throw new Error(`Reduced-motion smart display still animates: ${String(animationName)}`);
  }
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
mkdirSync(OUTPUT_DIRECTORY, { recursive: true });

const preview = spawn(
  npmCommand,
  ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4174', '--strictPort'],
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

  await verifyTwoHundredPercentReflow(session);
  await verifyKeyboardFocus(session);
  await verifyReducedMotion(session);

  console.log(
    'Accessibility browser regression passed: 200% text reflow, keyboard-visible focus, and reduced-motion smart-display behavior.',
  );
} finally {
  session?.close();
  preview.kill('SIGTERM');
  browser.kill('SIGTERM');
}
