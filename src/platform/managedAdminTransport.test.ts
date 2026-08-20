import { describe, expect, it } from 'vitest';

import { createManagedAdminClient } from './managedAdminTransport';

const TOKEN = 'a'.repeat(48);

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

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
  lastSeenAt: null,
  appVersion: null,
  reportedContentRevision: 0,
  syncState: 'offline',
  remoteConfig: {
    displayId: 'display:lobby',
    contentRevision: 1,
    playlistId: 'playlist:main',
    displayTheme: 'classic',
    revoked: false,
    updatedAt: '2026-08-20T00:00:00.000Z',
  },
} as const;

describe('managed admin transport', () => {
  it('requires HTTPS except for explicit loopback development', () => {
    expect(() =>
      createManagedAdminClient({ baseUrl: 'http://example.org', adminToken: TOKEN }, async () =>
        jsonResponse({}),
      ),
    ).toThrow(/HTTPS/u);

    expect(() =>
      createManagedAdminClient({ baseUrl: 'http://127.0.0.1:8787', adminToken: TOKEN }, async () =>
        jsonResponse({}),
      ),
    ).not.toThrow();
  });

  it('lists displays with bearer auth and no credential persistence semantics', async () => {
    const requests: { input: RequestInfo | URL; init?: RequestInit }[] = [];
    const client = createManagedAdminClient(
      { baseUrl: 'https://admin.example.org', adminToken: TOKEN },
      async (input, init) => {
        requests.push({ input, init });
        return jsonResponse({ displays: [status] });
      },
    );

    const displays = await client.listDisplays();

    expect(displays).toHaveLength(1);
    expect(displays[0]?.identity.displayId).toBe('display:lobby');
    expect(String(requests[0]?.input)).toBe('https://admin.example.org/v1/admin/displays');
    expect(new Headers(requests[0]?.init?.headers).get('authorization')).toBe(`Bearer ${TOKEN}`);
    expect(requests[0]?.init?.credentials).toBe('omit');
    expect(requests[0]?.init?.cache).toBe('no-store');
  });

  it('registers a display and returns the one-time device credential', async () => {
    const client = createManagedAdminClient(
      { baseUrl: 'https://admin.example.org', adminToken: TOKEN },
      async (_input, init) => {
        expect(init?.method).toBe('POST');
        return jsonResponse({ display: status, deviceToken: 'd'.repeat(48) });
      },
    );

    const enrollment = await client.registerDisplay(status.identity);

    expect(enrollment.display.identity.displayId).toBe('display:lobby');
    expect(enrollment.deviceToken).toHaveLength(48);
  });

  it('updates revisioned configuration and revokes a display', async () => {
    const methods: string[] = [];
    const client = createManagedAdminClient(
      { baseUrl: 'https://admin.example.org', adminToken: TOKEN },
      async (_input, init) => {
        methods.push(init?.method ?? 'GET');
        return jsonResponse(status);
      },
    );

    await client.updateDisplayConfig('display:lobby', {
      expectedRevision: 1,
      contentRevision: 2,
      playlistId: 'playlist:main',
      displayTheme: 'midnight',
    });
    await client.revokeDisplay('display:lobby');

    expect(methods).toEqual(['PUT', 'POST']);
  });

  it('surfaces structured service errors without accepting non-JSON responses', async () => {
    const denied = createManagedAdminClient(
      { baseUrl: 'https://admin.example.org', adminToken: TOKEN },
      async () => jsonResponse({ error: 'Not authorized' }, 403),
    );
    await expect(denied.listDisplays()).rejects.toThrow('Not authorized');

    const invalid = createManagedAdminClient(
      { baseUrl: 'https://admin.example.org', adminToken: TOKEN },
      async () => new Response('nope', { status: 500 }),
    );
    await expect(invalid.listDisplays()).rejects.toThrow(/non-JSON/u);
  });
});
