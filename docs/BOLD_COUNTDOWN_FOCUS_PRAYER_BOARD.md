# Bold Countdown Focus prayer board

Stage 23.4 adds the third SalahOS prayer-board template, `bold-countdown-focus`.

## Presentation contract

The renderer consumes only the shared `PrayerBoardData` presentation contract. Template selection does not recalculate prayer times or change the selected prayer source, configured Iqamah values, notification behaviour, or next-prayer semantics.

The display derives three presentation-only focus states from the resolved board data:

- `next-prayer` keeps the upcoming prayer and countdown dominant.
- `pre-iqamah` switches the dominant countdown to the configured Iqamah after prayer start and before Iqamah.
- `iqamah-now` provides an explicit static Iqamah state when the configured Iqamah minute is reached.

Current and next prayer states use labels, borders, and contrast changes rather than animation, so the state remains understandable on static displays and with reduced motion.

## Display hierarchy

The template prioritises long-distance readability:

- current local time and the active countdown form the dominant hero region;
- all five obligatory prayers remain visible in a secondary Start/Iqamah timetable band;
- mosque identity, Gregorian and Hijri dates, Jumu'ah sessions, sunrise/sunset, source, timezone, and offline state remain subordinate but available;
- the full-height density layer keeps the board composed on both 1920×1080 and 3840×2160 displays.

## Acceptance evidence

Code-bearing head `0de2c0123010cc05a261a4229040bc54416a25ca` passed:

- Quality Gate `32485632660`;
- Android Build `32485632576`;
- Visual Regression `32485632537`;
- iOS Build `32485632581`, including fresh iPhone and iPad Simulator install, launch, and relaunch acceptance.

The permanent visual matrix covers English and Arabic/RTL at 1920×1080 and 3840×2160, deliberately long mosque names, all three focus states, exact five-prayer rendering, minimum countdown sizing, zero horizontal clipping, and a minimum 90% viewport-height composition. Human review confirmed balanced full-height density, clear static state transitions, composed RTL presentation, and an unwrapped 4K prayer label.

Stage 23.5 and later template work remain separate; Stage 23.13 remains responsible for phone-adapted Today/home variants and the visual Settings selector.
