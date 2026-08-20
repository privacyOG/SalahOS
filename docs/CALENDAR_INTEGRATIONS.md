# Calendar integrations

SalahOS provides standards-based iCalendar (`.ics`) exports for public mosque events. The implementation targets RFC 5545 interoperability with Apple Calendar, Google Calendar, Outlook and other clients that can import or subscribe to iCalendar feeds.

## Domain export

`src/domain/calendarIntegration.ts` converts validated `MosqueEvent` records into a complete `VCALENDAR` object. The export includes:

- `PRODID:-//privacyOG//SalahOS//EN`;
- `VERSION:2.0`;
- `CALSCALE:GREGORIAN`;
- `METHOD:PUBLISH`;
- a calendar display name through `X-WR-CALNAME`;
- one `VEVENT` for every supplied mosque event;
- deterministic event UIDs derived from the stable event and mosque IDs;
- an explicit `DTSTAMP` supplied by the caller as the publication/generation timestamp;
- UTC `DTSTART` / `DTEND` for timed events;
- exclusive `DTSTART;VALUE=DATE` / `DTEND;VALUE=DATE` boundaries for all-day events;
- daily or weekly `RRULE` where the existing mosque-event model requests recurrence;
- escaped summary, description and venue text; and
- the validated registration URL where present.

The full calendar export is the preferred interoperability surface. The older `mosqueEventCalendarEntry()` helper remains a component-level compatibility helper for code that explicitly needs one `VEVENT` fragment.

## RFC 5545 formatting

Generated calendars use CRLF content-line separators. Long content lines are folded so each physical UTF-8 line is at most 75 octets, with continuation lines beginning with a single space. Folding is performed by Unicode code point so a UTF-8 multi-byte sequence is never divided in the middle.

Calendar TEXT values escape backslashes, line breaks, commas and semicolons before folding. Timed event timestamps are emitted in UTC with the `Z` designator. All-day events use DATE values rather than pretending that local all-day events are zero-hour timed appointments.

## Local API subscription feed

The optional local-network API exposes a read-only calendar feed when the selected mosque has one or more explicitly published `events` in its public snapshot:

```text
GET /api/v1/mosques/:mosqueId/calendar.ics
```

The response uses:

```text
Content-Type: text/calendar; charset=utf-8
Content-Disposition: inline; filename="<mosqueId>-events.ics"
```

The feed inherits the local API's loopback-by-default binding, explicit LAN opt-in, TCP-peer rate limiting, hardened response headers and last-known-good snapshot behavior. It does not expose managed-administration data or accept mutation methods.

The local snapshot must supply `generatedAt` whenever it publishes calendar events. That stable UTC timestamp becomes `DTSTAMP` for the generated feed, so repeated requests for an unchanged snapshot produce deterministic output.

## Public event snapshot shape

Each mosque may add an `events` array next to `profile`, `dailyPrayers` and `monthlyTimetables`. An event contains:

```json
{
  "eventId": "community-iftar-2026",
  "mosqueId": "masjid.one",
  "english": {
    "title": "Community Iftar",
    "description": "Join the community after Maghrib."
  },
  "arabic": null,
  "venue": "Main prayer hall",
  "allDay": false,
  "startsAt": "2026-08-20T08:00:00.000Z",
  "endsAt": "2026-08-20T10:00:00.000Z",
  "recurrence": "none",
  "registrationUrl": "https://example.org/register"
}
```

At least one of `english` or `arabic` must be present. Event IDs use the same stable lowercase-safe identifier policy as other managed/public entities. Timed boundaries must be exact ISO-8601 UTC timestamps, the end must be later than the start, and all-day events must use UTC-midnight boundaries. Recurrence is `none`, `daily` or `weekly`. Registration URLs are optional and must be credential-free HTTP(S) URLs.

Public event records pass through the local API's recursive privileged-field rejection before they can be published.

## Client use

For one-time import, download/open the `.ics` URL with the target calendar application. For clients that support subscribed calendars, configure the same HTTP(S) feed URL as the subscription source. If the feed crosses an untrusted network boundary, terminate HTTPS at a reverse proxy or private-network ingress rather than exposing the local API's plain HTTP listener directly.

Some calendar providers fetch subscribed URLs from their own cloud infrastructure. A loopback or private-LAN URL is intentionally unreachable from those providers. In that case, use a controlled HTTPS publishing endpoint or import the file manually; do not make the local API public solely to satisfy a cloud calendar crawler.

## Validation

Automated coverage verifies complete calendar framing, deterministic metadata, timed and all-day semantics, recurrence, URL inclusion, Arabic fallback, RFC TEXT escaping, UTF-8 75-octet folding, empty-feed handling and the local API calendar transport. The permanent repository gates continue to own formatting, lint, strict type checking, tests, web build, Android build, visual regression and iOS build acceptance.
