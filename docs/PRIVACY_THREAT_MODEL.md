# SalahOS privacy and threat model

## Purpose

SalahOS handles information that can reveal a person's location, daily routine, mosque attendance preferences and notification schedule. The core design therefore treats precise location and religious-practice configuration as sensitive local data even when those values are not account credentials.

This document defines the privacy boundary for the shared application and the requirements that future platform-specific shells and optional remote integrations must preserve.

## Security and privacy goals

SalahOS should:

- calculate prayer times locally by default;
- work without a mandatory account for core prayer-time functionality;
- request location only after an explicit user action or platform permission flow;
- store only the location/configuration needed for user-requested features;
- avoid analytics, behavioural profiling and unnecessary telemetry;
- keep mosque timetable, notification and Adhan preferences local unless the user explicitly configures a remote provider;
- validate imported or remotely supplied timetable data before activation;
- avoid exposing precise coordinates, mosque choices or schedules through logs, URLs or repository artifacts;
- keep secrets, signing material and provider credentials out of source control and exported user settings;
- make remote-data provenance and failure state visible rather than silently substituting another source.

## Sensitive data inventory

### Precise location

Latitude/longitude can reveal a home, workplace, place of worship or habitual travel pattern. Saved location labels can make that inference more direct.

Required controls:

- location permission is opt-in;
- manual coordinates remain available as an alternative to device location access;
- prayer calculation runs locally once coordinates are available;
- coordinates must not be placed in ordinary diagnostic logs, analytics events or public URLs;
- remote integrations must not receive precise coordinates unless the provider genuinely needs them for a feature the user selected.

### Mosque selection and timetable data

A selected mosque may reveal religious affiliation, neighbourhood and routine. Imported timetable files may also contain user-created labels.

Required controls:

- mosque data stays in local application storage by default;
- imported data is parsed and structurally validated before activation;
- arbitrary website scraping is not an approved source mechanism;
- a remote provider must be explicitly configured and its returned mosque identity/provenance preserved;
- a failed provider refresh must not silently send the user to another mosque or calculated source while retaining a mosque-source label.

### Prayer and notification preferences

Per-prayer reminders, Adhan preferences and Iqamah configuration can reveal daily religious practice and expected activity times.

Required controls:

- preferences are local by default;
- exported settings are user-initiated;
- notification payloads should contain only the minimum information needed by the target platform;
- future remote notification services require a separate privacy review before use.

### Local Adhan audio

A user-selected local recording may contain personal metadata or copyrighted content.

Required controls:

- local files must not be uploaded merely because they were selected for playback;
- local files must not become repository, example or release assets automatically;
- bundled recordings require documented redistribution rights under the separate Adhan audio-rights policy.

### Credentials and signing material

Provider tokens, signing keys, certificates and account secrets are high-impact confidential data.

Required controls:

- never commit credentials or private signing material;
- use platform secret stores, environment injection or local developer configuration as appropriate;
- never include provider credentials in exported SalahOS settings or mosque timetable files;
- redact credentials from errors and diagnostic output.

## Trust boundaries

### Local calculation boundary

The prayer engine, timezone resolution, Hijri presentation, source selection and timetable validation are intended to execute locally. These components must not require a network request merely to calculate the current prayer schedule.

### Browser and operating-system boundary

Browser/device location, notification delivery, audio playback, persistent storage and background execution are controlled partly by the host platform. SalahOS must request only the permissions required for enabled features and must describe platform limitations accurately.

### Optional remote-provider boundary

A configured mosque/provider integration is outside the local trust boundary. Before sending data or accepting a timetable, an adapter must define:

- provider identity and purpose;
- exact data transmitted;
- authentication method;
- retention/caching behaviour;
- rate and failure behaviour;
- data validation rules;
- how the user disconnects the provider and removes locally cached provider state.

Provider responses are untrusted input until validated.

### Imported-file boundary

CSV/JSON and future supported timetable formats are untrusted user input. Parsing must reject malformed structures, invalid dates/times, duplicate keys/dates where prohibited and unsupported schema versions before data becomes active.

