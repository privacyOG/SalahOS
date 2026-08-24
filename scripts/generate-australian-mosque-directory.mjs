import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_INPUT = 'data/osm/australian-muslim-places-of-worship.overpass.json';
const DEFAULT_OUTPUT = 'src/data/australian-mosques.json';
const OVERPASS_ENDPOINTS = [
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];
const OVERPASS_USER_AGENT = 'SalahOS/1.4 (+https://github.com/privacyOG/SalahOS)';

export const AUSTRALIAN_MOSQUE_REGION_CODES = Object.freeze([
  'AU-ACT',
  'AU-NSW',
  'AU-NT',
  'AU-QLD',
  'AU-SA',
  'AU-TAS',
  'AU-VIC',
  'AU-WA',
]);

const REGION_NAMES = Object.freeze({
  'AU-ACT': 'Australian Capital Territory',
  'AU-NSW': 'New South Wales',
  'AU-NT': 'Northern Territory',
  'AU-QLD': 'Queensland',
  'AU-SA': 'South Australia',
  'AU-TAS': 'Tasmania',
  'AU-VIC': 'Victoria',
  'AU-WA': 'Western Australia',
});

export const AUSTRALIAN_MOSQUE_OVERPASS_QUERY_TEMPLATE = `[out:json][timeout:90];
area["ISO3166-2"="{REGION_CODE}"]["boundary"="administrative"]->.region;
(
  nwr["amenity"="place_of_worship"]["religion"="muslim"](area.region);
  nwr["amenity"="place_of_worship"]["building"="mosque"](area.region);
);
out center tags;`;

function queryForRegion(regionCode) {
  return AUSTRALIAN_MOSQUE_OVERPASS_QUERY_TEMPLATE.replace('{REGION_CODE}', regionCode);
}

