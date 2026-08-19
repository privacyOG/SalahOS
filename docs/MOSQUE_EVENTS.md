# Managed Mosque Events

## Purpose

The managed mosque event domain provides a local, transport-independent contract for mosque events before any authenticated server mutation, notification delivery or concrete admin UI is connected.

It is designed for congregation mobile, public web and managed display surfaces while preserving the existing account-free personal prayer experience.

## Event content

An event supports independent English and Arabic content. Either language may be omitted, but at least one localized title and description must be supplied.

Each event also includes:

- a stable event identifier;
- a stable mosque identifier;
- a venue;
- timed or all-day scheduling;
- optional image metadata;
- optional external registration/information link;
- recurrence metadata;
- target surfaces.

External links are limited to credential-free HTTP(S) URLs.

## Scheduling

Timed events require ISO-8601 UTC start and end timestamps and the end must be later than the start.

All-day events use UTC-midnight boundaries so the domain has deterministic date semantics without depending on a device timezone. Presentation layers may map these boundaries into the mosque timezone when rendering the event.

Initial recurrence support is:

- none;
- daily;
- weekly.

More complex recurrence rules can be introduced later when the administrative scheduling UX and server persistence model are defined.

## Surface exposure

Events may target any combination of:

- congregation mobile;
- public web;
- managed display.

Target ordering is normalized and duplicate-free so consumers receive deterministic event metadata.

`upcomingMosqueEvents` filters ended events and returns remaining events in start-time order for congregation and signage presentation.

## Calendar compatibility

`mosqueEventCalendarEntry` produces a deterministic RFC 5545-style `VEVENT` fragment containing:

- UID;
- DTSTART;
- DTEND;
- summary;
- description;
- location;
- optional registration URL;
- optional daily/weekly recurrence rule.

Transport layers may wrap these entries in a `VCALENDAR` document or feed without changing the event domain itself.

## Boundary

This domain does not implement:

- authenticated event mutations;
- remote event persistence or synchronization;
- media upload or image processing;
- registration processing;
- payment handling;
- notification delivery;
- calendar subscription hosting;
- concrete phone, web or signage layouts.

Those capabilities are intentionally layered on top of the normalized event contract.
