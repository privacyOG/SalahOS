import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const finderGeneratorPath = path.join(root, 'scripts', 'generate-australian-mosque-finder.mjs');
const finderDataPath = path.join(root, 'src', 'data', 'australian-mosque-finder.json');
const combinedDataPath = path.join(root, 'src', 'data', 'australian-mosques-combined.json');

function replaceOnce(source, search, replacement, label) {
  const first = source.indexOf(search);
  if (first === -1) throw new Error(`Patch marker not found: ${label}`);
  if (source.indexOf(search, first + search.length) !== -1)
    throw new Error(`Patch marker is not unique: ${label}`);
  return source.slice(0, first) + replacement + source.slice(first + search.length);
}

let generator = await readFile(finderGeneratorPath, 'utf8');

generator = replaceOnce(
  generator,
  "\n\nfunction assert(condition, message) {",
  `\n\nexport const AUSTRALIAN_FARD_SANITY_WINDOWS = Object.freeze({\n  fajr: Object.freeze({ earliestMinutes: 0, latestMinutes: 600 }),\n  dhuhr: Object.freeze({ earliestMinutes: 600, latestMinutes: 1_020 }),\n  asr: Object.freeze({ earliestMinutes: 720, latestMinutes: 1_260 }),\n  maghrib: Object.freeze({ earliestMinutes: 900, latestMinutes: 1_439 }),\n  isha: Object.freeze({ earliestMinutes: 960, latestMinutes: 1_439 }),\n});\n\nfunction assert(condition, message) {`,
  'Australian fard sanity windows',
);

generator = replaceOnce(
  generator,
  `  return \`${'${String(hour)}'}:${'${String(minute).padStart(2, \'0\')}'} ${'${match[3]}'}\`;\n}\n\nfunction clocksFromText(text) {`,
  `  return \`${'${String(hour)}'}:${'${String(minute).padStart(2, \'0\')}'} ${'${match[3]}'}\`;\n}\n\nfunction clockMinutes(value) {\n  const normalized = normalizeClock(value);\n  if (normalized === null) return null;\n  const match = /^(\\d{1,2}):(\\d{2}) (am|pm)$/u.exec(normalized);\n  if (match === null) return null;\n  let hour = Number(match[1]) % 12;\n  if (match[3] === 'pm') hour += 12;\n  return hour * 60 + Number(match[2]);\n}\n\nfunction normalizeAddressPart(value) {\n  return cleanText(value)\n    .replace(/\\s*,\\s*,+/gu, ', ')\n    .replace(/\\s+,/gu, ',')\n    .replace(/,\\s*/gu, ', ')\n    .replace(/^,\\s*|\\s*,$/gu, '')\n    .replace(/\\s+/gu, ' ')\n    .trim();\n}\n\nexport function sanitizeDailyPrayerTimes(\n  recordId,\n  prayerTimes,\n  jumuahTimes,\n  report = console.warn,\n) {\n  if (prayerTimes === null) return null;\n  const jumuahClocks = new Set(\n    jumuahTimes.flatMap((entry) => {\n      const normalized = normalizeClock(entry.time);\n      return normalized === null ? [] : [normalized];\n    }),\n  );\n  const sanitized = {};\n  for (const [prayer, value] of Object.entries(prayerTimes)) {\n    const window = AUSTRALIAN_FARD_SANITY_WINDOWS[prayer];\n    if (window === undefined || typeof value !== 'string') continue;\n    const kept = [];\n    for (const candidate of value.split(' / ')) {\n      const normalized = normalizeClock(candidate);\n      if (normalized === null) continue;\n      if (jumuahClocks.has(normalized)) {\n        report(\n          \`Australian Mosque Finder dropped ${'${recordId}'} ${'${prayer}'}=${'${normalized}'}: collides with published Jumu’ah session\`,\n        );\n        continue;\n      }\n      const minutes = clockMinutes(normalized);\n      if (\n        minutes === null ||\n        minutes < window.earliestMinutes ||\n        minutes > window.latestMinutes\n      ) {\n        report(\n          \`Australian Mosque Finder dropped ${'${recordId}'} ${'${prayer}'}=${'${normalized}'}: outside Australian ${'${prayer}'} sanity window\`,\n        );\n        continue;\n      }\n      if (!kept.includes(normalized)) kept.push(normalized);\n    }\n    if (kept.length > 0) sanitized[prayer] = kept.join(' / ');\n  }\n  return Object.keys(sanitized).length === 0 ? null : sanitized;\n}\n\nfunction clocksFromText(text) {`,
  'clock sanitizers',
);

