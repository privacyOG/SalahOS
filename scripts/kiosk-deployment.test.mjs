import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const launcher = path.join(repoRoot, 'scripts/kiosk/run-salahos-kiosk.sh');
const autostartInstaller = path.join(repoRoot, 'scripts/kiosk/install-labwc-autostart.sh');
const tempRoots = [];

async function tempRoot() {
  const root = await mkdtemp(path.join(tmpdir(), 'salahos-kiosk-'));
  tempRoots.push(root);
  return root;
}

function run(script, args, env = {}) {
  return spawnSync('bash', [script, ...args], {
    cwd: repoRoot,
    env: { ...process.env, ...env },
    encoding: 'utf8',
  });
}

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('Raspberry Pi/kiosk deployment scripts', () => {
  it('validates shell syntax for both deployment scripts', () => {
    for (const script of [launcher, autostartInstaller]) {
      const result = spawnSync('bash', ['-n', script], {
        cwd: repoRoot,
        encoding: 'utf8',
      });
      expect(result.status, result.stderr).toBe(0);
    }
  });

  it('renders an offline localhost server and Chromium kiosk command in dry-run mode', async () => {
    const root = await tempRoot();
    const dist = path.join(root, 'dist');
    await mkdir(dist);
    await writeFile(path.join(dist, 'index.html'), '<!doctype html><title>SalahOS</title>');

    const result = run(launcher, ['--dry-run'], {
      SALAHOS_DIST_DIR: dist,
      SALAHOS_KIOSK_PORT: '4317',
      SALAHOS_BROWSER: 'definitely-not-installed-salahos-browser',
    });

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('python3 -m http.server 4317');
    expect(result.stdout).toContain('http://127.0.0.1:4317/');
    expect(result.stdout).toContain('--kiosk');
    expect(result.stdout).toContain('--no-first-run');
    expect(result.stdout).toContain('--start-maximized');
  });

  it('rejects invalid kiosk ports before launch', async () => {
    const root = await tempRoot();
    const dist = path.join(root, 'dist');
    await mkdir(dist);
    await writeFile(path.join(dist, 'index.html'), '<!doctype html>');

    const result = run(launcher, ['--dry-run'], {
      SALAHOS_DIST_DIR: dist,
      SALAHOS_KIOSK_PORT: '70000',
    });

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('must be an integer from 1 to 65535');
  });

  it('installs labwc autostart idempotently and preserves unrelated entries', async () => {
    const root = await tempRoot();
    const home = path.join(root, 'home');
    const config = path.join(home, '.config/labwc');
    const autostart = path.join(config, 'autostart');
    await mkdir(config, { recursive: true });
    await writeFile(autostart, 'existing-command &\n');

    const env = {
      HOME: home,
      SALAHOS_KIOSK_LAUNCHER: launcher,
      SALAHOS_LABWC_AUTOSTART: autostart,
    };
    const first = run(autostartInstaller, [], env);
    const second = run(autostartInstaller, [], env);

    expect(first.status, first.stderr).toBe(0);
    expect(second.status, second.stderr).toBe(0);
    const content = await readFile(autostart, 'utf8');
    expect(content).toContain('existing-command &');
    expect(content.match(/# >>> SalahOS kiosk >>>/g)).toHaveLength(1);
    expect(content.match(/# <<< SalahOS kiosk <<</g)).toHaveLength(1);
    expect(content).toContain('run-salahos-kiosk.sh');
  });

  it('removes only the managed SalahOS autostart block', async () => {
    const root = await tempRoot();
    const home = path.join(root, 'home');
    const config = path.join(home, '.config/labwc');
    const autostart = path.join(config, 'autostart');
    await mkdir(config, { recursive: true });
    await writeFile(
      autostart,
      'existing-command &\n# >>> SalahOS kiosk >>>\nbash /tmp/launcher &\n# <<< SalahOS kiosk <<<\n',
    );

    const result = run(autostartInstaller, ['--remove'], {
      HOME: home,
      SALAHOS_LABWC_AUTOSTART: autostart,
    });

    expect(result.status, result.stderr).toBe(0);
    const content = await readFile(autostart, 'utf8');
    expect(content).toContain('existing-command &');
    expect(content).not.toContain('SalahOS kiosk');
    expect(content).not.toContain('/tmp/launcher');
  });
});
