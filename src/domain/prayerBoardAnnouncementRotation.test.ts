import { describe, expect, it } from 'vitest';

import type { MosqueAnnouncement } from './mosqueAnnouncement';
import {
  buildPrayerBoardAnnouncementScheduleContext,
  createPrayerBoardAnnouncementRotationConfig,
  resolvePrayerBoardAnnouncementRotation,
} from './prayerBoardAnnouncementRotation';
import type { SourcedPrayerDashboard } from './sourcedDashboard';

function announcement(id: string, overrides: Partial<MosqueAnnouncement> = {}): MosqueAnnouncement {
  return {
    announcementId: id,
    mosqueId: 'stage-23-masjid',
    english: { title: `Notice ${id}`, body: `Body ${id}` },
    arabic: { title: `إعلان ${id}`, body: `نص ${id}` },
    imageUrl: null,
    callToActionUrl: null,
    priority: 'normal',
    pinned: false,
    surfaces: ['display'],
    startsAt: '2026-08-23T00:00:00.000Z',
    endsAt: '2026-08-24T00:00:00.000Z',
    recurrence: 'none',
    archived: false,
    ...overrides,
  };
}

function dashboard(
  options: Readonly<{ nextSeconds?: number | null; localMinutes?: number }> = {},
): SourcedPrayerDashboard {
  const localMinutes = options.localMinutes ?? 600;
  return {
    base: {
      generatedAt: new Date('2026-08-23T01:00:00.000Z'),
      coordinates: { latitude: -33.8688, longitude: 151.2093 },
      timeZone: 'Australia/Sydney',
      utcOffsetMinutes: 600,
      civilDate: new Date('2026-08-23T00:00:00.000Z'),
      clock: {
        hour: Math.floor(localMinutes / 60),
        minute: localMinutes % 60,
        second: 0,
        localMinutes,
      },
      gregorian: { calendar: 'gregory', year: 2026, month: 8, day: 23, source: 'civil-date' },
      hijri: {
        calendar: 'islamic-umalqura',
        year: 1448,
        month: 3,
        day: 10,
        correctionDays: 0,
        source: 'runtime-intl-calendar',
      },
      method: {} as SourcedPrayerDashboard['base']['method'],
      asrConvention: 'standard',
      highLatitudeRule: 'angle-based',
      today: {} as SourcedPrayerDashboard['base']['today'],
      tomorrow: {} as SourcedPrayerDashboard['base']['tomorrow'],
      prayers: [],
      nextPrayer: 'dhuhr',
      nextPrayerDayOffset: 0,
      nextPrayerLocalMinutes: 720,
      secondsUntilNextPrayer: options.nextSeconds ?? 7200,
      hasHighLatitudeFallback: false,
      hasManualAdjustments: false,
    },
    sourceMode: 'calculated',
    mosqueName: 'Stage 23 Masjid',
    prayers: [
      {
        name: 'fajr',
        localMinutes: 330,
        iqamahLocalMinutes: 350,
        isCurrent: false,
        isNext: false,
        highLatitudeRuleApplied: false,
        manualAdjustmentMinutes: 0,
        source: 'calculated',
        available: true,
      },
      {
        name: 'sunrise',
        localMinutes: 400,
        iqamahLocalMinutes: null,
        isCurrent: false,
        isNext: false,
        highLatitudeRuleApplied: false,
        manualAdjustmentMinutes: 0,
        source: 'calculated',
        available: true,
      },
      {
        name: 'dhuhr',
        localMinutes: 720,
        iqamahLocalMinutes: 735,
        isCurrent: false,
        isNext: true,
        highLatitudeRuleApplied: false,
        manualAdjustmentMinutes: 0,
        source: 'calculated',
        available: true,
      },
      {
        name: 'asr',
        localMinutes: 930,
        iqamahLocalMinutes: 945,
        isCurrent: false,
        isNext: false,
        highLatitudeRuleApplied: false,
        manualAdjustmentMinutes: 0,
        source: 'calculated',
        available: true,
      },
      {
        name: 'maghrib',
        localMinutes: 1080,
        iqamahLocalMinutes: 1085,
        isCurrent: false,
        isNext: false,
        highLatitudeRuleApplied: false,
        manualAdjustmentMinutes: 0,
        source: 'calculated',
        available: true,
      },
      {
        name: 'isha',
        localMinutes: 1170,
        iqamahLocalMinutes: 1185,
        isCurrent: false,
        isNext: false,
        highLatitudeRuleApplied: false,
        manualAdjustmentMinutes: 0,
        source: 'calculated',
        available: true,
      },
    ],
    currentPrayer: 'fajr',
    nextPrayer: 'dhuhr',
    nextPrayerDayOffset: 0,
    nextPrayerLocalMinutes: 720,
    secondsUntilNextPrayer: options.nextSeconds ?? 7200,
    hasHighLatitudeFallback: false,
    jumuahSessions: [],
  };
}

