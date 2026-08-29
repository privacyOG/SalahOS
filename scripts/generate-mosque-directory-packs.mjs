import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { format, resolveConfig } from 'prettier';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'src', 'data', 'australian-mosques-combined.json');
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

function packRecord(record) {
  const { latitude, longitude, ...recordFields } = record;
  return {
    ...recordFields,
    coordinates: { latitude, longitude },
  };
}

function packSource(source) {
  const osmSource = source.sources.find((entry) => entry.sourceKind === 'openstreetmap');
  return {
    name: source.name,
    licence: osmSource?.licence ?? null,
    attributionUrl: osmSource?.attributionUrl ?? null,
    licenceUrl: osmSource?.licenceUrl ?? null,
    upstreamSources: source.sources,
    accounting: {
      osmRecordCount: source.osmRecordCount,
      mosqueFinderRawRecordCount: source.mosqueFinderRawRecordCount,
      finderInternalMergedPairCount: source.finderInternalMergedPairCount,
      coordinateExcludedCount: source.coordinateExcludedCount,
      mosqueFinderRecordCount: source.mosqueFinderRecordCount,
      mergedPairCount: source.mergedPairCount,
      forcedMatchCount: source.forcedMatchCount,
      automaticMatchCount: source.automaticMatchCount,
      osmOnlyCount: source.osmOnlyCount,
      finderOnlyCount: source.finderOnlyCount,
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
    generatedFrom: source.generatedAt,
    source: packSource(source),
    records: records.map(packRecord),
  };
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const prettierConfig = (await resolveConfig(path.join(root, '.prettierrc.json'))) ?? {};
  const formatted = await format(JSON.stringify(value), {
    ...prettierConfig,
    parser: 'json',
  });
  await writeFile(filePath, formatted, 'utf8');
}

function outputRelativePaths() {
  return [
    'manifest.json',
    'au/au.json',
    ...Object.keys(REGION_LABELS).map(
      (regionCode) => `au/${regionCode.toLocaleLowerCase('en-AU')}.json`,
    ),
  ];
}

async function assertPersistedOutputsMatch(generatedRoot) {
  for (const relativePath of outputRelativePaths()) {
    const generated = await readFile(path.join(generatedRoot, relativePath), 'utf8');
    let persisted;
    try {
      persisted = await readFile(path.join(publicRoot, relativePath), 'utf8');
    } catch (error) {
      if (error?.code === 'ENOENT') {
        throw new Error(`Mosque directory pack is missing: ${relativePath}`);
      }
      throw error;
    }
    assert(persisted === generated, `Mosque directory pack is stale: ${relativePath}`);
  }
}

function validateCombinedSource(raw) {
  assert(raw.schemaVersion === 2, 'Combined Australian mosque source must use schema version 2');
  assert(Array.isArray(raw.records), 'Combined Australian mosque records must be an array');
  assert(
    raw.source?.recordCount === raw.records.length,
    'Combined Australian mosque count mismatch',
  );
  assert(
    Array.isArray(raw.source?.sources),
    'Combined Australian mosque upstream sources are required',
  );
  assert(
    raw.source.sources.some((source) => source.sourceKind === 'openstreetmap'),
    'Combined Australian mosque source must preserve OpenStreetMap attribution',
  );
  assert(
    raw.source.sources.some((source) => source.sourceKind === 'organization-directory'),
    'Combined Australian mosque source must preserve Australian Mosque Finder provenance',
  );
  assert(
    raw.source.osmRecordCount + raw.source.mosqueFinderRecordCount - raw.source.mergedPairCount ===
      raw.records.length,
    'Combined Australian mosque deduplication accounting mismatch',
  );

  const ids = new Set();
  for (const record of raw.records) {
    assert(typeof record.id === 'string' && record.id.length > 0, 'Mosque record ID is required');
    assert(!ids.has(record.id), `Combined Australian mosque ID must be unique: ${record.id}`);
    ids.add(record.id);
    assert(
      Object.hasOwn(REGION_LABELS, record.address?.regionCode),
      `Mosque record ${record.id} has an unsupported region code`,
    );
    assert(Number.isFinite(record.latitude), `Mosque record ${record.id} latitude is invalid`);
    assert(Number.isFinite(record.longitude), `Mosque record ${record.id} longitude is invalid`);
    assert(
      Array.isArray(record.sourceRecordIds) && record.sourceRecordIds.length > 0,
      `Mosque record ${record.id} must preserve source record IDs`,
    );
    assert(
      Array.isArray(record.provenance) && record.provenance.length > 0,
      `Mosque record ${record.id} must preserve provenance`,
    );
    const provenanceIds = new Set(record.provenance.map((entry) => entry.sourceId));
    assert(
      record.provenance.every(
        (entry) =>
          typeof entry.sourceId === 'string' &&
          typeof entry.sourceKind === 'string' &&
          typeof entry.sourceLabel === 'string' &&
          typeof entry.sourceUrl === 'string',
      ),
      `Mosque record ${record.id} has incomplete provenance`,
    );
    if (record.sourceType === 'merged') {
      const sourceKinds = new Set(record.provenance.map((entry) => entry.sourceKind));
      assert(
        sourceKinds.has('openstreetmap') && sourceKinds.has('organization-directory'),
        `Merged mosque record ${record.id} must preserve both upstream sources`,
      );
      assert(
        record.sourceRecordIds.length >= 2,
        `Merged mosque record ${record.id} lost source IDs`,
      );
    }
    assert(
      provenanceIds.size === record.provenance.length,
      `Mosque record ${record.id} repeats provenance`,
    );
  }
}

async function generate(targetRoot) {
  const raw = JSON.parse(await readFile(sourcePath, 'utf8'));
  validateCombinedSource(raw);

  const regionCodes = Object.keys(REGION_LABELS);
  const regionPacks = regionCodes.map((regionCode) => {
    const records = raw.records.filter((record) => record.address.regionCode === regionCode);
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
    generatedFrom: raw.source.generatedAt,
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
  assert(
    manifest.countries[0]?.regions.length === 8,
    'Australian pack manifest must contain 8 regions',
  );
  assert(
    manifest.countries[0].regions.reduce((total, region) => total + region.recordCount, 0) ===
      manifest.recordCount,
    'Australian regional pack counts must equal the country record count',
  );
  if (checkOnly) await assertPersistedOutputsMatch(targetRoot);
  console.log(
    `${checkOnly ? 'Validated' : 'Generated'} mosque directory packs: ${String(manifest.recordCount)} records, ${String(manifest.countries[0].regions.length)} AU regional packs.`,
  );
} finally {
  if (checkOnly) await rm(targetRoot, { recursive: true, force: true });
}
