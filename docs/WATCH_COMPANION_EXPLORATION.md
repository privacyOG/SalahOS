# Wearable / watch companion exploration

**Author:** privacyOG

## Status and scope

This document completes the SalahOS Phase 2 wearable/watch **exploration** item. It defines an implementation-ready architecture and a shared data contract for future watchOS and Wear OS companions.

It does **not** claim that SalahOS currently ships a watchOS app, Wear OS app, Apple Watch complication, Wear OS Tile, or watch-face complication. Native wearable targets, emulator/device acceptance, store packaging and physical-watch battery/notification validation remain future implementation work.

## Product goal

A SalahOS watch companion should make the most useful prayer information available at a glance without recreating the full phone/settings experience on the wrist.

Recommended first release surfaces:

1. **Next-prayer complication** — prayer name and start time, with a compact countdown where the platform surface permits it.
2. **Daily-prayer glance surface** — WidgetKit/Smart Stack content on watchOS and a Tile on Wear OS showing the five obligatory prayers and optional Iqamah.
3. **Small companion app** — today's five prayers, next prayer, selected source and stale/offline state.
4. **Prayer notifications** — initially owned by the existing phone/native notification system to avoid duplicate delivery; watch-specific scheduling should be introduced only when a platform implementation can prove ownership and deduplication.

The watch should not become the primary place for calculation-method configuration, mosque administration, timetable editing, account management or display-fleet administration.

## Shared wearable snapshot contract

`src/domain/wearableCompanion.ts` defines version 1 of the platform-neutral payload that future native watch targets can consume.

The payload contains only:

- schema version;
- generation and stale-after UTC timestamps;
- selected Gregorian civil date;
- IANA timezone;
- locale tag;
- selected prayer source kind and display label;
- exactly five obligatory prayer rows in Fajr → Dhuhr → Asr → Maghrib → Isha order;
- absolute UTC prayer-start timestamps;
- optional absolute UTC Iqamah timestamps; and
- an independent next-prayer record, allowing tomorrow's Fajr to be represented after Isha.

The contract deliberately does **not** contain:

- latitude or longitude;
- GPS accuracy or movement data;
- saved-location libraries;
- account/session credentials;
- administrator tokens;
- managed-display pairing/device tokens;
- notification device tokens;
- analytics identifiers; or
- arbitrary exception/log payloads.

A wearable can therefore format times in the selected SalahOS timezone even when the watch itself is currently in another timezone, while receiving no precise coordinates.

## Data ownership and offline behavior

The preferred architecture is **offline-first with cached snapshots**.

The phone remains the easiest configuration surface and can produce the wearable snapshot whenever prayer source, timetable, timezone, date or relevant settings change. The watch stores its own last valid copy and continues displaying it while disconnected. `staleAfter` is explicit so a watch can show a stale-data state instead of silently presenting an old timetable as current.

A future network-capable watch implementation may refresh public mosque data directly where appropriate, but core calculated prayer use should not require an account or managed-masjid credentials.

The watch must not require continuous GPS polling. If a future standalone-watch mode calculates locally from watch location, it should use the same one-shot/minimised location principles as the phone application and store only what is necessary for prayer calculation.

## watchOS direction

Recommended first implementation:

- SwiftUI watchOS companion target;
- WidgetKit complication / accessory widget for next prayer;
- WidgetKit timeline entries generated ahead from the cached snapshot;
- Smart Stack widget for the next prayer and today's schedule;
- WatchConnectivity or equivalent paired-device transfer as an optimisation for phone-to-watch snapshot delivery; and
- local cache on the watch so complication/widget rendering never depends on a live phone round trip.

Apple documents WidgetKit timelines as the energy-efficient mechanism for watch widgets and complications. watchOS background execution is budgeted and can be delayed or throttled, so SalahOS must not promise second-perfect complication refreshes or depend on arbitrary background execution for prayer correctness.

A future watchOS implementation should generate timeline entries around known prayer boundaries rather than wake frequently to recompute a countdown. The full watch app can calculate a live countdown while foregrounded.

### watchOS references

