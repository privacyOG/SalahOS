from pathlib import Path

finder_path = Path('scripts/generate-australian-mosque-finder.mjs')
finder = finder_path.read_text()

old_filter = ".filter((url) => /^https:\\/\\/(?:www\\.)?mosque-finder\\.com\\.au\\/mosque\\/[^/]+\\/index\\.html$/iu.test(url))"
new_filter = ".filter((url) => /^https:\\/\\/(?:www\\.)?mosque-finder\\.com\\.au\\/mosque\\/[^/?#]+(?:\\/index\\.html|\\/?)$/iu.test(url))"
old_map = ".map((url) => url.replace('https://www.mosque-finder.com.au', BASE_URL));"
new_map = ".map((url) => { const normalized = url.replace('https://www.mosque-finder.com.au', BASE_URL).replace(/\\/+$/u, ''); return normalized.endsWith('/index.html') ? normalized : `${normalized}/index.html`; });"
if old_filter in finder:
    finder = finder.replace(old_filter, new_filter)
if old_map in finder:
    finder = finder.replace(old_map, new_map)

old_region_guard = "  for (const regionCode of Object.values(REGION_CODES)) {\n    assert(regions.has(regionCode), `Mosque Finder directory is missing ${regionCode}`);\n  }\n  return directory;"
new_region_guard = "  assert(regions.size > 0, 'Mosque Finder directory has no regional coverage');\n  const declaredRegions = new Set(directory.source.regionCodes ?? []);\n  assert(declaredRegions.size === regions.size && [...regions].every((regionCode) => declaredRegions.has(regionCode)), 'Mosque Finder regional coverage metadata mismatch');\n  const missingRegions = new Set(directory.source.missingRegionCodes ?? []);\n  for (const regionCode of Object.values(REGION_CODES)) assert(regions.has(regionCode) !== missingRegions.has(regionCode), `Mosque Finder missing-region metadata mismatch for ${regionCode}`);\n  return directory;"
if old_region_guard in finder:
    finder = finder.replace(old_region_guard, new_region_guard)

old_source_tail = "      failedRecordCount: failures.length,\n    },\n    records: sorted,"
new_source_tail = "      failedRecordCount: failures.length,\n      regionCodes: [...new Set(sorted.map((record) => record.address.regionCode))].sort(),\n      missingRegionCodes: Object.values(REGION_CODES).filter((regionCode) => !sorted.some((record) => record.address.regionCode === regionCode)),\n    },\n    records: sorted,"
if old_source_tail in finder:
    finder = finder.replace(old_source_tail, new_source_tail)

for expected in (new_filter, new_map, new_region_guard, new_source_tail):
    if expected not in finder:
        raise SystemExit('Finder importer patch did not reach its audited final form')
finder_path.write_text(finder)

combined_path = Path('scripts/generate-australian-mosque-combined.mjs')
combined = combined_path.read_text()
combined = combined.replace("const fields = ['name', 'address', 'coordinates'];", "const fields = ['name', 'aliases', 'address', 'coordinates'];")
if combined.count("const fields = ['name', 'aliases', 'address', 'coordinates'];") != 2:
    raise SystemExit('Expected exactly two provenance field declarations')

constants_marker = "]);\n\nfunction assert(condition, message) {"
if 'FINDER_DUPLICATE_GROUPS' not in combined:
    audited_constants = r'''

const FINDER_DUPLICATE_GROUPS = Object.freeze([
  Object.freeze({
    canonicalId: 'mosque-finder:minto-mosque',
    duplicateIds: Object.freeze(['mosque-finder:minto-suburban-islamic-centre-minto-masjid']),
    suppressDuplicateNameAliases: false,
  }),
  Object.freeze({
    canonicalId: 'mosque-finder:whyalla-morris-crescent-mosque-2',
    duplicateIds: Object.freeze(['mosque-finder:whyalla-morris-crescent-mosque']),
    suppressDuplicateNameAliases: false,
  }),
  Object.freeze({
    canonicalId: 'mosque-finder:parkholme-masjid-omar-bin-al-khattab',
    duplicateIds: Object.freeze(['mosque-finder:park-holme-masjid']),
    suppressDuplicateNameAliases: false,
  }),
  Object.freeze({
    canonicalId: 'mosque-finder:north-sydney-mcmahons-point-musalla',
    duplicateIds: Object.freeze(['mosque-finder:north-ryde-macquarie-university-musalla-2']),
    suppressDuplicateNameAliases: true,
  }),
]);

const FINDER_COORDINATE_EXCLUSIONS = Object.freeze(new Map([
  ['mosque-finder:north-ryde-macquarie-university-musalla', 'source coordinates resolve to Newcastle rather than Macquarie University, North Ryde'],
  ['mosque-finder:sydney-airport-prayer-room', 'source coordinates duplicate the separate Mascot Botany Road musalla rather than Sydney Airport T1'],
]));

const FORCED_MATCHES = Object.freeze(new Map([
  ['mosque-finder:adelaide-little-gilbert-street-mosque', 'osm-node-1614034144'],
  ['mosque-finder:minto-mosque', 'osm-node-2464887186'],
  ['mosque-finder:gilles-plains-abu-bakr-assiddiq-masjid', 'osm-node-13919243601'],
  ['mosque-finder:albanvale-station-road-deer-park-mosque', 'osm-way-1170477550'],
  ['mosque-finder:blacktown-afghan-osman-mosque', 'osm-node-4243973889'],
  ['mosque-finder:kensington-university-of-nsw-musalla', 'osm-node-7871916571'],
]));

const BLOCKED_MATCHES = Object.freeze(new Set([
  'osm-way-1190951588|mosque-finder:ashfield-liverpool-road-musalla',
  'osm-way-1126413889|mosque-finder:lakemba-islamic-centre',
  'osm-node-1614034144|mosque-finder:adelaide-islamic-information-centre-of-sa',
]));
'''
    if constants_marker not in combined:
        raise SystemExit('Unable to locate combined constants insertion point')
    combined = combined.replace(constants_marker, "]);" + audited_constants + "\nfunction assert(condition, message) {", 1)

