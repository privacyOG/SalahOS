import { describe, expect, it } from 'vitest';

import { createPublicEventCalendar } from './calendar.mjs';

function mosque(overrides = {}) {
  return {
    profile: { mosqueId: 'masjid.one', name: 'Masjid One', timezone: 'Australia/Sydney' },
    events: [
      {
        eventId: 'community-iftar',
        mosqueId: 'masjid.one',
        english: {
          title: 'Community Iftar',
          description:
            'A long community description that is intentionally extended to exercise standards-compliant UTF-8 iCalendar line folding.',
        },
        arabic: null,
        venue: 'Main Hall, Level 1',
        allDay: false,
        startsAt: '2026-08-20T08:00:00.000Z',
        endsAt: '2026-08-20T10:00:00.000Z',
        recurrence: 'weekly',
        registrationUrl: 'https://example.org/register',
      },
    ],
    ...overrides,
  };
}

describe('local API iCalendar encoding', () => {
  it('creates a complete publishable mosque event calendar', () => {
    const calendar = createPublicEventCalendar(mosque(), '2026-08-20T04:30:00.000Z');

    expect(calendar).not.toBeNull();
    expect(calendar).toContain('BEGIN:VCALENDAR\r\n');
    expect(calendar).toContain('PRODID:-//privacyOG//SalahOS//EN\r\n');
    expect(calendar).toContain('VERSION:2.0\r\n');
    expect(calendar).toContain('METHOD:PUBLISH\r\n');
    expect(calendar).toContain('UID:community-iftar.masjid.one@salahos\r\n');
    expect(calendar).toContain('DTSTAMP:20260820T043000Z\r\n');
    expect(calendar).toContain('DTSTART:20260820T080000Z\r\n');
    expect(calendar).toContain('DTEND:20260820T100000Z\r\n');
    expect(calendar).toContain('RRULE:FREQ=WEEKLY\r\n');
    expect(calendar).toContain('LOCATION:Main Hall\\, Level 1\r\n');
    expect(calendar).toContain('URL:https://example.org/register\r\n');
    expect(calendar).toMatch(/DESCRIPTION:[^\r]+\r\n [^\r]+/u);
    expect(calendar).toMatch(/END:VCALENDAR\r\n$/u);

    for (const line of calendar.split('\r\n').filter(Boolean)) {
      expect(Buffer.byteLength(line, 'utf8')).toBeLessThanOrEqual(75);
    }
  });

  it('uses DATE values for all-day events and Arabic fallback content', () => {
    const value = mosque();
    value.events = [
      {
        eventId: 'eid-open-day',
        mosqueId: 'masjid.one',
        english: null,
        arabic: { title: 'يوم العيد', description: 'فعالية عامة في المسجد.' },
        venue: 'Main Hall',
        allDay: true,
        startsAt: '2026-08-20T00:00:00.000Z',
        endsAt: '2026-08-21T00:00:00.000Z',
        recurrence: 'none',
        registrationUrl: null,
      },
    ];

    const calendar = createPublicEventCalendar(value, '2026-08-01T00:00:00.000Z');
    expect(calendar).toContain('DTSTART;VALUE=DATE:20260820\r\n');
    expect(calendar).toContain('DTEND;VALUE=DATE:20260821\r\n');
    expect(calendar).toContain('SUMMARY:يوم العيد\r\n');
  });

  it('returns no feed when the mosque has no published calendar events', () => {
    expect(
      createPublicEventCalendar(mosque({ events: [] }), '2026-08-01T00:00:00.000Z'),
    ).toBeNull();
  });
});
