import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  assertBindPolicy,
  createLocalPublicApiService,
  createRateLimiter,
  validatePublicSnapshot,
} from './server.mjs';

const temporaryDirectories = [];

function exampleSnapshot() {
  return {
    version: 1,
    generatedAt: '2026-08-20T04:15:00Z',
    mosques: {
      'masjid.one': {
        profile: {
          mosqueId: 'masjid.one',
          name: 'Masjid One',
          timezone: 'Australia/Sydney',
          address: '1 Example Street, Sydney NSW',
          publishedAt: '2026-08-20T04:15:00Z',
          revision: 7,
        },
        dailyPrayers: {
          '2026-08-20': {
            mosqueId: 'masjid.one',
            date: '2026-08-20',
            timezone: 'Australia/Sydney',
            publishedAt: '2026-08-20T04:15:00Z',
            revision: 7,
            prayers: {
              fajr: '05:18',
              dhuhr: '12:03',
              asr: '15:21',
              maghrib: '17:33',
              isha: '19:00',
            },
            iqamah: {
              fajr: { kind: 'offset', offsetMinutes: 20 },
              dhuhr: { kind: 'fixed', localMinutes: 740 },
            },
            jumuah: [],
            hijriLabel: '7 Rabi al-Awwal 1448',
          },
        },
        monthlyTimetables: {
          '2026-08': {
            mosqueId: 'masjid.one',
            month: '2026-08',
            timezone: 'Australia/Sydney',
            publishedAt: '2026-08-20T04:15:00Z',
            revision: 7,
            days: [
              {
                date: '2026-08-20',
                prayers: {
                  fajr: '05:18',
                  dhuhr: '12:03',
                  asr: '15:21',
                  maghrib: '17:33',
                  isha: '19:00',
                },
                iqamah: { fajr: '05:38' },
              },
            ],
          },
        },
      },
    },
  };
}

async function startService(snapshot = exampleSnapshot(), options = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'salahos-local-api-'));
  temporaryDirectories.push(directory);
  const dataPath = join(directory, 'public-data.json');
  await writeFile(dataPath, `${JSON.stringify(snapshot)}\n`, 'utf8');
  const service = await createLocalPublicApiService({ dataPath, ...options });
  const server = service.createHttpServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Local API test server address unavailable');
  }
  return {
    dataPath,
    service,
    server,
    baseUrl: `http://127.0.0.1:${String(address.port)}`,
  };
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error === undefined ? resolve() : reject(error)));
  });
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('local public API service', () => {
  it('serves the versioned public profile, daily prayer and monthly timetable endpoints', async () => {
    const running = await startService();
    try {
      const profile = await fetch(`${running.baseUrl}/api/v1/mosques/masjid.one`);
      expect(profile.status).toBe(200);
      expect(profile.headers.get('cache-control')).toBe(
        'public, max-age=60, stale-while-revalidate=300',
      );
      expect(profile.headers.get('content-security-policy')).toContain("default-src 'none'");
      expect(profile.headers.get('x-content-type-options')).toBe('nosniff');
      expect(profile.headers.get('x-salahos-snapshot-state')).toBe('fresh');
      expect(await profile.json()).toMatchObject({
        mosqueId: 'masjid.one',
        name: 'Masjid One',
        timezone: 'Australia/Sydney',
      });

      const daily = await fetch(`${running.baseUrl}/api/v1/mosques/masjid.one/prayers/2026-08-20`);
      expect(daily.status).toBe(200);
      expect(await daily.json()).toMatchObject({
        mosqueId: 'masjid.one',
        date: '2026-08-20',
        prayers: { fajr: '05:18', isha: '19:00' },
      });

      const monthly = await fetch(
        `${running.baseUrl}/api/v1/mosques/masjid.one/timetables/2026-08`,
      );
      expect(monthly.status).toBe(200);
      expect(monthly.headers.get('cache-control')).toBe(
        'public, max-age=300, stale-while-revalidate=900',
      );
      expect(await monthly.json()).toMatchObject({
        mosqueId: 'masjid.one',
        month: '2026-08',
      });
    } finally {
      await closeServer(running.server);
    }
  });

  it('rejects mutation methods, query parameters and unknown public resources', async () => {
    const running = await startService();
    try {
      const mutation = await fetch(`${running.baseUrl}/api/v1/mosques/masjid.one`, {
        method: 'POST',
      });
      expect(mutation.status).toBe(405);
      expect(mutation.headers.get('allow')).toBe('GET');

      const query = await fetch(`${running.baseUrl}/api/v1/mosques/masjid.one?admin=true`);
      expect(query.status).toBe(400);

      const missing = await fetch(`${running.baseUrl}/api/v1/mosques/masjid.missing`);
      expect(missing.status).toBe(404);
    } finally {
      await closeServer(running.server);
    }
  });

  it('retains last-known-good public data when an updated snapshot is malformed', async () => {
    const running = await startService();
    try {
      const before = await fetch(`${running.baseUrl}/api/v1/mosques/masjid.one`);
      expect(before.headers.get('x-salahos-snapshot-state')).toBe('fresh');

      await writeFile(running.dataPath, '{"version":1,"mosques":', 'utf8');
      const after = await fetch(`${running.baseUrl}/api/v1/mosques/masjid.one`);
      expect(after.status).toBe(200);
      expect(after.headers.get('x-salahos-snapshot-state')).toBe('stale');
      expect(await after.json()).toMatchObject({ name: 'Masjid One' });
    } finally {
      await closeServer(running.server);
    }
  });

  it('rejects privileged data and mismatched public identifiers before startup', () => {
    const withCredential = exampleSnapshot();
    withCredential.mosques['masjid.one'].profile.deviceToken = 'not-public';
    expect(() => validatePublicSnapshot(withCredential)).toThrow(
      /not permitted in public API data/u,
    );

    const mismatched = exampleSnapshot();
    mismatched.mosques['masjid.one'].profile.mosqueId = 'masjid.two';
    expect(() => validatePublicSnapshot(mismatched)).toThrow(/does not match snapshot key/u);
  });

  it('requires explicit opt-in before binding beyond loopback', () => {
    expect(assertBindPolicy('127.0.0.1', false)).toBe('127.0.0.1');
    expect(() => assertBindPolicy('0.0.0.0', false)).toThrow(/requires explicit/u);
    expect(assertBindPolicy('0.0.0.0', true)).toBe('0.0.0.0');
    expect(assertBindPolicy('192.168.1.25', true)).toBe('192.168.1.25');
  });

  it('rate-limits by client and resource class', () => {
    const limiter = createRateLimiter({ windowMs: 1_000, limits: { profile: 2 } });
    expect(limiter.allow('127.0.0.1', 'profile', 0)).toBe(true);
    expect(limiter.allow('127.0.0.1', 'profile', 1)).toBe(true);
    expect(limiter.allow('127.0.0.1', 'profile', 2)).toBe(false);
    expect(limiter.allow('127.0.0.2', 'profile', 2)).toBe(true);
    expect(limiter.allow('127.0.0.1', 'profile', 1_001)).toBe(true);
  });
});
