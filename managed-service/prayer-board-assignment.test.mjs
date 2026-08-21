import { createHash } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { createManagedAdminService } from './server.mjs';

const ADMIN_TOKEN = 'admin-token-'.padEnd(48, 'a');
const temporaryDirectories = [];

function board(templateId, accentPreset = 'neutral') {
  return {
    version: 1,
    templateId,
    primaryLocale: 'en',
    languageMode: 'single',
    timeFormat: 'h23',
    accentPreset,
    moduleVisibility: {},
    branding: { mosqueName: { en: 'Test Masjid' }, logo: null },
    background: { kind: 'builtin', artworkId: 'ignored-by-managed-normalizer' },
  };
}

async function startService(statePath = null) {
  let path = statePath;
  if (path === null) {
    const directory = await mkdtemp(join(tmpdir(), 'salahos-managed-prayer-board-'));
    temporaryDirectories.push(directory);
    path = join(directory, 'state.json');
  }
  const service = await createManagedAdminService({ adminToken: ADMIN_TOKEN, statePath: path });
  const server = service.createHttpServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (address === null || typeof address === 'string') throw new Error('Test server unavailable');
  return { server, baseUrl: `http://127.0.0.1:${String(address.port)}` };
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();
  return { response, body };
}

function adminOptions(method = 'GET', body = undefined) {
  return {
    method,
    headers: {
      authorization: `Bearer ${ADMIN_TOKEN}`,
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  };
}

async function enroll(baseUrl, input) {
  const result = await request(baseUrl, '/v1/admin/displays', adminOptions('POST', input));
  expect(result.response.status).toBe(201);
  return result.body;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true })),
  );
});

