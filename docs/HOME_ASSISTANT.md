# Home Assistant integration

SalahOS includes a read-only Home Assistant custom integration for published mosque prayer data. It consumes the existing versioned SalahOS public API contract and deliberately does not use managed-display administrator credentials, device credentials, personal location data or private mosque administration records.

## What it exposes

One configured mosque creates five timestamp sensors:

- Fajr
- Dhuhr
- Asr
- Maghrib
- Isha

Each sensor reports the timezone-aware published Salah start time. When the daily public response provides a resolved Iqamah value, the sensor also exposes it as an `iqamah` attribute. Publication date, mosque ID, timezone, publication timestamp and revision are retained as provenance attributes where supplied.

The integration uses one sensor platform only. Home Assistant polls the configured SalahOS endpoint every five minutes through a coordinator, which keeps network I/O out of entity properties and avoids unnecessary requests for timetable data that normally changes infrequently.

## Prerequisite

The configured URL must expose the SalahOS `v1` public contract documented in `PUBLIC_API_INTEGRATION.md`:

```text
GET /api/v1/mosques/:mosqueId
GET /api/v1/mosques/:mosqueId/prayers/:date
```

The profile response must include `mosqueId`, `name` and an IANA `timezone`. The daily response must include the configured `mosqueId` plus all five obligatory prayers under `prayers`.

Prayer values may be supplied as:

- local `HH:MM` strings;
- integer local minutes from midnight;
- timezone-aware ISO-8601 timestamps; or
- objects containing `start`, `startTime`, `startLocalMinutes`, `localMinutes` or `time`.

Resolved Iqamah values may be supplied in the top-level `iqamah` map or inside the relevant prayer object. Fixed local-minute and non-negative offset rules are also accepted.

The next roadmap item, the optional SalahOS local-network API, can provide this same contract directly on a trusted LAN. The Home Assistant integration remains transport-agnostic so it also works with a separately hosted SalahOS public endpoint.

## Installation

1. Copy `integrations/home-assistant/custom_components/salahos` from this repository into Home Assistant's `/config/custom_components/salahos` directory.
2. Restart Home Assistant.
3. Open **Settings → Devices & services**.
4. Choose **Add Integration** and select **SalahOS**.
5. Enter the base URL serving the SalahOS public API contract and the stable mosque ID.
6. Home Assistant validates the published mosque profile before creating the integration entry.

For a LAN-only deployment, plain HTTP can be used on a network you control. HTTPS is preferred whenever the endpoint crosses an untrusted network boundary. The base URL parser rejects embedded username/password credentials, query strings and fragments.

## Security boundary

The integration is intentionally read-only:

- only HTTP `GET` operations are implemented;
- no administrator token is accepted or stored;
- no managed-display device token is accepted or stored;
- no membership, role, session, invitation, audit or private contact data is requested;
- the returned mosque ID is checked against the configured ID before data is accepted;
- IANA timezone values and all prayer times are validated before entity state is updated;
- a malformed or cross-mosque response fails the coordinator update rather than silently publishing incorrect prayer data.

Home Assistant owns its normal configuration-entry storage. SalahOS itself does not receive Home Assistant account information or automation state through this integration.

## Validation

The repository test suite executes a Python standard-library contract suite through Vitest. Coverage includes URL and mosque-ID validation, rejection of embedded credentials, profile validation, daily prayer and Iqamah parsing, timezone-aware conversion, cross-mosque rejection and verification that the client issues only the expected public `GET` requests.

The package follows current Home Assistant custom-integration conventions: a manifest with `config_flow`, a UI configuration flow, a polling `DataUpdateCoordinator`, one `sensor` platform and timestamp sensor entities. The implementation has no additional Python package requirements beyond Home Assistant itself.
