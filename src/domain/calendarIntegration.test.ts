import { describe, expect, it } from 'vitest';

import { mosqueEventsCalendar } from './calendarIntegration';
import { createMosqueEvent, type MosqueEventDraft } from './mosqueEvent';

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
    imageUrl: null,
    registrationUrl: 'https://example.org/register',
    surfaces: ['mobile', 'web'],
    ...overrides,
  };
}

function physicalLines(calendar: string): readonly string[] {
  return calendar.split('\r\n').filter((line) => line.length > 0);
}

describe('calendar integrations', () => {
  it('creates a complete RFC 5545 calendar with deterministic event metadata', () => {
    const calendar = mosqueEventsCalendar([createMosqueEvent(draft({ recurrence: 'weekly' }))], {
      calendarName: 'Masjid Al Noor Events',
      generatedAt: '2026-08-20T04:30:00.000Z',
    });

    expect(calendar.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(calendar).toContain('PRODID:-//privacyOG//SalahOS//EN\r\n');
    expect(calendar).toContain('VERSION:2.0\r\n');
    expect(calendar).toContain('CALSCALE:GREGORIAN\r\n');
    expect(calendar).toContain('METHOD:PUBLISH\r\n');
    expect(calendar).toContain(
      'UID:community-iftar-2026.masjid-al-noor:sydney@salahos\r\n',
    );
    expect(calendar).toContain('DTSTAMP:20260820T043000Z\r\n');
    expect(calendar).toContain('DTSTART:20260820T080000Z\r\n');
    expect(calendar).toContain('DTEND:20260820T100000Z\r\n');
    expect(calendar).toContain('RRULE:FREQ=WEEKLY\r\n');
    expect(calendar).toContain('URL:https://example.org/register\r\n');
    expect(calendar.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('uses exclusive DATE boundaries for all-day events', () => {
    const calendar = mosqueEventsCalendar(
      [
        createMosqueEvent(
          draft({
            eventId: 'eid-open-day',
            allDay: true,
            startsAt: '2026-08-20T00:00:00.000Z',
            endsAt: '2026-08-21T00:00:00.000Z',
          }),
        ),
      ],
      { calendarName: 'Mosque Events', generatedAt: '2026-08-01T00:00:00.000Z' },
    );

    expect(calendar).toContain('DTSTART;VALUE=DATE:20260820\r\n');
    expect(calendar).toContain('DTEND;VALUE=DATE:20260821\r\n');
    expect(calendar).not.toContain('DTSTART:20260820T000000Z');
  });

  it('escapes calendar TEXT values and folds UTF-8 content lines to 75 octets or fewer', () => {
    const calendar = mosqueEventsCalendar(
      [
        createMosqueEvent(
          draft({
            english: {
              title: 'Community, family; programme',
              description:
                'A long bilingual-friendly description for the community calendar that deliberately exceeds the RFC content-line boundary.',
            },
            venue: 'Hall A, Level 1; North wing',
          }),
        ),
      ],
      { calendarName: 'مسجد النور Community Events', generatedAt: '2026-08-01T00:00:00.000Z' },
    );

    expect(calendar).toContain('SUMMARY:Community\\, family\\; programme\r\n');
    expect(calendar).toContain('LOCATION:Hall A\\, Level 1\\; North wing\r\n');
    expect(calendar).toMatch(/DESCRIPTION:[^\r]+\r\n [^\r]+/u);
    for (const line of physicalLines(calendar)) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it('falls back to Arabic content without requiring an English translation', () => {
    const calendar = mosqueEventsCalendar(
      [
        createMosqueEvent(
          draft({
            english: null,
            arabic: {
              title: 'درس أسبوعي',
              description: 'درس علمي أسبوعي في المسجد.',
            },
          }),
        ),
      ],
      { calendarName: 'فعاليات المسجد', generatedAt: '2026-08-01T00:00:00.000Z' },
    );

    expect(calendar).toContain('SUMMARY:درس أسبوعي\r\n');
    expect(calendar).toContain('DESCRIPTION:درس علمي أسبوعي في المسجد.\r\n');
  });

  it('rejects empty calendars and invalid generated timestamps', () => {
    expect(() =>
      mosqueEventsCalendar([], {
        calendarName: 'Mosque Events',
        generatedAt: '2026-08-01T00:00:00.000Z',
      }),
    ).toThrow(/at least one/u);

    expect(() =>
      mosqueEventsCalendar([createMosqueEvent(draft())], {
        calendarName: 'Mosque Events',
        generatedAt: 'not-a-time',
      }),
    ).toThrow(/UTC timestamp/u);
  });
});
