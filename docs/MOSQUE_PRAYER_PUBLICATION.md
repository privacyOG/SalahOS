# Managed Mosque Prayer Publication

## Purpose

Stage 23 extends the managed mosque domain with an authoritative prayer-publication model while keeping the existing SalahOS prayer engine and normal personal use local-first.

This layer describes what a mosque intends to publish. It does not introduce authentication, remote synchronization, network calls, or a server dependency.

## Prayer-start sources

A managed mosque publication explicitly selects one prayer-start source:

- `calculated` — use the existing SalahOS calculation engine without mosque start-time overrides;
- `adjusted` — use calculated starts plus bounded per-prayer minute adjustments;
- `supplied` — publish complete mosque-supplied starts for Fajr, Dhuhr, Asr, Maghrib and Isha.

The publication model does not replace or reimplement prayer mathematics. Calculation remains owned by the existing engine.

## Iqamah

Each obligatory prayer may publish either:

- a fixed local civil time; or
- an offset from the resolved prayer start from 0 through 180 minutes.

Date and seasonal overrides may replace a configured Iqamah rule or explicitly clear it without mutating the base rule.

## Date-specific overrides

A date override is keyed by a valid Gregorian `YYYY-MM-DD` date and may contain:

- supplied prayer-start replacements for selected prayers;
- Iqamah replacements or removals;
- date-specific Jumu'ah sessions.

Only one override may exist for a civil date. The base publication remains unchanged.

## Seasonal rules

Seasonal rules have a stable rule ID plus inclusive start and end dates. They may change selected prayer starts and/or Iqamah rules.

Overlapping seasonal ranges are rejected during preview because an overlapping rule set would make publication precedence ambiguous. Date-specific overrides remain a distinct higher-specificity layer for a future resolver.

## Jumu'ah

A publication may contain up to ten default Jumu'ah sessions. Each session records:

- a label;
- khutbah local time;
- Salah local time.

Salah may not precede the khutbah. Duplicate session labels are rejected after normalization. A date override may publish a different session list for a specific date.

## Ramadan presentation

Optional Ramadan metadata can publish:

- Isha presentation time;
- Taraweeh presentation time and label;
- Suhur-end time;
- Imsak time;
- Iftar time.

The model validates civil-minute bounds and basic ordering invariants, including Taraweeh not preceding Isha and Imsak not following the configured Suhur end.

These are presentation fields. They do not redefine the astronomical prayer engine.

## Publish preview

`previewMosquePrayerPublication` is the mandatory domain validation boundary before a draft is made into a published revision.

It validates and normalizes:

- stable mosque identity;
- source-specific prayer configuration;
- adjustment bounds;
- civil times;
- Iqamah rules;
- Jumu'ah sessions;
- unique date overrides;
- non-overlapping seasonal rules;
- Ramadan presentation metadata.

The preview returns an immutable normalized publication and non-blocking warnings. Validation errors throw before a revision can be created.

## Immutable revisions and provenance

`createMosquePrayerPublicationRevision` creates an immutable publication revision with:

- revision ID;
- mosque ID;
- monotonically increasing sequence;
- previous revision ID;
- `changedBy` identity label;
- canonical UTC publication timestamp;
- bounded change summary describing what changed;
- immutable normalized publication content.

The domain stores provenance without deciding how an administrator is authenticated. Authentication and role enforcement belong to the later account/authorization stage.

## Rollback

Rollback never mutates or deletes history. `rollbackMosquePrayerPublication` creates a new revision whose publication content points to a prior revision and whose provenance points back to the current revision.

Cross-mosque rollback is rejected.

## Privacy and offline boundary

Creating, previewing, publishing or rolling back these domain objects:

- performs no network request;
- does not require a user account;
- does not modify personal calculation settings;
- does not change a user's selected local timetable automatically;
- does not upload precise device location;
- remains usable in offline tests and local runtime code.

A future synchronization layer may transport published revisions, but remote availability must not become a prerequisite for local SalahOS prayer calculation.