function config(enabled = true) {
  return createPrayerBoardAnnouncementRotationConfig({
    version: 1,
    enabled,
    playlist: {
      playlistId: 'prayer-board-announcements',
      mosqueId: 'stage-23-masjid',
      title: 'Prayer board announcements',
      revision: 1,
      scenes: [
        { sceneId: 'announcement:one', dwellSeconds: 10 },
        { sceneId: 'announcement:two', dwellSeconds: 10 },
      ],
    },
    rules: [
      {
        kind: 'time-window',
        ruleId: 'prayer-board-announcements-all-day',
        playlistId: 'prayer-board-announcements',
        priority: 100,
        context: 'all',
        startDate: null,
        endDate: null,
        weekdays: [],
        startsAt: '00:00',
        endsAt: '00:00',
      },
    ],
    scenes: [
      {
        sceneId: 'announcement:one',
        mosqueId: 'stage-23-masjid',
        kind: 'announcement',
        title: 'Notice one',
        offlineFallback: 'prayer-board',
        announcementId: 'one',
      },
      {
        sceneId: 'announcement:two',
        mosqueId: 'stage-23-masjid',
        kind: 'announcement',
        title: 'Notice two',
        offlineFallback: 'prayer-board',
        announcementId: 'two',
      },
    ],
  });
}

describe('prayer-board announcement rotation', () => {
  it('uses the existing signage schedule and deterministic dwell order', () => {
    const result = resolvePrayerBoardAnnouncementRotation({
      config: config(),
      announcements: [announcement('one'), announcement('two')],
      locale: 'en',
      moduleVisible: true,
      dashboard: dashboard(),
      scheduleContext: {
        localDate: '2026-08-23',
        weekday: 0,
        localClock: '10:00',
        context: 'normal',
        prayerTimes: {},
      },
      nowIso: '2026-08-23T01:00:05.000Z',
    });

    expect(result.suppressionReason).toBeNull();
    expect(result.playlistId).toBe('prayer-board-announcements');
    expect(result.announcement?.id).toMatch(/^(one|two)$/u);
  });

  it('never renders announcements when the per-display module is hidden', () => {
    const result = resolvePrayerBoardAnnouncementRotation({
      config: config(),
      announcements: [announcement('one')],
      locale: 'en',
      moduleVisible: false,
      dashboard: dashboard(),
      scheduleContext: {
        localDate: '2026-08-23',
        weekday: 0,
        localClock: '10:00',
        context: 'normal',
        prayerTimes: {},
      },
      nowIso: '2026-08-23T01:00:05.000Z',
    });

    expect(result.announcement).toBeNull();
    expect(result.suppressionReason).toBe('module-hidden');
  });

  it('gives imminent prayer state priority over announcement content', () => {
    const result = resolvePrayerBoardAnnouncementRotation({
      config: config(),
      announcements: [announcement('one')],
      locale: 'en',
      moduleVisible: true,
      dashboard: dashboard({ nextSeconds: 300 }),
      scheduleContext: {
        localDate: '2026-08-23',
        weekday: 0,
        localClock: '11:55',
        context: 'normal',
        prayerTimes: {},
      },
      nowIso: '2026-08-23T01:00:05.000Z',
    });

    expect(result.announcement).toBeNull();
    expect(result.suppressionReason).toBe('prayer-imminent');
  });

  it('suppresses announcements between Athan and configured Iqamah', () => {
    const result = resolvePrayerBoardAnnouncementRotation({
      config: config(),
      announcements: [announcement('one')],
      locale: 'en',
      moduleVisible: true,
      dashboard: dashboard({ localMinutes: 725, nextSeconds: 7200 }),
      scheduleContext: {
        localDate: '2026-08-23',
        weekday: 0,
        localClock: '12:05',
        context: 'normal',
        prayerTimes: {},
      },
      nowIso: '2026-08-23T01:00:05.000Z',
    });

    expect(result.announcement).toBeNull();
    expect(result.suppressionReason).toBe('athan-to-iqamah');
  });

  it('filters expired, archived, non-display and other-mosque announcements', () => {
    const result = resolvePrayerBoardAnnouncementRotation({
      config: config(),
      announcements: [
        announcement('expired', { endsAt: '2026-08-22T00:00:00.000Z' }),
        announcement('archived', { archived: true }),
        announcement('mobile', { surfaces: ['mobile'] }),
        announcement('foreign', { mosqueId: 'other-masjid' }),
      ],
      locale: 'en',
      moduleVisible: true,
      dashboard: dashboard(),
      scheduleContext: {
        localDate: '2026-08-23',
        weekday: 0,
        localClock: '10:00',
        context: 'normal',
        prayerTimes: {},
      },
      nowIso: '2026-08-23T01:00:05.000Z',
    });

    expect(result.announcement).toBeNull();
    expect(result.suppressionReason).toBe('no-active-announcement');
  });

  it('builds the signage evaluator context from authoritative local prayer data', () => {
    const context = buildPrayerBoardAnnouncementScheduleContext(dashboard());
    expect(context.localDate).toBe('2026-08-23');
    expect(context.localClock).toBe('10:00');
    expect(context.context).toBe('normal');
    expect(context.prayerTimes.dhuhr).toBe('12:00');
  });

  it('projects Jumuah prayer-relative scheduling from salah time, not khutbah time', () => {
    const base = dashboard();
    const context = buildPrayerBoardAnnouncementScheduleContext({
      ...base,
      jumuahSessions: [
        {
          label: 'First Jumuah',
          khutbahLocalMinutes: 765,
          salahLocalMinutes: 795,
        },
      ],
    });

    expect(context.prayerTimes.jumuah).toBe('13:15');
  });
});
