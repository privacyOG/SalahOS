export type SignageSceneKind =
  | 'prayer-board'
  | 'announcement'
  | 'event'
  | 'image'
  | 'web'
  | 'qr'
  | 'countdown';

export type SignageOfflineFallback = 'retain-last-good' | 'prayer-board' | 'hide-scene';

interface SignageSceneBase {
  readonly sceneId: string;
  readonly mosqueId: string;
  readonly kind: SignageSceneKind;
  readonly title: string;
  readonly offlineFallback: SignageOfflineFallback;
}

export interface PrayerBoardScene extends SignageSceneBase {
  readonly kind: 'prayer-board';
  readonly prayerProfileId: string;
}

export interface AnnouncementScene extends SignageSceneBase {
  readonly kind: 'announcement';
  readonly announcementId: string;
}

export interface EventScene extends SignageSceneBase {
  readonly kind: 'event';
  readonly eventId: string;
}

export interface ImageScene extends SignageSceneBase {
  readonly kind: 'image';
  readonly imageUrl: string;
  readonly altText: string;
}

export interface WebScene extends SignageSceneBase {
  readonly kind: 'web';
  readonly url: string;
  readonly approvedHosts: readonly string[];
}

export interface QrScene extends SignageSceneBase {
  readonly kind: 'qr';
  readonly targetUrl: string;
  readonly caption: string;
}

export interface CountdownScene extends SignageSceneBase {
  readonly kind: 'countdown';
  readonly targetAt: string;
  readonly label: string;
}

export type SignageScene =
  | PrayerBoardScene
  | AnnouncementScene
  | EventScene
  | ImageScene
  | WebScene
  | QrScene
  | CountdownScene;

function assertIdentifier(value: string, label: string): string {
  const normalized = value.trim().toLowerCase();
  if (
    normalized.length < 2 ||
    normalized.length > 160 ||
    !/^[a-z0-9][a-z0-9._:-]*[a-z0-9]$/u.test(normalized)
  ) {
    throw new RangeError(`${label} must be a stable lowercase-safe identifier`);
  }
  return normalized;
}

function normalizeText(value: string, label: string, maxLength: number): string {
  const normalized = value.replace(/\s+/gu, ' ').trim();
  if (normalized.length === 0 || normalized.length > maxLength) {
    throw new RangeError(`${label} must contain 1-${String(maxLength)} characters`);
  }
  return normalized;
}

function assertIsoTimestamp(value: string, label: string): string {
  const normalized = value.trim();
  const parsed = new Date(normalized);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== normalized) {
    throw new RangeError(`${label} must be an ISO-8601 UTC timestamp`);
  }
  return normalized;
}

function normalizeRemoteUrl(value: string, label: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new RangeError(`${label} must be a valid HTTP(S) URL`);
  }
  if (
    (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') ||
    parsed.username ||
    parsed.password
  ) {
    throw new RangeError(`${label} must be a credential-free HTTP(S) URL`);
  }
  return parsed;
}

function normalizeBase<T extends SignageSceneBase>(scene: T): T {
  return {
    ...scene,
    sceneId: assertIdentifier(scene.sceneId, 'Scene ID'),
    mosqueId: assertIdentifier(scene.mosqueId, 'Mosque ID'),
    title: normalizeText(scene.title, 'Scene title', 140),
  };
}

export function createSignageScene(scene: SignageScene): SignageScene {
  const base = normalizeBase(scene);

  switch (base.kind) {
    case 'prayer-board':
      return Object.freeze({
        ...base,
        prayerProfileId: assertIdentifier(base.prayerProfileId, 'Prayer profile ID'),
      });
    case 'announcement':
      return Object.freeze({
        ...base,
        announcementId: assertIdentifier(base.announcementId, 'Announcement ID'),
      });
    case 'event':
      return Object.freeze({ ...base, eventId: assertIdentifier(base.eventId, 'Event ID') });
    case 'image': {
      const imageUrl = normalizeRemoteUrl(base.imageUrl, 'Image URL').toString();
      return Object.freeze({
        ...base,
        imageUrl,
        altText: normalizeText(base.altText, 'Image alt text', 300),
      });
    }
    case 'web': {
      const url = normalizeRemoteUrl(base.url, 'Web scene URL');
      const approvedHosts = Object.freeze(
        [...new Set(base.approvedHosts.map((host) => host.trim().toLowerCase()))].filter(Boolean),
      );
      if (approvedHosts.length === 0 || !approvedHosts.includes(url.hostname.toLowerCase())) {
        throw new RangeError('Web scene host must be explicitly approved');
      }
      return Object.freeze({ ...base, url: url.toString(), approvedHosts });
    }
    case 'qr':
      return Object.freeze({
        ...base,
        targetUrl: normalizeRemoteUrl(base.targetUrl, 'QR target URL').toString(),
        caption: normalizeText(base.caption, 'QR caption', 300),
      });
    case 'countdown':
      return Object.freeze({
        ...base,
        targetAt: assertIsoTimestamp(base.targetAt, 'Countdown target'),
        label: normalizeText(base.label, 'Countdown label', 140),
      });
  }
}

export function signageSceneCanRenderOffline(scene: SignageScene): boolean {
  return scene.offlineFallback !== 'hide-scene';
}

export function resolveSignageOfflineFallback(scene: SignageScene): SignageOfflineFallback {
  return scene.offlineFallback;
}
