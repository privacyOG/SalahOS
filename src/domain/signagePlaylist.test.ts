import { describe, expect, it } from 'vitest';

import {
  createDisplayPlaylistCache,
  createSignagePlaylist,
  createSignageScheduleRule,
  resolveSignageSchedule,
  type SignageScheduleEvaluationContext,
} from './signagePlaylist';

const context: SignageScheduleEvaluationContext = {
  localDate: '2026-08-21',
  weekday: 5,
  localClock: '12:45',
  context: 'jumuah',
  prayerTimes: { jumuah: '13:00', dhuhr: '12:30' },
};

describe('managed signage playlists and schedules', () => {
  it('creates ordered playlists with bounded dwell durations', () => {
    const playlist = createSignagePlaylist({
      playlistId: ' Friday-Main ',
      mosqueId: ' Masjid-Main ',
      title: ' Friday   programme ',
      revision: 3,
      scenes: [
        { sceneId: 'prayer-board', dwellSeconds: 30 },
        { sceneId: 'khutbah-reminder', dwellSeconds: 15 },
      ],
    });

    expect(playlist.playlistId).toBe('friday-main');
    expect(playlist.title).toBe('Friday programme');
    expect(playlist.scenes.map((scene) => scene.sceneId)).toEqual([
      'prayer-board',
      'khutbah-reminder',
    ]);
    expect(() =>
      createSignagePlaylist({ ...playlist, scenes: [{ sceneId: 'too-short', dwellSeconds: 4 }] }),
    ).toThrow('Scene dwell seconds');
  });

  it('matches weekday and local time windows including overnight windows', () => {
    const daytime = createSignageScheduleRule({
      ruleId: 'friday-lunch',
      playlistId: 'friday-main',
      kind: 'time-window',
      priority: 20,
      context: 'all',
      startDate: null,
      endDate: null,
      weekdays: [5],
      startsAt: '12:00',
      endsAt: '14:00',
    });
    const overnight = createSignageScheduleRule({
      ruleId: 'overnight',
      playlistId: 'night-main',
      kind: 'time-window',
      priority: 10,
      context: 'all',
      startDate: null,
      endDate: null,
      weekdays: [],
      startsAt: '22:00',
      endsAt: '06:00',
    });

    expect(resolveSignageSchedule([daytime], context).winner?.ruleId).toBe('friday-lunch');
    expect(
      resolveSignageSchedule([overnight], { ...context, localClock: '23:30' }).winner?.ruleId,
    ).toBe('overnight');
  });

  it('supports prayer-relative reminders before Iqamah', () => {
    const rule = createSignageScheduleRule({
      ruleId: 'before-jumuah',
      playlistId: 'jumuah-reminder',
      kind: 'prayer-relative',
      priority: 50,
      context: 'jumuah',
      prayer: 'jumuah',
      offsetMinutes: -30,
      durationMinutes: 30,
    });

    expect(resolveSignageSchedule([rule], context).winner?.playlistId).toBe('jumuah-reminder');
    expect(
      resolveSignageSchedule([rule], { ...context, localClock: '12:20' }).winner,
    ).toBeNull();
  });

  it('resolves conflicts deterministically for Jumuah and Ramadan overrides', () => {
    const base = createSignageScheduleRule({
      ruleId: 'base-all-day',
      playlistId: 'daily',
      kind: 'time-window',
      priority: 10,
      context: 'all',
      startDate: null,
      endDate: null,
      weekdays: [],
      startsAt: '00:00',
      endsAt: '00:00',
    });
    const jumuah = createSignageScheduleRule({
      ruleId: 'jumuah-override',
      playlistId: 'friday-main',
      kind: 'time-window',
      priority: 10,
      context: 'jumuah',
      startDate: null,
      endDate: null,
      weekdays: [5],
      startsAt: '00:00',
      endsAt: '00:00',
    });
    const prayerRelative = createSignageScheduleRule({
      ruleId: 'jumuah-prayer-relative',
      playlistId: 'jumuah-reminder',
      kind: 'prayer-relative',
      priority: 10,
      context: 'jumuah',
      prayer: 'jumuah',
      offsetMinutes: -30,
      durationMinutes: 30,
    });

    const resolution = resolveSignageSchedule([base, jumuah, prayerRelative], context);
    expect(resolution.winner?.ruleId).toBe('jumuah-prayer-relative');
    expect(resolution.matchingRuleIds).toEqual([
      'jumuah-prayer-relative',
      'jumuah-override',
      'base-all-day',
    ]);
    expect(resolution.decisionBasis).toContain('Highest priority wins');
  });

  it('honours date ranges and rejects reversed ranges', () => {
    const ramadan = createSignageScheduleRule({
      ruleId: 'ramadan-evening',
      playlistId: 'ramadan-main',
      kind: 'time-window',
      priority: 100,
      context: 'ramadan',
      startDate: '2026-02-18',
      endDate: '2026-03-19',
      weekdays: [],
      startsAt: '17:00',
      endsAt: '23:59',
    });

    expect(
      resolveSignageSchedule([ramadan], {
        ...context,
        localDate: '2026-03-01',
        localClock: '19:00',
        context: 'ramadan',
      }).winner?.playlistId,
    ).toBe('ramadan-main');

    expect(() =>
      createSignageScheduleRule({
        ruleId: 'invalid-ramadan-range',
        playlistId: 'ramadan-main',
        kind: 'time-window',
        priority: 100,
        context: 'ramadan',
        startDate: '2026-03-20',
        endDate: '2026-03-19',
        weekdays: [],
        startsAt: '17:00',
        endsAt: '23:59',
      }),
    ).toThrow('Schedule end date cannot precede start date');
  });

  it('creates immutable active and next playlist cache metadata', () => {
    const cache = createDisplayPlaylistCache({
      activePlaylistId: 'friday-main',
      nextPlaylistId: 'evening-main',
      cachedAt: '2026-08-19T08:45:00.000Z',
      revision: 7,
    });

    expect(cache.activePlaylistId).toBe('friday-main');
    expect(cache.nextPlaylistId).toBe('evening-main');
    expect(Object.isFrozen(cache)).toBe(true);
  });
});
