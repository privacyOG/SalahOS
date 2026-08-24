import {
  NOTIFICATION_PRAYERS,
  type NotificationPrayerName,
} from './notificationPreferences';

export const PACKAGED_ADHAN_AUDIO_IDS = ['beautiful-adhan', 'fajr-malmo'] as const;
export type PackagedAdhanAudioId = (typeof PACKAGED_ADHAN_AUDIO_IDS)[number];
export type AdhanAudioSourceId = PackagedAdhanAudioId | 'local-upload';
export type AdhanAudioPrayerSelection = AdhanAudioSourceId | 'default';

export interface PackagedAdhanRecording {
  readonly id: PackagedAdhanAudioId;
  readonly title: string;
  readonly fileName: string;
  readonly url: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly durationSeconds: number;
  readonly codec: 'mp3';
  readonly sampleRateHz: 44100;
  readonly channels: 1;
  readonly bitRate: 96000;
  readonly license: 'CC0-1.0' | 'CC-BY-3.0';
  readonly author: string;
  readonly sourceLabel: string;
  readonly sourceUrl: string;
  readonly upstreamRepository: string;
  readonly upstreamCommit: string;
  readonly upstreamPath: string;
}

const UPSTREAM_COMMIT = 'f4a0bd42b475a0a7a452a6e662a1cd9566e9f5de';

export const packagedAdhanRecordings = Object.freeze([
  {
    id: 'beautiful-adhan',
    title: 'Beautiful Adhan',
    fileName: 'beautiful-adhan.mp3',
    url: '/audio/adhan/beautiful-adhan.mp3',
    bytes: 1_848_972,
    sha256: '1ab728372deb9a9fa25ac7b0bacba4e4c6f224230e0299875a9da47d03d5ce70',
    durationSeconds: 154.044,
    codec: 'mp3',
    sampleRateHz: 44100,
    channels: 1,
    bitRate: 96000,
    license: 'CC0-1.0',
    author: 'Adam-synagda',
    sourceLabel: 'Wikimedia Commons — Beautiful adhan',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Beautiful_adhan.ogg',
    upstreamRepository: 'wali1984/Darul-Irfan',
    upstreamCommit: UPSTREAM_COMMIT,
    upstreamPath: 'DarulIrfanApp/Resources/Audio/azan-full.mp3',
  },
  {
    id: 'fajr-malmo',
    title: 'Fajr Adhan — Malmö Mosque',
    fileName: 'fajr-malmo.mp3',
    url: '/audio/adhan/fajr-malmo.mp3',
    bytes: 2_971_551,
    sha256: '5de2d9efae530fb55424e5ec244d812784f9b8d6f259f8315534478c9b2813b4',
    durationSeconds: 247.589,
    codec: 'mp3',
    sampleRateHz: 44100,
    channels: 1,
    bitRate: 96000,
    license: 'CC-BY-3.0',
    author: 'Islamic Center Malmö',
    sourceLabel: 'Wikimedia Commons — Eid al-Fitr Fajr azan at Malmö Mosque',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/File:Eid_al-Fitr_Fajr_azan_at_Malm%C3%B6_Mosque_-_19_August_2012.webm',
    upstreamRepository: 'wali1984/Darul-Irfan',
    upstreamCommit: UPSTREAM_COMMIT,
    upstreamPath: 'DarulIrfanApp/Resources/Audio/azan-fajr-full.mp3',
  },
] as const satisfies readonly PackagedAdhanRecording[]);

export interface AdhanAudioPreferences {
  readonly version: 1;
  readonly defaultSourceId: AdhanAudioSourceId;
  readonly prayerSelections: Readonly<
    Record<NotificationPrayerName, AdhanAudioPrayerSelection>
  >;
  readonly volumePercent: number;
  readonly notificationOnly: boolean;
}

const defaultPrayerSelections = Object.freeze({
  fajr: 'default',
  dhuhr: 'default',
  asr: 'default',
  maghrib: 'default',
  isha: 'default',
} as const satisfies Record<NotificationPrayerName, AdhanAudioPrayerSelection>);

export const defaultAdhanAudioPreferences: AdhanAudioPreferences = Object.freeze({
  version: 1,
  defaultSourceId: 'beautiful-adhan',
  prayerSelections: defaultPrayerSelections,
  volumePercent: 85,
  notificationOnly: false,
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isAdhanAudioSourceId(value: unknown): value is AdhanAudioSourceId {
  return (
    value === 'beautiful-adhan' || value === 'fajr-malmo' || value === 'local-upload'
  );
}

export function isAdhanAudioPrayerSelection(
  value: unknown,
): value is AdhanAudioPrayerSelection {
  return value === 'default' || isAdhanAudioSourceId(value);
}

function parseVolumePercent(value: unknown): number {
  if (!Number.isInteger(value) || Number(value) < 0 || Number(value) > 100) {
    return defaultAdhanAudioPreferences.volumePercent;
  }
  return Number(value);
}

export function parseAdhanAudioPreferences(value: unknown): AdhanAudioPreferences {
  if (!isRecord(value) || value.version !== 1) {
    return defaultAdhanAudioPreferences;
  }

  const prayerSelectionsValue = isRecord(value.prayerSelections)
    ? value.prayerSelections
    : {};
  const prayerSelections: Record<NotificationPrayerName, AdhanAudioPrayerSelection> = {
    ...defaultPrayerSelections,
  };
  for (const prayer of NOTIFICATION_PRAYERS) {
    const selection = prayerSelectionsValue[prayer];
    prayerSelections[prayer] = isAdhanAudioPrayerSelection(selection)
      ? selection
      : 'default';
  }

  return {
    version: 1,
    defaultSourceId: isAdhanAudioSourceId(value.defaultSourceId)
      ? value.defaultSourceId
      : defaultAdhanAudioPreferences.defaultSourceId,
    prayerSelections,
    volumePercent: parseVolumePercent(value.volumePercent),
    notificationOnly: value.notificationOnly === true,
  };
}

export function resolveAdhanAudioSourceForPrayer(
  preferences: AdhanAudioPreferences,
  prayer: NotificationPrayerName,
  localUploadAvailable: boolean,
): AdhanAudioSourceId {
  const prayerSelection = preferences.prayerSelections[prayer];
  const configuredSource =
    prayerSelection === 'default' ? preferences.defaultSourceId : prayerSelection;

  if (configuredSource === 'local-upload' && !localUploadAvailable) {
    return 'beautiful-adhan';
  }
  return configuredSource;
}
