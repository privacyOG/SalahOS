# Managed mosque announcements

## Purpose

This domain defines the local contract for mosque-managed announcements before remote persistence and notification delivery are introduced.

It keeps announcement composition, lifecycle validation and surface targeting deterministic and testable without coupling the model to a particular server, account provider or push-notification service.

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

## Priority and pinning

Priority and pinning are distinct fields.

- `priority` communicates elevated importance.
- `pinned` controls whether a presentation surface should keep the item prominent.

The domain does not decide the visual styling for either state.

## Target surfaces

Announcements explicitly target one or more of:

- mobile
- web
- managed display

At least one surface is required. Duplicate surface values are normalized away using deterministic mobile/web/display ordering.

## Recurrence

The first recurrence contract supports:

- none
- daily
- weekly

This is publication metadata only. Server-side expansion, timezone-aware scheduling and delivery retries remain later synchronization work.

## Preview

`previewMosqueAnnouncement` returns the normalized announcement, its current lifecycle state and non-blocking presentation warnings.

Current warnings include:

- English content missing
- Arabic content missing
- display-targeted announcement without an image

These warnings do not replace later phone/web/TV visual preview surfaces.

## Boundaries

This slice does not add:

- remote persistence
- authenticated publishing mutations
- media upload or processing
- notification delivery
- retry or deduplication logic
- concrete phone, web or TV preview UI

Those capabilities remain separate so managed publishing can be added without affecting account-free personal prayer use.
