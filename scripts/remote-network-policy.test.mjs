import { mkdir, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const probePath = resolve(repositoryRoot, 'src', '__remote-network-policy-probe.mjs');

function runPolicy() {
  return spawnSync(process.execPath, ['scripts/check-remote-network-policy.mjs'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
}

describe('remote network policy', () => {
  it('continues to reject unreviewed application network capability', async () => {
    await mkdir(dirname(probePath), { recursive: true });
    try {
      await writeFile(
        probePath,
        "export async function probe() { return fetch('https://example.invalid'); }\n",
      );
      const blocked = runPolicy();
      expect(blocked.status).not.toBe(0);
      expect(`${blocked.stdout}\n${blocked.stderr}`).toContain(
        'src/__remote-network-policy-probe.mjs',
      );
    } finally {
      await rm(probePath, { force: true });
    }

    const clean = runPolicy();
    expect(clean.status).toBe(0);
    expect(clean.stdout).toContain('Reviewed capabilities:');
  });
});