function parseArguments(argv) {
  const options = {
    fetch: false,
    check: false,
    input: DEFAULT_INPUT,
    output: DEFAULT_OUTPUT,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--fetch') {
      options.fetch = true;
    } else if (argument === '--check') {
      options.check = true;
    } else if (argument === '--input') {
      const value = argv[index + 1];
      if (!value) throw new Error('--input requires a path');
      options.input = value;
      index += 1;
    } else if (argument === '--output') {
      const value = argv[index + 1];
      if (!value) throw new Error('--output requires a path');
      options.output = value;
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (options.fetch && options.check) {
    throw new Error('--fetch and --check cannot be used together');
  }
  return options;
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanText(value) {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim().replace(/\s+/gu, ' ');
  return cleaned.length === 0 ? null : cleaned;
}

function firstText(tags, keys) {
  for (const key of keys) {
    const value = cleanText(tags[key]);
    if (value !== null) return value;
  }
  return null;
}

function httpUrl(value) {
  const text = cleanText(value);
  if (text === null) return null;
  const candidate = /^https?:\/\//iu.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function elementCoordinates(element) {
  if (Number.isFinite(element.lat) && Number.isFinite(element.lon)) {
    return { latitude: element.lat, longitude: element.lon };
  }
  if (
    isRecord(element.center) &&
    Number.isFinite(element.center.lat) &&
    Number.isFinite(element.center.lon)
  ) {
    return { latitude: element.center.lat, longitude: element.center.lon };
  }
  return null;
}

function addressFromTags(tags, regionCode) {
  const street = firstText(tags, ['addr:street', 'addr:place']);
  const number = cleanText(tags['addr:housenumber']);
  const locality = firstText(tags, ['addr:suburb', 'addr:city', 'addr:town', 'addr:locality']);
  const taggedState = firstText(tags, ['addr:state', 'is_in:state']);
  const state = taggedState ?? REGION_NAMES[regionCode] ?? null;
  const postcode = cleanText(tags['addr:postcode']);
  const parts = [];
  if (street !== null) parts.push(number === null ? street : `${number} ${street}`);
  if (locality !== null) parts.push(locality);
  if (state !== null) parts.push(state);
  if (postcode !== null) parts.push(postcode);
  if (parts.length === 0) return 'Australia';
  parts.push('Australia');
  return [...new Set(parts)].join(', ');
}

function canonicalName(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLocaleLowerCase('en-AU')
    .replace(/\b(?:the|inc|incorporated|association|centre|center)\b/gu, ' ')
    .replace(/\b(?:mosque|masjid|musalla|musallah)\b/gu, ' mosque ')
    .replace(/[^a-z0-9]+/gu, ' ')
    .trim()
    .replace(/\s+/gu, ' ');
}

function distanceKm(left, right) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(right.latitude - left.latitude);
  const longitudeDelta = radians(right.longitude - left.longitude);
  const fromLatitude = radians(left.latitude);
  const toLatitude = radians(right.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 6_371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function richness(record) {
  const typeScore = record.osmType === 'relation' ? 3 : record.osmType === 'way' ? 2 : 1;
  return (
    typeScore +
    (record.address === 'Australia' ? 0 : 2) +
    (record.nameAr ? 1 : 0) +
    (record.website ? 1 : 0) +
    (record.phone ? 1 : 0) +
    (record.email ? 1 : 0)
  );
}

function recordFromElement(element, regionCode) {
  if (!isRecord(element) || !['node', 'way', 'relation'].includes(element.type)) return null;
  if (!Number.isSafeInteger(element.id) || !isRecord(element.tags)) return null;
  const coordinates = elementCoordinates(element);
  if (coordinates === null) return null;
  if (
    coordinates.latitude < -44.5 ||
    coordinates.latitude > -9 ||
    coordinates.longitude < 112 ||
    coordinates.longitude > 154.5
  ) {
    return null;
  }

  const name = firstText(element.tags, ['name:en', 'name', 'official_name', 'short_name']);
  if (name === null) return null;
  const nameAr = cleanText(element.tags['name:ar']);
  const website = httpUrl(firstText(element.tags, ['contact:website', 'website', 'url']));
  const phone = firstText(element.tags, ['contact:phone', 'phone']);
  const email = firstText(element.tags, ['contact:email', 'email']);
  const state =
    firstText(element.tags, ['addr:state', 'is_in:state']) ?? REGION_NAMES[regionCode] ?? null;

  return {
    id: `osm-${element.type}-${String(element.id)}`,
    osmType: element.type,
    osmId: element.id,
    name,
    ...(nameAr === null ? {} : { nameAr }),
    address: addressFromTags(element.tags, regionCode),
    regionCode,
    ...(state === null ? {} : { state }),
    latitude: Number(coordinates.latitude.toFixed(7)),
    longitude: Number(coordinates.longitude.toFixed(7)),
    ...(website === null ? {} : { website }),
    ...(phone === null ? {} : { phone }),
    ...(email === null ? {} : { email }),
  };
}

function deduplicate(records) {
  const ordered = [...records].sort((left, right) => {
    const nameCompare = canonicalName(left.name).localeCompare(canonicalName(right.name), 'en-AU');
    if (nameCompare !== 0) return nameCompare;
    const scoreCompare = richness(right) - richness(left);
    if (scoreCompare !== 0) return scoreCompare;
    return left.id.localeCompare(right.id, 'en-AU');
  });
  const kept = [];

  for (const candidate of ordered) {
    const canonical = canonicalName(candidate.name);
    const duplicateIndex = kept.findIndex(
      (existing) =>
        canonical.length >= 4 &&
        canonicalName(existing.name) === canonical &&
        distanceKm(existing, candidate) <= 0.25,
    );
    if (duplicateIndex === -1) {
      kept.push(candidate);
      continue;
    }
    const existing = kept[duplicateIndex];
    if (existing !== undefined && richness(candidate) > richness(existing)) {
      kept[duplicateIndex] = candidate;
    }
  }

  return kept.sort((left, right) => {
    const nameCompare = left.name.localeCompare(right.name, 'en-AU', { sensitivity: 'base' });
    return nameCompare !== 0 ? nameCompare : left.id.localeCompare(right.id, 'en-AU');
  });
}

function parseSnapshotRegions(raw) {
  if (!isRecord(raw) || raw.schemaVersion !== 1 || !Array.isArray(raw.regions)) {
    throw new TypeError('Overpass snapshot must contain schemaVersion 1 and a regions array');
  }
  return raw.regions.map((region) => {
    if (
      !isRecord(region) ||
      typeof region.regionCode !== 'string' ||
      !AUSTRALIAN_MOSQUE_REGION_CODES.includes(region.regionCode) ||
      typeof region.osmBaseTimestamp !== 'string' ||
      !Array.isArray(region.elements)
    ) {
      throw new TypeError('Overpass snapshot contains an invalid Australian region entry');
    }
    return region;
  });
}

export function buildAustralianMosqueDirectory(raw) {
  const regions = parseSnapshotRegions(raw);
  const converted = regions.flatMap((region) =>
    region.elements
      .map((element) => recordFromElement(element, region.regionCode))
      .filter((record) => record !== null),
  );
  const records = deduplicate(converted);
  if (records.length === 0) throw new RangeError('Australian mosque directory generation produced no records');
  const rawElementCount = regions.reduce((total, region) => total + region.elements.length, 0);
  const timestamps = regions.map((region) => region.osmBaseTimestamp).sort();

  return {
    schemaVersion: 1,
    source: {
      name: 'OpenStreetMap contributors',
      licence: 'ODbL-1.0',
      attributionUrl: 'https://www.openstreetmap.org/copyright',
      licenceUrl: 'https://opendatacommons.org/licenses/odbl/1-0/',
      overpassQueryTemplate: AUSTRALIAN_MOSQUE_OVERPASS_QUERY_TEMPLATE,
      regionCodes: AUSTRALIAN_MOSQUE_REGION_CODES,
      osmBaseTimestamp: timestamps[0],
      rawElementCount,
      recordCount: records.length,
      skippedOrDeduplicatedCount: rawElementCount - records.length,
    },
    records,
  };
}

async function requestRegion(regionCode, endpoint) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'user-agent': OVERPASS_USER_AGENT,
    },
    body: new URLSearchParams({ data: queryForRegion(regionCode) }),
    signal: AbortSignal.timeout(100_000),
  });
  if (!response.ok) throw new Error(`${endpoint} returned HTTP ${String(response.status)}`);
  const raw = await response.json();
  const timestamp = isRecord(raw.osm3s) ? cleanText(raw.osm3s.timestamp_osm_base) : null;
  if (!isRecord(raw) || !Array.isArray(raw.elements) || timestamp === null) {
    throw new TypeError(`${endpoint} returned an invalid Overpass response for ${regionCode}`);
  }
  return {
    regionCode,
    osmBaseTimestamp: timestamp,
    elements: raw.elements,
  };
}

