import { describe, expect, it } from 'vitest';

import manifest from '../data/quran-offline-manifest.json';

describe('V1.6 Uthmani Qur’an provenance', () => {
  it('pins the canonical Arabic source, script, edition and reading', () => {
    expect(manifest.arabicSource.repository).toBe('mjmirza/quran-dataset');
    expect(manifest.arabicSource.commit).toBe('c0dc86b060b854d03f62848692bf1d2936dba630');
    expect(manifest.arabicSource.path).toBe('data/quran.json');
    expect(manifest.arabicSource.script).toBe('Uthmani');
    expect(manifest.arabicSource.edition).toBe('Medina Mushaf');
    expect(manifest.arabicSource.reading).toBe('Hafs');
    expect(manifest.arabicSource.upstreamTextSource).toContain('Tanzil');
    expect(manifest.arabicSource.upstreamTextSource).toContain('King Fahd Complex');
  });

  it('keeps complete-corpus and hash traceability in the manifest', () => {
    expect(manifest.surahs).toBe(114);
    expect(manifest.ayahs).toBe(6236);
    expect(manifest.sha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(manifest.arabicSource.license).toContain('CC BY 4.0');
    expect(manifest.arabicSource.upstreamSourceUrl).toContain('quranType=uthmani');
  });
});
