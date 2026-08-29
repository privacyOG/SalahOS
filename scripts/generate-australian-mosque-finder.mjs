import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_PATH = path.join(root, 'src', 'data', 'australian-mosque-finder.json');
const BASE_URL = 'https://mosque-finder.com.au';
const SITEMAP_URL = `${BASE_URL}/mosque/sitemap.xml`;
const USER_AGENT = 'SalahOS/1.5.1 (+https://github.com/privacyOG/SalahOS; factual mosque directory refresh)';
const REQUEST_DELAY_MS = 250;

const REGION_CODES = Object.freeze({
  act: 'AU-ACT',
  nsw: 'AU-NSW',
  nt: 'AU-NT',
  qld: 'AU-QLD',
  sa: 'AU-SA',
  tas: 'AU-TAS',
  vic: 'AU-VIC',
  wa: 'AU-WA',
});

const FACILITY_RULES = Object.freeze([
  ['wudu', /\b(?:wudu|wudhu|ablution)\b/iu],
  ['toilets', /\btoilets?\b/iu],
  ['parking', /\bparking\b/iu],
  ['women-prayer-space', /\b(?:women|woman|female|females|sister|sisters)\b[\s\S]{0,50}\b(?:prayer|area|room|space|facilit)/iu],
  ['wheelchair-accessible', /\b(?:wheelchair|disabled access|accessible)\b/iu],
  ['family-room', /\bfamily\s+(?:room|area|space)\b/iu],
  ['hearing-loop', /\bhearing\s+loop\b/iu],
]);

const SERVICE_RULES = Object.freeze([
  ['classes', /\b(?:class|classes|qur.?an|islamic studies|education|educational)\b/iu],
  ['counselling', /\bcounsell?ing\b/iu],
  ['food-support', /\b(?:food support|food relief|food bank)\b/iu],
  ['funeral-services', /\b(?:funeral|janazah|janaazah)\b/iu],
  ['nikah-services', /\b(?:nikah|nikkah|marriage service)\b/iu],
  ['youth', /\byouth\b/iu],
  ['zakat', /\bzakat\b/iu],
]);

