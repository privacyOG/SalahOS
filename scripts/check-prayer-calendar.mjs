import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const domain = read('src/domain/prayerCalendar.ts');
const calendar = read('src/domain/calendar.ts');
const screen = read('src/ui/PrayerCalendarScreen.tsx');
const route = read('src/ui/applicationRoute.ts');
const main = read('src/main.tsx');
const tests = read('src/domain/prayerCalendar.test.ts');

for (const name of [
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Akhir',
  'Jumada al-Ula',
  'Jumada al-Akhirah',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  "Dhu al-Qi'dah",
  'Dhu al-Hijjah',
]) {
  if (!calendar.includes(name)) throw new Error(`Hijri month missing: ${name}`);
}

for (const view of ['daily', 'weekly', 'monthly', 'yearly']) {
  if (!screen.includes(view)) throw new Error(`Calendar view missing: ${view}`);
}

if (!route.includes("'calendar'") || !main.includes('PrayerCalendarScreen')) {
  throw new Error('Calendar route is not mounted');
}

if (!domain.includes('buildPrayerDashboardResult')) {
  throw new Error('Calendar prayer rows do not use shared prayer pipeline');
}

const hasReferenceDate = /utcCivilDate\(2026,\s*1,\s*1\)/.test(tests);
if (!tests.includes('12 Rajab 1447 AH') || !hasReferenceDate) {
  throw new Error('Reference Hijri alignment fixture missing');
}

if (screen.includes('TodayScreen')) {
  throw new Error('Calendar must remain separate from Today');
}

console.log('Prayer calendar architecture and reference fixtures passed.');
