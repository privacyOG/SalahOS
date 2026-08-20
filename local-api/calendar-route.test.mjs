import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { createLocalPublicApiService } from './server.mjs';

const temporaryDirectories = [];

function snapshot(events) {
  return {
    version: 1,
    generatedAt: '2026-08-20T04:30:00.000Z',
    mosques: {
      'masjid.one': {
        profile: {
          mosqueId: 'masjid.one',
          name: 'Masjid One',
          timezone: 'Australia/Sydney',
        },
        dailyPrayers: {},
        monthlyTimetables: {},
        events,
      },
    },
  };
}

function event(overrides = {}) {
  return {
    eventId: 'community-iftar',
    mosqueId: 'masjid.one',
    english: {
      title: 'Community Iftar',
      description: 'Join the community for iftar after Maghrib.',
    },
    arabic: null,
    venue: 'Main prayer hall',
    allDay: false,
    startsAt: '2026-08-20T08:00:00.000Z',
    endsAt: '2026-08-20T10:00:00.000Z',
    recurrence: 'none',
    registrationUrl: 'https://example.org/register',
    ...overrides,
  };
}

async function startService(data) {
  const directory = await mkdtemp(join(tmpdir(), 'salahos-calendar-route-'));
  temporaryDirectories.push(directory);
  const dataPath = join(directory, 'public-data.json');
  await writeFile(dataPath, `${JSON.stringify(data)}\n`, 'utf8');
  const service = await createLocalPublicApiService({ dataPath });
  const server = service.createHttpServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Calendar route test server address unavailable');
  }
  return { server, baseUrl: `http://127.0.0.1:${String(address.port)}` };
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

describe('local API calendar subscription route', () => {
  it('serves a standards-based event feed with calendar response metadata', async () => {
    const running = await startService(snapshot([event()]));
    try {
      const response = await fetch(`${running.baseUrl}/api/v1/mosques/masjid.one/calendar.ics`);
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/calendar; charset=utf-8');
      expect(response.headers.get('content-disposition')).toBe(
        'inline; filename="masjid.one-events.ics"',
      );
      expect(response.headers.get('cache-control')).toBe(
        'public, max-age=300, stale-while-revalidate=900',
      );
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(response.headers.get('x-salahos-snapshot-state')).toBe('fresh');
      expect(body).toContain('BEGIN:VCALENDAR\r\n');
      expect(body).toContain('UID:community-iftar.masjid.one@salahos\r\n');
      expect(body).toContain('DTSTAMP:20260820T043000Z\r\n');
      expect(body).toContain('END:VCALENDAR\r\n');
    } finally {
      await closeServer(running.server);
    }
  });

  it('returns 404 when the mosque publishes no calendar events', async () => {
    const running = await startService(snapshot([]));
    try {
      const response = await fetch(`${running.baseUrl}/api/v1/mosques/masjid.one/calendar.ics`);
      expect(response.status).toBe(404);
    } finally {
      await closeServer(running.server);
    }
  });

  it('rejects a calendar snapshot without deterministic generatedAt metadata', async () => {
    const data = snapshot([event()]);
    delete data.generatedAt;
    await expect(startService(data)).rejects.toThrow(/generatedAt/u);
  });

  it('rejects privileged fields inside public calendar events', async () => {
    const data = snapshot([event({ adminToken: 'not-public' })]);
    await expect(startService(data)).rejects.toThrow(/not permitted in public API data/u);
  });
});
