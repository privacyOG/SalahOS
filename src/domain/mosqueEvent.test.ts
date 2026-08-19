import { describe, expect, it } from 'vitest';

import {
  createMosqueEvent,
  mosqueEventCalendarEntry,
  upcomingMosqueEvents,
  type MosqueEventDraft,
} from './mosqueEvent';

function draft(overrides: Partial<MosqueEventDraft> = {}): MosqueEventDraft {
  return {
    eventId: 'community-iftar-2026',
    mosqueId: 'masjid-al-noor:sydney',
    english: {
      title: 'Community Iftar',
      description: 'Join the community for iftar after Maghrib.',
    },
    arabic: {
      title: 'إفطار جماعي',
      description: 'انضموا إلى إفطار المسجد بعد المغرب.',
    },
    venue: 'Main prayer hall',
    allDay: false,
    startsAt: '2026-08-20T08:00:00.000Z',
    endsAt: '2026-08-20T10:00:00.000Z',
    recurrence: 'none',
    imageUrl: 'https://example.org/event.jpg',
    registrationUrl: 'https://example.org/register',
    surfaces: ['display', 'mobile', 'web', 'mobile'],
    ...overrides,
  };
}

describe('mosque events', () => {
  it('normalizes bilingual event data and deterministic surfaces', () => {
    const event = createMosqueEvent(draft());

    expect(event.eventId).toBe('community-iftar-2026');
    expect(event.mosqueId).toBe('masjid-al-noor:sydney');
    expect(event.surfaces).toEqual(['mobile', 'web', 'display']);
    expect(event.english?.title).toBe('Community Iftar');
    expect(event.arabic?.title).toBe('إفطار جماعي');
  });

  it('supports a single supplied language without forcing translation', () => {
    const event = createMosqueEvent(draft({ arabic: null }));
    expect(event.english?.title).toBe('Community Iftar');
    expect(event.arabic).toBeNull();
  });

  it('validates timed and all-day event boundaries', () => {
    expect(() =>
      createMosqueEvent(
        draft({ endsAt: '2026-08-20T07:00:00.000Z' }),
      ),
    ).toThrow(/later than start/u);

    expect(() =>
      createMosqueEvent(
        draft({
          allDay: true,
          startsAt: '2026-08-20T08:00:00.000Z',
          endsAt: '2026-08-21T00:00:00.000Z',
        }),
      ),
    ).toThrow(/UTC-midnight/u);

    const allDay = createMosqueEvent(
      draft({
        allDay: true,
        startsAt: '2026-08-20T00:00:00.000Z',
        endsAt: '2026-08-21T00:00:00.000Z',
      }),
    );
    expect(allDay.allDay).toBe(true);
  });

  it('rejects credentialed or non-http external links', () => {
    expect(() =>
      createMosqueEvent(draft({ registrationUrl: 'ftp://example.org/register' })),
    ).toThrow(/HTTP\(S\)/u);
    expect(() =>
      createMosqueEvent(draft({ imageUrl: 'https://user:pass@example.org/event.jpg' })),
    ).toThrow(/credential-free/u);
  });

  it('returns only upcoming events in chronological order', () => {
    const later = createMosqueEvent(
      draft({
        eventId: 'later-event',
        startsAt: '2026-08-21T08:00:00.000Z',
        endsAt: '2026-08-21T09:00:00.000Z',
      }),
    );
    const sooner = createMosqueEvent(draft({ eventId: 'sooner-event' }));
    const ended = createMosqueEvent(
      draft({
        eventId: 'ended-event',
        startsAt: '2026-08-18T08:00:00.000Z',
        endsAt: '2026-08-18T09:00:00.000Z',
      }),
    );

    expect(
      upcomingMosqueEvents([later, ended, sooner], '2026-08-19T00:00:00.000Z').map(
        (event) => event.eventId,
      ),
    ).toEqual(['sooner-event', 'later-event']);
  });

  it('generates calendar-compatible VEVENT output with recurrence and registration URL', () => {
    const event = createMosqueEvent(draft({ recurrence: 'weekly' }));
    const calendar = mosqueEventCalendarEntry(event);

    expect(calendar).toContain('BEGIN:VEVENT\r\n');
    expect(calendar).toContain('UID:community-iftar-2026@salahos\r\n');
    expect(calendar).toContain('DTSTART:20260820T080000Z\r\n');
    expect(calendar).toContain('DTEND:20260820T100000Z\r\n');
    expect(calendar).toContain('RRULE:FREQ=WEEKLY\r\n');
    expect(calendar).toContain('URL:https://example.org/register\r\n');
    expect(calendar).toContain('END:VEVENT\r\n');
  });
});
