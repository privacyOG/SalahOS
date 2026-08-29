import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const osmPath = path.join(root, 'src', 'data', 'australian-mosques.json');
const finderPath = path.join(root, 'src', 'data', 'australian-mosque-finder.json');
const outputPath = path.join(root, 'src', 'data', 'australian-mosques-combined.json');
const checkOnly = process.argv.includes('--check');

const REGION_CODES = Object.freeze([
  'AU-ACT',
  'AU-NSW',
  'AU-NT',
  'AU-QLD',
  'AU-SA',
  'AU-TAS',
  'AU-VIC',
  'AU-WA',
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function unique(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim().length > 0))];
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('en-AU')
    .replace(/\b(?:mosque|masjid|musalla|musallah|islamic|centre|center|prayer|room|jummah|jumuah)\b/gu, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/gu, ' ');
}

function normalizedPhone(value) {
  return String(value ?? '').replace(/\D/gu, '');
}

function normalizedDomain(value) {
  if (!value) return '';
  try {
    return new URL(value).hostname.replace(/^www\./u, '').toLocaleLowerCase('en-AU');
  } catch {
    return '';
  }
}

function radians(value) {
  return (value * Math.PI) / 180;
}

function distanceKm(left, right) {
  const latitudeDelta = radians(right.latitude - left.latitude);
  const longitudeDelta = radians(right.longitude - left.longitude);
  const leftLatitude = radians(left.latitude);
  const rightLatitude = radians(right.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 6_371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function matchScore(osm, finder) {
  if (osm.regionCode !== finder.address.regionCode) return 0;
  let score = 0;
  const distance = distanceKm(osm, finder);
  if (distance <= 0.08) score += 0.45;
  else if (distance <= 0.25) score += 0.34;
  else if (distance <= 1) score += 0.18;
  else return 0;

  const osmName = normalize(osm.name);
  const finderName = normalize(finder.name);
  if (osmName !== '' && osmName === finderName) score += 0.35;
  else if (osmName !== '' && finderName !== '' && (osmName.includes(finderName) || finderName.includes(osmName))) score += 0.2;

  const osmAddress = normalize(osm.address);
  const finderAddress = normalize(finder.address.formatted);
  if (osmAddress !== '' && osmAddress === finderAddress) score += 0.25;

  const osmPhone = normalizedPhone(osm.phone);
  const finderPhone = normalizedPhone(finder.contact?.phone);
  if (osmPhone.length >= 8 && osmPhone === finderPhone) score += 0.3;

  const osmDomain = normalizedDomain(osm.website);
  const finderDomain = normalizedDomain(finder.contact?.website);
  if (osmDomain !== '' && osmDomain === finderDomain) score += 0.3;
  return Math.min(1, Number(score.toFixed(3)));
}

function postcodeFrom(value) {
  return /\b\d{4}\b/u.exec(String(value ?? ''))?.[0] ?? null;
}

function osmFields(record) {
  const fields = ['name', 'address', 'coordinates'];
  if (record.nameAr) fields.push('aliases');
  if (record.phone) fields.push('phone');
  if (record.email) fields.push('email');
  if (record.website) fields.push('website');
  return fields;
}

function finderFields(record) {
  const fields = ['name', 'address', 'coordinates'];
  if (record.contact?.phone) fields.push('phone');
  if (record.contact?.email) fields.push('email');
  if (record.contact?.website) fields.push('website');
  if (record.prayerTimes) fields.push('prayer-times');
  if (record.jumuahTimes?.length) fields.push('jumuah-times');
  if (record.facilities?.length) fields.push('facilities');
  if (record.services?.length) fields.push('services');
  return fields;
}

function presentFieldCount(record) {
  return [
    record.name,
    record.aliases.length > 0,
    record.address.formatted,
    Number.isFinite(record.latitude) && Number.isFinite(record.longitude),
    record.contact.phone,
    record.contact.email,
    record.contact.website,
    false,
    record.prayerTimes !== null,
    record.jumuahTimes.length > 0,
    record.facilities.length > 0,
    record.services.length > 0,
  ].filter(Boolean).length;
}

function withQuality(record) {
  const present = presentFieldCount(record);
  const completenessPercent = Math.round((present / 12) * 100);
  const presentFields = new Set();
  if (record.name) presentFields.add('name');
  if (record.aliases.length) presentFields.add('aliases');
  if (record.address.formatted) presentFields.add('address');
  presentFields.add('coordinates');
  if (record.contact.phone) presentFields.add('phone');
  if (record.contact.email) presentFields.add('email');
  if (record.contact.website) presentFields.add('website');
  if (record.prayerTimes) presentFields.add('prayer-times');
  if (record.jumuahTimes.length) presentFields.add('jumuah-times');
  if (record.facilities.length) presentFields.add('facilities');
  if (record.services.length) presentFields.add('services');
  const covered = new Set(record.provenance.flatMap((entry) => entry.fields));
  const provenanceCoveragePercent = Math.round(
    ([...presentFields].filter((field) => covered.has(field)).length / Math.max(presentFields.size, 1)) * 100,
  );
  const latest = Math.max(...record.provenance.map((entry) => Date.parse(entry.observedAt)).filter(Number.isFinite));
  const ageDays = Number.isFinite(latest) ? Math.max(0, (Date.now() - latest) / 86_400_000) : Number.POSITIVE_INFINITY;
  const freshness = ageDays <= 90 ? 'fresh' : ageDays <= 365 ? 'aging' : Number.isFinite(ageDays) ? 'stale' : 'unknown';
  const freshnessWeight = freshness === 'fresh' ? 10 : freshness === 'aging' ? 5 : 0;
  const score = Math.max(0, Math.min(100, Math.round(completenessPercent * 0.45 + provenanceCoveragePercent * 0.25 + freshnessWeight - record.conflictCount * 8)));
  return {
    ...record,
    quality: { score, completenessPercent, provenanceCoveragePercent, freshness, conflictCount: record.conflictCount },
  };
}

function fromOsm(record, source) {
  const postcode = postcodeFrom(record.address);
  return withQuality({
    id: record.id,
    sourceRecordIds: [record.id],
    name: record.name,
    ...(record.nameAr ? { nameAr: record.nameAr } : {}),
    aliases: record.nameAr ? [record.nameAr] : [],
    address: {
      formatted: record.address,
      ...(record.state ? { region: record.state } : {}),
      regionCode: record.regionCode,
      ...(postcode ? { postcode } : {}),
      countryCode: 'AU',
    },
    latitude: record.latitude,
    longitude: record.longitude,
    contact: {
      ...(record.phone ? { phone: record.phone } : {}),
      ...(record.email ? { email: record.email } : {}),
      ...(record.website ? { website: record.website } : {}),
      social: [],
    },
    prayerTimes: null,
    jumuahTimes: [],
    facilities: [],
    services: [],
    verification: { state: 'unverified', verifiedAt: null, lastReviewedAt: source.osmBaseTimestamp },
    provenance: [{
      sourceId: `osm:${record.osmType}:${String(record.osmId)}`,
      sourceKind: 'openstreetmap',
      sourceLabel: source.name,
      sourceUrl: `https://www.openstreetmap.org/${record.osmType}/${String(record.osmId)}`,
      observedAt: source.osmBaseTimestamp,
      confidence: 0.82,
      fields: osmFields(record),
    }],
    conflictCount: 0,
    sourceType: 'openstreetmap',
  });
}

function fromFinder(record, source) {
  return withQuality({
    id: record.id,
    sourceRecordIds: [record.id],
    name: record.name,
    aliases: [],
    address: {
      formatted: record.address.formatted,
      locality: record.address.locality,
      region: record.address.state,
      regionCode: record.address.regionCode,
      ...(record.address.postcode ? { postcode: record.address.postcode } : {}),
      countryCode: 'AU',
    },
    latitude: record.latitude,
    longitude: record.longitude,
    contact: { ...(record.contact ?? {}), social: [] },
    prayerTimes: record.prayerTimes === null ? null : {
      ...record.prayerTimes,
      sourceLabel: source.name,
      updatedAt: record.observedAt,
    },
    jumuahTimes: record.jumuahTimes ?? [],
    facilities: record.facilities ?? [],
    services: record.services ?? [],
    verification: { state: 'unverified', verifiedAt: null, lastReviewedAt: record.observedAt },
    provenance: [{
      sourceId: record.id,
      sourceKind: 'organization-directory',
      sourceLabel: source.name,
      sourceUrl: record.sourceUrl,
      observedAt: record.observedAt,
      confidence: 0.86,
      fields: finderFields(record),
    }],
    conflictCount: 0,
    sourceType: 'australian-mosque-finder',
    ...(record.type ? { locationType: record.type } : {}),
    ...(record.features?.length ? { featureLabels: record.features } : {}),
  });
}

function conflict(left, right) {
  return left && right && normalize(left) !== normalize(right) ? 1 : 0;
}

function mergeMatched(osmRecord, finderRecord) {
  const conflictCount =
    conflict(osmRecord.address.formatted, finderRecord.address.formatted) +
    conflict(osmRecord.contact.phone, finderRecord.contact.phone) +
    conflict(osmRecord.contact.website, finderRecord.contact.website);
  return withQuality({
    ...osmRecord,
    id: osmRecord.id,
    sourceRecordIds: unique([...osmRecord.sourceRecordIds, ...finderRecord.sourceRecordIds]),
    name: finderRecord.name || osmRecord.name,
    ...(osmRecord.nameAr ? { nameAr: osmRecord.nameAr } : {}),
    aliases: unique([...osmRecord.aliases, ...finderRecord.aliases, osmRecord.name, finderRecord.name]),
    address: {
      ...osmRecord.address,
      ...finderRecord.address,
      regionCode: osmRecord.address.regionCode,
      countryCode: 'AU',
    },
    latitude: osmRecord.latitude,
    longitude: osmRecord.longitude,
    contact: {
      ...(finderRecord.contact.phone ?? osmRecord.contact.phone ? { phone: finderRecord.contact.phone ?? osmRecord.contact.phone } : {}),
      ...(finderRecord.contact.email ?? osmRecord.contact.email ? { email: finderRecord.contact.email ?? osmRecord.contact.email } : {}),
      ...(finderRecord.contact.website ?? osmRecord.contact.website ? { website: finderRecord.contact.website ?? osmRecord.contact.website } : {}),
      social: [],
    },
    prayerTimes: finderRecord.prayerTimes,
    jumuahTimes: finderRecord.jumuahTimes,
    facilities: unique([...osmRecord.facilities, ...finderRecord.facilities]),
    services: unique([...osmRecord.services, ...finderRecord.services]),
    verification: { state: 'unverified', verifiedAt: null, lastReviewedAt: finderRecord.verification.lastReviewedAt },
    provenance: [...osmRecord.provenance, ...finderRecord.provenance],
    conflictCount,
    sourceType: 'merged',
    ...(finderRecord.locationType ? { locationType: finderRecord.locationType } : {}),
    ...(finderRecord.featureLabels ? { featureLabels: finderRecord.featureLabels } : {}),
  });
}

function validateSource(osm, finder) {
  assert(osm.schemaVersion === 1 && Array.isArray(osm.records), 'OSM mosque source is invalid');
  assert(finder.schemaVersion === 1 && Array.isArray(finder.records), 'Australian Mosque Finder source is invalid');
  assert(osm.source.recordCount === osm.records.length, 'OSM record count mismatch');
  assert(finder.source.recordCount === finder.records.length, 'Mosque Finder record count mismatch');
}

function validateCombined(directory) {
  assert(directory.schemaVersion === 2, 'Combined Australian mosque directory must use schema version 2');
  assert(directory.source.recordCount === directory.records.length, 'Combined directory count mismatch');
  const ids = new Set();
  const regions = new Set();
  for (const record of directory.records) {
    assert(!ids.has(record.id), `Duplicate combined mosque ID ${record.id}`);
    ids.add(record.id);
    assert(REGION_CODES.includes(record.address.regionCode), `Invalid region for ${record.id}`);
    regions.add(record.address.regionCode);
    assert(Number.isFinite(record.latitude) && Number.isFinite(record.longitude), `Invalid coordinates for ${record.id}`);
    assert(record.provenance.length > 0, `Missing provenance for ${record.id}`);
    assert(record.quality.provenanceCoveragePercent === 100, `Incomplete provenance coverage for ${record.id}`);
  }
  for (const region of REGION_CODES) assert(regions.has(region), `Combined directory missing ${region}`);
  assert(directory.source.mergedPairCount + directory.source.osmOnlyCount === directory.source.osmRecordCount, 'OSM merge accounting mismatch');
  assert(directory.source.mergedPairCount + directory.source.finderOnlyCount === directory.source.mosqueFinderRecordCount, 'Mosque Finder merge accounting mismatch');
}

async function generate() {
  const osm = JSON.parse(await readFile(osmPath, 'utf8'));
  const finder = JSON.parse(await readFile(finderPath, 'utf8'));
  validateSource(osm, finder);

  const osmRecords = osm.records.map((record) => fromOsm(record, osm.source));
  const finderRecords = finder.records.map((record) => fromFinder(record, finder.source));
  const usedOsmIds = new Set();
  const combined = [];
  const matchEvidence = [];

  for (const finderRecord of finderRecords) {
    let best = null;
    for (let index = 0; index < osmRecords.length; index += 1) {
      const candidate = osmRecords[index];
      if (usedOsmIds.has(candidate.id)) continue;
      const score = matchScore(
        osm.records[index],
        finder.records.find((record) => record.id === finderRecord.id),
      );
      if (score < 0.65 || (best !== null && score <= best.score)) continue;
      best = { index, score };
    }
    if (best === null) {
      combined.push(finderRecord);
      continue;
    }
    const osmRecord = osmRecords[best.index];
    usedOsmIds.add(osmRecord.id);
    combined.push(mergeMatched(osmRecord, finderRecord));
    matchEvidence.push({
      osmId: osmRecord.id,
      finderId: finderRecord.id,
      score: best.score,
      distanceKm: Number(distanceKm(osmRecord, finderRecord).toFixed(3)),
    });
  }

  for (const record of osmRecords) if (!usedOsmIds.has(record.id)) combined.push(record);
  combined.sort((left, right) => left.name.localeCompare(right.name, 'en-AU', { sensitivity: 'base' }));
  const mergedPairCount = matchEvidence.length;
  const directory = {
    schemaVersion: 2,
    source: {
      name: 'SalahOS Australian mosque directory',
      generatedAt: finder.source.retrievedAt,
      recordCount: combined.length,
      regionCodes: REGION_CODES,
      osmRecordCount: osm.records.length,
      mosqueFinderRecordCount: finder.records.length,
      mergedPairCount,
      osmOnlyCount: osm.records.length - mergedPairCount,
      finderOnlyCount: finder.records.length - mergedPairCount,
      sources: [
        {
          name: osm.source.name,
          sourceKind: 'openstreetmap',
          licence: osm.source.licence,
          attributionUrl: osm.source.attributionUrl,
          licenceUrl: osm.source.licenceUrl,
          observedAt: osm.source.osmBaseTimestamp,
        },
        {
          name: finder.source.name,
          sourceKind: 'organization-directory',
          attributionUrl: finder.source.baseUrl,
          observedAt: finder.source.retrievedAt,
          factsOnly: true,
        },
      ],
      matchEvidence,
    },
    records: combined,
  };
  validateCombined(directory);
  return directory;
}

async function main() {
  const directory = await generate();
  if (checkOnly) {
    const existing = JSON.parse(await readFile(outputPath, 'utf8'));
    const normalizeForCheck = (value) => {
      const copy = structuredClone(value);
      delete copy.source.generatedAt;
      for (const source of copy.source.sources) delete source.observedAt;
      for (const record of copy.records) {
        if (record.prayerTimes) delete record.prayerTimes.updatedAt;
        if (record.verification) record.verification.lastReviewedAt = null;
        for (const provenance of record.provenance) provenance.observedAt = '';
        if (record.quality) record.quality.freshness = 'unknown';
      }
      return copy;
    };
    assert(
      JSON.stringify(normalizeForCheck(existing)) === JSON.stringify(normalizeForCheck(directory)),
      'Combined Australian mosque directory is stale; regenerate it',
    );
    console.log(`Validated combined Australian mosque directory: ${String(directory.records.length)} records.`);
    return;
  }
  await writeFile(outputPath, `${JSON.stringify(directory, null, 2)}\n`, 'utf8');
  console.log(
    `Generated combined Australian mosque directory: ${String(directory.records.length)} records (${String(directory.source.mergedPairCount)} merged, ${String(directory.source.finderOnlyCount)} Mosque Finder only, ${String(directory.source.osmOnlyCount)} OSM only).`,
  );
}

await main();