describe('managed prayer-board assignment service', () => {
  it('publishes mosque defaults only to compatible non-overridden displays', async () => {
    const { server, baseUrl } = await startService();
    try {
      const lobby = await enroll(baseUrl, {
        displayId: 'display:lobby',
        organizationId: 'org:example',
        mosqueId: 'mosque:example',
        locationId: 'location:lobby',
        orientation: 'landscape',
        resolutionProfile: '1920x1080',
        playlistId: null,
      });
      await enroll(baseUrl, {
        displayId: 'display:foyer',
        organizationId: 'org:example',
        mosqueId: 'mosque:example',
        locationId: 'location:foyer',
        orientation: 'portrait',
        resolutionProfile: '1080x1920',
        playlistId: null,
      });

      const published = await request(
        baseUrl,
        '/v1/admin/mosques/mosque%3Aexample/prayer-board-default',
        adminOptions('PUT', {
          expectedRevision: 0,
          revision: 1,
          prayerBoardConfig: board('minimal-modern'),
        }),
      );
      expect(published.response.status).toBe(200);
      expect(published.body).toMatchObject({
        mosqueId: 'mosque:example',
        revision: 1,
        prayerBoardConfig: { templateId: 'minimal-modern' },
      });

      const list = await request(baseUrl, '/v1/admin/displays', adminOptions());
      const lobbyStatus = list.body.displays.find(
        (display) => display.identity.displayId === 'display:lobby',
      );
      const foyerStatus = list.body.displays.find(
        (display) => display.identity.displayId === 'display:foyer',
      );
      expect(lobbyStatus.remoteConfig).toMatchObject({
        contentRevision: 1,
        prayerBoardAssignment: 'mosque-default',
        prayerBoardConfig: { templateId: 'minimal-modern' },
      });
      expect(foyerStatus.remoteConfig).toMatchObject({
        contentRevision: 0,
        prayerBoardAssignment: 'service-default',
        prayerBoardConfig: { templateId: 'heritage-classic' },
      });

      const device = await request(baseUrl, '/v1/device/config?displayId=display%3Alobby', {
        headers: { authorization: `Bearer ${lobby.deviceToken}` },
      });
      expect(device.body.prayerBoardConfig.templateId).toBe('minimal-modern');
      expect(device.body.prayerBoardAssignment).toBe('mosque-default');
    } finally {
      await closeServer(server);
    }
  });

  it('keeps per-display overrides stable until explicitly returned to the mosque default', async () => {
    const { server, baseUrl } = await startService();
    try {
      await enroll(baseUrl, {
        displayId: 'display:hall',
        organizationId: 'org:example',
        mosqueId: 'mosque:example',
        locationId: 'location:hall',
        orientation: 'landscape',
        resolutionProfile: '3840x2160',
        playlistId: null,
      });
      await request(
        baseUrl,
        '/v1/admin/mosques/mosque%3Aexample/prayer-board-default',
        adminOptions('PUT', {
          expectedRevision: 0,
          revision: 1,
          prayerBoardConfig: board('minimal-modern'),
        }),
      );

      const override = await request(
        baseUrl,
        '/v1/admin/displays/display%3Ahall/config',
        adminOptions('PUT', {
          expectedRevision: 1,
          contentRevision: 2,
          playlistId: null,
          displayTheme: 'emerald',
          prayerBoardConfig: board('family-classroom', 'emerald'),
        }),
      );
      expect(override.body.remoteConfig).toMatchObject({
        contentRevision: 2,
        prayerBoardAssignment: 'display-override',
        prayerBoardConfig: { templateId: 'family-classroom' },
      });

      await request(
        baseUrl,
        '/v1/admin/mosques/mosque%3Aexample/prayer-board-default',
        adminOptions('PUT', {
          expectedRevision: 1,
          revision: 2,
          prayerBoardConfig: board('scenic-spiritual', 'midnight'),
        }),
      );

      let list = await request(baseUrl, '/v1/admin/displays', adminOptions());
      expect(list.body.displays[0].remoteConfig).toMatchObject({
        contentRevision: 2,
        prayerBoardAssignment: 'display-override',
        prayerBoardConfig: { templateId: 'family-classroom' },
      });

      const inherited = await request(
        baseUrl,
        '/v1/admin/displays/display%3Ahall/config',
        adminOptions('PUT', {
          expectedRevision: 2,
          contentRevision: 3,
          playlistId: null,
          displayTheme: 'midnight',
          prayerBoardConfig: null,
        }),
      );
      expect(inherited.body.remoteConfig).toMatchObject({
        contentRevision: 3,
        prayerBoardAssignment: 'mosque-default',
        prayerBoardConfig: { templateId: 'scenic-spiritual' },
      });

      list = await request(baseUrl, '/v1/admin/displays', adminOptions());
      expect(list.body.displays[0].remoteConfig.prayerBoardConfig.background).toEqual({
        kind: 'builtin',
        artworkId: 'scenic-gradient',
      });
    } finally {
      await closeServer(server);
    }
  });

  it('rejects prayer-board publication to unvalidated target geometry', async () => {
    const { server, baseUrl } = await startService();
    try {
      await enroll(baseUrl, {
        displayId: 'display:touch',
        organizationId: 'org:example',
        mosqueId: 'mosque:example',
        locationId: 'location:touch',
        orientation: 'landscape',
        resolutionProfile: '1280x720',
        playlistId: null,
      });

      const update = await request(
        baseUrl,
        '/v1/admin/displays/display%3Atouch/config',
        adminOptions('PUT', {
          expectedRevision: 0,
          contentRevision: 1,
          playlistId: null,
          displayTheme: 'classic',
          prayerBoardConfig: board('minimal-modern'),
        }),
      );
      expect(update.response.status).toBe(409);
      expect(update.body.error).toMatch(/validated 1920x1080 or 3840x2160/u);
    } finally {
      await closeServer(server);
    }
  });

  it('records the template actually applied by the display heartbeat', async () => {
    const { server, baseUrl } = await startService();
    try {
      const enrollment = await enroll(baseUrl, {
        displayId: 'display:status',
        organizationId: 'org:example',
        mosqueId: 'mosque:example',
        locationId: 'location:status',
        orientation: 'landscape',
        resolutionProfile: '1920x1080',
        playlistId: null,
      });
      const seenAt = new Date().toISOString();
      const heartbeat = await request(baseUrl, '/v1/device/heartbeat', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${enrollment.deviceToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          displayId: 'display:status',
          appVersion: '1.2.0',
          contentRevision: 0,
          prayerBoardTemplateId: 'heritage-classic',
          seenAt,
        }),
      });
      expect(heartbeat.response.status).toBe(200);
      expect(heartbeat.body.reportedPrayerBoardTemplateId).toBe('heritage-classic');
    } finally {
      await closeServer(server);
    }
  });

  it('migrates version-1 managed state into a safe heritage prayer-board assignment', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'salahos-managed-v1-migration-'));
    temporaryDirectories.push(directory);
    const statePath = join(directory, 'state.json');
    const deviceToken = 'device-token-'.padEnd(48, 'd');
    const deviceTokenHash = createHash('sha256').update(deviceToken, 'utf8').digest('hex');
    await writeFile(
      statePath,
      `${JSON.stringify({
        version: 1,
        displays: {
          'display:legacy': {
            identity: {
              displayId: 'display:legacy',
              organizationId: 'org:example',
              mosqueId: 'mosque:example',
              locationId: 'location:legacy',
              orientation: 'landscape',
              resolutionProfile: 'tv-16x9',
              playlistId: null,
            },
            deviceTokenHash,
            lastSeenAt: null,
            appVersion: null,
            reportedContentRevision: 0,
            remoteConfig: {
              displayId: 'display:legacy',
              contentRevision: 0,
              playlistId: null,
              displayTheme: 'emerald',
              revoked: false,
              updatedAt: '2026-08-20T00:00:00.000Z',
            },
          },
        },
      })}\n`,
    );

    const { server, baseUrl } = await startService(statePath);
    try {
      const config = await request(baseUrl, '/v1/device/config?displayId=display%3Alegacy', {
        headers: { authorization: `Bearer ${deviceToken}` },
      });
      expect(config.response.status).toBe(200);
      expect(config.body).toMatchObject({
        contentRevision: 0,
        displayTheme: 'emerald',
        prayerBoardAssignment: 'service-default',
        prayerBoardConfig: {
          templateId: 'heritage-classic',
          accentPreset: 'emerald',
        },
      });
    } finally {
      await closeServer(server);
    }
  });
});
