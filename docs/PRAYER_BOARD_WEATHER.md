# Local weather

SalahOS weather is presentation-only and remains isolated from prayer calculation, prayer-source selection, Iqamah data, next-prayer state and notification scheduling.

## Location behaviour

When weather is enabled, it uses the shared best-available SalahOS location:

1. current precise OS location when automatic location is enabled;
2. OS/network-assisted approximate location when precision is unavailable;
3. recent cached location;
4. saved location; or
5. optional manual fallback coordinates from Weather settings.

The same resolved location architecture is used by prayer times, Qiblah and nearby-mosque features. Manual weather coordinates are a fallback rather than the normal workflow.

Weather does not request location after a user chooses **Not now** during location onboarding. In that case saved/manual location remains available and the user can enable automatic location later through the normal location flow.

## Provider and requested data

The reviewed provider is Open-Meteo over HTTPS. For an enabled weather surface SalahOS sends the resolved latitude/longitude required for the forecast and requests:

- current temperature and apparent temperature;
- weather condition;
- relative humidity and wind speed;
- daily high/low temperature;
- maximum precipitation probability and UV index; and
- sunrise and sunset.

Normal HTTPS connection metadata is visible to the provider. Weather does not send unrelated application analytics, advertising identifiers, contacts, prayer history or precise-location diagnostic telemetry.

## Refresh and cache behaviour

An enabled surface refreshes on startup and every 15 minutes. Successful data is cached locally with its fetch time and location-quality metadata.

- Up to 45 minutes: cached data is considered fresh.
- From 45 minutes to 12 hours: it remains visible as explicitly labelled cached/stale weather.
- After 12 hours: expired weather is hidden until a usable refresh succeeds.

Location, network, timeout, malformed-response and provider failures are caught inside the weather boundary. They never block prayer calculations or replace local prayer information.

## Display

TV/kiosk layouts retain a compact temperature/condition presentation. Phone/Home progressively exposes feels-like temperature, high/low, rain probability, humidity, wind, UV, sunrise/sunset and freshness. Approximate positioning is identified when the source or reported horizontal accuracy is coarse.

The user can disable weather data and can separately control whether the Phone/Home weather module is visible. Optional manual fallback coordinates remain available for fixed-location deployments.

## Verification

Automated coverage verifies automatic resolved-location use, precise/approximate location metadata, full provider parsing, stale-cache behaviour, expiry, explicit disablement and failure isolation. Visual/native release gates continue to verify responsive rendering and that weather cannot obstruct the core prayer experience.
