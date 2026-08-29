from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f"Expected {label} was not found")
    return text.replace(old, new, 1)


server = Path("directory-service/server.mjs")
text = server.read_text()
text = replace_once(
    text,
    "const australianCataloguePath = resolve(repositoryRoot, 'src/data/australian-mosques.json');",
    "const australianCataloguePath = resolve(repositoryRoot, 'src/data/australian-mosques-combined.json');",
    "legacy directory-service source path",
)
start = text.index("async function seedDatabase() {")
end = text.index("\n\nasync function loadDatabase()", start)
seed = r"""async function seedDatabase() {
  const catalogue = JSON.parse(await readFile(australianCataloguePath, 'utf8'));
  if (
    catalogue.schemaVersion !== 2 ||
    !Array.isArray(catalogue.records) ||
    catalogue.source?.recordCount !== catalogue.records.length
  ) {
    throw new Error('Combined Australian mosque catalogue is invalid');
  }
  const updatedAt = catalogue.source.generatedAt ?? new Date().toISOString();
  const records = catalogue.records.map((record) => {
    if (
      typeof record.name !== 'string' ||
      typeof record.address?.formatted !== 'string' ||
      !coordinatesValid(record.latitude, record.longitude)
    ) {
      throw new Error(`Combined Australian mosque record is invalid: ${String(record.id)}`);
    }
    return {
      id: record.id,
      name: record.name,
      nameAr:
        record.aliases?.find(
          (alias) => typeof alias === 'string' && /[\u0600-\u06FF]/u.test(alias),
        ) ?? null,
      address: record.address.formatted,
      countryCode: 'AU',
      latitude: record.latitude,
      longitude: record.longitude,
      timeZone: stateTimeZones[record.address.region] ?? 'Australia/Sydney',
      website: record.contact?.website ?? null,
      phone: record.contact?.phone ?? null,
      source: record.sourceType ?? 'combined-directory',
      verification: { state: 'unverified', verifiedAt: null, claimedAt: null },
      revision: 1,
      updatedAt,
    };
  });
  return { schemaVersion: 1, records, contributions: [] };
}"""
server.write_text(text[:start] + seed + text[end:])

acceptance = Path("directory-service/server.acceptance.mjs")
text = acceptance.read_text()
moderator = "const moderatorToken = 'stage48-test-moderator';\n"
catalogue_check = """const combinedCatalogue = JSON.parse(
  await readFile(join(process.cwd(), 'src/data/australian-mosques-combined.json'), 'utf8'),
);
assert.equal(combinedCatalogue.schemaVersion, 2);
assert.ok(Array.isArray(combinedCatalogue.records));
assert.equal(combinedCatalogue.source?.recordCount, combinedCatalogue.records.length);
const expectedSeedCount = combinedCatalogue.records.length;
"""
text = replace_once(text, moderator, moderator + catalogue_check, "acceptance moderator anchor")
old_initial = """  assert.ok(initialSearch.body.some((record) => record.name === 'Adelaide Mosque'));

  const seededRecord = initialSearch.body[0];"""
new_initial = """  const seededRecord = initialSearch.body.find(
    (record) => record.id === 'osm-node-1614034144',
  );
  assert.ok(seededRecord, 'Expected audited Adelaide Mosque seed record');

  const seededDatabase = JSON.parse(await readFile(databasePath, 'utf8'));
  assert.equal(seededDatabase.records.length, expectedSeedCount);
  assert.equal(seededDatabase.contributions.length, 0);"""
text = replace_once(text, old_initial, new_initial, "acceptance Adelaide seed assertion")
text = replace_once(
    text,
    "  assert.ok(database.records.length >= 107);",
    "  assert.equal(database.records.length, expectedSeedCount + 1);",
    "acceptance final seed-count assertion",
)
acceptance.write_text(text)

package = Path("package.json")
text = package.read_text()
old_scripts = '    "mosques:australia:check": "node scripts/generate-australian-mosque-directory.mjs --check",\n'
new_scripts = (
    old_scripts
    + '    "mosques:australia:finder:check": "node scripts/generate-australian-mosque-finder.mjs",\n'
    + '    "mosques:australia:combined:check": "node scripts/generate-australian-mosque-combined.mjs --check",\n'
)
text = replace_once(text, old_scripts, new_scripts, "package Australian mosque script anchor")
text = replace_once(
    text,
    "npm run knowledge:content:check && npm run mosques:australia:check && npm run mosques:packs:check",
    "npm run knowledge:content:check && npm run mosques:australia:check && npm run mosques:australia:finder:check && npm run mosques:australia:combined:check && npm run mosques:packs:check",
    "package aggregate check anchor",
)
package.write_text(text)

ci = Path(".github/workflows/ci.yml")
text = ci.read_text()
text = replace_once(
    text,
    "      - name: Australian mosque directory reproducibility\n        run: npm run mosques:australia:check\n",
    "      - name: Australian mosque directory reproducibility\n        run: npm run mosques:australia:check && npm run mosques:australia:finder:check && npm run mosques:australia:combined:check\n",
    "CI Australian mosque reproducibility step",
)
ci.write_text(text)