## Threats and mitigations

### Unintended location disclosure

Threat: coordinates appear in remote requests, logs, URLs, crash reports or telemetry.

Mitigation: local calculation by default, no unnecessary telemetry, explicit remote-provider contracts and logging rules that avoid precise-location fields.

### Excessive permission collection

Threat: platform shells request location, notification, background or media permissions before the user needs them.

Mitigation: request capabilities just in time and keep manual/offline alternatives available where practical.

### Malicious or malformed timetable input

Threat: imported/provider data produces invalid schedules, misleading mosque attribution or parser failures.

Mitigation: strict structural/domain validation and activation only after complete validation succeeds.

### Silent source substitution

Threat: a failed mosque source is replaced with calculated data while the interface still implies the mosque supplied it.

Mitigation: source-aware models reject silent fallback and surface unavailable/stale state explicitly.

### Credential leakage

Threat: provider credentials or signing secrets enter commits, settings exports or logs.

Mitigation: repository exclusion, secret injection, redaction and separate credential storage.

### Cross-site or script compromise in the web target

Threat: injected script reads locally stored location/preferences or changes displayed prayer times.

Mitigation requirements for the web/PWA target include dependency review, a restrictive Content Security Policy where deployable, same-origin asset/service-worker rules and avoiding unnecessary third-party scripts.

### Service-worker cache confusion

Threat: stale application code or assets remain active after an upgrade.

Mitigation: versioned caches, explicit cache migration/cleanup and real-browser upgrade testing before claiming upgrade behaviour complete.

### Misleading notification guarantees

Threat: users assume prayer alerts or Adhan delivery are guaranteed despite operating-system restrictions.

Mitigation: deterministic schedule intent is kept separate from platform delivery; limitations are documented and delivery claims remain partial until target-platform adapters are verified.

### Screen privacy

Threat: a shared TV/kiosk reveals saved location labels, precise coordinates or settings not needed for public display.

Mitigation requirement: dedicated display modes should show only presentation data needed for prayer awareness and avoid exposing configuration details by default.

## Data minimisation rules

1. Do not collect a field merely because the platform exposes it.
2. Do not transmit precise coordinates when a coarser or user-selected mosque identifier is sufficient.
3. Do not add telemetry for core use unless a future design has a documented privacy purpose and explicit review.
4. Keep historical location/schedule data only when a user-visible feature requires it.
5. Prefer derived prayer times over retaining extra raw sensor/location history.
6. Remove cached remote-provider state when the user disconnects that provider, subject only to clearly documented local retention needed for offline continuity.

## Logging rules

Structured diagnostics may record component, error category, operation and non-sensitive state needed to troubleshoot behaviour. Ordinary logs must not include:

- precise latitude/longitude;
- saved-location free text;
- provider access tokens or signing secrets;
- imported timetable payloads;
- local audio file contents or paths that expose personal directory names;
- unnecessary notification schedules that reveal a full daily routine.

When a location-related failure needs context, log a coarse reason/category rather than coordinates.

## Remote integration review checklist

Before enabling a new remote integration, verify:

- [ ] the feature cannot reasonably be fulfilled locally;
- [ ] the provider interface is documented or explicitly authorized;
- [ ] transmitted fields are listed and minimized;
- [ ] authentication material is stored outside repository/user exports;
- [ ] transport security requirements are defined;
- [ ] response data is validated before activation;
- [ ] offline/stale behaviour is defined;
- [ ] disconnect and local-data deletion behaviour is defined;
- [ ] failure does not silently change prayer-source provenance;
- [ ] user-facing copy identifies the remote dependency where relevant.

## Non-goals and current limits

This document does not claim that every native platform permission, browser policy, remote provider, Content Security Policy or dependency has already been fully implemented or audited. Those remain separate tracker items and require their own implementation evidence.

The threat model is a living design constraint. New network features, accounts, analytics, cloud notification services or synchronization features require an explicit update to this model before release.
