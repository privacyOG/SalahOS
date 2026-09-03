# Australian mosque directory

SalahOS includes an offline-first Australian mosque and musalla directory so congregation discovery continues to work without requiring a live directory request. Core browsing, search, bundled nearby ordering and selection use committed application data rather than contacting OpenStreetMap, Overpass, Australian Mosque Finder, Google or another directory service at runtime.

## Sources, attribution and data boundary

The integrated directory combines two reviewed factual source snapshots:

- **OpenStreetMap contributors**, with OpenStreetMap-derived data distributed under the Open Database License (ODbL) 1.0; and
- **Australian Mosque Finder**, used as a factual organisation-directory source for mosque identity/location facts and explicitly published mosque-specific congregation information where present.

OpenStreetMap attribution and licence references remain attached to the combined catalogue and generated packs:

- OpenStreetMap copyright and attribution: <https://www.openstreetmap.org/copyright>
- Open Database License 1.0: <https://opendatacommons.org/licenses/odbl/1-0/>

The SalahOS source-code licence does not replace or relicense the bundled OpenStreetMap-derived data. The Australian Mosque Finder integration is limited to factual directory data and records its own source provenance separately from OpenStreetMap provenance.

The committed OpenStreetMap snapshot is `data/osm/australian-muslim-places-of-worship.overpass.json`. The legacy OSM-only generated catalogue is `src/data/australian-mosques.json`. The Australian Mosque Finder parsed snapshot is `src/data/australian-mosque-finder.json`, and the runtime integrated catalogue is `public/data/australian-mosques-combined.json`.

## Current integrated snapshot

The current combined catalogue contains **254 deduplicated records**.

The integration accounting is deliberately non-additive:

- OpenStreetMap integrated source: 106 records;
- Australian Mosque Finder successfully parsed: 176 of 178 sitemap pages;
- Finder-internal duplicate merges: 4 pairs;
- Finder records quarantined from geospatial integration because their published coordinates conflict with the stated location: 2;
- Finder records eligible for cross-source integration: 170;
- OSM/Finder cross-source identity merges: 22, consisting of 6 audited matches and 16 automatic evidence-scored matches; and
- final integrated directory: **254 records** (`106 + 170 - 22`).

The pipeline therefore never represents `106 + 176` as a unique-mosque count.

## Prayer starts, Sunrise and mosque-published congregation times

Selecting **Use mosque** makes that directory mosque the active location context for the Today prayer calculation without overwriting the user's separately saved personal location. Prayer starts remain calculated through the user's selected SalahOS calculation method, Asr convention, high-latitude rule and manual adjustments unless an explicit full local-mosque timetable mode is selected.

Australian Mosque Finder pages can contain two different classes of time data and SalahOS keeps them separate:

- the site's locality prayer calendar (Fajr, Sunrise, Dhuhr, Asr, Maghrib and Isha), which is not treated as a mosque Iqamah timetable; and
- mosque-specific daily congregation times stated in the listing details, which may be used as published Iqamah/Jama'ah context when explicitly present.

Sparse mosque-specific data is never promoted into a fake complete timetable. If a selected listing publishes a congregation time for a prayer, Today displays it; if it publishes multiple sessions, Today exposes the published sessions in source order. If no mosque-specific congregation time is published, Today says **Not published** rather than inventing an Iqamah.

Sunrise is always retained as a calculated solar boundary. It is displayed in the daily schedule as a **non-prayer time** marking **Fajr ends** and never becomes the current or next obligatory prayer.

## Deduplication and false-merge protection

The integration pipeline normalises naming/address evidence and uses one-to-one source matching. Known nearby-but-distinct venues are explicitly protected from false merging. A record is not merged merely because another mosque is physically close.

Six difficult cross-source pairs are handled through audited identity-backed matches. Automatic matches must satisfy the generator's identity/evidence rules. Two Finder records whose coordinates conflict with their stated locations are retained in source accounting but excluded from unsafe geospatial matching.

The shared directory service follows the same safety principle: proximity alone is not sufficient to classify a submitted mosque as a duplicate. Very-near records require compatible identity/name evidence unless an exact name or address rule applies.

## Provenance and quality metadata

Every integrated record retains `sourceRecordIds` and provenance entries. When an OSM and Australian Mosque Finder record are merged, both source identities remain represented rather than being replaced by an opaque canonical record.

Generated downloadable packs preserve the combined provenance and quality metadata. The pack set contains:

- one Australian country pack with all 254 records;
- regional packs for ACT, NSW, NT, QLD, SA, TAS, VIC and WA; and
- a global manifest that records the combined accounting and upstream-source metadata.

## Reproducible generation and CI

Refresh/regenerate the original OpenStreetMap source path with:

```sh
npm run mosques:australia:refresh
npm run mosques:australia:generate
npm run mosques:australia:check
```

Validate the committed Australian Mosque Finder snapshot and the combined directory with:

```sh
npm run mosques:australia:finder:check
npm run mosques:australia:combined:check
```

Generate or verify the deployable country/regional packs with:

```sh
npm run mosques:packs:generate
npm run mosques:packs:check
```

The combined and pack checks are part of the permanent repository quality gate. Pack check mode compares generated bytes with the tracked outputs, so a stale or missing pack fails CI rather than passing merely because temporary generation succeeded.

## Offline search, nearby ordering and selection

Bundled directory search is on-device. Nearby ordering uses the location already selected or permitted in SalahOS and local distance calculations; directory browsing does not require transmitting the user's prayer-calculation location to either upstream directory source.

Favouriting a directory mosque adds it to the followed-mosque library without activating it. **Use mosque** explicitly selects it for mosque context on Today. External directions and shared correction/report workflows are separate network-dependent actions and fail independently from local prayer calculation and bundled mosque discovery.

## Corrections and shared directory service

The combined catalogue also seeds the shared mosque directory service. Contributions are subject to duplicate checks, moderation and verification/claim state. Corrections should use the report/edit workflow rather than silently changing source identity or collapsing distinct nearby venues.

Directory identity/location facts and generic locality prayer calendars should not be represented as mosque-specific Iqamah. Only explicit mosque-published congregation information is surfaced as such; mosque administrators should still verify operational prayer/Iqamah/Jumu'ah data against the mosque's authoritative current source.
