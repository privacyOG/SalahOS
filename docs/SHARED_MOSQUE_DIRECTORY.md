# Shared/community mosque directory

Stage 48 adds an optional shared mosque directory without making network access a prerequisite for SalahOS prayer calculation or the preloaded Australian directory.

## Architecture

The feature has four deliberately separate layers:

1. `src/domain/sharedMosqueDirectory.ts` defines the public record, verification and moderation states, geographical search, duplicate detection and conversion into the existing `MosqueProfile` domain.
2. `src/platform/sharedMosqueDirectoryTransport.ts` is the only congregation-app network adapter for the shared directory. The repository remote-network policy explicitly reviews this adapter.
3. `src/platform/sharedMosqueDirectoryCache.ts` stores a bounded local cache of recently returned records plus a bounded contribution outbox. Selected/nearby results therefore remain useful when the service is unavailable.
4. `directory-service/server.mjs` is the reference self-hostable service. It persists records and contributions to a JSON database using atomic file replacement and seeds a new database from the Stage 47 Australian OpenStreetMap catalogue.

The preloaded Australian catalogue remains independent and fully offline. Shared-directory failure never removes the Stage 47 directory or the user's followed mosque library.

## Service API

The reference service exposes:

- `GET /api/v1/shared-mosques?q=&lat=&lon=&radiusKm=&limit=` for text and geographical lookup;
- `POST /api/v1/shared-mosques/submissions` for new-mosque submissions;
- `POST /api/v1/shared-mosques/:id/suggestions` for correction suggestions;
- `POST /api/v1/shared-mosques/:id/claims` for mosque claim requests;
- `POST /api/v1/shared-mosques/moderation/:contributionId` for an authorized moderator to approve or reject a pending contribution;
- `GET /health` for service health checks.

Run the service with:

```bash
SALAHOS_DIRECTORY_DB_PATH=/var/lib/salahos/shared-mosques.json \
SALAHOS_DIRECTORY_MODERATOR_TOKEN='replace-with-a-secret' \
npm run directory:serve
```

The congregation web/native shell defaults to same-origin `/api/v1/shared-mosques`. A deployment can set `VITE_SHARED_MOSQUE_DIRECTORY_URL` at build time when the service is hosted at a different reviewed endpoint.

## Moderation and verification

User contributions never directly overwrite public directory records. Submissions, edit suggestions and claims begin in `pending` state. The reference service applies public changes only after an authorized moderation decision.

Directory records expose one of three verification states:

- `unverified` — imported/community record with no SalahOS verification;
- `verified` — record details have been reviewed;
- `claimed` — the listing has an approved mosque claim. A successful claim also establishes verification.

The claim API stores only the submitted contact value in the moderation contribution. A production deployment should put authentication, identity verification, rate limiting, abuse controls and audit retention in front of the reference service before opening public write access.

## Duplicate handling

Both the client domain and service perform proximity-aware duplicate checks. A submission is treated as a likely duplicate when one of these conditions is met:

- normalized names match within 1 km;
- normalized addresses match within 250 m;
- coordinates are within 80 m regardless of text.

The server returns HTTP `409` with the likely existing mosque ID. Client-side checking gives immediate feedback, but the server remains authoritative.

## Offline behaviour and privacy

Normal shared-directory text search sends only the search text. Coordinates are sent only after the user explicitly chooses **Near me**, using the existing saved SalahOS location. Successful results are cached locally with a 200-record bound. Selecting a shared mosque prioritizes that record in the cache and upserts it into the same local followed-mosque library used elsewhere in SalahOS.

When the service is unreachable, text/nearby lookup operates against the cached records. New submissions, edit suggestions and claims can be retained in a bounded local outbox rather than discarded. Stage 48 does not implement unattended background transmission of that outbox; a future authenticated service can explicitly reconcile it.

## Verification

`npm run directory:test` starts the reference service against a temporary database and validates seeding, text search, duplicate rejection, submission moderation, edit moderation and claim-state transition. The Quality Gate runs this acceptance test.

The Stage 48 visual acceptance covers online search, explicit nearby ordering, selecting a shared mosque into the followed library, contribution flows, duplicate feedback, local caching, offline-cache search, RTL layout and mobile overflow.
