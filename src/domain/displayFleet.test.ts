import { describe, expect, it } from 'vitest';

import {
  createDisplayCachedConfiguration,
  createDisplayFleetStatus,
  createDisplayIdentity,
  createDisplayPairingCode,
  pairingCodeIsUsable,
  reconcileDisplayConfiguration,
} from './displayFleet';

describe('managed display pairing and fleet state', () => {
  it('creates assigned display identity and presentation profile metadata', () => {
    const display = createDisplayIdentity({
      displayId: ' Lobby-Display-01 ',
      organizationId: ' Org-Main ',
      mosqueId: ' Masjid-Main ',
      locationId: ' Foyer ',
      orientation: 'portrait',
      resolutionProfile: ' 1080x1920 ',
      playlistId: ' Welcome-Rotation ',
    });

    expect(display.displayId).toBe('lobby-display-01');
    expect(display.locationId).toBe('foyer');
    expect(display.orientation).toBe('portrait');
    expect(display.playlistId).toBe('welcome-rotation');
  });

  it('supports short-lived one-time pairing codes without administrator credentials', () => {
    const pairing = createDisplayPairingCode({
      code: ' A1B2C3 ',
      displayId: 'lobby-display-01',
      expiresAt: '2026-08-19T10:15:00.000Z',
      usedAt: null,
      revokedAt: null,
    });

    expect(pairing.code).toBe('A1B2C3');
    expect(pairingCodeIsUsable(pairing, '2026-08-19T10:10:00.000Z')).toBe(true);
    expect(pairingCodeIsUsable(pairing, '2026-08-19T10:15:00.000Z')).toBe(false);
  });

  it('rejects already-used or revoked pairing codes', () => {
    const used = createDisplayPairingCode({
      code: 'ABC123',
      displayId: 'lobby-display-01',
      expiresAt: '2026-08-19T10:15:00.000Z',
      usedAt: '2026-08-19T10:05:00.000Z',
      revokedAt: null,
    });
    const revoked = createDisplayPairingCode({
      code: 'XYZ789',
      displayId: 'lobby-display-01',
      expiresAt: '2026-08-19T10:15:00.000Z',
      usedAt: null,
      revokedAt: '2026-08-19T10:04:00.000Z',
    });

    expect(pairingCodeIsUsable(used, '2026-08-19T10:06:00.000Z')).toBe(false);
    expect(pairingCodeIsUsable(revoked, '2026-08-19T10:06:00.000Z')).toBe(false);
  });

  it('records fleet health and synchronization metadata', () => {
    const status = createDisplayFleetStatus({
      displayId: 'lobby-display-01',
      lastSeenAt: '2026-08-19T10:00:00.000Z',
      appVersion: '1.1.0',
      contentRevision: 42,
      syncState: 'current',
    });

    expect(status.appVersion).toBe('1.1.0');
    expect(status.contentRevision).toBe(42);
    expect(status.syncState).toBe('current');
  });

  it('keeps cached signage and local prayer capability available offline', () => {
    const cache = createDisplayCachedConfiguration({
      displayId: 'lobby-display-01',
      contentRevision: 42,
      playlistId: 'welcome-rotation',
      cachedAt: '2026-08-19T10:00:00.000Z',
      localPrayerAvailable: true,
    });

    expect(cache.playlistId).toBe('welcome-rotation');
    expect(cache.localPrayerAvailable).toBe(true);
    expect(Object.isFrozen(cache)).toBe(true);
  });

  it('applies a newer remote revision after reconnect without losing local prayer state', () => {
    const local = createDisplayCachedConfiguration({
      displayId: 'lobby-display-01',
      contentRevision: 42,
      playlistId: 'welcome-rotation',
      cachedAt: '2026-08-19T10:00:00.000Z',
      localPrayerAvailable: true,
    });

    const result = reconcileDisplayConfiguration(local, {
      displayId: 'lobby-display-01',
      contentRevision: 43,
      playlistId: 'friday-rotation',
      revoked: false,
    });

    expect(result.action).toBe('apply-remote');
    expect(result.effectiveRevision).toBe(43);
    expect(result.effectivePlaylistId).toBe('friday-rotation');
    expect(result.localPrayerAvailable).toBe(true);
  });

  it('detects equal-revision conflicts deterministically and honours revocation', () => {
    const local = createDisplayCachedConfiguration({
      displayId: 'lobby-display-01',
      contentRevision: 43,
      playlistId: 'friday-rotation',
      cachedAt: '2026-08-19T10:00:00.000Z',
      localPrayerAvailable: true,
    });

    expect(
      reconcileDisplayConfiguration(local, {
        displayId: 'lobby-display-01',
        contentRevision: 43,
        playlistId: 'different-rotation',
        revoked: false,
      }).action,
    ).toBe('report-conflict');

    expect(
      reconcileDisplayConfiguration(local, {
        displayId: 'lobby-display-01',
        contentRevision: 44,
        playlistId: null,
        revoked: true,
      }).action,
    ).toBe('revoke');
  });
});