generator = replaceOnce(
  generator,
  ".map((match) => cleanText(match[1]))\n    .filter(Boolean);",
  ".map((match) => normalizeAddressPart(match[1]))\n    .filter(Boolean);",
  'address div normalization',
);

generator = replaceOnce(
  generator,
  "  const locality = localityMatch?.[1]?.trim() || firstMatch(localityLine, /^(.*?)(?:,|$)/u) || '';",
  "  const locality = normalizeAddressPart(\n    localityMatch?.[1]?.trim() || firstMatch(localityLine, /^(.*?)(?:,|$)/u) || '',\n  );",
  'locality normalization',
);

generator = replaceOnce(
  generator,
  "    formatted: formattedParts.join(', '),",
  "    formatted: normalizeAddressPart(formattedParts.join(', ')),",
  'formatted address normalization',
);

generator = replaceOnce(
  generator,
  'export function parseMosqueFinderPage(rawHtml, sourceUrl, retrievedAt) {',
  'export function parseMosqueFinderPage(rawHtml, sourceUrl, retrievedAt, report = console.warn) {',
  'parser reporter argument',
);

generator = replaceOnce(
  generator,
  `  const features = parseFeatureList(html);\n  const facts = normalizedFacts(features, detailsText);\n  const prayerTimes = parseDailyPrayerTimes(\`${'${jumuahText}'}. ${'${detailsText}'}\`);\n  const slug = new URL(sourceUrl).pathname.split('/').filter(Boolean).at(-2) ?? '';\n  if (slug.length === 0) return null;`,
  `  const features = parseFeatureList(html);\n  const facts = normalizedFacts(features, detailsText);\n  const slug = new URL(sourceUrl).pathname.split('/').filter(Boolean).at(-2) ?? '';\n  if (slug.length === 0) return null;\n  const recordId = \`mosque-finder:${'${slug}'}\`;\n  const jumuahTimes = parseJumuah(jumuahText);\n  const prayerTimes = sanitizeDailyPrayerTimes(\n    recordId,\n    parseDailyPrayerTimes(\`${'${jumuahText}'}. ${'${detailsText}'}\`),\n    jumuahTimes,\n    report,\n  );`,
  'parser prayer sanitization',
);

generator = replaceOnce(
  generator,
  "    id: `mosque-finder:${slug}` ,",
  "    id: recordId,",
  'record id reuse',
).replace("    id: `mosque-finder:${slug}`,", "    id: recordId,");

generator = replaceOnce(
  generator,
  '    jumuahTimes: parseJumuah(jumuahText),',
  '    jumuahTimes,',
  'jumuah reuse',
);

generator = generator.replace(
  '<div>Level 1, 56-60 Example St</div><div>Sydney, nsw-2000</div>',
  '<div>Level 1, 56-60 Example St,, </div><div>Sydney, nsw-2000</div>',
);
generator = generator.replace(
  '<article><header><h2>Details</h2></header><p>Daily Prayers</p><ul><li>Dhuhr: 12:15 pm and 1:15 pm</li></ul></article>',
  '<article><header><h2>Details</h2></header><p>Daily Prayers</p><ul><li>Dhuhr: 12:15 pm and 1:15 pm</li><li>Maghrib: 11:00 am</li></ul></article>',
);
generator = generator.replace(
  "    '2026-08-29T00:00:00.000Z',\n  );",
  "    '2026-08-29T00:00:00.000Z',\n    () => {},\n  );",
);
generator = generator.replace(
  "    record.prayerTimes?.dhuhr === '12:15 pm / 1:15 pm',",
  "    record.prayerTimes?.dhuhr === '1:15 pm',",
);
generator = replaceOnce(
  generator,
  "  assert(\n    record.facilities.includes('wudu') && record.facilities.includes('toilets'),",
  "  assert(record.prayerTimes?.maghrib === undefined, 'Self-test prayer sanity filtering failed');\n  assert(!record.address.formatted.includes(',,'), 'Self-test address normalization failed');\n  assert(\n    record.facilities.includes('wudu') && record.facilities.includes('toilets'),",
  'self-test sanitization assertions',
);