score_start = combined.index('function matchScore(')
score_end = combined.index('\nfunction postcodeFrom', score_start)
score_function = r'''function scoreMatch(osm, finder) {
  if (osm.address.regionCode !== finder.address.regionCode) {
    return { score: 0, distanceKm: Number.POSITIVE_INFINITY, identitySignals: 0 };
  }
  const distance = distanceKm(osm, finder);
  if (distance > 1) return { score: 0, distanceKm: distance, identitySignals: 0 };

  let score = distance <= 0.08 ? 0.45 : distance <= 0.25 ? 0.34 : 0.18;
  let identitySignals = 0;
  const osmNames = unique([osm.name, ...(osm.aliases ?? [])]).map(normalize).filter(Boolean);
  const finderNames = unique([finder.name, ...(finder.aliases ?? [])]).map(normalize).filter(Boolean);
  const exactName = osmNames.some((left) => finderNames.includes(left));
  const nameInclusion = !exactName && osmNames.some((left) => finderNames.some((right) => left.includes(right) || right.includes(left)));
  if (exactName) {
    score += 0.35;
    identitySignals += 2;
  } else if (nameInclusion) {
    score += 0.2;
    identitySignals += 1;
  }

  const osmAddress = normalize(osm.address.formatted);
  const finderAddress = normalize(finder.address.formatted);
  const exactAddress = osmAddress !== '' && osmAddress === finderAddress;
  if (exactAddress) {
    score += 0.25;
    identitySignals += 2;
  }

  const osmPhone = normalizedPhone(osm.contact?.phone);
  const finderPhone = normalizedPhone(finder.contact?.phone);
  const exactPhone = osmPhone.length >= 8 && osmPhone === finderPhone;
  if (exactPhone) {
    score += 0.3;
    identitySignals += 3;
  }

  const osmDomain = normalizedDomain(osm.contact?.website);
  const finderDomain = normalizedDomain(finder.contact?.website);
  const exactDomain = osmDomain !== '' && osmDomain === finderDomain;
  if (exactDomain) {
    score += 0.3;
    identitySignals += 3;
  }
  return {
    score: Math.min(1, Number(score.toFixed(3))),
    distanceKm: distance,
    identitySignals,
    exactName,
    nameInclusion,
    exactAddress,
    exactPhone,
    exactDomain,
  };
}
'''
combined = combined[:score_start] + score_function + combined[score_end:]

