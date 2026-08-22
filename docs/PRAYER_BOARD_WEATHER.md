# Optional prayer-board weather

Stage 23.11 adds weather as a presentation-only prayer-board module. Weather is deliberately isolated from prayer calculation, prayer-source selection, Iqamah data, next-prayer state and all notification scheduling.

## Opt-in model

Weather has two independent gates:

1. The selected prayer-board configuration must enable the optional `weather` module.
2. The display administrator must explicitly enable the fixed-location weather feed and enter a valid latitude and longitude.

Both gates must be open before SalahOS makes a weather request. Enabling the visual Weather module by itself does not create network traffic. A new installation has the weather feed disabled and has no weather coordinates configured.

## Location privacy

SalahOS does not read browser geolocation, native GPS or the prayer-calculation location for the weather module. The weather adapter only knows the fixed coordinates deliberately entered in the Optional weather administration panel.

When the feed is enabled, SalahOS sends those configured coordinates to the selected weather provider. As with an ordinary HTTPS request, the remote provider can also receive normal connection/request metadata such as the requesting public IP address. Administrators should therefore configure weather only when that disclosure is acceptable for the display deployment.

Disabling the fixed-location weather feed stops weather requests. Disabling the Weather module also prevents the smart-display runtime from refreshing weather.

## Provider and requested data

The Stage 23.11 provider adapter uses the Open-Meteo forecast endpoint over HTTPS and requests only current:

- temperature at 2 metres; and
- weather condition code.

SalahOS requests Celsius and converts the provider condition code into a small built-in presentation label. The weather provider is an explicitly reviewed remote-network capability in `scripts/check-remote-network-policy.mjs`; other application code cannot add arbitrary remote requests without failing the repository network-policy gate.

## Refresh and cache behaviour

The smart-display runtime refreshes enabled weather on startup and then at a bounded 15-minute interval. A successful response is stored as the last-known-good weather snapshot in `salahos.prayerBoardWeather` together with its cache timestamp.

A cached snapshot is usable for at most two hours. If a provider request fails while the cached snapshot is still within that window, the prayer board continues to show the last-known-good weather. Once the cache expires, weather is hidden entirely until a fresh successful response is available.

SalahOS intentionally does not show a broken weather placeholder, error tile or indefinitely stale value. Provider failure never blocks or replaces local prayer information.

## Native persistence

The weather configuration and last-known-good cache key are included in `PERSISTED_APPLICATION_KEYS`, so platforms using the native application-storage hydration path preserve the optional feed configuration and cache across restarts.

## Display contract

The shared `PrayerBoardData.weather` field remains optional. `PrayerBoardWeatherModule` renders only a `ready` snapshot with a valid temperature. Loading, stale, error and missing states render no weather UI.

The six Stage 23 prayer-board templates continue to consume the same authoritative prayer-board data contract. Weather is an overlay presentation module and does not recalculate or mutate any prayer value.

## Verification

Permanent automated coverage verifies:

- weather is disabled by default and does not invent a location;
- requests use only explicitly configured fixed coordinates;
- successful snapshots are cached;
- provider failure falls back only to a still-fresh last-known-good snapshot;
- expired weather is hidden cleanly;
- a weather-enabled prayer board keeps all five obligatory prayer rows intact; and
- no provider request occurs when weather has not been explicitly configured.
