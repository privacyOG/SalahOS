# Polar prayer-time resolution research

## Scope

This note covers estimation strategies for locations and dates where normal sunrise, sunset or twilight events cannot be calculated because of polar-day or polar-night conditions. It is separate from the existing high-latitude night-fraction rules, which require usable sunset/sunrise night bounds.

The current SalahOS engine deliberately leaves an event unavailable when its astronomical prerequisite does not exist. This research does not change that default.

## Terminology

### Aqrab al-Bilad — nearest location / nearest latitude

A spatial estimation strategy. Prayer-related intervals are borrowed from the nearest or selected lower-latitude location where the required astronomical events are valid.

The pinned Adhan reference defines `AqrabBalad` as finding the closest location for which sunrise and sunset can be computed. Moonsighting.com describes an iterative form that decreases latitude while retaining longitude until sunset becomes computable. Its published higher-latitude policy also describes using 60° latitude as a practical reference in some circumstances.

### Aqrab al-Ayyam — nearest valid day

A temporal estimation strategy. The observer remains at the real coordinates, but times are derived from the nearest date on which the required astronomical events can be computed.

The pinned Adhan reference defines `AqrabYaum` as finding the closest date, forward or backward, for which sunrise and sunset can be computed. Moon Sighting UK describes the related nearest-day approach for Fajr/Isha as using the last day on which those times could be calculated normally.

## Distinction from existing high-latitude rules

SalahOS already implements:

- Middle of the Night
- One Seventh of the Night
- Angle Based portion of night

Those rules operate on an actual night bounded by sunset and sunrise. They cannot correctly resolve a true polar day or polar night when one or both bounds do not exist.

PrayTimes documents those three rules for persistent twilight and recommends its angle-based option for ordinary high-latitude adjustment, but it does not present them as a substitute for absent sunrise/sunset in polar-circle conditions.

The pinned Adhan reference therefore models polar-circle resolution separately from its `HighLatitudeRule` and defaults polar-circle resolution to `Unresolved`.

## Jurisprudential and product considerations

There is no single universally accepted estimation rule that SalahOS can safely apply without disclosure. Published approaches differ by institution and region. The Fiqh Council of North America also stresses that fixed twilight calculations themselves vary with latitude, season and observation conditions.

For a global application, the safest product behavior is:

1. Keep `Unresolved` as the initial/default polar behavior.
2. Never silently substitute a nearby latitude or another date.
3. If polar estimation is implemented, expose the selected strategy explicitly in settings and calculation provenance.
4. Treat local mosque or recognized local-authority timetables as an explicit user-selected source, not as a hidden calculation fallback.
5. Preserve the actual observer coordinates/date in output metadata even when a reference latitude/date is used for estimation.
6. State exactly which prayers/events were estimated and which reference coordinates or date were used.

## Proposed future engine model

A future polar-resolution setting should be independent of `HighLatitudeRule`:

- `unresolved`
- `nearest-latitude`
- `nearest-valid-day`

`unresolved` should remain the initial value.

### Nearest-latitude acceptance criteria

If implemented:

- Trigger only when the event needed by the selected prayer calculation is unavailable.
- Search toward a lower absolute latitude while preserving the observer longitude unless a documented method explicitly requires a different reference location.
- Use a deterministic search increment/tolerance and bounded search range.
- Stop at the nearest latitude where the required astronomical events exist.
- Do not mutate the user's stored location.
- Record the reference latitude, longitude, search distance/delta and strategy in provenance.
- Test both northern and southern polar cases.

A fixed 48° or 60° reference should not be hard-coded as a universal rule because published methods differ on the reference latitude and rationale.

### Nearest-valid-day acceptance criteria

If implemented:

- Trigger only when the event needed by the selected prayer calculation is unavailable.
- Search both backward and forward from the requested civil date.
- Select the closest valid date deterministically; define and test the tie-break rule when equidistant dates are valid.
- Retain the observer's real coordinates and timezone.
- Map the estimated clock time onto the requested civil date without pretending the astronomical event occurred on that date.
- Record the reference date, day offset and strategy in provenance.
- Bound the search and surface an explicit unavailable result if no valid reference date is found within the supported range.

## Recommendation for SalahOS

Research is sufficient to support both strategies as future **explicit opt-in polar estimations**, but not to justify changing the current default.

The implementation order should be:

1. Keep current `unresolved` behavior.
2. Add a separate polar-resolution type and provenance fields.
3. Implement and independently test nearest-valid-day and nearest-latitude as opt-in strategies.
4. Add bilingual UI disclosure explaining that the displayed values are estimates derived from another date or latitude.
5. Validate against the pinned Adhan implementation and documented external examples before enabling either strategy in production settings.

## Sources

- Pinned Adhan calculation-parameter guide (`a6f1a5c4a00105103f310ef18200b95f7184d2e7`): `https://github.com/batoulapps/adhan-js/blob/a6f1a5c4a00105103f310ef18200b95f7184d2e7/METHODS.md`
- PrayTimes calculation documentation: `https://praytimes.org/docs/calculation`
- PrayTimes manual: `https://praytimes.org/docs/manual-v2`
- Moonsighting.com calculation explanation: `https://www.moonsighting.com/how-we.html`
- Moonsighting.com prayer-time FAQ: `https://www.moonsighting.com/faq_pt.html`
- Moon Sighting UK prayer-time definitions: `https://www.moonsighting.org.uk/prayer/definitons.html`
- Fiqh Council of North America, calculation discussion: `https://fiqhcouncil.org/fifteen-or-eighteen-degrees-calculating-prayer-fasting-times-in-islam/`
