# Multiple mosque profiles

**Author:** privacyOG

## Purpose

SalahOS can keep multiple public mosque profiles on one device without conflating mosque identity with a prayer timetable, display name, account, or remote service.

The feature builds on the stable `MosqueProfile` domain. Each profile is keyed by its canonical mosque ID, so two mosques may have similar names without overwriting one another and a mosque may rename its public display text without changing its stored identity.

## Local profile library

The versioned local profile library stores:

- zero or more validated `MosqueProfile` records;
- one optional selected profile ID.

Profile records retain the existing validated public metadata contract: bilingual name/description, address, coordinates, timezone, facilities, accessibility notes, public contact links and bounded logo metadata.

Profile IDs must be unique. The selected ID must reference a profile that exists in the same library. Removing the currently selected profile clears the selection rather than silently selecting another mosque.

## Import and export

The congregation profile manager accepts and exports a versioned SalahOS JSON bundle.

Imported content is treated as untrusted data. Every nested profile is structurally parsed and then passed back through `createMosqueProfile`, so the existing stable-ID, URL, timezone, coordinate, facility, contact and logo constraints remain authoritative. Invalid bundles fail closed and do not replace valid local data.

## Selection semantics

Selecting a mosque profile changes the local **community context** only. It does not silently:

- change the prayer calculation method;
- change the current coordinates used by the prayer engine;
- switch the prayer-source mode;
- select or rewrite a mosque timetable;
- enable notifications;
- create an account or remote subscription.

The Stage 33 community feed consumes the selected profile ID as an optional mosque filter. With no selected profile, published community content from all locally stored mosques is eligible. With a selected profile, only matching announcement/event content is shown.

The existing mosque timetable library remains a separate concern because a public profile and a dated prayer timetable have different lifecycles and provenance requirements.

## Native persistence

The mosque-profile-library key is part of the native application Preferences hydration allow-list, alongside settings, saved locations, mosque timetables, community content and the smart-display theme. Multiple profiles and the current selection therefore survive Android application restart without introducing network access.

## User interface

`MosqueProfilesPanel` provides a bilingual local manager that can:

- list multiple saved profiles;
- select one profile or the aggregate “All mosques” context;
- show public address, timezone, facilities and contact information;
- remove a profile;
- import/export the versioned local JSON library.

The panel is hidden in dedicated smart-display mode so management controls do not appear on unattended TV/kiosk presentation surfaces.

## Boundary

This stage does not implement remote mosque profile synchronization, administrator authentication, ownership claims, directory discovery or cloud backup. Those remain separate managed-platform features and must not become prerequisites for local prayer operation.
