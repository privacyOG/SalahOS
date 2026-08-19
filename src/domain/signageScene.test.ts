import { describe, expect, it } from 'vitest';

import {
  createSignageScene,
  resolveSignageOfflineFallback,
  signageSceneCanRenderOffline,
} from './signageScene';

describe('managed signage scenes', () => {
  it('normalizes the prayer board as a first-class scene', () => {
    const scene = createSignageScene({
      sceneId: ' Prayer-Board-Main ',
      mosqueId: ' Masjid-Al-Noor:Sydney ',
      kind: 'prayer-board',
      title: ' Main   prayer board ',
      offlineFallback: 'retain-last-good',
      prayerProfileId: ' main-prayer-profile ',
    });

    expect(scene.sceneId).toBe('prayer-board-main');
    expect(scene.mosqueId).toBe('masjid-al-noor:sydney');
    expect(scene.title).toBe('Main prayer board');
    expect(signageSceneCanRenderOffline(scene)).toBe(true);
  });

  it('supports announcement and event scenes with stable references', () => {
    const announcement = createSignageScene({
      sceneId: 'announcement-scene',
      mosqueId: 'masjid-main',
      kind: 'announcement',
      title: 'Community announcement',
      offlineFallback: 'prayer-board',
      announcementId: 'announcement-1',
    });
    const event = createSignageScene({
      sceneId: 'event-scene',
      mosqueId: 'masjid-main',
      kind: 'event',
      title: 'Upcoming event',
      offlineFallback: 'retain-last-good',
      eventId: 'event-1',
    });

    expect(announcement.kind).toBe('announcement');
    expect(event.kind).toBe('event');
  });

  it('validates image and QR URLs as credential-free HTTP(S)', () => {
    const image = createSignageScene({
      sceneId: 'image-scene',
      mosqueId: 'masjid-main',
      kind: 'image',
      title: 'Welcome image',
      offlineFallback: 'retain-last-good',
      imageUrl: 'https://example.org/welcome.png',
      altText: ' Welcome   banner ',
    });
    const qr = createSignageScene({
      sceneId: 'qr-scene',
      mosqueId: 'masjid-main',
      kind: 'qr',
      title: 'Registration',
      offlineFallback: 'hide-scene',
      targetUrl: 'https://example.org/register',
      caption: ' Register   here ',
    });

    expect(image.kind === 'image' ? image.altText : null).toBe('Welcome banner');
    expect(qr.kind === 'qr' ? qr.caption : null).toBe('Register here');
    expect(signageSceneCanRenderOffline(qr)).toBe(false);
  });

  it('allows approved web content only from an explicit host allowlist', () => {
    const scene = createSignageScene({
      sceneId: 'web-scene',
      mosqueId: 'masjid-main',
      kind: 'web',
      title: 'Approved public page',
      offlineFallback: 'prayer-board',
      url: 'https://status.example.org/community',
      approvedHosts: ['STATUS.EXAMPLE.ORG', 'status.example.org'],
    });

    expect(scene.kind === 'web' ? scene.approvedHosts : []).toEqual(['status.example.org']);
    expect(resolveSignageOfflineFallback(scene)).toBe('prayer-board');

    expect(() =>
      createSignageScene({
        sceneId: 'blocked-web-scene',
        mosqueId: 'masjid-main',
        kind: 'web',
        title: 'Blocked page',
        offlineFallback: 'hide-scene',
        url: 'https://unapproved.example.org/',
        approvedHosts: ['example.org'],
      }),
    ).toThrow('Web scene host must be explicitly approved');
  });

  it('supports deterministic countdown scenes and rejects malformed timestamps', () => {
    const scene = createSignageScene({
      sceneId: 'ramadan-countdown',
      mosqueId: 'masjid-main',
      kind: 'countdown',
      title: 'Iftar countdown',
      offlineFallback: 'retain-last-good',
      targetAt: '2026-08-19T08:30:00.000Z',
      label: 'Time until Iftar',
    });

    expect(scene.kind === 'countdown' ? scene.targetAt : null).toBe('2026-08-19T08:30:00.000Z');

    expect(() =>
      createSignageScene({
        ...scene,
        targetAt: '2026-08-19 08:30',
      }),
    ).toThrow('Countdown target must be an ISO-8601 UTC timestamp');
  });
});
