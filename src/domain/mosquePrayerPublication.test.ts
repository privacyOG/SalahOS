import { describe, expect, it } from 'vitest';
import {
  createMosquePrayerPublicationRevision,
  previewMosquePrayerPublication,
  rollbackMosquePrayerPublication,
  type MosquePrayerPublicationDraft,
} from './mosquePrayerPublication';

const baseDraft: MosquePrayerPublicationDraft = {
  mosqueId: 'masjid-al-noor:sydney',
  prayerStarts: {
    kind: 'adjusted',
    adjustments: { fajr: 2, dhuhr: 1, asr: 0, maghrib: 3, isha: 4 },
  },
  iqamah: {
    fajr: { kind: 'offset', offsetMinutes: 25 },
    dhuhr: { kind: 'fixed', localMinutes: 810 },
  },
  defaultJumuahSessions: [
    { label: 'First', khutbahLocalMinutes: 750, salahLocalMinutes: 765 },
    { label: 'Second', khutbahLocalMinutes: 810, salahLocalMinutes: 825 },
  ],
  seasonalRules: [
    {
      id: 'summer',
      startDate: '2026-12-01',
      endDate: '2027-02-28',
      iqamah: { isha: { kind: 'fixed', localMinutes: 1_290 } },
    },
  ],
  dateOverrides: [
    {
      date: '2026-12-25',
      startLocalMinutes: { dhuhr: 795 },
      iqamah: { dhuhr: { kind: 'fixed', localMinutes: 825 } },
      jumuahSessions: [{ label: 'Holiday', khutbahLocalMinutes: 780, salahLocalMinutes: 795 }],
    },
  ],
  ramadan: {
    ishaLocalMinutes: 1_230,
    taraweehLocalMinutes: 1_290,
    imsakLocalMinutes: 300,
    suhurEndsLocalMinutes: 310,
    iftarLocalMinutes: 1_080,
    taraweehLabel: 'Taraweeh',
  },
};

describe('managed mosque prayer publication', () => {
  it('normalizes a publishable configuration with overrides, Jumuah and Ramadan metadata', () => {
    const preview = previewMosquePrayerPublication(baseDraft);

    expect(preview.valid).toBe(true);
    expect(preview.publication.mosqueId).toBe('masjid-al-noor:sydney');
    expect(preview.publication.prayerStarts.kind).toBe('adjusted');
    expect(preview.publication.defaultJumuahSessions).toHaveLength(2);
    expect(preview.publication.dateOverrides[0]!.date).toBe('2026-12-25');
    expect(preview.publication.seasonalRules[0]!.id).toBe('summer');
    expect(preview.publication.ramadan?.taraweehLocalMinutes).toBe(1_290);
  });

  it('supports fully supplied prayer starts', () => {
    const preview = previewMosquePrayerPublication({
      mosqueId: 'masjid-supplied',
      prayerStarts: {
        kind: 'supplied',
        startLocalMinutes: {
          fajr: 300,
          dhuhr: 780,
          asr: 960,
          maghrib: 1_080,
          isha: 1_200,
        },
      },
    });

    expect(preview.publication.prayerStarts.kind).toBe('supplied');
  });

  it('rejects invalid adjustments, overlapping seasons and malformed Jumuah sessions', () => {
    expect(() =>
      previewMosquePrayerPublication({
        mosqueId: 'masjid-invalid-adjustment',
        prayerStarts: { kind: 'adjusted', adjustments: { fajr: 181 } },
      }),
    ).toThrow(/-180 through 180/u);

    expect(() =>
      previewMosquePrayerPublication({
        mosqueId: 'masjid-overlap',
        prayerStarts: { kind: 'calculated' },
        seasonalRules: [
          { id: 'one', startDate: '2026-01-01', endDate: '2026-03-31' },
          { id: 'two', startDate: '2026-03-15', endDate: '2026-05-01' },
        ],
      }),
    ).toThrow(/may not overlap/u);

    expect(() =>
      previewMosquePrayerPublication({
        mosqueId: 'masjid-jumuah',
        prayerStarts: { kind: 'calculated' },
        defaultJumuahSessions: [
          { label: 'First', khutbahLocalMinutes: 800, salahLocalMinutes: 790 },
        ],
      }),
    ).toThrow(/may not precede/u);
  });

  it('keeps date overrides separate from the base rule', () => {
    const preview = previewMosquePrayerPublication(baseDraft);
    expect(preview.publication.prayerStarts).toEqual({
      kind: 'adjusted',
      adjustments: { fajr: 2, dhuhr: 1, asr: 0, maghrib: 3, isha: 4 },
    });
    expect(preview.publication.dateOverrides[0]!.startLocalMinutes?.dhuhr).toBe(795);
  });

  it('creates immutable revision provenance and rollback as a new revision', () => {
    const first = createMosquePrayerPublicationRevision(baseDraft, {
      revisionId: 'rev-001',
      changedBy: 'privacyOG',
      publishedAt: '2026-08-19T00:00:00.000Z',
      changeSummary: 'Initial managed timetable publication',
    });

    const second = createMosquePrayerPublicationRevision(
      {
        ...baseDraft,
        iqamah: {
          ...baseDraft.iqamah,
          asr: { kind: 'offset', offsetMinutes: 20 },
        },
      },
      {
        revisionId: 'rev-002',
        changedBy: 'privacyOG',
        publishedAt: '2026-08-19T01:00:00.000Z',
        changeSummary: 'Adjust Asr iqamah',
      },
      first,
    );

    const rollback = rollbackMosquePrayerPublication(second, first, {
      revisionId: 'rev-003',
      changedBy: 'privacyOG',
      publishedAt: '2026-08-19T02:00:00.000Z',
      changeSummary: 'Restore prior timetable',
    });

    expect(first.sequence).toBe(1);
    expect(second.sequence).toBe(2);
    expect(second.previousRevisionId).toBe('rev-001');
    expect(rollback.sequence).toBe(3);
    expect(rollback.previousRevisionId).toBe('rev-002');
    expect(rollback.publication).toBe(first.publication);
    expect(rollback.changeSummary).toContain('rollback to rev-001');
    expect(Object.isFrozen(rollback)).toBe(true);
  });

  it('rejects cross-mosque revision chains and rollback targets', () => {
    const first = createMosquePrayerPublicationRevision(baseDraft, {
      revisionId: 'rev-a1',
      changedBy: 'privacyOG',
      publishedAt: '2026-08-19T00:00:00.000Z',
      changeSummary: 'First mosque',
    });
    const other = createMosquePrayerPublicationRevision(
      { mosqueId: 'other-mosque', prayerStarts: { kind: 'calculated' } },
      {
        revisionId: 'rev-b1',
        changedBy: 'privacyOG',
        publishedAt: '2026-08-19T00:00:00.000Z',
        changeSummary: 'Other mosque',
      },
    );

    expect(() =>
      createMosquePrayerPublicationRevision(
        { mosqueId: 'other-mosque', prayerStarts: { kind: 'calculated' } },
        {
          revisionId: 'rev-b2',
          changedBy: 'privacyOG',
          publishedAt: '2026-08-19T01:00:00.000Z',
          changeSummary: 'Invalid chain',
        },
        first,
      ),
    ).toThrow(/same mosque/u);

    expect(() =>
      rollbackMosquePrayerPublication(first, other, {
        revisionId: 'rev-a2',
        changedBy: 'privacyOG',
        publishedAt: '2026-08-19T01:00:00.000Z',
        changeSummary: 'Invalid rollback',
      }),
    ).toThrow(/another mosque/u);
  });
});
