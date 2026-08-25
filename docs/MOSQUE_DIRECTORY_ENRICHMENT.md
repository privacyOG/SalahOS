# Mosque directory enrichment

SalahOS v1.5 uses a canonical enrichment layer over the existing bundled OpenStreetMap catalogue and shared/community directory. The enrichment layer is deliberately source-aware: data is not treated as equally authoritative simply because two sources contain the same field.

## Canonical record

An enriched mosque record can carry:

- English/Arabic names and aliases;
- formatted address, locality, region, postcode and ISO country code;
- coordinates and IANA timezone when available;
- public phone, email, website and social links;
- published prayer-time summary and timetable source/link;
- one or more Jumu'ah times;
- facilities and community services;
- verification state and review timestamps;
- field-level provenance for every supplied field; and
- quality metrics covering completeness, provenance coverage, freshness and unresolved conflicts.

Missing data remains missing. SalahOS does not invent contact details, facilities, prayer times or verification state to make a record appear complete.

## Sources and provenance

Supported source classes are:

1. official mosque websites;
2. official mosque feeds;
3. verified organisation directories;
4. OpenStreetMap;
5. moderated community submissions; and
6. licensed place providers when their terms permit redistribution/use.

Each provenance entry records a stable source ID, source class, source label, optional source URL, observation timestamp, confidence and the exact fields supplied by that source.

The bundled Australian seed is attributed to OpenStreetMap contributors under ODbL 1.0. Its snapshot timestamp is the freshness basis for OSM-derived fields. Shared-directory records retain their community/OpenStreetMap source and existing claimed/verified/unverified state.

## Entity resolution and conflicts

`src/domain/mosqueDirectoryEnrichment.ts` scores potential matches using independent signals rather than name alone:

- physical proximity;
- normalized mosque name/aliases;
- normalized address;
- normalized public phone; and
- public website domain.

Records that cross the duplicate threshold can be merged field-by-field while retaining all source record IDs and provenance. The richer record is used as the primary representation, missing fields are filled from the secondary record, and meaningful address/phone/domain disagreement increases the conflict count instead of silently disappearing.

Claimed/verified status is preserved over an unverified duplicate, but it does not erase lower-trust source provenance.

## Data quality

Quality is a product signal, not an authority claim. The score combines:

- field completeness;
- provenance coverage;
- source freshness;
- verification state; and
- unresolved conflicts.

Freshness buckets are based on the most recent provenance observation:

- **Fresh:** up to 90 days;
- **Review soon:** over 90 days and up to one year;
- **Stale:** over one year; and
- **Unknown:** no valid observation timestamp.

The mosque cards surface verification/freshness and a compact data-quality score so stale or incomplete listings are not presented with false certainty.

## User actions

Bundled-directory cards support:

- select/use mosque;
- favourite/unfavourite using the existing persisted followed-mosque library;
- directions;
- call when a public phone exists;
- website when a public website exists;
- timetable when an authoritative timetable URL exists; and
- report/edit by moving into the existing shared-directory correction workflow.

Favouriting is separate from selecting the mosque used for prayer/timetable precedence.

## Downloadable packs

`scripts/generate-mosque-directory-packs.mjs` converts the vetted Australian snapshot into deployable static data during every production build.

The build exposes:

- `/mosque-packs/manifest.json` — a global pack index;
- `/mosque-packs/au/au.json` — all current Australian records; and
- `/mosque-packs/au/au-act.json`, `au-nsw.json`, `au-nt.json`, `au-qld.json`, `au-sa.json`, `au-tas.json`, `au-vic.json`, `au-wa.json` — regional packs.

The manifest is global in shape so additional countries can be added without changing the client contract. Only datasets with real source records are published; empty placeholder countries are not fabricated.

Each downloadable record includes source IDs, contact fields, empty-but-explicit prayer/Jumu'ah/facility/service collections when not known, verification metadata, provenance and quality metadata. Pack generation is deterministic and `npm run mosques:packs:check` verifies source count, unique IDs and exact regional partitioning in the Quality gate.

## Network and privacy behavior

The bundled catalogue, entity-resolution logic, favourites and downloaded pack parsing require no remote geolocation service. Distance sorting uses the already-resolved local location context. External directions, phone, website and timetable actions occur only when the user activates the corresponding action.
