import { describe, expect, it } from 'vitest';

import { createManagedDisplayClient } from './managedAdminTransport';

const connection = {
  baseUrl: 'https://admin.example.org',
  displayId: 'display:lobby',
  deviceToken: 'd'.repeat(48),
} as const;

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function requestInputUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  return input instanceof URL ? input.toString() : input.url;
}

const remoteConfig = {
  displayId: 'display:lobby',
  contentRevision: 4,
  playlistId: 'playlist:main',
  displayTheme: 'emerald',
  revoked: false,
  updatedAt: '2026-08-20T00:00:00.000Z',
} as const;

const status = {
  identity: {
    displayId: 'display:lobby',
    organizationId: 'org:example',
    mosqueId: 'mosque:example',
    locationId: 'location:lobby',
    orientation: 'landscape',
    resolutionProfile: 'tv-16x9',
    playlistId: 'playlist:main',
  },
  lastSeenAt: '2026-08-20T00:01:00.000Z',
  appVersion: '1.1.0',
  reportedContentRevision: 4,
  syncState: 'current',
  remoteConfig,
} as const;

describe('managed display device transport', () => {
  it('polls assigned configuration with the device credential', async () => {
    const requests: { input: RequestInfo | URL; init?: RequestInit }[] = [];
    const client = createManagedDisplayClient(connection, (input, init) => {
      requests.push(init === undefined ? { input } : { input, init });
      return Promise.resolve(jsonResponse(remoteConfig));
    });

    const config = await client.getConfig();

    expect(config).toMatchObject({
      ...remoteConfig,
      prayerBoardAssignment: 'service-default',
      prayerBoardConfig: {
        templateId: 'heritage-classic',
        accentPreset: 'emerald',
      },
    });
    const request = requests[0];
    expect(request === undefined ? '' : requestInputUrl(request.input)).toBe(
      'https://admin.example.org/v1/device/config?displayId=display%3Alobby',
    );
    expect(new Headers(request?.init?.headers).get('authorization')).toBe(
      `Bearer ${connection.deviceToken}`,
    );
  });

  it('heartbeats an applied revision without allowing a different display ID', async () => {
    let requestBody: unknown = null;
    const client = createManagedDisplayClient(connection, (_input, init) => {
      if (typeof init?.body !== 'string') {
        throw new TypeError('Heartbeat request body must be JSON text');
      }
      requestBody = JSON.parse(init.body) as unknown;
      return Promise.resolve(jsonResponse(status));
    });

    const result = await client.heartbeat({
      appVersion: '1.1.0',
      contentRevision: 4,
      seenAt: '2026-08-20T00:01:00.000Z',
    });

    expect(requestBody).toEqual({
      displayId: 'display:lobby',
      appVersion: '1.1.0',
      contentRevision: 4,
      seenAt: '2026-08-20T00:01:00.000Z',
    });
    expect(result.syncState).toBe('current');
  });

  it('rejects malformed device credentials before issuing a request', () => {
    expect(() =>
      createManagedDisplayClient({
        ...connection,
        deviceToken: 'short',
      }),
    ).toThrow(/32 through 512/u);
  });
});
