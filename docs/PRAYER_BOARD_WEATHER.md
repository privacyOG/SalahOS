# Optional prayer-board weather

Stage 23.11 adds weather as a presentation-only prayer-board module. Weather is deliberately isolated from prayer calculation, prayer-source selection, Iqamah data, next-prayer state and all notification scheduling.

## Opt-in model

Weather has two independent gates:

1. The target prayer-board surface must enable the optional `weather` module. TV/kiosk uses its prayer-board template configuration; Phone/Home has an explicit `Show weather on Phone / Home` control in Optional weather settings.
2. The display/user must explicitly enable the fixed-location weather feed and enter a valid latitude and longitude.

Both gates must be open before SalahOS makes a weather request. Enabling a visual Weather module by itself does not create network traffic. A new installation has the weather feed disabled, has no weather coordinates configured and does not show weather on Phone/Home.

## Location and network disclosure

SalahOS does not read browser geolocation, native GPS or the prayer-calculation location for the weather module. The weather adapter only knows the fixed coordinates deliberately entered in the Optional weather configuration panel.

When the feed is enabled, SalahOS sends those configured coordinates to the selected weather provider. As with an ordinary HTTPS request, the remote provider can also receive normal connection/request metadata such as the requesting public IP address. Weather should therefore be configured only when that disclosure is acceptable for the deployment.

Disabling the fixed-location weather feed stops weather requests. Disabling Weather on the target prayer-board surface also prevents that surface from refreshing weather.

## Provider and requested data

The Stage 23.11 provider adapter uses the Open-Meteo forecast endpoint over HTTPS and requests only current:

- temperature at 2 metres; and
- weather condition code.

SalahOS requests Celsius and converts the provider condition code into a small built-in presentation label. The weather provider is an explicitly reviewed remote-network capability in `scripts/check-remote-network-policy.mjs`; other application code cannot add arbitrary remote requests without failing the repository network-policy gate.

## Refresh and cache behaviour

An enabled prayer-board surface refreshes weather on startup and then at a bounded 15-minute interval. A successful response is stored as the last-known-good weather snapshot in `salahos.prayerBoardWeather` together with its cache timestamp.

A cached snapshot is usable for at most two hours. If a provider request fails while the cached snapshot is still within that window, the prayer board continues to show the last-known-good weather. Once the cache expires, weather is hidden entirely until a fresh successful response is available.

SalahOS intentionally does not show a broken weather placeholder, error tile or indefinitely stale value. Provider failure never blocks or replaces local prayer information.

## Native persistence

The weather configuration and last-known-good cache key are included in `PERSISTED_APPLICATION_KEYS`, so platforms using the native application-storage hydration path preserve the optional feed configuration and cache across restarts. The Phone/Home module choice remains part of the existing dedicated mobile prayer-board configuration and therefore stays isolated from TV/kiosk template selection.

## Display contract

The shared `PrayerBoardData.weather` field remains optional. Dedicated TV/kiosk rendering passes the isolated weather snapshot through that contract. `PrayerBoardWeatherModule` renders only a `ready` snapshot with a valid temperature; loading, stale, error and missing states render no weather UI.

Phone/Home uses the same `PrayerBoardWeatherSnapshot`, provider boundary and presentation component from the mobile theme surface without changing the accepted Today prayer calculation/presentation model. The weather module is rendered after core Today prayer content so provider availability cannot obstruct the five-prayer timetable or next-prayer hierarchy.

## Verification

Permanent automated coverage verifies:

- weather is disabled by default and does not invent a location;
- requests use only explicitly configured fixed coordinates;
- successful snapshots are cached;
- provider failure falls back only to a still-fresh last-known-good snapshot;
- expired weather is hidden cleanly;
- a weather-enabled TV/kiosk prayer board keeps all five obligatory prayer rows intact;
- Phone/Home weather uses the configured fixed coordinates and leaves all five obligatory prayer rows intact;
- Phone/Home exposes an explicit module opt-in in Settings; and
- no provider request occurs when weather has not been explicitly configured or when the Phone/Home weather module is disabled.