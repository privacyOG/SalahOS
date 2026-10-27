# Home Prayer Hub display

**Developer:** PrivacyOG

Home Prayer Hub is a seventh SalahOS prayer-board presentation intended for home tablets, landscape kiosks, Raspberry Pi touchscreens and browser displays. It targets the 1280 × 800 (16:10) layout used by popular Islamic home prayer hubs, while retaining independent SalahOS branding.

## Opening and selecting it

- Open `?mode=smart-display&template=home-hub` on a running SalahOS deployment.
- Alternatively select **Home Prayer Hub** in prayer-board display design settings and review the full-screen preview.
- The regular mobile prayer-theme picker also offers **Home Prayer Hub**; mobile retains the standard Today screen structure with a distinct colour treatment.

## Information shown

- Large current clock, local Gregorian/Hijri date, next prayer, live countdown, prayer start and available congregation/Iqamah times.
- Five obligatory prayers in an across-the-screen timetable for landscape home displays. Sunrise and sunset appear separately.
- Optional Jumu'ah sessions, weather and announcements when configured in the existing display system.
- Existing offline, calculation-source and timezone presentation without a new provider dependency.

The Iqamah column belongs to the dedicated prayer-board mode; the regular mobile Today screen continues to omit Iqamah in line with the previous product decision. Missing prayer values stay unavailable rather than being fabricated.

## Acceptance matrix

| Surface | Viewport | Required acceptance |
| --- | --- | --- |
| Home touch display | 1280 × 800 | Large readable clock, hero countdown, five unobstructed prayer cards |
| Landscape TV | 1920 × 1080 | Balanced scale, no clipped prayer or Iqamah values |
| Phone and tablet | 390 × 844; 768 × 1024 | Readable stacked schedule without horizontal overflow |
| Arabic | All above | RTL ordering, correct translations and logical highlighting |
| Offline/timezone | Relevant platforms | Correct local times and source indication after clock/resume changes |
| Accessibility | All above | Focus visibility, contrast, reduced motion and forced-colour robustness |

Technical CI/visual and physical-device acceptance are recorded separately in `TEMP_TODO_HOME_HUB.md`. Do not claim them complete merely from code review.

## Implementation

- Template ID: `home-hub`; existing versioned prayer-board configuration schema retained.
- Shared view: `StructuredSplitBoard` in Home Hub mode.
- Responsive stylesheet: `src/home-hub-board.css`.
- Mobile theme: `src/mobile-prayer-themes.css`.
- Existing prayer-domain code, calculation parameters, notification policy and release/editorial gates remain unchanged.