merge_marker = 'function mergeMatched(osmRecord, finderRecord) {'
helper_start = combined.index(merge_marker)
if 'function dedupeFinderRecords(' not in combined:
    finder_helpers = r'''function mergeFinderDuplicate(primary, duplicate, suppressDuplicateNameAliases) {
  const duplicateNameAliases = suppressDuplicateNameAliases ? [] : [duplicate.name];
  const jumuahByKey = new Map(
    [...primary.jumuahTimes, ...duplicate.jumuahTimes].map((item) => [`${item.time}|${item.label ?? ''}`, item]),
  );
  const conflictCount =
    primary.conflictCount +
    duplicate.conflictCount +
    conflict(primary.address.formatted, duplicate.address.formatted) +
    conflict(primary.contact.phone, duplicate.contact.phone) +
    conflict(primary.contact.website, duplicate.contact.website) +
    (primary.prayerTimes !== null && duplicate.prayerTimes !== null && JSON.stringify(primary.prayerTimes) !== JSON.stringify(duplicate.prayerTimes) ? 1 : 0) +
    (primary.jumuahTimes.length > 0 && duplicate.jumuahTimes.length > 0 && JSON.stringify(primary.jumuahTimes) !== JSON.stringify(duplicate.jumuahTimes) ? 1 : 0);
  return withQuality({
    ...primary,
    sourceRecordIds: unique([...primary.sourceRecordIds, ...duplicate.sourceRecordIds]),
    aliases: unique([...primary.aliases, ...duplicate.aliases, ...duplicateNameAliases]),
    contact: {
      ...(primary.contact.phone ?? duplicate.contact.phone ? { phone: primary.contact.phone ?? duplicate.contact.phone } : {}),
      ...(primary.contact.email ?? duplicate.contact.email ? { email: primary.contact.email ?? duplicate.contact.email } : {}),
      ...(primary.contact.website ?? duplicate.contact.website ? { website: primary.contact.website ?? duplicate.contact.website } : {}),
      social: [],
    },
    prayerTimes: primary.prayerTimes ?? duplicate.prayerTimes,
    jumuahTimes: [...jumuahByKey.values()],
    facilities: unique([...primary.facilities, ...duplicate.facilities]),
    services: unique([...primary.services, ...duplicate.services]),
    provenance: [...primary.provenance, ...duplicate.provenance],
    conflictCount,
    ...(primary.featureLabels || duplicate.featureLabels
      ? { featureLabels: unique([...(primary.featureLabels ?? []), ...(duplicate.featureLabels ?? [])]) }
      : {}),
  });
}

function dedupeFinderRecords(records) {
  const byId = new Map(records.map((record) => [record.id, record]));
  const mergedDuplicateIds = new Set();
  const evidence = [];
  for (const group of FINDER_DUPLICATE_GROUPS) {
    let primary = byId.get(group.canonicalId);
    if (primary === undefined) continue;
    for (const duplicateId of group.duplicateIds) {
      const duplicate = byId.get(duplicateId);
      if (duplicate === undefined || mergedDuplicateIds.has(duplicateId)) continue;
      primary = mergeFinderDuplicate(primary, duplicate, group.suppressDuplicateNameAliases);
      mergedDuplicateIds.add(duplicateId);
      evidence.push({ canonicalId: group.canonicalId, duplicateId, matchType: 'audited-source-duplicate' });
    }
    byId.set(group.canonicalId, primary);
  }
  return {
    records: [...byId.values()].filter((record) => !mergedDuplicateIds.has(record.id)),
    evidence,
  };
}

'''
    combined = combined[:helper_start] + finder_helpers + combined[helper_start:]

validate_start = combined.index('function validateCombined(directory) {')
validate_end = combined.index('\nasync function generate()', validate_start)
validate_function = r'''function validateCombined(directory) {
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
    for (const excludedId of FINDER_COORDINATE_EXCLUSIONS.keys()) {
      assert(!record.sourceRecordIds.includes(excludedId), `Coordinate-quarantined record leaked into combined directory: ${excludedId}`);
    }
  }
  for (const region of REGION_CODES) assert(regions.has(region), `Combined directory missing ${region}`);
  assert(directory.source.mergedPairCount + directory.source.osmOnlyCount === directory.source.osmRecordCount, 'OSM merge accounting mismatch');
  assert(directory.source.mergedPairCount + directory.source.finderOnlyCount === directory.source.mosqueFinderRecordCount, 'Mosque Finder merge accounting mismatch');
  assert(directory.source.forcedMatchCount + directory.source.automaticMatchCount === directory.source.mergedPairCount, 'Cross-source match accounting mismatch');
  assert(
    directory.source.mosqueFinderRawRecordCount - directory.source.finderInternalMergedPairCount - directory.source.coordinateExcludedCount === directory.source.mosqueFinderRecordCount,
    'Mosque Finder preprocessing accounting mismatch',
  );
}
'''
combined = combined[:validate_start] + validate_function + combined[validate_end:]