const PRAYER_NAMES = Object.freeze({
  fajr: 'fajr',
  dhuhr: 'dhuhr',
  dhuhur: 'dhuhr',
  zuhr: 'dhuhr',
  asr: 'asr',
  maghrib: 'maghrib',
  isha: 'isha',
  esha: 'isha',
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/giu, ' ')
    .replace(/&amp;/giu, '&')
    .replace(/&quot;/giu, '"')
    .replace(/&#39;|&apos;/giu, "'")
    .replace(/&lt;/giu, '<')
    .replace(/&gt;/giu, '>')
    .replace(/&#(\d+);/gu, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/giu, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function cleanText(value) {
  return decodeHtml(value)
    .replace(/<br\s*\/?\s*>/giu, ' ')
    .replace(/<[^>]+>/gu, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

function stripComments(html) {
  return html.replace(/<!--[\s\S]*?-->/gu, '');
}

function firstMatch(html, pattern) {
  const match = pattern.exec(html);
  return match?.[1] === undefined ? null : cleanText(match[1]);
}

function normalizeClock(raw) {
  const cleaned = raw.toLocaleLowerCase('en-AU').replace(/\./gu, ':').replace(/\s+/gu, '');
  const match = /^(\d{1,2})(?::(\d{2}))?(am|pm)$/u.exec(cleaned);
  if (match === null) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2] ?? '00');
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  return `${String(hour)}:${String(minute).padStart(2, '0')} ${match[3]}`;
}

function clocksFromText(text) {
  const values = [];
  const matches = text.matchAll(/\b(?:1[0-2]|0?[1-9])(?:[:.]\d{2})?\s*(?:am|pm)\b/giu);
  for (const match of matches) {
    const normalized = normalizeClock(match[0]);
    if (normalized !== null && !values.includes(normalized)) values.push(normalized);
  }
  return values;
}

function normalizeType(value) {
  const normalized = value.toLocaleLowerCase('en-AU').replace(/\s+/gu, ' ').trim();
  if (/friday|jummah|jumu.?ah/iu.test(normalized) && /only/iu.test(normalized)) return 'friday-prayer-only';
  if (/prayer\s*room/iu.test(normalized)) return 'prayer-room';
  if (/musall?a|musallah/iu.test(normalized)) return 'musalla';
  if (/mosque|masjid/iu.test(normalized)) return 'mosque';
  return 'other';
}

function parseRegion(value) {
  const state = value.toLocaleLowerCase('en-AU').replace(/[^a-z]/gu, '');
  return REGION_CODES[state] ?? null;
}

function parseAddress(addressHtml, fallbackState) {
  const directDivs = [...addressHtml.matchAll(/<div(?![^>]*class=)[^>]*>([\s\S]*?)<\/div>/giu)]
    .map((match) => cleanText(match[1]))
    .filter(Boolean);
  const line1 = directDivs[0] ?? '';
  const localityLine = directDivs[1] ?? '';
  const localityMatch = /^(.*?),\s*([A-Za-z]{2,3})\s*-\s*(\d{4})$/u.exec(localityLine);
  const locality = localityMatch?.[1]?.trim() || firstMatch(localityLine, /^(.*?)(?:,|$)/u) || '';
  const state = (localityMatch?.[2] ?? fallbackState).toLocaleLowerCase('en-AU');
  const postcode = localityMatch?.[3] ?? /\b\d{4}\b/u.exec(localityLine)?.[0] ?? null;
  const regionCode = parseRegion(state);
  const formattedParts = [line1, locality, state.toLocaleUpperCase('en-AU'), postcode].filter(Boolean);
  return {
    line1,
    locality,
    state: state.toLocaleUpperCase('en-AU'),
    regionCode,
    postcode,
    formatted: formattedParts.join(', '),
    countryCode: 'AU',
  };
}

function sectionByHeading(html, headingTag, headingText) {
  const escaped = headingText.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const pattern = new RegExp(
    `<header>\\s*<${headingTag}[^>]*>\\s*${escaped}\\s*<\\/${headingTag}>\\s*<\\/header>([\\s\\S]*?)(?=<article\\b|<section\\b|<\\/article>|<\\/section>)`,
    'iu',
  );
  return pattern.exec(html)?.[1] ?? '';
}

function parseContact(addressHtml) {
  const phone =
    firstMatch(addressHtml, /fa-(?:mobile|phone)[^>]*><\/i>\s*<span[^>]*>([\s\S]*?)<\/span>/iu) ??
    firstMatch(addressHtml, /href=["']tel:([^"']+)["']/iu);
  const email =
    firstMatch(addressHtml, /href=["']mailto:([^"']+)["']/iu) ??
    firstMatch(addressHtml, /fa-(?:email|envelope)[^>]*><\/i>\s*<span[^>]*>([^<]*@[^<]*)<\/span>/iu);
  const websiteMatch = /fa-globe[^>]*><\/i>\s*<a[^>]*href=["']([^"']+)["']/iu.exec(addressHtml);
  let website = websiteMatch?.[1] ?? null;
  if (website !== null && website.startsWith('#')) website = null;
  return {
    ...(phone === null ? {} : { phone }),
    ...(email === null ? {} : { email: email.toLocaleLowerCase('en-AU') }),
    ...(website === null ? {} : { website }),
  };
}

function jumuahLabel(text, offset, index) {
  const before = text.slice(Math.max(0, offset - 90), offset).toLocaleLowerCase('en-AU');
  const session = /(?:^|\b)(1st|2nd|3rd|4th|first|second|third|fourth)\s+session\b/iu.exec(before)?.[1];
  if (session !== undefined) return `${session} session`;
  if (/\bwinter\b/iu.test(before)) return 'winter';
  if (/\bsummer\b|daylight saving/iu.test(before)) return 'summer';
  if (/\bkhutbah\b/iu.test(before)) return 'Khutbah';
  return index === 0 ? 'Jumu’ah' : `Jumu’ah ${String(index + 1)}`;
}

function parseJumuah(jumuahText) {
  const prayerSplit = jumuahText.search(/\b(?:fajr|dhuhr|dhuhur|zuhr|asr|maghrib|isha|esha)\b/iu);
  const onlyJumuah = prayerSplit === -1 ? jumuahText : jumuahText.slice(0, prayerSplit);
  const results = [];
  for (const match of onlyJumuah.matchAll(/\b(?:1[0-2]|0?[1-9])(?:[:.]\d{2})?\s*(?:am|pm)\b/giu)) {
    const time = normalizeClock(match[0]);
    if (time === null || results.some((item) => item.time === time)) continue;
    results.push({ time, label: jumuahLabel(onlyJumuah, match.index ?? 0, results.length) });
  }
  return results;
}

function parseDailyPrayerTimes(text) {
  const result = {};
  const prayerPattern = /\b(fajr|dhuhr|dhuhur|zuhr|asr|maghrib|isha|esha)\b\s*[:\-]?\s*([\s\S]*?)(?=\b(?:fajr|dhuhr|dhuhur|zuhr|asr|maghrib|isha|esha)\b|[.;]|$)/giu;
  for (const match of text.matchAll(prayerPattern)) {
    const key = PRAYER_NAMES[match[1].toLocaleLowerCase('en-AU')];
    if (key === undefined) continue;
    const clocks = clocksFromText(match[2]);
    if (clocks.length === 0) continue;
    const existing = typeof result[key] === 'string' ? result[key].split(' / ') : [];
    result[key] = [...new Set([...existing, ...clocks])].join(' / ');
  }
  return Object.keys(result).length === 0 ? null : result;
}

function parseFeatureList(html) {
  const featureSection = sectionByHeading(html, 'h2', 'Features');
  const listHtml = /<ul[^>]*class=["'][^"']*bullets[^"']*["'][^>]*>([\s\S]*?)<\/ul>/iu.exec(featureSection)?.[1] ?? '';
  return [...listHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/giu)]
    .map((match) => cleanText(match[1]))
    .filter(Boolean);
}

function normalizedFacts(features, detailsText) {
  const searchable = [...features, detailsText].join(' ');
  return {
    facilities: FACILITY_RULES.filter(([, pattern]) => pattern.test(searchable)).map(([facility]) => facility),
    services: SERVICE_RULES.filter(([, pattern]) => pattern.test(searchable)).map(([service]) => service),
  };
}

export function parseMosqueFinderPage(rawHtml, sourceUrl, retrievedAt) {
  const html = stripComments(rawHtml);
  const name = firstMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/iu);
  if (name === null) return null;
  const stateVariable = firstMatch(html, /\bvar\s+state\s*=\s*["']([^"']+)["']/iu) ?? '';
  const typeText = firstMatch(html, /<div[^>]*class=["'][^"']*type[^"']*["'][^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/iu) ?? 'other';
  const addressSection = sectionByHeading(html, 'h3', 'Address');
  const addressHtml = /<address[^>]*>([\s\S]*?)<\/address>/iu.exec(addressSection)?.[1] ?? '';
  const address = parseAddress(addressHtml, stateVariable);
  const latitudeText = firstMatch(html, /\bvar\s+lat\s*=\s*(-?\d+(?:\.\d+)?)/iu);
  const longitudeText = firstMatch(html, /\bvar\s+lon\s*=\s*(-?\d+(?:\.\d+)?)/iu);
  const latitude = latitudeText === null ? Number.NaN : Number(latitudeText);
  const longitude = longitudeText === null ? Number.NaN : Number(longitudeText);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -44.5 || latitude > -9 || longitude < 112 || longitude > 154.5) return null;
  if (address.regionCode === null) return null;

  const jumuahSection = sectionByHeading(html, 'h3', 'Jummah Time');
  const jumuahText = cleanText(jumuahSection);
  const detailsText = cleanText(sectionByHeading(html, 'h2', 'Details'));
  const features = parseFeatureList(html);
  const facts = normalizedFacts(features, detailsText);
  const prayerTimes = parseDailyPrayerTimes(`${jumuahText}. ${detailsText}`);
  const slug = new URL(sourceUrl).pathname.split('/').filter(Boolean).at(-2) ?? '';
  if (slug.length === 0) return null;

  return {
    id: `mosque-finder:${slug}`,
    slug,
    name,
    type: normalizeType(typeText),
    address,
    latitude: Number(latitude.toFixed(7)),
    longitude: Number(longitude.toFixed(7)),
    contact: parseContact(addressHtml),
    prayerTimes,
    jumuahTimes: parseJumuah(jumuahText),
    features,
    facilities: facts.facilities,
    services: facts.services,
    sourceUrl,
    observedAt: retrievedAt,
  };
}

function validateRecord(record) {
  assert(typeof record.id === 'string' && record.id.startsWith('mosque-finder:'), 'Mosque Finder ID is invalid');
  assert(typeof record.name === 'string' && record.name.length > 0, `Missing name for ${record.id}`);
  assert(Object.values(REGION_CODES).includes(record.address?.regionCode), `Invalid region for ${record.id}`);
  assert(Number.isFinite(record.latitude) && Number.isFinite(record.longitude), `Invalid coordinates for ${record.id}`);
  assert(record.latitude >= -44.5 && record.latitude <= -9, `Latitude outside Australia for ${record.id}`);
  assert(record.longitude >= 112 && record.longitude <= 154.5, `Longitude outside Australia for ${record.id}`);
  assert(typeof record.sourceUrl === 'string' && record.sourceUrl.startsWith(`${BASE_URL}/mosque/`), `Invalid source URL for ${record.id}`);
  for (const entry of record.jumuahTimes ?? []) {
    assert(/^\d{1,2}:\d{2} (?:am|pm)$/u.test(entry.time), `Invalid Jumu’ah time for ${record.id}`);
  }
}

export function validateDirectory(directory) {
  assert(directory?.schemaVersion === 1, 'Mosque Finder directory must use schema version 1');
  assert(directory.source?.name === 'Australian Mosque Finder', 'Mosque Finder source label is invalid');
  assert(Array.isArray(directory.records) && directory.records.length > 0, 'Mosque Finder directory has no records');
  const ids = new Set();
  const urls = new Set();
  const regions = new Set();
  for (const record of directory.records) {
    validateRecord(record);
    assert(!ids.has(record.id), `Duplicate ID ${record.id}`);
    assert(!urls.has(record.sourceUrl), `Duplicate source URL ${record.sourceUrl}`);
    ids.add(record.id);
    urls.add(record.sourceUrl);
    regions.add(record.address.regionCode);
  }
  assert(directory.source.recordCount === directory.records.length, 'Mosque Finder source count mismatch');
  assert(directory.source.sitemapRecordCount >= directory.records.length, 'Sitemap count cannot be below parsed record count');
  for (const regionCode of Object.values(REGION_CODES)) {
    assert(regions.has(regionCode), `Mosque Finder directory is missing ${regionCode}`);
  }
  return directory;
}

async function requestText(url) {
  let lastError = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': USER_AGENT, accept: 'text/html,application/xml;q=0.9,*/*;q=0.8' },
        redirect: 'follow',
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`${url} returned HTTP ${String(response.status)}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1_500));
    }
  }
  throw lastError ?? new Error(`Unable to fetch ${url}`);
}

function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/giu)]
    .map((match) => decodeHtml(match[1]).trim())
    .filter((url) => /^https:\/\/(?:www\.)?mosque-finder\.com\.au\/mosque\/[^/]+\/index\.html$/iu.test(url))
    .map((url) => url.replace('https://www.mosque-finder.com.au', BASE_URL));
}

async function fetchDirectory() {
  const robots = await requestText(`${BASE_URL}/robots.txt`);
  assert(!/^\s*Disallow:\s*\/mosque\b/imu.test(robots), 'robots.txt disallows /mosque crawling');
  const sitemap = await requestText(SITEMAP_URL);
  const urls = [...new Set(sitemapUrls(sitemap))];
  assert(urls.length > 0, 'Mosque Finder sitemap contains no mosque detail URLs');
  const retrievedAt = new Date().toISOString();
  const records = [];
  const failures = [];
  for (let index = 0; index < urls.length; index += 1) {
    const url = urls[index];
    try {
      const html = await requestText(url);
      const record = parseMosqueFinderPage(html, url, retrievedAt);
      if (record === null) failures.push({ url, reason: 'unparseable or outside Australian bounds' });
      else records.push(record);
    } catch (error) {
      failures.push({ url, reason: error instanceof Error ? error.message : String(error) });
    }
    if ((index + 1) % 25 === 0 || index + 1 === urls.length) {
      console.log(`Australian Mosque Finder: ${String(index + 1)}/${String(urls.length)} pages processed.`);
    }
    if (index + 1 < urls.length) await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
  }
  const sorted = records.sort((left, right) => left.name.localeCompare(right.name, 'en-AU', { sensitivity: 'base' }));
  const directory = {
    schemaVersion: 1,
    source: {
      name: 'Australian Mosque Finder',
      sourceKind: 'organization-directory',
      baseUrl: BASE_URL,
      sitemapUrl: SITEMAP_URL,
      retrievedAt,
      sitemapRecordCount: urls.length,
      recordCount: sorted.length,
      failedRecordCount: failures.length,
    },
    records: sorted,
  };
  validateDirectory(directory);
  if (failures.length > 0) {
    console.warn(`Australian Mosque Finder skipped ${String(failures.length)} sitemap entries.`);
    for (const failure of failures.slice(0, 20)) console.warn(`- ${failure.url}: ${failure.reason}`);
  }
  return directory;
}

function selfTest() {
  const fixture = `
    <h1>Sydney CBD - Test Musallah</h1><figure>Sydney, nsw</figure>
    <div class="type"><span>Musalla</span></div>
    <section><header><h3>Address</h3></header><address>
      <div>Level 1, 56-60 Example St</div><div>Sydney, nsw-2000</div><figure>
      <div class="info"><i class="fa fa-mobile"></i><span>02 9000 0000</span></div>
      <div class="info"><i class="fa fa-globe"></i><a href="https://example.org/">example</a></div>
      <!--div class="info"><i class="fa fa-mobile"></i><span>818-832-5258</span></div-->
      </figure></address></section>
    <section><header><h3>Jummah Time</h3></header><div class="content">3 sessions Khutbah 12:15 pm, 1:00 pm & 1:40 pm. Dhuhr: 12:15 pm and 1:15 pm.</div></section>
    <article><header><h2>Details</h2></header><p>Daily Prayers</p><ul><li>Dhuhr: 12:15 pm and 1:15 pm</li></ul></article>
    <article><header><h2>Features</h2></header><ul class="bullets"><li>Wudu facility</li><li>Toilets</li></ul></article>
    <script>var state = "nsw"; var lat = -33.86; var lon = 151.20; var PT = new PrayTimes('MWL');</script>`;
  const record = parseMosqueFinderPage(fixture, `${BASE_URL}/mosque/test/index.html`, '2026-08-29T00:00:00.000Z');
  assert(record !== null, 'Self-test fixture did not parse');
  assert(record.type === 'musalla', 'Self-test type parsing failed');
  assert(record.contact.phone === '02 9000 0000', 'Self-test contact parsing failed');
  assert(record.jumuahTimes.length === 3, 'Self-test Jumu’ah parsing failed');
  assert(record.prayerTimes?.dhuhr === '12:15 pm / 1:15 pm', 'Self-test daily prayer parsing failed');
  assert(record.facilities.includes('wudu') && record.facilities.includes('toilets'), 'Self-test facility parsing failed');
  assert(!JSON.stringify(record).includes('PrayTimes'), 'Calculated PrayTimes implementation leaked into stored facts');
  assert(!JSON.stringify(record).includes('818-832-5258'), 'Commented template contact leaked into stored facts');
  console.log('Australian Mosque Finder parser self-test passed.');
}

async function main() {
  const args = new Set(process.argv.slice(2));
  selfTest();
  if (args.has('--self-test')) return;
  if (args.has('--fetch')) {
    const directory = await fetchDirectory();
    await writeFile(OUTPUT_PATH, `${JSON.stringify(directory, null, 2)}\n`, 'utf8');
    const counts = Object.fromEntries(
      Object.values(REGION_CODES).map((regionCode) => [
        regionCode,
        directory.records.filter((record) => record.address.regionCode === regionCode).length,
      ]),
    );
    const withJumuah = directory.records.filter((record) => record.jumuahTimes.length > 0).length;
    const withPrayerTimes = directory.records.filter((record) => record.prayerTimes !== null).length;
    const withContact = directory.records.filter((record) => Object.keys(record.contact).length > 0).length;
    console.log(
      `Retrieved ${String(directory.records.length)}/${String(directory.source.sitemapRecordCount)} Australian Mosque Finder records; Jumu’ah ${String(withJumuah)}, daily congregation times ${String(withPrayerTimes)}, contact ${String(withContact)}.`,
    );
    console.log(`Regional coverage: ${JSON.stringify(counts)}`);
    return;
  }
  const directory = JSON.parse(await readFile(OUTPUT_PATH, 'utf8'));
  validateDirectory(directory);
  console.log(`Australian Mosque Finder snapshot check passed: ${String(directory.records.length)} records.`);
}

await main();
