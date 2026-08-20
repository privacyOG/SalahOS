import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { createManagedAdminService } from './server.mjs';

const ADMIN_TOKEN = 'admin-token-'.padEnd(48, 'a');
const temporaryDirectories = [];

async function startService() {
  const directory = await mkdtemp(join(tmpdir(), 'salahos-managed-admin-'));
  temporaryDirectories.push(directory);
  const statePath = join(directory, 'state.json');
  const service = await createManagedAdminService({ adminToken: ADMIN_TOKEN, statePath });
  const server = service.createHttpServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (address === null || typeof address === 'string') throw new Error('Test server address unavailable');
  return {
    statePath,
    server,
    baseUrl: `http://127.0.0.1:${String(address.port)}`,
  };
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();
  return { response, body };
}

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })));
});

describe('managed administration service', () => {
  it('requires admin authentication and enrolls a display with a one-time device token', async () => {
    const { server, baseUrl, statePath } = await startService();
    try {
      const unauthorized = await request(baseUrl, '/v1/admin/displays');
      expect(unauthorized.response.status).toBe(401);

      const enrollment = await request(baseUrl, '/v1/admin/displays', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${ADMIN_TOKEN}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          displayId: 'display:lobby',
          organizationId: 'org:example',
          mosqueId: 'mosque:example',
          locationId: 'location:lobby',
          orientation: 'landscape',
          resolutionProfile: 'tv-16x9',
          playlistId: 'playlist:main',
        }),
      });

      expect(enrollment.response.status).toBe(201);
      expect(enrollment.body.display.identity.displayId).toBe('display:lobby');
      expect(enrollment.body.deviceToken).toMatch(/^[A-Za-z0-9_-]{40,}$/u);

      const persisted = JSON.parse(await readFile(statePath, 'utf8'));
      expect(persisted.displays['display:lobby'].deviceTokenHash).toMatch(/^[0-9a-f]{64}$/u);
      expect(JSON.stringify(persisted)).not.toContain(enrollment.body.deviceToken);
    } finally {
      await closeServer(server);
    }
  });

  it('serves authenticated device config, accepts heartbeat and exposes live fleet status', async () => {
    const { server, baseUrl } = await startService();
    try {
      const enrollment = await request(baseUrl, '/v1/admin/displays', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${ADMIN_TOKEN}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          displayId: 'display:foyer',
          organizationId: 'org:example',
          mosqueId: 'mosque:example',
          locationId: 'location:foyer',
          orientation: 'portrait',
          resolutionProfile: 'portrait-foyer',
          playlistId: null,
        }),
      });
      const deviceToken = enrollment.body.deviceToken;

      const configuration = await request(
        baseUrl,
        '/v1/device/config?displayId=display%3Afoyer',
        { headers: { authorization: `Bearer ${deviceToken}` } },
      );
      expect(configuration.response.status).toBe(200);
      expect(configuration.body.displayTheme).toBe('classic');

      const seenAt = new Date().toISOString();
      const heartbeat = await request(baseUrl, '/v1/device/heartbeat', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${deviceToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          displayId: 'display:foyer',
          appVersion: '1.1.0',
          contentRevision: 0,
          seenAt,
        }),
      });
      expect(heartbeat.response.status).toBe(200);
      expect(heartbeat.body.syncState).toBe('current');

      const list = await request(baseUrl, '/v1/admin/displays', {
        headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
      });
      expect(list.body.displays[0]).toMatchObject({
        lastSeenAt: seenAt,
        appVersion: '1.1.0',
        reportedContentRevision: 0,
      });
    } finally {
      await closeServer(server);
    }
  });

  it('enforces optimistic configuration revisions and remote revocation', async () => {
    const { server, baseUrl } = await startService();
    try {
      const enrollment = await request(baseUrl, '/v1/admin/displays', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${ADMIN_TOKEN}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          displayId: 'display:hall',
          organizationId: 'org:example',
          mosqueId: 'mosque:example',
          locationId: 'location:hall',
          orientation: 'landscape',
          resolutionProfile: 'tv-16x9',
          playlistId: null,
        }),
      });
      const deviceToken = enrollment.body.deviceToken;

      const update = await request(baseUrl, '/v1/admin/displays/display%3Ahall/config', {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${ADMIN_TOKEN}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          expectedRevision: 0,
          contentRevision: 1,
          playlistId: 'playlist:ramadan',
          displayTheme: 'emerald',
        }),
      });
      expect(update.response.status).toBe(200);
      expect(update.body.remoteConfig).toMatchObject({
        contentRevision: 1,
        playlistId: 'playlist:ramadan',
        displayTheme: 'emerald',
      });

      const stale = await request(baseUrl, '/v1/admin/displays/display%3Ahall/config', {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${ADMIN_TOKEN}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          expectedRevision: 0,
          contentRevision: 2,
          playlistId: null,
          displayTheme: 'classic',
        }),
      });
      expect(stale.response.status).toBe(409);

      const revoke = await request(baseUrl, '/v1/admin/displays/display%3Ahall/revoke', {
        method: 'POST',
        headers: { authorization: `Bearer ${ADMIN_TOKEN}` },
      });
      expect(revoke.body.remoteConfig.revoked).toBe(true);
      expect(revoke.body.syncState).toBe('revoked');

      const heartbeatAfterRevocation = await request(baseUrl, '/v1/device/heartbeat', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${deviceToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          displayId: 'display:hall',
          appVersion: '1.1.0',
          contentRevision: 1,
          seenAt: new Date().toISOString(),
        }),
      });
      expect(heartbeatAfterRevocation.response.status).toBe(403);
    } finally {
      await closeServer(server);
    }
  });

  it('reloads persisted fleet state without exposing device tokens', async () => {
    const first = await startService();
    let deviceToken;
    try {
      const enrollment = await request(first.baseUrl, '/v1/admin/displays', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${ADMIN_TOKEN}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          displayId: 'display:persistent',
          organizationId: 'org:example',
          mosqueId: 'mosque:example',
          locationId: 'location:persistent',
          orientation: 'landscape',
          resolutionProfile: 'tv-16x9',
          playlistId: null,
        }),
      });
      deviceToken = enrollment.body.deviceToken;
    } finally {
      await closeServer(first.server);
    }

    const service = await createManagedAdminService({ adminToken: ADMIN_TOKEN, statePath: first.statePath });
    const server = service.createHttpServer();
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const address = server.address();
    if (address === null || typeof address === 'string') throw new Error('Test server address unavailable');
    const baseUrl = `http://127.0.0.1:${String(address.port)}`;
    try {
      const configuration = await request(
        baseUrl,
        '/v1/device/config?displayId=display%3Apersistent',
        { headers: { authorization: `Bearer ${deviceToken}` } },
      );
      expect(configuration.response.status).toBe(200);
    } finally {
      await closeServer(server);
    }
  });
});