await writeFile(finderGeneratorPath, generator, 'utf8');

const WINDOWS = {
  fajr: { earliestMinutes: 0, latestMinutes: 600 },
  dhuhr: { earliestMinutes: 600, latestMinutes: 1020 },
  asr: { earliestMinutes: 720, latestMinutes: 1260 },
  maghrib: { earliestMinutes: 900, latestMinutes: 1439 },
  isha: { earliestMinutes: 960, latestMinutes: 1439 },
};

function normalizeClock(raw) {
  const cleaned = String(raw).toLowerCase().replace(/\./g, ':').replace(/\s+/g, '');
  const match = /^(\d{1,2})(?::(\d{2}))?(am|pm)$/.exec(cleaned);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2] ?? '00');
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  return `${hour}:${String(minute).padStart(2, '0')} ${match[3]}`;
}

function clockMinutes(value) {
  const normalized = normalizeClock(value);
  if (!normalized) return null;
  const match = /^(\d{1,2}):(\d{2}) (am|pm)$/.exec(normalized);
  let hour = Number(match[1]) % 12;
  if (match[3] === 'pm') hour += 12;
  return hour * 60 + Number(match[2]);
}

function normalizeAddressPart(value) {
  return String(value ?? '')
    .replace(/\s*,\s*,+/g, ', ')
    .replace(/\s+,/g, ',')
    .replace(/,\s*/g, ', ')
    .replace(/^,\s*|\s*,$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizePrayerTimes(record) {
  if (record.prayerTimes === null) return null;
  const jumuah = new Set(
    (record.jumuahTimes ?? []).map((entry) => normalizeClock(entry.time)).filter(Boolean),
  );
  const out = {};
  for (const [prayer, value] of Object.entries(record.prayerTimes)) {
    const window = WINDOWS[prayer];
    if (!window || typeof value !== 'string') continue;
    const kept = [];
    for (const candidate of value.split(' / ')) {
      const normalized = normalizeClock(candidate);
      if (!normalized) continue;
      if (jumuah.has(normalized)) {
        console.log(`DROP collision ${record.id} ${prayer}=${normalized}`);
        continue;
      }
      const minutes = clockMinutes(normalized);
      if (minutes < window.earliestMinutes || minutes > window.latestMinutes) {
        console.log(`DROP sanity ${record.id} ${prayer}=${normalized}`);
        continue;
      }
      kept.push(normalized);
    }
    if (kept.length) out[prayer] = [...new Set(kept)].join(' / ');
  }
  return Object.keys(out).length ? out : null;
}

const finder = JSON.parse(await readFile(finderDataPath, 'utf8'));
const combinedBefore = JSON.parse(await readFile(combinedDataPath, 'utf8'));
const finderBefore = finder.records.filter((record) => record.prayerTimes !== null).length;
const combinedBeforeCount = combinedBefore.records.filter((record) => record.prayerTimes !== null).length;

for (const record of finder.records) {
  record.prayerTimes = sanitizePrayerTimes(record);
  if (record.address) {
    record.address.line1 = normalizeAddressPart(record.address.line1);
    record.address.locality = normalizeAddressPart(record.address.locality);
    record.address.formatted = normalizeAddressPart(record.address.formatted);
  }
}

const finderAfter = finder.records.filter((record) => record.prayerTimes !== null).length;
await writeFile(finderDataPath, `${JSON.stringify(finder, null, 2)}\n`, 'utf8');

execFileSync(process.execPath, [path.join(root, 'scripts', 'generate-australian-mosque-finder.mjs')], {
  cwd: root,
  stdio: 'inherit',
});
execFileSync(process.execPath, [path.join(root, 'scripts', 'generate-australian-mosque-combined.mjs')], {
  cwd: root,
  stdio: 'inherit',
});
execFileSync(process.execPath, [path.join(root, 'scripts', 'generate-mosque-directory-packs.mjs')], {
  cwd: root,
  stdio: 'inherit',
});

const combinedAfter = JSON.parse(await readFile(combinedDataPath, 'utf8'));
const combinedAfterCount = combinedAfter.records.filter((record) => record.prayerTimes !== null).length;
console.log(
  `ITEM2 COUNTS finder ${finderBefore}->${finderAfter}; combined ${combinedBeforeCount}->${combinedAfterCount}`,
);
