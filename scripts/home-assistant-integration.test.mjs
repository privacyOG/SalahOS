import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const integrationRoot = join(
  repositoryRoot,
  'integrations',
  'home-assistant',
  'custom_components',
  'salahos',
);

describe('Home Assistant integration package', () => {
  it('declares a read-only local-polling custom integration owned by privacyOG', async () => {
    const manifest = JSON.parse(await readFile(join(integrationRoot, 'manifest.json'), 'utf8'));

    expect(manifest).toMatchObject({
      domain: 'salahos',
      name: 'SalahOS',
      codeowners: ['@privacyOG'],
      config_flow: true,
      integration_type: 'service',
      iot_class: 'local_polling',
      requirements: [],
      version: '1.0.0',
    });
  });

  it('passes the stdlib-only public API client contract suite', () => {
    const result = spawnSync(
      'python3',
      [
        '-m',
        'unittest',
        'discover',
        '-s',
        join(repositoryRoot, 'integrations', 'home-assistant', 'tests'),
        '-p',
        'test_*.py',
      ],
      { cwd: repositoryRoot, encoding: 'utf8' },
    );

    if (result.status !== 0) {
      throw new Error(`Home Assistant contract tests failed:\n${result.stdout}\n${result.stderr}`);
    }
    expect(result.status).toBe(0);
  });
});
