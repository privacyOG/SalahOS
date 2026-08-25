import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'src', 'data', 'australian-mosques.json');
const publicRoot = path.join(root, 'public', 'mosque-packs');
const checkOnly = process.argv.includes('--check');

const REGION_LABELS = Object.freeze({
  'AU-ACT': 'Australian Capital Territory',
  'AU-NSW': 'New South Wales',
  'AU-NT': 'Northern Territory',
  'AU-QLD': 'Queensland',
  'AU-SA': 'South Australia',
  'AU-TAS': 'Tasmania',
  'AU-VIC': 'Victoria',
  'AU-WA': 'Western Australia',
});

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function fieldsFor(record) {
  const fields = ['name', 'address', 'coordinates'];
  if (record.nameAr) fields.push('aliases');
  if (record.phone) fields.push('phone');
  if (record.email) fields.push('email');
  if (record.website) fields.push('website');
  return fields;
}

function completenessFor(record) {
  const optional = [record.nameAr, record.phone, record.email, record.website];
  const present = 3 + optional.filter(Boolean).length;
  return Math.round((present / 12) * 100);
}

function packRecord(record, source) {
  const fields = fieldsFor(record);
  const completenessPercent = completenessFor(record);
  return {
    id: record.id,
    sourceRecordIds: [record.id],
    name: record.name,
    ...(record.nameAr ? { nameAr: record.nameAr, aliases: [record.nameAr] } : { aliases: [] }),
    address: {
      formatted: record.address,
      ...(record.state ? { region: record.state } : {}),
      regionCode: record.regionCode,
      ...(record.address.match(/\b\d{4}\b/u)?.[0]
        ? { postcode: record.address.match(/\b\d{4}\b/u)[0] }
        : {}),
      countryCode: 'AU',
    },
    coordinates: { latitude: record.latitude, longitude: record.longitude },
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
    verification: {
      state: 'unverified',
      verifiedAt: null,
      lastReviewedAt: source.osmBaseTimestamp,
    },
    provenance: [
      {
        sourceId: `osm:${record.osmType}:${String(record.osmId)}`,
        sourceKind: 'openstreetmap',
        sourceLabel: source.name,
        sourceUrl: `https://www.openstreetmap.org/${record.osmType}/${String(record.osmId)}`,
        observedAt: source.osmBaseTimestamp,
        confidence: 0.82,
        fields,
      },
    ],
    quality: {
      completenessPercent,
      provenanceCoveragePercent: 100,
      freshnessBasis: source.osmBaseTimestamp,
      conflictCount: 0,
    },
  };
}

function packDocument(packId, label, regionCode, records, source) {
  return {
    schemaVersion: 1,
    packId,
    label,
    countryCode: 'AU',
    ...(regionCode === null ? {} : { regionCode }),
    recordCount: records.length,
    generatedFrom: source.osmBaseTimestamp,
    source: {
      name: source.name,
      licence: source.licence,
      attributionUrl: source.attributionUrl,
      licenceUrl: source.licenceUrl,
    },
    records: records.map((record) => packRecord(record, source)),
  };
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function generate(targetRoot) {
  const raw = JSON.parse(await readFile(sourcePath, 'utf8'));
  assert(raw.schemaVersion === 1, 'Australian mosque source must use schema version 1');
  assert(Array.isArray(raw.records), 'Australian mosque source records must be an array');
  assert(raw.source?.recordCount === raw.records.length, 'Australian mosque source count mismatch');

  const ids = new Set(raw.records.map((record) => record.id));
  assert(ids.size === raw.records.length, 'Australian mosque source IDs must be unique');

  const regionCodes = Object.keys(REGION_LABELS);
  const regionPacks = regionCodes.map((regionCode) => {
    const records = raw.records.filter((record) => record.regionCode === regionCode);
    return {
      packId: regionCode.toLocaleLowerCase('en-AU'),
      label: REGION_LABELS[regionCode],
      regionCode,
      path: `/mosque-packs/au/${regionCode.toLocaleLowerCase('en-AU')}.json`,
      records,
    };
  });

  const partitionedIds = regionPacks.flatMap((pack) => pack.records.map((record) => record.id));
  assert(partitionedIds.length === raw.records.length, 'Regional packs must cover every AU record');
  assert(new Set(partitionedIds).size === raw.records.length, 'Regional packs must not overlap');

  const countryPath = '/mosque-packs/au/au.json';
  await writeJson(
    path.join(targetRoot, 'au', 'au.json'),
    packDocument('au', 'Australia', null, raw.records, raw.source),
  );
  for (const pack of regionPacks) {
    await writeJson(
      path.join(targetRoot, 'au', `${pack.regionCode.toLocaleLowerCase('en-AU')}.json`),
      packDocument(pack.packId, pack.label, pack.regionCode, pack.records, raw.source),
    );
  }

  const manifest = {
    schemaVersion: 1,
    scope: 'global',
    generatedFrom: raw.source.osmBaseTimestamp,
    recordCount: raw.records.length,
    countries: [
      {
        countryCode: 'AU',
        label: 'Australia',
        recordCount: raw.records.length,
        countryPack: countryPath,
        regions: regionPacks.map((pack) => ({
          regionCode: pack.regionCode,
          label: pack.label,
          recordCount: pack.records.length,
          path: pack.path,
        })),
      },
    ],
  };
  await writeJson(path.join(targetRoot, 'manifest.json'), manifest);
  return manifest;
}

let targetRoot = publicRoot;
if (checkOnly) targetRoot = await mkdtemp(path.join(tmpdir(), 'salahos-mosque-packs-'));

try {
  const manifest = await generate(targetRoot);
  assert(manifest.recordCount > 0, 'Mosque pack manifest must contain records');
  assert(manifest.countries[0]?.regions.length === 8, 'Australian pack manifest must contain 8 regions');
  console.log(
    `${checkOnly ? 'Validated' : 'Generated'} mosque directory packs: ${String(manifest.recordCount)} records, ${String(manifest.countries[0].regions.length)} AU regional packs.`,
  );
} finally {
  if (checkOnly) await rm(targetRoot, { recursive: true, force: true });
}
