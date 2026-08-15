import { describe, expect, it } from 'vitest';
import {
  assertBundledAdhanAudioRights,
  bundledAdhanAudioHasSuitableRights,
  type BundledAdhanAudioRights,
} from './adhanAudioRights';

const verified: BundledAdhanAudioRights = {
  recordingId: 'adhan-example',
  title: 'Example Adhan recording',
  rightsBasis: 'direct-permission',
  rightsHolder: 'Recording rights holder',
  evidenceReference: 'docs/rights/adhan-example.txt',
  attribution: 'Used with permission',
};

describe('Adhan audio rights policy', () => {
  it('accepts a bundled recording only when complete rights evidence is present', () => {
    expect(bundledAdhanAudioHasSuitableRights(verified)).toBe(true);
    expect(() => assertBundledAdhanAudioRights(verified)).not.toThrow();
  });

  it('allows no attribution only when the rights record is otherwise complete', () => {
    expect(bundledAdhanAudioHasSuitableRights({ ...verified, attribution: null })).toBe(true);
  });

  it.each([
    ['recording id', { ...verified, recordingId: ' ' }],
    ['title', { ...verified, title: '' }],
    ['rights holder', { ...verified, rightsHolder: '' }],
    ['evidence reference', { ...verified, evidenceReference: '' }],
    ['blank attribution', { ...verified, attribution: ' ' }],
  ])('rejects bundled audio with missing %s', (_label, candidate) => {
    expect(bundledAdhanAudioHasSuitableRights(candidate)).toBe(false);
    expect(() => assertBundledAdhanAudioRights(candidate)).toThrow(
      'Bundled Adhan audio requires complete rights evidence',
    );
  });
});