generate_start = combined.index('async function generate() {')
generate_end = combined.index('\nasync function main()', generate_start)
generate_function = r'''async function generate() {
  const osm = JSON.parse(await readFile(osmPath, 'utf8'));
  const finder = JSON.parse(await readFile(finderPath, 'utf8'));
  validateSource(osm, finder);

  const osmRecords = osm.records.map((record) => fromOsm(record, osm.source));
  const mappedFinderRecords = finder.records.map((record) => fromFinder(record, finder.source));
  const finderDedup = dedupeFinderRecords(mappedFinderRecords);
  const coordinateExclusions = [];
  const finderRecords = finderDedup.records.filter((record) => {
    const reason = FINDER_COORDINATE_EXCLUSIONS.get(record.id);
    if (reason === undefined) return true;
    coordinateExclusions.push({ finderId: record.id, reason });
    return false;
  });

  const osmById = new Map(osmRecords.map((record) => [record.id, record]));
  const finderById = new Map(finderRecords.map((record) => [record.id, record]));
  const usedOsmIds = new Set();
  const usedFinderIds = new Set();
  const combined = [];
  const matchEvidence = [];

  for (const [finderId, osmId] of FORCED_MATCHES) {
    const finderRecord = finderById.get(finderId);
    const osmRecord = osmById.get(osmId);
    if (finderRecord === undefined || osmRecord === undefined) continue;
    assert(!BLOCKED_MATCHES.has(`${osmId}|${finderId}`), `Forced match is also blocked: ${osmId} / ${finderId}`);
    assert(!usedOsmIds.has(osmId) && !usedFinderIds.has(finderId), `Forced match reuses a record: ${osmId} / ${finderId}`);
    const evidence = scoreMatch(osmRecord, finderRecord);
    usedOsmIds.add(osmId);
    usedFinderIds.add(finderId);
    combined.push(mergeMatched(osmRecord, finderRecord));
    matchEvidence.push({
      osmId,
      finderId,
      matchType: 'audited-forced',
      score: evidence.score,
      distanceKm: Number(evidence.distanceKm.toFixed(3)),
      identitySignals: evidence.identitySignals,
    });
  }

  const candidates = [];
  for (const finderRecord of finderRecords) {
    if (usedFinderIds.has(finderRecord.id)) continue;
    for (const osmRecord of osmRecords) {
      if (usedOsmIds.has(osmRecord.id)) continue;
      if (BLOCKED_MATCHES.has(`${osmRecord.id}|${finderRecord.id}`)) continue;
      const evidence = scoreMatch(osmRecord, finderRecord);
      if (evidence.score < 0.65) continue;
      candidates.push({ osmRecord, finderRecord, evidence });
    }
  }
  candidates.sort((left, right) =>
    right.evidence.score - left.evidence.score ||
    right.evidence.identitySignals - left.evidence.identitySignals ||
    left.evidence.distanceKm - right.evidence.distanceKm ||
    left.osmRecord.id.localeCompare(right.osmRecord.id) ||
    left.finderRecord.id.localeCompare(right.finderRecord.id),
  );

  for (const candidate of candidates) {
    const { osmRecord, finderRecord, evidence } = candidate;
    if (usedOsmIds.has(osmRecord.id) || usedFinderIds.has(finderRecord.id)) continue;
    usedOsmIds.add(osmRecord.id);
    usedFinderIds.add(finderRecord.id);
    combined.push(mergeMatched(osmRecord, finderRecord));
    matchEvidence.push({
      osmId: osmRecord.id,
      finderId: finderRecord.id,
      matchType: 'automatic',
      score: evidence.score,
      distanceKm: Number(evidence.distanceKm.toFixed(3)),
      identitySignals: evidence.identitySignals,
    });
  }

  for (const record of finderRecords) if (!usedFinderIds.has(record.id)) combined.push(record);
  for (const record of osmRecords) if (!usedOsmIds.has(record.id)) combined.push(record);
  combined.sort((left, right) => left.name.localeCompare(right.name, 'en-AU', { sensitivity: 'base' }));

  const mergedPairCount = matchEvidence.length;
  const forcedMatchCount = matchEvidence.filter((entry) => entry.matchType === 'audited-forced').length;
  const automaticMatchCount = mergedPairCount - forcedMatchCount;
  const directory = {
    schemaVersion: 2,
    source: {
      name: 'SalahOS Australian mosque directory',
      generatedAt: finder.source.retrievedAt,
      recordCount: combined.length,
      regionCodes: REGION_CODES,
      osmRecordCount: osm.records.length,
      mosqueFinderRawRecordCount: finder.records.length,
      finderInternalMergedPairCount: finderDedup.evidence.length,
      coordinateExcludedCount: coordinateExclusions.length,
      mosqueFinderRecordCount: finderRecords.length,
      mergedPairCount,
      forcedMatchCount,
      automaticMatchCount,
      osmOnlyCount: osm.records.length - mergedPairCount,
      finderOnlyCount: finderRecords.length - mergedPairCount,
      finderInternalMergeEvidence: finderDedup.evidence,
      coordinateExclusions,
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
'''
combined = combined[:generate_start] + generate_function + combined[generate_end:]

required_fragments = [
    'FINDER_DUPLICATE_GROUPS',
    'FINDER_COORDINATE_EXCLUSIONS',
    'FORCED_MATCHES',
    'BLOCKED_MATCHES',
    'function dedupeFinderRecords(',
    "matchType: 'audited-forced'",
    'finderInternalMergedPairCount',
    'coordinateExcludedCount',
]
if any(fragment not in combined for fragment in required_fragments):
    raise SystemExit('Combined generator patch did not reach its audited final form')
combined_path.write_text(combined)
