import { describe, expect, it } from 'vitest';
import { createAdminDashboardStatus } from './adminDashboard';

describe('managed mosque admin dashboard', () => {
  it('summarizes published prayer state, upcoming work and display health', () => {
    const dashboard = createAdminDashboardStatus({
      now: '2026-08-19T02:00:00.000Z',
      prayerPublication: {
        publishedRevisionId: 'rev-010',
        draftRevisionId: null,
        publishedAt: '2026-08-19T01:00:00.000Z',
      },
      scheduledItems: [
        {
          id: 'event-002',
          kind: 'event',
          title: 'Community dinner',
          startsAt: '2026-08-20T09:00:00.000Z',
        },
        {
          id: 'announcement-001',
          kind: 'announcement',
          title: 'Parking notice',
          startsAt: '2026-08-19T03:00:00.000Z',
        },
        {
          id: 'event-old',
          kind: 'event',
          title: 'Past event',
          startsAt: '2026-08-18T03:00:00.000Z',
        },
      ],
      displays: [
        { displayId: 'foyer-tv', state: 'online', lastSeenAt: '2026-08-19T01:59:00.000Z' },
        { displayId: 'hall-tv', state: 'stale', lastSeenAt: '2026-08-19T00:00:00.000Z' },
      ],
      errors: [],
    });

    expect(dashboard.health).toBe('attention');
    expect(dashboard.prayerPublication.state).toBe('published');
    expect(dashboard.upcomingItems.map((item) => item.id)).toEqual([
      'announcement-001',
      'event-002',
    ]);
    expect(dashboard.displayCounts).toEqual({ online: 1, stale: 1, offline: 0 });
    expect(Object.isFrozen(dashboard)).toBe(true);
  });

  it('marks a different draft revision as pending', () => {
    const dashboard = createAdminDashboardStatus({
      now: '2026-08-19T02:00:00.000Z',
      prayerPublication: {
        publishedRevisionId: 'rev-010',
        draftRevisionId: 'rev-011',
        publishedAt: '2026-08-19T01:00:00.000Z',
      },
      scheduledItems: [],
      displays: [],
      errors: [],
    });

    expect(dashboard.prayerPublication.state).toBe('draft-pending');
    expect(dashboard.health).toBe('attention');
  });

  it('surfaces operational errors ahead of normal attention states', () => {
    const dashboard = createAdminDashboardStatus({
      now: '2026-08-19T02:00:00.000Z',
      prayerPublication: {
        publishedRevisionId: 'rev-010',
        draftRevisionId: null,
        publishedAt: '2026-08-19T01:00:00.000Z',
      },
      scheduledItems: [],
      displays: [{ displayId: 'foyer-tv', state: 'online', lastSeenAt: null }],
      errors: [
        {
          source: 'media',
          code: 'image-processing-failed',
          message: 'Image processing failed',
          occurredAt: '2026-08-19T01:10:00.000Z',
        },
        {
          source: 'sync',
          code: 'publication-sync-failed',
          message: 'Publication synchronization failed',
          occurredAt: '2026-08-19T01:30:00.000Z',
        },
      ],
    });

    expect(dashboard.health).toBe('error');
    expect(dashboard.errors.map((error) => error.code)).toEqual([
      'publication-sync-failed',
      'image-processing-failed',
    ]);
  });

  it('reports healthy when published state is current and displays are online', () => {
    const dashboard = createAdminDashboardStatus({
      now: '2026-08-19T02:00:00.000Z',
      prayerPublication: {
        publishedRevisionId: 'rev-010',
        draftRevisionId: 'rev-010',
        publishedAt: '2026-08-19T01:00:00.000Z',
      },
      scheduledItems: [],
      displays: [{ displayId: 'foyer-tv', state: 'online', lastSeenAt: null }],
      errors: [],
    });

    expect(dashboard.health).toBe('healthy');
  });

  it('rejects invalid timestamp relationships', () => {
    expect(() =>
      createAdminDashboardStatus({
        now: '2026-08-19T02:00:00.000Z',
        prayerPublication: {
          publishedRevisionId: null,
          draftRevisionId: null,
          publishedAt: '2026-08-19T01:00:00.000Z',
        },
        scheduledItems: [],
        displays: [],
        errors: [],
      }),
    ).toThrow(/requires a published prayer revision/u);
  });
});
