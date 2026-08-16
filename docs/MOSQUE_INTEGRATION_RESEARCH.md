# Mosque timetable integration research

SalahOS treats mosque-provided prayer times as a distinct authoritative source. Optional remote integrations must preserve that provenance and must not depend on undocumented scraping or assume that public web visibility grants a stable machine interface.

## Selection criteria

A remote mosque integration is eligible for implementation only when all of the following are true:

- the provider or mosque explicitly offers a machine-readable integration path;
- authentication and access requirements are documented or explicitly authorized;
- the interface can provide enough structured data to distinguish prayer start from Iqamah/Jama'ah where available;
- Friday/Jumu'ah data can remain independent from astronomical Dhuhr when the provider exposes it;
- returned data can be validated before activation and cached locally for offline use;
- the provider's terms permit the intended use;
- failures never silently fall back to a different mosque or calculated source while still being labelled as mosque data.

## MAWAQIT

MAWAQIT is a strong future candidate because the provider maintains an official home-automation integration repository under the `mawaqit` organization. Its published setup requires a MAWAQIT account, searches for nearby MAWAQIT mosques from GPS coordinates, lets the user select a mosque, and exposes the five prayer times, five Iqamah values, Shuruq and Jumu'ah data.

Primary source:

- https://github.com/mawaqit/home-assistant

This demonstrates an officially maintained integration surface, but this research did not identify a stable public API contract and usage policy that SalahOS should hard-code directly. Therefore no direct MAWAQIT network adapter is shipped yet.

Before implementation, SalahOS must obtain or verify a documented provider-supported interface, authentication flow, versioning expectations, rate limits and permitted redistribution/cache behaviour. Credentials must never be embedded in client builds or committed to the repository.

Status: **vetted candidate; implementation gated on documented or explicitly authorized provider access.**

## Masjidbox

Masjidbox explicitly states that it does not provide a public prayer-times API. Its supported portability paths are iCal subscriptions and CSV/Excel exports, including Athan and Iqamah data.

Primary sources:

- https://support.masjidbox.com/does-masjidbox-have-a-public-api-for-prayer-times-sfnfd
- https://support.masjidbox.com/how-to-set-your-prayer-times-ltlkl

SalahOS already supports validated CSV timetable import, so Masjidbox export files can be handled through the user-controlled import path after confirming the exported columns match the documented SalahOS schema or are transformed explicitly by the user. A future iCal importer is reasonable only if it can map events deterministically into the SalahOS timetable model and clearly identify unsupported fields.

SalahOS must not scrape Masjidbox pages or reverse-engineer a private endpoint merely to simulate a public API.

Status: **supported conceptually through provider-approved export/subscription paths; no direct API adapter.**

## Integration architecture requirements

Any future remote provider adapter should terminate at the existing `MosqueTimetable` model rather than introducing provider-specific prayer data into the dashboard. The adapter should:

1. fetch provider data only after explicit user configuration;
2. map provider fields into a candidate `MosqueTimetable`;
3. validate the complete timetable before activation;
4. record provider identity, mosque identity and last successful sync time separately from astronomical calculation provenance;
5. save the last validated timetable locally for offline use;
6. retain the previous validated copy when a refresh fails;
7. surface stale/error state to the user instead of silently replacing mosque data with calculated values;
8. keep provider credentials outside exported timetable data.

## Decision

Research is complete for the current stage. The approved near-term paths are:

- continue using manual, CSV and JSON timetable entry as the stable offline baseline;
- accept provider-approved export/subscription mechanisms where they can be mapped and validated explicitly;
- treat MAWAQIT as a high-value future direct integration candidate once a provider-supported contract is confirmed;
- do not ship arbitrary website scraping or undocumented private-endpoint dependencies.

No remote provider integration is marked implemented by this document.
