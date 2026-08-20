const PRODID = '-//privacyOG//SalahOS//EN';
const MAX_CONTENT_LINE_OCTETS = 75;

function escapeText(value) {
  return value
    .replace(/\\/gu, '\\\\')
    .replace(/\r?\n/gu, '\\n')
    .replace(/,/gu, '\\,')
    .replace(/;/gu, '\\;');
}

function foldLine(line) {
  const segments = [];
  let current = '';
  let currentBytes = 0;
  let limit = MAX_CONTENT_LINE_OCTETS;

  for (const character of line) {
    const characterBytes = Buffer.byteLength(character, 'utf8');
    if (characterBytes > limit) {
      throw new RangeError('Calendar content contains an unsupported oversized code point');
    }
    if (currentBytes + characterBytes > limit) {
      segments.push(current);
      current = character;
      currentBytes = characterBytes;
      limit = MAX_CONTENT_LINE_OCTETS - 1;
      continue;
    }
    current += character;
    currentBytes += characterBytes;
  }
  segments.push(current);
  return segments.map((segment, index) => (index === 0 ? segment : ` ${segment}`)).join('\r\n');
}

function line(name, value) {
  return foldLine(`${name}:${value}`);
}

function timestamp(value) {
  return value.replace(/[-:]/gu, '').replace(/\.\d{3}Z$/u, 'Z');
}

function dateValue(value) {
  return value.slice(0, 10).replace(/-/gu, '');
}

function eventLines(event, generatedAt) {
  const content = event.english ?? event.arabic;
  if (content === null) throw new RangeError('Calendar event requires localized content');

  const lines = [
    'BEGIN:VEVENT',
    line('UID', escapeText(`${event.eventId}.${event.mosqueId}@salahos`)),
    line('DTSTAMP', timestamp(generatedAt)),
  ];
  if (event.allDay) {
    lines.push(
      line('DTSTART;VALUE=DATE', dateValue(event.startsAt)),
      line('DTEND;VALUE=DATE', dateValue(event.endsAt)),
    );
  } else {
    lines.push(line('DTSTART', timestamp(event.startsAt)), line('DTEND', timestamp(event.endsAt)));
  }

  lines.push(
    line('SUMMARY', escapeText(content.title)),
    line('DESCRIPTION', escapeText(content.description)),
    line('LOCATION', escapeText(event.venue)),
  );
  if (event.registrationUrl !== null) lines.push(line('URL', event.registrationUrl));
  if (event.recurrence === 'daily') lines.push('RRULE:FREQ=DAILY');
  if (event.recurrence === 'weekly') lines.push('RRULE:FREQ=WEEKLY');
  lines.push('END:VEVENT');
  return lines;
}

export function createPublicEventCalendar(mosque, generatedAt) {
  if (!Array.isArray(mosque.events) || mosque.events.length === 0) {
    return null;
  }
  const lines = [
    'BEGIN:VCALENDAR',
    line('PRODID', PRODID),
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    line('X-WR-CALNAME', escapeText(`${mosque.profile.name} Events`)),
  ];
  for (const event of mosque.events) lines.push(...eventLines(event, generatedAt));
  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}