async function fetchRegion(regionCode, preferredEndpointIndex) {
  let lastError = null;
  for (let offset = 0; offset < OVERPASS_ENDPOINTS.length; offset += 1) {
    const endpoint = OVERPASS_ENDPOINTS[(preferredEndpointIndex + offset) % OVERPASS_ENDPOINTS.length];
    if (endpoint === undefined) continue;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        return await requestRegion(regionCode, endpoint);
      } catch (error) {
        lastError = error;
        if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 4_000));
      }
    }
  }
  throw lastError ?? new Error(`Unable to fetch ${regionCode} mosque data from Overpass`);
}

async function fetchSnapshot() {
  const regions = [];
  for (let index = 0; index < AUSTRALIAN_MOSQUE_REGION_CODES.length; index += 1) {
    const regionCode = AUSTRALIAN_MOSQUE_REGION_CODES[index];
    if (regionCode === undefined) continue;
    const region = await fetchRegion(regionCode, index % OVERPASS_ENDPOINTS.length);
    regions.push(region);
    console.log(`Fetched ${regionCode}: ${String(region.elements.length)} OSM elements.`);
    if (index < AUSTRALIAN_MOSQUE_REGION_CODES.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }
  return {
    schemaVersion: 1,
    source: 'OpenStreetMap Overpass API',
    regions,
  };
}

function serialize(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const inputPath = path.resolve(options.input);
  const outputPath = path.resolve(options.output);

  let raw;
  if (options.fetch) {
    raw = await fetchSnapshot();
    await mkdir(path.dirname(inputPath), { recursive: true });
    await writeFile(inputPath, serialize(raw), 'utf8');
  } else {
    raw = JSON.parse(await readFile(inputPath, 'utf8'));
  }

  const generated = buildAustralianMosqueDirectory(raw);
  const expected = serialize(generated);
  if (options.check) {
    const existing = await readFile(outputPath, 'utf8');
    if (existing !== expected) {
      throw new Error(
        'Australian mosque directory is stale. Run node scripts/generate-australian-mosque-directory.mjs',
      );
    }
    console.log(
      `Australian mosque directory reproducibility passed: ${String(generated.source.recordCount)} records from OSM ${String(generated.source.osmBaseTimestamp)}.`,
    );
    return;
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, expected, 'utf8');
  console.log(
    `Generated ${String(generated.source.recordCount)} Australian mosque records from ${String(generated.source.rawElementCount)} OSM elements.`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