- Apple WidgetKit: https://developer.apple.com/documentation/widgetkit/
- Creating accessory widgets and watch complications: https://developer.apple.com/documentation/widgetkit/creating-accessory-widgets-and-watch-complications
- watchOS background execution: https://developer.apple.com/documentation/watchkit/background-execution

## Wear OS direction

Recommended first implementation:

- standalone-capable Compose for Wear OS app;
- one Tile for next prayer plus today's five-prayer overview;
- complication data source for glanceable next-prayer information;
- local persistent cache shared by app/Tile/complication surfaces; and
- Android Data Layer synchronisation with the SalahOS phone app as an optimisation when the paired Android phone is available.

Google recommends offline-first behavior for Tiles and complications and warns against frequent automatic refresh because of battery cost. The Data Layer API is intended for local phone/watch communication and is not a primary network transport; it also does not work as the phone/watch bridge when a Wear OS watch is paired to an iPhone. Therefore the wearable architecture must remain functional without assuming Data Layer availability.

### Wear OS references

- Wear OS UI surfaces: https://developer.android.com/training/wearables/user-interfaces
- Wear OS complications: https://developer.android.com/training/wearables/complications
- Wear OS data synchronisation: https://developer.android.com/training/wearables/data/sync
- Wear OS battery guidance: https://developer.android.com/training/wearables/apps/power
- Standalone versus non-standalone apps: https://developer.android.com/training/wearables/apps/standalone-apps

## Notification ownership

The first native watch companions should **mirror the phone's notification outcome** rather than schedule a second independent copy of every prayer alert.

If watch-native scheduling is added later, it requires an explicit ownership model so only one device owns each logical notification job. The existing SalahOS stable prayer-notification identifiers and reconciliation principles should be reused rather than inventing a parallel duplicate scheduler.

Full Adhan recording playback should not be assumed on a watch. Any future wearable audio feature requires separate platform-policy, audio-session, battery and physical-device validation.

## Privacy and security boundary

Wearable support must preserve the existing SalahOS principles:

- no mandatory account for core calculated prayer use;
- no precise-location upload merely to show prayer times on a watch;
- no telemetry requirement;
- no administrator credentials stored on a public wrist device;
- no managed-display control surface on the watch in the first companion scope;
- explicit stale/offline presentation; and
- validated, versioned payloads before native code accepts changed data.

The shared snapshot contract is intentionally display-oriented rather than a copy of application settings or private storage.

## Recommended implementation sequence

### Phase W1 — shared contract — completed by this exploration

- Versioned wearable snapshot model.
- Validation and deterministic serialization tests.
- Privacy-minimised payload definition.
- Offline/staleness semantics.

### Phase W2 — Wear OS prototype

- New Android Wear module/target.
- Compose for Wear OS daily prayer screen.
- Tile and next-prayer complication data source.
- Persistent snapshot cache.
- Paired Android phone Data Layer synchronisation as an optional fast path.
- Wear OS emulator acceptance for round/square surfaces and offline restart.

### Phase W3 — watchOS prototype

- watchOS SwiftUI target in the iOS project.
- WidgetKit complication and Smart Stack widget.
- Cached snapshot storage and paired-phone transfer.
- Timeline generation across prayer boundaries and date rollover.
- Hosted Xcode Simulator acceptance before any physical-watch claim.

### Phase W4 — device and delivery validation

- Physical Apple Watch and Wear OS battery behavior.
- Complication/Tile refresh timing around prayer boundaries.
- Phone-disconnected operation.
- timezone travel behavior;
- notification ownership/deduplication;
- accessibility and large-text behavior; and
- signed store/distribution packaging.

## Exploration decision

**Proceed with wearable companions as a future native extension, using one shared versioned snapshot and offline-first rendering.**

The recommended product is not a miniature copy of the full SalahOS app. The primary wrist experience should be next prayer, today's obligatory prayers, optional Iqamah, source provenance and stale/offline status. Phone synchronization is an optimisation; the architecture must never make a live phone connection a prerequisite for displaying the last valid prayer schedule.
