import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const screen = readFileSync(new URL('./PrayerCalendarScreen.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../prayer-calendar.css', import.meta.url), 'utf8');

describe('V1.6.0 mobile prayer calendar', () => {
  it('provides a card agenda with an optional full timetable on mobile', () => {
    expect(screen).toContain('data-calendar-agenda');
    expect(screen).toContain('data-calendar-day-card');
    expect(screen).toContain('data-calendar-full-timetable');
    expect(screen).toContain('<summary>{labels.fullTimetable}</summary>');
    expect(css).toContain('.prayer-calendar__agenda');
    expect(css).toContain('.prayer-calendar__mobile-timetable');
    expect(css).toContain('.prayer-calendar__desktop-timetable');
    expect(css).toContain('@media (max-width: 700px)');
  });

  it('keeps calendar controls and prayer labels localized for every supported locale', () => {
    for (const marker of [
      "title: 'Prayer Calendar'",
      "title: 'تقويم الصلاة'",
      "title: 'Namaz Takvimi'",
      "title: 'Kalender Salat'",
      "fullTimetable: 'الجدول الكامل'",
      "fullTimetable: 'Tam vakit çizelgesi'",
      "fullTimetable: 'Jadwal lengkap'",
    ]) {
      expect(screen).toContain(marker);
    }
    expect(screen).toContain('localeTag(locale)');
  });

  it('retains semantic focus and touch-target treatment', () => {
    expect(css).toContain('min-height: 44px');
    expect(css).toContain('.prayer-calendar summary:focus-visible');
    expect(css).toContain('outline: 3px solid var(--salah-focus-ring)');
  });
});
