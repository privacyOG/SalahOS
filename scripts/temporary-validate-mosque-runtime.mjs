import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const combined = await readJson('src/data/australian-mosques-combined.json');
const manifest = await readJson('public/mosque-packs/manifest.json');
const country = await readJson('public/mosque-packs/au/au.json');

assert.equal(combined.source.recordCount, combined.records.length);
assert.equal(manifest.recordCount, combined.records.length);
assert.equal(manifest.countries[0].recordCount, combined.records.length);
assert.equal(country.recordCount, combined.records.length);
assert.equal(country.records.length, combined.records.length);
assert.equal(manifest.countries[0].regions.length, 8);
assert.equal(
  manifest.countries[0].regions.reduce((sum, region) => sum + region.recordCount, 0),
  combined.records.length,
);

const combinedById = new Map(combined.records.map((record) => [record.id, record]));
for (const packed of country.records) {
  const source = combinedById.get(packed.id);
  assert.ok(source, `Packed record missing from combined source: ${packed.id}`);
  assert.deepEqual(packed.sourceRecordIds, source.sourceRecordIds);
  assert.deepEqual(packed.provenance, source.provenance);
  assert.deepEqual(packed.coordinates, {
    latitude: source.latitude,
    longitude: source.longitude,
  });
}

const merged = country.records.filter((record) => record.sourceType === 'merged');
assert.equal(merged.length, combined.source.mergedPairCount);
for (const record of merged) {
  const kinds = new Set(record.provenance.map((entry) => entry.sourceKind));
  assert.ok(kinds.has('openstreetmap'));
  assert.ok(kinds.has('organization-directory'));
}

console.log(
  `Validated combined runtime contract: ${String(country.records.length)} records, ${String(merged.length)} cross-source merges.`,
);
