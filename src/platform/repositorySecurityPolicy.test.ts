import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const forbiddenTrackedPathPatterns: readonly RegExp[] = [
  /(^|\/)\.env(?:\.|$)/,
  /\.pem$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /\.keystore$/i,
];

const forbiddenContentMarkers: readonly string[] = [
  '-----BEGIN PRIVATE KEY-----',
  '-----BEGIN RSA PRIVATE KEY-----',
  '-----BEGIN EC PRIVATE KEY-----',
  '-----BEGIN OPENSSH PRIVATE KEY-----',
];

function trackedFiles(): readonly string[] {
  return execFileSync('git', ['ls-files'], { encoding: 'utf8' })
    .split('\n')
    .map((path) => path.trim())
    .filter(Boolean);
}

describe('repository tracked-file security policy', () => {
  it('does not track local environment or private credential container files', () => {
    const violations = trackedFiles().filter((path) =>
      forbiddenTrackedPathPatterns.some((pattern) => pattern.test(path)),
    );

    expect(violations).toEqual([]);
  });

  it('does not contain private-key block markers in tracked text files', () => {
    const violations: string[] = [];

    for (const path of trackedFiles()) {
      let content: string;
      try {
        content = readFileSync(path, 'utf8');
      } catch {
        continue;
      }

      if (forbiddenContentMarkers.some((marker) => content.includes(marker))) {
        violations.push(path);
      }
    }

    expect(violations).toEqual([]);
  });
});
