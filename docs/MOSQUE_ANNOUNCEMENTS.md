# Managed mosque announcements

## Purpose

This domain defines the local contract for mosque-managed announcements while keeping remote persistence and notification delivery separate from personal prayer operation.

Announcement composition, lifecycle validation, surface targeting and congregation presentation remain deterministic and testable without coupling the model to a particular server, account provider or push-notification service.

## Content

An announcement may provide English content, Arabic content, or both. Each language is stored independently so one language is never synthesized from the other.

Each localized block contains:

- title
- body

At least one localized block is required.

Optional remote presentation metadata includes:

- image URL
- call-to-action URL

Remote URLs are limited to credential-free HTTP(S) locations.

## Lifecycle

The normalized announcement model supports these lifecycle states:

- `draft` — no publication start has been assigned
- `scheduled` — publication start is in the future
- `published` — publication window is active
- `expired` — publication end has been reached
- `archived` — explicitly removed from the active publishing lifecycle

Publication end, when supplied, must be later than publication start.

The congregation community feed exposes only `published` announcements for its target surface. Draft, scheduled, expired and archived content remains hidden.

## Priority and pinning

Priority and pinning are distinct fields.

- `priority` communicates elevated importance.
- `pinned` keeps the item prominent in the congregation feed.

Pinned items sort before non-pinned items; priority items sort before normal items within the same pinning group.

## Target surfaces

Announcements explicitly target one or more of:

- mobile
- web
- managed display

At least one surface is required. Duplicate surface values are normalized away using deterministic mobile/web/display ordering.

The current congregation panel consumes the `mobile` surface. Web and display targeting remain available to the existing preview/signage contracts and future synchronized publishing layers.

## Recurrence

The first recurrence contract supports:

- none
- daily
- weekly

This is publication metadata only. Server-side recurrence expansion, timezone-aware scheduling and delivery retries remain later synchronization work.

## Preview and congregation presentation

`previewMosqueAnnouncement` returns the normalized announcement, its current lifecycle state and non-blocking presentation warnings.

Current warnings include:

- English content missing
- Arabic content missing
- display-targeted announcement without an image

`CommunityPublishingPreview` provides phone, web and TV authoring previews. `CommunityUpdatesPanel` provides the live local congregation surface with locale fallback, lifecycle filtering, target-surface filtering, priority/pinning and safe external-link presentation.

## Local persistence and import/export

The congregation panel reads a versioned local community-content cache. Imported JSON is structurally parsed and passed through the same announcement validator before it is stored. Invalid bundles fail closed and do not replace valid local content.

On Android the community-content key is included in the native Preferences hydration allow-list, so the cache survives application restart just like prayer settings and mosque timetable data.

## Boundaries

This slice does not add:

- remote persistence or synchronization
- authenticated publishing mutations
- media upload or processing
- notification delivery
- retry or deduplication logic

Those capabilities remain separate so managed publishing can evolve without affecting account-free personal prayer use.
