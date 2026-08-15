export type AdhanAudioRightsBasis = 'public-domain' | 'permissive-license' | 'direct-permission';

export interface BundledAdhanAudioRights {
  readonly recordingId: string;
  readonly title: string;
  readonly rightsBasis: AdhanAudioRightsBasis;
  readonly rightsHolder: string;
  readonly evidenceReference: string;
  readonly attribution: string | null;
}

function nonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function bundledAdhanAudioHasSuitableRights(rights: BundledAdhanAudioRights): boolean {
  return (
    nonEmpty(rights.recordingId) &&
    nonEmpty(rights.title) &&
    nonEmpty(rights.rightsHolder) &&
    nonEmpty(rights.evidenceReference) &&
    (rights.attribution === null || nonEmpty(rights.attribution))
  );
}

export function assertBundledAdhanAudioRights(rights: BundledAdhanAudioRights): void {
  if (!bundledAdhanAudioHasSuitableRights(rights)) {
    throw new Error('Bundled Adhan audio requires complete rights evidence');
  }
}
